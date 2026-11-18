/**
 * Fonts. All files live in assets/fonts/<dir>/ next to their OFL.txt and are loaded by
 * Remotion from the public dir (assets/). Font sets let us try alternatives on the same
 * content: `pnpm render:fontlab` renders all of them side by side.
 */
export const fontFiles = {
  bricolage: {
    family: 'Bricolage Grotesque',
    file: 'fonts/bricolagegrotesque/BricolageGrotesque-Variable.ttf',
    weight: '200 800',
  },
  gabarito: {
    family: 'Gabarito',
    file: 'fonts/gabarito/Gabarito-Variable.ttf',
    weight: '400 900',
  },
  rubik: {
    family: 'Rubik',
    file: 'fonts/rubik/Rubik-Variable.ttf',
    weight: '300 900',
  },
  baloo: {
    family: 'Baloo 2',
    file: 'fonts/baloo2/Baloo2-Variable.ttf',
    weight: '400 800',
  },
  fredoka: {
    family: 'Fredoka',
    file: 'fonts/fredoka/Fredoka-Variable.ttf',
    weight: '300 700',
  },
  caveat: {
    family: 'Caveat',
    file: 'fonts/caveat/Caveat-Variable.ttf',
    weight: '400 700',
  },
  shantell: {
    family: 'Shantell Sans',
    file: 'fonts/shantellsans/ShantellSans-Variable.ttf',
    weight: '300 800',
  },
  gochi: {
    family: 'Gochi Hand',
    file: 'fonts/gochihand/GochiHand-Regular.ttf',
    weight: '400',
  },
  patrick: {
    family: 'Patrick Hand',
    file: 'fonts/patrickhand/PatrickHand-Regular.ttf',
    weight: '400',
  },
  // Candidates for the cut-paper direction (D-024), all OFL.
  fraunces: {
    family: 'Fraunces',
    file: 'fonts/fraunces/Fraunces-Variable.ttf',
    weight: '100 900',
  },
  youngSerif: {
    family: 'Young Serif',
    file: 'fonts/youngserif/YoungSerif-Regular.ttf',
    weight: '400',
  },
  instrumentSerif: {
    family: 'Instrument Serif',
    file: 'fonts/instrumentserif/InstrumentSerif-Regular.ttf',
    weight: '400',
  },
  instrumentSerifItalic: {
    family: 'Instrument Serif',
    file: 'fonts/instrumentserif/InstrumentSerif-Italic.ttf',
    weight: '400',
    style: 'italic',
  },
  gloock: {
    family: 'Gloock',
    file: 'fonts/gloock/Gloock-Regular.ttf',
    weight: '400',
  },
  bagel: {
    family: 'Bagel Fat One',
    file: 'fonts/bagelfatone/BagelFatOne-Regular.ttf',
    weight: '400',
  },
  gluten: {
    family: 'Gluten',
    file: 'fonts/gluten/Gluten-Variable.ttf',
    weight: '100 900',
  },
  sourGummy: {
    family: 'Sour Gummy',
    file: 'fonts/sourgummy/SourGummy-Variable.ttf',
    weight: '100 900',
  },
  caveatBrush: {
    family: 'Caveat Brush',
    file: 'fonts/caveatbrush/CaveatBrush-Regular.ttf',
    weight: '400',
  },
  dmMono: {
    family: 'DM Mono',
    file: 'fonts/dmmono/DMMono-Regular.ttf',
    weight: '400',
  },
  dmMonoMedium: {
    family: 'DM Mono',
    file: 'fonts/dmmono/DMMono-Medium.ttf',
    weight: '500',
  },
} as const;

export type FontKey = keyof typeof fontFiles;

export interface FontChoice {
  font: FontKey;
  weight: number;
}

export interface FontSet {
  label: string;
  /** Kinetic typography, titles, covers. */
  display: FontChoice;
  /** Kickers, stamps, hand-written notes. */
  hand: FontChoice;
  /** Numbers, amounts, codes, chapter labels. */
  mono: FontChoice;
}

export const fontSets = {
  brand: {
    label: 'Bricolage Grotesque + Caveat',
    display: { font: 'bricolage', weight: 800 },
    hand: { font: 'caveat', weight: 700 },
    mono: { font: 'dmMonoMedium', weight: 500 },
  },
  gabarito: {
    label: 'Gabarito + Shantell Sans',
    display: { font: 'gabarito', weight: 900 },
    hand: { font: 'shantell', weight: 600 },
    mono: { font: 'dmMonoMedium', weight: 500 },
  },
  rubik: {
    label: 'Rubik + Gochi Hand',
    display: { font: 'rubik', weight: 800 },
    hand: { font: 'gochi', weight: 400 },
    mono: { font: 'dmMonoMedium', weight: 500 },
  },
  baloo: {
    label: 'Baloo 2 + Patrick Hand',
    display: { font: 'baloo', weight: 800 },
    hand: { font: 'patrick', weight: 400 },
    mono: { font: 'dmMonoMedium', weight: 500 },
  },
  fredoka: {
    label: 'Fredoka + Caveat',
    display: { font: 'fredoka', weight: 700 },
    hand: { font: 'caveat', weight: 700 },
    mono: { font: 'dmMonoMedium', weight: 500 },
  },
} as const satisfies Record<string, FontSet>;

export type FontSetName = keyof typeof fontSets;
export const fontSetNames = Object.keys(fontSets) as FontSetName[];
export const DEFAULT_FONT_SET: FontSetName = 'brand';

/**
 * Type scale in px for the 1080x1920 frame. Draft, see guidelines/brand.md.
 */
export const typeScale = {
  /** One word at a time, center. */
  hero: 168,
  /** Karaoke lines of 2-4 words. */
  karaoke: 104,
  /** Cover title. */
  coverTitle: 150,
  /** Hand-written kicker on covers and chapter titles. */
  kicker: 72,
  /** Mockup text (chat bubbles, notifications). */
  body: 48,
  /** Chapter bar label, pills. */
  label: 34,
} as const;
