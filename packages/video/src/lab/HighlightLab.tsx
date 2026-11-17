import { backgrounds, refattura, social } from '@reelkit/brand';
import { AbsoluteFill } from 'remotion';
import { fontsOf } from '../brand/fonts';
import { Highlight, type HighlightKind } from '../highlights/Highlight';

/**
 * Candidates to replace the lime box (D-013): the same sentence with each highlight style,
 * on a light and on a blue background.
 */
export const HIGHLIGHT_LAB_HEIGHT = 1400;

const OPTIONS: Array<{ label: string; kind: HighlightKind; light: string; blue: string }> = [
  { label: 'yellow marker', kind: 'marker', light: social.markerYellow, blue: social.markerYellow },
  {
    label: 'light blue marker',
    kind: 'marker',
    light: 'oklch(86% 0.07 264)',
    blue: 'oklch(86% 0.07 264)',
  },
  {
    label: 'pen underline',
    kind: 'underline',
    light: refattura.inkBlue,
    blue: social.markerYellow,
  },
  { label: 'pen circle', kind: 'circle', light: refattura.stampRed, blue: refattura.sheetWhite },
  { label: 'word in color', kind: 'color', light: refattura.inkBlue, blue: social.markerYellow },
];

const fonts = fontsOf('brand');

const Column: React.FC<{ bg: 'paper' | 'blue' }> = ({ bg }) => {
  const spec = backgrounds[bg];
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: spec.fill,
        padding: '90px 44px',
        display: 'flex',
        flexDirection: 'column',
        gap: 70,
      }}
    >
      {OPTIONS.map((o) => {
        const color = bg === 'paper' ? o.light : o.blue;
        // Marker sits under the text, so the word keeps a dark ink for contrast.
        const wordInk = o.kind === 'marker' ? refattura.graphite : undefined;
        return (
          <div key={o.label}>
            <div
              style={{
                ...fonts.mono,
                fontSize: 22,
                color: spec.text,
                opacity: 0.7,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 14,
              }}
            >
              {o.label}
            </div>
            <div
              style={{
                ...fonts.display,
                fontSize: 70,
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
                color: spec.text,
              }}
            >
              Quanti{' '}
              <span style={{ color: wordInk }}>
                <Highlight kind={o.kind} color={color} strokeWidth={10}>
                  soldi
                </Highlight>
              </span>{' '}
              perdi?
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const HighlightLab: React.FC = () => (
  <AbsoluteFill style={{ flexDirection: 'row' }}>
    <Column bg="paper" />
    <Column bg="blue" />
  </AbsoluteFill>
);
