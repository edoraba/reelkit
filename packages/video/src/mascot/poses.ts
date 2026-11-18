import { spring } from 'remotion';

/**
 * Poses as rotations (degrees) of the arm segments: [upper, lower]. 0 = arm hanging down,
 * positive = clockwise. The left arm goes outward with positive angles, the right with negative.
 * The arms are drawn behind the sheet, so poses keep the hands beside the body, never in front.
 * The drawing is never mirrored: poses that point to a side exist in both versions.
 */
export interface Pose {
  armL: readonly [number, number];
  armR: readonly [number, number];
}

export const poses = {
  neutral: { armL: [24, -12], armR: [-24, 12] },
  'arms-up': { armL: [122, 34], armR: [-122, -34] },
  /** Right arm raised; the character adds the hand oscillation on top. */
  wave: { armL: [24, -12], armR: [-145, -25] },
  /** Right arm up toward the headline. */
  point: { armL: [24, -12], armR: [-158, 8] },
  shrug: { armL: [62, 84], armR: [-62, -84] },
  /** Right hand up beside the head. */
  think: { armL: [24, -12], armR: [-96, -112] },
  /** Right hand forward at the side, holding a prop. */
  hold: { armL: [24, -12], armR: [-48, -52] },
  /** Left arm reaching out to the left (leans on a motif). */
  lean: { armL: [84, 8], armR: [-24, 12] },
  /** Right arm reaching out to the right. */
  'lean-r': { armL: [24, -12], armR: [-84, -8] },
  /** Hands up by the face, peeking from behind a motif. */
  hide: { armL: [138, 58], armR: [-138, -58] },
  /** Right hand holds the calculator; the character adds the tapping on top. */
  type: { armL: [24, -12], armR: [-56, -40] },
  /** Right arm raised with the stamp, before the hit. */
  stamp: { armL: [24, -12], armR: [-128, -24] },
  /** Arms relaxed; the walk swing is added by the character. */
  walk: { armL: [14, -6], armR: [-14, 6] },
  /** Both arms toward the right, pushing. */
  push: { armL: [40, -60], armR: [-88, -6] },
  /** Both arms toward the left, pulling a sheet. */
  pull: { armL: [88, 6], armR: [-40, 60] },
} as const satisfies Record<string, Pose>;

export type PoseName = keyof typeof poses;
export type MouthShape = 'smile' | 'open';

export interface PoseCue {
  at: number;
  pose: PoseName;
  mouth?: MouthShape;
  /** Raise the brows (surprise, excitement). */
  browsUp?: boolean;
  /** Eye shape: open (default) or happy arcs. */
  eyes?: 'open' | 'happy';
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
