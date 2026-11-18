import { fontFiles, type FontKey } from '@reelkit/brand';
import { AbsoluteFill } from 'remotion';
import { fontsOf, type ResolvedFont } from '../../brand/fonts';
import { C } from '../moodboards/boards';
import { RevealText } from '../../components/RevealText';
import { BoilFilter } from './paper';
import { CutoutScene, variant, type SceneType } from './scenes';

/**
 * Headline font candidates for the cut-paper direction (D-024), each on the same scene, on a
 * dark and on a light paper. Rendered as stills at frame FONT_TEST.frame.
 *   pnpm render:cutouts  ->  packages/video/out/lab/cutouts/fonts-{ultramarine,cream}.png
 */
const face = (key: FontKey, weight: number, fallback = 'sans-serif'): ResolvedFont => ({
  fontFamily: `'${fontFiles[key].family}', ${fallback}`,
  fontWeight: weight,
});

export const FONT_CANDIDATES: Array<{ name: string; note: string; type: SceneType }> = [
  { name: 'Bricolage Grotesque', note: 'today', type: { font: face('bricolage', 800), size: 118 } },
  {
    name: 'Bricolage, cut letters',
    note: 'same font, hand-cut',
    type: { font: face('bricolage', 800), size: 118, tracking: -0.01, cut: true },
  },
  {
    name: 'Fraunces Soft',
    note: 'soft wonky serif',
    type: {
      font: face('fraunces', 800, 'serif'),
      size: 110,
      tracking: -0.02,
      variation: "'SOFT' 100, 'WONK' 1, 'opsz' 144",
    },
  },
  {
    name: 'Young Serif',
    note: 'poster serif',
    type: { font: face('youngSerif', 400, 'serif'), size: 104, tracking: -0.01 },
  },
  {
    name: 'Gloock',
    note: 'soft high-contrast serif',
    type: { font: face('gloock', 400, 'serif'), size: 116, tracking: 0 },
  },
  {
    name: 'Instrument Serif',
    note: 'already in the app',
    type: {
      font: face('instrumentSerif', 400, 'serif'),
      size: 152,
      tracking: -0.01,
      lineHeight: 0.95,
    },
  },
  {
    name: 'Bagel Fat One',
    note: 'fat rounded, cut-out feel',
    type: { font: face('bagel', 400), size: 102, tracking: 0, lineHeight: 1.1 },
  },
  {
    name: 'Gluten',
    note: 'soft handmade',
    type: { font: face('gluten', 800), size: 106, tracking: -0.01, lineHeight: 1.1 },
  },
  {
    name: 'Sour Gummy',
    note: 'puffy, friendly',
    type: { font: face('sourGummy', 800), size: 112, tracking: -0.01 },
  },
  {
    name: 'Caveat Brush',
    note: 'brush lettering',
    type: { font: face('caveatBrush', 400, 'cursive'), size: 140, tracking: 0, lineHeight: 0.98 },
  },
];

const S = 0.36;
const FW = 1080 * S;
const FH = 1920 * S;
const GAP = 20;
export const FONT_TEST = {
  width: Math.ceil(5 * FW + 6 * GAP) + 4,
  height: Math.ceil(2 * (FH + 64) + 3 * GAP),
  frame: 84,
} as const;

const mono = fontsOf('brand').mono;

export const FontTest: React.FC<{ scene: 'ultramarine' | 'cream' }> = ({ scene }) => {
  const v = variant(scene);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'oklch(96% 0.005 264)',
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: GAP,
        gap: GAP,
      }}
    >
      {FONT_CANDIDATES.map((c, i) => (
        <div key={c.name} style={{ width: FW }}>
          <div
            style={{
              width: FW,
              height: FH,
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 16,
            }}
          >
            <div
              style={{
                width: 1080,
                height: 1920,
                transform: `scale(${S})`,
                transformOrigin: 'left top',
                position: 'absolute',
              }}
            >
              <CutoutScene v={v} type={c.type} idSuffix={`f${i}`} />
            </div>
          </div>
          <div style={{ ...mono, fontSize: 21, marginTop: 8, color: C.ink }}>
            {String(i + 1).padStart(2, '0')} · {c.name}
          </div>
          <div style={{ ...mono, fontSize: 17, color: 'oklch(50% 0.005 264)' }}>{c.note}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

/**
 * Real-size specimen: each candidate across the full 1080 px width, as on a phone, on dark
 * and light paper in turn. A still, no animation.
 */
export const SPECIMEN_ROW = 330;

export const FontSpecimen: React.FC = () => (
  <AbsoluteFill style={{ flexDirection: 'column' }}>
    {FONT_CANDIDATES.map((c, i) => {
      const dark = i % 2 === 0;
      const id = `spec${i}`;
      return (
        <div
          key={c.name}
          style={{
            position: 'relative',
            height: SPECIMEN_ROW,
            backgroundColor: dark ? C.blue : C.cream,
            overflow: 'hidden',
          }}
        >
          <svg width={0} height={0} style={{ position: 'absolute' }}>
            <defs>
              <BoilFilter id={id} frame={0} scale={3.5} grain={0.08} />
            </defs>
          </svg>
          <div
            style={{
              position: 'absolute',
              left: 40,
              top: 18,
              ...mono,
              fontSize: 20,
              color: dark ? C.cream : C.ink,
              opacity: 0.7,
            }}
          >
            {String(i + 1).padStart(2, '0')} · {c.name.toUpperCase()}
          </div>
          <RevealText
            words={[
              { text: 'Paghi', at: -100 },
              { text: 'software', at: -100 },
              {
                text: 'esteri?',
                at: -100,
                highlight: { kind: 'marker', color: C.lemon, textColor: C.ink },
              },
            ]}
            font={c.type.font}
            fontSize={c.type.size}
            tracking={c.type.tracking}
            lineHeight={c.type.lineHeight}
            variation={c.type.variation}
            cut={c.type.cut ? { seed: 'specimen', amount: 1.6 } : undefined}
            color={dark ? C.white : C.ink}
            style={{ top: 58, left: 40, right: 40, filter: c.type.cut ? `url(#${id})` : undefined }}
          />
        </div>
      );
    })}
  </AbsoluteFill>
);
