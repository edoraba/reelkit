import { contrast } from './color';
import { refattura } from './tokens';

/**
 * Cut-paper direction (D-020 to D-027): paper colors and palettes. DRAFT until Edoardo approves.
 *
 * Only Refattura tones (Edoardo, 2026-11-18: warm multicolor looked like a primary school):
 * the ink blue of the app, a night blue, light blues, violet, lavender, cool whites and
 * graphite. The three app stamps (green, amber, red) are not decorative colors: they appear
 * only on stamps, with their meaning (ok, decision needed, error).
 * Rules: never pure white as a background; text pairs checked by `pnpm brand:contrast`
 * (min 4.5:1); every motif visible on its background (min 2:1, see visibleOn).
 */
export const paper = {
  blue: refattura.inkBlue,
  navy: 'oklch(26% 0.11 266)',
  sky: 'oklch(75% 0.13 264)',
  ice: 'oklch(93% 0.035 255)',
  violet: 'oklch(50% 0.22 292)',
  lavender: 'oklch(84% 0.08 292)',
  white: refattura.sheetWhite,
  ink: refattura.graphite,
} as const;

export type PaperName = keyof typeof paper;

export interface CutoutPalette {
  key: string;
  /** Italian name used when talking about it with the team. */
  name: string;
  bg: string;
  /** Headline and body text. */
  text: string;
  /** Three motif colors, most used first. All visible on the background. */
  motifs: readonly [string, string, string];
  /**
   * Key word highlight, with the text color on the band. label: cut-paper strip behind the whole
   * word (default). marker: band on the lower half only, the top of the letters stays on the
   * background, so its text color must also read there. underline: pen stroke.
   */
  highlight: { kind: 'label' | 'marker' | 'underline'; color: string; text?: string };
  /** Mascot limbs: visible on the background and on the white sticker border (never white). */
  pen: string;
  /** Mascot roll and total pill, visible on the white invoice sheet. */
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
    bg: paper.blue,
    text: paper.white,
    motifs: [paper.white, paper.lavender, paper.navy],
    highlight: { kind: 'label', color: paper.sky, text: paper.ink },
    pen: paper.navy,
    roll: paper.sky,
    pill: paper.blue,
    bloom: [paper.sky, paper.white],
    tone: 'dark',
  },
  {
    key: 'notte',
    name: 'Notte',
    bg: paper.navy,
    text: paper.white,
    motifs: [paper.sky, paper.lavender, paper.blue],
    highlight: { kind: 'label', color: paper.sky, text: paper.ink },
    pen: paper.blue,
    roll: paper.sky,
    pill: paper.violet,
    bloom: [paper.blue, paper.sky],
    tone: 'dark',
  },
  {
    key: 'azzurro',
    name: 'Azzurro',
    bg: paper.sky,
    text: paper.ink,
    motifs: [paper.navy, paper.blue, paper.white],
    highlight: { kind: 'label', color: paper.white, text: paper.ink },
    pen: paper.navy,
    roll: paper.violet,
    pill: paper.blue,
    bloom: [paper.white, paper.navy],
    tone: 'light',
  },
  {
    key: 'ghiaccio',
    name: 'Ghiaccio',
    bg: paper.ice,
    text: paper.ink,
    motifs: [paper.blue, paper.violet, paper.navy],
    highlight: { kind: 'label', color: paper.blue, text: paper.white },
    pen: paper.blue,
    roll: paper.sky,
    pill: paper.violet,
    bloom: [paper.blue, paper.sky],
    tone: 'light',
  },
  {
    key: 'viola',
    name: 'Viola',
    bg: paper.violet,
    text: paper.white,
    motifs: [paper.lavender, paper.white, paper.navy],
    highlight: { kind: 'label', color: paper.lavender, text: paper.ink },
    pen: paper.navy,
    roll: paper.sky,
    pill: paper.blue,
    bloom: [paper.lavender, paper.navy],
    tone: 'dark',
  },
  {
    key: 'lavanda',
    name: 'Lavanda',
    bg: paper.lavender,
    text: paper.ink,
    motifs: [paper.violet, paper.blue, paper.navy],
    highlight: { kind: 'label', color: paper.violet, text: paper.white },
    pen: paper.violet,
    roll: paper.sky,
    pill: paper.blue,
    bloom: [paper.violet, paper.white],
    tone: 'light',
  },
] as const satisfies readonly CutoutPalette[];

export type CutoutPaletteKey = (typeof cutoutPalettes)[number]['key'];

export function cutoutPalette(key: CutoutPaletteKey): CutoutPalette {
  return cutoutPalettes.find((p) => p.key === key)!;
}

// ------------------------------------------------------------------------- visibility rules

/**
 * A cut piece must stand out from what it sits on (the background or another piece):
 * luminance contrast of at least 2:1. Inside one hue family luminance is all there is, so
 * no exceptions: blue on violet (1.16:1) and white on ice (1.22:1) are never used.
 */
export const MIN_GRAPHIC_CONTRAST = 2;

export function visibleOn(color: string, base: string): boolean {
  if (color === base) return false;
  return contrast(color, base) >= MIN_GRAPHIC_CONTRAST;
}

/**
 * Color chooser for the pieces of a motif: the first preferred color that is visible on the
 * piece underneath, otherwise the palette color (or ink, white, navy) that contrasts most.
 */
export function pickerFor(p: CutoutPalette): (base: string, ...prefer: string[]) => string {
  const pool = [...p.motifs, p.text, paper.ink, paper.white, paper.navy];
  return (base, ...prefer) =>
    prefer.find((c) => visibleOn(c, base)) ??
    [...pool].filter((c) => c !== base).sort((x, y) => contrast(y, base) - contrast(x, base))[0]!;
}

/**
 * Paper layers of a bloom transition from one palette to the next: the outer layer must show
 * on the old background, the inner one on the outer layer, and the new background on the
 * inner one. Prefers the `bloom` colors of the destination palette.
 */
export function bloomLayers(from: CutoutPalette, to: CutoutPalette): readonly [string, string] {
  const pool = [...new Set([...to.bloom, ...to.motifs, paper.white, paper.navy, paper.sky])];
  const outer = pool.filter((c) => c !== from.bg && c !== to.bg && visibleOn(c, from.bg));
  for (const allowOldBg of [false, true]) {
    for (const a1 of outer) {
      const a2 = pool.find(
        (c) => c !== a1 && (allowOldBg || c !== from.bg) && visibleOn(c, a1) && visibleOn(to.bg, c),
      );
      if (a2) return [a1, a2];
    }
  }
  return to.bloom;
}
