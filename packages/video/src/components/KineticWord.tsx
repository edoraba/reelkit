import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { ResolvedFont } from '../brand/fonts';
import { HighlightBox } from '../stickers/HighlightBox';

export interface KineticWordProps {
  text: string;
  /** First frame on screen. */
  at: number;
  /** First frame off screen (hard cut, like the reference). */
  until: number;
  font: ResolvedFont;
  fontSize: number;
  color: string;
  highlight?: { fill: string; textColor: string };
  /** Vertical center of the word, px. */
  y: number;
}

/** One word at a time in the center: pops in with a spring and cuts out. */
export const KineticWord: React.FC<KineticWordProps> = ({
  text,
  at,
  until,
  font,
  fontSize,
  color,
  highlight,
  y,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at || frame >= until) return null;

  const pop = spring({
    frame: frame - at,
    fps,
    config: { damping: 12, stiffness: 220, mass: 0.6 },
  });
  const scale = 0.7 + 0.3 * pop;
  const lift = (1 - pop) * 40;

  const word = highlight ? (
    <HighlightBox fill={highlight.fill} textColor={highlight.textColor} scale={pop}>
      {text}
    </HighlightBox>
  ) : (
    text
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: 80,
        right: 150,
        top: y,
        transform: `translateY(-50%) translateY(${lift}px) scale(${highlight ? 1 : scale})`,
        textAlign: 'center',
        ...font,
        fontSize,
        lineHeight: 1,
        letterSpacing: '-0.03em',
        color,
        opacity: Math.min(1, pop * 2),
      }}
    >
      {word}
    </div>
  );
};
