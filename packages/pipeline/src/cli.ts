#!/usr/bin/env node
/**
 * Pipeline CLI. Every command is idempotent and reads/writes files only.
 *   pnpm bootstrap [--only ffmpeg,rhubarb,whisper,browser] [--model medium] [--force]
 *   pnpm tools:check [--model medium]
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { bootstrap, check, TOOL_NAMES, type ToolName } from './bootstrap';
import { repoRoot } from './paths';
import { WHISPER_MODELS, type WhisperModelName } from './tools/registry';

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
    default:
      console.error(`Unknown command "${command ?? ''}". Commands: bootstrap, check`);
      process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  console.error(`\nerror: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
