import { Img, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

/** Refattura logotype (assets/brand/logotype.svg, 702x133) popping in at `at`. */
export const Logo: React.FC<{ at: number; width: number; y: number }> = ({ at, width, y }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const pop = spring({
    frame: frame - at,
    fps,
    config: { damping: 11, stiffness: 180, mass: 0.7 },
  });
  return (
    <Img
      src={staticFile('brand/logotype.svg')}
      style={{
        position: 'absolute',
        left: (1080 - width) / 2,
        top: y,
        width,
        height: (width * 133) / 702,
        transform: `scale(${0.6 + 0.4 * pop})`,
        opacity: Math.min(1, pop * 1.5),
      }}
    />
  );
};
