import { useId } from 'react';
import type { ResolvedFont } from '../brand/fonts';

/**
 * Rubber stamp, the same three stamps the Refattura app uses for invoice status
 * (green ok, amber decision needed, red failed). Double border, uppercase mono, worn edges.
 */
export const Stamp: React.FC<{
  text: string;
  color: string;
  font: ResolvedFont;
  fontSize?: number;
  rotate?: number;
  style?: React.CSSProperties;
}> = ({ text, color, font, fontSize = 52, rotate = -8, style }) => {
  const id = `stamp${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <>
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <filter id={id}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.7"
            numOctaves="2"
            seed="11"
            result="grain"
          />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="3" result="rough" />
          <feComponentTransfer in="grain" result="holes">
            <feFuncA type="discrete" tableValues="1 1 1 1 1 0 1 1" />
          </feComponentTransfer>
          <feComposite in="rough" in2="holes" operator="in" />
        </filter>
      </svg>
      <div
        style={{
          display: 'inline-block',
          transform: `rotate(${rotate}deg)`,
          filter: `url(#${id})`,
          opacity: 0.92,
          ...style,
        }}
      >
        <div style={{ border: `7px solid ${color}`, borderRadius: 12, padding: 6 }}>
          <div
            style={{
              border: `3px solid ${color}`,
              borderRadius: 7,
              padding: '8px 26px 6px',
              ...font,
              fontSize,
              lineHeight: 1.1,
              color,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            {text}
          </div>
        </div>
      </div>
    </>
  );
};
