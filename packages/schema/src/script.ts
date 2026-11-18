import { z } from 'zod';
import { AltScene, MascotAction, Trigger } from './mascot';
import { PostFormat, PostId, PostStatus } from './post';

/**
 * script.json: the reel as a list of beats (guidelines/generation.md). Only screen text is
 * written; the voice text comes from the pronunciation pass and every timing from the
 * alignment, so nothing here is in seconds.
 */

/** Words as the guidelines count them: whitespace separated, punctuation ignored. */
export const wordsOf = (text: string): string[] =>
  text
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}€%]+|[^\p{L}\p{N}€%]+$/gu, ''))
    .filter(Boolean);

/** True when a screen text unit holds the highlighted word, also after an elision (l'autofattura). */
export const holdsHighlight = (text: string, highlight: string): boolean =>
  wordsOf(text).some(
    (w) => w === highlight || (/['’]/.test(w) && w.split(/['’]/).pop() === highlight),
  );

export const Beat = z
  .object({
    id: z.string().regex(/^b\d{2}$/, 'expected b01, b02...'),
    /** Screen text of the beat, Italian. TD17 and 49,99 € stay as written; the voice spells them. */
    say: z.string().min(1),
    /** Cut-paper palette key (@reelkit/brand cutoutPalettes): blu, notte, azzurro, ghiaccio, viola, lavanda. */
    palette: z.string(),
    /** The one highlighted word of the beat, as it appears in `say` (punctuation excluded). */
    highlight: z.string().optional(),
    /** What the mascot does in the beat (idle and automatic behaviors if absent). */
    mascot: z
      .object({
        pose: z.string().optional(),
        /** An authored gag (design section 5). */
        action: MascotAction.optional(),
        /** Word of `say` the action lands on. */
        at: z.string().optional(),
        /** A rare alternative scene replacing the mascot for this beat (at most one per reel). */
        scene: AltScene.optional(),
      })
      .optional(),
    /** The scene change into this beat, started by a mascot gesture (at most 2 per reel). */
    transition: z.object({ trigger: Trigger }).optional(),
  })
  .superRefine((beat, ctx) => {
    const words = wordsOf(beat.say);
    if (words.length < 2 || words.length > 14) {
      ctx.addIssue({
        code: 'custom',
        message: `beat ${beat.id}: ${words.length} words, keep 4 to 14 (CTA and closings may be shorter)`,
      });
    }
    if (beat.highlight && !holdsHighlight(beat.say, beat.highlight)) {
      ctx.addIssue({
        code: 'custom',
        message: `beat ${beat.id}: highlight "${beat.highlight}" is not a word of "${beat.say}"`,
      });
    }
    if (beat.mascot?.scene && beat.mascot.action) {
      ctx.addIssue({
        code: 'custom',
        message: `beat ${beat.id}: an alternative scene replaces the mascot, it cannot also have an action`,
      });
    }
    const at = beat.mascot?.at;
    if (at && !holdsHighlight(beat.say, at)) {
      ctx.addIssue({
        code: 'custom',
        message: `beat ${beat.id}: mascot.at "${at}" is not a word of "${beat.say}"`,
      });
    }
  });
export type Beat = z.infer<typeof Beat>;

export const Script = z
  .object({
    postId: PostId,
    /** Fixed header of reels under 40 s: the rubric kicker (published, Italian). */
    kicker: z.string(),
    beats: z.array(Beat).min(2),
  })
  .superRefine((script, ctx) => {
    const ids = script.beats.map((b) => b.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: 'custom', message: 'beat ids must be unique' });
    }
    const scenes = script.beats.filter((b) => b.mascot?.scene);
    if (scenes.length > 1) {
      ctx.addIssue({ code: 'custom', message: 'at most one alternative mascot scene per reel' });
    }
    const triggers = script.beats.filter((b) => b.transition);
    if (triggers.length > 2) {
      ctx.addIssue({ code: 'custom', message: 'at most 2 mascot-triggered transitions per reel' });
    }
    if (triggers.filter((b) => b.transition?.trigger === 'pull').length > 1) {
      ctx.addIssue({ code: 'custom', message: 'at most one pull transition per reel' });
    }
    if (script.beats[0]?.transition) {
      ctx.addIssue({ code: 'custom', message: 'the first beat has no transition to trigger' });
    }
  });
export type Script = z.infer<typeof Script>;

/** post.json: state and published text of a post. */
export const Post = z.object({
  id: PostId,
  /** Publication date, yyyy-mm-dd. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: PostStatus,
  format: PostFormat,
  /** Rubric name as published (guidelines/strategy.md). */
  rubric: z.string(),
  title: z.string(),
  caption: z.string(),
  hashtags: z
    .array(z.string().regex(/^#\S+$/))
    .min(3)
    .max(5),
  firstComment: z.string().optional(),
  /** Official sources behind every regulatory statement, with the date they were checked. */
  sources: z.array(z.object({ title: z.string(), url: z.url(), checked: z.string() })),
  /** Human note when rejected: what to redo. */
  note: z.string().optional(),
});
export type Post = z.infer<typeof Post>;
