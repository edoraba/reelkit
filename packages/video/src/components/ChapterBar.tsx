import { safeZone } from '@reelkit/brand';
import type { ResolvedFont } from '../brand/fonts';

export interface ChapterBarProps {
  total: number;
  /** 1-based index of the current chapter. */
  current: number;
  /** 0..1 progress inside the current chapter. */
  progress: number;
  label: string;
  /** Track and label color (the background text color). */
  color: string;
  /** Filled part of the segments (the background highlight color). */
  fillColor: string;
  font: ResolvedFont;
}

/** Segmented progress bar with the chapter label, e.g. "01 / 03 · IL PROBLEMA". */
export const ChapterBar: React.FC<ChapterBarProps> = ({
  total,
  current,
  progress,
  label,
  color,
  fillColor,
  font,
}) => (
  <div
    style={{
      position: 'absolute',
      top: safeZone.top,
      left: 160,
      right: 160,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 18,
    }}
  >
    <div style={{ display: 'flex', gap: 14, width: '100%' }}>
      {Array.from({ length: total }, (_, i) => {
        const fill = i + 1 < current ? 1 : i + 1 === current ? progress : 0;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: 12,
              borderRadius: 6,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{ position: 'absolute', inset: 0, backgroundColor: color, opacity: 0.25 }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: `${fill * 100}%`,
                backgroundColor: fillColor,
              }}
            />
          </div>
        );
      })}
    </div>
    <div
      style={{
        ...font,
        fontSize: 34,
        color,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </div>
  </div>
);
