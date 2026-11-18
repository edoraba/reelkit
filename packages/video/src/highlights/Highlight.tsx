import { useId } from 'react';

/**
 * Ways to mark the key word of a line, all taken from working on paper documents:
 * - marker: highlighter stroke behind the lower part of the word (the top of the letters stays
 *   on the background, so the text color must read on both)
 * - label: cut-paper strip behind the whole word; the word never touches the background
 * - underline: hand-drawn pen stroke under the word
 * - circle: pen loop around the word, like a correction
 * - color: the word changes color, nothing else
 * `progress` (0..1) animates the mark: the highlighter sweeps left to right, the pen draws.
 * `textColor` (marker, label) recolors the word only where the band has already passed.
 */
export type HighlightKind = 'marker' | 'label' | 'underline' | 'circle' | 'color';

export interface HighlightProps {
  kind: HighlightKind;
  color: string;
  children: React.ReactNode;
  /** Pen stroke width in px (underline, circle). */
  strokeWidth?: number;
  /** 0 = not drawn yet, 1 = complete. */
  progress?: number;
  /** Text color on the band (marker, label); before the band arrives the word keeps its color. */
  textColor?: string;
  /** The word has descenders (g, p, q, y): the label strip reaches lower to cover them. */
  descender?: boolean;
}

/** Letters that go below the baseline. */
export const hasDescender = (text: string): boolean => /[gjpqy]/.test(text);

/** Band geometry relative to the word box (line-height around 1). */
const BANDS = {
  marker: {
    top: '0.36em',
    bottom: '0.02em',
    pad: '0.1em',
    shape: undefined,
    radius: '0.06em 0.22em 0.1em 0.28em',
    rotate: -1.2,
    skew: -8,
  },
  // A hand-cut strip: covers ascenders and baseline (descenders too, see the descender prop),
  // corners not square.
  label: {
    top: '0.06em',
    bottom: '-0.04em',
    pad: '0.16em',
    shape: 'polygon(0% 7%, 52% 0%, 100% 4%, 99% 95%, 47% 100%, 1% 92%)',
    radius: undefined,
    rotate: -1.6,
    skew: 0,
  },
} as const;

/** Slight wobble so pen strokes do not look like vector shapes. */
const PenFilter: React.FC<{ id: string }> = ({ id }) => (
  <filter id={id} x="-20%" y="-150%" width="140%" height="400%">
    <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="7" result="n" />
    <feDisplacementMap
      in="SourceGraphic"
      in2="n"
      scale="5"
      xChannelSelector="R"
      yChannelSelector="G"
    />
  </filter>
);

export const Highlight: React.FC<HighlightProps> = ({
  kind,
  color,
  children,
  strokeWidth = 12,
  progress = 1,
  textColor,
  descender = false,
}) => {
  const filterId = `pen${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const band = kind === 'marker' || kind === 'label' ? BANDS[kind] : undefined;
  const p = Math.max(0, Math.min(1, progress));
  const pen = {
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    vectorEffect: 'non-scaling-stroke' as const,
    filter: `url(#${filterId})`,
  };
  // Pen strokes are revealed left to right with a clip (dash offsets break with
  // non-scaling strokes on a stretched viewBox).
  const reveal: React.CSSProperties = {
    clipPath: `inset(-50% ${(1 - p) * 100}% -50% -10%)`,
    opacity: p > 0 ? 1 : 0,
  };
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        isolation: 'isolate',
        color: kind === 'color' && p > 0.5 ? color : undefined,
        // The pen loop is wider than the word: keep it off the neighbouring words.
        margin: kind === 'circle' ? '0 0.24em' : undefined,
      }}
    >
      {band && (
        <span
          style={{
            position: 'absolute',
            left: `-${band.pad}`,
            width: `calc(100% + 2 * ${band.pad})`,
            top: band.top,
            bottom: kind === 'label' && descender ? '-0.2em' : band.bottom,
            backgroundColor: color,
            borderRadius: band.radius,
            clipPath: band.shape,
            transform: `rotate(${band.rotate}deg) skewX(${band.skew}deg) scaleX(${p})`,
            transformOrigin: 'left center',
            zIndex: -1,
          }}
        />
      )}
      {band && textColor ? (
        <>
          {/* The word in its own color where the band has not arrived yet... */}
          <span style={{ display: 'inline-block', clipPath: `inset(-40% -30% -40% ${p * 100}%)` }}>
            {children}
          </span>
          {/* ...and in the band text color where it has. */}
          <span
            aria-hidden
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              whiteSpace: 'nowrap',
              color: textColor,
              clipPath: `inset(-40% ${(1 - p) * 100}% -40% -30%)`,
            }}
          >
            {children}
          </span>
        </>
      ) : (
        <span style={{ color: textColor }}>{children}</span>
      )}
      {kind === 'underline' && (
        <svg
          viewBox="0 0 100 20"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            left: '-0.04em',
            width: 'calc(100% + 0.08em)',
            bottom: '-0.2em',
            height: '0.3em',
            overflow: 'visible',
            ...reveal,
          }}
        >
          <defs>
            <PenFilter id={filterId} />
          </defs>
          <path d="M 2 12 C 18 5, 30 17, 50 10 S 82 5, 98 11" {...pen} />
        </svg>
      )}
      {kind === 'circle' && (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            left: '-0.32em',
            width: 'calc(100% + 0.64em)',
            top: '-0.2em',
            height: 'calc(100% + 0.42em)',
            overflow: 'visible',
            ...reveal,
          }}
        >
          <defs>
            <PenFilter id={filterId} />
          </defs>
          <path
            d="M 62 7 C 24 0, 1 26, 4 54 C 7 90, 66 100, 92 72 C 106 46, 88 6, 40 12"
            {...pen}
          />
        </svg>
      )}
    </span>
  );
};
