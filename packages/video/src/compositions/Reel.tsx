import {
  cutoutPalette,
  formats,
  sceneLayouts,
  transitionTiming,
  type CutoutPalette,
  type CutoutPaletteKey,
  type Interaction,
} from '@reelkit/brand';
import {
  holdsHighlight,
  type MascotPlan,
  type ReelTimeline,
  type TimelineBeat,
} from '@reelkit/schema';
import { Audio } from '@remotion/media';
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { fontsOf } from '../brand/fonts';
import { RevealText, type RevealWord } from '../components/RevealText';
import { PaletteBackdrop, type MotifReaction } from '../lab/cutouts/PaletteBoard';
import { CutoutStickerFilter } from '../lab/cutouts/paper';
import { DEFAULT_TYPE } from '../lab/cutouts/scenes';
import { PaperIn, type TransitionKind } from '../lab/cutouts/transitions';
import { InvoiceRoll } from '../mascot/InvoiceRoll';
import { poses, type PoseName } from '../mascot/poses';
import { MascotLayer } from './reel/MascotLayer';

/**
 * A reel from its resolved timeline (`pnpm pipeline render <post>`), cut-paper direction
 * (D-020 to D-028): consecutive beats on the same palette share one paper scene; a palette
 * change is a paper transition started a few frames before the first word of the new scene.
 * The headline of each beat appears word by word as the voice says it, the key word on a
 * paper label. With a mascot plan (D-032) the scenes are drawn in two passes, back and front
 * motifs, and the mascot walks the lane between or above them, following the plan; without
 * one it stands in the middle and speaks only while the voice does.
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

export const reelDuration = (p: ReelProps) => toFrame(p.durationMs) + 12;

const palette = (key: string): CutoutPalette => cutoutPalette(key as CutoutPaletteKey);

interface Scene {
  p: CutoutPalette;
  beats: TimelineBeat[];
  /** First frame of the scene sequence (transition start). */
  from: number;
  kind?: TransitionKind;
}

/** The pulled sheet arrives in Task 8 of the plan; until then it is drawn as a bloom. */
const kindOf = (k: 'bloom' | 'cut' | 'pull'): TransitionKind => (k === 'pull' ? 'bloom' : k);

function scenesOf(beats: TimelineBeat[], plan?: MascotPlan): Scene[] {
  const scenes: Scene[] = [];
  for (const b of beats) {
    const last = scenes.at(-1);
    if (last && last.p.key === b.palette) last.beats.push(b);
    else {
      const planned = plan?.transitions.find((t) => t.beat === b.id);
      const kind: TransitionKind | undefined =
        scenes.length === 0
          ? undefined
          : planned
            ? kindOf(planned.kind)
            : scenes.length % 2 === 1
              ? 'bloom'
              : 'cut';
      const from = kind ? Math.max(0, toFrame(b.startMs) - transitionTiming[kind].lead) : 0;
      scenes.push({ p: palette(b.palette), beats: [b], from, kind });
    }
  }
  return scenes;
}

const mono = fontsOf('brand').mono;

const Headline: React.FC<{
  beat: TimelineBeat;
  p: CutoutPalette;
  from: number;
  pulseAt?: number;
}> = ({ beat, p, from, pulseAt }) => {
  const words: RevealWord[] = beat.units.map((u) => ({
    text: u.text,
    at: toFrame(u.startMs) - from,
    highlight:
      beat.highlight && holdsHighlight(u.text, beat.highlight)
        ? {
            kind: p.highlight.kind,
            color: p.highlight.color,
            textColor: p.highlight.text,
            ...(pulseAt !== undefined ? { pulseAt: pulseAt - from } : {}),
          }
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

const INTERACTIONS: readonly string[] = ['lean', 'tickle', 'hide', 'water'];

/** What the plan does to a scene: motif reactions and the office object it takes in hand. */
function sceneEffects(s: Scene, plan?: MascotPlan) {
  if (!plan) return { reactions: [] as MotifReaction[], hideObject: false };
  const ids = new Set(s.beats.map((b) => b.id));
  const gags = plan.gags.filter((g) => ids.has(g.beat));
  const layout = sceneLayouts[s.p.key as CutoutPaletteKey];
  const reactions: MotifReaction[] = gags
    .filter((g) => g.target && INTERACTIONS.includes(g.kind))
    .map((g) => ({
      motifId: g.target!,
      kind: g.kind as Interaction,
      frame: toFrame(g.fromMs) - s.from,
    }));
  const hideObject = gags.some((g) => g.source === 'script' && g.target === layout.object);
  return { reactions, hideObject };
}

export const Reel: React.FC<ReelProps> = (props) => {
  const { audio, beats, speech, kicker, postId, mascot: plan } = props;
  const frame = useCurrentFrame();
  const total = reelDuration(props);
  const scenes = scenesOf(beats, plan);
  // Palette of the scene being spoken now (switches at the first word of a scene).
  const current =
    [...scenes].reverse().find((s) => frame >= toFrame(s.beats[0]!.startMs) - 2) ?? scenes[0];
  const cp = current?.p ?? palette('blu');
  const talk = speech.map((s) => ({ from: toFrame(s.startMs), to: toFrame(s.endMs) }));

  // Every headline lasts until the next beat starts, or until the next scene's transition.
  const headlines = beats.map((b, i) => {
    const next = beats[i + 1];
    const nextScene = scenes.find((s) => s.beats[0] === next);
    const from = toFrame(b.startMs) - 3;
    const to = next ? (nextScene ? nextScene.from : toFrame(next.startMs) - 3) : total;
    const stamp = plan?.gags.find((g) => g.beat === b.id && g.kind === 'stamp');
    return {
      b,
      p: palette(b.palette),
      from,
      duration: Math.max(1, to - from),
      pulseAt: stamp ? toFrame(stamp.fromMs) : undefined,
    };
  });

  /** One pass of every scene: `back` (color, back motifs, object) or `front` (front motifs). */
  const pass = (layer: 'all' | 'back' | 'front') =>
    scenes.map((s, i) => {
      const next = scenes[i + 1];
      const tail = next ? next.from + transitionTiming[next.kind ?? 'bloom'].frames : total;
      // Front motifs leave at the next transition start: the incoming pass covers them.
      const until = layer === 'front' && next ? next.from : tail;
      const prev = scenes[i - 1];
      const fx = sceneEffects(s, plan);
      const backdrop = (p: CutoutPalette, suffix: string, effects: typeof fx) => (
        <PaletteBackdrop
          p={p}
          idSuffix={suffix}
          layer={layer}
          hideObject={effects.hideObject}
          reactions={effects.reactions}
        />
      );
      return (
        <Sequence key={`${layer}${i}`} from={s.from} durationInFrames={Math.max(1, until - s.from)}>
          <PaperIn
            to={s.p}
            from={prev?.p}
            kind={s.kind}
            decor={layer !== 'front'}
            scene={backdrop(s.p, `r${i}`, fx)}
            prevScene={(sfx) =>
              prev ? backdrop(prev.p, `r${i - 1}${sfx}`, sceneEffects(prev, plan)) : null
            }
            prevOffset={prev ? s.from - prev.from : 0}
          />
        </Sequence>
      );
    });

  // Without a plan: the mascot of D-031, standing in the middle, pose per beat.
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
      {plan ? (
        <>
          {pass('back')}
          <MascotLayer plan={plan} talk={talk} p={cp} seed={postId} depth="behind" />
          {pass('front')}
          <MascotLayer plan={plan} talk={talk} p={cp} seed={postId} depth="front" />
        </>
      ) : (
        pass('all')
      )}
      {headlines.map(({ b, p, from, duration, pulseAt }) => (
        <Sequence key={b.id} from={from} durationInFrames={duration}>
          <Headline beat={b} p={p} from={from} pulseAt={pulseAt} />
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
      {!plan && (
        <InvoiceRoll
          width={420}
          cues={cues}
          talk={talk}
          gaze={{ x: 0, y: -0.5 }}
          seed={postId}
          pen={cp.pen}
          look={{ limbWidth: 12, roll: cp.roll, accent: cp.pill, rule: 'oklch(85% 0.04 264)' }}
          defs={<CutoutStickerFilter id="reelMascot" frame={frame} />}
          filter="url(#reelMascot)"
          style={{ position: 'absolute', left: 330, top: 1040 }}
        />
      )}
    </AbsoluteFill>
  );
};
