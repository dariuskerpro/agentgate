import type { Context } from "hono";
import { callClaude } from "../lib/anthropic.js";

const INPUT_LIMIT = 100_000;
const VALID_FOCUS = ["security", "performance", "architecture", "all"] as const;

interface CodeFile {
  filename: string;
  content: string;
}

interface CodeReviewInput {
  code: string | CodeFile[];
  language?: string;
  focus?: string;
}

function buildUserMessage(input: CodeReviewInput): string {
  let codeText: string;

  if (typeof input.code === "string") {
    codeText = input.code;
  } else {
    codeText = input.code
      .map((f) => `### File: ${f.filename}\n\`\`\`\n${f.content}\n\`\`\``)
      .join("\n\n");
  }

  const parts = [`## Code to Review\n\n${codeText}`];

  if (input.language) {
    parts.push(`\n\n## Language: ${input.language}`);
  }

  parts.push(`\n\n## Focus: ${input.focus ?? "all"}`);

  return parts.join("");
}

const SYSTEM_PROMPT = `You are an expert code reviewer. Analyze the provided code and return a JSON object with this exact structure:

{
  "score": <number 0-10, one decimal>,
  "summary": "<brief overall assessment>",
  "findings": [
    {
      "severity": "high" | "medium" | "low",
      "category": "security" | "performance" | "architecture" | "style" | "bug" | "maintainability",
      "file": "<filename or 'input'>",
      "line": <line number or null>,
      "title": "<short title>",
      "description": "<detailed explanation>",
      "suggestion": "<how to fix>"
    }
  ],
  "stats": {
    "total_findings": <number>,
    "high": <number>,
    "medium": <number>,
    "low": <number>
  }
}

Rules:
- Return ONLY valid JSON, no markdown fences, no extra text.
- Be thorough but practical. Focus on real issues, not nitpicks.
- If a focus area is specified, prioritize those findings but still report critical issues in other areas.
- Score 10 = flawless, 0 = critically broken.
- stats must accurately count the findings array.`;

export async function handleCodeReview(c: Context) {
  let body: CodeReviewInput;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  // Validate code field
  if (!body.code) {
    return c.json({ error: "Missing required field: code" }, 400);
  }

  if (typeof body.code !== "string" && !Array.isArray(body.code)) {
    return c.json(
      { error: "code must be a string or array of {filename, content}" },
      400,
    );
  }

  if (Array.isArray(body.code)) {
    for (const item of body.code) {
      if (
        typeof item !== "object" ||
        !item ||
        typeof item.filename !== "string" ||
        typeof item.content !== "string"
      ) {
        return c.json(
          {
            error:
              "Each code array item must have filename (string) and content (string)",
          },
          400,
        );
      }
    }
  }

  // Validate focus
  if (
    body.focus &&
    !VALID_FOCUS.includes(body.focus as (typeof VALID_FOCUS)[number])
  ) {
    return c.json(
      { error: `focus must be one of: ${VALID_FOCUS.join(", ")}` },
      400,
    );
  }

  // Check input size
  const totalChars =
    typeof body.code === "string"
      ? body.code.length
      : body.code.reduce((sum, f) => sum + f.filename.length + f.content.length, 0);

  if (totalChars > INPUT_LIMIT) {
    return c.json(
      {
        error: `Input exceeds ${INPUT_LIMIT} character limit (got ${totalChars})`,
      },
      400,
    );
  }

  try {
    const userMessage = buildUserMessage(body);
    const rawResponse = await callClaude({
      system: SYSTEM_PROMPT,
      userMessage,
    });

    const result = JSON.parse(rawResponse);
    return c.json(result);
  } catch (err) {
    console.error("Code review error:", err);
    return c.json({ error: "Failed to process code review" }, 500);
  }
}
