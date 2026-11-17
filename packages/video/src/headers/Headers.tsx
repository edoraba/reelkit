import { safeZone } from '@reelkit/brand';
import type { ResolvedFont } from '../brand/fonts';

/**
 * Chapter headers. Each one says "where are we in the reel" with a sign from paper work:
 * a document header, binder tabs, or a plain counter.
 */

const LEFT = 96;

/** Document header: register name and page number, a rule, then the chapter title. */
export const DocHeader: React.FC<{
  left: string;
  right: string;
  title: string;
  color: string;
  titleColor: string;
  mono: ResolvedFont;
  display: ResolvedFont;
  /** Left edge in px, e.g. to start after a ledger margin. */
  x?: number;
}> = ({ left, right, title, color, titleColor, mono, display, x = LEFT }) => (
  <div style={{ position: 'absolute', top: safeZone.top, left: x, right: safeZone.right, color }}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        ...mono,
        fontSize: 28,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}
    >
      <span>{left}</span>
      <span>{right}</span>
    </div>
    <div style={{ height: 3, backgroundColor: color, margin: '12px 0 16px' }} />
    <div style={{ ...display, fontSize: 54, lineHeight: 1, color: titleColor }}>{title}</div>
  </div>
);

/** Binder tabs: one tab per chapter, the current one filled. */
export const BinderTabs: React.FC<{
  tabs: string[];
  active: number;
  color: string;
  activeFill: string;
  activeText: string;
  mono: ResolvedFont;
}> = ({ tabs, active, color, activeFill, activeText, mono }) => (
  <div
    style={{
      position: 'absolute',
      top: safeZone.top,
      left: LEFT,
      right: safeZone.right,
      display: 'flex',
      gap: 10,
      alignItems: 'flex-end',
      borderBottom: `5px solid ${activeFill}`,
    }}
  >
    {tabs.map((t, i) => {
      const on = i === active;
      return (
        <div
          key={t}
          style={{
            padding: on ? '18px 28px 12px' : '12px 22px 10px',
            borderRadius: '16px 16px 0 0',
            backgroundColor: on ? activeFill : 'transparent',
            border: on ? 'none' : `3px solid ${color}`,
            borderBottom: 'none',
            color: on ? activeText : color,
            opacity: on ? 1 : 0.6,
            ...mono,
            fontSize: on ? 32 : 26,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {t}
        </div>
      );
    })}
  </div>
);

/** Plain counter: big chapter number, total and label. */
export const CounterHeader: React.FC<{
  current: number;
  total: number;
  label: string;
  color: string;
  display: ResolvedFont;
  mono: ResolvedFont;
}> = ({ current, total, label, color, display, mono }) => (
  <div
    style={{
      position: 'absolute',
      top: safeZone.top - 20,
      left: LEFT,
      display: 'flex',
      alignItems: 'baseline',
      gap: 18,
      color,
    }}
  >
    <span style={{ ...display, fontSize: 96, lineHeight: 1 }}>{current}</span>
    <span style={{ ...mono, fontSize: 30, opacity: 0.7 }}>/ {total}</span>
    <span
      style={{
        ...mono,
        fontSize: 30,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginLeft: 12,
      }}
    >
      {label}
    </span>
  </div>
);
