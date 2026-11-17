/**
 * Sticker finish of the mascot (D-019): a white die-cut border around the whole silhouette
 * plus a soft shadow. Put it in the character's `defs` and pass `filter="url(#id)"`.
 * `radius` is in viewBox units of the drawing it is applied to.
 */
export const StickerFilter: React.FC<{
  id: string;
  radius?: number;
  color?: string;
  shadow?: number;
}> = ({ id, radius = 12, color = 'white', shadow = 0.25 }) => (
  <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
    <feMorphology in="SourceAlpha" operator="dilate" radius={radius} result="grown" />
    <feFlood floodColor={color} />
    <feComposite in2="grown" operator="in" result="border" />
    <feGaussianBlur in="grown" stdDeviation="5" result="soft" />
    <feOffset in="soft" dx="6" dy="10" result="moved" />
    <feFlood floodColor="black" floodOpacity={shadow} />
    <feComposite in2="moved" operator="in" result="shadow" />
    <feMerge>
      <feMergeNode in="shadow" />
      <feMergeNode in="border" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>
);
