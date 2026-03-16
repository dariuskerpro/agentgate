import type { Context } from "hono";
import { callClaude } from "../lib/anthropic.js";

const INPUT_LIMIT = 100_000;
const VALID_TEMPLATES = ["lean", "detailed"] as const;

interface TranscriptToPrdInput {
  transcript: string;
  template?: string;
  product_context?: string;
}

function buildUserMessage(input: TranscriptToPrdInput): string {
  const parts = [`## Meeting Transcript\n\n${input.transcript}`];

  if (input.product_context) {
    parts.push(`\n\n## Product Context\n\n${input.product_context}`);
  }

  parts.push(`\n\n## Template: ${input.template ?? "detailed"}`);

  return parts.join("");
}

const SYSTEM_PROMPT_DETAILED = `You are a senior product manager. Convert the meeting transcript into a detailed Product Requirements Document (PRD). Return a JSON object with this exact structure:

{
  "title": "<Feature/Product Name — Product Requirements>",
  "overview": "<2-3 paragraph overview of what's being built and why>",
  "goals": ["<goal 1>", "<goal 2>"],
  "non_goals": ["<explicitly out of scope item>"],
  "user_stories": [
    {
      "as_a": "<role>",
      "i_want": "<capability>",
      "so_that": "<benefit>",
      "acceptance_criteria": ["<criterion>"],
      "priority": "P0" | "P1" | "P2"
    }
  ],
  "technical_requirements": ["<requirement>"],
  "open_questions": ["<unresolved question from transcript>"],
  "timeline_estimate": "<estimated timeline>"
}

Rules:
- Return ONLY valid JSON, no markdown fences, no extra text.
- Extract real requirements from the conversation, don't invent features not discussed.
- Prioritize: P0 = must have, P1 = should have, P2 = nice to have.
- Include open questions for anything ambiguous or unresolved in the transcript.
- Be specific in acceptance criteria — they should be testable.`;

const SYSTEM_PROMPT_LEAN = `You are a senior product manager. Convert the meeting transcript into a lean Product Requirements Document (PRD). Return a JSON object with this exact structure:

{
  "title": "<Feature/Product Name — Product Requirements>",
  "overview": "<1 paragraph summary>",
  "goals": ["<goal>"],
  "non_goals": ["<out of scope>"],
  "user_stories": [
    {
      "as_a": "<role>",
      "i_want": "<capability>",
      "so_that": "<benefit>",
      "acceptance_criteria": ["<criterion>"],
      "priority": "P0" | "P1" | "P2"
    }
  ],
  "technical_requirements": ["<requirement>"],
  "open_questions": ["<question>"],
  "timeline_estimate": "<estimate>"
}

Rules:
- Return ONLY valid JSON, no markdown fences, no extra text.
- Keep it concise — focus on the essential requirements only.
- Max 5 user stories, focus on P0 items.
- Extract only what was actually discussed.`;

export async function handleTranscriptToPrd(c: Context) {
  let body: TranscriptToPrdInput;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  // Validate transcript
  if (!body.transcript || typeof body.transcript !== "string") {
    return c.json(
      { error: "Missing required field: transcript (string)" },
      400,
    );
  }

  // Validate template
  if (
    body.template &&
    !VALID_TEMPLATES.includes(body.template as (typeof VALID_TEMPLATES)[number])
  ) {
    return c.json(
      { error: `template must be one of: ${VALID_TEMPLATES.join(", ")}` },
      400,
    );
  }

  // Check input size
  if (body.transcript.length > INPUT_LIMIT) {
    return c.json(
      {
        error: `Transcript exceeds ${INPUT_LIMIT} character limit (got ${body.transcript.length})`,
      },
      400,
    );
  }

  try {
    const template = body.template ?? "detailed";
    const systemPrompt =
      template === "lean" ? SYSTEM_PROMPT_LEAN : SYSTEM_PROMPT_DETAILED;
    const userMessage = buildUserMessage(body);

    const rawResponse = await callClaude({
      system: systemPrompt,
      userMessage,
    });

    const result = JSON.parse(rawResponse);
    return c.json(result);
  } catch (err) {
    console.error("Transcript-to-PRD error:", err);
    return c.json(
      { error: "Failed to process transcript-to-PRD conversion" },
      500,
    );
  }
}
