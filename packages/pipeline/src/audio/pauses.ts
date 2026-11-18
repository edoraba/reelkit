import { spawnSync } from 'node:child_process';
import { bin } from '../tools/registry';

/** A stretch of silence in an audio file. */
export interface Pause {
  startMs: number;
  endMs: number;
}

/**
 * Silences longer than `minMs` below `noiseDb`, measured by ffmpeg silencedetect. Used to put
 * word boundaries exactly on the pauses of the voice (captions, closed mouth, SFX slots).
 */
export function detectPauses(
  audio: string,
  opts: { noiseDb?: number; minMs?: number } = {},
): { pauses: Pause[]; durationMs: number } {
  const noise = opts.noiseDb ?? -35;
  const min = (opts.minMs ?? 150) / 1000;
  const res = spawnSync(
    bin.ffmpeg,
    [
      '-hide_banner',
      '-i',
      audio,
      '-af',
      `silencedetect=noise=${noise}dB:d=${min}`,
      '-f',
      'null',
      '-',
    ],
    { encoding: 'utf8' },
  );
  if (res.status !== 0) throw new Error(`ffmpeg silencedetect failed on ${audio}: ${res.stderr}`);
  const log = res.stderr;
  const d = /Duration: (\d+):(\d+):([\d.]+)/.exec(log);
  const durationMs = d
    ? Math.round((Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3])) * 1000)
    : 0;
  const pauses: Pause[] = [];
  for (const m of log.matchAll(/silence_(start|end): ([\d.]+)/g)) {
    const t = Math.round(Number(m[2]) * 1000);
    if (m[1] === 'start') pauses.push({ startMs: t, endMs: durationMs });
    else if (pauses.length > 0) pauses[pauses.length - 1]!.endMs = t;
  }
  return { pauses, durationMs };
}
