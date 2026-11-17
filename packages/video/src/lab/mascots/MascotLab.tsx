import { backgrounds } from '@reelkit/brand';
import { AbsoluteFill } from 'remotion';
import { fontsOf } from '../../brand/fonts';
import { GraphPaper } from '../../textures/Paper';
import { CANDIDATES, type Candidate, type Family } from './candidates';

/**
 * Mascot candidate sheets, each candidate on a different background of the visual system
 * (squared paper or plain), to check how it reads on blue, paper, sky and graphite.
 *   pnpm render:mascots  ->  packages/video/out/lab/mascots-*.png
 */
export const MASCOT_SHEETS = {
  close: { families: ['close'] as Family[], cols: 2, cellH: 660 },
  other: { families: ['different', 'logo'] as Family[], cols: 2, cellH: 660 },
} as const;
export type MascotSheet = keyof typeof MASCOT_SHEETS;

export function sheetHeight(sheet: MascotSheet): number {
  const s = MASCOT_SHEETS[sheet];
  const n = CANDIDATES.filter((c) => s.families.includes(c.family)).length;
  return Math.ceil(n / s.cols) * s.cellH;
}

const fonts = fontsOf('brand');
const LABEL_H = 116;

const Cell: React.FC<{ c: Candidate; index: number; height: number }> = ({ c, index, height }) => {
  const bg = backgrounds[c.bg];
  const art = height - LABEL_H;
  return (
    <div style={{ position: 'relative', width: 540, height, overflow: 'hidden' }}>
      {c.texture === 'grid' ? (
        <GraphPaper fill={bg.fill} line={bg.dots} spacing={40} />
      ) : (
        <AbsoluteFill style={{ backgroundColor: bg.fill }} />
      )}
      <svg
        viewBox="0 0 400 480"
        width={(art - 20) * (400 / 480)}
        height={art - 20}
        style={{
          position: 'absolute',
          top: 20,
          left: (540 - (art - 20) * (400 / 480)) / 2,
          overflow: 'visible',
        }}
      >
        {c.draw(bg.pen)}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 28,
          right: 28,
          bottom: 22,
          color: bg.text,
          ...fonts.mono,
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {String(index).padStart(2, '0')} · {c.name}
        </div>
        <div style={{ fontSize: 20, opacity: 0.75, marginTop: 4 }}>{c.note}</div>
      </div>
    </div>
  );
};

export const MascotLab: React.FC<{ sheet: MascotSheet }> = ({ sheet }) => {
  const s = MASCOT_SHEETS[sheet];
  const items = CANDIDATES.map((c, i) => ({ c, index: i + 1 })).filter(({ c }) =>
    s.families.includes(c.family),
  );
  return (
    <AbsoluteFill style={{ flexDirection: 'row', flexWrap: 'wrap', alignContent: 'flex-start' }}>
      {items.map(({ c, index }) => (
        <Cell key={c.name} c={c} index={index} height={s.cellH} />
      ))}
    </AbsoluteFill>
  );
};
