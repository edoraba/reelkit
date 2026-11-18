import type { Eyes, MascotPlan, PropKind } from '@reelkit/schema';
import { crouchLegs, hopAt, standLegs, walkCycle, type LegPose } from './gait';
import { poses, type PoseCue, type PoseName } from './poses';

/**
 * From mascot.json to what the mascot looks like at one frame (D-032). The plan already holds
 * every decision; this file only interpolates: walking, hops, eyes, lean, gaze, props.
 */
export interface MascotState {
  /** Feet center on the lane, frame px. */
  x: number;
  depth: 'front' | 'behind';
  eyes: Eyes;
  lean: number;
  legs: LegPose;
  squash: number;
  swing: number;
  gaze: { x: number; y: number };
  hold: { left?: PropKind; right?: PropKind };
}

/** Where the face is (frame px, 420 px wide mascot with the feet on y 1634). */
export const FACE_Y = 1300;
const LANE_START_X = 540;
const STEP_MS = 560;

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** Pose cues for InvoiceRoll (frames); unknown pose names fall back to idle. */
export function poseCues(plan: MascotPlan, fps: number): PoseCue[] {
  const cues = plan.cues.map((c) => ({
    at: Math.round((c.atMs / 1000) * fps),
    pose: (c.pose in poses ? c.pose : 'neutral') as PoseName,
  }));
  return cues.length > 0 && cues[0]!.at === 0 ? cues : [{ at: 0, pose: 'neutral' }, ...cues];
}

function gazeAt(plan: MascotPlan, ms: number, x: number): { x: number; y: number } {
  const target = [...plan.gaze].reverse().find((g) => g.atMs <= ms)?.target ?? 'camera';
  if (target === 'camera') return { x: 0, y: 0 };
  const point =
    target === 'headline' ? { x: 460, y: 700 } : target === 'label' ? { x: 520, y: 760 } : target;
  const dx = point.x - x;
  const dy = point.y - FACE_Y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

export function mascotAt(plan: MascotPlan, frame: number, fps: number): MascotState {
  // Times are read on twos, like the rest of the cut-paper motion.
  const ms = ((Math.floor(frame / 2) * 2) / fps) * 1000;
  let x = LANE_START_X;
  let depth: 'front' | 'behind' = 'front';
  let legs = standLegs();
  let squash = 0;
  let walking = 0;
  for (const m of plan.moves) {
    if (m.atMs > ms) break;
    const from = x;
    const t = m.durationMs > 0 ? Math.min(1, (ms - m.atMs) / m.durationMs) : 1;
    if (m.gait === 'walk') {
      x = from + (m.x - from) * ease(t);
      depth = m.depth;
      if (t < 1) {
        legs = walkCycle(((ms - m.atMs) % STEP_MS) / STEP_MS);
        walking = Math.sign(m.x - from);
      } else legs = standLegs();
    } else if (m.gait === 'hop') {
      x = m.x;
      depth = m.depth;
      if (t < 1) {
        const h = hopAt(t);
        squash = h.squash;
        legs = { ...crouchLegs(h.squash > 0 ? h.squash * 5 : 0), lift: h.lift };
      } else legs = standLegs();
    } else {
      x = m.x;
      depth = m.depth;
      legs = standLegs();
    }
  }

  const cue = [...plan.cues].reverse().find((c) => c.atMs <= ms);
  const prev = cue ? plan.cues[plan.cues.indexOf(cue) - 1] : undefined;
  const k = cue ? Math.min(1, (ms - cue.atMs) / 200) : 1;
  const baseLean = (prev?.lean ?? 0) + ((cue?.lean ?? 0) - (prev?.lean ?? 0)) * ease(k);

  // Foot tap: the right foot bounces during a tap gag.
  const tap = plan.gags.find((g) => g.kind === 'tap' && g.fromMs <= ms && ms < g.toMs);
  if (tap && walking === 0) {
    const up = Math.max(0, Math.sin(((ms - tap.fromMs) / 200) * Math.PI));
    legs = { ...legs, r: [legs.r[0] - 10 * up, 18 * up] };
  }

  const hold: MascotState['hold'] = {};
  for (const p of plan.props) {
    if (p.fromMs <= ms && ms < p.toMs) hold[p.hand] = p.prop;
  }

  return {
    x,
    depth,
    eyes: cue?.eyes ?? 'open',
    lean: baseLean + walking * 5,
    legs,
    squash,
    swing: walking !== 0 ? 14 * Math.sin(((ms % STEP_MS) / STEP_MS) * Math.PI * 2) : 0,
    gaze: gazeAt(plan, ms, x),
    hold,
  };
}
