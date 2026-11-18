import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { postPaths } from '../post/post';
import { rel, repoRoot } from '../paths';
import { bin } from '../tools/registry';
import { analyze, readManifest, search, type Wanted } from './library';
import { mixSound, type SoundPlan } from './sound';

/**
 * Music listening test (D-034): CC0 loops of several genres from Freesound, each played alone
 * and mixed under the voice of a rendered post, on one page with keep and drop buttons. The
 * choice goes back into assets/music (kept) and assets/music/rejected.json (never fetched again).
 *   pnpm pipeline music-test <post id> [--force]
 */

/** Genres to try: the query, plus a Freesound tag when the text alone is too vague. */
export const MUSIC_TRIALS: Array<Wanted & { mood: string }> = [
  { tag: 'music', mood: 'ukulele', query: 'ukulele', duration: [12, 150], count: 3 },
  { tag: 'music', mood: 'marimba', query: 'marimba', duration: [12, 150], count: 3 },
  { tag: 'music', mood: 'upbeat', query: 'happy upbeat', duration: [12, 150], count: 3 },
  { tag: 'music', mood: 'acoustic', query: 'acoustic guitar happy', duration: [12, 150], count: 3 },
  { tag: 'music', mood: 'piano', query: 'piano playful', duration: [12, 150], count: 3 },
  { tag: 'music', mood: 'lofi', query: 'lofi', duration: [12, 150], count: 3 },
  { tag: 'music', mood: 'funk', query: 'funk groove', duration: [12, 150], count: 3 },
  { tag: 'music', mood: 'kalimba', query: 'kalimba', duration: [12, 150], count: 3 },
  {
    tag: 'music',
    mood: 'glockenspiel',
    query: 'glockenspiel xylophone',
    duration: [12, 150],
    count: 3,
  },
  { tag: 'music', mood: 'whistle', query: 'whistle melody', duration: [12, 150], count: 3 },
  { tag: 'music', mood: 'electronic', query: 'electronic pop', duration: [12, 150], count: 3 },
  { tag: 'music', mood: 'jazz', query: 'jazz', duration: [12, 150], count: 3 },
  { tag: 'music', mood: 'corporate', query: 'corporate positive', duration: [12, 150], count: 3 },
  { tag: 'music', mood: 'pizzicato', query: 'pizzicato', duration: [12, 150], count: 3 },
];

/** Names that are not a light explainer bed (scary scores, one-shot transitions). */
const OFF_TONE = /horror|scary|dark|suspense|transition|crash|cymbal|riser|impact/i;

interface Candidate {
  id: number;
  mood: string;
  name: string;
  author: string;
  url: string;
  /** Absolute path of the downloaded loop. */
  file: string;
  durationMs: number;
  lufs: number;
  inLibrary: boolean;
}

export const rejectedPath = path.join(repoRoot, 'assets', 'music', 'rejected.json');

export function readRejected(): number[] {
  return existsSync(rejectedPath)
    ? (JSON.parse(readFileSync(rejectedPath, 'utf8')) as { ids: number[] }).ids
    : [];
}

export async function musicTest(postId: string, opts: { force?: boolean } = {}): Promise<string> {
  const key = process.env.FREESOUND_API_KEY;
  if (!key) throw new Error('FREESOUND_API_KEY missing in .env');
  const outDir = path.join(repoRoot, 'packages', 'pipeline', 'out', 'music-test');
  mkdirSync(outDir, { recursive: true });
  const library = readManifest('music').files;
  const rejected = new Set(readRejected());
  // Library loops are copied next to the page, so the folder can be served on its own.
  const candidates: Candidate[] = library.map((f) => {
    const file = path.join(outDir, `${f.mood ?? 'misc'}-fs-${f.source.id}.mp3`);
    copyFileSync(path.join(repoRoot, 'assets', f.file), file);
    return {
      id: f.source.id,
      mood: f.mood ?? 'misc',
      name: f.source.name,
      author: f.source.author,
      url: f.source.url,
      file,
      durationMs: f.durationMs,
      lufs: f.lufs,
      inLibrary: true,
    };
  });
  const seen = new Set(candidates.map((c) => c.id));
  for (const w of MUSIC_TRIALS) {
    const found = (await search(w, key)).filter(
      (s) => !seen.has(s.id) && !rejected.has(s.id) && !OFF_TONE.test(s.name),
    );
    for (const s of found.slice(0, w.count)) {
      const url = s.previews['preview-hq-mp3'];
      if (!url) continue;
      seen.add(s.id);
      const file = path.join(outDir, `${w.mood}-fs-${s.id}.mp3`);
      if (!existsSync(file) || opts.force) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`download ${url}: ${res.status}`);
        writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      }
      const a = analyze(file);
      candidates.push({
        id: s.id,
        mood: w.mood,
        name: s.name,
        author: s.username,
        url: `https://freesound.org/s/${s.id}/`,
        file,
        durationMs: a.durationMs,
        lufs: a.lufs,
        inLibrary: false,
      });
      console.log(
        `  ${w.mood}: ${s.name} by ${s.username} (${(a.durationMs / 1000).toFixed(1)} s)`,
      );
    }
  }
  // Each loop under the voice: the post's sound plan with the music swapped.
  const p = postPaths(postId);
  if (!existsSync(p.sound)) throw new Error(`No sound.json: run "pnpm pipeline sound ${postId}"`);
  const plan = JSON.parse(readFileSync(p.sound, 'utf8')) as SoundPlan;
  const voice = path.join(repoRoot, 'assets', '.scratch', postId, 'voice.wav');
  if (!existsSync(voice))
    throw new Error(`No stretched voice: run "pnpm pipeline render ${postId}" once`);
  for (const c of candidates) {
    const wav = path.join(outDir, `mix-${c.id}.wav`);
    const mp3 = path.join(outDir, `mix-${c.id}.mp3`);
    if (existsSync(mp3) && !opts.force) continue;
    mixSound(
      voice,
      {
        ...plan,
        music: { ...plan.music!, file: c.file, gainDb: Math.round((-33 - c.lufs) * 10) / 10 },
      },
      wav,
    );
    const enc = spawnSync(bin.ffmpeg, ['-v', 'error', '-y', '-i', wav, '-b:a', '192k', mp3]);
    if (enc.status !== 0) throw new Error(`mp3 encode failed for ${c.id}`);
  }
  const page = path.join(outDir, 'index.html');
  writeFileSync(page, html(postId, candidates, outDir));
  console.log(`${candidates.length} loops -> ${rel(page)}`);
  return page;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function html(postId: string, list: Candidate[], outDir: string): string {
  const src = (f: string) => path.relative(outDir, f).split(path.sep).join('/');
  const cards = list
    .map(
      (c) => `
  <article data-id="${c.id}">
    <header>
      <span class="mood">${esc(c.mood)}</span>${c.inLibrary ? '<span class="lib">in libreria</span>' : ''}
      <h2>${esc(c.name)}</h2>
      <p>${esc(c.author)} · ${(c.durationMs / 1000).toFixed(0)} s · <a href="${c.url}" target="_blank" rel="noreferrer">Freesound #${c.id}</a></p>
    </header>
    <label>Nel reel <audio controls preload="none" src="mix-${c.id}.mp3"></audio></label>
    <label>Da sola <audio controls preload="none" src="${esc(src(c.file))}"></audio></label>
    <div class="pick">
      <button data-v="keep">Tieni</button><button data-v="drop">Scarta</button>
    </div>
  </article>`,
    )
    .join('');
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Musiche reel</title>
<style>
  :root { --bg: #f4f6fb; --card: #fff; --ink: #14182b; --muted: #5b6075; --blue: #1f4bff; --red: #c62828; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.45 system-ui, sans-serif; }
  main { max-width: 980px; margin: 0 auto; padding: 24px 16px 120px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .intro { color: var(--muted); margin: 0 0 20px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
  article { background: var(--card); border-radius: 12px; padding: 14px; border: 2px solid transparent; }
  article.keep { border-color: var(--blue); }
  article.drop { opacity: .45; border-color: var(--red); }
  h2 { font-size: 15px; margin: 6px 0 2px; overflow-wrap: anywhere; }
  header p { margin: 0 0 10px; color: var(--muted); font-size: 13px; }
  .mood, .lib { display: inline-block; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; padding: 2px 8px; border-radius: 99px; background: #e5e9ff; color: var(--blue); margin-right: 6px; }
  .lib { background: #fff1d6; color: #8a5a00; }
  label { display: block; font-size: 12px; color: var(--muted); margin-bottom: 6px; }
  audio { width: 100%; height: 34px; }
  .pick { display: flex; gap: 8px; margin-top: 8px; }
  .pick button { flex: 1; padding: 8px; border-radius: 8px; border: 1px solid #ccd; background: #fff; cursor: pointer; font: inherit; }
  article.keep [data-v=keep] { background: var(--blue); color: #fff; border-color: var(--blue); }
  article.drop [data-v=drop] { background: var(--red); color: #fff; border-color: var(--red); }
  footer { position: fixed; left: 0; right: 0; bottom: 0; background: var(--ink); color: #fff; padding: 12px 16px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  footer code { flex: 1; min-width: 200px; font-size: 12px; overflow-wrap: anywhere; }
  footer button { padding: 8px 14px; border-radius: 8px; border: 0; background: #fff; color: var(--ink); font: inherit; cursor: pointer; }
</style>
</head>
<body>
<main>
  <h1>Musiche per i reel</h1>
  <p class="intro">${list.length} loop CC0 da Freesound. "Nel reel" è il mix vero di ${esc(postId)}: voce, SFX e musica col ducking a -14 LUFS. "Da sola" è il loop originale. Segna Tieni o Scarta, poi copia la selezione e incollala in chat.</p>
  <div class="grid">${cards}
  </div>
</main>
<footer><code id="out">nessuna scelta</code><button id="copy">Copia selezione</button></footer>
<script>
  const state = {};
  try { Object.assign(state, JSON.parse(localStorage.getItem('music-pick') || '{}')); } catch {}
  const out = document.getElementById('out');
  function render() {
    for (const a of document.querySelectorAll('article')) a.className = state[a.dataset.id] || '';
    const ids = (v) => Object.keys(state).filter((k) => state[k] === v).join(',');
    out.textContent = 'tieni: ' + (ids('keep') || '-') + ' | scarta: ' + (ids('drop') || '-');
    try { localStorage.setItem('music-pick', JSON.stringify(state)); } catch {}
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.pick button');
    if (!b) return;
    const id = b.closest('article').dataset.id;
    state[id] = state[id] === b.dataset.v ? undefined : b.dataset.v;
    if (!state[id]) delete state[id];
    render();
  });
  document.addEventListener('play', (e) => {
    for (const a of document.querySelectorAll('audio')) if (a !== e.target) a.pause();
  }, true);
  document.getElementById('copy').onclick = () => navigator.clipboard.writeText(out.textContent);
  render();
</script>
</body>
</html>
`;
}
