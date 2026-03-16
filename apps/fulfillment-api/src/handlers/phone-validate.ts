import type { Context } from "hono";

// Top 20 countries: calling code → country code(s)
const COUNTRY_CALLING_CODES: Record<string, string[]> = {
  "358": ["FI"],
  "86": ["CN"],
  "82": ["KR"],
  "81": ["JP"],
  "61": ["AU"],
  "55": ["BR"],
  "52": ["MX"],
  "49": ["DE"],
  "48": ["PL"],
  "47": ["NO"],
  "46": ["SE"],
  "45": ["DK"],
  "44": ["GB"],
  "39": ["IT"],
  "34": ["ES"],
  "33": ["FR"],
  "31": ["NL"],
  "91": ["IN"],
  "1": ["US", "CA"],
};

// Reverse: country code → calling code
const COUNTRY_TO_CALLING: Record<string, string> = {
  US: "1",
  CA: "1",
  GB: "44",
  DE: "49",
  FR: "33",
  AU: "61",
  JP: "81",
  IN: "91",
  BR: "55",
  MX: "52",
  IT: "39",
  ES: "34",
  NL: "31",
  SE: "46",
  NO: "47",
  DK: "45",
  FI: "358",
  PL: "48",
  KR: "82",
  CN: "86",
};

// Sorted calling codes longest-first for greedy matching
const SORTED_CODES = Object.keys(COUNTRY_CALLING_CODES).sort(
  (a, b) => b.length - a.length
);

const TOLL_FREE_PREFIXES = ["800", "888", "877", "866", "855", "844", "833"];

function detectCountry(
  digits: string,
  hintCountry?: string
): { callingCode: string; countryCode: string; nationalNumber: string } | null {
  for (const code of SORTED_CODES) {
    if (digits.startsWith(code)) {
      const countries = COUNTRY_CALLING_CODES[code];
      let countryCode = countries[0];

      // For ambiguous codes (e.g. 1 → US/CA), use hint if provided
      if (
        countries.length > 1 &&
        hintCountry &&
        countries.includes(hintCountry.toUpperCase())
      ) {
        countryCode = hintCountry.toUpperCase();
      }

      return {
        callingCode: code,
        countryCode,
        nationalNumber: digits.slice(code.length),
      };
    }
  }
  return null;
}

function formatNational(
  callingCode: string,
  countryCode: string,
  nationalNumber: string
): string {
  // US/CA: (XXX) XXX-XXXX for 10-digit numbers
  if ((countryCode === "US" || countryCode === "CA") && nationalNumber.length === 10) {
    const area = nationalNumber.slice(0, 3);
    const exchange = nationalNumber.slice(3, 6);
    const subscriber = nationalNumber.slice(6);
    return `(${area}) ${exchange}-${subscriber}`;
  }
  // Everyone else: +{code} {rest}
  return `+${callingCode} ${nationalNumber}`;
}

export async function handlePhoneValidate(c: Context) {
  let body: { phone?: string; country_code?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { phone, country_code } = body;

  if (!phone || typeof phone !== "string") {
    return c.json({ error: "Missing required field: phone" }, 400);
  }

  // 1. Preserve leading +, strip everything else that isn't a digit
  const hasPlus = phone.trimStart().startsWith("+");
  const digitsOnly = phone.replace(/\D/g, "");

  let fullDigits: string;

  if (hasPlus) {
    // Already in international format
    fullDigits = digitsOnly;
  } else if (country_code && COUNTRY_TO_CALLING[country_code.toUpperCase()]) {
    // Prepend calling code
    const callingCode = COUNTRY_TO_CALLING[country_code.toUpperCase()];
    // Avoid double-prepending if digits already start with the calling code
    if (digitsOnly.startsWith(callingCode) && digitsOnly.length > 8) {
      fullDigits = digitsOnly;
    } else {
      fullDigits = callingCode + digitsOnly;
    }
  } else {
    // No + and no valid country hint — try as-is
    fullDigits = digitsOnly;
  }

  // 3. Validate: 7-15 digits per E.164
  if (fullDigits.length < 7 || fullDigits.length > 15) {
    return c.json(
      {
        phone,
        valid: false,
        error: `Invalid phone number length: ${fullDigits.length} digits (must be 7-15)`,
      },
      400
    );
  }

  // 4. Detect country
  const detected = detectCountry(fullDigits, country_code);

  if (!detected) {
    // Can't identify country but digits are valid length — return basic info
    return c.json({
      phone,
      valid: true,
      e164: `+${fullDigits}`,
      country_code: country_code?.toUpperCase() || null,
      country_calling_code: null,
      national_format: `+${fullDigits}`,
      type: "fixed_line_or_mobile",
      is_toll_free: false,
    });
  }

  const { callingCode, countryCode, nationalNumber } = detected;
  const e164 = `+${fullDigits}`;
  const nationalFormat = formatNational(callingCode, countryCode, nationalNumber);

  // 5. Toll-free detection for US/CA
  const isTollFree =
    (countryCode === "US" || countryCode === "CA") &&
    nationalNumber.length === 10 &&
    TOLL_FREE_PREFIXES.includes(nationalNumber.slice(0, 3));

  return c.json({
    phone,
    valid: true,
    e164,
    country_code: countryCode,
    country_calling_code: callingCode,
    national_format: nationalFormat,
    type: "fixed_line_or_mobile",
    is_toll_free: isTollFree,
  });
}
