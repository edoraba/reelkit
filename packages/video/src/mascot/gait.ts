/**
 * Legs of the invoice roll (D-032): two segments per leg, angles in degrees as for the arms
 * (0 = straight down, positive = clockwise, the left leg goes outward with positive angles).
 * `lift` raises the whole character (px in the 400x600 viewBox).
 */
export interface LegPose {
  l: readonly [hip: number, knee: number];
  r: readonly [hip: number, knee: number];
  lift: number;
}

export const THIGH = 44;
export const SHIN = 44;

export function standLegs(): LegPose {
  return { l: [2.6, 0], r: [-2.6, 0], lift: 0 };
}

/**
 * Walk cycle at `phase` 0..1, one step per half cycle. The character always faces the camera
 * (never mirrored), so it walks sideways like a flat cartoon: the legs lift in turn, knee out
 * and foot up, and the body bobs. Direction comes from the travel and the body lean. The
 * caller steps the phase on twos.
 */
export function walkCycle(phase: number): LegPose {
  const s = Math.sin(phase * Math.PI * 2);
  const up = Math.max(0, s);
  const down = Math.max(0, -s);
  return {
    l: [2.6 + 22 * up, -44 * up],
    r: [-2.6 - 22 * down, 44 * down],
    lift: 4 * Math.abs(s),
  };
}

/**
 * Hop at `t` 0..1: crouch (squash) at take-off, flight, squash again at landing.
 * `lift` in viewBox px, `squash` 0..1 (vertical compression of the body).
 */
export function hopAt(t: number): { lift: number; squash: number } {
  if (t <= 0 || t >= 1) return { lift: 0, squash: 0 };
  if (t < 0.18) return { lift: 0, squash: 0.12 * Math.sin((t / 0.18) * Math.PI) };
  if (t > 0.82) return { lift: 0, squash: 0.14 * Math.sin(((t - 0.82) / 0.18) * Math.PI) };
  const k = (t - 0.18) / 0.64;
  return { lift: 64 * Math.sin(k * Math.PI), squash: -0.05 * Math.sin(k * Math.PI) };
}

/** Bent knees for the hop crouch and the hide pose. */
export function crouchLegs(amount: number): LegPose {
  return { l: [2.6 + 26 * amount, -52 * amount], r: [-2.6 - 26 * amount, 52 * amount], lift: 0 };
}
