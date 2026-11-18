import { cutoutPalette, type CutoutPalette, type CutoutPaletteKey } from '@reelkit/brand';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { fontsOf } from '../../brand/fonts';
import { Grain } from '../moodboards/kit';
import {
  Blob,
  Coral,
  Frond,
  Kelp,
  Palmette,
  ScissorCut,
  Spiral,
  StarBloom,
  Sun,
  Swallow,
  WaveBand,
} from './motifs';
import { BoilFilter, LiftFilter } from './paper';

/**
 * Catalogue of the animated cut-paper motifs: twelve cells on the six palettes (D-027).
 *   pnpm render:cutouts  ->  packages/video/out/lab/cutouts/motifs.mp4
 */
export const MOTIF_LAB_DURATION = 240;

const CW = 360;
const CH = 480;
const fonts = fontsOf('brand');

interface Cell {
  label: string;
  /** Palette: background, label color and motif colors. */
  pal: CutoutPaletteKey;
  boil?: { every: number; scale: number };
  draw: (f: number, p: CutoutPalette) => React.ReactNode;
}

const CELLS: Cell[] = [
  {
    label: 'Frond · grows, bends',
    pal: 'blu',
    draw: (f, p) => <Frond f={f} x={180} y={450} scale={1.05} color={p.motifs[0]} start={6} />,
  },
  {
    label: 'Blobs · reshape',
    pal: 'notte',
    draw: (f, p) => (
      <>
        <Blob f={f} x={130} y={210} r={80} color={p.motifs[0]} seed="b1" start={4} />
        <Blob f={f} x={235} y={300} r={70} color={p.motifs[2]} seed="b2" start={10} />
        <Blob f={f} x={150} y={370} r={48} color={p.motifs[1]} seed="b3" start={16} />
      </>
    ),
  },
  {
    label: 'Star · blooms, twinkles',
    pal: 'azzurro',
    draw: (f, p) => <StarBloom f={f} x={180} y={260} r={115} color={p.motifs[0]} start={10} />,
  },
  {
    label: 'Coral · branches',
    pal: 'ghiaccio',
    draw: (f, p) => <Coral f={f} x={180} y={460} color={p.motifs[0]} start={8} length={96} />,
  },
  {
    label: 'Spiral · unrolls',
    pal: 'viola',
    draw: (f, p) => <Spiral f={f} x={180} y={260} r={120} color={p.motifs[1]} start={8} />,
  },
  {
    label: 'Waves · ripple',
    pal: 'lavanda',
    draw: (f, p) => (
      <>
        <WaveBand f={f} x={0} y={300} color={p.motifs[0]} />
        <WaveBand f={f + 40} x={0} y={390} color={p.motifs[2]} h={26} />
      </>
    ),
  },
  {
    label: 'Swallows · flap',
    pal: 'blu',
    draw: (f, p) => (
      <>
        <Swallow f={f} x={0} y={170} color={p.motifs[0]} seed="s1" />
        <Swallow f={f + 70} x={0} y={330} scale={0.75} color={p.motifs[1]} seed="s2" speed={3.2} />
      </>
    ),
  },
  {
    label: 'Palmette · opens',
    pal: 'notte',
    draw: (f, p) => <Palmette f={f} x={180} y={380} color={p.motifs[0]} start={14} length={150} />,
  },
  {
    label: 'Cut · snips, lifts',
    pal: 'azzurro',
    draw: (f, p) => (
      <ScissorCut
        f={f}
        x={180}
        y={260}
        scale={1.3}
        color={p.motifs[0]}
        ink={p.text}
        start={20}
        lift={(id, amount) => <LiftFilter id={id} lift={amount} />}
      />
    ),
  },
  {
    label: 'Sun · rays pulse',
    pal: 'ghiaccio',
    draw: (f, p) => <Sun f={f} x={180} y={260} scale={1.3} color={p.motifs[1]} start={6} />,
  },
  {
    label: 'Kelp · wave travels up',
    pal: 'viola',
    draw: (f, p) => (
      <>
        <Kelp f={f} x={100} y={480} color={p.motifs[0]} start={4} phase={0} />
        <Kelp f={f} x={190} y={480} color={p.motifs[2]} start={12} phase={1.6} height={330} />
        <Kelp f={f} x={275} y={480} color={p.motifs[1]} start={20} phase={3.1} height={280} />
      </>
    ),
  },
  {
    label: 'Boil · stop-motion edges',
    pal: 'lavanda',
    boil: { every: 3, scale: 13 },
    draw: (f, p) => <Palmette f={f} x={180} y={380} color={p.motifs[0]} start={-60} length={150} />,
  },
];

export const MotifLab: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {CELLS.map((c, i) => {
        const id = `ml${i}`;
        const p = cutoutPalette(c.pal);
        return (
          <div
            key={c.label}
            style={{
              position: 'relative',
              width: CW,
              height: CH,
              overflow: 'hidden',
              backgroundColor: p.bg,
            }}
          >
            <svg
              width={CW}
              height={CH}
              style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
            >
              <defs>
                <BoilFilter id={id} frame={frame} every={c.boil?.every} scale={c.boil?.scale} />
              </defs>
              <g filter={`url(#${id})`}>{c.draw(frame, p)}</g>
            </svg>
            <Grain id={`${id}g`} opacity={0.16} width={CW} height={CH} />
            <div
              style={{
                position: 'absolute',
                left: 16,
                top: 14,
                ...fonts.mono,
                fontSize: 17,
                letterSpacing: '0.04em',
                color: p.text,
                opacity: 0.85,
                textTransform: 'uppercase',
              }}
            >
              {String(i + 1).padStart(2, '0')} {c.label}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
