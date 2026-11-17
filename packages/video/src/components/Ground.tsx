/** Where the mascot stands: a flat shadow and a short hand-drawn pen line. */
export const Ground: React.FC<{
  x: number;
  y: number;
  width: number;
  pen: string;
  shadow: string;
}> = ({ x, y, width, pen, shadow }) => {
  const h = width / 2;
  return (
    <svg
      width={1080}
      height={1920}
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}
    >
      <ellipse cx={x} cy={y} rx={h * 0.62} ry={width * 0.06} fill={shadow} />
      <path
        d={`M ${x - h} ${y + 6} C ${x - h * 0.4} ${y - 4}, ${x + h * 0.3} ${y + 10}, ${x + h} ${y + 2}`}
        fill="none"
        stroke={pen}
        strokeWidth={7}
        strokeLinecap="round"
      />
    </svg>
  );
};
