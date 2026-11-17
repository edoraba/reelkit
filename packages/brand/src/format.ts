/** Output formats. */
export const formats = {
  reel: { width: 1080, height: 1920, fps: 30 },
  cover: { width: 1080, height: 1920 },
  carousel: { width: 1080, height: 1350 },
} as const;

/**
 * Safe zones of the 1080x1920 reel, in px from each edge: Instagram and TikTok draw their UI
 * (header, caption, buttons) over these areas. No text or sticker may enter them.
 * Draft values, to be checked against real screenshots of the app.
 */
export const safeZone = {
  top: 250,
  bottom: 480,
  left: 64,
  right: 150,
} as const;

/**
 * Center area that survives the profile grid crop (3:4 in the middle of the 9:16 cover).
 * 1080x1440 centered vertically: y from 240 to 1680.
 */
export const gridCrop = {
  top: 240,
  bottom: 1680,
} as const;
