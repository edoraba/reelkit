import { refattura } from './tokens';

/**
 * Cut-paper direction (D-020 to D-025): paper colors and palettes. DRAFT until Edoardo approves.
 * Paper colors are the "sheets" scenes are cut from; ultramarine is the Refattura blue and
 * emerald is the app's green stamp, the rest are added for the social style.
 * Rules: never pure white as a background (cream instead); text pairs checked by
 * `pnpm brand:contrast` (min 4.5:1).
 */
export const paper = {
  ultramarine: refattura.inkBlue,
  cream: 'oklch(95% 0.03 90)',
  coral: 'oklch(68% 0.17 35)',
  lemon: 'oklch(90% 0.16 100)',
  emerald: refattura.stampGreen,
  pink: 'oklch(83% 0.09 5)',
  ink: refattura.graphite,
  white: refattura.sheetWhite,
} as const;

export type PaperName = keyof typeof paper;

export interface CutoutPalette {
  key: string;
  /** Italian name used when talking about it with the team. */
  name: string;
  bg: string;
  /** Headline and body text. */
  text: string;
  /** Three motif colors, most used first. */
  motifs: readonly [string, string, string];
  /** Key word highlight: marker behind dark text, or pen underline. */
  highlight: { kind: 'marker' | 'underline'; color: string; text?: string };
  /** Mascot limbs (never white: they would vanish on the sticker border). */
  pen: string;
  /** Mascot roll and total pill. */
  roll: string;
  pill: string;
  /** Layer colors of a bloom transition that leads into this palette. */
  bloom: readonly [string, string];
  /** Dark or light, for alternation in reels and in the profile grid. */
  tone: 'dark' | 'light';
}

export const cutoutPalettes = [
  {
    key: 'blu',
    name: 'Blu Refattura',
    bg: paper.ultramarine,
    text: paper.cream,
    motifs: [paper.cream, paper.coral, paper.lemon],
    highlight: { kind: 'marker', color: paper.lemon, text: paper.ink },
    pen: paper.coral,
    roll: paper.lemon,
    pill: paper.coral,
    bloom: [paper.lemon, paper.cream],
    tone: 'dark',
  },
  {
    key: 'corallo',
    name: 'Corallo',
    bg: paper.coral,
    text: paper.ink,
    motifs: [paper.ultramarine, paper.lemon, paper.cream],
    highlight: { kind: 'marker', color: paper.lemon, text: paper.ink },
    pen: paper.ultramarine,
    roll: paper.lemon,
    pill: paper.ultramarine,
    bloom: [paper.lemon, paper.ultramarine],
    tone: 'light',
  },
  {
    key: 'panna',
    name: 'Panna',
    bg: paper.cream,
    text: paper.ink,
    motifs: [paper.ultramarine, paper.coral, paper.emerald],
    highlight: { kind: 'marker', color: paper.lemon, text: paper.ink },
    pen: paper.ultramarine,
    roll: paper.lemon,
    pill: paper.coral,
    bloom: [paper.coral, paper.lemon],
    tone: 'light',
  },
  {
    key: 'limone',
    name: 'Limone',
    bg: paper.lemon,
    text: paper.ink,
    motifs: [paper.ultramarine, paper.coral, paper.emerald],
    highlight: { kind: 'underline', color: paper.ultramarine },
    pen: paper.ultramarine,
    roll: paper.coral,
    pill: paper.ultramarine,
    bloom: [paper.coral, paper.cream],
    tone: 'light',
  },
  {
    key: 'smeraldo',
    name: 'Smeraldo',
    bg: paper.emerald,
    text: paper.cream,
    motifs: [paper.cream, paper.lemon, paper.coral],
    highlight: { kind: 'marker', color: paper.lemon, text: paper.ink },
    pen: paper.coral,
    roll: paper.lemon,
    pill: paper.coral,
    bloom: [paper.lemon, paper.coral],
    tone: 'dark',
  },
  {
    key: 'rosa',
    name: 'Rosa',
    bg: paper.pink,
    text: paper.ink,
    motifs: [paper.ultramarine, paper.emerald, paper.cream],
    highlight: { kind: 'marker', color: paper.ultramarine, text: paper.cream },
    pen: paper.ultramarine,
    roll: paper.lemon,
    pill: paper.emerald,
    bloom: [paper.ultramarine, paper.cream],
    tone: 'light',
  },
] as const satisfies readonly CutoutPalette[];

export type CutoutPaletteKey = (typeof cutoutPalettes)[number]['key'];

export function cutoutPalette(key: CutoutPaletteKey): CutoutPalette {
  return cutoutPalettes.find((p) => p.key === key)!;
}
