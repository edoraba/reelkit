import { illustration, refattura } from '@reelkit/brand';
import { useId } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { idleAt } from './idle';
import { poseAt, type MouthShape, type PoseCue } from './poses';
import { ARM, EYE, pivots, RIG_VIEWBOX } from './rig';

/**
 * PROVISIONAL mascot: an invoice sheet with a face. Arms and legs are pen doodles drawn in
 * the ink of the background (`pen`), as if someone sketched them on the document.
 * The final character comes from the human; it must keep the layer ids of rig.ts.
 */

const OUT = illustration.outline;
const LINE = 9;
const PEN_WIDTH = 11;
const SHEET = refattura.sheetWhite;
const SHEET_SHADE = refattura.sheetGrey;

export interface MascotProps {
  /** Rendered width in px; height follows the 2:3 viewBox. */
  width: number;
  /** Pose and mouth changes on frames. First cue should be at 0. */
  cues: PoseCue[];
  /** Where the eyes look, -1..1 on both axes (0,0 = camera). */
  gaze?: { x: number; y: number };
  /** Seed for idle and blink timing: use the post id. */
  seed: string;
  /** Ink of arms, hands, legs and feet: use the `pen` color of the background. */
  pen?: string;
  style?: React.CSSProperties;
}

const Stroke: React.FC<{ x1: number; y1: number; x2: number; y2: number; pen: string }> = ({
  pen,
  ...p
}) => <line {...p} stroke={pen} strokeWidth={PEN_WIDTH} strokeLinecap="round" />;

const Arm: React.FC<{ side: 'l' | 'r'; upper: number; lower: number; pen: string }> = ({
  side,
  upper,
  lower,
  pen,
}) => {
  const pivot = side === 'l' ? pivots['arm-l-upper'] : pivots['arm-r-upper'];
  const s = side === 'l' ? 1 : -1;
  return (
    <g id={`arm-${side}-upper`} transform={`translate(${pivot.x} ${pivot.y}) rotate(${upper})`}>
      <Stroke x1={0} y1={0} x2={0} y2={ARM.upper} pen={pen} />
      <g id={`arm-${side}-lower`} transform={`translate(0 ${ARM.upper}) rotate(${lower})`}>
        <Stroke x1={0} y1={0} x2={0} y2={ARM.lower} pen={pen} />
        <g id={`hand-${side}`} transform={`translate(0 ${ARM.lower})`}>
          {/* Doodled hand: a small loop and a thumb stroke. */}
          <circle cy={8} r={10} fill="none" stroke={pen} strokeWidth={PEN_WIDTH - 2} />
          <line
            x1={s * 7}
            y1={2}
            x2={s * 17}
            y2={-6}
            stroke={pen}
            strokeWidth={PEN_WIDTH - 2}
            strokeLinecap="round"
          />
        </g>
      </g>
    </g>
  );
};

const Leg: React.FC<{ side: 'l' | 'r'; pen: string }> = ({ side, pen }) => {
  const s = side === 'l' ? -1 : 1;
  const hipX = 200 + s * 36;
  const footX = 200 + s * 40;
  return (
    <g id={`leg-${side}`}>
      <Stroke x1={hipX} y1={470} x2={footX} y2={556} pen={pen} />
      {/* Foot: one short stroke pointing outward. */}
      <Stroke x1={footX} y1={562} x2={footX + s * 30} y2={562} pen={pen} />
    </g>
  );
};

const Eye: React.FC<{
  side: 'l' | 'r';
  gaze: { x: number; y: number };
  blink: number;
  clipId: string;
}> = ({ side, gaze, blink, clipId }) => {
  const c = side === 'l' ? pivots.eyeL : pivots.eyeR;
  const px = c.x + gaze.x * EYE.gazeRange;
  const py = c.y + gaze.y * EYE.gazeRange;
  const lidHeight = (EYE.ry * 2 + 8) * blink;
  const lidTop = c.y - EYE.ry - 4;
  return (
    <g id={`eye-${side}`}>
      <clipPath id={clipId}>
        <ellipse cx={c.x} cy={c.y} rx={EYE.rx} ry={EYE.ry} />
      </clipPath>
      <ellipse cx={c.x} cy={c.y} rx={EYE.rx} ry={EYE.ry} fill={SHEET} />
      <g clipPath={`url(#${clipId})`}>
        <g id={`pupil-${side}`}>
          <circle cx={px} cy={py} r={EYE.pupil} fill={OUT} />
          <circle cx={px - 4} cy={py - 5} r={4.5} fill={SHEET} />
        </g>
        <g id={`lid-${side}`}>
          <rect
            x={c.x - EYE.rx - 4}
            y={lidTop}
            width={EYE.rx * 2 + 8}
            height={lidHeight}
            fill={SHEET_SHADE}
          />
          {blink > 0.05 && (
            <line
              x1={c.x - EYE.rx - 4}
              x2={c.x + EYE.rx + 4}
              y1={lidTop + lidHeight}
              y2={lidTop + lidHeight}
              stroke={OUT}
              strokeWidth={7}
            />
          )}
        </g>
      </g>
      <ellipse cx={c.x} cy={c.y} rx={EYE.rx} ry={EYE.ry} fill="none" stroke={OUT} strokeWidth={8} />
    </g>
  );
};

const Mouth: React.FC<{ shape: MouthShape }> = ({ shape }) => {
  const { x, y } = pivots.mouth;
  if (shape === 'open') {
    return (
      <g id="mouth">
        <path
          d={`M ${x - 27} ${y - 10} Q ${x} ${y - 6} ${x + 27} ${y - 10} Q ${x + 24} ${y + 30} ${x} ${y + 31} Q ${x - 24} ${y + 30} ${x - 27} ${y - 10} Z`}
          fill={OUT}
          stroke={OUT}
          strokeWidth={6}
          strokeLinejoin="round"
        />
        <ellipse cx={x} cy={y + 20} rx={13} ry={7} fill={refattura.stampRed} />
      </g>
    );
  }
  return (
    <g id="mouth">
      <path
        d={`M ${x - 24} ${y - 6} Q ${x} ${y + 16} ${x + 24} ${y - 6}`}
        fill="none"
        stroke={OUT}
        strokeWidth={8}
        strokeLinecap="round"
      />
    </g>
  );
};

export const Mascot: React.FC<MascotProps> = ({
  width,
  cues,
  gaze = { x: 0, y: 0 },
  seed,
  pen = refattura.inkBlue,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const idle = idleAt(frame, fps, seed);
  const { pose, cue } = poseAt(cues, frame, fps);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const browLift = cue.browsUp ? -10 : 0;
  const swingL = idle.armSwing;
  const swingR = -idle.armSwing;
  const { x: mx, y: my } = pivots.mascot;
  const { x: bx, y: by } = pivots.body;

  return (
    <svg
      viewBox={`0 0 ${RIG_VIEWBOX.width} ${RIG_VIEWBOX.height}`}
      width={width}
      height={(width * RIG_VIEWBOX.height) / RIG_VIEWBOX.width}
      style={{ overflow: 'visible', ...style }}
    >
      <g id="mascot" transform={`rotate(${idle.sway} ${mx} ${my})`}>
        <Leg side="l" pen={pen} />
        <Leg side="r" pen={pen} />
        <g
          id="body"
          transform={`translate(0 ${idle.bob}) translate(${bx} ${by}) scale(1 ${idle.breath}) translate(${-bx} ${-by})`}
        >
          <Arm side="l" upper={pose.armL[0] + swingL} lower={pose.armL[1]} pen={pen} />
          <Arm side="r" upper={pose.armR[0] + swingR} lower={pose.armR[1]} pen={pen} />
          <g id="sheet" strokeLinejoin="round">
            <path
              d="M 109 60 H 255 L 315 120 V 448 Q 315 472 291 472 H 109 Q 85 472 85 448 V 84 Q 85 60 109 60 Z"
              fill={SHEET}
              stroke={OUT}
              strokeWidth={LINE}
            />
            <path
              d="M 255 60 V 104 Q 255 120 271 120 H 315 Z"
              fill={SHEET_SHADE}
              stroke={OUT}
              strokeWidth={LINE}
            />
            <rect x={114} y={92} width={86} height={16} rx={8} fill={refattura.inkBlue} />
            <g stroke={refattura.fieldRule} strokeWidth={10} strokeLinecap="round">
              <line x1={122} y1={350} x2={278} y2={350} />
              <line x1={122} y1={378} x2={278} y2={378} />
              <line x1={122} y1={406} x2={196} y2={406} />
            </g>
            <rect x={218} y={394} width={62} height={26} rx={9} fill={refattura.inkBlue} />
          </g>
          <g id="head">
            <Eye side="l" gaze={gaze} blink={idle.blink} clipId={`${uid}l`} />
            <Eye side="r" gaze={gaze} blink={idle.blink} clipId={`${uid}r`} />
            <g stroke={OUT} strokeWidth={9} strokeLinecap="round" fill="none">
              <path
                id="brow-l"
                d={`M 136 ${164 + browLift} Q 160 ${152 + browLift} 186 ${160 + browLift}`}
              />
              <path
                id="brow-r"
                d={`M 214 ${160 + browLift} Q 240 ${152 + browLift} 264 ${164 + browLift}`}
              />
            </g>
            <Mouth shape={cue.mouth ?? 'smile'} />
          </g>
        </g>
      </g>
    </svg>
  );
};
