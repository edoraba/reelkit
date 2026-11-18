import { paper, type CutoutPalette } from '@reelkit/brand';
import { Img, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { fontsOf } from '../../brand/fonts';
import { CutoutStickerFilter } from '../../lab/cutouts/paper';

/**
 * Closing of a reel (D-033): a white paper card with the real Refattura logotype
 * (assets/brand/logotype.svg, 702x133), cut out with the boiling sticker edge, then the tagline
 * and the site. Drawn above the closing scene's paper background; frames count from the start
 * of the closing.
 */
const TAGLINE = 'autofatture, senza pensieri';
const SITE = 'refattura.it';
const CARD = { x: 110, y: 560, w: 860, h: 330 } as const;
const LOGO_W = 640;

const pop = (frame: number, at: number, fps: number) =>
  spring({ frame: frame - at, fps, config: { damping: 11, stiffness: 170, mass: 0.7 } });

export const Outro: React.FC<{ p: CutoutPalette }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fonts = fontsOf('brand');
  const card = pop(frame, 8, fps);
  const logo = pop(frame, 14, fps);
  const tag = pop(frame, 24, fps);
  const site = pop(frame, 32, fps);
  // Cut paper: the card comes in on twos, slightly turned, and settles.
  const turn = (1 - card) * -6;
  return (
    <>
      <svg
        width={1080}
        height={1920}
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
      >
        <defs>
          <CutoutStickerFilter id="outroCard" frame={frame} border={10} />
        </defs>
        {frame >= 8 && (
          <g
            filter="url(#outroCard)"
            transform={`translate(${CARD.x + CARD.w / 2} ${CARD.y + CARD.h / 2}) rotate(${turn - 1.5}) scale(${0.6 + 0.4 * card}) translate(${-CARD.w / 2} ${-CARD.h / 2})`}
          >
            <rect width={CARD.w} height={CARD.h} rx={26} fill={paper.white} />
          </g>
        )}
      </svg>
      {frame >= 14 && (
        <Img
          src={staticFile('brand/logotype.svg')}
          style={{
            position: 'absolute',
            left: (1080 - LOGO_W) / 2,
            top: CARD.y + (CARD.h - (LOGO_W * 133) / 702) / 2,
            width: LOGO_W,
            height: (LOGO_W * 133) / 702,
            transform: `rotate(-1.5deg) scale(${0.7 + 0.3 * logo})`,
            opacity: Math.min(1, logo * 1.5),
          }}
        />
      )}
      {frame >= 24 && (
        <div
          style={{
            position: 'absolute',
            top: CARD.y + CARD.h + 70,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: "'Sour Gummy', sans-serif",
            fontWeight: 800,
            fontSize: 76,
            color: p.text,
            transform: `rotate(-2deg) scale(${0.8 + 0.2 * tag})`,
            opacity: Math.min(1, tag * 1.5),
          }}
        >
          {TAGLINE}
        </div>
      )}
      {frame >= 32 && (
        <div
          style={{
            position: 'absolute',
            top: CARD.y + CARD.h + 190,
            left: 0,
            right: 0,
            textAlign: 'center',
            ...fonts.mono,
            fontSize: 44,
            letterSpacing: '0.06em',
            color: p.text,
            opacity: Math.min(1, site * 1.5) * 0.9,
          }}
        >
          {SITE}
        </div>
      )}
    </>
  );
};
