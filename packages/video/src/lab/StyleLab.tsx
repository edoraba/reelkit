import { backgrounds, refattura, social, type BackgroundName } from '@reelkit/brand';
import { AbsoluteFill } from 'remotion';
import { fontsOf } from '../brand/fonts';
import { InvoiceRoll, invoiceRollShape, type InvoiceRollProps } from '../mascot/InvoiceRoll';
import type { PoseCue } from '../mascot/poses';
import { StickerFilter } from '../mascot/StickerFilter';
import { GraphPaper } from '../textures/Paper';

/**
 * The chosen mascot (invoice roll, A4) drawn in many rendering styles, to pick a look.
 * Same pose everywhere; only colors, strokes, layers and SVG filters change.
 *   pnpm render:styles  ->  packages/video/out/lab/styles-*.png
 */

const CUES: PoseCue[] = [{ at: 0, pose: 'wave' }];
const CHAR_W = 300;
const CELL_W = 540;
const CELL_H = 640;
const CHAR_LEFT = (CELL_W - CHAR_W) / 2;
const CHAR_TOP = 40;

const INK = refattura.inkBlue;
const WHITE = refattura.sheetWhite;
const GRAPHITE = refattura.graphite;
const mono = fontsOf('brand').mono;

type CharProps = Partial<InvoiceRollProps> & {
  dx?: number;
  dy?: number;
  blend?: string;
  opacity?: number;
  rotate?: number;
};

/** The mascot placed in the cell, with optional offset, blend mode and rotation. */
const Char: React.FC<CharProps> = ({ dx = 0, dy = 0, blend, opacity, rotate = 0, ...props }) => (
  <InvoiceRoll
    width={CHAR_W}
    cues={CUES}
    seed="style-lab"
    gaze={{ x: 0.1, y: 0 }}
    {...props}
    style={{
      position: 'absolute',
      left: CHAR_LEFT + dx,
      top: CHAR_TOP + dy,
      mixBlendMode: blend as React.CSSProperties['mixBlendMode'],
      opacity,
      transform: rotate ? `rotate(${rotate}deg)` : undefined,
    }}
  />
);

// ------------------------------------------------------------------------------- SVG filters

/** The sticker finish now lives with the mascot (D-019); the lab reuses it. */
const Sticker = StickerFilter;

const Wobble: React.FC<{ id: string; scale: number; freq?: number; seed?: number }> = ({
  id,
  scale,
  freq = 0.03,
  seed = 3,
}) => (
  <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves="2" seed={seed} result="n" />
    <feDisplacementMap
      in="SourceGraphic"
      in2="n"
      scale={scale}
      xChannelSelector="R"
      yChannelSelector="G"
    />
  </filter>
);

const Watercolor: React.FC<{ id: string }> = ({ id }) => (
  <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="4" result="n" />
    <feDisplacementMap
      in="SourceGraphic"
      in2="n"
      scale="26"
      xChannelSelector="R"
      yChannelSelector="G"
      result="d"
    />
    <feGaussianBlur in="d" stdDeviation="2.6" result="b" />
    <feComponentTransfer in="b">
      <feFuncA type="linear" slope="0.8" />
    </feComponentTransfer>
  </filter>
);

/** Worn ink: small displacement plus random holes, like a rubber stamp or chalk. */
const Worn: React.FC<{ id: string; holes: string; freq?: number }> = ({
  id,
  holes,
  freq = 0.8,
}) => (
  <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves="2" seed="9" result="grain" />
    <feDisplacementMap in="SourceGraphic" in2="grain" scale="3" result="rough" />
    <feComponentTransfer in="grain" result="mask">
      <feFuncA type="discrete" tableValues={holes} />
    </feComponentTransfer>
    <feComposite in="rough" in2="mask" operator="in" />
  </filter>
);

const Glow: React.FC<{ id: string }> = ({ id }) => (
  <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="wide" />
    <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="near" />
    <feMerge>
      <feMergeNode in="wide" />
      <feMergeNode in="wide" />
      <feMergeNode in="near" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>
);

const HardShadow: React.FC<{ id: string; color: string; d: number }> = ({ id, color, d }) => (
  <filter id={id} x="-20%" y="-20%" width="150%" height="150%">
    <feOffset in="SourceAlpha" dx={d} dy={d} result="o" />
    <feFlood floodColor={color} />
    <feComposite in2="o" operator="in" result="s" />
    <feMerge>
      <feMergeNode in="s" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>
);

const SoftShadow: React.FC<{ id: string; dy: number; blur: number; opacity: number }> = ({
  id,
  dy,
  blur,
  opacity,
}) => (
  <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow dx="0" dy={dy} stdDeviation={blur} floodColor="black" floodOpacity={opacity} />
  </filter>
);

/** Samples the drawing on a 10-unit grid and grows each sample into a square. */
const Pixelate: React.FC<{ id: string; size: number }> = ({ id, size }) => (
  <filter id={id} x="0" y="0" width="400" height="600" filterUnits="userSpaceOnUse">
    <feFlood x={size / 2 - 1} y={size / 2 - 1} width="2" height="2" />
    <feComposite width={size} height={size} />
    <feTile result="grid" />
    <feComposite in="SourceGraphic" in2="grid" operator="in" />
    <feMorphology operator="dilate" radius={size / 2} />
  </filter>
);

/** Paper grain over a whole cell. */
const Grain: React.FC<{ id: string; opacity: number }> = ({ id, opacity }) => (
  <svg
    width={CELL_W}
    height={CELL_H}
    style={{ position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity }}
  >
    <filter id={id}>
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="5" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter={`url(#${id})`} />
  </svg>
);

/** Technical drawing dimensions of the A4 sheet, for the blueprint style. */
const BlueprintDims: React.FC = () => {
  const s = invoiceRollShape('a4');
  const c = 'oklch(100% 0 0 / 0.85)';
  const y = s.top - 54;
  const x = s.x2 + 40;
  return (
    <g stroke={c} strokeWidth={2} fill="none">
      <line x1={s.x1} x2={s.x2} y1={y} y2={y} />
      <line x1={s.x1} x2={s.x1} y1={y - 8} y2={y + 8} />
      <line x1={s.x2} x2={s.x2} y1={y - 8} y2={y + 8} />
      <line x1={x} x2={x} y1={s.top} y2={s.bottom} />
      <line x1={x - 8} x2={x + 8} y1={s.top} y2={s.top} />
      <line x1={x - 8} x2={x + 8} y1={s.bottom} y2={s.bottom} />
      <text x={200} y={y - 10} textAnchor="middle" fill={c} stroke="none" fontSize={15} {...mono}>
        210 mm
      </text>
      <text
        x={x + 18}
        y={(s.top + s.bottom) / 2}
        textAnchor="middle"
        fill={c}
        stroke="none"
        fontSize={15}
        transform={`rotate(90 ${x + 18} ${(s.top + s.bottom) / 2})`}
        {...mono}
      >
        297 mm
      </text>
    </g>
  );
};

// ------------------------------------------------------------------------------------ styles

interface StyleDef {
  name: string;
  note: string;
  bg: BackgroundName;
  grid: boolean;
  render: (id: string, pen: string) => React.ReactNode;
}

const lineLook = (color: string, width: number, rule = color) => ({
  outline: color,
  outlineWidth: width,
  ink: color,
  rule,
  accent: color,
  limbWidth: Math.max(4, width),
});

export const STYLES: StyleDef[] = [
  {
    name: 'Flat outline',
    note: 'today: graphite outline, flat fills',
    bg: 'paper',
    grid: true,
    render: (_id, pen) => <Char pen={pen} />,
  },
  {
    name: 'Sticker',
    note: 'die-cut white border and shadow',
    bg: 'blue',
    grid: true,
    render: (id) => (
      <Char
        pen={INK}
        defs={<Sticker id={`${id}f`} radius={12} color={WHITE} />}
        filter={`url(#${id}f)`}
      />
    ),
  },
  {
    name: 'Soft sticker',
    note: 'no outline, thick white border',
    bg: 'sky',
    grid: false,
    render: (id) => (
      <Char
        pen={INK}
        look={{ outlineWidth: 0, roll: 'oklch(90% 0.02 264)' }}
        defs={<Sticker id={`${id}f`} radius={16} color={WHITE} shadow={0.18} />}
        filter={`url(#${id}f)`}
      />
    ),
  },
  {
    name: 'White outline',
    note: 'white strokes instead of graphite',
    bg: 'ink',
    grid: false,
    render: (_id, pen) => (
      <Char pen={pen} look={{ outline: WHITE, outlineWidth: 9, roll: social.sky }} />
    ),
  },
  {
    name: 'Blue invoice',
    note: 'inverted: blue sheet, white details',
    bg: 'paper',
    grid: true,
    render: (_id, pen) => (
      <Char
        pen={pen}
        look={{
          sheet: INK,
          roll: social.sky,
          rule: 'oklch(100% 0 0 / 0.4)',
          accent: WHITE,
          accentText: INK,
          ink: WHITE,
        }}
      />
    ),
  },
  {
    name: 'Line art',
    note: 'one ink, no fills, like the pen limbs',
    bg: 'paper',
    grid: true,
    render: () => (
      <Char pen={INK} layer="lines" look={lineLook(INK, 6, 'oklch(52.8% 0.2628 262.87 / 0.45)')} />
    ),
  },

  {
    name: 'Blueprint',
    note: 'technical drawing, white on blue',
    bg: 'blue',
    grid: true,
    render: () => (
      <Char
        pen={WHITE}
        layer="lines"
        look={lineLook(WHITE, 4, 'oklch(100% 0 0 / 0.6)')}
        overlay={<BlueprintDims />}
      />
    ),
  },
  {
    name: 'Cartoon',
    note: 'thick lines, cel shading, shine',
    bg: 'sky',
    grid: true,
    render: () => (
      <Char
        pen={INK}
        look={{ outlineWidth: 13, limbWidth: 13, cel: 'oklch(89% 0.015 264)', rollShine: WHITE }}
      />
    ),
  },
  {
    name: 'Comic',
    note: 'halftone shading, hard shadow',
    bg: 'red',
    grid: false,
    render: (id, pen) => (
      <Char
        pen={pen}
        look={{
          outlineWidth: 11,
          limbWidth: 11,
          sheet: 'oklch(98% 0.03 95)',
          cel: `url(#${id}h)`,
        }}
        defs={
          <>
            <pattern
              id={`${id}h`}
              width={9}
              height={9}
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <circle cx={4.5} cy={4.5} r={2.4} fill={INK} opacity={0.6} />
            </pattern>
            <HardShadow id={`${id}f`} color={GRAPHITE} d={12} />
          </>
        }
        filter={`url(#${id}f)`}
      />
    ),
  },
  {
    name: 'Risograph',
    note: 'two inks, misregistered, grain',
    bg: 'paper',
    grid: false,
    render: (id) => (
      <>
        <Char
          layer="fills"
          dx={7}
          dy={6}
          blend="multiply"
          look={{
            sheet: social.markerYellow,
            roll: social.markerYellow,
            accent: 'oklch(75% 0.17 25)',
          }}
        />
        <Char
          pen={INK}
          layer="lines"
          blend="multiply"
          look={lineLook(INK, 7, 'oklch(52.8% 0.2628 262.87 / 0.6)')}
        />
        <Grain id={`${id}g`} opacity={0.14} />
      </>
    ),
  },
  {
    name: 'Watercolor',
    note: 'washes under a thin ink line',
    bg: 'paper',
    grid: false,
    render: (id) => (
      <>
        <Char
          layer="fills"
          dx={6}
          dy={5}
          look={{ sheet: 'oklch(88% 0.07 264)', roll: social.sky, accent: INK }}
          defs={<Watercolor id={`${id}w`} />}
          filter={`url(#${id}w)`}
        />
        <Char
          pen={GRAPHITE}
          layer="lines"
          look={lineLook(GRAPHITE, 4, 'oklch(40% 0 0 / 0.5)')}
          defs={<Wobble id={`${id}l`} scale={3} />}
          filter={`url(#${id}l)`}
        />
      </>
    ),
  },
  {
    name: 'Pencil sketch',
    note: 'double wobbly graphite lines',
    bg: 'paper',
    grid: false,
    render: (id) => {
      const pencil = 'oklch(38% 0.005 264)';
      return (
        <>
          <Char
            pen={pencil}
            layer="lines"
            opacity={0.55}
            dx={2}
            dy={-1}
            look={lineLook(pencil, 3, 'oklch(38% 0 0 / 0.4)')}
            defs={<Wobble id={`${id}a`} scale={6} seed={11} />}
            filter={`url(#${id}a)`}
          />
          <Char
            pen={pencil}
            layer="lines"
            opacity={0.85}
            look={lineLook(pencil, 3, 'oklch(38% 0 0 / 0.4)')}
            defs={<Wobble id={`${id}b`} scale={4} seed={2} />}
            filter={`url(#${id}b)`}
          />
        </>
      );
    },
  },

  {
    name: 'Rubber stamp',
    note: 'one worn ink, slightly crooked',
    bg: 'paper',
    grid: false,
    render: (id) => (
      <Char
        pen={INK}
        layer="lines"
        rotate={-5}
        look={lineLook(INK, 8, INK)}
        defs={<Worn id={`${id}f`} holes="1 1 1 1 0 1 1 1 0 1" />}
        filter={`url(#${id}f)`}
      />
    ),
  },
  {
    name: 'Paper cut-out',
    note: 'no lines, paper shapes with shadow',
    bg: 'blue',
    grid: false,
    render: (id) => (
      <Char
        pen={social.sky}
        look={{ outlineWidth: 0, roll: social.sky, limbWidth: 14 }}
        defs={<SoftShadow id={`${id}f`} dy={8} blur={5} opacity={0.35} />}
        filter={`url(#${id}f)`}
      />
    ),
  },
  {
    name: 'Clay 3D',
    note: 'soft gradients, rounded shading',
    bg: 'sky',
    grid: false,
    render: (id) => (
      <Char
        pen={INK}
        look={{
          outlineWidth: 0,
          limbWidth: 15,
          sheet: `url(#${id}s)`,
          roll: `url(#${id}r)`,
          accent: `url(#${id}p)`,
          rollShine: 'oklch(100% 0 0 / 0.8)',
          cel: 'oklch(0% 0 0 / 0.05)',
        }}
        defs={
          <>
            <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="oklch(86% 0.02 264)" />
            </linearGradient>
            <linearGradient id={`${id}r`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="oklch(98% 0.01 264)" />
              <stop offset="0.55" stopColor="oklch(84% 0.02 264)" />
              <stop offset="1" stopColor="oklch(70% 0.03 264)" />
            </linearGradient>
            <linearGradient id={`${id}p`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="oklch(65% 0.2 263)" />
              <stop offset="1" stopColor={INK} />
            </linearGradient>
            <SoftShadow id={`${id}f`} dy={14} blur={10} opacity={0.3} />
          </>
        }
        filter={`url(#${id}f)`}
      />
    ),
  },
  {
    name: 'Neon',
    note: 'glowing lines on graphite',
    bg: 'ink',
    grid: false,
    render: (id) => (
      <Char
        pen={social.sky}
        layer="lines"
        look={{
          ...lineLook(social.sky, 5, 'oklch(75% 0.13 264 / 0.6)'),
          accent: social.markerYellow,
        }}
        defs={<Glow id={`${id}f`} />}
        filter={`url(#${id}f)`}
      />
    ),
  },
  {
    name: 'Pixel art',
    note: 'the same drawing on a pixel grid',
    bg: 'blue',
    grid: true,
    render: (id, pen) => (
      <Char pen={pen} defs={<Pixelate id={`${id}f`} size={6} />} filter={`url(#${id}f)`} />
    ),
  },
  {
    name: 'Chalk',
    note: 'white chalk lines, grainy',
    bg: 'ink',
    grid: false,
    render: (id) => (
      <Char
        pen={WHITE}
        layer="lines"
        look={lineLook(WHITE, 6, 'oklch(100% 0 0 / 0.55)')}
        defs={<Worn id={`${id}f`} holes="1 1 0 1 1 0 1 1 1 0" freq={1.2} />}
        filter={`url(#${id}f)`}
      />
    ),
  },
];

export const STYLE_SHEETS = 3;
const PER_SHEET = 6;

export function styleSheetHeight(sheet: number): number {
  const n = STYLES.slice(sheet * PER_SHEET, sheet * PER_SHEET + PER_SHEET).length;
  return Math.ceil(n / 2) * CELL_H;
}

const fonts = fontsOf('brand');

export const StyleLab: React.FC<{ sheet: number }> = ({ sheet }) => {
  const items = STYLES.map((s, i) => ({ s, i })).slice(
    sheet * PER_SHEET,
    sheet * PER_SHEET + PER_SHEET,
  );
  return (
    <AbsoluteFill style={{ flexDirection: 'row', flexWrap: 'wrap', alignContent: 'flex-start' }}>
      {items.map(({ s, i }) => {
        const bg = backgrounds[s.bg];
        return (
          <div
            key={s.name}
            style={{ position: 'relative', width: CELL_W, height: CELL_H, overflow: 'hidden' }}
          >
            {s.grid ? (
              <GraphPaper fill={bg.fill} line={bg.dots} spacing={40} />
            ) : (
              <AbsoluteFill style={{ backgroundColor: bg.fill }} />
            )}
            {s.render(`st${i}`, bg.pen)}
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
                {String(i + 1).padStart(2, '0')} · {s.name}
              </div>
              <div style={{ fontSize: 20, opacity: 0.75, marginTop: 4 }}>{s.note}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
