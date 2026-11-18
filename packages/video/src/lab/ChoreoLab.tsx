import { cutoutPalette } from '@reelkit/brand';
import type { Eyes, PropKind } from '@reelkit/schema';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { fontsOf } from '../brand/fonts';
import { crouchLegs, hopAt, walkCycle, type LegPose } from '../mascot/gait';
import { InvoiceRoll } from '../mascot/InvoiceRoll';
import { poses, type PoseName } from '../mascot/poses';
import { CutoutStickerFilter } from './cutouts/paper';

/**
 * Mascot choreography lab (D-032). `MascotPoseSheet`: every pose, the eye shapes and the body
 * lean, the held props, a walk cycle strip and a hop strip, to check the rig at a glance.
 *   pnpm exec remotion still MascotPoseSheet out/lab/mascot-poses.png --scale=0.5
 */
const p = cutoutPalette('ghiaccio');
const mono = fontsOf('brand').mono;
const CELL_W = 260;
const CELL_H = 400;
const COLS = 8;

interface Cell {
  label: string;
  pose?: PoseName;
  eyes?: Eyes;
  lean?: number;
  legs?: LegPose;
  squash?: number;
  hold?: { left?: PropKind; right?: PropKind };
}

const PROPS: PropKind[] = [
  'scissors',
  'stamp',
  'calculator',
  'magnifier',
  'letter',
  'wateringCan',
  'sheet',
];
const EYES: Eyes[] = ['open', 'happy', 'wide', 'closed', 'half'];

const CELLS: Cell[] = [
  ...(Object.keys(poses) as PoseName[]).map((pose) => ({ label: pose, pose })),
  ...EYES.map((eyes) => ({ label: `eyes ${eyes}`, eyes })),
  { label: 'lean -10', lean: -10 },
  { label: 'lean +10', lean: 10 },
  { label: 'crouch', legs: crouchLegs(1), pose: 'hide' as PoseName },
  ...PROPS.map((prop) => ({
    label: `hold ${prop}`,
    pose: 'hold' as PoseName,
    hold: { right: prop },
  })),
  ...Array.from({ length: 8 }, (_, i) => ({
    label: `walk ${i}/8`,
    pose: 'walk' as PoseName,
    legs: walkCycle(i / 8),
    lean: 4,
  })),
  ...[0.08, 0.3, 0.5, 0.7, 0.92].map((t) => {
    const h = hopAt(t);
    return {
      label: `hop ${t}`,
      legs: { ...crouchLegs(h.squash > 0 ? 0.6 : 0), lift: h.lift },
      squash: h.squash,
    };
  }),
];

export const MASCOT_POSE_SHEET = {
  width: COLS * CELL_W,
  height: Math.ceil(CELLS.length / COLS) * CELL_H,
} as const;

export const MascotPoseSheet: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: p.bg, flexDirection: 'row', flexWrap: 'wrap' }}>
      {CELLS.map((c, i) => (
        <div key={i} style={{ width: CELL_W, height: CELL_H, position: 'relative' }}>
          <InvoiceRoll
            width={190}
            cues={[{ at: 0, pose: c.pose ?? 'neutral' }]}
            seed={`sheet${i}`}
            pen={p.pen}
            palette={p}
            eyes={c.eyes}
            lean={c.lean}
            legs={c.legs}
            squash={c.squash}
            hold={c.hold}
            look={{ limbWidth: 12, roll: p.roll, accent: p.pill, rule: 'oklch(85% 0.04 264)' }}
            defs={<CutoutStickerFilter id={`ps${i}`} frame={frame} />}
            filter={`url(#ps${i})`}
            style={{ position: 'absolute', left: 35, top: 70 }}
          />
          <div
            style={{
              position: 'absolute',
              left: 10,
              top: 10,
              ...mono,
              fontSize: 18,
              color: p.text,
            }}
          >
            {c.label}
          </div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
