import { seededRandom } from '@reelkit/schema';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { ResolvedFont } from '../brand/fonts';
import { Highlight, type HighlightKind } from '../highlights/Highlight';

/**
 * A headline that appears word by word, as the voice says it. Each word rises in with a
 * spring at its frame; a highlighted word gets its mark drawn a few frames later.
 * Timings are frames for now; from phase 1 they come from words.json.
 */
export interface RevealWord {
  text: string;
  at: number;
  highlight?: { kind: HighlightKind; color: string; textColor?: string };
  /** Start a new line before this word. */
  br?: boolean;
}

const MARK_DELAY = 4;
const MARK_FRAMES = 9;

/**
 * "Cut letters": every letter is its own slightly rotated, slightly shifted piece, as if cut
 * out of paper and glued by hand. Seeded, so the same text always gets the same jitter.
 */
function cutLetters(text: string, seed: string, amount: number): React.ReactNode {
  const rnd = seededRandom('cut-letters', seed, text);
  return Array.from(text).map((ch, i) => (
    <span
      key={i}
      style={{
        display: 'inline-block',
        transform: `rotate(${(rnd() - 0.5) * 10 * amount}deg) translateY(${(rnd() - 0.5) * 0.08 * amount}em)`,
      }}
    >
      {ch}
    </span>
  ));
}

export const RevealText: React.FC<{
  words: RevealWord[];
  font: ResolvedFont;
  fontSize: number;
  color: string;
  lineHeight?: number;
  align?: 'left' | 'center';
  /** Letter spacing in em (fonts differ: rounded and serif faces need more air). */
  tracking?: number;
  /** Extra CSS for the font, e.g. variable axes. */
  variation?: string;
  /** Seed for cut letters; omit for plain text. */
  cut?: { seed: string; amount?: number };
  style?: React.CSSProperties;
}> = ({
  words,
  font,
  fontSize,
  color,
  lineHeight = 1.06,
  align = 'left',
  tracking = -0.03,
  variation,
  cut,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const piece = (text: string) => (cut ? cutLetters(text, cut.seed, cut.amount ?? 1) : text);
  return (
    <div
      style={{
        position: 'absolute',
        ...font,
        fontSize,
        lineHeight,
        letterSpacing: `${tracking}em`,
        fontVariationSettings: variation,
        color,
        textAlign: align,
        ...style,
      }}
    >
      {words.map((w, i) => {
        const t = spring({
          frame: frame - w.at,
          fps,
          config: { damping: 14, stiffness: 200, mass: 0.6 },
        });
        const visible = frame >= w.at;
        const mark = interpolate(frame - w.at - MARK_DELAY, [0, MARK_FRAMES], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const word = w.highlight ? (
          <span style={{ color: w.highlight.textColor }}>
            <Highlight
              kind={w.highlight.kind}
              color={w.highlight.color}
              progress={mark}
              strokeWidth={11}
            >
              {piece(w.text)}
            </Highlight>
          </span>
        ) : (
          piece(w.text)
        );
        return (
          <span key={i}>
            {w.br && <br />}
            <span
              style={{
                display: 'inline-block',
                opacity: visible ? Math.min(1, t * 1.6) : 0,
                transform: `translateY(${(1 - t) * 0.3}em)`,
              }}
            >
              {word}
            </span>{' '}
          </span>
        );
      })}
    </div>
  );
};

/** One word at a time in the center, hard cut to the next (hooks, punchlines). */
export const PopWords: React.FC<{
  words: RevealWord[];
  until: number;
  font: ResolvedFont;
  fontSize: number;
  color: string;
  y: number;
}> = ({ words, until, font, fontSize, color, y }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let index = -1;
  words.forEach((w, i) => {
    if (w.at <= frame) index = i;
  });
  const w = words[index];
  if (!w || frame >= until) return null;
  const t = spring({
    frame: frame - w.at,
    fps,
    config: { damping: 12, stiffness: 220, mass: 0.6 },
  });
  const mark = interpolate(frame - w.at - MARK_DELAY, [0, MARK_FRAMES], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 80,
        right: 150,
        top: y,
        transform: `translateY(-50%) scale(${0.75 + 0.25 * t})`,
        textAlign: 'center',
        ...font,
        fontSize,
        lineHeight: 1,
        letterSpacing: '-0.03em',
        color,
        opacity: Math.min(1, t * 2),
      }}
    >
      {w.highlight ? (
        <span style={{ color: w.highlight.textColor }}>
          <Highlight
            kind={w.highlight.kind}
            color={w.highlight.color}
            progress={mark}
            strokeWidth={13}
          >
            {w.text}
          </Highlight>
        </span>
      ) : (
        w.text
      )}
    </div>
  );
};
