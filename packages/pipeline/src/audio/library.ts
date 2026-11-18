import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot, rel } from '../paths';
import { bin } from '../tools/registry';

/**
 * Sound library (D-034): CC0 sound effects and music loops from Freesound, kept in the repo
 * (assets/sfx, assets/music) with a manifest that records source, author and license of every
 * file. Only Creative Commons 0 is fetched, so the files can live in the public repository.
 * Previews in high quality mp3 (about 128 kbps) are enough under the voice and need only an
 * API key (FREESOUND_API_KEY in .env, free account).
 *   pnpm pipeline audio-fetch [--force]
 */

const API = 'https://freesound.org/apiv2';

/** One kind of sound the reels use, and how to find it. */
export interface Wanted {
  tag: string;
  query: string;
  /** Seconds. */
  duration: [number, number];
  /** How many variants to keep (choices are seeded per post). */
  count: number;
  /** Freesound tag the sound must carry (more precise than the text query). */
  tag2?: string;
}

/** Sound effects, named after the SFX tags of the mascot plan, transitions and closing. */
export const SFX_CATALOG: Wanted[] = [
  { tag: 'snip', query: 'scissors cut', tag2: 'scissors', duration: [0.1, 1.5], count: 3 },
  { tag: 'paper-tear', query: 'paper rip', duration: [0.2, 2], count: 3 },
  { tag: 'paper-swoosh', query: 'page turn', duration: [0.2, 1.6], count: 3 },
  { tag: 'paper-pull', query: 'paper slide', duration: [0.3, 2], count: 2 },
  { tag: 'stamp', query: 'stamp', duration: [0.1, 1.5], count: 3 },
  { tag: 'typing', query: 'typing', tag2: 'keyboard', duration: [0.3, 3], count: 2 },
  { tag: 'swish', query: 'swish', duration: [0.15, 1.2], count: 3 },
  { tag: 'water', query: 'pouring water', duration: [0.5, 3], count: 2 },
  { tag: 'whoosh-soft', query: 'soft whoosh', duration: [0.2, 1.2], count: 3 },
  { tag: 'puff', query: 'blowing', duration: [0.2, 2], count: 2 },
  { tag: 'pop', query: 'pop cartoon', duration: [0.05, 0.6], count: 3 },
  { tag: 'hop', query: 'cartoon jump boing', duration: [0.1, 0.9], count: 2 },
  { tag: 'tap', query: 'shoe tap', duration: [0.05, 0.6], count: 2 },
  { tag: 'sting', query: 'success chime', duration: [0.8, 3], count: 3 },
];

/**
 * Music: light, playful loops for an explainer (moods in the manifest). Freesound tag `loop`
 * required, ambience and noise words excluded.
 */
export const MUSIC_CATALOG: Array<Wanted & { mood: string }> = [
  { tag: 'music', mood: 'ukulele', query: 'ukulele', duration: [12, 120], count: 2 },
  { tag: 'music', mood: 'marimba', query: 'marimba', duration: [12, 120], count: 2 },
  { tag: 'music', mood: 'upbeat', query: 'happy upbeat', duration: [12, 120], count: 2 },
];

/** Words in a name that betray the wrong kind of file for the reels. */
const AVOID =
  /static|vinyl|ambien|noise|voice|vocal|speech|radio|tape|rope|drone|field|balloon|wah|sci-fi|coin/i;

export interface LibraryFile {
  tag: string;
  mood?: string;
  /** Path inside assets/ (Remotion public folder). */
  file: string;
  durationMs: number;
  /** First transient: the moment the sound "hits" (aligned to the event, not the file start). */
  impactMs: number;
  /** Integrated loudness, LUFS (-70 when the sound is too short to measure). */
  lufs: number;
  /** Peak level, dBFS: the level reference for short sounds. */
  peakDb: number;
  source: { site: 'freesound'; id: number; name: string; author: string; url: string };
  license: 'CC0-1.0';
}

interface Manifest {
  $comment: string;
  files: LibraryFile[];
}

interface FsSound {
  id: number;
  name: string;
  username: string;
  duration: number;
  avg_rating: number;
  num_ratings: number;
  num_downloads: number;
  license: string;
  previews: Record<string, string>;
}

const manifestPath = (kind: 'sfx' | 'music') =>
  path.join(repoRoot, 'assets', kind, 'manifest.json');

export function readManifest(kind: 'sfx' | 'music'): Manifest {
  return JSON.parse(readFileSync(manifestPath(kind), 'utf8')) as Manifest;
}

export async function search(w: Wanted & { mood?: string }, key: string): Promise<FsSound[]> {
  const params = new URLSearchParams({
    query: w.query,
    filter: `license:"Creative Commons 0" duration:[${w.duration[0]} TO ${w.duration[1]}]${w.mood ? ' tag:loop' : ''}${w.tag2 ? ` tag:${w.tag2}` : ''}`,
    fields: 'id,name,username,duration,avg_rating,num_ratings,num_downloads,license,previews',
    sort: 'downloads_desc',
    page_size: '30',
    token: key,
  });
  const res = await fetch(`${API}/search/text/?${params}`);
  if (!res.ok) throw new Error(`freesound search "${w.query}": ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { results: FsSound[] };
  // Popular first, then the best rated among them (a single 5-star vote is not enough).
  return json.results
    .filter((s) => s.license.includes('publicdomain/zero') && !AVOID.test(s.name))
    .map((s) => ({
      s,
      score: (s.num_ratings >= 3 ? s.avg_rating : 3) + Math.log10(1 + s.num_downloads),
    }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.s);
}

/** Loudness, duration and the first transient of an audio file, measured with ffmpeg. */
export function analyze(file: string): {
  durationMs: number;
  impactMs: number;
  lufs: number;
  peakDb: number;
} {
  const pcm = spawnSync(
    bin.ffmpeg,
    ['-v', 'error', '-i', file, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'],
    { maxBuffer: 1 << 28 },
  );
  if (pcm.status !== 0) throw new Error(`ffmpeg could not decode ${file}`);
  const samples = new Int16Array(pcm.stdout.buffer, pcm.stdout.byteOffset, pcm.stdout.length / 2);
  let peak = 1;
  for (const v of samples) peak = Math.max(peak, Math.abs(v));
  // The hit: first 5 ms window whose level reaches 60% of the peak.
  const win = 80;
  let impact = 0;
  for (let i = 0; i < samples.length; i += win) {
    let m = 0;
    for (let k = i; k < Math.min(i + win, samples.length); k++)
      m = Math.max(m, Math.abs(samples[k]!));
    if (m >= 0.6 * peak) {
      impact = i;
      break;
    }
  }
  const loud = spawnSync(
    bin.ffmpeg,
    ['-hide_banner', '-i', file, '-af', 'ebur128', '-f', 'null', '-'],
    {
      encoding: 'utf8',
    },
  );
  const m = /I:\s+(-?[\d.]+) LUFS/.exec(loud.stderr.split('Summary:').at(-1) ?? '');
  return {
    durationMs: Math.round((samples.length / 16000) * 1000),
    impactMs: Math.round((impact / 16000) * 1000),
    lufs: m ? Number(m[1]) : -70,
    peakDb: Math.round(20 * Math.log10(peak / 32768) * 10) / 10,
  };
}

/** Fetches what is missing from the catalogs and rewrites both manifests. */
export async function fetchLibrary(opts: { force?: boolean } = {}): Promise<void> {
  const key = process.env.FREESOUND_API_KEY;
  if (!key)
    throw new Error('FREESOUND_API_KEY missing in .env (free Freesound account, API credentials).');
  for (const kind of ['sfx', 'music'] as const) {
    const catalog: Array<Wanted & { mood?: string }> = kind === 'sfx' ? SFX_CATALOG : MUSIC_CATALOG;
    const manifest = readManifest(kind);
    const keep = opts.force ? [] : manifest.files;
    const out: LibraryFile[] = [];
    for (const w of catalog) {
      const have = keep.filter((f) => f.tag === w.tag && f.mood === w.mood);
      if (have.length >= w.count) {
        out.push(...have);
        continue;
      }
      const found = await search(w, key);
      const picked = found
        .filter((s) => !have.some((h) => h.source.id === s.id))
        .filter((s) => !out.some((o) => o.source.id === s.id))
        .slice(0, w.count - have.length);
      out.push(...have);
      for (const s of picked) {
        const url = s.previews['preview-hq-mp3'];
        if (!url) continue;
        const dir = kind === 'sfx' ? path.join('sfx', w.tag) : path.join('music', w.mood ?? 'misc');
        const file = path.join(dir, `fs-${s.id}.mp3`).split(path.sep).join('/');
        const abs = path.join(repoRoot, 'assets', file);
        mkdirSync(path.dirname(abs), { recursive: true });
        if (!existsSync(abs)) {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`download ${url}: ${res.status}`);
          writeFileSync(abs, Buffer.from(await res.arrayBuffer()));
        }
        const a = analyze(abs);
        out.push({
          tag: w.tag,
          ...(w.mood ? { mood: w.mood } : {}),
          file,
          ...a,
          source: {
            site: 'freesound',
            id: s.id,
            name: s.name,
            author: s.username,
            url: `https://freesound.org/s/${s.id}/`,
          },
          license: 'CC0-1.0',
        });
        console.log(
          `  ${kind} ${w.tag}${w.mood ? `/${w.mood}` : ''}: ${s.name} by ${s.username} (${(a.durationMs / 1000).toFixed(1)} s, ${a.lufs} LUFS)`,
        );
      }
      if (picked.length < w.count - have.length) {
        console.log(
          `  ${kind} ${w.tag}: only ${have.length + picked.length} of ${w.count} found for "${w.query}"`,
        );
      }
    }
    writeFileSync(
      manifestPath(kind),
      JSON.stringify({ $comment: manifest.$comment, files: out }, null, 2) + '\n',
    );
    console.log(`${kind}: ${out.length} files -> ${rel(manifestPath(kind))}`);
  }
}
