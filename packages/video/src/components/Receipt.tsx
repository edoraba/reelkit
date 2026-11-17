/** Strip of paper with torn zigzag edges at top and bottom (receipt, ledger slip). */
export const Receipt: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  tooth?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ x, y, width, height, fill, tooth = 26, children, style }) => {
  const teeth = Math.round(width / tooth);
  const step = width / teeth;
  const depth = tooth * 0.45;
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i <= teeth; i++) {
    const px = i * step;
    top.push(`${px}px ${i % 2 === 0 ? depth : 0}px`);
    bottom.unshift(`${px}px ${i % 2 === 0 ? height - depth : height}px`);
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        backgroundColor: fill,
        clipPath: `polygon(${[...top, ...bottom].join(', ')})`,
        padding: `${depth + 36}px 56px`,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Dashed separator line used inside receipts and documents. */
export const Dashes: React.FC<{ color: string; margin?: number }> = ({ color, margin = 22 }) => (
  <div style={{ borderTop: `4px dashed ${color}`, margin: `${margin}px 0` }} />
);
