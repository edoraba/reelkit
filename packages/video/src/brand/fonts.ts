import { fontFiles, fontSets, type FontChoice, type FontSetName } from '@reelkit/brand';
import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

// Load every font once at module level; loadFont delays the render until the font is ready.
for (const f of Object.values(fontFiles)) {
  void loadFont({
    family: f.family,
    url: staticFile(f.file),
    weight: f.weight,
    style: 'style' in f ? f.style : 'normal',
  });
}

export interface ResolvedFont {
  fontFamily: string;
  fontWeight: number;
}

function resolve(choice: FontChoice, fallback: string): ResolvedFont {
  return {
    fontFamily: `'${fontFiles[choice.font].family}', ${fallback}`,
    fontWeight: choice.weight,
  };
}

/** CSS font props for the three roles of a font set. */
export function fontsOf(set: FontSetName): {
  display: ResolvedFont;
  hand: ResolvedFont;
  mono: ResolvedFont;
} {
  const s = fontSets[set];
  return {
    display: resolve(s.display, 'sans-serif'),
    hand: resolve(s.hand, 'cursive'),
    mono: resolve(s.mono, 'monospace'),
  };
}
