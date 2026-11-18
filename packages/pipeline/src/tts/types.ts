import { readFileSync } from 'node:fs';

/**
 * Text-to-speech behind one interface (brief: TtsProvider). The provider is chosen from config
 * (TTS_PROVIDER); word timestamps always come from whisper.cpp, so providers are interchangeable.
 */
export type TtsProviderName = 'gemini' | 'kokoro' | 'piper';

export interface TtsRequest {
  /** Text to speak, written for the voice (see guidelines/generation.md). */
  text: string;
  /** Output WAV path. */
  out: string;
  /** Voice id of the provider (Gemini: "Puck"; Kokoro: "if_sara"; Piper: "it_IT-paola-medium"). */
  voice: string;
  /** Delivery direction in words (Gemini only): tone, pace, attitude. Never age or gender. */
  style?: string;
  /** Speed factor for local engines, 1 = default. */
  speed?: number;
}

export interface TtsResult {
  file: string;
  provider: TtsProviderName;
  model: string;
  voice: string;
  sampleRate: number;
  durationMs: number;
}

export interface TtsProvider {
  name: TtsProviderName;
  model: string;
  synthesize(req: TtsRequest): Promise<TtsResult>;
}

/**
 * The provider refused because of its free limits (HTTP 429). The post stays in the queue and
 * is retried later: never fall back to another voice silently, the quality changes.
 */
export class TtsQuotaError extends Error {
  constructor(provider: TtsProviderName, detail: string) {
    super(`${provider}: free quota exhausted, retry later (${detail})`);
    this.name = 'TtsQuotaError';
  }
}

/** Sample rate and duration of a PCM WAV file, read from its RIFF chunks. */
export function wavInfo(file: string): { sampleRate: number; durationMs: number } {
  const buf = readFileSync(file);
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error(`Not a WAV file: ${file}`);
  }
  let offset = 12;
  let sampleRate = 0;
  let bytesPerSecond = 0;
  while (offset + 8 <= buf.length) {
    const id = buf.toString('ascii', offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === 'fmt ') {
      sampleRate = buf.readUInt32LE(offset + 12);
      bytesPerSecond = buf.readUInt32LE(offset + 16);
    } else if (id === 'data') {
      // Streams sometimes leave the size at 0 or 0xFFFFFFFF: use what is actually there.
      const bytes = size > 0 && offset + 8 + size <= buf.length ? size : buf.length - offset - 8;
      return { sampleRate, durationMs: Math.round((bytes / bytesPerSecond) * 1000) };
    }
    offset += 8 + size + (size % 2);
  }
  throw new Error(`No data chunk in ${file}`);
}
