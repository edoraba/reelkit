import { illustration, refattura } from '@reelkit/brand';

/** Shared drawing parts for the mascot candidates (viewBox 400 x 480, feet around y 450). */

export const OUT = illustration.outline;
export const LW = 8;
export const PEN = 9;
export const WHITE = refattura.sheetWhite;

export interface Look {
  x: number;
  y: number;
}

/** Two round eyes with pupils and a shine dot. */
export const Eyes: React.FC<{
  cx: number;
  dx: number;
  y: number;
  rx?: number;
  ry?: number;
  look?: Look;
}> = ({ cx, dx, y, rx = 22, ry = 26, look = { x: 0, y: 0 } }) => (
  <g>
    {[cx - dx, cx + dx].map((x) => {
      const px = x + look.x * rx * 0.35;
      const py = y + look.y * ry * 0.35;
      return (
        <g key={x}>
          <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={WHITE} stroke={OUT} strokeWidth={LW - 1} />
          <circle cx={px} cy={py} r={rx * 0.48} fill={OUT} />
          <circle cx={px - rx * 0.16} cy={py - ry * 0.18} r={rx * 0.16} fill={WHITE} />
        </g>
      );
    })}
  </g>
);

/** Two simple filled dot eyes. */
export const DotEyes: React.FC<{
  cx: number;
  dx: number;
  y: number;
  r?: number;
  color?: string;
}> = ({ cx, dx, y, r = 9, color = OUT }) => (
  <g fill={color}>
    <ellipse cx={cx - dx} cy={y} rx={r} ry={r * 1.3} />
    <ellipse cx={cx + dx} cy={y} rx={r} ry={r * 1.3} />
  </g>
);

export const Smile: React.FC<{
  x: number;
  y: number;
  w: number;
  color?: string;
  width?: number;
}> = ({ x, y, w, color = OUT, width = LW }) => (
  <path
    d={`M ${x - w} ${y - w * 0.25} Q ${x} ${y + w * 0.75} ${x + w} ${y - w * 0.25}`}
    fill="none"
    stroke={color}
    strokeWidth={width}
    strokeLinecap="round"
  />
);

/** Pen-doodle arm: a bent stroke from the shoulder with a small loop hand. */
export const PenArm: React.FC<{
  from: [number, number];
  elbow: [number, number];
  hand: [number, number];
  pen: string;
}> = ({ from, elbow, hand, pen }) => (
  <g stroke={pen} strokeWidth={PEN} strokeLinecap="round" strokeLinejoin="round" fill="none">
    <path d={`M ${from[0]} ${from[1]} Q ${elbow[0]} ${elbow[1]} ${hand[0]} ${hand[1]}`} />
    <circle cx={hand[0]} cy={hand[1]} r={9} strokeWidth={PEN - 2} />
  </g>
);

/** Two pen-doodle legs with feet pointing outward. */
export const PenLegs: React.FC<{
  x: number;
  gap: number;
  top: number;
  bottom: number;
  pen: string;
}> = ({ x, gap, top, bottom, pen }) => (
  <g stroke={pen} strokeWidth={PEN} strokeLinecap="round" fill="none">
    <line x1={x - gap} y1={top} x2={x - gap - 4} y2={bottom} />
    <line x1={x + gap} y1={top} x2={x + gap + 4} y2={bottom} />
    <line x1={x - gap - 4} y1={bottom + 4} x2={x - gap - 32} y2={bottom + 4} />
    <line x1={x + gap + 4} y1={bottom + 4} x2={x + gap + 32} y2={bottom + 4} />
  </g>
);

/** Flat ground shadow. */
export const Shadow: React.FC<{ x?: number; y?: number; rx?: number }> = ({
  x = 200,
  y = 458,
  rx = 110,
}) => <ellipse cx={x} cy={y} rx={rx} ry={12} fill="oklch(0% 0 0 / 0.12)" />;
