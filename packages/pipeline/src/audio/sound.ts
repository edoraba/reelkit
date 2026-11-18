import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { transitionTiming } from '@reelkit/brand';
import { holdsHighlight, seededRandom, type ReelTimeline } from '@reelkit/schema';
import { repoRoot } from '../paths';
import { bin } from '../tools/registry';
import { analyze, readManifest, type LibraryFile } from './library';

/**
 * Sound plan and mix of a reel (D-034, rules in guidelines/generation.md):
 * - events come from the mascot plan (gags and triggers carry their SFX tag), the transitions,
 *   the automatic hops and taps and the closing; every file is placed so that its first
 *   transient lands on the event, not its start;
 * - two events never start less than 250 ms apart (the script and the mascot gestures win),
 *   nothing lands on the attack of a highlighted word except what the script asks there;
 * - one music loop, faded in and out, ducked under the voice; the mix ends at -14 LUFS.
 */

export interface SoundEvent {
  tag: string;
  file: string;
  /** When the event happens (the file's transient lands here), final time. */
  atMs: number;
  /** When the file starts playing: atMs minus the file's impact. */
  startMs: number;
  gainDb: number;
  /** Cut the file after this long (a gesture that lasts less than the sound). */
  maxMs?: number;
  reason: string;
}

export interface SoundPlan {
  /** Fingerprint of script.json, words.json and mascot.json (render refuses a stale plan). */
  inputs?: string;
  events: SoundEvent[];
  music?: { file: string; gainDb: number; fadeInMs: number; fadeOutMs: number; author: string };
  durationMs: number;
}

const FRAME_MS = 1000 / 30;
const MIN_GAP_MS = 250;
const ATTACK_GUARD_MS = 150;
/** A quiet file is raised at most this much: more would raise its noise floor too. */
const MAX_BOOST_DB = 9;

/** Target peak (dBFS, before the final loudness pass) and priority of each kind of event. */
const LEVEL: Record<string, { peak: number; priority: number }> = {
  script: { peak: -9, priority: 3 },
  transition: { peak: -13, priority: 2 },
  closing: { peak: -10, priority: 2 },
  auto: { peak: -20, priority: 1 },
};

interface Want {
  tag: string;
  atMs: number;
  level: keyof typeof LEVEL;
  reason: string;
  /** Allowed on the attack of a highlighted word (a stamp on its word). */
  onWord?: boolean;
  maxMs?: number;
}

/** Collects what should sound, from the timeline and its mascot plan. */
function wants(t: ReelTimeline): Want[] {
  const out: Want[] = [];
  const ms = (frames: number) => frames * FRAME_MS;
  const plan = t.mascot;
  // Scene changes: from the first beat of every new palette.
  let prev: string | undefined;
  t.beats.forEach((b, i) => {
    if (i > 0 && b.palette !== prev) {
      const planned = plan?.transitions.find((x) => x.beat === b.id);
      const kind = planned?.kind ?? 'bloom';
      const tStart = b.startMs - ms(transitionTiming[kind].lead);
      if (kind === 'bloom') {
        out.push({ tag: 'paper-swoosh', atMs: tStart + ms(2), level: 'transition', reason: `bloom into ${b.id}` });
      } else if (kind === 'cut') {
        out.push({ tag: 'snip', atMs: tStart + ms(2), level: 'transition', reason: `cut into ${b.id}` });
        out.push({ tag: 'paper-tear', atMs: tStart + ms(10), level: 'transition', reason: `pieces fall into ${b.id}` });
      } else {
        out.push({ tag: 'paper-pull', atMs: tStart, level: 'transition', reason: `pull into ${b.id}` });
      }
      if (planned?.trigger === 'blow') {
        out.push({ tag: 'puff', atMs: tStart - 120, level: 'script', reason: `mascot blows into ${b.id}` });
      }
    }
    prev = b.palette;
  });
  // Mascot gags: the script ones and the automatic hops and taps.
  for (const g of plan?.gags ?? []) {
    if (g.source === 'script' && g.sfx) {
      if (['snip', 'puff', 'paper-pull'].includes(g.sfx)) continue; // sounded with the transition
      out.push({
        tag: g.sfx,
        atMs: g.fromMs,
        level: 'script',
        reason: `${g.kind} in ${g.beat}`,
        onWord: true,
        // Typing and pouring stop with the gesture.
        ...(['typing', 'water'].includes(g.sfx) ? { maxMs: g.toMs - g.fromMs } : {}),
      });
    } else if (g.kind === 'hop') {
      out.push({ tag: 'hop', atMs: g.fromMs + 120, level: 'auto', reason: `hop in ${g.beat}` });
    } else if (g.kind === 'tap') {
      out.push({ tag: 'tap', atMs: g.fromMs + 100, level: 'auto', reason: `foot tap in ${g.beat}` });
    }
  }
  // Closing: the card lands, the logo chimes.
  if (t.outro) {
    // Frames of reel/Outro.tsx: the card lands at 8, the tagline at 24.
    out.push({ tag: 'pop', atMs: t.outro.startMs + ms(9), level: 'closing', reason: 'closing card' });
    out.push({ tag: 'sting', atMs: t.outro.startMs + ms(18), level: 'closing', reason: 'logo' });
  }
  return out.sort((a, b) => a.atMs - b.atMs);
}

export function planSound(t: ReelTimeline, totalMs: number): SoundPlan {
  const library = readManifest('sfx').files;
  const rnd = seededRandom(t.postId, 'sound');
  const attacks = t.beats.flatMap((b) =>
    b.units.filter((u) => b.highlight && holdsHighlight(u.text, b.highlight)).map((u) => u.startMs),
  );
  // Spacing: keep the higher priority when two events are closer than 250 ms.
  const chosen: Want[] = [];
  for (const w of wants(t)) {
    if (!w.onWord && attacks.some((a) => Math.abs(a - w.atMs) < ATTACK_GUARD_MS)) continue;
    const clash = chosen.find((c) => Math.abs(c.atMs - w.atMs) < MIN_GAP_MS);
    if (!clash) chosen.push(w);
    else if (LEVEL[w.level]!.priority > LEVEL[clash.level]!.priority) chosen.splice(chosen.indexOf(clash), 1, w);
  }
  const lastFile = new Map<string, string>();
  const events: SoundEvent[] = [];
  for (const w of chosen.sort((a, b) => a.atMs - b.atMs)) {
    const variants = library.filter((f) => f.tag === w.tag);
    if (variants.length === 0) continue;
    // Seeded variant, never the same file twice in a row for a tag.
    let pick = variants[Math.floor(rnd() * variants.length)]!;
    if (variants.length > 1 && lastFile.get(w.tag) === pick.file) {
      pick = variants[(variants.indexOf(pick) + 1) % variants.length]!;
    }
    lastFile.set(w.tag, pick.file);
    const startMs = Math.max(0, Math.round(w.atMs - pick.impactMs));
    events.push({
      tag: w.tag,
      file: pick.file,
      atMs: Math.round(w.atMs),
      startMs,
      gainDb: Math.round(Math.min(MAX_BOOST_DB, LEVEL[w.level]!.peak - pick.peakDb) * 10) / 10,
      ...(w.maxMs && w.maxMs + pick.impactMs < pick.durationMs ? { maxMs: w.maxMs + pick.impactMs } : {}),
      reason: w.reason,
    });
  }
  const tracks = readManifest('music').files;
  // Own seed: the music stays the same when the events change.
  const pickTrack = seededRandom(t.postId, 'music');
  const track: LibraryFile | undefined = tracks[Math.floor(pickTrack() * tracks.length)];
  return {
    events,
    durationMs: totalMs,
    ...(track
      ? {
          music: {
            file: track.file,
            // Music about 12 LU under the raw voice (around -21 LUFS), about 20 under it once ducked.
            gainDb: Math.round((-33 - track.lufs) * 10) / 10,
            fadeInMs: 600,
            fadeOutMs: 1400,
            author: track.source.author,
          },
        }
      : {}),
  };
}

/**
 * Mixes voice, events and music into one WAV (48 kHz stereo), music ducked by the voice with a
 * sidechain compressor, then normalized to -14 LUFS integrated, true peak -1.5 dBTP.
 */
export function mixSound(voice: string, plan: SoundPlan, out: string): { lufs: number } {
  const D = (plan.durationMs / 1000).toFixed(3);
  const assets = path.join(repoRoot, 'assets');
  const args = ['-v', 'error', '-y', '-i', voice];
  for (const e of plan.events) args.push('-i', path.join(assets, e.file));
  if (plan.music) args.push('-stream_loop', '-1', '-i', path.join(assets, plan.music.file));
  const fmt = 'aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo';
  const parts: string[] = [`[0:a]${fmt},apad=whole_dur=${D},asplit=2[v][key]`];
  const labels = ['[v]'];
  plan.events.forEach((e, i) => {
    const cut = e.maxMs
      ? `,atrim=0:${e.maxMs / 1000},afade=t=out:st=${Math.max(0, e.maxMs - 120) / 1000}:d=0.12`
      : '';
    parts.push(
      `[${i + 1}:a]${fmt}${cut},volume=${e.gainDb}dB,adelay=${e.startMs}|${e.startMs},apad=whole_dur=${D}[s${i}]`,
    );
    labels.push(`[s${i}]`);
  });
  if (plan.music) {
    const m = plan.music;
    const k = plan.events.length + 1;
    const fadeOutStart = (plan.durationMs - m.fadeOutMs) / 1000;
    parts.push(
      `[${k}:a]${fmt},atrim=0:${D},volume=${m.gainDb}dB,afade=t=in:d=${m.fadeInMs / 1000},afade=t=out:st=${fadeOutStart.toFixed(3)}:d=${m.fadeOutMs / 1000}[mus]`,
      // Ducking: the voice pushes the music down about 8 dB while it speaks.
      `[mus][key]sidechaincompress=threshold=0.02:ratio=6:attack=15:release=350:makeup=1[duck]`,
    );
    labels.push('[duck]');
  } else {
    parts.push('[key]anullsink');
  }
  parts.push(
    `${labels.join('')}amix=inputs=${labels.length}:normalize=0:duration=longest,atrim=0:${D},loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[out]`,
  );
  args.push('-filter_complex', parts.join(';'), '-map', '[out]', '-ac', '2', '-ar', '48000', '-c:a', 'pcm_s16le', out);
  const res = spawnSync(bin.ffmpeg, args, { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (res.status !== 0) throw new Error(`ffmpeg mix failed: ${res.stderr.slice(-1500)}`);
  return { lufs: analyze(out).lufs };
}
