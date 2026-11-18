import { onTwos, pop, ramp, smoothOpen, type Pt } from './geometry';

/**
 * Office objects as cut-paper motifs (Edoardo, 2026-11-18): the tools of invoices and
 * accountants, drawn like Matisse cut-outs (flat colored pieces, no outlines) and animated
 * by what they do: keys press and the display counts, scissors snip, the stapler bites,
 * binders settle, the stamp stamps, the pencil writes, the envelope opens, coins drop,
 * the calendar flips, coffee steams, the magnifier searches, the note flutters on its pin.
 * Colors come from a palette: `a`, `b`, `c` are the three motif colors, `hole` the background.
 */
export interface ObjectProps {
  f: number;
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
  start?: number;
  a: string;
  b: string;
  c: string;
  hole: string;
  ink: string;
}

const g = (x: number, y: number, scale = 1, rotate = 0) =>
  `translate(${x} ${y}) rotate(${rotate}) scale(${scale})`;
const MONO = "'DM Mono', monospace";

/** Pulse 0..1..0 every `period` frames: quick down in `down` frames, back up in `up`. */
function pulse(t: number, period: number, offset = 0, down = 4, up = 7): number {
  const p = (((t - offset) % period) + period) % period;
  if (p < down) return p / down;
  if (p < down + up) return 1 - (p - down) / up;
  return 0;
}

export const Calculator: React.FC<ObjectProps> = ({
  f,
  x,
  y,
  scale = 1,
  rotate = 0,
  start = 0,
  a,
  b,
  c,
  hole,
  ink,
}) => {
  const t = onTwos(f);
  const k = pop(t, start, 14);
  const value = Math.floor(ramp(t, start + 10, 60) * 1220);
  const label = `${value.toLocaleString('it-IT')} €`;
  const pressed = Math.floor((t - start) / 6) % 16;
  return (
    <g transform={g(x, y, scale * k, rotate)}>
      <rect x={-95} y={-140} width={190} height={280} rx={26} fill={a} />
      <rect x={-75} y={-118} width={150} height={60} rx={10} fill={hole} />
      <text x={66} y={-77} textAnchor="end" fontSize={26} fill={ink} fontFamily={MONO}>
        {label}
      </text>
      {Array.from({ length: 16 }, (_, i) => {
        const cx = -57 + (i % 4) * 38;
        const cy = -28 + Math.floor(i / 4) * 40;
        const on = i === pressed && t >= start + 10;
        const color = i % 4 === 3 ? b : i === 15 ? b : c;
        return (
          <rect
            key={i}
            x={cx - 15}
            y={cy - 15}
            width={30}
            height={30}
            rx={8}
            fill={color}
            transform={
              on ? `translate(${cx} ${cy}) scale(0.78) translate(${-cx} ${-cy})` : undefined
            }
            opacity={on ? 0.75 : 1}
          />
        );
      })}
    </g>
  );
};

export const Scissors: React.FC<ObjectProps> = ({
  f,
  x,
  y,
  scale = 1,
  rotate = 0,
  start = 0,
  a,
  b,
  hole,
}) => {
  const t = onTwos(f);
  const k = pop(t, start, 14);
  const open = 4 + 18 * Math.abs(Math.sin((t - start) * 0.22));
  const half = (dir: 1 | -1, color: string) => (
    <g transform={`rotate(${dir * open}) scale(1 ${dir})`}>
      <path d="M -6 -9 Q 90 -16 168 -2 Q 90 7 -6 10 Z" fill={a} />
      <path d="M -6 -9 L -58 -26 L -50 -6 Z" fill={color} />
      <circle cx={-82} cy={-34} r={32} fill={color} />
      <circle cx={-82} cy={-34} r={15} fill={hole} />
    </g>
  );
  return (
    <g transform={g(x, y, scale * k, rotate)}>
      {half(1, b)}
      {half(-1, b)}
      <circle r={9} fill={hole} />
    </g>
  );
};

export const Stapler: React.FC<ObjectProps> = ({
  f,
  x,
  y,
  scale = 1,
  rotate = 0,
  start = 0,
  a,
  b,
  c,
  hole,
}) => {
  const t = onTwos(f);
  const k = pop(t, start, 14);
  const bite = t < start + 12 ? 0 : pulse(t, 30, start + 12);
  const angle = -16 * (1 - bite);
  return (
    <g transform={g(x, y, scale * k, rotate)}>
      <rect x={-40} y={2} width={190} height={16} rx={4} fill={c} transform="rotate(-3 55 10)" />
      <rect x={-120} y={14} width={240} height={34} rx={14} fill={b} />
      <g transform={`rotate(${angle} -110 6)`}>
        <rect x={-120} y={-34} width={240} height={42} rx={18} fill={a} />
        <rect x={60} y={-24} width={46} height={10} rx={5} fill={hole} opacity={0.5} />
      </g>
      {bite > 0.6 && (
        <path d="M 82 6 L 82 -2 L 104 -2 L 104 6" fill="none" stroke={hole} strokeWidth={5} />
      )}
    </g>
  );
};

export const Binders: React.FC<ObjectProps> = ({
  f,
  x,
  y,
  scale = 1,
  rotate = 0,
  start = 0,
  a,
  b,
  c,
  hole,
}) => {
  const t = onTwos(f);
  const colors = [a, b, c, a];
  return (
    <g transform={g(x, y, scale, rotate)}>
      {colors.map((color, i) => {
        const inP = pop(t, start + i * 5, 14);
        const lean = i === 3 ? -14 * ramp(t, start + 30, 10) + Math.sin(t * 0.1) * 1.5 : 0;
        const bx = -150 + i * 78;
        return (
          <g
            key={i}
            transform={`translate(${(1 - inP) * 400} 0) rotate(${lean} ${bx} 130)`}
            opacity={inP > 0 ? 1 : 0}
          >
            <rect x={bx} y={-130} width={70} height={260} rx={8} fill={color} />
            <rect x={bx + 12} y={-92} width={46} height={70} rx={6} fill={hole} opacity={0.85} />
            <circle cx={bx + 35} cy={70} r={13} fill={hole} />
          </g>
        );
      })}
    </g>
  );
};

export const RubberStamp: React.FC<ObjectProps> = ({
  f,
  x,
  y,
  scale = 1,
  rotate = 0,
  start = 0,
  a,
  b,
  c,
  hole,
}) => {
  const t = onTwos(f);
  const k = pop(t, start, 14);
  const hit = t < start + 14 ? 0 : pulse(t, 40, start + 14, 5, 10);
  const stamped = t >= start + 18;
  return (
    <g transform={g(x, y, scale * k, rotate)}>
      {stamped && (
        <g opacity={0.9} transform={`translate(0 120) scale(${pop(t, start + 18, 10)})`}>
          <ellipse rx={92} ry={30} fill="none" stroke={c} strokeWidth={9} />
          <path
            d="M -28 0 L -8 16 L 30 -16"
            fill="none"
            stroke={c}
            strokeWidth={10}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
      <g transform={`translate(0 ${-40 + hit * 46})`}>
        <circle cx={0} cy={-120} r={38} fill={b} />
        <rect x={-16} y={-92} width={32} height={46} fill={a} />
        <rect x={-74} y={-50} width={148} height={64} rx={16} fill={a} />
        <rect x={-82} y={12} width={164} height={18} rx={6} fill={c} />
        <rect x={-60} y={-34} width={44} height={10} rx={5} fill={hole} opacity={0.45} />
      </g>
    </g>
  );
};

export const Pencil: React.FC<ObjectProps> = ({
  f,
  x,
  y,
  scale = 1,
  rotate = 0,
  start = 0,
  a,
  b,
  c,
  ink,
}) => {
  const t = onTwos(f);
  const p = ramp(t, start, 70);
  const line: Pt[] = [];
  for (let s = 0; s <= p; s += 0.02)
    line.push([-150 + s * 300, 70 + Math.sin(s * Math.PI * 4) * 22]);
  const tip = line[line.length - 1] ?? [-150, 70];
  return (
    <g transform={g(x, y, scale, rotate)}>
      {line.length > 1 && (
        <path d={smoothOpen(line)} fill="none" stroke={b} strokeWidth={9} strokeLinecap="round" />
      )}
      <g transform={`translate(${tip[0]} ${tip[1]}) rotate(-35)`}>
        <polygon points="0,0 22,-12 22,12" fill={c} />
        <polygon points="0,0 8,-4 8,4" fill={ink} />
        <rect x={22} y={-13} width={210} height={26} fill={a} />
        <rect x={22} y={-4} width={210} height={6} fill={b} opacity={0.35} />
        <rect x={232} y={-13} width={30} height={26} rx={5} fill={b} />
      </g>
    </g>
  );
};

export const Envelope: React.FC<ObjectProps> = ({
  f,
  x,
  y,
  scale = 1,
  rotate = 0,
  start = 0,
  a,
  b,
  c,
  hole,
}) => {
  const t = onTwos(f);
  const k = pop(t, start, 14);
  const open = ramp(t, start + 14, 14);
  const letter = ramp(t, start + 26, 16);
  const flap = (
    <g transform={`translate(0 -70) scale(1 ${1 - 2 * open}) translate(0 70)`}>
      <path d="M -110 -70 L 0 20 L 110 -70 Z" fill={b} />
    </g>
  );
  // Once open, the flap folds behind the letter coming out.
  const isOpen = open > 0.5;
  return (
    <g transform={g(x, y, scale * k, rotate)}>
      {isOpen && flap}
      <g transform={`translate(0 ${-letter * 90})`}>
        <rect x={-90} y={-60} width={180} height={130} rx={6} fill={c} />
        <rect x={-62} y={-36} width={100} height={12} rx={6} fill={hole} />
        <rect x={-62} y={-12} width={124} height={12} rx={6} fill={hole} opacity={0.6} />
      </g>
      <rect x={-110} y={-70} width={220} height={150} rx={10} fill={a} />
      <path d="M -110 80 L 0 0 L 110 80 Z" fill={b} opacity={0.85} />
      {!isOpen && flap}
    </g>
  );
};

export const Coins: React.FC<ObjectProps> = ({
  f,
  x,
  y,
  scale = 1,
  rotate = 0,
  start = 0,
  a,
  b,
  ink,
}) => {
  const t = onTwos(f);
  const coins = 6;
  return (
    <g transform={g(x, y, scale, rotate)}>
      {Array.from({ length: coins }, (_, i) => {
        const land = start + i * 8;
        if (t < land - 10) return null;
        const p = pop(t, land - 10, 12);
        const yy = 60 - i * 22;
        return (
          <g key={i} transform={`translate(${(i % 2) * 6 - 3} ${yy - (1 - p) * 300})`}>
            <rect x={-62} y={0} width={124} height={20} fill={b} />
            <ellipse cx={0} cy={20} rx={62} ry={20} fill={b} />
            <ellipse cx={0} cy={0} rx={62} ry={20} fill={a} />
            {i === coins - 1 && (
              <text
                x={0}
                y={9}
                textAnchor="middle"
                fontSize={26}
                fontWeight={800}
                fill={ink}
                fontFamily={MONO}
              >
                €
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
};

export const CalendarPage: React.FC<ObjectProps> = ({
  f,
  x,
  y,
  scale = 1,
  rotate = 0,
  start = 0,
  a,
  b,
  c,
  hole,
  ink,
}) => {
  const t = onTwos(f);
  const k = pop(t, start, 14);
  const flips = Math.max(0, Math.floor((t - start - 10) / 30));
  const phase = (((t - start - 10) % 30) + 30) % 30;
  const flipping = t >= start + 10 && phase < 8;
  const squash = flipping ? Math.abs(Math.cos((phase / 8) * Math.PI)) : 1;
  const day = 14 + flips + (flipping && phase >= 4 ? 1 : 0);
  return (
    <g transform={g(x, y, scale * k, rotate)}>
      <rect x={-100} y={-110} width={200} height={230} rx={16} fill={hole} />
      <rect x={-100} y={-110} width={200} height={62} rx={16} fill={a} />
      <rect x={-100} y={-70} width={200} height={22} fill={a} />
      <rect x={-56} y={-128} width={14} height={40} rx={7} fill={b} />
      <rect x={42} y={-128} width={14} height={40} rx={7} fill={b} />
      <g transform={`translate(0 30) scale(1 ${squash}) translate(0 -30)`}>
        <text
          x={0}
          y={70}
          textAnchor="middle"
          fontSize={110}
          fontWeight={800}
          fill={day === 16 ? c : ink}
          fontFamily="'Sour Gummy', sans-serif"
        >
          {day}
        </text>
      </g>
    </g>
  );
};

export const CoffeeCup: React.FC<ObjectProps> = ({
  f,
  x,
  y,
  scale = 1,
  rotate = 0,
  start = 0,
  a,
  b,
  c,
}) => {
  const t = onTwos(f);
  const k = pop(t, start, 14);
  const steam = (i: number) => {
    const phase = ((t * 1.4 + i * 40) % 120) / 120;
    const pts: Pt[] = [];
    for (let s = 0; s <= 1; s += 0.1) {
      pts.push([(i - 1) * 34 + Math.sin(s * 6 + t * 0.18 + i) * 12, -110 - s * 110 - phase * 40]);
    }
    return (
      <path
        key={i}
        d={smoothOpen(pts)}
        fill="none"
        stroke={c}
        strokeWidth={10}
        strokeLinecap="round"
        opacity={Math.sin(phase * Math.PI)}
      />
    );
  };
  return (
    <g transform={g(x, y, scale * k, rotate)}>
      {[0, 1, 2].map(steam)}
      <ellipse cx={0} cy={86} rx={140} ry={26} fill={b} />
      <circle cx={94} cy={-6} r={44} fill={a} />
      <circle cx={94} cy={-6} r={22} fill={b} />
      <path d="M -96 -90 L 96 -90 L 76 70 Q 0 96 -76 70 Z" fill={a} />
      <ellipse cx={0} cy={-90} rx={96} ry={18} fill={c} opacity={0.9} />
    </g>
  );
};

export const Magnifier: React.FC<ObjectProps> = ({
  f,
  x,
  y,
  scale = 1,
  rotate = 0,
  start = 0,
  a,
  b,
  hole,
}) => {
  const t = onTwos(f);
  const k = pop(t, start, 14);
  const u = (t - start) * 0.05;
  const mx = Math.sin(u) * 90;
  const my = Math.sin(u * 2) * 40;
  return (
    <g transform={g(x + mx, y + my, scale * k, rotate)}>
      <rect x={52} y={52} width={34} height={120} rx={14} fill={b} transform="rotate(-45 69 112)" />
      <circle r={86} fill={a} />
      <circle r={62} fill={hole} opacity={0.75} />
      <ellipse
        cx={-24}
        cy={-26}
        rx={18}
        ry={10}
        fill="white"
        opacity={0.6}
        transform="rotate(-35 -24 -26)"
      />
    </g>
  );
};

export const PinnedNote: React.FC<ObjectProps> = ({
  f,
  x,
  y,
  scale = 1,
  rotate = 0,
  start = 0,
  a,
  b,
  c,
  ink,
}) => {
  const t = onTwos(f);
  const pin = pop(t, start + 10, 10);
  const swing = Math.sin(t * 0.12) * 5 * ramp(t, start + 14, 10) + (1 - pop(t, start, 14)) * 30;
  return (
    <g transform={g(x, y, scale, rotate)}>
      <g transform={`rotate(${swing} 0 -110)`}>
        <rect x={-110} y={-110} width={220} height={210} rx={6} fill={a} />
        <rect x={-80} y={-50} width={150} height={14} rx={7} fill={c} />
        <rect x={-80} y={-20} width={120} height={14} rx={7} fill={c} opacity={0.7} />
        <text
          x={-80}
          y={52}
          fontSize={40}
          fontWeight={800}
          fill={ink}
          fontFamily="'Sour Gummy', sans-serif"
        >
          TD17
        </text>
      </g>
      <g transform={`translate(0 -110) scale(${pin})`}>
        <circle r={22} fill={b} />
        <circle cx={-7} cy={-7} r={7} fill="white" opacity={0.5} />
      </g>
    </g>
  );
};

export const OFFICE_OBJECTS = [
  { key: 'calculator', label: 'Calculator · counts', C: Calculator },
  { key: 'scissors', label: 'Scissors · snip', C: Scissors },
  { key: 'stapler', label: 'Stapler · bites', C: Stapler },
  { key: 'binders', label: 'Binders · settle', C: Binders },
  { key: 'stamp', label: 'Stamp · stamps', C: RubberStamp },
  { key: 'pencil', label: 'Pencil · writes', C: Pencil },
  { key: 'envelope', label: 'Envelope · opens', C: Envelope },
  { key: 'coins', label: 'Coins · drop', C: Coins },
  { key: 'calendar', label: 'Calendar · flips', C: CalendarPage },
  { key: 'coffee', label: 'Coffee · steams', C: CoffeeCup },
  { key: 'magnifier', label: 'Magnifier · searches', C: Magnifier },
  { key: 'note', label: 'Note · pinned', C: PinnedNote },
] as const;
