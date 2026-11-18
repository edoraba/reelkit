#!/usr/bin/env node
/**
 * Pipeline CLI. Every command is idempotent and reads/writes files only.
 *   pnpm bootstrap [--only ffmpeg,rhubarb,whisper,browser,tts] [--model medium] [--force]
 *   pnpm tools:check [--model medium]
 *   pnpm tts:test [--only kokoro,piper,gemini] [--force]
 *   pnpm pipeline say --text "screen text" --out voice.wav
 *   pnpm pipeline align --audio voice.wav --text "screen text" --out words.json [--model medium]
 * Per post (content/posts/<id>/):
 *   pnpm pipeline tts <id>                  voice.wav from script.json (one Gemini request)
 *   pnpm pipeline align <id>                words.json from voice.wav
 *   pnpm pipeline mascot <id>               mascot.json, the mascot choreography (D-032)
 *   pnpm pipeline render <id> [--scale 0.5] out/reel.mp4 (full size sets status rendered)
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { alignAudio, type AlignReport } from './align/align';
import { bootstrap, check, TOOL_NAMES, type ToolName } from './bootstrap';
import { rel, repoRoot } from './paths';
import { alignPost, mascotPost, postPaths, renderPost, ttsPost } from './post/post';
import { WHISPER_MODELS, type WhisperModelName } from './tools/registry';
import { listeningTest } from './tts/listening-test';
import { speechMap, spokenText } from './tts/pronounce';
import type { TtsProviderName } from './tts/types';
import { houseVoice, providerOf } from './tts/voice';

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
    audio: { type: 'string' },
    text: { type: 'string' },
    out: { type: 'string' },
    scale: { type: 'string' },
  },
});

function printReport(report: AlignReport, out: string): void {
  console.log(
    `${report.words.length} words, ${(report.heardRatio * 100).toFixed(0)}% heard, ` +
      `${report.issues.length} to check -> ${rel(out)}`,
  );
  for (const i of report.issues) console.log(`  #${i.index} "${i.word}" heard "${i.heard ?? ''}"`);
}

function postIdArg(): string {
  const id = positionals[1];
  if (!id) throw new Error(`${positionals[0]} needs a post id (folder name in content/posts)`);
  return id;
}

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
    case 'say': {
      if (!values.text || !values.out) throw new Error('say needs --text and --out');
      const voice = houseVoice();
      const text = spokenText(speechMap(values.text));
      console.log(`${voice.provider} ${voice.model} ${voice.voice}: ${text}`);
      const r = await providerOf(voice).synthesize({
        text,
        out: path.resolve(values.out),
        voice: voice.voice,
        style: voice.style,
      });
      console.log(`${(r.durationMs / 1000).toFixed(1)} s -> ${rel(r.file)}`);
      return;
    }
    case 'align': {
      if (positionals[1]) {
        const id = postIdArg();
        printReport(await alignPost(id, parseModel(values.model)), postPaths(id).words);
        return;
      }
      if (!values.audio || !values.text || !values.out) {
        throw new Error('align needs a post id, or --audio, --text and --out');
      }
      const out = path.resolve(values.out);
      printReport(
        await alignAudio({
          audio: path.resolve(values.audio),
          text: values.text,
          out,
          model: parseModel(values.model),
        }),
        out,
      );
      return;
    }
    case 'mascot': {
      const id = postIdArg();
      const plan = mascotPost(id);
      const count = (src: string) => plan.gags.filter((g) => g.source === src).length;
      console.log(
        `${plan.moves.length} moves, ${plan.cues.length} cues, gags ${count('script')} script + ${count('auto')} auto, ` +
          `triggers ${
            plan.transitions
              .filter((t) => t.trigger)
              .map((t) => `${t.beat} ${t.trigger}`)
              .join(', ') || 'none'
          }, ` +
          `stretch ${plan.stretch.map((x) => `+${x.addMs} ms at ${x.atMs}`).join(', ') || 'none'} -> ${rel(postPaths(id).mascot)}`,
      );
      return;
    }
    case 'tts':
      await ttsPost(postIdArg());
      return;
    case 'render':
      renderPost(postIdArg(), { scale: values.scale ? Number(values.scale) : undefined });
      return;
    default:
      console.error(
        `Unknown command "${command ?? ''}". ` +
          'Commands: bootstrap, check, tts-test, say, tts, align, mascot, render',
      );
      process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  console.error(`\nerror: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
