import { cutoutPalette, formats, type CutoutPalette, type CutoutPaletteKey } from '@reelkit/brand';
import { holdsHighlight, type ReelTimeline, type TimelineBeat } from '@reelkit/schema';
import { Audio } from '@remotion/media';
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { fontsOf } from '../brand/fonts';
import { RevealText, type RevealWord } from '../components/RevealText';
import { PaletteBackdrop } from '../lab/cutouts/PaletteBoard';
import { CutoutStickerFilter } from '../lab/cutouts/paper';
import { DEFAULT_TYPE } from '../lab/cutouts/scenes';
import { PaperIn, TRANSITION_FRAMES, type TransitionKind } from '../lab/cutouts/transitions';
import { InvoiceRoll } from '../mascot/InvoiceRoll';
import { poses, type PoseName } from '../mascot/poses';

/**
 * A reel from its resolved timeline (`pnpm pipeline render <post>`), cut-paper direction
 * (D-020 to D-028): consecutive beats on the same palette share one paper scene; a palette
 * change is a paper transition, bloom and cut alternated, started a few frames before the
 * first word of the new scene. The headline of each beat appears word by word as the voice
 * says it, the key word on a paper label. The mascot stays on top and speaks only while
 * the voice does.
 */
export type ReelProps = ReelTimeline;

export const reelDefaults: ReelProps = {
  postId: '2026-01-01-empty',
  kicker: '',
  audio: '',
  durationMs: 1000,
  beats: [],
  speech: [],
};

const FPS = formats.reel.fps;
const toFrame = (ms: number) => Math.round((ms / 1000) * FPS);
/** Frames a transition starts before the first word of the incoming scene. */
const LEAD: Record<TransitionKind, number> = { bloom: 10, cut: 14, collage: 10, star: 10 };

export const reelDuration = (p: ReelProps) => toFrame(p.durationMs) + 12;

const palette = (key: string): CutoutPalette => cutoutPalette(key as CutoutPaletteKey);

interface Scene {
  p: CutoutPalette;
  beats: TimelineBeat[];
  /** First frame of the scene sequence (transition start). */
  from: number;
  kind?: TransitionKind;
}

function scenesOf(beats: TimelineBeat[]): Scene[] {
  const scenes: Scene[] = [];
  for (const b of beats) {
    const last = scenes.at(-1);
    if (last && last.p.key === b.palette) last.beats.push(b);
    else {
      const kind: TransitionKind | undefined =
        scenes.length === 0 ? undefined : scenes.length % 2 === 1 ? 'bloom' : 'cut';
      const from = kind ? Math.max(0, toFrame(b.startMs) - LEAD[kind]) : 0;
      scenes.push({ p: palette(b.palette), beats: [b], from, kind });
    }
  }
  return scenes;
}

const mono = fontsOf('brand').mono;

const Headline: React.FC<{ beat: TimelineBeat; p: CutoutPalette; from: number }> = ({
  beat,
  p,
  from,
}) => {
  const words: RevealWord[] = beat.units.map((u) => ({
    text: u.text,
    at: toFrame(u.startMs) - from,
    highlight:
      beat.highlight && holdsHighlight(u.text, beat.highlight)
        ? { kind: p.highlight.kind, color: p.highlight.color, textColor: p.highlight.text }
        : undefined,
  }));
  return (
    <RevealText
      words={words}
      font={DEFAULT_TYPE.font}
      fontSize={DEFAULT_TYPE.size}
      tracking={DEFAULT_TYPE.tracking}
      color={p.text}
      style={{ top: 480, left: 96, right: 150 }}
    />
  );
};

export const Reel: React.FC<ReelProps> = (props) => {
  const { audio, beats, speech, kicker, postId } = props;
  const frame = useCurrentFrame();
  const total = reelDuration(props);
  const scenes = scenesOf(beats);
  // Palette of the scene being spoken now (switches at the first word of a scene).
  const current =
    [...scenes].reverse().find((s) => frame >= toFrame(s.beats[0]!.startMs) - 2) ?? scenes[0];
  const cp = current?.p ?? palette('blu');

  // Every headline lasts until the next beat starts, or until the next scene's transition.
  const headlines = beats.map((b, i) => {
    const next = beats[i + 1];
    const nextScene = scenes.find((s) => s.beats[0] === next);
    const from = toFrame(b.startMs) - 3;
    const to = next ? (nextScene ? nextScene.from : toFrame(next.startMs) - 3) : total;
    const p = palette(b.palette);
    return { b, p, from, duration: Math.max(1, to - from) };
  });

  // Every beat sets the pose; a beat without one goes back to idle (guidelines/generation.md).
  const cues = [
    { at: 0, pose: 'neutral' as PoseName },
    ...beats.map((b) => ({
      at: toFrame(b.startMs),
      pose: (b.pose && b.pose in poses ? b.pose : 'neutral') as PoseName,
    })),
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: cp.bg }}>
      {audio && <Audio src={staticFile(audio)} />}
      {scenes.map((s, i) => {
        const next = scenes[i + 1];
        const until = next ? next.from + TRANSITION_FRAMES[next.kind ?? 'bloom'] : total;
        const prev = scenes[i - 1];
        return (
          <Sequence key={i} from={s.from} durationInFrames={Math.max(1, until - s.from)}>
            <PaperIn
              to={s.p}
              from={prev?.p}
              kind={s.kind}
              scene={<PaletteBackdrop p={s.p} idSuffix={`r${i}`} />}
              prevScene={(sfx) =>
                prev ? <PaletteBackdrop p={prev.p} idSuffix={`r${i - 1}${sfx}`} /> : null
              }
              prevOffset={prev ? s.from - prev.from : 0}
            />
          </Sequence>
        );
      })}
      {headlines.map(({ b, p, from, duration }) => (
        <Sequence key={b.id} from={from} durationInFrames={duration}>
          <Headline beat={b} p={p} from={from} />
        </Sequence>
      ))}
      {kicker && (
        <div
          style={{
            position: 'absolute',
            // Under the office object, right above the headline.
            top: 418,
            left: 96,
            ...mono,
            fontSize: 30,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: cp.text,
            opacity: 0.85,
          }}
        >
          {kicker}
        </div>
      )}
      <InvoiceRoll
        width={420}
        cues={cues}
        talk={speech.map((s) => ({ from: toFrame(s.startMs), to: toFrame(s.endMs) }))}
        gaze={{ x: 0, y: -0.5 }}
        seed={postId}
        pen={cp.pen}
        look={{ limbWidth: 12, roll: cp.roll, accent: cp.pill, rule: 'oklch(85% 0.04 264)' }}
        defs={<CutoutStickerFilter id="reelMascot" frame={frame} />}
        filter="url(#reelMascot)"
        style={{ position: 'absolute', left: 330, top: 1040 }}
      />
    </AbsoluteFill>
  );
};
