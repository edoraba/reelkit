import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { piperModelPath, tts } from '../tools/registry';
import { wavInfo, type TtsProvider, type TtsRequest, type TtsResult } from './types';

/**
 * Offline engines, free and without limits: Kokoro (kokoro-onnx) and Piper (piper-tts), run by
 * py/tts_local.py inside the venv that `pnpm bootstrap --only tts` creates in tools/tts.
 */
const script = fileURLToPath(new URL('../../py/tts_local.py', import.meta.url));

function runLocal(payload: Record<string, unknown>): void {
  if (!existsSync(tts.python)) {
    throw new Error('Local TTS is not installed: run `pnpm bootstrap --only tts`.');
  }
  const res = spawnSync(tts.python, [script], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
  });
  if (res.status !== 0) {
    throw new Error(`local TTS failed: ${(res.stderr || res.stdout || '').trim().slice(-800)}`);
  }
}

export function kokoroTts(): TtsProvider {
  return {
    name: 'kokoro',
    model: 'kokoro-v1.0',
    async synthesize(req: TtsRequest): Promise<TtsResult> {
      mkdirSync(path.dirname(req.out), { recursive: true });
      runLocal({
        engine: 'kokoro',
        text: req.text,
        voice: req.voice,
        speed: req.speed ?? 1,
        model: tts.kokoroModel,
        voices: tts.kokoroVoices,
        out: req.out,
      });
      return {
        file: req.out,
        provider: 'kokoro',
        model: this.model,
        voice: req.voice,
        ...wavInfo(req.out),
      };
    },
  };
}

export function piperTts(): TtsProvider {
  return {
    name: 'piper',
    model: 'piper-1.8',
    async synthesize(req: TtsRequest): Promise<TtsResult> {
      mkdirSync(path.dirname(req.out), { recursive: true });
      runLocal({
        engine: 'piper',
        text: req.text,
        speed: req.speed ?? 1,
        model: piperModelPath(req.voice),
        out: req.out,
      });
      return {
        file: req.out,
        provider: 'piper',
        model: this.model,
        voice: req.voice,
        ...wavInfo(req.out),
      };
    },
  };
}
