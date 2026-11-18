import type { CutoutPalette } from '@reelkit/brand';
import type { MascotPlan } from '@reelkit/schema';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { mascotAt, poseCues } from '../../mascot/choreo';
import { InvoiceRoll, type TalkSpan } from '../../mascot/InvoiceRoll';
import { HandProp } from '../../mascot/props';
import { CutoutStickerFilter } from '../../lab/cutouts/paper';

/**
 * The mascot of a reel, following its plan (D-032). Drawn twice by the Reel, once under the
 * front motifs and once above them: each copy shows only when the mascot's depth matches.
 */
export const MASCOT_WIDTH = 420;
export const FEET_LINE = 1634;
const SCALE = MASCOT_WIDTH / 400;
const TOP = FEET_LINE - 566 * SCALE;

export const MascotLayer: React.FC<{
  plan: MascotPlan;
  talk: TalkSpan[];
  p: CutoutPalette;
  seed: string;
  depth: 'front' | 'behind';
}> = ({ plan, talk, p, seed, depth }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = mascotAt(plan, frame, fps);
  if (s.depth !== depth) return null;
  const ms = (frame / fps) * 1000;
  const send = plan.gags.find((g) => g.kind === 'send' && g.fromMs <= ms && ms < g.fromMs + 700);
  const id = `reelMascot${depth}`;
  return (
    <>
      <InvoiceRoll
        width={MASCOT_WIDTH}
        cues={poseCues(plan, fps)}
        talk={talk}
        gaze={s.gaze}
        seed={seed}
        pen={p.pen}
        palette={p}
        eyes={s.eyes}
        lean={s.lean}
        legs={s.legs}
        squash={s.squash}
        swing={s.swing}
        hold={s.hold}
        look={{ limbWidth: 12, roll: p.roll, accent: p.pill, rule: 'oklch(85% 0.04 264)' }}
        defs={<CutoutStickerFilter id={id} frame={frame} />}
        filter={`url(#${id})`}
        style={{ position: 'absolute', left: s.x - 200 * SCALE, top: TOP }}
      />
      {send && <FlyingLetter p={p} t={(ms - send.fromMs) / 700} x={s.x} frame={frame} />}
    </>
  );
};

/** The letter of a `send` gag leaves the hand and flies off to the top right, turning. */
const FlyingLetter: React.FC<{ p: CutoutPalette; t: number; x: number; frame: number }> = ({
  p,
  t,
  x,
  frame,
}) => {
  const k = Math.floor(t * 12) / 12;
  // Off to the right, low: it never crosses the headline (D-032 checks).
  const px = x + 150 + 700 * k;
  const py = 1300 - 260 * k * (1.4 - 0.4 * k);
  return (
    <svg
      width={1080}
      height={1920}
      style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
    >
      <defs>
        <CutoutStickerFilter id="flyingLetter" frame={frame} />
      </defs>
      <g
        filter="url(#flyingLetter)"
        transform={`translate(${px} ${py}) rotate(${-25 + 70 * k}) scale(${1.4 - 0.5 * k})`}
      >
        <HandProp kind="letter" p={p} frame={frame} />
      </g>
    </svg>
  );
};
