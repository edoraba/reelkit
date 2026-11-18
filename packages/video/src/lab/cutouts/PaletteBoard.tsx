import { contrast, cutoutPalettes, pickerFor, toHex, type CutoutPalette } from '@reelkit/brand';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { fontsOf } from '../../brand/fonts';
import { RevealText, type RevealWord } from '../../components/RevealText';
import { InvoiceRoll } from '../../mascot/InvoiceRoll';
import { Grain } from '../moodboards/kit';
import { Blob, Frond, Kelp, Palmette, Spiral, StarBloom, Sun, WaveBand } from './motifs';
import {
  Calculator,
  CalendarPage,
  CoffeeCup,
  Envelope,
  RubberStamp,
  Stapler,
  type ObjectProps,
} from './office';
import { BoilFilter, CutoutStickerFilter } from './paper';
import { DEFAULT_TYPE } from './scenes';

/**
 * The six cut-paper palettes (D-027, Refattura tones) on one board: swatches with hex and contrast, and a
 * sample scene per palette (Sour Gummy headline, organic motifs, an office object, the
 * mascot with its sticker border). Rendered as a still at frame PALETTE_BOARD.frame.
 *   pnpm render:cutouts  ->  packages/video/out/lab/cutouts/palettes.png
 */

interface Layout {
  headline: string;
  mark: number;
  object: React.FC<ObjectProps>;
  motifs: (f: number, p: CutoutPalette) => React.ReactNode;
}

const LAYOUTS: Record<string, Layout> = {
  blu: {
    headline: 'Paghi software esteri?',
    mark: 2,
    object: Calculator,
    motifs: (f, p) => (
      <>
        <StarBloom f={f} x={890} y={300} r={120} color={p.motifs[1]} start={8} seed="pb1" />
        <Frond
          f={f}
          x={130}
          y={1760}
          scale={1.5}
          rotate={-6}
          color={p.motifs[0]}
          start={4}
          seed="pb2"
        />
        <Blob f={f} x={950} y={1700} r={80} color={p.motifs[2]} start={12} seed="pb3" />
      </>
    ),
  },
  notte: {
    headline: 'Ogni fattura estera vuole la sua autofattura.',
    mark: 6,
    object: Stapler,
    motifs: (f, p) => (
      <>
        <Spiral f={f} x={890} y={300} r={105} color={p.motifs[1]} start={6} />
        <Kelp f={f} x={110} y={1930} scale={1.5} color={p.motifs[0]} start={4} />
        <Kelp f={f} x={950} y={1930} scale={1.4} color={p.motifs[2]} start={12} phase={2} />
      </>
    ),
  },
  azzurro: {
    headline: 'Tu come le fai?',
    mark: 1,
    object: CalendarPage,
    motifs: (f, p) => (
      <>
        <Sun f={f} x={880} y={300} scale={1.5} color={p.motifs[1]} start={8} />
        <Frond
          f={f}
          x={120}
          y={1680}
          scale={1.5}
          rotate={-8}
          color={p.motifs[0]}
          start={4}
          seed="pp1"
        />
        <WaveBand f={f} x={0} y={1800} color={p.motifs[0]} width={1080} scallops={9} h={40} />
      </>
    ),
  },
  ghiaccio: {
    headline: 'L’IVA la integri tu con il TD17.',
    mark: 6,
    object: RubberStamp,
    motifs: (f, p) => (
      <>
        <Palmette f={f} x={900} y={340} scale={1.1} color={p.motifs[0]} start={6} />
        <Blob f={f} x={150} y={1600} r={90} color={p.motifs[2]} start={14} seed="pl1" />
        <StarBloom f={f} x={940} y={1640} r={80} color={p.motifs[1]} start={10} seed="pl2" />
      </>
    ),
  },
  viola: {
    headline: 'Refattura legge il PDF e prepara l’autofattura.',
    mark: 6,
    object: Envelope,
    motifs: (f, p) => (
      <>
        <StarBloom
          f={f}
          x={900}
          y={290}
          r={95}
          color={p.motifs[1]}
          start={8}
          points={7}
          seed="ps1"
        />
        <Frond
          f={f}
          x={950}
          y={1780}
          scale={1.4}
          rotate={10}
          color={p.motifs[0]}
          start={12}
          seed="ps2"
        />
        <Blob f={f} x={150} y={1640} r={85} color={p.motifs[2]} start={16} seed="ps3" />
      </>
    ),
  },
  lavanda: {
    headline: 'Provalo: link in bio.',
    mark: 1,
    object: CoffeeCup,
    motifs: (f, p) => (
      <>
        <Blob f={f} x={890} y={290} r={95} color={p.motifs[0]} start={8} seed="pr1" />
        <Kelp f={f} x={120} y={1930} scale={1.4} color={p.motifs[1]} start={4} phase={0.5} />
        <Palmette f={f} x={930} y={1720} scale={1.1} color={p.motifs[1]} start={12} />
      </>
    ),
  },
};

/** Sample headline of a palette, word by word, with its key word highlighted. */
export function headlineWords(p: CutoutPalette): RevealWord[] {
  const layout = LAYOUTS[p.key]!;
  return layout.headline.split(' ').map((text, i) => ({
    text,
    at: 8 + i * 5,
    highlight:
      i === layout.mark
        ? { kind: p.highlight.kind, color: p.highlight.color, textColor: p.highlight.text }
        : undefined,
  }));
}

/** The paper background of a palette: color, animated motifs and the office object. */
export const PaletteBackdrop: React.FC<{ p: CutoutPalette; idSuffix?: string }> = ({
  p,
  idSuffix = '',
}) => {
  const f = useCurrentFrame();
  const layout = LAYOUTS[p.key]!;
  const id = `bd${p.key}${idSuffix}`;
  const Obj = layout.object;
  return (
    <AbsoluteFill style={{ backgroundColor: p.bg, overflow: 'hidden' }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <BoilFilter id={id} frame={f} />
        </defs>
        <g filter={`url(#${id})`}>
          {layout.motifs(f, p)}
          <Obj
            f={f}
            x={220}
            y={290}
            scale={0.8}
            start={4}
            a={p.motifs[0]}
            b={p.motifs[1]}
            c={p.motifs[2]}
            hole={p.bg}
            ink={p.text}
            pick={pickerFor(p)}
          />
        </g>
      </svg>
      <Grain id={`${id}g`} opacity={0.16} width={1080} height={1920} />
    </AbsoluteFill>
  );
};

/** One cut-paper scene driven entirely by a palette. */
export const PaletteScene: React.FC<{ p: CutoutPalette; idSuffix?: string }> = ({
  p,
  idSuffix = '',
}) => {
  const f = useCurrentFrame();
  const id = `pal${p.key}${idSuffix}`;
  const words = headlineWords(p);
  return (
    <AbsoluteFill>
      <PaletteBackdrop p={p} idSuffix={idSuffix} />
      <RevealText
        words={words}
        font={DEFAULT_TYPE.font}
        fontSize={DEFAULT_TYPE.size}
        tracking={DEFAULT_TYPE.tracking}
        color={p.text}
        style={{ top: 480, left: 96, right: 150 }}
      />
      <InvoiceRoll
        width={420}
        cues={[
          { at: 0, pose: 'neutral' },
          { at: 40, pose: 'wave' },
        ]}
        talk={[{ from: 8, to: 50 }]}
        gaze={{ x: 0, y: -0.5 }}
        seed={`palette-${p.key}`}
        pen={p.pen}
        look={{ limbWidth: 12, roll: p.roll, accent: p.pill, rule: 'oklch(85% 0.04 264)' }}
        defs={<CutoutStickerFilter id={`${id}m`} frame={f} />}
        filter={`url(#${id}m)`}
        style={{ position: 'absolute', left: 330, top: 1040 }}
      />
    </AbsoluteFill>
  );
};

// ----------------------------------------------------------------------------------- board

const S = 0.315;
const COL = 1080 * S;
const GAP = 26;
export const PALETTE_BOARD = {
  width: Math.ceil(6 * COL + 7 * GAP),
  height: 1070,
  frame: 84,
} as const;

const fonts = fontsOf('brand');

const Swatch: React.FC<{ label: string; color: string; note?: string }> = ({
  label,
  color,
  note,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: color,
        border: '2px solid oklch(0% 0 0 / 0.12)',
      }}
    />
    <div style={{ ...fonts.mono, fontSize: 15, color: 'oklch(30% 0 0)', lineHeight: 1.2 }}>
      {label} <span style={{ opacity: 0.6 }}>{toHex(color)}</span>
      {note && <div style={{ opacity: 0.6 }}>{note}</div>}
    </div>
  </div>
);

export const PaletteBoard: React.FC = () => (
  <AbsoluteFill
    style={{ backgroundColor: 'oklch(97% 0.005 90)', flexDirection: 'row', padding: GAP, gap: GAP }}
  >
    {(cutoutPalettes as readonly CutoutPalette[]).map((p) => {
      const textC = contrast(p.bg, p.text);
      const markC =
        p.highlight.kind !== 'underline'
          ? contrast(p.highlight.color, p.highlight.text ?? p.text)
          : contrast(p.bg, p.highlight.color);
      return (
        <div key={p.key} style={{ width: COL }}>
          <div
            style={{
              fontFamily: "'Sour Gummy', sans-serif",
              fontWeight: 800,
              fontSize: 40,
              color: 'oklch(21% 0 0)',
            }}
          >
            {p.name}
          </div>
          <div
            style={{
              ...fonts.mono,
              fontSize: 15,
              color: 'oklch(45% 0 0)',
              marginBottom: 14,
              letterSpacing: '0.08em',
            }}
          >
            {p.tone.toUpperCase()} · TEXT {textC.toFixed(1)}:1 · MARK {markC.toFixed(1)}:1
          </div>
          <div
            style={{
              width: COL,
              height: 1920 * S,
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 16,
              marginBottom: 16,
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
              <PaletteScene p={p} />
            </div>
          </div>
          <Swatch label="background" color={p.bg} />
          <Swatch label="text" color={p.text} />
          <Swatch label="motif 1" color={p.motifs[0]} />
          <Swatch label="motif 2" color={p.motifs[1]} />
          <Swatch label="motif 3" color={p.motifs[2]} />
          <Swatch label={`highlight (${p.highlight.kind})`} color={p.highlight.color} />
          <Swatch label="limbs" color={p.pen} />
        </div>
      );
    })}
  </AbsoluteFill>
);
