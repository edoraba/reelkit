/**
 * Prints the hex value of every token and checks WCAG contrast of each background pair.
 * Exit code 1 if a pair is below 4.5:1.
 *   pnpm brand:contrast
 */
import { clampChroma, formatHex, parse, wcagContrast } from 'culori';
import { backgrounds, cutoutPalettes, refattura, social } from '../src/index';

const MIN = 4.5;

function hex(color: string): string {
  const parsed = parse(color);
  if (!parsed) throw new Error(`Cannot parse color ${color}`);
  return formatHex(clampChroma(parsed, 'oklch'));
}

console.log('\nTokens');
console.table(
  Object.fromEntries(
    Object.entries({ ...refattura, ...social }).map(([name, value]) => [
      name,
      { oklch: value, hex: hex(value) },
    ]),
  ),
);

let failures = 0;
const rows: Record<string, Record<string, string>> = {};
for (const [name, bg] of Object.entries(backgrounds)) {
  const text = wcagContrast(hex(bg.fill), hex(bg.text));
  const highlight = wcagContrast(hex(bg.highlightFill), hex(bg.highlightText));
  const mark = (ratio: number) => {
    if (ratio < MIN) failures++;
    return `${ratio.toFixed(2)}${ratio < MIN ? ' FAIL' : ''}`;
  };
  rows[name] = {
    fill: hex(bg.fill),
    'text on fill': mark(text),
    'highlight box': mark(highlight),
  };
}
console.log(`\nBackground pairs (min ${MIN}:1)`);
console.table(rows);

if (failures > 0) {
  console.error(`\n${failures} pair(s) below ${MIN}:1`);
  process.exit(1);
}

// ------------------------------------------------------------------ cut-paper palettes (D-025)
let paletteFailures = 0;
const paletteRows: Record<string, Record<string, string>> = {};
for (const p of cutoutPalettes) {
  const text = wcagContrast(hex(p.bg), hex(p.text));
  const mark =
    p.highlight.kind === 'marker'
      ? wcagContrast(hex(p.highlight.color), hex(p.highlight.text ?? p.text))
      : wcagContrast(hex(p.bg), hex(p.highlight.color));
  const fmt = (ratio: number, min: number) => {
    if (ratio < min) paletteFailures++;
    return `${ratio.toFixed(2)}${ratio < min ? ' FAIL' : ''}`;
  };
  paletteRows[p.name] = {
    bg: hex(p.bg),
    'text on bg': fmt(text, MIN),
    // An underline only needs to be visible (3:1), a marker carries text (4.5:1).
    highlight: fmt(mark, p.highlight.kind === 'marker' ? MIN : 3),
  };
}
console.log('\nCut-paper palettes');
console.table(paletteRows);
if (paletteFailures > 0) {
  console.error(`\n${paletteFailures} palette pair(s) below the minimum`);
  process.exit(1);
}
