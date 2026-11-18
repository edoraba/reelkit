import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { rel, repoRoot } from '../paths';
import { bin, KOKORO_VOICES, PIPER_VOICES } from '../tools/registry';
import { geminiTts } from './gemini';
import { kokoroTts, piperTts } from './local';
import { TtsQuotaError, type TtsProvider, type TtsProviderName } from './types';
import { VOICE_STYLE } from './voice';

/**
 * TTS listening test (D-003): the same Italian text through every free option, normalized to
 * the same loudness so that only the voice is compared. Edoardo listens and chooses.
 *   pnpm tts:test [--only kokoro,piper,gemini] [--force]
 *   ->  packages/pipeline/out/tts-test/index.html
 * Idempotent: existing samples are kept, so the Gemini free quota (about 10 requests a day) can
 * be spread over several days; on HTTP 429 the remaining Gemini samples wait for the next run.
 */

/**
 * Written like a reel script, but TD17, SDI and the amount are left raw on purpose: the test
 * also shows which engine needs a pronunciation pass before synthesis.
 */
export const TEST_TEXT =
  'Paghi Google Ads, Canva o Notion con la partita IVA? Allora ogni mese ti arriva una ' +
  "fattura estera, senza IVA. E l'IVA chi la mette? Tu. Si chiama reverse charge: integri " +
  "l'IVA con un'autofattura TD17, e la mandi allo SDI. Sembra un incubo, lo so. Ma con " +
  'Refattura carichi il PDF, lui legge fornitore e importo, 49,99 euro, e ti prepara ' +
  "l'autofattura. Tu controlli e invii. Fine. Provalo: il link è in bio.";

/** Delivery direction for Gemini: the house style (D-030). */
export const TEST_STYLE = VOICE_STYLE;

interface Candidate {
  id: string;
  provider: TtsProviderName;
  voice: string;
  model?: string;
  note: string;
}

/** Gemini voices in priority order: the first ones fit a lively explainer best. */
const GEMINI: Array<[voice: string, note: string]> = [
  ['Puck', 'upbeat'],
  ['Achird', 'friendly'],
  ['Sadachbia', 'lively'],
  ['Zephyr', 'bright'],
  ['Sulafat', 'warm'],
  ['Charon', 'informative'],
  ['Leda', 'youthful'],
  ['Kore', 'firm'],
];
const GEMINI_LITE: Array<[voice: string, note: string]> = [
  ['Puck', 'upbeat, lite model'],
  ['Achird', 'friendly, lite model'],
];

export const CANDIDATES: Candidate[] = [
  ...KOKORO_VOICES.map((voice) => ({
    id: `kokoro-${voice}`,
    provider: 'kokoro' as const,
    voice,
    note: 'Kokoro 82M, offline',
  })),
  ...PIPER_VOICES.map((voice) => ({
    id: `piper-${voice.replace('it_IT-', '')}`,
    provider: 'piper' as const,
    voice,
    note: 'Piper, offline',
  })),
  ...GEMINI.map(([voice, note]) => ({
    id: `gemini-flash-${voice.toLowerCase()}`,
    provider: 'gemini' as const,
    voice,
    model: 'gemini-3.8-flash-tts',
    note,
  })),
  ...GEMINI_LITE.map(([voice, note]) => ({
    id: `gemini-lite-${voice.toLowerCase()}`,
    provider: 'gemini' as const,
    voice,
    model: 'gemini-3.8-flash-lite-tts',
    note,
  })),
];

const outDir = path.join(repoRoot, 'packages', 'pipeline', 'out', 'tts-test');

function providerFor(c: Candidate): TtsProvider {
  if (c.provider === 'kokoro') return kokoroTts();
  if (c.provider === 'piper') return piperTts();
  return geminiTts(c.model);
}

/** Two-pass-free loudness normalization to -16 LUFS, mono MP3 for listening. */
function normalize(wav: string, mp3: string): void {
  const res = spawnSync(
    bin.ffmpeg,
    [
      '-v',
      'error',
      '-y',
      '-i',
      wav,
      '-af',
      'loudnorm=I=-16:TP=-1.5:LRA=11',
      '-ac',
      '1',
      '-ar',
      '44100',
      '-b:a',
      '160k',
      mp3,
    ],
    { encoding: 'utf8' },
  );
  if (res.status !== 0) throw new Error(`ffmpeg failed on ${wav}: ${res.stderr}`);
}

interface Row extends Candidate {
  file?: string;
  durationMs?: number;
  status: 'ok' | 'kept' | 'quota' | 'error';
  error?: string;
}

export async function listeningTest(opts: {
  only: TtsProviderName[];
  force: boolean;
}): Promise<void> {
  mkdirSync(path.join(outDir, 'raw'), { recursive: true });
  const rows: Row[] = [];
  let geminiBlocked = false;

  for (const c of CANDIDATES) {
    if (!opts.only.includes(c.provider)) continue;
    const raw = path.join(outDir, 'raw', `${c.id}.wav`);
    const mp3 = path.join(outDir, `${c.id}.mp3`);
    if (existsSync(mp3) && !opts.force) {
      rows.push({ ...c, file: path.basename(mp3), status: 'kept' });
      continue;
    }
    if (c.provider === 'gemini' && geminiBlocked) {
      rows.push({ ...c, status: 'quota' });
      continue;
    }
    try {
      const r = await providerFor(c).synthesize({
        text: TEST_TEXT,
        out: raw,
        voice: c.voice,
        style: c.provider === 'gemini' ? TEST_STYLE : undefined,
      });
      normalize(raw, mp3);
      rows.push({ ...c, file: path.basename(mp3), durationMs: r.durationMs, status: 'ok' });
      console.log(`  ok     ${c.id.padEnd(28)} ${(r.durationMs / 1000).toFixed(1)} s`);
    } catch (err) {
      if (err instanceof TtsQuotaError) {
        geminiBlocked = true;
        rows.push({ ...c, status: 'quota' });
        console.log(`  quota  ${c.id}: Gemini free limit reached, run again tomorrow`);
      } else {
        const message = err instanceof Error ? err.message : String(err);
        rows.push({ ...c, status: 'error', error: message });
        console.log(`  error  ${c.id}: ${message.split('\n')[0]}`);
      }
    }
  }

  writeFileSync(path.join(outDir, 'index.html'), page(rows));
  console.log(`\nListening page: ${rel(path.join(outDir, 'index.html'))}`);
}

function page(rows: Row[]): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const items = rows
    .map((r) => {
      const audio = r.file
        ? `<audio controls preload="none" src="${r.file}"></audio>`
        : `<span class="miss">${r.status === 'quota' ? 'waiting for the Gemini quota' : esc(r.error ?? 'not generated')}</span>`;
      const dur = r.durationMs ? `${(r.durationMs / 1000).toFixed(1)} s` : '';
      return `<tr><td><b>${esc(r.id)}</b><br><small>${esc(r.model ?? r.provider)} · ${esc(r.voice)} · ${esc(r.note)}</small></td><td>${dur}</td><td>${audio}</td></tr>`;
    })
    .join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>TTS listening test</title>
<style>body{font:15px system-ui,sans-serif;margin:24px;max-width:980px;color:#181819}
td{padding:8px 12px;border-bottom:1px solid #ddd;vertical-align:middle}small{color:#666}
blockquote{background:#f2f5fb;padding:12px 16px;border-radius:8px}.miss{color:#a33}</style></head><body>
<h1>TTS listening test</h1>
<p>Same text, loudness normalized to -16 LUFS. TD17, SDI and the amount are raw on purpose.</p>
<blockquote lang="it">${esc(TEST_TEXT)}</blockquote>
<p><small>Gemini style: ${esc(TEST_STYLE)}</small></p>
<table>${items}</table></body></html>
`;
}
