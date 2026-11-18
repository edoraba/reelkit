/**
 * Mascot rig contract. Every animated part is an SVG group whose `id` is one of these names,
 * so an SVG exported from Figma with the same layer names can replace the provisional
 * drawing without code changes (loader comes in phase 2). Documented in guidelines/brand.md.
 *
 * Coordinates are in the mascot viewBox (400 x 600). Pivots are the rotation centers.
 */
export const RIG_VIEWBOX = { width: 400, height: 600 } as const;

/**
 * Layer ids of the invoice roll, as in the guidelines/brand.md table (the reference). The
 * provisional mascot's pupils, lids and brows are gone: the character has dot eyes and no
 * eyebrows (D-016, D-018). Legs have a shin segment and each hand a prop slot (D-032).
 */
export const RIG_LAYERS = [
  'mascot',
  'leg-l',
  'leg-r',
  'shin-l',
  'shin-r',
  'body',
  'roll',
  'arm-l-upper',
  'arm-l-lower',
  'hand-l',
  'prop-l',
  'arm-r-upper',
  'arm-r-lower',
  'hand-r',
  'prop-r',
  'sheet',
  'head',
  'eye-l',
  'eye-r',
  'mouth',
] as const;
export type RigLayer = (typeof RIG_LAYERS)[number];

export const pivots = {
  /** Whole character sways around the feet. */
  mascot: { x: 200, y: 580 },
  /** Breathing scales the body from its bottom edge. */
  body: { x: 200, y: 472 },
  'arm-l-upper': { x: 88, y: 262 },
  'arm-r-upper': { x: 312, y: 262 },
  eyeL: { x: 162, y: 212 },
  eyeR: { x: 238, y: 212 },
  mouth: { x: 200, y: 284 },
} as const;

/** Segment lengths of the tube arms. */
export const ARM = { upper: 78, lower: 70, handRadius: 24 } as const;
export const EYE = { rx: 30, ry: 36, pupil: 13, gazeRange: 10 } as const;
