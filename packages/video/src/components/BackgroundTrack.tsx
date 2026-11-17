import { backgrounds, type BackgroundName } from '@reelkit/brand';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { GraphPaper } from '../textures/Paper';

export interface BackgroundSegment {
  from: number;
  bg: BackgroundName;
  /** Squared paper (quadretti scenes) or plain color (scontrino scenes). Default grid. */
  texture?: 'grid' | 'plain';
}

/** Frames the new background takes to slide in. The `swoosh` SFX is anticipated by 2-3 frames. */
export const BG_SLIDE_FRAMES = 9;

/** Background active at `frame` (the one whose colors text should use). */
export function activeBackground(segments: BackgroundSegment[], frame: number): BackgroundName {
  let active = segments[0]?.bg ?? 'blue';
  for (const s of segments) if (s.from <= frame) active = s.bg;
  return active;
}

/** Flat background, squared or plain; each new one slides up over the previous one. */
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
          <AbsoluteFill key={s.from} style={{ transform: `translateY(${(1 - progress) * 100}%)` }}>
            {(s.texture ?? 'grid') === 'grid' ? (
              <GraphPaper fill={spec.fill} line={spec.dots} spacing={54} />
            ) : (
              <AbsoluteFill style={{ backgroundColor: spec.fill }} />
            )}
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
