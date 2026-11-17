import { backgrounds, refattura, type BackgroundName } from '@reelkit/brand';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { fontsOf } from '../brand/fonts';
import { InvoiceRoll } from '../mascot/InvoiceRoll';
import { GraphPaper } from '../textures/Paper';
import { INVOICE_ROLL_LAB_DURATION, MOTION_CUES, MOTION_TALK, motionGaze } from './InvoiceRollLab';
import { Sticker } from './StyleLab';

/**
 * Motion test of the two shortlisted mascot styles (01 flat outline, 02 sticker) on three
 * backgrounds, same timeline as the invoice roll test.
 *   pnpm render:style-motion  ->  packages/video/out/lab/style-motion.mp4
 */
export const STYLE_MOTION_DURATION = INVOICE_ROLL_LAB_DURATION;

const ROWS: Array<{ bg: BackgroundName; grid: boolean }> = [
  { bg: 'blue', grid: true },
  { bg: 'paper', grid: true },
  { bg: 'ink', grid: false },
];
const COLS = [
  { key: 'flat', label: '01 · Flat outline' },
  { key: 'sticker', label: '02 · Sticker' },
] as const;

const CELL_W = 540;
const CELL_H = 640;
const CHAR_W = 330;
const CHAR_TOP = 64;
const fonts = fontsOf('brand');

export const StyleMotionLab: React.FC = () => {
  const frame = useCurrentFrame();
  const gaze = motionGaze(frame);
  return (
    <AbsoluteFill style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {ROWS.flatMap((row, r) =>
        COLS.map((col) => {
          const bg = backgrounds[row.bg];
          const sticker = col.key === 'sticker';
          const id = `sm${r}${col.key}`;
          const feetY = CHAR_TOP + CHAR_W * (566 / 400);
          return (
            <div
              key={id}
              style={{ position: 'relative', width: CELL_W, height: CELL_H, overflow: 'hidden' }}
            >
              {row.grid ? (
                <GraphPaper fill={bg.fill} line={bg.dots} spacing={40} />
              ) : (
                <AbsoluteFill style={{ backgroundColor: bg.fill }} />
              )}
              <div
                style={{
                  position: 'absolute',
                  top: 22,
                  left: 26,
                  color: bg.text,
                  ...fonts.mono,
                  fontSize: 24,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {col.label}
              </div>
              {!sticker && (
                <div
                  style={{
                    position: 'absolute',
                    left: CELL_W / 2 - 110,
                    top: feetY - 12,
                    width: 220,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: 'oklch(0% 0 0 / 0.14)',
                  }}
                />
              )}
              <InvoiceRoll
                width={CHAR_W}
                cues={MOTION_CUES}
                talk={MOTION_TALK}
                gaze={gaze}
                seed="style-motion"
                pen={sticker ? refattura.inkBlue : bg.pen}
                defs={
                  sticker ? <Sticker id={id} radius={12} color={refattura.sheetWhite} /> : undefined
                }
                filter={sticker ? `url(#${id})` : undefined}
                style={{ position: 'absolute', left: (CELL_W - CHAR_W) / 2, top: CHAR_TOP }}
              />
            </div>
          );
        }),
      )}
    </AbsoluteFill>
  );
};
