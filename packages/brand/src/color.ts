import { clampChroma, formatHex, parse, wcagContrast } from 'culori';

/** Hex value of a CSS color (OKLCH tokens included), clamped to sRGB. */
export function toHex(color: string): string {
  const parsed = parse(color);
  if (!parsed) throw new Error(`Cannot parse color ${color}`);
  return formatHex(clampChroma(parsed, 'oklch'));
}

/** WCAG contrast ratio between two CSS colors. */
export function contrast(a: string, b: string): number {
  return wcagContrast(toHex(a), toHex(b));
}
