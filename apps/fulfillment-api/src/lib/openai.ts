export interface WhisperRequest {
  file: File | Blob;
  language?: string;
  response_format?: "json" | "verbose_json";
}

export interface WhisperResponse {
  text: string;
  language: string;
  duration: number;
  segments?: Array<{ start: number; end: number; text: string }>;
}

export async function transcribeAudio(
  req: WhisperRequest,
): Promise<WhisperResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  const format = req.response_format ?? "verbose_json";

  const formData = new FormData();
  formData.append("file", req.file);
  formData.append("model", "whisper-1");
  formData.append("response_format", format);
  if (req.language) {
    formData.append("language", req.language);
  }

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "Unknown error");
    throw new Error(
      `Whisper API error (${res.status}): ${errorBody}`,
    );
  }

  const data = (await res.json()) as {
    text: string;
    language?: string;
    duration?: number;
    segments?: Array<{ start: number; end: number; text: string }>;
  };

  return {
    text: data.text,
    language: data.language ?? "unknown",
    duration: data.duration ?? 0,
    segments: data.segments?.map((s) => ({
      start: s.start,
      end: s.end,
      text: s.text,
    })),
  };
}
