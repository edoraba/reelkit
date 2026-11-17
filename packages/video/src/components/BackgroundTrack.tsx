import { backgrounds, type BackgroundName } from '@reelkit/brand';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';

export interface BackgroundSegment {
  from: number;
  bg: BackgroundName;
}

/** Frames the new color takes to slide in. The `swoosh` SFX is anticipated by 2-3 frames. */
export const BG_SLIDE_FRAMES = 9;

/** Background active at `frame` (the one whose colors text should use). */
export function activeBackground(segments: BackgroundSegment[], frame: number): BackgroundName {
  let active = segments[0]?.bg ?? 'blue';
  for (const s of segments) if (s.from <= frame) active = s.bg;
  return active;
}

const DotGrid: React.FC<{ color: string }> = ({ color }) => (
  <AbsoluteFill
    style={{
      backgroundImage: `radial-gradient(circle, ${color} 2.6px, transparent 3.2px)`,
      backgroundSize: '40px 40px',
      backgroundPosition: '20px 20px',
    }}
  />
);

/** Flat background with a dot grid; each new color slides up over the previous one. */
export const BackgroundTrack: React.FC<{ segments: BackgroundSegment[] }> = ({ segments }) => {
  const frame = useCurrentFrame();
  const visible = segments.filter((s) => s.from <= frame).slice(-2);
  return (
    <AbsoluteFill>
      {visible.map((s, i) => {
        const entering = i === visible.length - 1 && s.from > 0;
        const progress = entering
          ? interpolate(frame - s.from, [0, BG_SLIDE_FRAMES], [0, 1], {
              extrapolateRight: 'clamp',
              easing: Easing.out(Easing.cubic),
            })
          : 1;
        const spec = backgrounds[s.bg];
        return (
          <AbsoluteFill
            key={s.from}
            style={{
              backgroundColor: spec.fill,
              transform: `translateY(${(1 - progress) * 100}%)`,
            }}
          >
            <DotGrid color={spec.dots} />
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
