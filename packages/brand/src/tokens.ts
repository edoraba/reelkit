/**
 * Refattura design tokens, copied from refattura/DESIGN.md (confirmed 2026-09-29).
 * Do not edit by hand here: if the app palette changes, update both places.
 */
export const refattura = {
  inkBlue: 'oklch(52.82% 0.2628 262.87)',
  paperCool: 'oklch(97.02% 0.002 262.87)',
  sheetWhite: 'oklch(100% 0.001 262.87)',
  sheetGrey: 'oklch(95.24% 0.0016 262.87)',
  graphite: 'oklch(21.03% 0.002 262.87)',
  pencil: 'oklch(51% 0.004 262.87)',
  ruleLine: 'oklch(90% 0.002 262.87)',
  fieldRule: 'oklch(85.5% 0.004 262.87)',
  stampGreen: 'oklch(49% 0.14 151.89)',
  stampAmber: 'oklch(52% 0.12 70)',
  stampRed: 'oklch(53% 0.205 26.82)',
} as const;

/**
 * Colors added for social content only (not part of the app). Draft, to be approved in
 * guidelines/brand.md.
 * - lime: highlight box and stickers, the "look here" color of the reels.
 * - sky: light blue close to the light tone of the logotype (#80A9FF), secondary light background.
 */
export const social = {
  lime: 'oklch(93% 0.2 123)',
  sky: 'oklch(75% 0.13 264)',
} as const;

export interface BackgroundSpec {
  /** Background fill. */
  fill: string;
  /** Main text color on this background. */
  text: string;
  /** Fill of the highlight box (karaoke word, keyword sticker). */
  highlightFill: string;
  /** Text inside the highlight box. */
  highlightText: string;
  /** Dot grid color, very low contrast. */
  dots: string;
  /** Light cone under the mascot. */
  cone: string;
}

const DOTS_ON_DARK = 'oklch(100% 0 0 / 0.11)';
const DOTS_ON_LIGHT = 'oklch(0% 0 0 / 0.07)';
const CONE_ON_DARK = 'oklch(100% 0 0 / 0.10)';
const CONE_ON_LIGHT = 'oklch(0% 0 0 / 0.06)';

/**
 * The reel palette: one background per concept, changed at every concept switch.
 * Every text/background pair is verified by `pnpm brand:contrast` (WCAG >= 4.5).
 */
export const backgrounds = {
  blue: {
    fill: refattura.inkBlue,
    text: refattura.sheetWhite,
    highlightFill: social.lime,
    highlightText: refattura.graphite,
    dots: DOTS_ON_DARK,
    cone: CONE_ON_DARK,
  },
  ink: {
    fill: refattura.graphite,
    text: refattura.paperCool,
    highlightFill: social.lime,
    highlightText: refattura.graphite,
    dots: DOTS_ON_DARK,
    cone: CONE_ON_DARK,
  },
  paper: {
    fill: refattura.paperCool,
    text: refattura.graphite,
    highlightFill: social.lime,
    highlightText: refattura.graphite,
    dots: DOTS_ON_LIGHT,
    cone: CONE_ON_LIGHT,
  },
  sky: {
    fill: social.sky,
    text: refattura.graphite,
    highlightFill: refattura.inkBlue,
    highlightText: refattura.sheetWhite,
    dots: DOTS_ON_LIGHT,
    cone: CONE_ON_LIGHT,
  },
  green: {
    fill: refattura.stampGreen,
    text: refattura.sheetWhite,
    highlightFill: social.lime,
    highlightText: refattura.graphite,
    dots: DOTS_ON_DARK,
    cone: CONE_ON_DARK,
  },
  red: {
    fill: refattura.stampRed,
    text: refattura.sheetWhite,
    highlightFill: refattura.paperCool,
    highlightText: refattura.graphite,
    dots: DOTS_ON_DARK,
    cone: CONE_ON_DARK,
  },
} as const satisfies Record<string, BackgroundSpec>;

export type BackgroundName = keyof typeof backgrounds;
export const backgroundNames = Object.keys(backgrounds) as BackgroundName[];

/** Illustration style: one outline color and width for everything (mascot, icons, mockups). */
export const illustration = {
  outline: refattura.graphite,
  /** Outline width in px at 1080 px frame width. */
  outlineWidth: 8,
  /** Solid offset shadow, never blurred. */
  shadowOffset: 12,
  radius: 18,
} as const;
