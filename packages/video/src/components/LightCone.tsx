/** Flat light cone the mascot stands on: a trapezoid from above and an ellipse on the floor. */
export const LightCone: React.FC<{
  color: string;
  /** Center x of the floor ellipse. */
  x: number;
  /** y of the floor ellipse center. */
  floorY: number;
  width: number;
}> = ({ color, x, floorY, width }) => {
  const top = floorY - width * 1.6;
  const topHalf = width * 0.16;
  const floorHalf = width / 2;
  return (
    <svg
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}
      width={1}
      height={1}
    >
      <path
        d={`M ${x - topHalf} ${top} L ${x + topHalf} ${top} L ${x + floorHalf} ${floorY} L ${x - floorHalf} ${floorY} Z`}
        fill={color}
      />
      <ellipse cx={x} cy={floorY} rx={floorHalf} ry={width * 0.13} fill={color} />
    </svg>
  );
};
