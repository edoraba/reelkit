import { backgrounds, fontSetNames, fontSets, refattura } from '@reelkit/brand';
import { AbsoluteFill } from 'remotion';
import { fontsOf } from '../brand/fonts';
import { HighlightBox } from '../stickers/HighlightBox';

/**
 * Font comparison sheet: every font set on the same kicker, title and numbers.
 *   pnpm render:fontlab  ->  packages/video/out/fontlab.png
 */
export const FONTLAB_HEIGHT = 2600;

export const FontLab: React.FC = () => {
  const paper = backgrounds.paper;
  return (
    <AbsoluteFill
      style={{
        backgroundColor: paper.fill,
        padding: '70px 64px',
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
      }}
    >
      {fontSetNames.map((name) => {
        const f = fontsOf(name);
        return (
          <div
            key={name}
            style={{ borderBottom: `4px dashed ${refattura.fieldRule}`, paddingBottom: 30 }}
          >
            <div
              style={{
                ...f.mono,
                fontSize: 26,
                color: refattura.pencil,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {name} · {fontSets[name].label}
            </div>
            <div
              style={{
                ...f.hand,
                fontSize: 58,
                color: refattura.inkBlue,
                transform: 'rotate(-2deg)',
                transformOrigin: 'left center',
                margin: '8px 0 4px',
              }}
            >
              Errori da evitare
            </div>
            <div
              style={{
                ...f.display,
                fontSize: 88,
                lineHeight: 1.02,
                letterSpacing: '-0.03em',
                color: paper.text,
              }}
            >
              Quanto costa un&apos;autofattura{' '}
              <span style={{ whiteSpace: 'nowrap' }}>
                <HighlightBox fill={paper.highlightFill} textColor={paper.highlightText}>
                  sbagliata
                </HighlightBox>
                <span style={{ marginLeft: '0.16em' }}>?</span>
              </span>
            </div>
            <div style={{ ...f.mono, fontSize: 36, color: paper.text, marginTop: 22 }}>
              TD17 · 2.400,00 € · 16/12/2026
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
