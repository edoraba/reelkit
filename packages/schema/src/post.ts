import { z } from 'zod';

/**
 * Post lifecycle. Claude Code may move a post forward only up to `ready-for-review`;
 * `approved` and `rejected` are set by the human (planner app or by hand).
 */
export const PostStatus = z.enum([
  'idea',
  'scripted',
  'rendered',
  'ready-for-review',
  'approved',
  'published',
  'rejected',
]);
export type PostStatus = z.infer<typeof PostStatus>;

/** Folder name of a post: `<yyyy-mm-dd>-<slug>`. Also the seed of every random choice. */
export const PostId = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/, 'expected <yyyy-mm-dd>-<slug>');
export type PostId = z.infer<typeof PostId>;

export const PostFormat = z.enum(['reel', 'carousel']);
export type PostFormat = z.infer<typeof PostFormat>;
