import { cutoutPalette, cutoutPalettes, type CutoutPalette } from '@reelkit/brand';
import { AbsoluteFill, Sequence } from 'remotion';
import { fontsOf } from '../../brand/fonts';
import { RevealText, type RevealWord } from '../../components/RevealText';
import { headlineWords } from './PaletteBoard';
import { DEFAULT_TYPE } from './scenes';

/**
 * Key word highlight of every palette, at the real headline size: halfway through the sweep and
 * complete. A quick check that the word reads on its band and never on the background.
 *   pnpm render:cutouts  ->  packages/video/out/lab/cutouts/highlights.png
 */
const CW = 1080;
const CH = 580;
const STEPS = [0.5, 1] as const;
// Same timing as RevealText: the mark starts 4 frames after the word and lasts 9.
const MARK_DELAY = 4;
const MARK_FRAMES = 9;
const mono = fontsOf('brand').mono;

function words(p: CutoutPalette, headline: string, mark: number): RevealWord[] {
  return headline.split(' ').map((text, i) => ({
    text,
    at: 8 + i * 5,
    highlight:
      i === mark
        ? { kind: p.highlight.kind, color: p.highlight.color, textColor: p.highlight.text }
        : undefined,
  }));
}

/** The six palette headlines, plus a key word with descenders and a line under it. */
const CASES: Array<{ p: CutoutPalette; words: RevealWord[]; note?: string }> = [
  ...cutoutPalettes.map((p) => ({ p: p as CutoutPalette, words: headlineWords(p) })),
  {
    p: cutoutPalette('ghiaccio'),
    words: words(cutoutPalette('ghiaccio'), 'Quanto paghi per ogni autofattura?', 1),
    note: 'descenders',
  },
];

export const HIGHLIGHT_CHECK = { width: CW * STEPS.length, height: CH * CASES.length };

export const HighlightCheck: React.FC = () => (
  <AbsoluteFill style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
    {CASES.flatMap(({ p, words: ws, note }, row) => {
      const marked = ws.find((w) => w.highlight)!;
      return STEPS.map((q) => (
        <div
          key={`${row}-${q}`}
          style={{
            position: 'relative',
            width: CW,
            height: CH,
            overflow: 'hidden',
            backgroundColor: p.bg,
          }}
        >
          <Sequence from={-Math.round(marked.at + MARK_DELAY + q * MARK_FRAMES)} layout="none">
            <RevealText
              words={ws}
              font={DEFAULT_TYPE.font}
              fontSize={DEFAULT_TYPE.size}
              tracking={DEFAULT_TYPE.tracking}
              color={p.text}
              style={{ top: 50, left: 96, right: 150 }}
            />
          </Sequence>
          <div
            style={{
              position: 'absolute',
              right: 16,
              bottom: 12,
              ...mono,
              fontSize: 18,
              color: p.text,
              opacity: 0.7,
            }}
          >
            {p.name} · {p.highlight.kind}
            {note ? ` · ${note}` : ''} · {q === 1 ? 'done' : 'sweeping'}
          </div>
        </div>
      ));
    })}
  </AbsoluteFill>
);
