import type { Context } from "hono";
import { promises as dns } from "node:dns";

// Simplified RFC 5322 email regex
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.de",
  "grr.la",
  "guerrillamailblock.com",
  "tempmail.com",
  "temp-mail.org",
  "throwaway.email",
  "throwaway.com",
  "yopmail.com",
  "yopmail.fr",
  "sharklasers.com",
  "guerrillamail.info",
  "guerrillamail.net",
  "trashmail.com",
  "trashmail.me",
  "trashmail.net",
  "dispostable.com",
  "maildrop.cc",
  "mailnesia.com",
  "mailcatch.com",
  "tempail.com",
  "tempr.email",
  "discard.email",
  "fakeinbox.com",
  "mailforspam.com",
  "safetymail.info",
  "instant-mail.de",
  "harakirimail.com",
  "bugmenot.com",
  "getnada.com",
  "mohmal.com",
  "burnermail.io",
  "10minutemail.com",
  "10minutemail.net",
  "minutemail.com",
  "emailondeck.com",
  "crazymailing.com",
  "mytemp.email",
  "tempmailaddress.com",
  "emailfake.com",
  "tmpmail.net",
  "tmpmail.org",
  "moakt.com",
  "getairmail.com",
  "filzmail.com",
  "inboxalias.com",
  "mailexpire.com",
  "mailnull.com",
  "spamgourmet.com",
  "spam4.me",
  "tmail.ws",
  "guerrillamail.biz",
]);

const ROLE_PREFIXES = new Set([
  "info",
  "admin",
  "support",
  "noreply",
  "no-reply",
  "postmaster",
  "webmaster",
  "hostmaster",
  "abuse",
  "sales",
  "help",
  "contact",
  "office",
  "billing",
  "security",
  "compliance",
  "legal",
  "hr",
  "marketing",
  "press",
  "media",
  "team",
  "hello",
  "feedback",
  "jobs",
  "careers",
  "recruitment",
  "mailer-daemon",
]);

// Common domain typos → suggested correction
const DOMAIN_SUGGESTIONS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmali.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.om": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cmo": "gmail.com",
  "gnail.com": "gmail.com",
  "hmail.com": "gmail.com",
  "gmaik.com": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yaho.co": "yahoo.com",
  "yahoo.co": "yahoo.com",
  "yahoo.cm": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "yaoo.com": "yahoo.com",
  "hotmal.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "hotmaill.com": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "hotmail.cm": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "htmail.com": "hotmail.com",
  "hotamil.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outllook.com": "outlook.com",
  "outlook.co": "outlook.com",
  "outlook.cm": "outlook.com",
  "outlook.con": "outlook.com",
  "iclod.com": "icloud.com",
  "icloud.co": "icloud.com",
  "icoud.com": "icloud.com",
  "icloud.cm": "icloud.com",
  "icloud.con": "icloud.com",
  "protonmal.com": "protonmail.com",
  "protonmai.com": "protonmail.com",
  "protonmail.co": "protonmail.com",
  "protonmail.cm": "protonmail.com",
  "aol.co": "aol.com",
  "aol.cm": "aol.com",
  "aol.con": "aol.com",
};

async function resolveMx(
  domain: string,
  timeoutMs = 5000
): Promise<string[] | null> {
  try {
    const result = await Promise.race([
      dns.resolveMx(domain),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("DNS timeout")), timeoutMs)
      ),
    ]);
    // Sort by priority (lowest first) and return exchanges
    return result
      .sort((a, b) => a.priority - b.priority)
      .map((r) => r.exchange);
  } catch {
    return null;
  }
}

export async function handleEmailValidate(c: Context) {
  let body: { email?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const email = body.email;
  if (!email || typeof email !== "string") {
    return c.json({ error: "Missing or invalid 'email' field" }, 400);
  }

  const trimmed = email.trim().toLowerCase();
  const validFormat = EMAIL_REGEX.test(trimmed);

  if (!validFormat) {
    return c.json(
      {
        email: trimmed,
        valid_format: false,
        domain: null,
        mx_records: [],
        has_mx: false,
        is_disposable: false,
        is_role_account: false,
        suggestion: null,
      },
      400
    );
  }

  const [local, domain] = trimmed.split("@");

  const mxRecords = await resolveMx(domain);
  const hasMx = mxRecords !== null && mxRecords.length > 0;
  const isDisposable = DISPOSABLE_DOMAINS.has(domain);
  const isRoleAccount = ROLE_PREFIXES.has(local);
  const suggestion = DOMAIN_SUGGESTIONS[domain] ?? null;

  return c.json({
    email: trimmed,
    valid_format: true,
    domain,
    mx_records: mxRecords ?? [],
    has_mx: hasMx,
    is_disposable: isDisposable,
    is_role_account: isRoleAccount,
    suggestion: suggestion ? `${local}@${suggestion}` : null,
  });
}
