import { seededRandom } from '@reelkit/schema';

/**
 * Drawing kit for the style moodboards: SVG filters that fake handmade materials (scissor-cut
 * gouache paper, torn paper, jagged cut-outs, paper grain) and simple decorative motifs.
 * Everything is deterministic (fixed seeds).
 */

// ------------------------------------------------------------------------------------ filters

/** Scissor-cut gouache paper: soft wobble on the edges plus a mottled paint surface. */
export const ScissorFilter: React.FC<{
  id: string;
  scale?: number;
  freq?: number;
  grain?: number;
}> = ({ id, scale = 7, freq = 0.018, grain = 0.2 }) => (
  <filter id={id} x="-15%" y="-15%" width="130%" height="130%">
    <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves="2" seed="3" result="wob" />
    <feDisplacementMap
      in="SourceGraphic"
      in2="wob"
      scale={scale}
      xChannelSelector="R"
      yChannelSelector="G"
      result="cut"
    />
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="8" result="g" />
    <feColorMatrix in="g" type="saturate" values="0" result="gray" />
    <feComposite
      in="cut"
      in2="gray"
      operator="arithmetic"
      k1="0"
      k2="1"
      k3={-grain}
      k4={grain * 0.45}
      result="paint"
    />
    <feComposite in="paint" in2="cut" operator="in" />
  </filter>
);

/** Torn paper: rough high-frequency edge with white paper fibres showing around it. */
export const TornFilter: React.FC<{ id: string; scale?: number; fiber?: string }> = ({
  id,
  scale = 9,
  fiber = 'white',
}) => (
  <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="3" seed="5" result="n" />
    <feDisplacementMap
      in="SourceGraphic"
      in2="n"
      scale={scale}
      xChannelSelector="R"
      yChannelSelector="G"
      result="torn"
    />
    <feMorphology in="SourceAlpha" operator="dilate" radius="3.5" result="grow" />
    <feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="3" seed="9" result="n2" />
    <feDisplacementMap
      in="grow"
      in2="n2"
      scale={scale * 1.4}
      xChannelSelector="R"
      yChannelSelector="G"
      result="fiberShape"
    />
    <feFlood floodColor={fiber} />
    <feComposite in2="fiberShape" operator="in" result="fibre" />
    <feMerge>
      <feMergeNode in="fibre" />
      <feMergeNode in="torn" />
    </feMerge>
  </filter>
);

/** Hand-cut jagged edge, sharper than the scissor wobble (cut-out film titles). */
export const JaggedFilter: React.FC<{ id: string; scale?: number }> = ({ id, scale = 12 }) => (
  <filter id={id} x="-15%" y="-15%" width="130%" height="130%">
    <feTurbulence type="turbulence" baseFrequency="0.035" numOctaves="1" seed="12" result="j" />
    <feDisplacementMap
      in="SourceGraphic"
      in2="j"
      scale={scale}
      xChannelSelector="R"
      yChannelSelector="G"
    />
  </filter>
);

/** Solid offset shadow (no blur). */
export const OffsetShadow: React.FC<{ id: string; color: string; d: number }> = ({
  id,
  color,
  d,
}) => (
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

/** Paper grain laid over a whole area (multiply). */
export const Grain: React.FC<{ id: string; opacity: number; width: number; height: number }> = ({
  id,
  opacity,
  width,
  height,
}) => (
  <svg
    width={width}
    height={height}
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      mixBlendMode: 'multiply',
      opacity,
      pointerEvents: 'none',
    }}
  >
    <filter id={id}>
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="21" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter={`url(#${id})`} />
  </svg>
);

// ------------------------------------------------------------------------------------ motifs

interface Place {
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
}

const place = ({ x, y, scale = 1, rotate = 0 }: Place) =>
  `translate(${x} ${y}) rotate(${rotate}) scale(${scale})`;

/** A frond of leaves on a curved stem (cut-out style), base at the origin, growing up. */
export const Frond: React.FC<Place & { color: string; leaves?: number }> = ({
  color,
  leaves = 7,
  ...p
}) => (
  <g transform={place(p)} fill={color}>
    <path
      d="M 0 0 C 10 -120, -14 -220, 6 -330"
      fill="none"
      stroke={color}
      strokeWidth={10}
      strokeLinecap="round"
    />
    {Array.from({ length: leaves }, (_, i) => {
      const t = (i + 1) / (leaves + 1);
      const y = -330 * t;
      const side = i % 2 === 0 ? -1 : 1;
      const size = 1 - t * 0.45;
      return (
        <ellipse
          key={i}
          cx={side * 34 * size}
          cy={y}
          rx={24 * size}
          ry={62 * size}
          transform={`rotate(${side * 52} ${side * 34 * size} ${y})`}
        />
      );
    })}
    <ellipse cx={6} cy={-350} rx={20} ry={44} />
  </g>
);

/** Irregular star (seeded), like a scissor-cut star. */
export const CutStar: React.FC<
  Place & { color: string; points?: number; r?: number; seed?: string }
> = ({ color, points = 9, r = 90, seed = 'star', ...p }) => {
  const rnd = seededRandom('moodboard', seed);
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2;
    const rr = i % 2 === 0 ? r * (0.85 + rnd() * 0.3) : r * (0.32 + rnd() * 0.12);
    pts.push(`${(rr * Math.cos(a)).toFixed(1)},${(rr * Math.sin(a)).toFixed(1)}`);
  }
  return <polygon transform={place(p)} points={pts.join(' ')} fill={color} />;
};

/** Wavy line drawn as one stroke. */
export const Squiggle: React.FC<
  Place & { color: string; length?: number; amp?: number; waves?: number; width?: number }
> = ({ color, length = 240, amp = 22, waves = 4, width = 12, ...p }) => {
  const step = length / (waves * 2);
  let d = `M 0 0`;
  for (let i = 0; i < waves * 2; i++) {
    d += ` Q ${step * i + step / 2} ${i % 2 === 0 ? -amp : amp} ${step * (i + 1)} 0`;
  }
  return (
    <path
      transform={place(p)}
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
    />
  );
};

export const Zigzag: React.FC<
  Place & { color: string; length?: number; amp?: number; teeth?: number; width?: number }
> = ({ color, length = 220, amp = 18, teeth = 7, width = 10, ...p }) => {
  const step = length / teeth;
  const pts = Array.from(
    { length: teeth + 1 },
    (_, i) => `${i * step},${i % 2 === 0 ? amp : -amp}`,
  );
  return (
    <polyline
      transform={place(p)}
      points={pts.join(' ')}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinejoin="miter"
      strokeLinecap="square"
    />
  );
};

/** Scattered confetti (small dots, bars and triangles) inside a box, seeded. */
export const Confetti: React.FC<{
  w: number;
  h: number;
  colors: string[];
  count?: number;
  seed?: string;
  avoid?: { x: number; y: number; w: number; h: number }[];
}> = ({ w, h, colors, count = 40, seed = 'confetti', avoid = [] }) => {
  const rnd = seededRandom('moodboard', seed);
  const items: React.ReactNode[] = [];
  let tries = 0;
  while (items.length < count && tries < count * 10) {
    tries++;
    const x = rnd() * w;
    const y = rnd() * h;
    if (avoid.some((a) => x > a.x && x < a.x + a.w && y > a.y && y < a.y + a.h)) continue;
    const c = colors[Math.floor(rnd() * colors.length)] ?? colors[0];
    const kind = Math.floor(rnd() * 3);
    const rot = Math.floor(rnd() * 180);
    const k = items.length;
    if (kind === 0) items.push(<circle key={k} cx={x} cy={y} r={7 + rnd() * 6} fill={c} />);
    else if (kind === 1)
      items.push(
        <rect
          key={k}
          x={x}
          y={y}
          width={34}
          height={9}
          fill={c}
          transform={`rotate(${rot} ${x} ${y})`}
        />,
      );
    else
      items.push(
        <polygon
          key={k}
          points={`${x},${y - 14} ${x + 14},${y + 10} ${x - 14},${y + 10}`}
          fill="none"
          stroke={c}
          strokeWidth={5}
          transform={`rotate(${rot} ${x} ${y})`}
        />,
      );
  }
  return <g>{items}</g>;
};

/** Isotype-style invoice pictogram: a flat sheet silhouette with a cut corner. */
export const InvoicePictogram: React.FC<Place & { color: string; mark?: string }> = ({
  color,
  mark,
  ...p
}) => (
  <g transform={place(p)}>
    <path d="M 0 0 H 46 L 62 16 V 80 H 0 Z" fill={color} />
    <path d="M 46 0 V 16 H 62 Z" fill="white" opacity={0.55} />
    <rect x={10} y={30} width={42} height={6} fill="white" opacity={0.75} />
    <rect x={10} y={44} width={30} height={6} fill="white" opacity={0.75} />
    {mark && (
      <text
        x={31}
        y={74}
        textAnchor="middle"
        fontSize={20}
        fontWeight={800}
        fill="white"
        fontFamily="sans-serif"
      >
        {mark}
      </text>
    )}
  </g>
);
