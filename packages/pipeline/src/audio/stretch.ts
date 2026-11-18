import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { bin } from '../tools/registry';
import { wavInfo } from '../tts/types';

/**
 * Pause stretches (D-032): silence inserted into the voice before a mascot-triggered
 * transition, so the gesture has room. `atMs` is in the original voice time.
 */
export interface Stretch {
  atMs: number;
  addMs: number;
}

/** Original time to final time: every insertion at or before `ms` pushes it later. */
export function shiftMs(ms: number, stretch: readonly Stretch[]): number {
  return ms + stretch.filter((s) => s.atMs <= ms).reduce((sum, s) => sum + s.addMs, 0);
}

/**
 * Writes `output`: the voice cut at every `atMs` with `addMs` of silence in between, same
 * sample rate and channels. Without stretches the file is copied.
 */
export function stretchVoice(
  input: string,
  output: string,
  stretch: readonly Stretch[],
): { durationMs: number } {
  mkdirSync(path.dirname(output), { recursive: true });
  const cuts = [...stretch].filter((s) => s.addMs > 0).sort((a, b) => a.atMs - b.atMs);
  if (cuts.length === 0) {
    copyFileSync(input, output);
    return { durationMs: wavInfo(output).durationMs };
  }
  const { sampleRate } = wavInfo(input);
  const parts: string[] = [];
  const labels: string[] = [];
  let from = 0;
  cuts.forEach((c, i) => {
    const t0 = (from / 1000).toFixed(3);
    const t1 = (c.atMs / 1000).toFixed(3);
    parts.push(`[0:a]atrim=start=${t0}:end=${t1},asetpts=PTS-STARTPTS[v${i}]`);
    parts.push(
      `aevalsrc=0:d=${(c.addMs / 1000).toFixed(3)}:s=${sampleRate}:c=mono,aformat=sample_fmts=s16[s${i}]`,
    );
    labels.push(`[v${i}]`, `[s${i}]`);
    from = c.atMs;
  });
  parts.push(`[0:a]atrim=start=${(from / 1000).toFixed(3)},asetpts=PTS-STARTPTS[v${cuts.length}]`);
  labels.push(`[v${cuts.length}]`);
  const graph = `${parts.join(';')};${labels.join('')}concat=n=${labels.length}:v=0:a=1[out]`;
  const res = spawnSync(
    bin.ffmpeg,
    [
      '-v',
      'error',
      '-y',
      '-i',
      input,
      '-filter_complex',
      graph,
      '-map',
      '[out]',
      '-ac',
      '1',
      '-ar',
      String(sampleRate),
      '-c:a',
      'pcm_s16le',
      output,
    ],
    { encoding: 'utf8' },
  );
  if (res.status !== 0) throw new Error(`ffmpeg could not stretch ${input}: ${res.stderr}`);
  return { durationMs: wavInfo(output).durationMs };
}
