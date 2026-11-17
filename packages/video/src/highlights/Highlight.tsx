import { useId } from 'react';

/**
 * Ways to mark the key word of a line, all taken from working on paper documents:
 * - marker: highlighter stroke behind the word
 * - underline: hand-drawn pen stroke under the word
 * - circle: pen loop around the word, like a correction
 * - color: the word changes color, nothing else
 */
export type HighlightKind = 'marker' | 'underline' | 'circle' | 'color';

export interface HighlightProps {
  kind: HighlightKind;
  color: string;
  children: React.ReactNode;
  /** Pen stroke width in px (underline, circle). */
  strokeWidth?: number;
}

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
}) => {
  const filterId = `pen${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        isolation: 'isolate',
        color: kind === 'color' ? color : undefined,
        // The pen loop is wider than the word: keep it off the neighbouring words.
        margin: kind === 'circle' ? '0 0.24em' : undefined,
      }}
    >
      {kind === 'marker' && (
        <span
          style={{
            position: 'absolute',
            left: '-0.1em',
            width: 'calc(100% + 0.2em)',
            top: '0.36em',
            bottom: '0.02em',
            backgroundColor: color,
            borderRadius: '0.06em 0.22em 0.1em 0.28em',
            transform: 'rotate(-1.2deg) skewX(-8deg)',
            zIndex: -1,
          }}
        />
      )}
      {children}
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
          }}
        >
          <defs>
            <PenFilter id={filterId} />
          </defs>
          <path
            d="M 2 12 C 18 5, 30 17, 50 10 S 82 5, 98 11"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            filter={`url(#${filterId})`}
          />
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
          }}
        >
          <defs>
            <PenFilter id={filterId} />
          </defs>
          <path
            d="M 62 7 C 24 0, 1 26, 4 54 C 7 90, 66 100, 92 72 C 106 46, 88 6, 40 12"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            filter={`url(#${filterId})`}
          />
        </svg>
      )}
    </span>
  );
};
