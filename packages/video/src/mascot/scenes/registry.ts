import type { CutoutPalette } from '@reelkit/brand';
import type { AltScene } from '@reelkit/schema';
import type { TalkSpan } from '../InvoiceRoll';
import { Reading } from './Reading';

/**
 * Rare alternative mascot scenes (D-032): a set piece that replaces the standard mascot for
 * one beat (at most one per reel). New scenes (desk, card terminal...) are added here and to
 * `AltScene` in @reelkit/schema.
 */
export interface AltSceneProps {
  p: CutoutPalette;
  talk: TalkSpan[];
  durationInFrames: number;
  seed: string;
  /** Same size as the standard mascot, so the flip swaps them in place. */
  width: number;
}

export const ALT_SCENES: Record<AltScene, React.FC<AltSceneProps>> = {
  reading: Reading,
};
