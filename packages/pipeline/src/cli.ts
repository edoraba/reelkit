#!/usr/bin/env node
/**
 * Pipeline CLI. Every command is idempotent and reads/writes files only.
 *   pnpm bootstrap [--only ffmpeg,rhubarb,whisper,browser,tts] [--model medium] [--force]
 *   pnpm tools:check [--model medium]
 *   pnpm tts:test [--only kokoro,piper,gemini] [--force]
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { bootstrap, check, TOOL_NAMES, type ToolName } from './bootstrap';
import { repoRoot } from './paths';
import { WHISPER_MODELS, type WhisperModelName } from './tools/registry';
import { listeningTest } from './tts/listening-test';
import type { TtsProviderName } from './tts/types';

const TTS_PROVIDERS: TtsProviderName[] = ['kokoro', 'piper', 'gemini'];

function parseProviders(raw: string | undefined): TtsProviderName[] {
  if (!raw) return TTS_PROVIDERS;
  const names = raw.split(',').map((s) => s.trim());
  for (const n of names) {
    if (!(TTS_PROVIDERS as string[]).includes(n)) {
      throw new Error(`Unknown TTS provider "${n}". Use: ${TTS_PROVIDERS.join(', ')}`);
    }
  }
  return names as TtsProviderName[];
}

const envFile = path.join(repoRoot, '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    only: { type: 'string' },
    model: { type: 'string' },
    force: { type: 'boolean', default: false },
  },
});

function parseModel(raw: string | undefined): WhisperModelName {
  const model = raw ?? process.env.WHISPER_MODEL ?? 'medium';
  if (!(WHISPER_MODELS as readonly string[]).includes(model)) {
    throw new Error(`Unknown whisper model "${model}". Use one of: ${WHISPER_MODELS.join(', ')}`);
  }
  return model as WhisperModelName;
}

function parseOnly(raw: string | undefined): ToolName[] {
  if (!raw) return [...TOOL_NAMES];
  const names = raw.split(',').map((s) => s.trim());
  for (const n of names) {
    if (!(TOOL_NAMES as readonly string[]).includes(n)) {
      throw new Error(`Unknown tool "${n}". Use: ${TOOL_NAMES.join(', ')}`);
    }
  }
  return names as ToolName[];
}

async function main(): Promise<void> {
  const [command] = positionals;
  switch (command) {
    case 'bootstrap':
      await bootstrap({
        only: parseOnly(values.only),
        model: parseModel(values.model),
        force: values.force ?? false,
      });
      return;
    case 'check':
      if (!check(parseModel(values.model))) process.exitCode = 1;
      return;
    case 'tts-test':
      await listeningTest({ only: parseProviders(values.only), force: values.force ?? false });
      return;
    default:
      console.error(`Unknown command "${command ?? ''}". Commands: bootstrap, check, tts-test`);
      process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  console.error(`\nerror: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
