import { backgrounds, typeScale, type FontSetName } from '@reelkit/brand';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { fontsOf } from '../brand/fonts';
import {
  activeBackground,
  BackgroundTrack,
  type BackgroundSegment,
} from '../components/BackgroundTrack';
import { ChapterBar } from '../components/ChapterBar';
import { KineticWord } from '../components/KineticWord';
import { LightCone } from '../components/LightCone';
import { Logo } from '../components/Logo';
import { Mascot } from '../mascot/Mascot';
import type { PoseCue } from '../mascot/poses';

/**
 * Phase 0 acceptance render: 5 s with background changes, one-word kinetic text, a highlight
 * sticker, the provisional mascot in idle and the logo. Timings are in frames because there is
 * no voice yet; from phase 1 every timing comes from words.json.
 */
export const DEMO_DURATION = 150;

export type DemoProps = {
  fontSet: FontSetName;
  seed: string;
};

export const demoDefaultProps: DemoProps = { fontSet: 'brand', seed: 'demo' };

const SEGMENTS: BackgroundSegment[] = [
  { from: 0, bg: 'blue' },
  { from: 44, bg: 'ink' },
  { from: 104, bg: 'paper' },
];

const CHAPTERS = [
  { from: 0, label: '01 / 03 · LA DOMANDA' },
  { from: 44, label: '02 / 03 · LA RISPOSTA' },
  { from: 104, label: '03 / 03 · CHI SIAMO' },
];

const WORDS: Array<{ text: string; at: number; until: number; highlight?: boolean }> = [
  { text: 'Autofatture', at: 4, until: 22 },
  { text: 'estere?', at: 22, until: 44 },
  { text: 'Ci', at: 48, until: 58 },
  { text: 'pensa', at: 58, until: 70 },
  { text: 'Refattura', at: 70, until: 104, highlight: true },
];

const CUES: PoseCue[] = [
  { at: 0, pose: 'neutral' },
  { at: 70, pose: 'arms-up', mouth: 'open', browsUp: true },
  { at: 104, pose: 'neutral' },
];

const TEXT_Y = 590;
const MASCOT_WIDTH = 480;
const MASCOT_TOP = 880;

export const Demo: React.FC<DemoProps> = ({ fontSet, seed }) => {
  const frame = useCurrentFrame();
  const fonts = fontsOf(fontSet);
  const bg = backgrounds[activeBackground(SEGMENTS, frame)];

  let chapterIndex = 0;
  CHAPTERS.forEach((c, i) => {
    if (c.from <= frame) chapterIndex = i;
  });
  const chapter = CHAPTERS[chapterIndex]!;
  const chapterEnd = CHAPTERS[chapterIndex + 1]?.from ?? DEMO_DURATION;
  const chapterProgress = (frame - chapter.from) / (chapterEnd - chapter.from);

  // Eyes follow the text while it is on screen, then look at the camera.
  const gaze = frame < 104 ? { x: 0, y: -0.7 } : { x: 0, y: -0.2 };
  const mascotHeight = MASCOT_WIDTH * 1.5;

  return (
    <AbsoluteFill>
      <BackgroundTrack segments={SEGMENTS} />
      <ChapterBar
        total={CHAPTERS.length}
        current={chapterIndex + 1}
        progress={chapterProgress}
        label={chapter.label}
        color={bg.text}
        fillColor={bg.highlightFill}
        font={fonts.mono}
      />
      {WORDS.map((w) => (
        <KineticWord
          key={w.at}
          text={w.text}
          at={w.at}
          until={w.until}
          font={fonts.display}
          fontSize={typeScale.hero}
          color={bg.text}
          highlight={
            w.highlight ? { fill: bg.highlightFill, textColor: bg.highlightText } : undefined
          }
          y={TEXT_Y}
        />
      ))}
      <Logo at={110} width={720} y={TEXT_Y - 90} />
      {frame >= 122 && (
        <div
          style={{
            position: 'absolute',
            top: TEXT_Y + 80,
            left: 0,
            right: 0,
            textAlign: 'center',
            ...fonts.hand,
            fontSize: typeScale.kicker,
            color: bg.text,
            transform: 'rotate(-2deg)',
          }}
        >
          autofatture, senza pensieri
        </div>
      )}
      <LightCone
        color={bg.cone}
        x={540}
        floorY={MASCOT_TOP + mascotHeight * (565 / 600)}
        width={MASCOT_WIDTH * 0.95}
      />
      <Mascot
        width={MASCOT_WIDTH}
        cues={CUES}
        gaze={gaze}
        seed={seed}
        pen={bg.pen}
        style={{ position: 'absolute', left: (1080 - MASCOT_WIDTH) / 2, top: MASCOT_TOP }}
      />
    </AbsoluteFill>
  );
};
