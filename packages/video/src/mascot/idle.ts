import { seededRandom } from '@reelkit/schema';

/**
 * Idle layer: always on, summed with the pose. All timing is deterministic from the seed.
 */
export interface IdleState {
  /** Vertical scale of the body (breathing). */
  breath: number;
  /** Small vertical bob of the body, px. */
  bob: number;
  /** Whole-character sway, degrees. */
  sway: number;
  /** Extra arm swing, degrees. */
  armSwing: number;
  /** Eyelid closure 0 (open) .. 1 (closed). */
  blink: number;
}

const BLINK_CURVE = [0.45, 1, 1, 0.65, 0.3, 0.1];

/** Blink schedule: irregular intervals (2-5.5 s at 30 fps), sometimes a double blink. */
function blinkAt(frame: number, seed: string): number {
  const rnd = seededRandom(seed, 'blink');
  let start = Math.floor(18 + rnd() * 40);
  while (start <= frame) {
    const d = frame - start;
    if (d < BLINK_CURVE.length) return BLINK_CURVE[d] ?? 0;
    start += rnd() < 0.2 ? BLINK_CURVE.length + 3 : Math.floor(60 + rnd() * 105);
  }
  return 0;
}

export function idleAt(frame: number, fps: number, seed: string): IdleState {
  const t = frame / fps;
  const phase = seededRandom(seed, 'idle-phase')() * Math.PI * 2;
  const breathWave = Math.sin((t * 2 * Math.PI) / 2.7 + phase);
  return {
    breath: 1 + 0.014 * breathWave,
    bob: -3 * breathWave,
    sway: 1.2 * Math.sin((t * 2 * Math.PI) / 4.1 + phase * 0.5),
    armSwing: 2.5 * Math.sin((t * 2 * Math.PI) / 3.3 + phase * 1.3),
    blink: blinkAt(frame, seed),
  };
}
