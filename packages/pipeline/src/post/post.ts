import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { MascotPlan, Post, ReelTimeline, Script, type PostStatus } from '@reelkit/schema';
import { alignAudio, type AlignReport } from '../align/align';
import { planMascot } from '../mascot/plan';
import { contentDir, rel, repoRoot } from '../paths';
import type { WhisperModelName } from '../tools/registry';
import { speechMap, spokenText, type SpeechUnit } from '../tts/pronounce';
import { houseVoice, providerOf } from '../tts/voice';

/**
 * A post folder, content/posts/<id>/: post.json and script.json written by Claude Code, then
 * voice.wav (tts), words.json (align) and out/reel.mp4 (render), each step reading the
 * previous files only.
 */
export function postPaths(id: string) {
  const dir = path.join(contentDir, 'posts', id);
  return {
    dir,
    post: path.join(dir, 'post.json'),
    script: path.join(dir, 'script.json'),
    voice: path.join(dir, 'voice.wav'),
    words: path.join(dir, 'words.json'),
    mascot: path.join(dir, 'mascot.json'),
    reel: path.join(dir, 'out', 'reel.mp4'),
  };
}

function readJson(file: string): unknown {
  if (!existsSync(file)) throw new Error(`Missing ${rel(file)}`);
  return JSON.parse(readFileSync(file, 'utf8'));
}

export function loadPost(id: string): { post: Post; script: Script } {
  const p = postPaths(id);
  const post = Post.parse(readJson(p.post));
  const script = Script.parse(readJson(p.script));
  if (post.id !== id || script.postId !== id) {
    throw new Error(
      `Post id mismatch in ${rel(p.dir)}: folder, post.json and script.json must agree`,
    );
  }
  return { post, script };
}

/** Moves the post forward. Claude Code never sets approved, published or rejected. */
export function setStatus(
  id: string,
  status: Extract<PostStatus, 'scripted' | 'rendered' | 'ready-for-review'>,
): void {
  const p = postPaths(id);
  const post = Post.parse(readJson(p.post));
  writeFileSync(p.post, JSON.stringify({ ...post, status }, null, 2) + '\n');
}

/** Screen units of every beat, tagged with the beat id, in reading order. */
export function beatUnits(script: Script): Array<SpeechUnit & { beat: string }> {
  return script.beats.flatMap((b) => speechMap(b.say).map((u) => ({ ...u, beat: b.id })));
}

/** One request to the house voice for the whole script (D-029: about 10 requests a day). */
export async function ttsPost(id: string): Promise<void> {
  const { script } = loadPost(id);
  const voice = houseVoice();
  const text = spokenText(beatUnits(script));
  const r = await providerOf(voice).synthesize({
    text,
    out: postPaths(id).voice,
    voice: voice.voice,
    style: voice.style,
  });
  console.log(`${voice.voice}: ${(r.durationMs / 1000).toFixed(1)} s -> ${rel(r.file)}`);
}

export async function alignPost(id: string, model: WhisperModelName): Promise<AlignReport> {
  const { script } = loadPost(id);
  const p = postPaths(id);
  if (!existsSync(p.voice)) throw new Error(`No voice yet: run \`pnpm pipeline tts ${id}\``);
  return alignAudio({ audio: p.voice, units: beatUnits(script), out: p.words, model });
}

/** Builds the timeline the Reel composition renders. */
export function timelineOf(id: string, audio: string): ReelTimeline {
  const { script } = loadPost(id);
  const report = readJson(postPaths(id).words) as AlignReport;
  const beats = script.beats.map((b) => {
    const units = report.screen.filter((u) => u.beat === b.id);
    if (units.length === 0) throw new Error(`Beat ${b.id} has no timed words: re-run align`);
    return {
      id: b.id,
      palette: b.palette,
      highlight: b.highlight,
      pose: b.mascot?.pose,
      startMs: units[0]!.startMs,
      endMs: 0,
      units: units.map((u) => ({ text: u.text, startMs: u.startMs, endMs: u.endMs })),
    };
  });
  beats.forEach((b, i) => (b.endMs = beats[i + 1]?.startMs ?? report.durationMs));
  // The voice speaks between pauses: those stretches move the mouth.
  const speech: Array<{ startMs: number; endMs: number }> = [];
  for (const w of report.words) {
    const last = speech.at(-1);
    const pauseBetween =
      last && report.pauses.some((q) => q.startMs >= last.endMs - 30 && q.endMs <= w.startMs + 30);
    if (last && !pauseBetween) last.endMs = w.endMs;
    else speech.push({ startMs: w.startMs, endMs: w.endMs });
  }
  return ReelTimeline.parse({
    postId: id,
    kicker: script.kicker,
    audio,
    durationMs: report.durationMs,
    beats,
    speech,
  });
}

/**
 * Renders out/reel.mp4: copies the voice into the Remotion public folder (assets/.scratch,
 * gitignored), writes the timeline as props and runs the Reel composition.
 */
export function renderPost(id: string, opts: { scale?: number } = {}): void {
  const p = postPaths(id);
  const audio = `.scratch/${id}/voice.wav`;
  const publicCopy = path.join(repoRoot, 'assets', audio);
  mkdirSync(path.dirname(publicCopy), { recursive: true });
  copyFileSync(p.voice, publicCopy);
  const timeline = timelineOf(id, audio);
  const props = path.join(repoRoot, 'packages', 'pipeline', 'out', 'render', `${id}.json`);
  mkdirSync(path.dirname(props), { recursive: true });
  writeFileSync(props, JSON.stringify(timeline));
  mkdirSync(path.dirname(p.reel), { recursive: true });
  const args = ['exec', 'remotion', 'render', 'Reel', p.reel, `--props=${props}`];
  if (opts.scale) args.push(`--scale=${opts.scale}`);
  const res = spawnSync('pnpm', args, {
    cwd: path.join(repoRoot, 'packages', 'video'),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (res.status !== 0) throw new Error('Remotion render failed');
  if (!opts.scale) setStatus(id, 'rendered');
  console.log(`-> ${rel(p.reel)}`);
}

/**
 * Plans the mascot of a post (D-032) and writes mascot.json. Throws with every problem the
 * planner found; warnings (a trigger without room) are printed.
 */
export function mascotPost(id: string): MascotPlan {
  const { script } = loadPost(id);
  const report = readJson(postPaths(id).words) as AlignReport;
  const { plan, problems, warnings } = planMascot({ script, report, seed: id });
  for (const w of warnings) console.log(`  warning: ${w}`);
  if (problems.length > 0) {
    throw new Error(`mascot plan of ${id}:\n  ${problems.join('\n  ')}`);
  }
  writeFileSync(postPaths(id).mascot, JSON.stringify(plan, null, 2) + '\n');
  return plan;
}
