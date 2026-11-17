/**
 * Prints the hex value of every token and checks WCAG contrast of each background pair.
 * Exit code 1 if a pair is below 4.5:1.
 *   pnpm brand:contrast
 */
import { clampChroma, formatHex, parse, wcagContrast } from 'culori';
import { backgrounds, refattura, social } from '../src/index';

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
