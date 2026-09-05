import { describe, expect, it, vi } from "vitest";
import { routeDocumentIngestion } from "../lib/documentIngestionRouter";
import { createMediaTranscriptionAdapters, createMediaTranscriptionAdaptersFromEnvironment, createWhisperCompatibleProvider } from "../lib/mediaTranscriptionProvider";

const fixedTimes = () => {
  let tick = 0;
  return () => `2026-09-04T02:00:0${tick++}.000Z`;
};
const input = (filename = "interview.mp3") => ({
  projectId: "project-1", artifactId: "artifact-1", filename,
  mimeType: filename.endsWith(".mp4") ? "video/mp4" : "audio/mpeg",
  content: new Uint8Array([1, 2, 3, 4]), createdByUid: "researcher-1",
});
const response = () => ({
  provider: { id: "whisper-self-hosted", version: "3.1.0" }, transcriptVersion: "transcript-v1",
  language: "en", languageConfidence: 0.97, warnings: [],
  segments: [
    { id: "segment-1", startSeconds: 0, endSeconds: 2.5, text: "Observed speech.", confidence: 0.91, speaker: "Speaker 1", language: "en" },
    { id: "segment-2", startSeconds: 2.5, endSeconds: 5, text: "Second observed segment." },
  ],
});

describe("Whisper-compatible media transcription provider", () => {
  it("returns Not Configured without a service and creates no transcript", async () => {
    const provider = createWhisperCompatibleProvider();
    expect(provider.configured).toBe(false);
    const job = await routeDocumentIngestion(input(), createMediaTranscriptionAdaptersFromEnvironment(undefined, {}), fixedTimes());
    expect(job.status).toBe("Requires Review");
    expect(job.warnings.join(" ")).toContain("TRANSCRIPTION_SERVICE_URL Not Configured");
    expect(job.transcript).toBeUndefined();
    expect(job.extractedBlocks).toEqual([]);
  });

  it("does not send bytes when privacy routing is not configured", async () => {
    const fetchImpl = vi.fn();
    const job = await routeDocumentIngestion(input(), createMediaTranscriptionAdapters({ serviceUrl: "https://transcribe.internal", fetchImpl: fetchImpl as typeof fetch }), fixedTimes());
    expect(job.status).toBe("Requires Review");
    expect(job.warnings.join(" ")).toContain("privacy routing Not Configured");
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(job.transcript).toBeUndefined();
  });

  it("honors a blocked privacy route without calling the provider", async () => {
    const fetchImpl = vi.fn();
    const job = await routeDocumentIngestion(input(), createMediaTranscriptionAdapters({
      serviceUrl: "https://transcribe.internal", fetchImpl: fetchImpl as typeof fetch,
      privacyRouter: () => ({ allowed: false, route: "Blocked", reason: "Project policy prohibits external processing." }),
    }), fixedTimes());
    expect(job.status).toBe("Requires Review");
    expect(job.warnings[0]).toContain("Project policy prohibits external processing");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([["interview.mp3", "Audio"], ["recording.mp4", "Video"]])("preserves mocked %s timestamps, language, confidence and speakers", async (filename, mediaType) => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(JSON.parse(String(init?.body))).toMatchObject({ projectId: "project-1", artifactId: "artifact-1", filename, mediaType, privacyRoute: "Self Hosted", contentBase64: "AQIDBA==" });
      return new Response(JSON.stringify(response()), { status: 200 });
    }) as typeof fetch;
    const job = await routeDocumentIngestion(input(filename), createMediaTranscriptionAdapters({
      serviceUrl: "http://whisper:8080/", fetchImpl,
      privacyRouter: (context) => { expect(context).toMatchObject({ filename, category: mediaType, sizeBytes: 4 }); return { allowed: true, route: "Self Hosted", reason: "Project-approved private service." }; },
    }), fixedTimes());
    expect(job.status).toBe("Requires Review");
    expect(job.transcript).toMatchObject({
      transcriptVersion: "transcript-v1", transcriptHash: expect.stringMatching(/^[a-f0-9]{64}$/), hashAlgorithm: "SHA-256",
      language: "en", languageConfidence: 0.97, reviewState: "Needs Review", providerId: "whisper-self-hosted",
      providerVersion: "3.1.0", privacyRoute: "Self Hosted", generatedAt: expect.any(String),
    });
    expect(job.transcript?.segments[0]).toMatchObject({ startSeconds: 0, endSeconds: 2.5, confidence: 0.91, speaker: "Speaker 1", language: "en" });
    expect(job.extractedBlocks[0]).toMatchObject({ sourceLocation: "time:0-2.5", startSeconds: 0, endSeconds: 2.5, confidence: 0.91, speaker: "Speaker 1" });
    expect(job.warnings.at(-1)).toContain("requires researcher review");
  });

  it("fails closed on a provider HTTP failure", async () => {
    const fetchImpl = vi.fn(async () => new Response("unavailable", { status: 503 })) as typeof fetch;
    const job = await routeDocumentIngestion(input(), createMediaTranscriptionAdapters({ serviceUrl: "https://transcribe.internal", fetchImpl, privacyRouter: () => ({ allowed: true, route: "Approved External", reason: "Approved for this project." }) }), fixedTimes());
    expect(job.status).toBe("Failed");
    expect(job.errors).toEqual(["Transcription service returned HTTP 503."]);
    expect(job.transcript).toBeUndefined();
  });

  it("fails closed on invalid timestamps instead of inventing transcript timing", async () => {
    const invalid = response();
    invalid.segments[0].endSeconds = -1;
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(invalid), { status: 200 })) as typeof fetch;
    const job = await routeDocumentIngestion(input(), createMediaTranscriptionAdapters({ serviceUrl: "https://transcribe.internal", fetchImpl, privacyRouter: () => ({ allowed: true, route: "Self Hosted", reason: "Private route." }) }), fixedTimes());
    expect(job.status).toBe("Failed");
    expect(job.errors[0]).toContain("invalid segment 1 end");
    expect(job.extractedBlocks).toEqual([]);
  });
});
