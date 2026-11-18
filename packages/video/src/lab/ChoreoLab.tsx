import { cutoutPalette } from '@reelkit/brand';
import type { Eyes, MascotPlan, PropKind, ReelTimeline, TimelineBeat } from '@reelkit/schema';
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

// ------------------------------------------------------------------------- choreography lab

/**
 * `ChoreoLab`: a silent 27 s reel that runs every authored gag, the three mascot-triggered
 * transitions, the alternative `reading` scene and the automatic behaviors, from a plan written
 * by hand here (the pipeline planner writes the same shape for real posts).
 *   pnpm render:choreo  ->  packages/video/out/lab/choreo.mp4 (half size)
 */
const LAB_BEATS: Array<[id: string, palette: string, text: string, highlight: string]> = [
  ['b01', 'blu', 'Hide behind the frond', 'frond'],
  ['b02', 'blu', 'Stamp the key word', 'stamp'],
  ['b03', 'ghiaccio', 'Scissors cut, then type', 'type'],
  ['b04', 'notte', 'Blow the bloom, send the letter', 'send'],
  ['b05', 'lavanda', 'Pull the sheet, inspect it', 'inspect'],
  ['b06', 'lavanda', 'Point at the headline', 'point'],
  ['b07', 'azzurro', 'Water the frond', 'water'],
  ['b08', 'viola', 'Alternative scene: reading', 'reading'],
  ['b09', 'viola', 'Hop, react, tap the foot', 'react'],
];
const BEAT_MS = 3000;

const labBeats: TimelineBeat[] = LAB_BEATS.map(([id, palette, text, highlight], i) => {
  const words = text.split(' ');
  const start = i * BEAT_MS + 200;
  const step = 2000 / words.length;
  return {
    id,
    palette,
    highlight,
    startMs: start,
    endMs: (i + 1) * BEAT_MS + 200,
    units: words.map((w, k) => ({
      text: w,
      startMs: Math.round(start + k * step),
      endMs: Math.round(start + (k + 1) * step),
    })),
  };
});

const labPlan: MascotPlan = {
  postId: '2026-11-18-choreo-lab',
  stretch: [],
  moves: [
    { atMs: 0, durationMs: 0, x: 540, gait: 'stand', depth: 'front' },
    { atMs: 400, durationMs: 1460, x: 130, gait: 'walk', depth: 'behind' },
    { atMs: 3200, durationMs: 900, x: 380, gait: 'walk', depth: 'front' },
    { atMs: 11533, durationMs: 1067, x: 1380, gait: 'walk', depth: 'front' },
    { atMs: 12600, durationMs: 1077, x: 820, gait: 'walk', depth: 'front' },
    { atMs: 18200, durationMs: 1800, x: 310, gait: 'walk', depth: 'front' },
    { atMs: 21200, durationMs: 300, x: 380, gait: 'walk', depth: 'front' },
    { atMs: 24200, durationMs: 500, x: 380, gait: 'hop', depth: 'front' },
  ],
  cues: [
    { atMs: 0, pose: 'neutral', eyes: 'open', lean: 0 },
    { atMs: 1860, pose: 'hide', eyes: 'wide', lean: -6 },
    { atMs: 3200, pose: 'neutral', eyes: 'open', lean: 0 },
    { atMs: 3900, pose: 'stamp', eyes: 'wide', lean: 0 },
    { atMs: 4300, pose: 'hold', eyes: 'closed', lean: 0 },
    { atMs: 5333, pose: 'hold', eyes: 'wide', lean: 0 },
    { atMs: 6200, pose: 'type', eyes: 'half', lean: 2 },
    { atMs: 8467, pose: 'neutral', eyes: 'closed', lean: -3 },
    { atMs: 9200, pose: 'hold', eyes: 'open', lean: 0 },
    { atMs: 10700, pose: 'arms-up', eyes: 'happy', lean: 0 },
    { atMs: 11133, pose: 'pull', eyes: 'wide', lean: 8 },
    { atMs: 13700, pose: 'hold', eyes: 'wide', lean: -2 },
    { atMs: 15500, pose: 'point', eyes: 'open', lean: 3 },
    { atMs: 18200, pose: 'walk', eyes: 'open', lean: 0 },
    { atMs: 20000, pose: 'lean', eyes: 'happy', lean: -6 },
    { atMs: 24200, pose: 'neutral', eyes: 'open', lean: 0 },
    { atMs: 25200, pose: 'neutral', eyes: 'happy', lean: 0 },
    { atMs: 25800, pose: 'neutral', eyes: 'open', lean: 4 },
  ],
  gaze: [
    { atMs: 0, target: 'camera' },
    { atMs: 3200, target: 'headline' },
    { atMs: 3800, target: 'camera' },
    { atMs: 13700, target: 'headline' },
    { atMs: 15500, target: 'headline' },
    { atMs: 16500, target: 'camera' },
    { atMs: 25200, target: 'label' },
    { atMs: 25800, target: 'camera' },
  ],
  props: [
    { fromMs: 3200, toMs: 5300, hand: 'right', prop: 'stamp' },
    { fromMs: 5333, toMs: 6600, hand: 'right', prop: 'scissors' },
    { fromMs: 6600, toMs: 9000, hand: 'right', prop: 'calculator' },
    { fromMs: 9200, toMs: 10700, hand: 'right', prop: 'letter' },
    { fromMs: 13700, toMs: 15200, hand: 'right', prop: 'magnifier' },
    { fromMs: 18200, toMs: 21200, hand: 'right', prop: 'wateringCan' },
  ],
  gags: [
    { fromMs: 1860, toMs: 3000, kind: 'hide', source: 'script', beat: 'b01', target: 'blu-frond' },
    { fromMs: 4300, toMs: 4700, kind: 'stamp', source: 'script', beat: 'b02', target: 'stamp' },
    { fromMs: 5333, toMs: 7000, kind: 'scissors', source: 'script', beat: 'b03' },
    { fromMs: 6700, toMs: 9000, kind: 'type', source: 'script', beat: 'b03', target: 'calculator' },
    { fromMs: 8467, toMs: 9400, kind: 'puff', source: 'auto', beat: 'b04' },
    { fromMs: 10700, toMs: 11400, kind: 'send', source: 'script', beat: 'b04', target: 'envelope' },
    {
      fromMs: 20000,
      toMs: 21000,
      kind: 'water',
      source: 'script',
      beat: 'b07',
      target: 'azzurro-frond',
    },
    { fromMs: 25800, toMs: 26600, kind: 'tap', source: 'auto', beat: 'b09' },
  ],
  transitions: [
    { beat: 'b03', kind: 'cut', trigger: 'scissors' },
    { beat: 'b04', kind: 'bloom', trigger: 'blow' },
    { beat: 'b05', kind: 'pull', trigger: 'pull' },
    { beat: 'b07', kind: 'cut' },
    { beat: 'b08', kind: 'bloom' },
  ],
  alternate: { beat: 'b08', scene: 'reading' },
};

export const choreoLabProps: ReelTimeline = {
  postId: '2026-11-18-choreo-lab',
  kicker: 'Choreography lab',
  audio: '',
  durationMs: LAB_BEATS.length * BEAT_MS + 400,
  beats: labBeats,
  speech: labBeats.map((b) => ({ startMs: b.startMs, endMs: b.startMs + 2000 })),
  mascot: labPlan,
};
