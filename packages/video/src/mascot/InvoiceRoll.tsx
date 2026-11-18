import { illustration, refattura, social, type CutoutPalette } from '@reelkit/brand';
import { seededRandom, type Eyes, type PropKind } from '@reelkit/schema';
import { useId } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { fontsOf } from '../brand/fonts';
import { LogoMark } from '../brand/LogoMark';
import { SHIN, standLegs, THIGH, type LegPose } from './gait';
import { idleAt } from './idle';
import { poseAt, type PoseCue } from './poses';
import { HandProp } from './props';

/**
 * Mascot candidate 05 reshaped into an invoice (Edoardo, 2026-11-17): rolled paper on top,
 * dot eyes and small mouth from the receipt, but straight edges, an invoice header, table
 * rows with amounts and a total. viewBox 400 x 600 like rig.ts.
 * The chosen mascot is the `a4` variant (D-016); the other three stay for the motion test lab.
 *
 * Rendering style is data (`look`), so the same character can be drawn as a sticker, line art,
 * blueprint, risograph layers and so on (see lab/StyleLab.tsx). `layer` draws only the fills
 * or only the lines, to compose print-like styles from two offset copies.
 */
export const INVOICE_ROLL_VARIANTS = ['slim', 'a4', 'header', 'scroll'] as const;
export type InvoiceRollVariant = (typeof INVOICE_ROLL_VARIANTS)[number];

export const INVOICE_ROLL_VIEWBOX = { width: 400, height: 600 } as const;

const BODY_BOTTOM = 470;
const FEET_Y = 566;
const ARM = { upper: 64, lower: 56 };

export interface Look {
  /** Outline of sheet, roll and pill. Width 0 = no outline. */
  outline: string;
  outlineWidth: number;
  /** Fills (can be `url(#id)` for gradients or patterns defined by the caller). */
  sheet: string;
  roll: string;
  /** Table rows and header rule. */
  rule: string;
  /** Total pill, logo mark, header band. */
  accent: string;
  accentText: string;
  /** Eyes, mouth, REFATTURA text. */
  ink: string;
  tongue: string;
  /** Opacity of the REFATTURA header and the logo mark: kept faint, the face leads. */
  headerOpacity: number;
  /** Limb stroke width (limb color is the `pen` prop). */
  limbWidth: number;
  /** Optional cel-shading strip along the right edge of the sheet (fill or pattern). */
  cel?: string;
  /** Optional highlight stripe on the roll. */
  rollShine?: string;
}

export const DEFAULT_LOOK: Look = {
  outline: illustration.outline,
  outlineWidth: 8,
  sheet: refattura.sheetWhite,
  roll: refattura.sheetGrey,
  rule: refattura.fieldRule,
  accent: refattura.inkBlue,
  accentText: refattura.sheetWhite,
  ink: illustration.outline,
  tongue: refattura.stampRed,
  headerOpacity: 0.4,
  limbWidth: 10,
};

interface Shape {
  x1: number;
  x2: number;
  /** Top edge of the sheet, under the roll. */
  top: number;
  header: 'text' | 'band';
  bottomCurl: boolean;
  rows: number;
  stamp: boolean;
}

const SHAPES: Record<InvoiceRollVariant, Shape> = {
  // Closest to candidate 05: same slender strip, invoice content.
  slim: { x1: 136, x2: 264, top: 112, header: 'text', bottomCurl: false, rows: 3, stamp: false },
  // A4 proportions (1:1.41): reads most clearly as an invoice. The chosen mascot.
  a4: { x1: 92, x2: 308, top: 168, header: 'text', bottomCurl: false, rows: 4, stamp: false },
  // Blue header band with FATTURA, like the app's documents.
  header: { x1: 115, x2: 285, top: 128, header: 'band', bottomCurl: false, rows: 3, stamp: false },
  // Rolled at both ends, with a TD17 stamp.
  scroll: { x1: 115, x2: 285, top: 128, header: 'text', bottomCurl: true, rows: 3, stamp: true },
};

/** Geometry of a variant, for overlays drawn in the same viewBox (e.g. blueprint dimensions). */
export function invoiceRollShape(variant: InvoiceRollVariant): Readonly<Shape> & {
  bottom: number;
  feetY: number;
} {
  const s = SHAPES[variant];
  return { ...s, bottom: s.bottomCurl ? BODY_BOTTOM - 14 : BODY_BOTTOM, feetY: FEET_Y };
}

export interface TalkSpan {
  from: number;
  to: number;
}

export type InvoiceRollLayer = 'all' | 'fills' | 'lines';

export interface InvoiceRollProps {
  /** Defaults to `a4`, the variant chosen by Edoardo (D-016). */
  variant?: InvoiceRollVariant;
  width: number;
  cues: PoseCue[];
  /** Frame spans where the mouth moves as if speaking (preview of lip sync). */
  talk?: TalkSpan[];
  gaze?: { x: number; y: number };
  seed: string;
  /** Pen ink for arms and legs: the `pen` color of the background. */
  pen?: string;
  look?: Partial<Look>;
  /** Draw everything, only the colored fills, or only lines and details. */
  layer?: InvoiceRollLayer;
  /** SVG defs (filters, gradients, patterns) referenced by `look` or `filter`. */
  defs?: React.ReactNode;
  /** Filter applied to the whole character, e.g. `url(#sticker)`. */
  filter?: string;
  /** Extra drawing in viewBox coordinates, above the character. */
  overlay?: React.ReactNode;
  style?: React.CSSProperties;
  /** Eye shape; overrides the cue's eyes (choreography, D-032). */
  eyes?: Eyes;
  /** Body tilt over the hips, degrees, positive toward the right. */
  lean?: number;
  /** Leg angles and lift (walk, hop, crouch); standing legs when absent. */
  legs?: LegPose;
  /** Vertical squash of the whole character from the feet (hop take-off and landing). */
  squash?: number;
  /** Extra arm swing while walking, degrees. */
  swing?: number;
  /** Things held in the hands. */
  hold?: { left?: PropKind; right?: PropKind };
  /** Palette for the colors of held props. */
  palette?: CutoutPalette;
  /** Mouth when the voice is silent (default smile); `o` for the cheek puff of a blow. */
  restMouth?: 'smile' | 'o';
  /** Drawn on the face, moving with it (glasses of an alternative scene, D-032). */
  faceOverlay?: (face: { eyeY: number; eyeDx: number; ink: string }) => React.ReactNode;
}

const mono = fontsOf('brand').mono;

type Mouth = 'smile' | 'open' | 'o' | 'mid';
const TALK_SHAPES: Mouth[] = ['open', 'o', 'mid', 'open', 'smile'];

function mouthAt(frame: number, talk: TalkSpan[], fallback: Mouth, seed: string): Mouth {
  for (const t of talk) {
    if (frame >= t.from && frame < t.to) {
      const k = Math.floor((frame - t.from) / 3);
      const r = seededRandom(seed, 'talk', k)();
      return TALK_SHAPES[Math.floor(r * TALK_SHAPES.length)] ?? 'open';
    }
  }
  return fallback;
}

const Arm: React.FC<{
  side: 'l' | 'r';
  x: number;
  y: number;
  upper: number;
  lower: number;
  pen: string;
  width: number;
  prop?: React.ReactNode;
}> = ({ side, x, y, upper, lower, pen, width, prop }) => (
  <g id={`arm-${side}-upper`} transform={`translate(${x} ${y}) rotate(${upper})`}>
    <line y2={ARM.upper} stroke={pen} strokeWidth={width} strokeLinecap="round" />
    <g id={`arm-${side}-lower`} transform={`translate(0 ${ARM.upper}) rotate(${lower})`}>
      <line y2={ARM.lower} stroke={pen} strokeWidth={width} strokeLinecap="round" />
      <circle
        id={`hand-${side}`}
        cy={ARM.lower + 9}
        r={10}
        fill="none"
        stroke={pen}
        strokeWidth={width - 2}
      />
      {prop && (
        <g
          id={`prop-${side}`}
          transform={`translate(0 ${ARM.lower + 12}) rotate(${-(upper + lower)}) scale(1.35)`}
        >
          {prop}
        </g>
      )}
    </g>
  </g>
);

/** Two-segment leg with the foot pointing outward. */
const Leg: React.FC<{
  side: 'l' | 'r';
  x: number;
  hip: number;
  knee: number;
  pen: string;
  width: number;
}> = ({ side, x, hip, knee, pen, width }) => (
  <g id={`leg-${side}`} transform={`translate(${x} ${BODY_BOTTOM}) rotate(${hip})`}>
    <line y2={THIGH} />
    <g id={`shin-${side}`} transform={`translate(0 ${THIGH}) rotate(${knee})`}>
      <line y2={SHIN} />
      <line x1={0} y1={SHIN} x2={side === 'l' ? -30 : 30} y2={SHIN} />
    </g>
  </g>
);

const MouthShape: React.FC<{ x: number; y: number; shape: Mouth; ink: string; tongue: string }> = ({
  x,
  y,
  shape,
  ink,
  tongue,
}) => {
  switch (shape) {
    case 'open':
      return (
        <g>
          <path
            d={`M ${x - 15} ${y - 4} Q ${x} ${y - 2} ${x + 15} ${y - 4} Q ${x + 13} ${y + 18} ${x} ${y + 19} Q ${x - 13} ${y + 18} ${x - 15} ${y - 4} Z`}
            fill={ink}
            stroke={ink}
            strokeWidth={4}
            strokeLinejoin="round"
          />
          <ellipse cx={x} cy={y + 13} rx={7} ry={4} fill={tongue} />
        </g>
      );
    case 'o':
      return <ellipse cx={x} cy={y + 4} rx={7} ry={10} fill={ink} />;
    case 'mid':
      return <ellipse cx={x} cy={y + 2} rx={12} ry={6} fill={ink} />;
    default:
      return (
        <path
          d={`M ${x - 14} ${y - 4} Q ${x} ${y + 12} ${x + 14} ${y - 4}`}
          fill="none"
          stroke={ink}
          strokeWidth={7}
          strokeLinecap="round"
        />
      );
  }
};

/** Rolled paper: a cylinder with a spiral at the left end. */
const Roll: React.FC<{
  x1: number;
  x2: number;
  cy: number;
  h: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  spiral: string | null;
  shine?: string;
}> = ({ x1, x2, cy, h, fill, stroke, strokeWidth, spiral, shine }) => (
  <g>
    <rect
      x={x1}
      y={cy - h / 2}
      width={x2 - x1}
      height={h}
      rx={h / 2}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
    {shine && (
      <rect
        x={x1 + h}
        y={cy - h * 0.3}
        width={x2 - x1 - h * 1.6}
        height={h * 0.16}
        rx={h * 0.08}
        fill={shine}
      />
    )}
    {spiral && (
      <>
        <circle cx={x1 + h / 2} cy={cy} r={h * 0.28} fill="none" stroke={spiral} strokeWidth={5} />
        <circle cx={x1 + h / 2 + 2} cy={cy + 1} r={h * 0.08} fill={spiral} />
      </>
    )}
  </g>
);

export const InvoiceRoll: React.FC<InvoiceRollProps> = ({
  variant = 'a4',
  width,
  cues,
  talk = [],
  gaze = { x: 0, y: 0 },
  seed,
  pen = refattura.inkBlue,
  look: lookOverride,
  layer = 'all',
  defs,
  filter,
  overlay,
  style,
  eyes: eyesOverride,
  lean = 0,
  legs = standLegs(),
  squash = 0,
  swing = 0,
  hold,
  palette,
  faceOverlay,
  restMouth,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const look: Look = { ...DEFAULT_LOOK, ...lookOverride };
  const s = SHAPES[variant];
  const w = s.x2 - s.x1;
  // Only the A4 sheet has room for the invoice number next to FATTURA.
  const wide = w >= 200;
  const idle = idleAt(frame, fps, seed);
  const { pose, cue } = poseAt(cues, frame, fps);

  // Layer helpers: fills-only drops strokes and details, lines-only drops fills.
  const showFills = layer !== 'lines';
  const showLines = layer !== 'fills';
  const fill = (c: string) => (showFills ? c : 'none');
  const outline = showLines && look.outlineWidth > 0 ? look.outline : 'none';
  const outlineW = look.outlineWidth;
  // In lines-only mode the pill becomes an outline.
  const pillStroke = showFills ? 'none' : look.ink;

  // Arms: pose + idle swing, plus the hand oscillation of the wave.
  const wave =
    cue.pose === 'wave'
      ? 22 * Math.sin(frame * 0.55)
      : cue.pose === 'type'
        ? 8 * Math.sin(Math.floor(frame / 2) * 1.7)
        : 0;
  const armY = s.top + (BODY_BOTTOM - s.top) * 0.5;

  // The roll squashes for a moment at every pose change.
  const since = frame - cue.at;
  const bounce = cue.at > 0 && since < 12 ? Math.sin((since / 12) * Math.PI) * 0.14 : 0;
  const rollCy = s.top - 6;

  const mouth = mouthAt(frame, talk, restMouth ?? (cue.mouth === 'open' ? 'open' : 'smile'), seed);
  const eyes: Eyes = eyesOverride ?? (cue.eyes === 'happy' ? 'happy' : 'open');
  const happy = eyes === 'happy';
  const closed = eyes === 'closed';
  const eyeRx = eyes === 'wide' ? 13 : 10.5;
  const eyeOpen = eyes === 'wide' ? 17 : eyes === 'half' ? 6 : 13;

  // Face layout.
  const band = s.header === 'band';
  const eyeY = s.top + (band ? 124 : 108);
  const eyeDx = Math.min(34, Math.max(22, w * 0.17));
  const gx = gaze.x * 5;
  const gy = gaze.y * 4;
  const eyeRy = eyeOpen * (1 - 0.9 * idle.blink);
  const tableY = eyeY + 84;
  const bottom = s.bottomCurl ? BODY_BOTTOM - 14 : BODY_BOTTOM;
  const hipDx = Math.max(26, w * 0.2);
  const lw = look.limbWidth;

  const sheetPath = `M ${s.x1} ${s.top} H ${s.x2} V ${bottom - 14} Q ${s.x2} ${bottom} ${s.x2 - 14} ${bottom} H ${s.x1 + 14} Q ${s.x1} ${bottom} ${s.x1} ${bottom - 14} Z`;
  // Without fills nothing hides what is behind: mask the arms with the sheet and the sheet
  // with the roll, so line styles stay clean instead of showing parts through each other.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const armMask = `arms${uid}`;
  const sheetMask = `sheet${uid}`;
  const masked = !showFills;

  return (
    <svg
      viewBox={`0 0 ${INVOICE_ROLL_VIEWBOX.width} ${INVOICE_ROLL_VIEWBOX.height}`}
      width={width}
      height={(width * INVOICE_ROLL_VIEWBOX.height) / INVOICE_ROLL_VIEWBOX.width}
      style={{ overflow: 'visible', ...style }}
    >
      <defs>
        {defs}
        {masked && (
          <>
            <mask
              id={armMask}
              maskUnits="userSpaceOnUse"
              x={-400}
              y={-400}
              width={1200}
              height={1400}
            >
              <rect x={-400} y={-400} width={1200} height={1400} fill="white" />
              <path d={sheetPath} fill="black" />
            </mask>
            <mask
              id={sheetMask}
              maskUnits="userSpaceOnUse"
              x={-400}
              y={-400}
              width={1200}
              height={1400}
            >
              <rect x={-400} y={-400} width={1200} height={1400} fill="white" />
              <rect x={s.x1 - 10} y={rollCy - 18} width={w + 20} height={36} rx={18} fill="black" />
            </mask>
          </>
        )}
      </defs>
      <g filter={filter}>
        <g
          id="mascot"
          transform={`translate(0 ${-legs.lift}) rotate(${idle.sway} 200 ${FEET_Y}) translate(200 ${FEET_Y}) scale(${1 + squash / 2} ${1 - squash}) translate(-200 ${-FEET_Y})`}
        >
          {showLines && (
            <g stroke={pen} strokeWidth={lw} strokeLinecap="round">
              <Leg side="l" x={200 - hipDx} hip={legs.l[0]} knee={legs.l[1]} pen={pen} width={lw} />
              <Leg side="r" x={200 + hipDx} hip={legs.r[0]} knee={legs.r[1]} pen={pen} width={lw} />
            </g>
          )}
          <g
            id="body"
            transform={`rotate(${lean} 200 ${BODY_BOTTOM}) translate(0 ${idle.bob}) translate(200 ${BODY_BOTTOM}) scale(1 ${idle.breath}) translate(-200 ${-BODY_BOTTOM})`}
          >
            {showLines && (
              <g mask={masked ? `url(#${armMask})` : undefined}>
                <Arm
                  side="l"
                  x={s.x1 + 6}
                  y={armY}
                  upper={pose.armL[0] + idle.armSwing + swing}
                  lower={pose.armL[1]}
                  pen={pen}
                  width={lw}
                  prop={
                    hold?.left && palette ? (
                      <HandProp kind={hold.left} p={palette} frame={frame} />
                    ) : undefined
                  }
                />
                <Arm
                  side="r"
                  x={s.x2 - 6}
                  y={armY}
                  upper={pose.armR[0] - idle.armSwing + swing}
                  lower={pose.armR[1] + wave}
                  pen={pen}
                  width={lw}
                  prop={
                    hold?.right && palette ? (
                      <HandProp kind={hold.right} p={palette} frame={frame} />
                    ) : undefined
                  }
                />
              </g>
            )}

            <g id="sheet" strokeLinejoin="round" mask={masked ? `url(#${sheetMask})` : undefined}>
              <path d={sheetPath} fill={fill(look.sheet)} stroke={outline} strokeWidth={outlineW} />
              {look.cel && showFills && (
                <path
                  d={`M ${s.x2 - 34} ${s.top + 4} H ${s.x2 - 4} V ${bottom - 16} Q ${s.x2 - 4} ${bottom - 4} ${s.x2 - 16} ${bottom - 4} H ${s.x2 - 34} Z`}
                  fill={look.cel}
                />
              )}
              {band ? (
                <>
                  <rect
                    x={s.x1 + outlineW / 2}
                    y={s.top}
                    width={w - outlineW}
                    height={62}
                    fill={fill(look.accent)}
                  />
                  {showLines && (
                    <text
                      x={200}
                      y={s.top + 42}
                      textAnchor="middle"
                      fill={showFills ? look.accentText : look.ink}
                      fontSize={21}
                      letterSpacing={3}
                      opacity={look.headerOpacity}
                      {...mono}
                    >
                      REFATTURA
                    </text>
                  )}
                </>
              ) : (
                showLines && (
                  <>
                    <text
                      x={wide ? s.x1 + 16 : 200}
                      y={s.top + 46}
                      textAnchor={wide ? 'start' : 'middle'}
                      fill={look.ink}
                      fontSize={w < 160 ? 15 : 22}
                      letterSpacing={2}
                      opacity={look.headerOpacity}
                      {...mono}
                    >
                      REFATTURA
                    </text>
                    {wide && (
                      // Logo mark in place of the invoice number, faded like the header text.
                      <g opacity={look.headerOpacity}>
                        <LogoMark
                          x={s.x2 - 32}
                          y={s.top + 40}
                          scale={0.28}
                          ring={showFills ? social.sky : look.accent}
                          ink={look.accent}
                        />
                      </g>
                    )}
                    <line
                      x1={s.x1 + 14}
                      x2={s.x2 - 14}
                      y1={s.top + 60}
                      y2={s.top + 60}
                      stroke={look.rule}
                      strokeWidth={4}
                    />
                  </>
                )
              )}

              {showLines && (
                <g stroke={look.rule} strokeWidth={8} strokeLinecap="round">
                  {Array.from({ length: s.rows }, (_, i) => {
                    const y = tableY + i * 24;
                    const len = (w - 36) * (i % 2 === 0 ? 0.5 : 0.38);
                    return (
                      <g key={i}>
                        <line x1={s.x1 + 18} x2={s.x1 + 18 + len} y1={y} y2={y} />
                        <line x1={s.x2 - 18 - w * 0.16} x2={s.x2 - 18} y1={y} y2={y} />
                      </g>
                    );
                  })}
                </g>
              )}
              <rect
                x={s.x2 - 18 - 76}
                y={bottom - 50}
                width={76}
                height={30}
                rx={15}
                fill={fill(look.accent)}
                stroke={pillStroke}
                strokeWidth={4}
              />
              {s.stamp && showLines && (
                <g transform={`rotate(-10 ${s.x1 + 50} ${bottom - 76})`}>
                  <rect
                    x={s.x1 + 16}
                    y={bottom - 92}
                    width={68}
                    height={30}
                    rx={6}
                    fill={fill(look.sheet)}
                    stroke={refattura.stampRed}
                    strokeWidth={4}
                  />
                  <text
                    x={s.x1 + 50}
                    y={bottom - 71}
                    textAnchor="middle"
                    fill={refattura.stampRed}
                    fontSize={16}
                    {...mono}
                  >
                    TD17
                  </text>
                </g>
              )}
            </g>

            {showLines && (
              <g id="head">
                {closed ? (
                  <g stroke={look.ink} strokeWidth={7} strokeLinecap="round" fill="none">
                    <path
                      id="eye-l"
                      d={`M ${200 - eyeDx - 11} ${eyeY} Q ${200 - eyeDx} ${eyeY + 9} ${200 - eyeDx + 11} ${eyeY}`}
                    />
                    <path
                      id="eye-r"
                      d={`M ${200 + eyeDx - 11} ${eyeY} Q ${200 + eyeDx} ${eyeY + 9} ${200 + eyeDx + 11} ${eyeY}`}
                    />
                  </g>
                ) : happy ? (
                  <g stroke={look.ink} strokeWidth={7} strokeLinecap="round" fill="none">
                    <path
                      d={`M ${200 - eyeDx - 11} ${eyeY + 4} Q ${200 - eyeDx} ${eyeY - 12} ${200 - eyeDx + 11} ${eyeY + 4}`}
                    />
                    <path
                      d={`M ${200 + eyeDx - 11} ${eyeY + 4} Q ${200 + eyeDx} ${eyeY - 12} ${200 + eyeDx + 11} ${eyeY + 4}`}
                    />
                  </g>
                ) : (
                  <g fill={look.ink}>
                    <ellipse
                      id="eye-l"
                      cx={200 - eyeDx + gx}
                      cy={eyeY + gy}
                      rx={eyeRx}
                      ry={Math.max(1.5, eyeRy)}
                    />
                    <ellipse
                      id="eye-r"
                      cx={200 + eyeDx + gx}
                      cy={eyeY + gy}
                      rx={eyeRx}
                      ry={Math.max(1.5, eyeRy)}
                    />
                  </g>
                )}
                <g id="mouth">
                  <MouthShape
                    x={200 + gx * 0.5}
                    y={eyeY + 36}
                    shape={mouth}
                    ink={look.ink}
                    tongue={look.tongue}
                  />
                </g>
                {faceOverlay?.({ eyeY, eyeDx, ink: look.ink })}
              </g>
            )}

            {s.bottomCurl && (
              <Roll
                x1={s.x1 - 6}
                x2={s.x2 + 6}
                cy={bottom + 4}
                h={28}
                fill={fill(look.roll)}
                stroke={outline}
                strokeWidth={outlineW}
                spiral={showLines ? look.ink : null}
              />
            )}
            <g
              id="roll"
              transform={`translate(200 ${rollCy}) rotate(${idle.sway * 1.6}) scale(${1 + bounce / 2} ${1 - bounce}) translate(-200 ${-rollCy})`}
            >
              <Roll
                x1={s.x1 - 10}
                x2={s.x2 + 10}
                cy={rollCy}
                h={36}
                fill={fill(look.roll)}
                stroke={outline}
                strokeWidth={outlineW}
                spiral={showLines ? look.ink : null}
                shine={showFills ? look.rollShine : undefined}
              />
            </g>
          </g>
        </g>
      </g>
      {overlay}
    </svg>
  );
};
