import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "../index.js";

const mockTranscribeAudio = vi.fn();

vi.mock("../lib/openai.js", () => ({
  transcribeAudio: (...args: unknown[]) => mockTranscribeAudio(...args),
}));

process.env.OPENAI_API_KEY = "test-key";

const MOCK_WHISPER_RESPONSE = {
  text: "Hello, this is a test transcription.",
  language: "en",
  duration: 12.5,
  segments: [
    { start: 0.0, end: 5.2, text: "Hello, this is" },
    { start: 5.2, end: 12.5, text: "a test transcription." },
  ],
};

function createAudioFile(
  name = "test.mp3",
  type = "audio/mpeg",
  sizeBytes = 1024,
): File {
  const buffer = new Uint8Array(sizeBytes);
  return new File([buffer], name, { type });
}

function buildFormData(
  file?: File,
  opts?: { language?: string; response_format?: string },
): FormData {
  const form = new FormData();
  if (file) {
    form.append("file", file);
  }
  if (opts?.language) {
    form.append("language", opts.language);
  }
  if (opts?.response_format) {
    form.append("response_format", opts.response_format);
  }
  return form;
}

// We need to wire up the route for testing since the handler isn't in index.ts yet
import { handleTranscribe } from "../handlers/transcribe.js";
app.post("/v1/transcribe", handleTranscribe);

describe("POST /v1/transcribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns transcript, segments, language, duration on success", async () => {
    mockTranscribeAudio.mockResolvedValue(MOCK_WHISPER_RESPONSE);

    const file = createAudioFile("recording.mp3", "audio/mpeg");
    const form = buildFormData(file);

    const res = await app.request("/v1/transcribe", {
      method: "POST",
      body: form,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.transcript).toBe("Hello, this is a test transcription.");
    expect(json.segments).toHaveLength(2);
    expect(json.segments[0]).toEqual({
      start: 0.0,
      end: 5.2,
      text: "Hello, this is",
    });
    expect(json.language).toBe("en");
    expect(json.duration).toBe(12.5);
    expect(mockTranscribeAudio).toHaveBeenCalledOnce();
  });

  it("rejects missing file", async () => {
    const form = new FormData();

    const res = await app.request("/v1/transcribe", {
      method: "POST",
      body: form,
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("file");
  });

  it("rejects oversized file (>25MB)", async () => {
    const bigFile = createAudioFile(
      "huge.mp3",
      "audio/mpeg",
      26 * 1024 * 1024,
    );
    const form = buildFormData(bigFile);

    const res = await app.request("/v1/transcribe", {
      method: "POST",
      body: form,
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("25MB");
  });

  it("rejects invalid audio format", async () => {
    const txtFile = new File([new Uint8Array(100)], "notes.txt", {
      type: "text/plain",
    });
    const form = buildFormData(txtFile);

    const res = await app.request("/v1/transcribe", {
      method: "POST",
      body: form,
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("audio format");
  });

  it("handles Whisper API errors gracefully", async () => {
    mockTranscribeAudio.mockRejectedValue(
      new Error("Whisper API error (500): Internal Server Error"),
    );

    const file = createAudioFile("recording.mp3", "audio/mpeg");
    const form = buildFormData(file);

    const res = await app.request("/v1/transcribe", {
      method: "POST",
      body: form,
    });

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to transcribe audio");
  });

  it("accepts optional language parameter", async () => {
    mockTranscribeAudio.mockResolvedValue({
      ...MOCK_WHISPER_RESPONSE,
      language: "es",
    });

    const file = createAudioFile("spanish.mp3", "audio/mpeg");
    const form = buildFormData(file, { language: "es" });

    const res = await app.request("/v1/transcribe", {
      method: "POST",
      body: form,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.language).toBe("es");
    expect(mockTranscribeAudio).toHaveBeenCalledWith(
      expect.objectContaining({ language: "es" }),
    );
  });

  it("rejects invalid language code", async () => {
    const file = createAudioFile("recording.mp3", "audio/mpeg");
    const form = buildFormData(file, { language: "invalid" });

    const res = await app.request("/v1/transcribe", {
      method: "POST",
      body: form,
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("language");
  });

  it("rejects invalid response_format", async () => {
    const file = createAudioFile("recording.mp3", "audio/mpeg");
    const form = buildFormData(file, { response_format: "xml" });

    const res = await app.request("/v1/transcribe", {
      method: "POST",
      body: form,
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("response_format");
  });

  it("accepts wav format", async () => {
    mockTranscribeAudio.mockResolvedValue(MOCK_WHISPER_RESPONSE);

    const file = createAudioFile("audio.wav", "audio/wav");
    const form = buildFormData(file);

    const res = await app.request("/v1/transcribe", {
      method: "POST",
      body: form,
    });

    expect(res.status).toBe(200);
  });

  it("accepts webm format", async () => {
    mockTranscribeAudio.mockResolvedValue(MOCK_WHISPER_RESPONSE);

    const file = createAudioFile("audio.webm", "audio/webm");
    const form = buildFormData(file);

    const res = await app.request("/v1/transcribe", {
      method: "POST",
      body: form,
    });

    expect(res.status).toBe(200);
  });
});
