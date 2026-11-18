import { z } from 'zod';
import { PostId } from './post';

/**
 * mascot.json: the mascot choreography of a post, written by `pipeline mascot` and executed by
 * the Reel composition (design: docs/superpowers/specs/2026-11-18-mascot-choreography-design.md).
 * Every time is in the final timeline, after the pause stretches, except `stretch` itself,
 * which is in the original voice time.
 */

/** Eye shapes (the character has dot eyes and no eyebrows). */
export const Eyes = z.enum(['open', 'happy', 'wide', 'closed', 'half']);
export type Eyes = z.infer<typeof Eyes>;

/** Things the mascot can hold in a hand. */
export const PropKind = z.enum([
  'scissors',
  'stamp',
  'calculator',
  'magnifier',
  'letter',
  'wateringCan',
  'sheet',
]);
export type PropKind = z.infer<typeof PropKind>;

/** Actions a beat can ask the mascot for. */
export const MascotAction = z.enum(['stamp', 'type', 'send', 'inspect', 'point', 'water', 'hide']);
export type MascotAction = z.infer<typeof MascotAction>;

/** Rare alternative scenes replacing the standard mascot for one beat. */
export const AltScene = z.enum(['reading']);
export type AltScene = z.infer<typeof AltScene>;

/** Mascot gestures that start a scene change. */
export const Trigger = z.enum(['scissors', 'blow', 'pull']);
export type Trigger = z.infer<typeof Trigger>;

const GazeTarget = z.union([
  z.enum(['camera', 'headline', 'label']),
  z.object({ x: z.number(), y: z.number() }),
]);

export const MascotPlan = z.object({
  postId: PostId,
  /** Fingerprint of script.json and words.json the plan was made from (render refuses a stale plan). */
  inputs: z.string().optional(),
  /** Silence inserted into the voice before a mascot-triggered transition (original time). */
  stretch: z.array(z.object({ atMs: z.number(), addMs: z.number().min(0).max(400) })),
  moves: z.array(
    z.object({
      atMs: z.number(),
      durationMs: z.number().min(0),
      /** Feet center on the lane, frame px. */
      x: z.number(),
      gait: z.enum(['stand', 'walk', 'hop']),
      depth: z.enum(['front', 'behind']),
    }),
  ),
  cues: z.array(
    z.object({
      atMs: z.number(),
      pose: z.string(),
      eyes: Eyes,
      /** Body tilt over the feet, degrees, positive toward the right. */
      lean: z.number(),
    }),
  ),
  gaze: z.array(z.object({ atMs: z.number(), target: GazeTarget })),
  props: z.array(
    z.object({
      fromMs: z.number(),
      toMs: z.number(),
      hand: z.enum(['left', 'right']),
      prop: PropKind,
    }),
  ),
  gags: z.array(
    z.object({
      fromMs: z.number(),
      toMs: z.number(),
      kind: z.string(),
      source: z.enum(['auto', 'script']),
      beat: z.string(),
      /** Motif id or office object key the gag acts on. */
      target: z.string().optional(),
      /** Tag for the future sfx-plan (stamp, typing, swish...). */
      sfx: z.string().optional(),
    }),
  ),
  transitions: z.array(
    z.object({
      /** First beat of the incoming scene. */
      beat: z.string(),
      kind: z.enum(['bloom', 'cut', 'pull']),
      trigger: Trigger.optional(),
      /** pull: the side the new sheet comes from (the mascot runs to the other one). */
      side: z.enum(['left', 'right']).optional(),
    }),
  ),
  alternate: z.object({ beat: z.string(), scene: AltScene }).optional(),
});
export type MascotPlan = z.infer<typeof MascotPlan>;
