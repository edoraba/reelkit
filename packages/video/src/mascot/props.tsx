import { paper, type CutoutPalette } from '@reelkit/brand';
import type { PropKind } from '@reelkit/schema';

/**
 * Things the mascot holds (D-032), drawn upright with the origin at the hand loop (the arm
 * counter-rotates the slot, so +y is always down). Cut-paper look: graphite outline, palette colors;
 * boil and sticker border come from the mascot's filter.
 */
const INK = paper.ink;
const W = 4;

export const HandProp: React.FC<{ kind: PropKind; p: CutoutPalette; frame: number }> = ({
  kind,
  p,
  frame,
}) => {
  const [a, b, c] = p.motifs;
  const light = p.tone === 'light' ? paper.white : a;
  switch (kind) {
    case 'scissors': {
      // Blades open and close on twos while held.
      const open = 10 + 8 * Math.sin(Math.floor(frame / 2) * 1.3);
      return (
        <g stroke={INK} strokeWidth={W} strokeLinejoin="round">
          <circle cx={-9} cy={0} r={9} fill="none" />
          <circle cx={9} cy={0} r={9} fill="none" />
          <path d={`M -4 8 L ${-2 - open / 2} 64 L 2 12 Z`} fill={paper.white} />
          <path d={`M 4 8 L ${2 + open / 2} 64 L -2 12 Z`} fill={paper.white} />
        </g>
      );
    }
    case 'stamp':
      return (
        <g stroke={INK} strokeWidth={W} strokeLinejoin="round">
          <circle cx={0} cy={-6} r={11} fill={b} />
          <rect x={-6} y={4} width={12} height={22} fill={b} />
          <rect x={-22} y={26} width={44} height={14} rx={3} fill={a} />
          <rect x={-24} y={40} width={48} height={6} fill={INK} />
        </g>
      );
    case 'calculator':
      return (
        <g stroke={INK} strokeWidth={W} strokeLinejoin="round">
          <rect x={-24} y={-4} width={48} height={64} rx={7} fill={light} />
          <rect x={-17} y={4} width={34} height={13} rx={2} fill={c} />
          {Array.from({ length: 9 }, (_, i) => (
            <rect
              key={i}
              x={-16 + (i % 3) * 12}
              y={24 + Math.floor(i / 3) * 11}
              width={8}
              height={7}
              rx={2}
              fill={INK}
              stroke="none"
            />
          ))}
        </g>
      );
    case 'magnifier':
      return (
        <g stroke={INK} strokeWidth={W} strokeLinejoin="round">
          <rect x={-5} y={-34} width={10} height={34} rx={4} fill={b} />
          <circle cx={0} cy={-58} r={24} fill={paper.white} fillOpacity={0.55} />
        </g>
      );
    case 'letter':
      return (
        <g stroke={INK} strokeWidth={W} strokeLinejoin="round">
          <rect x={-28} y={4} width={56} height={38} rx={3} fill={light} />
          <path d="M -28 6 L 0 26 L 28 6" fill="none" />
        </g>
      );
    case 'wateringCan':
      return (
        <g stroke={INK} strokeWidth={W} strokeLinejoin="round">
          <rect x={-20} y={8} width={40} height={36} rx={6} fill={b} />
          <path d="M 20 18 L 46 4 L 50 10 L 22 30 Z" fill={b} />
          <path d="M -8 8 Q 0 -8 8 8" fill="none" />
        </g>
      );
    case 'sheet':
      return (
        <g stroke={INK} strokeWidth={W} strokeLinejoin="round">
          <rect x={-26} y={0} width={52} height={68} rx={3} fill={paper.white} />
          {[14, 26, 38, 50].map((y) => (
            <line key={y} x1={-16} x2={16} y1={y} y2={y} stroke={c} strokeWidth={4} />
          ))}
        </g>
      );
  }
};
