import { backgrounds, type BackgroundName } from '@reelkit/brand';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { fontsOf } from '../brand/fonts';
import {
  InvoiceRoll,
  INVOICE_ROLL_VARIANTS,
  type InvoiceRollVariant,
  type TalkSpan,
} from '../mascot/InvoiceRoll';
import type { PoseCue } from '../mascot/poses';
import { GraphPaper } from '../textures/Paper';

/**
 * Motion test of the four "invoice roll" variants side by side, same timeline:
 * idle and blinks, a wave, a few seconds of fake talking (lip sync preview), arms up with
 * happy eyes.  pnpm render:invoice-roll  ->  packages/video/out/lab/invoice-roll.mp4
 */
export const INVOICE_ROLL_LAB_DURATION = 180;

const CELLS: Record<InvoiceRollVariant, { label: string; bg: BackgroundName; grid: boolean }> = {
  slim: { label: 'A · Slim', bg: 'blue', grid: true },
  a4: { label: 'B · A4', bg: 'paper', grid: true },
  header: { label: 'C · Blue header', bg: 'sky', grid: false },
  scroll: { label: 'D · Scroll', bg: 'ink', grid: false },
};

/** Shared motion test timeline: idle, wave, fake talking, arms up with happy eyes. */
export const MOTION_CUES: PoseCue[] = [
  { at: 0, pose: 'neutral' },
  { at: 30, pose: 'wave' },
  { at: 74, pose: 'neutral' },
  { at: 138, pose: 'arms-up', mouth: 'open', eyes: 'happy' },
];
export const MOTION_TALK: TalkSpan[] = [{ from: 82, to: 132 }];

/** Eyes follow the wave, then the camera, then look up when cheering. */
export function motionGaze(frame: number): { x: number; y: number } {
  if (frame >= 30 && frame < 74) return { x: 0.5, y: -0.2 };
  if (frame >= 138) return { x: 0, y: -0.4 };
  return { x: 0, y: 0 };
}

const CUES = MOTION_CUES;
const TALK = MOTION_TALK;
const fonts = fontsOf('brand');
const CHAR_W = 400;

export const InvoiceRollLab: React.FC = () => {
  const frame = useCurrentFrame();
  const gaze = motionGaze(frame);
  return (
    <AbsoluteFill style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {INVOICE_ROLL_VARIANTS.map((v) => {
        const cell = CELLS[v];
        const bg = backgrounds[cell.bg];
        return (
          <div
            key={v}
            style={{ position: 'relative', width: 540, height: 960, overflow: 'hidden' }}
          >
            {cell.grid ? (
              <GraphPaper fill={bg.fill} line={bg.dots} spacing={40} />
            ) : (
              <AbsoluteFill style={{ backgroundColor: bg.fill }} />
            )}
            <div
              style={{
                position: 'absolute',
                top: 60,
                left: 40,
                color: bg.text,
                ...fonts.mono,
                fontSize: 30,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {cell.label}
            </div>
            <div
              style={{
                position: 'absolute',
                left: 270 - 130,
                top: 200 + CHAR_W * 1.5 * (566 / 600) - 14,
                width: 260,
                height: 28,
                borderRadius: '50%',
                backgroundColor: 'oklch(0% 0 0 / 0.12)',
              }}
            />
            <InvoiceRoll
              variant={v}
              width={CHAR_W}
              cues={CUES}
              talk={TALK}
              gaze={gaze}
              seed={`invoice-roll-${v}`}
              pen={bg.pen}
              style={{ position: 'absolute', left: 270 - CHAR_W / 2, top: 200 }}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
