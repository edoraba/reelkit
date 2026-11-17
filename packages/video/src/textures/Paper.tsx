import { AbsoluteFill } from 'remotion';

/** Ledger paper: horizontal rules plus a double vertical margin line. */
export const RuledPaper: React.FC<{
  fill: string;
  line: string;
  margin: string;
  spacing?: number;
  /** x of the double margin line. */
  marginX?: number;
  /** y of the first rule, so text baselines can sit on the lines. */
  offsetY?: number;
}> = ({ fill, line, margin, spacing = 64, marginX = 120, offsetY = 0 }) => (
  <AbsoluteFill style={{ backgroundColor: fill }}>
    <AbsoluteFill
      style={{
        backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${spacing - 3}px, ${line} ${spacing - 3}px, ${line} ${spacing}px)`,
        backgroundPosition: `0 ${offsetY}px`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: marginX,
        width: 12,
        borderLeft: `3px solid ${margin}`,
        borderRight: `3px solid ${margin}`,
      }}
    />
  </AbsoluteFill>
);

/** Squared accounting paper. */
export const GraphPaper: React.FC<{ fill: string; line: string; spacing?: number }> = ({
  fill,
  line,
  spacing = 54,
}) => (
  <AbsoluteFill
    style={{
      backgroundColor: fill,
      backgroundImage: `linear-gradient(${line} 2px, transparent 2px), linear-gradient(90deg, ${line} 2px, transparent 2px)`,
      backgroundSize: `${spacing}px ${spacing}px`,
      backgroundPosition: '-1px -1px',
    }}
  />
);
