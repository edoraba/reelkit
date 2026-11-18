import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { transcribe } from '@remotion/install-whisper-cpp';
import { detectPauses, type Pause } from '../audio/pauses';
import { bin, pinned, readInstalled, type WhisperModelName } from '../tools/registry';
import { speechMap, spoken, type SpeechUnit } from '../tts/pronounce';

/**
 * Word timings for the voice track (brief, step 3), in three passes:
 * 1. whisper.cpp hears the audio with token-level DTW times. `t_dtw` marks the END of a token
 *    (measured on the listening test: about 0.1 s late, while the token offsets drift by up to
 *    a second), so a word ends at the DTW time of its last token;
 * 2. the heard words are aligned to the script words, so timings always belong to the script
 *    (whisper may hear "allo SDI" as "all'OSD"); words not heard are interpolated;
 * 3. word boundaries snap to the pauses measured by ffmpeg, preferring boundaries after
 *    punctuation, and words squeezed to nothing get a share of their segment.
 */

export interface TimedWord {
  /** Word of the spoken script, punctuation kept ("fattura,"). */
  word: string;
  startMs: number;
  endMs: number;
  /** What whisper heard for this word, when it differs; absent when not heard at all. */
  heard?: string;
  /** exact, close (similar spelling), guessed (interpolated). */
  match: 'exact' | 'close' | 'guessed';
}

/** A unit of screen text ("TD17,") timed over the spoken words it stands for. */
export interface TimedUnit {
  text: string;
  startMs: number;
  endMs: number;
  /** Index range [first, last] in `words`. */
  words: [number, number];
  /** Beat id when the text comes from a script. */
  beat?: string;
}

export interface AlignReport {
  durationMs: number;
  /** Screen text with timings: what captions show. */
  screen: TimedUnit[];
  /** Spoken words with timings: what the voice says (mouth, word-level SFX). */
  words: TimedWord[];
  /** Silences of the voice (at least 150 ms): mouth closed, room for SFX. */
  pauses: Pause[];
  /** Share of script words heard exactly or almost exactly. */
  heardRatio: number;
  /** Script words not heard, or heard as something else: candidates for a pronunciation fix. */
  issues: Array<{ index: number; word: string; heard?: string }>;
}

interface Heard {
  text: string;
  startMs: number;
  endMs: number;
}

/** Lowercase, no accents, no punctuation: "Iva?" and "IVA" compare equal. */
export function norm(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]/g, '');
}

function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]!;
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]!;
      prev[j] = Math.min(prev[j]! + 1, prev[j - 1]! + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return 1 - prev[b.length]! / Math.max(a.length, b.length);
}

const PUNCT_TOKEN = /^[\s.,!?:;"'«»]+$/;

/** Runs whisper.cpp on a 16 kHz copy of the audio and returns the heard words with timings. */
export async function hear(audio: string, model: WhisperModelName): Promise<Heard[]> {
  const tmp = path.join(os.tmpdir(), `reelkit-align-${process.pid}.wav`);
  const conv = spawnSync(
    bin.ffmpeg,
    ['-v', 'error', '-y', '-i', audio, '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', tmp],
    { encoding: 'utf8' },
  );
  if (conv.status !== 0) throw new Error(`ffmpeg could not convert ${audio}: ${conv.stderr}`);
  try {
    const output = await transcribe({
      inputPath: tmp,
      whisperPath: bin.whisperDir,
      whisperCppVersion: readInstalled().whisper ?? pinned.whisper,
      model,
      modelFolder: bin.whisperDir,
      tokenLevelTimestamps: true,
      language: 'it',
      printOutput: false,
    });
    // Tokens are pieces of words: a new word starts with a space. t_dtw is in centiseconds.
    const words: Heard[] = [];
    for (const t of output.transcription.flatMap((s) => s.tokens)) {
      if (!t.text.trim() || t.text.startsWith('[_')) continue;
      const punct = PUNCT_TOKEN.test(t.text);
      const at = t.t_dtw * 10;
      if ((/^\s/.test(t.text) && !punct) || words.length === 0) {
        const startMs = words.at(-1)?.endMs ?? Math.max(0, at - 300);
        words.push({ text: t.text.trim(), startMs, endMs: Math.max(startMs, at) });
      } else {
        const last = words[words.length - 1]!;
        last.text += t.text;
        if (!punct) last.endMs = Math.max(last.endMs, at);
      }
    }
    // A number and its unit ("49,99" + "euro") are spelled together: "euro e novantanove".
    const merged: Heard[] = [];
    for (const w of words) {
      const prev = merged.at(-1);
      if (prev && /\d[.,]?$/.test(prev.text) && /^(?:€|euro|%|per)\b/i.test(w.text)) {
        prev.text = `${prev.text} ${w.text}`;
        prev.endMs = w.endMs;
      } else merged.push({ ...w });
    }
    // Whisper writes numbers and symbols ("49,99 €", "TD17"): spell them like the script does,
    // sharing the time of the heard word among the spelled words by length.
    return merged.flatMap((w) => {
      const parts = spoken(w.text).split(/\s+/).filter(Boolean);
      if (parts.length <= 1) return [{ ...w, text: parts[0] ?? w.text }];
      return share(w.startMs, w.endMs, parts).map(([text, startMs, endMs]) => ({
        text,
        startMs,
        endMs,
      }));
    });
  } finally {
    rmSync(tmp, { force: true });
  }
}

/** Splits [from, to] among words proportionally to their length. */
function share(from: number, to: number, words: string[]): Array<[string, number, number]> {
  // +2: one-letter words ("e", "è") still take a syllable of time.
  const weight = (w: string) => norm(w).length + 2;
  const total = words.reduce((s, w) => s + weight(w), 0);
  let t = from;
  return words.map((w) => {
    const d = ((to - from) * weight(w)) / total;
    const piece: [string, number, number] = [w, Math.round(t), Math.round(t + d)];
    t += d;
    return piece;
  });
}

/** Aligns heard words to script words (edit distance on word sequences, similarity-weighted). */
export function alignWords(script: string[], heard: Heard[]): TimedWord[] {
  const a = script.map(norm);
  const b = heard.map((h) => norm(h.text));
  const n = a.length;
  const m = b.length;
  const GAP = 1;
  const subCost = (i: number, j: number) => 2 * (1 - similarity(a[i]!, b[j]!));
  const cost = Array.from({ length: n + 1 }, () => new Float64Array(m + 1));
  for (let i = 1; i <= n; i++) cost[i]![0] = i * GAP;
  for (let j = 1; j <= m; j++) cost[0]![j] = j * GAP;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      cost[i]![j] = Math.min(
        cost[i - 1]![j - 1]! + subCost(i - 1, j - 1),
        cost[i - 1]![j]! + GAP,
        cost[i]![j - 1]! + GAP,
      );
    }
  }
  // Walk back: pair each script word with at most one heard word.
  const pair = new Array<number>(n).fill(-1);
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (Math.abs(cost[i]![j]! - (cost[i - 1]![j - 1]! + subCost(i - 1, j - 1))) < 1e-9) {
      pair[i - 1] = j - 1;
      i--;
      j--;
    } else if (Math.abs(cost[i]![j]! - (cost[i - 1]![j]! + GAP)) < 1e-9) i--;
    else j--;
  }

  const words: TimedWord[] = script.map((word, k) => {
    const h = pair[k]! >= 0 ? heard[pair[k]!]! : undefined;
    const sim = h ? similarity(a[k]!, norm(h.text)) : 0;
    if (h && sim >= 0.5) {
      return {
        word,
        startMs: h.startMs,
        endMs: h.endMs,
        match: sim === 1 ? 'exact' : 'close',
        ...(sim < 1 ? { heard: h.text } : {}),
      };
    }
    return { word, startMs: -1, endMs: -1, match: 'guessed', ...(h ? { heard: h.text } : {}) };
  });

  // Guessed words share the gap between their timed neighbours, by length.
  for (let k = 0; k < words.length; k++) {
    if (words[k]!.match !== 'guessed') continue;
    let e = k;
    while (e + 1 < words.length && words[e + 1]!.match === 'guessed') e++;
    const from = k > 0 ? words[k - 1]!.endMs : 0;
    const to = e + 1 < words.length ? words[e + 1]!.startMs : (heard.at(-1)?.endMs ?? from);
    const run = words.slice(k, e + 1);
    share(
      from,
      Math.max(from, to),
      run.map((w) => w.word),
    ).forEach(([, s, t], r) => {
      run[r]!.startMs = s;
      run[r]!.endMs = t;
    });
    k = e;
  }
  return words;
}

const MIN_WORD_MS = 80;
const SNAP_MS = 500;

/**
 * Puts word boundaries on the measured pauses: each inner pause takes the nearest boundary
 * (after punctuation if one is close), the first word starts after the leading silence and the
 * last one ends before the trailing silence. Then, inside each stretch of speech, words keep
 * their order and every word gets at least MIN_WORD_MS.
 */
export function fitToPauses(
  words: TimedWord[],
  measured: Pause[],
  durationMs: number,
): TimedWord[] {
  if (words.length === 0) return words;
  const out = words.map((w) => ({ ...w }));
  // A pause broken by a click (gap under 80 ms) is one pause.
  const pauses: Pause[] = [];
  for (const p of measured) {
    const last = pauses.at(-1);
    if (last && p.startMs - last.endMs < 80) last.endMs = p.endMs;
    else pauses.push({ ...p });
  }
  const lead = pauses.find((p) => p.startMs <= 20);
  const trail = pauses.find((p) => p.endMs >= durationMs - 20 && p !== lead);
  const speechStart = lead?.endMs ?? 0;
  const speechEnd = trail?.startMs ?? durationMs;

  // Anchors: boundary index k (between word k and k + 1) -> pause.
  const anchors = new Map<number, Pause>();
  let nextK = 0;
  for (const p of pauses) {
    if (p === lead || p === trail) continue;
    let best = -1;
    let bestScore = Infinity;
    // Pauses come in time order, so their boundaries do too.
    for (let k = nextK; k < out.length - 1; k++) {
      const b = out[k]!.endMs;
      const dist = b < p.startMs ? p.startMs - b : b > p.endMs ? b - p.endMs : 0;
      if (dist > SNAP_MS) continue;
      const score = dist + (/[.,!?:;]$/.test(out[k]!.word) ? 0 : 300);
      if (score < bestScore) {
        bestScore = score;
        best = k;
      }
    }
    if (best >= 0) {
      anchors.set(best, p);
      nextK = best + 1;
    }
  }

  // Stretches of speech between anchors: [startMs, endMs] and the words they contain.
  const cuts = [...anchors.keys()].sort((x, y) => x - y);
  let first = 0;
  let segStart = speechStart;
  for (const k of [...cuts, out.length - 1]) {
    const segEnd = k === out.length - 1 ? speechEnd : anchors.get(k)!.startMs;
    fitSegment(out.slice(first, k + 1), segStart, segEnd);
    if (k < out.length - 1) segStart = anchors.get(k)!.endMs;
    first = k + 1;
  }
  // Safety net: never overlapping, never backwards.
  for (let k = 1; k < out.length; k++) {
    const prev = out[k - 1]!;
    const w = out[k]!;
    if (w.startMs < prev.endMs) w.startMs = prev.endMs;
    if (w.endMs < w.startMs) w.endMs = w.startMs;
  }
  return out;
}

/** Clamps the words of one stretch of speech into [from, to], in order, none shorter than the minimum. */
function fitSegment(seg: TimedWord[], from: number, to: number): void {
  if (seg.length === 0) return;
  const span = Math.max(to - from, seg.length * MIN_WORD_MS);
  // Keep the heard positions where they make sense, as fractions of the original stretch.
  const o0 = seg[0]!.startMs;
  const o1 = Math.max(seg.at(-1)!.endMs, o0 + 1);
  const ends = seg.map(
    (w) => from + ((Math.min(Math.max(w.endMs, o0), o1) - o0) / (o1 - o0)) * span,
  );
  ends[ends.length - 1] = from + span;
  const startOf = (i: number) => (i > 0 ? ends[i - 1]! : from);
  // Words squeezed under the minimum (whisper missed them, or crammed them together) share a
  // window with their neighbours by length; the window grows until every word fits. The other
  // words keep their heard times (sharing the whole stretch moved them by 0.3 s).
  for (let guard = 0; guard < seg.length; guard++) {
    const k = ends.findIndex((e, i) => e - startOf(i) < MIN_WORD_MS);
    if (k < 0) break;
    let lo = k;
    let hi = k;
    for (;;) {
      lo = Math.max(0, lo - 1);
      hi = Math.min(seg.length - 1, hi + 1);
      const words = seg.slice(lo, hi + 1).map((w) => w.word);
      const pieces = share(startOf(lo), ends[hi]!, words);
      const fits = pieces.every(([, s, e]) => e - s >= MIN_WORD_MS);
      if (fits || (lo === 0 && hi === seg.length - 1)) {
        pieces.forEach(([, , e], r) => (ends[lo + r] = e));
        break;
      }
    }
  }
  seg.forEach((w, i) => {
    w.startMs = Math.round(startOf(i));
    w.endMs = Math.round(ends[i]!);
  });
}

/**
 * Full step: hear the audio, align it to the spoken form of the screen text, fit it to the
 * pauses, time the screen units, write words.json.
 */
export async function alignAudio(opts: {
  audio: string;
  /** Screen text ("TD17", "49,99 €"); the spoken form is derived with speechMap. */
  text?: string;
  /** Or ready-made units, e.g. one speechMap per beat tagged with the beat id. */
  units?: Array<SpeechUnit & { beat?: string }>;
  out: string;
  model: WhisperModelName;
}): Promise<AlignReport> {
  const units: Array<SpeechUnit & { beat?: string }> = opts.units ?? speechMap(opts.text ?? '');
  const script = units.flatMap((u) => u.spoken);
  const heard = await hear(opts.audio, opts.model);
  const { pauses, durationMs } = detectPauses(opts.audio);
  const words = fitToPauses(alignWords(script, heard), pauses, durationMs);
  let next = 0;
  const screen: TimedUnit[] = units.map((u) => {
    const first = next;
    const last = next + Math.max(1, u.spoken.length) - 1;
    next = last + 1;
    return {
      text: u.screen,
      startMs: words[first]!.startMs,
      endMs: words[last]!.endMs,
      words: [first, last],
      ...(u.beat ? { beat: u.beat } : {}),
    };
  });
  const issues = words
    .map((w, index) => ({ index, w }))
    .filter(({ w }) => w.match === 'guessed' || (w.heard && w.match === 'close'))
    .map(({ index, w }) => ({ index, word: w.word, ...(w.heard ? { heard: w.heard } : {}) }));
  const heardRatio = words.filter((w) => w.match !== 'guessed').length / Math.max(1, words.length);
  const report: AlignReport = { durationMs, screen, words, pauses, heardRatio, issues };
  mkdirSync(path.dirname(opts.out), { recursive: true });
  writeFileSync(opts.out, JSON.stringify(report, null, 2) + '\n');
  return report;
}
