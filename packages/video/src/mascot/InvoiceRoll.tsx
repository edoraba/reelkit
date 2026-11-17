import { illustration, refattura } from '@reelkit/brand';
import { seededRandom } from '@reelkit/schema';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { fontsOf } from '../brand/fonts';
import { idleAt } from './idle';
import { poseAt, type PoseCue } from './poses';

/**
 * Mascot candidate 05 reshaped into an invoice (Edoardo, 2026-11-17): rolled paper on top,
 * dot eyes and small mouth from the receipt, but straight edges, an invoice header, table
 * rows with amounts and a total. viewBox 400 x 600 like rig.ts.
 * The chosen mascot is the `a4` variant (D-016); the other three stay for the motion test lab.
 */
export const INVOICE_ROLL_VARIANTS = ['slim', 'a4', 'header', 'scroll'] as const;
export type InvoiceRollVariant = (typeof INVOICE_ROLL_VARIANTS)[number];

export const INVOICE_ROLL_VIEWBOX = { width: 400, height: 600 } as const;

const OUT = illustration.outline;
const LW = 8;
const PEN = 10;
const WHITE = refattura.sheetWhite;
const SHADE = refattura.sheetGrey;
const RULE = refattura.fieldRule;
const BLUE = refattura.inkBlue;
const BODY_BOTTOM = 470;
const FEET_Y = 566;
const ARM = { upper: 64, lower: 56 };

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
  // A4 proportions (1:1.41): reads most clearly as an invoice.
  a4: { x1: 92, x2: 308, top: 168, header: 'text', bottomCurl: false, rows: 4, stamp: false },
  // Blue header band with FATTURA, like the app's documents.
  header: { x1: 115, x2: 285, top: 128, header: 'band', bottomCurl: false, rows: 3, stamp: false },
  // Rolled at both ends, with a TD17 stamp.
  scroll: { x1: 115, x2: 285, top: 128, header: 'text', bottomCurl: true, rows: 3, stamp: true },
};

export interface TalkSpan {
  from: number;
  to: number;
}

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
  style?: React.CSSProperties;
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

const Arm: React.FC<{ x: number; y: number; upper: number; lower: number; pen: string }> = ({
  x,
  y,
  upper,
  lower,
  pen,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${upper})`}>
    <line y2={ARM.upper} stroke={pen} strokeWidth={PEN} strokeLinecap="round" />
    <g transform={`translate(0 ${ARM.upper}) rotate(${lower})`}>
      <line y2={ARM.lower} stroke={pen} strokeWidth={PEN} strokeLinecap="round" />
      <circle cy={ARM.lower + 9} r={10} fill="none" stroke={pen} strokeWidth={PEN - 2} />
    </g>
  </g>
);

const MouthShape: React.FC<{ x: number; y: number; shape: Mouth }> = ({ x, y, shape }) => {
  switch (shape) {
    case 'open':
      return (
        <g>
          <path
            d={`M ${x - 15} ${y - 4} Q ${x} ${y - 2} ${x + 15} ${y - 4} Q ${x + 13} ${y + 18} ${x} ${y + 19} Q ${x - 13} ${y + 18} ${x - 15} ${y - 4} Z`}
            fill={OUT}
            stroke={OUT}
            strokeWidth={4}
            strokeLinejoin="round"
          />
          <ellipse cx={x} cy={y + 13} rx={7} ry={4} fill={refattura.stampRed} />
        </g>
      );
    case 'o':
      return <ellipse cx={x} cy={y + 4} rx={7} ry={10} fill={OUT} />;
    case 'mid':
      return <ellipse cx={x} cy={y + 2} rx={12} ry={6} fill={OUT} />;
    default:
      return (
        <path
          d={`M ${x - 14} ${y - 4} Q ${x} ${y + 12} ${x + 14} ${y - 4}`}
          fill="none"
          stroke={OUT}
          strokeWidth={7}
          strokeLinecap="round"
        />
      );
  }
};

/** Rolled paper: a cylinder with a spiral at the left end. */
const Roll: React.FC<{ x1: number; x2: number; cy: number; h: number }> = ({ x1, x2, cy, h }) => (
  <g>
    <rect
      x={x1}
      y={cy - h / 2}
      width={x2 - x1}
      height={h}
      rx={h / 2}
      fill={SHADE}
      stroke={OUT}
      strokeWidth={LW}
    />
    <circle cx={x1 + h / 2} cy={cy} r={h * 0.28} fill="none" stroke={OUT} strokeWidth={5} />
    <circle cx={x1 + h / 2 + 2} cy={cy + 1} r={h * 0.08} fill={OUT} />
  </g>
);

export const InvoiceRoll: React.FC<InvoiceRollProps> = ({
  variant = 'a4',
  width,
  cues,
  talk = [],
  gaze = { x: 0, y: 0 },
  seed,
  pen = BLUE,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = SHAPES[variant];
  const w = s.x2 - s.x1;
  // Only the A4 sheet has room for the invoice number next to FATTURA.
  const wide = w >= 200;
  const idle = idleAt(frame, fps, seed);
  const { pose, cue } = poseAt(cues, frame, fps);

  // Arms: pose + idle swing, plus the hand oscillation of the wave.
  const wave = cue.pose === 'wave' ? 22 * Math.sin(frame * 0.55) : 0;
  const armY = s.top + (BODY_BOTTOM - s.top) * 0.5;

  // The roll squashes for a moment at every pose change.
  const since = frame - cue.at;
  const bounce = cue.at > 0 && since < 12 ? Math.sin((since / 12) * Math.PI) * 0.14 : 0;
  const rollCy = s.top - 6;

  const mouth = mouthAt(frame, talk, cue.mouth === 'open' ? 'open' : 'smile', seed);
  const happy = cue.eyes === 'happy';

  // Face layout.
  const band = s.header === 'band';
  const eyeY = s.top + (band ? 124 : 108);
  const eyeDx = Math.min(34, Math.max(22, w * 0.17));
  const gx = gaze.x * 5;
  const gy = gaze.y * 4;
  const eyeRy = 13 * (1 - 0.9 * idle.blink);
  const tableY = eyeY + 84;
  const bottom = s.bottomCurl ? BODY_BOTTOM - 14 : BODY_BOTTOM;

  const { x: px, y: py } = { x: 200, y: FEET_Y };
  const hipDx = Math.max(26, w * 0.2);

  return (
    <svg
      viewBox={`0 0 ${INVOICE_ROLL_VIEWBOX.width} ${INVOICE_ROLL_VIEWBOX.height}`}
      width={width}
      height={(width * INVOICE_ROLL_VIEWBOX.height) / INVOICE_ROLL_VIEWBOX.width}
      style={{ overflow: 'visible', ...style }}
    >
      <g id="mascot" transform={`rotate(${idle.sway} ${px} ${py})`}>
        <g id="legs" stroke={pen} strokeWidth={PEN} strokeLinecap="round">
          <line x1={200 - hipDx} y1={BODY_BOTTOM} x2={200 - hipDx - 4} y2={FEET_Y - 8} />
          <line x1={200 + hipDx} y1={BODY_BOTTOM} x2={200 + hipDx + 4} y2={FEET_Y - 8} />
          <line x1={200 - hipDx - 4} y1={FEET_Y - 4} x2={200 - hipDx - 34} y2={FEET_Y - 4} />
          <line x1={200 + hipDx + 4} y1={FEET_Y - 4} x2={200 + hipDx + 34} y2={FEET_Y - 4} />
        </g>
        <g
          id="body"
          transform={`translate(0 ${idle.bob}) translate(200 ${BODY_BOTTOM}) scale(1 ${idle.breath}) translate(-200 ${-BODY_BOTTOM})`}
        >
          <Arm
            x={s.x1 + 6}
            y={armY}
            upper={pose.armL[0] + idle.armSwing}
            lower={pose.armL[1]}
            pen={pen}
          />
          <Arm
            x={s.x2 - 6}
            y={armY}
            upper={pose.armR[0] - idle.armSwing}
            lower={pose.armR[1] + wave}
            pen={pen}
          />

          <g id="sheet" strokeLinejoin="round">
            <path
              d={`M ${s.x1} ${s.top} H ${s.x2} V ${bottom - 14} Q ${s.x2} ${bottom} ${s.x2 - 14} ${bottom} H ${s.x1 + 14} Q ${s.x1} ${bottom} ${s.x1} ${bottom - 14} Z`}
              fill={WHITE}
              stroke={OUT}
              strokeWidth={LW}
            />
            {band ? (
              <>
                <rect x={s.x1 + LW / 2} y={s.top} width={w - LW} height={62} fill={BLUE} />
                <text
                  x={200}
                  y={s.top + 42}
                  textAnchor="middle"
                  fill={WHITE}
                  fontSize={24}
                  letterSpacing={3}
                  {...mono}
                >
                  FATTURA
                </text>
              </>
            ) : (
              <>
                <text
                  x={wide ? s.x1 + 16 : 200}
                  y={s.top + 46}
                  textAnchor={wide ? 'start' : 'middle'}
                  fill={OUT}
                  fontSize={w < 160 ? 19 : 22}
                  letterSpacing={2}
                  {...mono}
                >
                  FATTURA
                </text>
                {wide && (
                  <text
                    x={s.x2 - 16}
                    y={s.top + 46}
                    textAnchor="end"
                    fill={BLUE}
                    fontSize={20}
                    {...mono}
                  >
                    N.12
                  </text>
                )}
                <line
                  x1={s.x1 + 14}
                  x2={s.x2 - 14}
                  y1={s.top + 60}
                  y2={s.top + 60}
                  stroke={RULE}
                  strokeWidth={4}
                />
              </>
            )}

            {/* Table: description bars on the left, amounts on the right. */}
            <g stroke={RULE} strokeWidth={8} strokeLinecap="round">
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
            <rect x={s.x2 - 18 - 76} y={bottom - 50} width={76} height={30} rx={15} fill={BLUE} />
            <text
              x={s.x2 - 18 - 38}
              y={bottom - 29}
              textAnchor="middle"
              fill={WHITE}
              fontSize={17}
              letterSpacing={1}
              {...mono}
            >
              TOT
            </text>
            {s.stamp && (
              // Stamped over the table, left side, clear of the total.
              <g transform={`rotate(-10 ${s.x1 + 50} ${bottom - 76})`}>
                <rect
                  x={s.x1 + 16}
                  y={bottom - 92}
                  width={68}
                  height={30}
                  rx={6}
                  fill={WHITE}
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

          <g id="head">
            {happy ? (
              <g stroke={OUT} strokeWidth={7} strokeLinecap="round" fill="none">
                <path
                  d={`M ${200 - eyeDx - 11} ${eyeY + 4} Q ${200 - eyeDx} ${eyeY - 12} ${200 - eyeDx + 11} ${eyeY + 4}`}
                />
                <path
                  d={`M ${200 + eyeDx - 11} ${eyeY + 4} Q ${200 + eyeDx} ${eyeY - 12} ${200 + eyeDx + 11} ${eyeY + 4}`}
                />
              </g>
            ) : (
              <g fill={OUT}>
                <ellipse cx={200 - eyeDx + gx} cy={eyeY + gy} rx={10.5} ry={Math.max(1.5, eyeRy)} />
                <ellipse cx={200 + eyeDx + gx} cy={eyeY + gy} rx={10.5} ry={Math.max(1.5, eyeRy)} />
              </g>
            )}
            <MouthShape x={200 + gx * 0.5} y={eyeY + 36} shape={mouth} />
          </g>

          {s.bottomCurl && <Roll x1={s.x1 - 6} x2={s.x2 + 6} cy={bottom + 4} h={28} />}
          <g
            id="roll"
            transform={`translate(200 ${rollCy}) rotate(${idle.sway * 1.6}) scale(${1 + bounce / 2} ${1 - bounce}) translate(-200 ${-rollCy})`}
          >
            <Roll x1={s.x1 - 10} x2={s.x2 + 10} cy={rollCy} h={36} />
          </g>
        </g>
      </g>
    </svg>
  );
};
