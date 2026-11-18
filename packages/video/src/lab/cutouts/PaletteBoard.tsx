import {
  contrast,
  cutoutPalettes,
  pickerFor,
  sceneLayouts,
  toHex,
  type CutoutPalette,
  type CutoutPaletteKey,
  type Interaction,
  type MotifKind,
  type MotifSpot,
  type OfficeObjectKey,
} from '@reelkit/brand';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { fontsOf } from '../../brand/fonts';
import { RevealText, type RevealWord } from '../../components/RevealText';
import { InvoiceRoll } from '../../mascot/InvoiceRoll';
import { Grain } from '../moodboards/kit';
import { Blob, Frond, Kelp, Palmette, Spiral, StarBloom, Sun, WaveBand } from './motifs';
import { OFFICE_OBJECTS, type ObjectProps } from './office';
import { BoilFilter, CutoutStickerFilter } from './paper';
import { DEFAULT_TYPE } from './scenes';

/**
 * The six cut-paper palettes (D-027, Refattura tones) on one board: swatches with hex and contrast, and a
 * sample scene per palette (Sour Gummy headline, organic motifs, an office object, the
 * mascot with its sticker border). Rendered as a still at frame PALETTE_BOARD.frame.
 *   pnpm render:cutouts  ->  packages/video/out/lab/cutouts/palettes.png
 */

type AnyMotif = React.FC<Record<string, unknown>>;

const MOTIFS: Record<MotifKind, AnyMotif> = {
  frond: Frond as unknown as AnyMotif,
  blob: Blob as unknown as AnyMotif,
  kelp: Kelp as unknown as AnyMotif,
  starBloom: StarBloom as unknown as AnyMotif,
  spiral: Spiral as unknown as AnyMotif,
  sun: Sun as unknown as AnyMotif,
  waveBand: WaveBand as unknown as AnyMotif,
  palmette: Palmette as unknown as AnyMotif,
};

const OBJECTS = Object.fromEntries(OFFICE_OBJECTS.map((o) => [o.key, o.C])) as Record<
  OfficeObjectKey,
  React.FC<ObjectProps>
>;

/** A motif touched by the mascot answers for about 24 frames: it sways, shakes or grows. */
export interface MotifReaction {
  motifId: string;
  kind: Interaction;
  frame: number;
}

const REACTION_FRAMES = 24;

const Motif: React.FC<{
  m: MotifSpot;
  f: number;
  p: CutoutPalette;
  reaction?: MotifReaction;
}> = ({ m, f, p, reaction }) => {
  const C = MOTIFS[m.kind];
  const el = <C f={f} x={m.x} y={m.y} color={p.motifs[m.color]} start={m.start} {...m.params} />;
  const t = reaction ? f - reaction.frame : -1;
  if (!reaction || t < 0 || t > REACTION_FRAMES) return el;
  const decay = 1 - t / REACTION_FRAMES;
  if (reaction.kind === 'water') {
    const s = 1 + 0.1 * Math.sin((t / REACTION_FRAMES) * Math.PI);
    return (
      <g transform={`translate(${m.x} ${m.y}) scale(${s}) translate(${-m.x} ${-m.y})`}>{el}</g>
    );
  }
  const amp = reaction.kind === 'tickle' ? 10 : reaction.kind === 'lean' ? 6 : 4;
  const angle = Math.sin(Math.floor(t / 2) * 1.8) * amp * decay;
  return <g transform={`rotate(${angle} ${m.x} ${m.y})`}>{el}</g>;
};

/** Sample headline of a palette, word by word, with its key word highlighted. */
export function headlineWords(p: CutoutPalette): RevealWord[] {
  const { sample } = sceneLayouts[p.key as CutoutPaletteKey];
  return sample.headline.split(' ').map((text, i) => ({
    text,
    at: 8 + i * 5,
    highlight:
      i === sample.mark
        ? { kind: p.highlight.kind, color: p.highlight.color, textColor: p.highlight.text }
        : undefined,
  }));
}

/**
 * The paper background of a palette, drawn from `sceneLayouts`: color, motifs and the office
 * object. `layer` splits it around the mascot: `back` (color, back motifs, object, grain) and
 * `front` (front motifs only, transparent), `all` draws both.
 */
export const PaletteBackdrop: React.FC<{
  p: CutoutPalette;
  idSuffix?: string;
  layer?: 'all' | 'back' | 'front';
  /** Hide the office object (the mascot holds its own copy for a gag). */
  hideObject?: boolean;
  reactions?: MotifReaction[];
}> = ({ p, idSuffix = '', layer = 'all', hideObject = false, reactions = [] }) => {
  const f = useCurrentFrame();
  const layout = sceneLayouts[p.key as CutoutPaletteKey];
  const id = `bd${p.key}${idSuffix}${layer}`;
  const Obj = OBJECTS[layout.object];
  const back = layer !== 'front';
  const front = layer !== 'back';
  const motifs = (depth: 'back' | 'front') =>
    layout.motifs
      .filter((m) => m.depth === depth)
      .map((m) => (
        <Motif key={m.id} m={m} f={f} p={p} reaction={reactions.find((r) => r.motifId === m.id)} />
      ));
  return (
    <AbsoluteFill style={{ backgroundColor: back ? p.bg : 'transparent', overflow: 'hidden' }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <BoilFilter id={id} frame={f} />
        </defs>
        <g filter={`url(#${id})`}>
          {back && motifs('back')}
          {back && !hideObject && (
            <Obj
              f={f}
              x={layout.objectAt.x}
              y={layout.objectAt.y}
              scale={layout.objectAt.scale}
              start={4}
              a={p.motifs[0]}
              b={p.motifs[1]}
              c={p.motifs[2]}
              hole={p.bg}
              ink={p.text}
              pick={pickerFor(p)}
            />
          )}
          {front && motifs('front')}
        </g>
      </svg>
      {back && <Grain id={`${id}g`} opacity={0.16} width={1080} height={1920} />}
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
