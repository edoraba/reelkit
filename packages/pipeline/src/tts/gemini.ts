import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { TtsQuotaError, wavInfo, type TtsProvider, type TtsRequest, type TtsResult } from './types';

/**
 * Gemini TTS through the Interactions API (docs checked 2026-11-18,
 * https://aistudio.google.com/docs/speech-generation). Free tier key without billing: over the
 * limit the API answers 429 and nothing can be charged. The language is detected from the text.
 * Unary responses carry a 24 kHz mono 16-bit WAV, base64, in steps[].content[] (type "audio").
 */
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';

interface InteractionResponse {
  steps?: Array<{ type?: string; content?: Array<{ type?: string; data?: string }> }>;
}

export function geminiTts(
  model = process.env.GEMINI_TTS_MODEL ?? 'gemini-3.8-flash-tts',
): TtsProvider {
  return {
    name: 'gemini',
    model,
    async synthesize(req: TtsRequest): Promise<TtsResult> {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        throw new Error(
          'GEMINI_API_KEY missing in .env (Google AI Studio key, project without billing).',
        );
      }
      const body = {
        model,
        input: [
          {
            type: 'user_input',
            content: [
              {
                type: 'text',
                text: req.text,
                ...(req.style
                  ? { annotations: [{ type: 'speech_metadata', style: req.style }] }
                  : {}),
              },
            ],
          },
        ],
        response_format: { type: 'audio' },
        generation_config: { speech_config: [{ voice: req.voice }] },
      };
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify(body),
      });
      if (res.status === 429) throw new TtsQuotaError('gemini', await res.text());
      if (!res.ok) throw new Error(`gemini ${res.status}: ${await res.text()}`);

      const json = (await res.json()) as InteractionResponse;
      const audio = (json.steps ?? [])
        .filter((s) => s.type === 'model_output')
        .flatMap((s) => s.content ?? [])
        .filter((c) => c.type === 'audio' && c.data)
        .at(-1)?.data;
      if (!audio) throw new Error(`gemini: no audio in the response for voice ${req.voice}`);

      mkdirSync(path.dirname(req.out), { recursive: true });
      writeFileSync(req.out, Buffer.from(audio, 'base64'));
      return { file: req.out, provider: 'gemini', model, voice: req.voice, ...wavInfo(req.out) };
    },
  };
}
