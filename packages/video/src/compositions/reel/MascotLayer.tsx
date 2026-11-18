import type { CutoutPalette } from '@reelkit/brand';
import type { AltScene, MascotPlan } from '@reelkit/schema';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { mascotAt, poseCues } from '../../mascot/choreo';
import { InvoiceRoll, type TalkSpan } from '../../mascot/InvoiceRoll';
import { HandProp } from '../../mascot/props';
import { ALT_SCENES } from '../../mascot/scenes/registry';
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
  /** Alternative scene replacing the mascot between two frames (D-032). */
  alt?: { scene: AltScene; from: number; to: number };
}> = ({ plan, talk, p, seed, depth, alt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = mascotAt(plan, frame, fps);
  if (s.depth !== depth) return null;
  const ms = (frame / fps) * 1000;
  const send = plan.gags.find((g) => g.kind === 'send' && g.fromMs <= ms && ms < g.fromMs + 700);
  const puff = plan.gags.some((g) => g.kind === 'puff' && g.fromMs <= ms && ms < g.toMs);
  const id = `reelMascot${depth}`;
  // Paper flip between the mascot and the alternative scene: a horizontal squash to nothing
  // and back, never a mirror.
  const FLIP = 4;
  let standard = 1;
  let scene = 0;
  if (alt) {
    if (frame >= alt.from - FLIP && frame < alt.from) standard = (alt.from - frame) / FLIP;
    else if (frame >= alt.from && frame < alt.to) {
      standard = 0;
      scene = Math.min(1, (frame - alt.from) / FLIP, (alt.to - frame) / FLIP);
    } else if (frame >= alt.to && frame < alt.to + FLIP) standard = (frame - alt.to) / FLIP;
  }
  const flip = (k: number): React.CSSProperties => ({
    position: 'absolute',
    inset: 0,
    transform: `scaleX(${Math.max(0.001, k).toFixed(3)})`,
    transformOrigin: `${s.x}px 0px`,
  });
  const Alt = alt ? ALT_SCENES[alt.scene] : undefined;
  return (
    <>
      {Alt && scene > 0 && (
        <div style={flip(scene)}>
          <div style={{ position: 'absolute', left: s.x - 200 * SCALE, top: TOP }}>
            <Alt
              p={p}
              talk={talk}
              seed={seed}
              width={MASCOT_WIDTH}
              durationInFrames={alt!.to - alt!.from}
            />
          </div>
        </div>
      )}
      {standard > 0 && (
        <div style={flip(standard)}>
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
            swing={s.swing}
            hold={s.hold}
            restMouth={puff ? 'o' : undefined}
            squash={puff ? -0.04 : s.squash}
            look={{ limbWidth: 12, roll: p.roll, accent: p.pill, rule: 'oklch(85% 0.04 264)' }}
            defs={<CutoutStickerFilter id={id} frame={frame} />}
            filter={`url(#${id})`}
            style={{ position: 'absolute', left: s.x - 200 * SCALE, top: TOP }}
          />
        </div>
      )}
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
