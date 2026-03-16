import type { Context } from "hono";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function isPdfFile(file: File): boolean {
  if (file.type === "application/pdf") return true;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext === "pdf";
}

const SYSTEM_INSTRUCTION = `You are a document extraction assistant. Extract the following from the provided PDF:

1. **text**: The full text content of the document.
2. **pages**: An array of objects, each with page_number (1-indexed) and text for that page.
3. **tables**: An array of tables found, each with "headers" (string[]) and "rows" (string[][]).
4. **key_value_pairs**: A flat object of key-value pairs found (e.g., form fields, labels and values).

Return ONLY valid JSON with this structure:
{
  "text": "<full text>",
  "pages": [{"page_number": 1, "text": "<page text>"}],
  "tables": [{"headers": [...], "rows": [[...]]}],
  "key_value_pairs": {"key": "value"}
}

Do NOT wrap in markdown fences. Return raw JSON only.`;

function buildPrompt(schema?: string): string {
  if (!schema) {
    return "Extract all text, tables, and key-value pairs from this PDF document.";
  }
  return `Extract content from this PDF document and structure the output according to this schema:\n\n${schema}\n\nAlso include the standard fields: text, pages. Return raw JSON only.`;
}

export async function handlePdfExtract(c: Context) {
  let body: Record<string, string | File>;
  try {
    body = await c.req.parseBody();
  } catch {
    return c.json({ error: "Invalid multipart request" }, 400);
  }

  // Validate file
  const file = body.file;
  if (!file || !(file instanceof File)) {
    return c.json({ error: "Missing required field: file" }, 400);
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return c.json(
      {
        error: `File exceeds 10MB limit (got ${(file.size / 1024 / 1024).toFixed(1)}MB)`,
      },
      400,
    );
  }

  // Validate PDF format
  if (!isPdfFile(file)) {
    return c.json(
      { error: "Invalid file format. Only PDF files are accepted" },
      400,
    );
  }

  // Validate optional schema
  const schemaStr = body.schema as string | undefined;
  if (schemaStr) {
    try {
      JSON.parse(schemaStr);
    } catch {
      return c.json({ error: "Invalid schema: must be a valid JSON string" }, 400);
    }
  }

  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_AI_API_KEY not configured");
    }

    // Read file as base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const prompt = buildPrompt(schemaStr);

    const geminiPayload = {
      system_instruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }],
      },
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: "application/pdf",
                data: base64Data,
              },
            },
            { text: prompt },
          ],
        },
      ],
    };

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Gemini API error:", response.status, errorBody);
      throw new Error(`Gemini API returned ${response.status}`);
    }

    const geminiResult = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const rawText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("No content in Gemini response");
    }

    // Parse the JSON response from Gemini
    // Strip markdown fences if present
    const cleanText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const extracted = JSON.parse(cleanText);

    // Build response with metadata
    const result = {
      ...extracted,
      metadata: {
        page_count: extracted.pages?.length ?? 0,
        file_size: file.size,
        extracted_at: new Date().toISOString(),
      },
    };

    return c.json(result);
  } catch (err) {
    console.error("PDF extract error:", err);
    return c.json({ error: "Failed to extract PDF content" }, 500);
  }
}
