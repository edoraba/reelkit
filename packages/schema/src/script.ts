import { z } from 'zod';
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
    /** Mascot pose for the beat (idle if absent). */
    mascot: z
      .object({
        pose: z.string(),
        expression: z.string().optional(),
      })
      .optional(),
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
