import { z } from 'zod';
import { PostId } from './post';

/**
 * Resolved timeline of a reel: the script with every timing filled in by the alignment.
 * Written by `pipeline render`, read by the Remotion `Reel` composition as its props.
 */
const Span = z.object({ startMs: z.number(), endMs: z.number() });

export const TimelineBeat = Span.extend({
  id: z.string(),
  palette: z.string(),
  highlight: z.string().optional(),
  pose: z.string().optional(),
  /** Screen units of the beat ("TD17,"), timed on the words the voice says for them. */
  units: z.array(Span.extend({ text: z.string() })),
});
export type TimelineBeat = z.infer<typeof TimelineBeat>;

export const ReelTimeline = z.object({
  postId: PostId,
  kicker: z.string(),
  /** Voice track, path inside the Remotion public folder. */
  audio: z.string(),
  durationMs: z.number(),
  beats: z.array(TimelineBeat),
  /** Stretches where the voice speaks (mouth moves); outside them the mouth is closed. */
  speech: z.array(Span),
});
export type ReelTimeline = z.infer<typeof ReelTimeline>;
