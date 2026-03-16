import type { Context } from "hono";
import { transcribeAudio } from "../lib/openai.js";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const VALID_AUDIO_EXTENSIONS = new Set([
  "mp3",
  "wav",
  "m4a",
  "mp4",
  "webm",
  "ogg",
]);

const VALID_AUDIO_CONTENT_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/webm",
  "audio/ogg",
  "video/mp4",
  "video/webm",
]);

const VALID_RESPONSE_FORMATS = new Set(["json", "verbose_json"]);

// Minimal ISO 639-1 validation: exactly 2 lowercase letters
function isValidIso639(code: string): boolean {
  return /^[a-z]{2}$/.test(code);
}

function getExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

function isValidAudioFile(file: File): boolean {
  // Check by content type first
  if (file.type && VALID_AUDIO_CONTENT_TYPES.has(file.type)) {
    return true;
  }
  // Fall back to extension
  const ext = getExtension(file.name);
  return VALID_AUDIO_EXTENSIONS.has(ext);
}

export async function handleTranscribe(c: Context) {
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
        error: `File exceeds 25MB limit (got ${(file.size / 1024 / 1024).toFixed(1)}MB)`,
      },
      400,
    );
  }

  // Validate audio format
  if (!isValidAudioFile(file)) {
    return c.json(
      {
        error:
          "Invalid audio format. Supported: mp3, wav, m4a, mp4, webm, ogg",
      },
      400,
    );
  }

  // Validate optional language
  const language = body.language as string | undefined;
  if (language && !isValidIso639(language)) {
    return c.json(
      { error: "Invalid language code. Must be ISO 639-1 (e.g., 'en', 'es')" },
      400,
    );
  }

  // Validate optional response_format
  const responseFormat = body.response_format as string | undefined;
  if (responseFormat && !VALID_RESPONSE_FORMATS.has(responseFormat)) {
    return c.json(
      { error: "response_format must be 'json' or 'verbose_json'" },
      400,
    );
  }

  try {
    const result = await transcribeAudio({
      file,
      language,
      response_format:
        (responseFormat as "json" | "verbose_json") ?? "verbose_json",
    });

    return c.json({
      transcript: result.text,
      segments: result.segments ?? [],
      language: result.language,
      duration: result.duration,
    });
  } catch (err) {
    console.error("Transcribe error:", err);
    return c.json({ error: "Failed to transcribe audio" }, 500);
  }
}
