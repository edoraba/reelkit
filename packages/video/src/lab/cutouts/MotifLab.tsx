import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { fontsOf } from '../../brand/fonts';
import { C } from '../moodboards/boards';
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
 * Catalogue of the animated cut-paper motifs: twelve cells, each on a different background.
 *   pnpm render:cutouts  ->  packages/video/out/lab/cutouts/motifs.mp4
 */
export const MOTIF_LAB_DURATION = 240;

const CW = 360;
const CH = 480;
const fonts = fontsOf('brand');

interface Cell {
  label: string;
  bg: string;
  text: string;
  boil?: { every: number; scale: number };
  draw: (f: number) => React.ReactNode;
}

const CELLS: Cell[] = [
  {
    label: 'Frond · grows, bends',
    bg: C.blue,
    text: C.white,
    draw: (f) => <Frond f={f} x={180} y={450} scale={1.05} color={C.white} start={6} />,
  },
  {
    label: 'Blobs · reshape',
    bg: C.coral,
    text: C.white,
    draw: (f) => (
      <>
        <Blob f={f} x={130} y={210} r={80} color={C.lemon} seed="b1" start={4} />
        <Blob f={f} x={235} y={300} r={70} color={C.blue} seed="b2" start={10} />
        <Blob f={f} x={150} y={370} r={48} color={C.white} seed="b3" start={16} />
      </>
    ),
  },
  {
    label: 'Star · blooms, twinkles',
    bg: C.lemon,
    text: C.ink,
    draw: (f) => <StarBloom f={f} x={180} y={260} r={115} color={C.coral} start={10} />,
  },
  {
    label: 'Coral · branches',
    bg: C.white,
    text: C.ink,
    draw: (f) => <Coral f={f} x={180} y={460} color={C.coral} start={8} length={96} />,
  },
  {
    label: 'Spiral · unrolls',
    bg: C.green,
    text: C.white,
    draw: (f) => <Spiral f={f} x={180} y={260} r={120} color={C.white} start={8} />,
  },
  {
    label: 'Waves · ripple',
    bg: C.white,
    text: C.ink,
    draw: (f) => (
      <>
        <WaveBand f={f} x={0} y={300} color={C.blue} />
        <WaveBand f={f + 40} x={0} y={390} color={C.lemon} h={26} />
      </>
    ),
  },
  {
    label: 'Swallows · flap',
    bg: C.blue,
    text: C.white,
    draw: (f) => (
      <>
        <Swallow f={f} x={0} y={170} color={C.white} seed="s1" />
        <Swallow f={f + 70} x={0} y={330} scale={0.75} color={C.lemon} seed="s2" speed={3.2} />
      </>
    ),
  },
  {
    label: 'Palmette · opens',
    bg: C.coral,
    text: C.white,
    draw: (f) => <Palmette f={f} x={180} y={380} color={C.green} start={14} length={150} />,
  },
  {
    label: 'Cut · snips, lifts',
    bg: C.kraft,
    text: C.ink,
    draw: (f) => (
      <ScissorCut
        f={f}
        x={180}
        y={260}
        scale={1.3}
        color={C.blue}
        ink={C.ink}
        start={20}
        lift={(id, amount) => <LiftFilter id={id} lift={amount} />}
      />
    ),
  },
  {
    label: 'Sun · rays pulse',
    bg: C.ink,
    text: C.white,
    draw: (f) => <Sun f={f} x={180} y={260} scale={1.3} color={C.lemon} start={6} />,
  },
  {
    label: 'Kelp · wave travels up',
    bg: C.lemon,
    text: C.ink,
    draw: (f) => (
      <>
        <Kelp f={f} x={100} y={480} color={C.green} start={4} phase={0} />
        <Kelp f={f} x={190} y={480} color={C.blue} start={12} phase={1.6} height={330} />
        <Kelp f={f} x={275} y={480} color={C.green} start={20} phase={3.1} height={280} />
      </>
    ),
  },
  {
    label: 'Boil · stop-motion edges',
    bg: C.green,
    text: C.white,
    boil: { every: 3, scale: 13 },
    draw: (f) => <Palmette f={f} x={180} y={380} color={C.white} start={-60} length={150} />,
  },
];

export const MotifLab: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {CELLS.map((c, i) => {
        const id = `ml${i}`;
        return (
          <div
            key={c.label}
            style={{
              position: 'relative',
              width: CW,
              height: CH,
              overflow: 'hidden',
              backgroundColor: c.bg,
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
              <g filter={`url(#${id})`}>{c.draw(frame)}</g>
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
                color: c.text,
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
