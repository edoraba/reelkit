import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { fontsOf } from '../../brand/fonts';
import { RevealText, type RevealWord } from '../../components/RevealText';
import type { HighlightKind } from '../../highlights/Highlight';
import { InvoiceRoll, type Look } from '../../mascot/InvoiceRoll';
import { C } from '../moodboards/boards';
import { Grain } from '../moodboards/kit';
import { ramp } from './geometry';
import {
  Blob,
  Coral,
  Frond,
  Kelp,
  Palmette,
  Spiral,
  StarBloom,
  Sun,
  Swallow,
  WaveBand,
} from './motifs';
import { BoilFilter } from './paper';

/**
 * Cut-paper scenes on eight backgrounds: same building blocks (animated motifs, word reveal,
 * mascot in cut-paper finish), different paper colors and layouts.
 *   pnpm render:cutouts  ->  packages/video/out/lab/cutouts/{backgrounds.png,reel.mp4}
 */

interface Variant {
  key: string;
  label: string;
  bg: string;
  /** Extra background pieces (collage blocks) drawn under the motifs. */
  blocks?: (f: number) => React.ReactNode;
  motifs: (f: number) => React.ReactNode;
  headline: string;
  /** Index of the highlighted word. */
  mark: number;
  markKind: HighlightKind;
  markColor: string;
  markText?: string;
  text: string;
  pen: string;
  look: Partial<Look>;
}

const BASE_LOOK: Partial<Look> = { outlineWidth: 0, limbWidth: 16, rule: 'oklch(85% 0.04 264)' };

export const VARIANTS: Variant[] = [
  {
    key: 'ultramarine',
    label: 'Ultramarine',
    bg: C.blue,
    motifs: (f) => (
      <>
        <Frond f={f} x={130} y={1720} scale={1.6} rotate={-6} color={C.white} start={4} seed="u1" />
        <StarBloom f={f} x={890} y={300} r={130} color={C.coral} start={8} seed="u2" />
        <Blob f={f} x={200} y={290} r={80} color={C.lemon} start={12} seed="u3" />
        <Frond
          f={f}
          x={980}
          y={1930}
          scale={1.3}
          rotate={14}
          color={C.green}
          start={16}
          seed="u4"
          leaves={6}
        />
      </>
    ),
    headline: 'Paghi software esteri?',
    mark: 2,
    markKind: 'marker',
    markColor: C.lemon,
    markText: C.ink,
    text: C.white,
    pen: C.coral,
    look: { roll: C.lemon, accent: C.coral },
  },
  {
    key: 'coral',
    label: 'Coral',
    bg: C.coral,
    motifs: (f) => (
      <>
        <Kelp f={f} x={110} y={1930} scale={1.5} color={C.green} start={4} phase={0} />
        <Kelp
          f={f}
          x={230}
          y={1930}
          scale={1.2}
          color={C.blue}
          start={10}
          phase={1.7}
          height={300}
        />
        <Kelp f={f} x={930} y={1930} scale={1.6} color={C.green} start={14} phase={3} />
        <Spiral f={f} x={880} y={300} r={110} color={C.lemon} start={6} />
        <Swallow
          f={f}
          x={0}
          y={180}
          scale={1.2}
          color={C.white}
          travel={1080}
          speed={6}
          seed="c1"
        />
      </>
    ),
    headline: 'Ogni fattura estera vuole la sua autofattura.',
    mark: 6,
    markKind: 'marker',
    markColor: C.lemon,
    markText: C.ink,
    text: C.white,
    pen: C.white,
    look: { roll: C.lemon, accent: C.blue },
  },
  {
    key: 'lemon',
    label: 'Lemon',
    bg: C.lemon,
    motifs: (f) => (
      <>
        <Palmette f={f} x={190} y={330} scale={1.2} color={C.blue} start={6} />
        <Coral f={f} x={930} y={1760} scale={1.3} color={C.coral} start={10} seed="l1" />
        <Blob f={f} x={150} y={1560} r={90} color={C.green} start={14} seed="l2" />
        <Blob f={f} x={900} y={250} r={60} color={C.coral} start={18} seed="l3" />
      </>
    ),
    headline: 'L’IVA la integri tu con il TD17.',
    mark: 6,
    markKind: 'underline',
    markColor: C.blue,
    text: C.ink,
    pen: C.blue,
    look: { roll: C.coral, accent: C.blue },
  },
  {
    key: 'emerald',
    label: 'Emerald',
    bg: C.green,
    motifs: (f) => (
      <>
        <Spiral f={f} x={190} y={300} r={100} color={C.white} start={4} />
        <StarBloom f={f} x={900} y={280} r={95} color={C.lemon} start={8} points={7} seed="e1" />
        <Frond
          f={f}
          x={950}
          y={1760}
          scale={1.4}
          rotate={10}
          color={C.white}
          start={12}
          seed="e2"
        />
        <Blob f={f} x={150} y={1620} r={85} color={C.coral} start={16} seed="e3" />
      </>
    ),
    headline: 'Refattura legge il PDF e prepara l’autofattura.',
    mark: 6,
    markKind: 'marker',
    markColor: C.lemon,
    markText: C.ink,
    text: C.white,
    pen: C.white,
    look: { roll: C.lemon, accent: C.coral },
  },
  {
    key: 'paper',
    label: 'Paper',
    bg: C.white,
    motifs: (f) => (
      <>
        <Frond f={f} x={120} y={1660} scale={1.5} rotate={-8} color={C.blue} start={4} seed="p1" />
        <Sun f={f} x={880} y={300} scale={1.6} color={C.coral} start={8} />
        <WaveBand f={f} x={0} y={1790} color={C.blue} width={1080} scallops={9} h={40} />
      </>
    ),
    headline: 'Tu come le fai?',
    mark: 1,
    markKind: 'marker',
    markColor: C.lemon,
    markText: C.ink,
    text: C.ink,
    pen: C.blue,
    look: { roll: C.lemon, accent: C.coral, sheet: 'oklch(97% 0.01 90)' },
  },
  {
    key: 'black',
    label: 'Black',
    bg: C.ink,
    motifs: (f) => (
      <>
        <Sun f={f} x={200} y={300} scale={1.4} color={C.lemon} start={4} />
        <Palmette f={f} x={920} y={1720} scale={1.3} color={C.coral} start={10} />
        <Swallow
          f={f + 60}
          x={0}
          y={260}
          scale={1}
          color={C.white}
          travel={1080}
          speed={5}
          seed="k1"
        />
        <Blob f={f} x={140} y={1640} r={80} color={C.blue} start={16} seed="k2" />
      </>
    ),
    headline: 'Dieci fatture estere al mese?',
    mark: 0,
    markKind: 'underline',
    markColor: C.coral,
    text: C.white,
    pen: C.lemon,
    look: { roll: C.lemon, accent: C.coral },
  },
  {
    key: 'blocks',
    label: 'Collage blocks',
    bg: C.blue,
    blocks: () => (
      <>
        <rect x={-20} y={1240} width={600} height={720} fill={C.lemon} />
        <rect x={540} y={1180} width={600} height={780} fill={C.coral} />
        <rect x={700} y={-20} width={420} height={330} fill={C.green} />
      </>
    ),
    motifs: (f) => (
      <>
        <Palmette f={f} x={260} y={1700} scale={1.2} color={C.green} start={6} />
        <Frond
          f={f}
          x={950}
          y={1900}
          scale={1.2}
          rotate={8}
          color={C.white}
          start={10}
          seed="bl1"
        />
        <StarBloom f={f} x={900} y={160} r={90} color={C.lemon} start={14} seed="bl2" />
      </>
    ),
    headline: 'Dal PDF all’autofattura.',
    mark: 2,
    markKind: 'marker',
    markColor: C.lemon,
    markText: C.ink,
    text: C.white,
    pen: C.white,
    look: { roll: C.lemon, accent: C.blue },
  },
  {
    key: 'kraft',
    label: 'Kraft',
    bg: C.kraft,
    motifs: (f) => (
      <>
        <Kelp f={f} x={120} y={1930} scale={1.4} color={C.green} start={4} phase={0.5} />
        <Blob f={f} x={880} y={280} r={95} color={C.blue} start={8} seed="kr1" />
        <StarBloom f={f} x={930} y={1640} r={85} color={C.coral} start={12} seed="kr2" />
        <Blob f={f} x={170} y={300} r={55} color={C.coral} start={16} seed="kr3" />
      </>
    ),
    headline: 'Provalo: link in bio.',
    mark: 1,
    markKind: 'marker',
    markColor: C.lemon,
    markText: C.ink,
    text: C.ink,
    pen: C.blue,
    look: { roll: C.lemon, accent: C.coral },
  },
];

const fonts = fontsOf('brand');

function words(v: Variant): RevealWord[] {
  return v.headline.split(' ').map((text, i) => ({
    text,
    at: 8 + i * 5,
    highlight:
      i === v.mark ? { kind: v.markKind, color: v.markColor, textColor: v.markText } : undefined,
  }));
}

/** One cut-paper scene; frames are local (0 = scene start). */
export const CutoutScene: React.FC<{ v: Variant }> = ({ v }) => {
  const f = useCurrentFrame();
  const id = `cs${v.key}`;
  return (
    <AbsoluteFill style={{ backgroundColor: v.bg, overflow: 'hidden' }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <BoilFilter id={id} frame={f} />
        </defs>
        <g filter={`url(#${id})`}>
          {v.blocks?.(f)}
          {v.motifs(f)}
        </g>
      </svg>
      <RevealText
        words={words(v)}
        font={fonts.display}
        fontSize={118}
        color={v.text}
        style={{ top: 470, left: 96, right: 150 }}
      />
      <InvoiceRoll
        width={420}
        cues={[
          { at: 0, pose: 'neutral' },
          { at: 40, pose: 'wave' },
        ]}
        talk={[{ from: 8, to: 50 }]}
        gaze={{ x: 0, y: -0.5 }}
        seed={`cutout-${v.key}`}
        pen={v.pen}
        look={{ ...BASE_LOOK, ...v.look }}
        defs={<BoilFilter id={`${id}m`} frame={f} scale={4} grain={0.1} />}
        filter={`url(#${id}m)`}
        style={{ position: 'absolute', left: 330, top: 1030 }}
      />
      <Grain id={`${id}g`} opacity={0.16} width={1080} height={1920} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- reel: 4 scenes, paper slides

const REEL_KEYS = ['ultramarine', 'coral', 'blocks', 'paper'];
const SCENE = 90;
const SLIDE = 10;
export const CUTOUT_REEL_DURATION = REEL_KEYS.length * SCENE;

const Slide: React.FC<{ children: React.ReactNode; first: boolean }> = ({ children, first }) => {
  const f = useCurrentFrame();
  const p = first ? 1 : ramp(f, 0, SLIDE);
  return (
    <AbsoluteFill style={{ transform: `translateX(${(1 - p) * 100}%) rotate(${(1 - p) * 4}deg)` }}>
      {children}
    </AbsoluteFill>
  );
};

export const CutoutReel: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.ink }}>
    {REEL_KEYS.map((key, i) => {
      const v = VARIANTS.find((x) => x.key === key)!;
      return (
        <Sequence key={key} from={i * SCENE} durationInFrames={SCENE + SLIDE}>
          <Slide first={i === 0}>
            <CutoutScene v={v} />
          </Slide>
        </Sequence>
      );
    })}
  </AbsoluteFill>
);

// --------------------------------------------------- static sheet: 8 backgrounds side by side

const S = 0.42;
const FW = 1080 * S;
const FH = 1920 * S;
const GAP = 22;
/** Rendered as a still at frame CUTOUT_SHEET.frame, when every scene has grown in. */
export const CUTOUT_SHEET = {
  width: Math.ceil(4 * FW + 5 * GAP) + 4,
  height: Math.ceil(2 * (FH + 48) + 3 * GAP),
  frame: 84,
} as const;

export const CutoutBackgrounds: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: 'oklch(96% 0.005 264)',
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: GAP,
      gap: GAP,
    }}
  >
    {VARIANTS.map((v, i) => (
      <div key={v.key} style={{ width: FW }}>
        <div
          style={{
            width: FW,
            height: FH,
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 18,
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
            <CutoutScene v={v} />
          </div>
        </div>
        <div
          style={{
            ...fonts.mono,
            fontSize: 22,
            marginTop: 10,
            color: C.ink,
            letterSpacing: '0.05em',
          }}
        >
          {String(i + 1).padStart(2, '0')} · {v.label.toUpperCase()}
        </div>
      </div>
    ))}
  </AbsoluteFill>
);
