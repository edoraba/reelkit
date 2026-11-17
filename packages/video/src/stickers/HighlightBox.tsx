import { illustration } from '@reelkit/brand';

export interface HighlightBoxProps {
  children: React.ReactNode;
  fill: string;
  textColor: string;
  /** Degrees. Small tilt like a sticker. */
  rotate?: number;
  /** 0..1 entry animation, scales the box from 0 with overshoot handled by the caller. */
  scale?: number;
}

/** Keyword in a tilted box with thick outline and solid offset shadow. */
export const HighlightBox: React.FC<HighlightBoxProps> = ({
  children,
  fill,
  textColor,
  rotate = -3,
  scale = 1,
}) => (
  <span
    style={{
      display: 'inline-block',
      backgroundColor: fill,
      color: textColor,
      padding: '0.04em 0.22em 0.1em',
      border: `${illustration.outlineWidth}px solid ${illustration.outline}`,
      borderRadius: illustration.radius,
      boxShadow: `${illustration.shadowOffset}px ${illustration.shadowOffset}px 0 ${illustration.outline}`,
      transform: `rotate(${rotate}deg) scale(${scale})`,
    }}
  >
    {children}
  </span>
);
