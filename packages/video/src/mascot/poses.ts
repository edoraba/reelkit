import { spring } from 'remotion';

/**
 * Poses as rotations (degrees) of the arm segments: [upper, lower]. 0 = arm hanging down,
 * positive = clockwise. The left arm goes outward with positive angles, the right with negative.
 * Phase 0 has only two poses; the full library (point-left, shrug, facepalm...) is phase 2.
 */
export interface Pose {
  armL: readonly [number, number];
  armR: readonly [number, number];
}

export const poses = {
  neutral: { armL: [24, -12], armR: [-24, 12] },
  'arms-up': { armL: [122, 34], armR: [-122, -34] },
} as const satisfies Record<string, Pose>;

export type PoseName = keyof typeof poses;
export type MouthShape = 'smile' | 'open';

export interface PoseCue {
  at: number;
  pose: PoseName;
  mouth?: MouthShape;
  /** Raise the brows (surprise, excitement). */
  browsUp?: boolean;
}

const ANTICIPATION_FRAMES = 3;
const ANTICIPATION_AMOUNT = 0.08;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mix(a: Pose, b: Pose, t: number): Pose {
  return {
    armL: [lerp(a.armL[0], b.armL[0], t), lerp(a.armL[1], b.armL[1], t)],
    armR: [lerp(a.armR[0], b.armR[0], t), lerp(a.armR[1], b.armR[1], t)],
  };
}

/**
 * Pose at `frame` from a list of cues: spring with slight overshoot into each new pose,
 * plus a small anticipation (moving the other way) in the frames before the change.
 */
export function poseAt(cues: PoseCue[], frame: number, fps: number): { pose: Pose; cue: PoseCue } {
  const sorted = [...cues].sort((a, b) => a.at - b.at);
  let index = 0;
  for (let i = 0; i < sorted.length; i++) if (sorted[i]!.at <= frame) index = i;
  const cue = sorted[index]!;
  const prev = sorted[index - 1];
  const next = sorted[index + 1];

  const target: Pose = poses[cue.pose];
  let pose: Pose = target;
  if (prev && frame >= cue.at) {
    const t = spring({
      frame: frame - cue.at,
      fps,
      config: { damping: 10, stiffness: 150, mass: 0.7 },
    });
    pose = mix(poses[prev.pose], target, t);
  }

  if (next && frame >= next.at - ANTICIPATION_FRAMES && frame < next.at) {
    const k = (frame - (next.at - ANTICIPATION_FRAMES)) / ANTICIPATION_FRAMES;
    pose = mix(pose, poses[next.pose], -ANTICIPATION_AMOUNT * k);
  }
  return { pose, cue };
}
