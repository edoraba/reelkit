import { seededRandom } from '@reelkit/schema';
import {
  clamp01,
  leafPath,
  onTwos,
  pop,
  quad,
  ramp,
  smoothClosed,
  smoothOpen,
  type Pt,
} from './geometry';

/**
 * Animated cut-paper motifs (Matisse direction). Every motif is generated from parameters and
 * animated by changing those parameters frame by frame: leaves sprout and flutter, stems bend,
 * blobs change shape, coral branches grow, wings change shape while flapping. Motion runs
 * "on twos" (every 2 frames) for a hand-animated feel. `f` is the local frame.
 */

export interface MotifProps {
  f: number;
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
  color: string;
  /** Frame when the motif starts growing. */
  start?: number;
  seed?: string;
}

const FPS = 30;
const g = (x: number, y: number, scale = 1, rotate = 0) =>
  `translate(${x} ${y}) rotate(${rotate}) scale(${scale})`;

/** Seaweed frond: the stem grows, leaves sprout one by one with a pop, the stem bends in the current. */
export const Frond: React.FC<MotifProps & { leaves?: number; height?: number }> = ({
  f,
  x,
  y,
  scale = 1,
  rotate = 0,
  color,
  start = 0,
  seed = 'frond',
  leaves = 8,
  height = 330,
}) => {
  const t = onTwos(f);
  const rnd = seededRandom('cutout', seed);
  const phase = rnd() * Math.PI * 2;
  const grow = ramp(t, start, 40);
  const bend = Math.sin((t / FPS) * ((2 * Math.PI) / 3.4) + phase) * 0.16;
  const H = height;
  const P0: Pt = [0, 0];
  const P1: Pt = [H * bend * 0.35, -H * 0.5];
  const P2: Pt = [H * bend, -H];
  const stem: Pt[] = [];
  for (let s = 0; s <= grow + 1e-6; s += 0.05) {
    const q = quad(P0, P1, P2, s);
    stem.push([q.x, q.y]);
  }
  return (
    <g transform={g(x, y, scale, rotate)} fill={color}>
      {stem.length > 1 && (
        <path
          d={smoothOpen(stem)}
          fill="none"
          stroke={color}
          strokeWidth={11}
          strokeLinecap="round"
        />
      )}
      {Array.from({ length: leaves }, (_, i) => {
        const s = (i + 1) / (leaves + 1);
        if (grow < s) return null;
        const q = quad(P0, P1, P2, s);
        const side = i % 2 === 0 ? -1 : 1;
        const size = 1 - s * 0.45;
        const k = pop(t, start + s * 40, 14);
        const flutter = Math.sin(t * 0.13 + i * 1.7) * 7;
        return (
          <path
            key={i}
            d={leafPath(78 * size, 30 * size)}
            transform={`translate(${q.x} ${q.y}) rotate(${q.angle + 90 + side * 58 + flutter}) scale(${k})`}
          />
        );
      })}
      {grow >= 1 &&
        (() => {
          const q = quad(P0, P1, P2, 1);
          const k = pop(t, start + 40, 14);
          return (
            <path
              d={leafPath(84, 30)}
              transform={`translate(${q.x} ${q.y}) rotate(${q.angle + 90}) scale(${k})`}
            />
          );
        })()}
    </g>
  );
};

/** Gouache blob whose outline keeps changing, like a shape being re-cut while you look. */
export const Blob: React.FC<MotifProps & { r?: number }> = ({
  f,
  x,
  y,
  scale = 1,
  rotate = 0,
  color,
  start = 0,
  seed = 'blob',
  r = 90,
}) => {
  const t = onTwos(f);
  const rnd = seededRandom('cutout', seed);
  const waves = [2, 3, 5].map((k) => ({
    k,
    a: 0.05 + rnd() * 0.09,
    ph: rnd() * 6.28,
    w: 0.6 + rnd() * 0.8,
  }));
  const k = pop(t, start, 16);
  const pts: Pt[] = [];
  for (let i = 0; i < 36; i++) {
    const th = (i / 36) * Math.PI * 2;
    let rr = 1;
    for (const w of waves) rr += w.a * Math.sin(w.k * th + w.ph + (t / FPS) * w.w * 2);
    pts.push([Math.cos(th) * r * rr, Math.sin(th) * r * rr]);
  }
  return <path transform={g(x, y, scale * k, rotate)} d={smoothClosed(pts)} fill={color} />;
};

/** Irregular star whose points shoot out one after the other, then twinkle. */
export const StarBloom: React.FC<MotifProps & { points?: number; r?: number }> = ({
  f,
  x,
  y,
  scale = 1,
  rotate = 0,
  color,
  start = 0,
  seed = 'star',
  points = 9,
  r = 90,
}) => {
  const t = onTwos(f);
  const rnd = seededRandom('cutout', seed);
  const tips = Array.from({ length: points }, () => 0.85 + rnd() * 0.3);
  const core = pop(t, start, 10);
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2;
    let rr: number;
    if (i % 2 === 0) {
      const tip = Math.floor(i / 2);
      const grow = pop(t, start + 3 + tip * 2, 12);
      rr = r * (tips[tip] ?? 1) * grow * (1 + 0.08 * Math.sin(t * 0.21 + tip * 2.1));
      rr = Math.max(rr, r * 0.36 * core);
    } else {
      rr = r * 0.36 * core;
    }
    pts.push(`${(rr * Math.cos(a)).toFixed(1)},${(rr * Math.sin(a)).toFixed(1)}`);
  }
  return (
    <polygon transform={g(x, y, scale, rotate + t * 0.25)} points={pts.join(' ')} fill={color} />
  );
};

/** Coral that branches as it grows; tips get round buds; branches sway a little. */
export const Coral: React.FC<MotifProps & { depth?: number; length?: number }> = ({
  f,
  x,
  y,
  scale = 1,
  rotate = 0,
  color,
  start = 0,
  seed = 'coral',
  depth = 4,
  length = 110,
}) => {
  const t = onTwos(f);
  const rnd = seededRandom('cutout', seed);
  const parts: React.ReactNode[] = [];
  const DUR = 14;
  const branch = (
    x0: number,
    y0: number,
    angle: number,
    len: number,
    width: number,
    birth: number,
    d: number,
  ) => {
    const sway = Math.sin(t * 0.06 + d * 1.3) * 3 * d;
    const a = ((angle + sway) * Math.PI) / 180;
    const p = ramp(t, birth, DUR);
    const spreadL = 18 + rnd() * 18;
    const spreadR = 18 + rnd() * 18;
    const shrink = 0.68 + rnd() * 0.12;
    if (p <= 0) return;
    const x1 = x0 + Math.cos(a) * len * p;
    const y1 = y0 + Math.sin(a) * len * p;
    parts.push(
      <line
        key={parts.length}
        x1={x0}
        y1={y0}
        x2={x1}
        y2={y1}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
      />,
    );
    if (d >= depth) {
      parts.push(
        <circle
          key={parts.length}
          cx={x1}
          cy={y1}
          r={width * 0.95 * pop(t, birth + DUR, 10)}
          fill={color}
        />,
      );
      return;
    }
    if (p < 1) return;
    branch(x1, y1, angle - spreadL, len * shrink, width * 0.75, birth + DUR, d + 1);
    branch(x1, y1, angle + spreadR, len * shrink, width * 0.75, birth + DUR + 3, d + 1);
  };
  branch(0, 0, -90, length, 26, start, 1);
  return <g transform={g(x, y, scale, rotate)}>{parts}</g>;
};

/** Spiral ribbon that unrolls from the center and keeps turning slowly. */
export const Spiral: React.FC<MotifProps & { turns?: number; r?: number }> = ({
  f,
  x,
  y,
  scale = 1,
  rotate = 0,
  color,
  start = 0,
  turns = 2.6,
  r = 100,
}) => {
  const t = onTwos(f);
  const max = turns * Math.PI * 2 * ramp(t, start, 50);
  const pts: Pt[] = [];
  for (let th = 0; th <= max; th += 0.25) {
    const rr = (r * th) / (turns * Math.PI * 2);
    pts.push([Math.cos(th) * rr, Math.sin(th) * rr]);
  }
  if (pts.length < 2) return null;
  return (
    <path
      transform={g(x, y, scale, rotate + t * 0.5)}
      d={smoothOpen(pts)}
      fill="none"
      stroke={color}
      strokeWidth={22}
      strokeLinecap="round"
    />
  );
};

/** Band of scallop waves; each scallop rises and falls so the band actually ripples. */
export const WaveBand: React.FC<
  MotifProps & { width?: number; scallops?: number; h?: number; depth?: number }
> = ({ f, x, y, color, width = 360, scallops = 6, h = 34, depth = 220 }) => {
  const t = onTwos(f);
  const step = width / scallops;
  const shift = ((t * 1.5) % step) - step;
  let d = `M ${shift} 0`;
  for (let i = 0; i <= scallops + 1; i++) {
    const x0 = shift + i * step;
    const amp = h * (0.6 + 0.4 * Math.sin(i * 0.9 - t * 0.16));
    d += ` Q ${x0 + step / 2} ${-2 * amp} ${x0 + step} 0`;
  }
  d += ` L ${shift + (scallops + 2) * step} ${depth} L ${shift} ${depth} Z`;
  return (
    <g transform={g(x, y)}>
      <clipPath id={`wb${Math.round(x)}${Math.round(y)}`}>
        <rect x={0} y={-200} width={width} height={depth + 400} />
      </clipPath>
      <path d={d} fill={color} clipPath={`url(#wb${Math.round(x)}${Math.round(y)})`} />
    </g>
  );
};

/** Swallow crossing the frame; the wings change shape on every beat (not just rotate). */
export const Swallow: React.FC<MotifProps & { travel?: number; speed?: number }> = ({
  f,
  x,
  y,
  scale = 1,
  color,
  travel = 360,
  speed = 2.6,
  seed = 'bird',
}) => {
  const t = onTwos(f);
  const rnd = seededRandom('cutout', seed);
  const ph = rnd() * 6;
  const flap = Math.sin(t * 0.42 + ph);
  const px = ((t * speed) % (travel + 240)) - 120;
  const py = Math.sin(t * 0.07 + ph) * 18;
  const tipY = -40 * flap;
  const wing = (s: number) =>
    `M 0 -2 Q ${s * 34} ${-26 + tipY * 0.6} ${s * 86} ${tipY} Q ${s * 48} ${6 + tipY * 0.2} 0 10 Z`;
  return (
    <g transform={g(x + px, y + py, scale)} fill={color}>
      <path d={wing(-1)} />
      <path d={wing(1)} />
      <ellipse cx={0} cy={6} rx={13} ry={24} />
      <path d="M -7 24 L -20 64 L 0 40 L 20 64 L 7 24 Z" />
      <circle cx={0} cy={-16} r={11} />
    </g>
  );
};

/** Fan of leaves that opens like a hand, then breathes. */
export const Palmette: React.FC<MotifProps & { lobes?: number; length?: number }> = ({
  f,
  x,
  y,
  scale = 1,
  rotate = 0,
  color,
  start = 0,
  lobes = 7,
  length = 130,
}) => {
  const t = onTwos(f);
  const open = pop(t, start, 24);
  const breathe = Math.sin(t * 0.08) * 3;
  return (
    <g transform={g(x, y, scale, rotate)} fill={color}>
      {Array.from({ length: lobes }, (_, i) => {
        const target = -72 + (i * 144) / (lobes - 1);
        const len = length * (0.75 + 0.25 * Math.sin((i / (lobes - 1)) * Math.PI));
        return (
          <path
            key={i}
            d={leafPath(len, len * 0.26)}
            transform={`rotate(${target * open + breathe * (target / 72)}) scale(${clamp01(open * 1.2)})`}
          />
        );
      })}
      <circle r={16 * clamp01(open * 2)} />
    </g>
  );
};

/** A shape is cut out along its outline, then lifted off the page and laid down again. */
export const ScissorCut: React.FC<
  MotifProps & { ink: string; lift: (id: string, amount: number) => React.ReactNode }
> = ({ f, x, y, scale = 1, color, ink, start = 0, seed = 'cut', lift }) => {
  const t = onTwos(f);
  const rnd = seededRandom('cutout', seed);
  const pts: Pt[] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const rr = i % 2 === 0 ? 92 * (0.85 + rnd() * 0.3) : 44;
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  const outline = smoothClosed(pts, 0.5);
  const cut = ramp(t, start, 46);
  const done = start + 50;
  const up = t < done ? 0 : t < done + 20 ? ramp(t, done, 8) : 1 - ramp(t, done + 20, 14);
  const filterId = `lift${seed}`;
  return (
    <g transform={g(x, y, scale)}>
      <defs>{lift(filterId, up)}</defs>
      {t >= done && (
        <g
          filter={`url(#${filterId})`}
          transform={`translate(${-up * 10} ${-up * 18}) rotate(${-up * 8}) scale(${1 + up * 0.06})`}
        >
          <path d={outline} fill={color} />
        </g>
      )}
      {t < done + 4 && (
        <>
          {/* The dashed cut line appears along the outline, as the scissors advance. */}
          <mask
            id={`${filterId}m`}
            maskUnits="userSpaceOnUse"
            x={-200}
            y={-200}
            width={400}
            height={400}
          >
            <path
              d={outline}
              fill="none"
              stroke="white"
              strokeWidth={16}
              pathLength={1000}
              strokeDasharray={`${(cut * 1000).toFixed(0)} 1000`}
            />
          </mask>
          <path
            d={outline}
            fill="none"
            stroke={ink}
            strokeWidth={4}
            strokeDasharray="10 7"
            opacity={0.85}
            mask={`url(#${filterId}m)`}
          />
        </>
      )}
    </g>
  );
};

/** Sun: the disc pops, rays grow and pulse in alternation, everything turns slowly. */
export const Sun: React.FC<MotifProps & { rays?: number; r?: number }> = ({
  f,
  x,
  y,
  scale = 1,
  color,
  start = 0,
  rays = 12,
  r = 58,
}) => {
  const t = onTwos(f);
  const disc = pop(t, start, 12);
  const grow = ramp(t, start + 8, 24);
  return (
    <g transform={g(x, y, scale, t * 0.4)} fill={color}>
      {Array.from({ length: rays }, (_, i) => {
        const len = (34 + 16 * Math.sin(t * 0.18 + (i % 2) * Math.PI)) * grow;
        return (
          <polygon
            key={i}
            points={`-11,${-(r + 8)} 11,${-(r + 8)} 0,${-(r + 8 + len)}`}
            transform={`rotate(${(i * 360) / rays})`}
          />
        );
      })}
      <circle r={r * disc} />
    </g>
  );
};

/** Kelp ribbon swaying with a wave that travels up the blade. */
export const Kelp: React.FC<MotifProps & { height?: number; width?: number; phase?: number }> = ({
  f,
  x,
  y,
  scale = 1,
  rotate = 0,
  color,
  start = 0,
  height = 380,
  width = 46,
  phase = 0,
}) => {
  const t = onTwos(f);
  const grow = ramp(t, start, 36);
  const H = height * Math.max(0.05, grow);
  const N = 14;
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let j = 0; j <= N; j++) {
    const u = j / N;
    const cx = 34 * Math.pow(u, 1.3) * Math.sin(u * Math.PI * 2.4 - t * 0.13 + phase);
    const w = width * (1 - 0.8 * u) + 3;
    const yy = -H * u;
    left.push([cx - w / 2, yy]);
    right.unshift([cx + w / 2, yy]);
  }
  return (
    <path
      transform={g(x, y, scale, rotate)}
      d={smoothClosed([...left, ...right], 0.8)}
      fill={color}
    />
  );
};
