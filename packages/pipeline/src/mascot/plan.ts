import {
  sceneLayouts,
  transitionTiming,
  type CutoutPaletteKey,
  type Interaction,
  type MotifSpot,
  type OfficeObjectKey,
} from '@reelkit/brand';
import {
  holdsHighlight,
  MascotPlan,
  seededRandom,
  type Beat,
  type Eyes,
  type PropKind,
  type Script,
  type Trigger,
} from '@reelkit/schema';
import type { AlignReport } from '../align/align';
import { shiftMs, type Stretch } from '../audio/stretch';

/**
 * Mascot choreography planner (design: docs/superpowers/specs/2026-11-18-mascot-choreography-
 * design.md). Pure and deterministic: script + words + scene layouts -> mascot.json.
 * Times are computed in the original voice time, then shifted by the pause stretches.
 */

const FRAME_MS = 1000 / 30;
const f2ms = (frames: number) => frames * FRAME_MS;

/** Limits from the design (Global Constraints of the plan). */
export const LIMITS = {
  autoGapMs: 1500,
  highlightGuardMs: 300,
  gazeReturnMs: 600,
  longSpeechMs: 2000,
  maxTriggers: 2,
  maxStretchMs: 400,
  gestureLeadFrames: 12,
  blowPuffMs: 400,
  laneMin: 160,
  laneMax: 860,
  hideLeftMin: 120,
  walkPxPerSecond: 280,
  /** Time the scene must last after a pull, for the mascot to walk back in. */
  pullTailMs: 1300,
  /** Never longer than this without any automatic or script action. */
  maxStillMs: 5000,
} as const;

/**
 * Frame geometry used by the checks, measured on the rig (420 px wide, feet on y 1634): the
 * roll top is the highest drawn point at rest, a raised held prop (magnifier lens on `point`)
 * reaches about 1110, a hop lifts everything by 67.
 */
const GEOMETRY = {
  rollTop: 1172,
  propTop: 1110,
  hopRise: 67,
  headlineTop: 480,
  headlineLine: 119,
  headlineWidth: 834,
  // Calibrated on the TD17 render: about 15 characters per line at 112 px.
  charWidth: 54,
} as const;

type Plan = MascotPlan;
type Move = Plan['moves'][number];
type Cue = Plan['cues'][number];

interface BeatTime {
  beat: Beat;
  startMs: number;
  endMs: number;
  /** End of the last word of the beat. */
  lastWordMs: number;
  highlightMs?: number;
  atMs?: number;
}

interface Scene {
  key: CutoutPaletteKey;
  beats: BeatTime[];
  kind?: 'bloom' | 'cut' | 'pull';
  trigger?: Trigger;
}

const SFX: Record<string, string> = {
  stamp: 'stamp',
  type: 'typing',
  send: 'swish',
  water: 'water',
  hide: 'whoosh-soft',
  scissors: 'snip',
  blow: 'puff',
  pull: 'paper-pull',
};

const OBJECT_OF: Partial<Record<string, OfficeObjectKey>> = {
  stamp: 'stamp',
  type: 'calculator',
  send: 'envelope',
  inspect: 'magnifier',
};

const PROP_OF: Partial<Record<string, PropKind>> = {
  stamp: 'stamp',
  type: 'calculator',
  send: 'letter',
  inspect: 'magnifier',
  water: 'wateringCan',
};

function beatTimes(script: Script, report: AlignReport): BeatTime[] {
  const times = script.beats.map((beat) => {
    const units = report.screen.filter((u) => u.beat === beat.id);
    if (units.length === 0) throw new Error(`beat ${beat.id} has no timed words: re-run align`);
    const find = (word?: string) =>
      word ? units.find((u) => holdsHighlight(u.text, word))?.startMs : undefined;
    return {
      beat,
      startMs: units[0]!.startMs,
      endMs: 0,
      lastWordMs: units.at(-1)!.endMs,
      highlightMs: find(beat.highlight),
      atMs: find(beat.mascot?.at),
    };
  });
  times.forEach((t, i) => (t.endMs = times[i + 1]?.startMs ?? report.durationMs));
  return times;
}

function scenesOf(times: BeatTime[], problems: string[]): Scene[] {
  const scenes: Scene[] = [];
  for (const t of times) {
    const last = scenes.at(-1);
    if (last && last.key === t.beat.palette) {
      if (t.beat.transition) {
        problems.push(
          `beat ${t.beat.id}: asks a ${t.beat.transition.trigger} transition but the palette does not change there`,
        );
      }
      last.beats.push(t);
      continue;
    }
    if (!(t.beat.palette in sceneLayouts)) {
      problems.push(`beat ${t.beat.id}: unknown palette "${t.beat.palette}"`);
    }
    scenes.push({
      key: t.beat.palette as CutoutPaletteKey,
      beats: [t],
      trigger: t.beat.transition?.trigger,
    });
  }
  // Default alternation bloom, cut; a trigger sets the kind and the alternation goes on from it.
  let next: 'bloom' | 'cut' = 'bloom';
  for (const s of scenes.slice(1)) {
    if (s.trigger === 'pull') s.kind = 'pull';
    else if (s.trigger === 'scissors') s.kind = 'cut';
    else if (s.trigger === 'blow') s.kind = 'bloom';
    else s.kind = next;
    next = s.kind === 'bloom' ? 'cut' : 'bloom';
  }
  return scenes;
}

/** Headline lines estimated from the text width at 112 px (Sour Gummy 800). */
function headlineLines(text: string): number {
  const perLine = Math.floor(GEOMETRY.headlineWidth / GEOMETRY.charWidth);
  let lines = 1;
  let used = 0;
  for (const w of text.split(/\s+/)) {
    const len = w.length + (used > 0 ? 1 : 0);
    if (used + len > perLine && used > 0) {
      lines++;
      used = w.length;
    } else used += len;
  }
  return lines;
}

export function planMascot(input: { script: Script; report: AlignReport; seed: string }): {
  plan: Plan;
  problems: string[];
  warnings: string[];
} {
  const { script, report, seed } = input;
  const problems: string[] = [];
  const warnings: string[] = [];
  const rnd = seededRandom(seed, 'mascot');
  const times = beatTimes(script, report);
  const scenes = scenesOf(times, problems);

  // ---------------------------------------------------------------- triggers and stretches
  /** Silence the gesture of a trigger still needs before the scene, after the stretch limit. */
  const missingRoom = (i: number, kind: 'bloom' | 'cut' | 'pull', trigger: Trigger) => {
    const prev = scenes[i - 1]!.beats.at(-1)!;
    const silence = scenes[i]!.beats[0]!.startMs - prev.lastWordMs;
    const need = f2ms(transitionTiming[kind].lead) + (trigger === 'blow' ? LIMITS.blowPuffMs : 0);
    return Math.max(0, Math.ceil(need - silence));
  };
  if (!scenes.some((s) => s.trigger) && scenes.length > 1) {
    // No trigger asked: one automatic trigger on a seeded scene change where the gesture fits
    // (bloom or cut only).
    const candidates = scenes
      .map((s, i) => ({ s, i }))
      .filter(({ s, i }) => {
        if (i === 0 || !s.kind || s.kind === 'pull') return false;
        return (
          missingRoom(i, s.kind, s.kind === 'cut' ? 'scissors' : 'blow') <= LIMITS.maxStretchMs
        );
      });
    const pick = candidates[Math.floor(rnd() * candidates.length)]?.s;
    if (pick) pick.trigger = pick.kind === 'cut' ? 'scissors' : 'blow';
  }
  const stretch: Stretch[] = [];
  for (let i = 1; i < scenes.length; i++) {
    const s = scenes[i]!;
    if (!s.trigger || !s.kind) continue;
    const prev = scenes[i - 1]!.beats.at(-1)!;
    const first = s.beats[0]!;
    const silence = first.startMs - prev.lastWordMs;
    const need =
      f2ms(transitionTiming[s.kind].lead) + (s.trigger === 'blow' ? LIMITS.blowPuffMs : 0);
    const add = Math.max(0, Math.ceil(need - silence));
    // A pull ends with the mascot walking back in: the scene must last long enough after it.
    const sceneLeft =
      s.beats.at(-1)!.endMs -
      first.startMs -
      f2ms(transitionTiming.pull.frames - transitionTiming.pull.lead);
    if (add > LIMITS.maxStretchMs || (s.trigger === 'pull' && sceneLeft < LIMITS.pullTailMs)) {
      const why =
        add > LIMITS.maxStretchMs
          ? `needs ${add} ms more`
          : 'the scene is too short to walk back in';
      const msg = `beat ${first.beat.id}: no room for the ${s.trigger} gesture (${why}), plain transition`;
      if (first.beat.transition) warnings.push(msg);
      if (s.trigger === 'pull') s.kind = scenes[i - 1]?.kind === 'bloom' ? 'cut' : 'bloom';
      s.trigger = undefined;
      continue;
    }
    if (add > 0)
      stretch.push({ atMs: Math.round((prev.lastWordMs + first.startMs) / 2), addMs: add });
  }
  const sh = (ms: number) => Math.round(shiftMs(ms, stretch));

  // ------------------------------------------------------------------ transition windows
  // Every scene change, in final time; a triggered one also has its gesture start.
  interface Window {
    scene: number;
    beat: string;
    kind: 'bloom' | 'cut' | 'pull';
    trigger?: Trigger;
    gStart: number;
    tStart: number;
    tEnd: number;
  }
  const windows: Window[] = [];
  scenes.forEach((s, si) => {
    if (si === 0 || !s.kind) return;
    const tStart = sh(s.beats[0]!.startMs) - f2ms(transitionTiming[s.kind].lead);
    windows.push({
      scene: si,
      beat: s.beats[0]!.beat.id,
      kind: s.kind,
      trigger: s.trigger,
      gStart: Math.round(tStart - (s.trigger ? f2ms(LIMITS.gestureLeadFrames) : 0)),
      tStart: Math.round(tStart),
      tEnd: Math.round(tStart + f2ms(transitionTiming[s.kind].frames)),
    });
  });
  /** Start of the next mascot gesture after `ms` (moves must be over by then). */
  const nextGesture = (ms: number) =>
    Math.min(...windows.filter((w) => w.trigger && w.gStart > ms).map((w) => w.gStart), Infinity);
  const inGesture = (from: number, to: number) =>
    windows.some((w) => w.trigger && w.gStart < to && w.tEnd > from);

  const altBeat = script.beats.find((b) => b.mascot?.scene)?.id;
  const altTime = times.find((t) => t.beat.id === altBeat);
  const inAlt = (from: number, to: number) =>
    !!altTime && sh(altTime.startMs) < to && sh(altTime.endMs) > from;
  if (altTime) {
    const i = times.indexOf(altTime);
    const touches = windows.some(
      (w) => w.trigger && (w.beat === altTime.beat.id || w.beat === times[i + 1]?.beat.id),
    );
    if (touches) {
      problems.push(
        `beat ${altTime.beat.id}: the alternative scene cannot sit next to a mascot-triggered transition`,
      );
    }
  }

  // ------------------------------------------------------------------ the lane, in time order
  const moves: Move[] = [{ atMs: 0, durationMs: 0, x: 540, gait: 'stand', depth: 'front' }];
  const cues: Cue[] = [];
  const gaze: Plan['gaze'] = [{ atMs: 0, target: 'camera' }];
  const props: Plan['props'] = [];
  const gags: Plan['gags'] = [];
  const transitions: Plan['transitions'] = [];
  const autoAt: number[] = [];
  /** Spots where the mascot may stand outside the lane (hiding behind a left motif). */
  const hideSpots = new Set<number>();
  let x = 540;
  /** Moves never overlap: a new one starts when the previous one is over. */
  let busyUntil = 0;

  const walkMs = (target: number, speed: number = LIMITS.walkPxPerSecond) => {
    const dist = Math.abs(target - x);
    return dist < 20 ? 0 : Math.min(1800, Math.round((dist / speed) * 1000));
  };
  /** Walks from `atMs` (or when free); undefined when it cannot arrive before `deadline`. */
  const walkTo = (
    atMs: number,
    target: number,
    depth: 'front' | 'behind',
    opts: { speed?: number; deadline?: number } = {},
  ): number | undefined => {
    const start = Math.max(atMs, busyUntil);
    const durationMs = walkMs(target, opts.speed);
    if (durationMs === 0) return start;
    if (opts.deadline !== undefined && start + durationMs > opts.deadline) return undefined;
    moves.push({ atMs: start, durationMs, x: target, gait: 'walk', depth });
    x = target;
    busyUntil = start + durationMs;
    return busyUntil;
  };
  /** Depth of an automatic walk: sometimes behind the front motifs it crosses. */
  const crossDepth = (layoutMotifs: MotifSpot[], target: number): 'front' | 'behind' => {
    const lo = Math.min(x, target);
    const hi = Math.max(x, target);
    const crosses = layoutMotifs.some(
      (m) => m.depth === 'front' && m.lane && m.lane.to > lo - 110 && m.lane.from < hi + 110,
    );
    return crosses && rnd() < 0.5 ? 'behind' : 'front';
  };
  // The reaction on a highlighted word is tied to the text and always wins: other automatic
  // actions keep the rate limit from it (and from each other); reactions only from each other
  // and from what is already planned.
  const highlightMoments = times
    .filter((t) => t.highlightMs !== undefined && !t.beat.mascot?.action)
    .map((t) => sh(t.highlightMs!));
  const autoFree = (ms: number) =>
    autoAt.every((a) => Math.abs(a - ms) >= LIMITS.autoGapMs) &&
    highlightMoments.every((h) => Math.abs(h - ms) >= LIMITS.autoGapMs) &&
    times.every(
      (t) =>
        t.highlightMs === undefined || Math.abs(sh(t.highlightMs) - ms) >= LIMITS.highlightGuardMs,
    );
  const reactFree = (ms: number) => autoAt.every((a) => Math.abs(a - ms) >= LIMITS.autoGapMs);
  const headlineBottom = (t: BeatTime) =>
    GEOMETRY.headlineTop + headlineLines(t.beat.say) * GEOMETRY.headlineLine;

  // ------------------------------------------------------------------------- scenes
  scenes.forEach((s, si) => {
    const layout = sceneLayouts[s.key];
    const sceneStart = sh(s.beats[0]!.startMs);
    const sceneEnd = sh(s.beats.at(-1)!.endMs);
    const w = windows.find((x) => x.scene === si);
    /** Nothing new starts before the transition into this scene is over. */
    const sceneReady = w?.trigger ? w.tEnd : sceneStart;

    // Transition into this scene, and the mascot gesture that starts it.
    if (w) {
      transitions.push({
        beat: w.beat,
        kind: w.kind,
        ...(w.trigger ? { trigger: w.trigger } : {}),
      });
      // The gesture waits for a script moment just before it (a letter sent on the last word).
      const prevMoments = gags.filter((g) => g.source === 'script' && g.fromMs <= w.gStart);
      const lastMoment = Math.max(...prevMoments.map((g) => g.fromMs), -Infinity);
      const poseAt = Math.min(w.tStart, Math.max(w.gStart, lastMoment + 400));
      if (w.trigger === 'scissors') {
        props.push({ fromMs: w.gStart, toMs: w.tEnd, hand: 'right', prop: 'scissors' });
        cues.push({ atMs: poseAt, pose: 'hold', eyes: 'wide', lean: 0 });
      } else if (w.trigger === 'blow') {
        cues.push({ atMs: poseAt, pose: 'neutral', eyes: 'closed', lean: -3 });
        gags.push({
          fromMs: Math.round(w.tStart - LIMITS.blowPuffMs),
          toMs: w.tStart + 200,
          kind: 'puff',
          source: 'auto',
          beat: w.beat,
          sfx: SFX.blow,
        });
      } else if (w.trigger === 'pull') {
        // The mascot grabs the edge of the new sheet on its side and runs across the frame
        // pulling it: the torn edge follows its trailing hand. Then it walks back in.
        const exit = x < 540 ? 1380 : -300;
        cues.push({ atMs: poseAt, pose: 'pull', eyes: 'wide', lean: exit > 0 ? 8 : -8 });
        const start = Math.max(w.tStart, busyUntil);
        moves.push({
          atMs: start,
          durationMs: w.tEnd - start,
          x: exit,
          gait: 'walk',
          depth: 'front',
        });
        x = exit;
        busyUntil = w.tEnd;
        transitions.at(-1)!.side = exit > 0 ? 'left' : 'right';
        // Back in quickly on the new sheet, so a pull near the end still lands in the frame.
        walkTo(w.tEnd, exit > 0 ? 820 : 260, 'front', { speed: 520 });
      }
      if (w.trigger) {
        gags.push({
          fromMs: w.gStart,
          toMs: w.tEnd,
          kind: w.trigger,
          source: s.beats[0]!.beat.transition ? 'script' : 'auto',
          beat: w.beat,
          sfx: SFX[w.trigger],
        });
      }
    }

    // Beats: base pose, then the script gag, which may override it.
    const scriptGag = s.beats.some((b) => b.beat.mascot?.action);
    for (const t of s.beats) {
      const id = t.beat.id;
      if (id === altBeat) continue;
      const from = Math.max(sh(t.startMs), t === s.beats[0] ? sceneReady : 0);
      const to = sh(t.endMs);
      cues.push({ atMs: from, pose: t.beat.mascot?.pose ?? 'neutral', eyes: 'open', lean: 0 });
      const action = t.beat.mascot?.action;
      if (!action) continue;
      const deadline = Math.min(nextGesture(from), to);
      let at = sh(t.atMs ?? t.highlightMs ?? t.startMs + 300);
      if (action === 'stamp') {
        if (t.highlightMs === undefined) {
          problems.push(`beat ${id}: stamp needs a highlighted word to land on`);
          continue;
        }
        if (t.atMs !== undefined && t.atMs < t.highlightMs) {
          problems.push(
            `beat ${id}: stamp at "${t.beat.mascot?.at}" comes before the highlighted word`,
          );
          continue;
        }
      }
      at = Math.max(at, from + 300);
      const obj = OBJECT_OF[action];
      const prop = PROP_OF[action];
      let target: string | undefined = obj;
      let moment = at;
      if (action === 'water' || action === 'hide') {
        const need: Interaction = action;
        const candidates = layout.motifs.filter(
          (m) => m.lane?.interactions.includes(need) && (action === 'water' || m.depth === 'front'),
        );
        const motif = candidates.sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
        if (!motif) {
          problems.push(
            `beat ${id}: action ${action} needs a motif that allows "${need}", scene ${s.key} has none`,
          );
          continue;
        }
        target = motif.id;
        const left = motif.x < 540;
        const spot =
          action === 'hide'
            ? left
              ? Math.max(LIMITS.hideLeftMin, motif.x)
              : Math.min(LIMITS.laneMax, motif.lane!.from)
            : left
              ? Math.min(LIMITS.laneMax, motif.lane!.to + 90)
              : Math.max(LIMITS.laneMin, motif.lane!.from - 90);
        if (action === 'hide') hideSpots.add(spot);
        const arrive = walkTo(from, spot, action === 'hide' ? 'behind' : 'front', { deadline });
        if (arrive === undefined) {
          problems.push(`beat ${id}: no time to reach ${motif.id} before the next transition`);
          continue;
        }
        // The action happens when the mascot is there.
        moment = Math.max(arrive, at);
        cues.push({
          atMs: moment,
          pose: action === 'hide' ? 'hide' : left ? 'lean' : 'lean-r',
          eyes: action === 'hide' ? 'wide' : 'happy',
          lean: left ? -6 : 6,
        });
      } else if (action === 'stamp') {
        cues.push({ atMs: Math.max(from, at - 400), pose: 'stamp', eyes: 'wide', lean: 0 });
        cues.push({ atMs: at, pose: 'hold', eyes: 'closed', lean: 0 });
      } else if (action === 'type') {
        cues.push({ atMs: from, pose: 'type', eyes: 'half', lean: 2 });
      } else if (action === 'send') {
        cues.push({ atMs: from, pose: 'hold', eyes: 'open', lean: 0 });
        cues.push({ atMs: at, pose: 'arms-up', eyes: 'happy', lean: 0 });
      } else if (action === 'inspect') {
        cues.push({ atMs: from, pose: 'hold', eyes: 'wide', lean: -2 });
        gaze.push({ atMs: from, target: 'headline' });
      } else if (action === 'point') {
        cues.push({ atMs: at, pose: 'point', eyes: 'open', lean: 3 });
        gaze.push({ atMs: at, target: 'headline' });
      }
      if (prop) {
        const until = action === 'send' ? at : Math.min(to, nextGesture(from));
        props.push({ fromMs: from, toMs: until, hand: 'right', prop });
      }
      gags.push({
        fromMs: moment,
        toMs: Math.max(moment + 400, to),
        kind: action,
        source: 'script',
        beat: id,
        ...(target ? { target } : {}),
        ...(SFX[action] ? { sfx: SFX[action] } : {}),
      });
      // Back to the open lane, in front, before the beat ends and before any gesture.
      if (action === 'hide' || action === 'water') {
        const back = x < 540 ? 380 : 700;
        // Leave at the beat end if possible; earlier when a mascot gesture comes first.
        const ng = nextGesture(moment);
        const start = Math.max(moment + 600, Math.min(to, ng - walkMs(back)));
        if (walkTo(start, back, 'front', { deadline: ng }) === undefined) {
          problems.push(
            `beat ${id}: no time to come back from ${target} before the next transition`,
          );
        }
      }
    }

    // Automatic side-motif interaction, once per scene, when there is time and no script gag.
    // Not in a scene entered with a pull: the mascot is busy walking back in.
    const reachable = layout.motifs.filter(
      (m): m is MotifSpot & { lane: NonNullable<MotifSpot['lane']> } =>
        !!m.lane && m.lane.interactions.some((i) => i === 'lean' || i === 'tickle' || i === 'hide'),
    );
    const sceneFree = !scriptGag && w?.trigger !== 'pull' && !inAlt(sceneReady, sceneEnd);
    if (sceneFree && reachable.length > 0 && sceneEnd - sceneReady > 2500 && rnd() < 0.6) {
      const m = reachable[Math.floor(rnd() * reachable.length)]!;
      const canHide = m.depth === 'front' && m.lane.interactions.includes('hide');
      const kind: Interaction =
        canHide && rnd() < 0.4
          ? 'hide'
          : m.lane.interactions.includes('tickle')
            ? 'tickle'
            : 'lean';
      const left = m.x < 540;
      const spot =
        kind === 'hide'
          ? left
            ? Math.max(LIMITS.hideLeftMin, m.x)
            : Math.min(LIMITS.laneMax, m.lane.from)
          : left
            ? Math.min(LIMITS.laneMax, m.lane.to + 70)
            : Math.max(LIMITS.laneMin, m.lane.from - 70);
      const startAt = Math.max(sceneReady + 300, busyUntil);
      const deadline = Math.min(nextGesture(startAt), sceneEnd);
      const arriveAt = startAt + walkMs(spot);
      if (autoFree(arriveAt) && arriveAt + 1200 <= deadline) {
        if (kind === 'hide') hideSpots.add(spot);
        const arrive = walkTo(startAt, spot, kind === 'hide' ? 'behind' : 'front', { deadline })!;
        cues.push({
          atMs: arrive,
          pose: kind === 'hide' ? 'hide' : left ? 'lean' : 'lean-r',
          eyes: kind === 'hide' ? 'wide' : kind === 'tickle' ? 'happy' : 'open',
          lean: left ? -5 : 5,
        });
        gags.push({
          fromMs: arrive,
          toMs: arrive + 1200,
          kind,
          source: 'auto',
          beat: s.beats[0]!.beat.id,
          target: m.id,
        });
        autoAt.push(arrive);
        if (kind === 'hide') {
          const back = left ? 380 : 700;
          walkTo(arrive + 1200, back, 'front', { deadline });
          cues.push({ atMs: arrive + 1200, pose: 'neutral', eyes: 'open', lean: 0 });
        }
      }
    } else if (si > 0 && sceneFree && rnd() < 0.5) {
      // Otherwise sometimes walk to a new spot at the scene change.
      const target = Math.round(LIMITS.laneMin + rnd() * (LIMITS.laneMax - LIMITS.laneMin));
      const startAt = Math.max(sceneReady, busyUntil);
      if (Math.abs(target - x) > 160 && autoFree(startAt)) {
        if (
          walkTo(startAt, target, crossDepth(layout.motifs, target), {
            deadline: nextGesture(startAt),
          })
        ) {
          autoAt.push(startAt);
        }
      }
    }

    // Per beat: gaze to the headline and back, beat-start hop or weight shift, highlight react.
    for (const t of s.beats) {
      if (t.beat.id === altBeat) continue;
      const from = Math.max(sh(t.startMs), t === s.beats[0] ? sceneReady : 0);
      const action = t.beat.mascot?.action;
      const looking = action === 'inspect' || action === 'point';
      gaze.push({ atMs: from, target: 'headline' });
      if (!looking) gaze.push({ atMs: from + LIMITS.gazeReturnMs, target: 'camera' });
      const free = !action && !inGesture(from, from + 600) && busyUntil <= from;
      if (free && autoFree(from) && rnd() < 0.5) {
        // A hop only when the headline leaves room above the mascot.
        const hopFits = headlineBottom(t) <= GEOMETRY.rollTop - GEOMETRY.hopRise;
        if (hopFits && rnd() < 0.5) {
          moves.push({ atMs: from, durationMs: 500, x, gait: 'hop', depth: moves.at(-1)!.depth });
          busyUntil = from + 500;
          gags.push({
            fromMs: from,
            toMs: from + 500,
            kind: 'hop',
            source: 'auto',
            beat: t.beat.id,
          });
        } else {
          const pose = t.beat.mascot?.pose ?? 'neutral';
          cues.push({ atMs: from, pose, eyes: 'open', lean: rnd() < 0.5 ? -4 : 4 });
          cues.push({ atMs: from + 600, pose, eyes: 'open', lean: 0 });
          gags.push({
            fromMs: from,
            toMs: from + 600,
            kind: 'shift',
            source: 'auto',
            beat: t.beat.id,
          });
        }
        autoAt.push(from);
      }
      if (t.highlightMs !== undefined && !action) {
        const h = sh(t.highlightMs);
        if (!inGesture(h, h + 600) && reactFree(h)) {
          const pose = t.beat.mascot?.pose ?? 'neutral';
          const eyes: Eyes = rnd() < 0.5 ? 'happy' : 'wide';
          cues.push({ atMs: h, pose, eyes, lean: 0 });
          cues.push({ atMs: h + 600, pose, eyes: 'open', lean: 0 });
          gaze.push(
            { atMs: h, target: 'label' },
            { atMs: h + LIMITS.gazeReturnMs, target: 'camera' },
          );
          gags.push({ fromMs: h, toMs: h + 600, kind: 'react', source: 'auto', beat: t.beat.id });
          autoAt.push(h);
        }
      }
    }
  });

  // Foot tap in long speech stretches without other actions, and never more than 5 s still.
  const quiet = (from: number, to: number) =>
    !gags.some((g) => g.fromMs < to && g.toMs > from) &&
    !moves.some((m) => m.atMs < to && m.atMs + m.durationMs > from) &&
    !inGesture(from, to) &&
    !inAlt(from, to);
  for (const st of speechStretches(report)) {
    const from = sh(st.startMs);
    const to = sh(st.endMs);
    const mid = Math.round((from + to) / 2);
    if (to - from > LIMITS.longSpeechMs && autoFree(mid) && quiet(mid, mid + 800)) {
      gags.push({
        fromMs: mid,
        toMs: mid + 800,
        kind: 'tap',
        source: 'auto',
        beat: beatAt(times, sh, mid),
      });
      autoAt.push(mid);
    }
  }
  const end = sh(report.durationMs);
  for (let guard = 0; guard < 20; guard++) {
    const marks = [0, ...gags.map((g) => g.fromMs), ...moves.map((m) => m.atMs), end].sort(
      (a, b) => a - b,
    );
    let gapAt = -1;
    for (let i = 1; i < marks.length; i++) {
      if (marks[i]! - marks[i - 1]! > LIMITS.maxStillMs) {
        const mid = Math.round((marks[i]! + marks[i - 1]!) / 2);
        if (quiet(mid, mid + 600) && autoFree(mid)) {
          gapAt = mid;
          break;
        }
      }
    }
    if (gapAt < 0) break;
    gags.push({
      fromMs: gapAt,
      toMs: gapAt + 800,
      kind: 'tap',
      source: 'auto',
      beat: beatAt(times, sh, gapAt),
    });
    autoAt.push(gapAt);
  }

  const sort = <T extends { atMs?: number; fromMs?: number }>(a: T[]) =>
    a.sort((p, q) => (p.atMs ?? p.fromMs ?? 0) - (q.atMs ?? q.fromMs ?? 0));
  const plan = MascotPlan.parse({
    postId: script.postId,
    stretch,
    moves: sort(moves),
    cues: sort(cues),
    gaze: sort(gaze),
    props: sort(props),
    gags: sort(gags),
    transitions,
    ...(altTime
      ? { alternate: { beat: altTime.beat.id, scene: altTime.beat.mascot!.scene! } }
      : {}),
  });

  // --------------------------------------------------------------------------- checks
  plan.moves.forEach((m, i) => {
    const prev = plan.moves[i - 1];
    if (prev && prev.atMs + prev.durationMs > m.atMs + 1) {
      problems.push(
        `moves overlap at ${m.atMs} ms (the previous one ends at ${prev.atMs + prev.durationMs})`,
      );
    }
    // Where it stops: on the lane, at a hide spot, or off-frame only while pulling.
    const next = plan.moves[i + 1];
    const offFrame = m.x < 0 || m.x > 1080;
    const onLane = m.x >= LIMITS.laneMin && m.x <= LIMITS.laneMax;
    if (!onLane && !hideSpots.has(m.x) && !(offFrame && next?.gait === 'walk')) {
      problems.push(
        `the mascot stops at x ${m.x} at ${m.atMs + m.durationMs} ms, outside the lane 160..860`,
      );
    }
  });
  let endX = 540;
  for (const m of plan.moves) {
    if (m.atMs > end) break;
    const k = m.durationMs > 0 ? Math.min(1, (end - m.atMs) / m.durationMs) : 1;
    endX = endX + (m.x - endX) * k;
  }
  if (endX < 60 || endX > 1020) {
    problems.push(`the mascot ends outside the frame (x ${Math.round(endX)})`);
  }
  for (const hand of ['left', 'right'] as const) {
    const held = plan.props.filter((p) => p.hand === hand);
    held.forEach((p, i) => {
      const next = held[i + 1];
      if (next && next.fromMs < p.toMs) {
        problems.push(
          `the ${hand} hand holds ${p.prop} and ${next.prop} at the same time (${next.fromMs} ms)`,
        );
      }
    });
  }
  if (altTime) {
    const from = sh(altTime.startMs);
    const to = sh(altTime.endMs);
    if (plan.moves.some((m) => m.atMs < to && m.atMs + m.durationMs > from)) {
      problems.push(`beat ${altTime.beat.id}: the mascot moves during the alternative scene`);
    }
  }
  const autos = plan.gags.filter(
    (g) =>
      g.source === 'auto' &&
      ['hop', 'shift', 'tap', 'lean', 'tickle', 'hide', 'react'].includes(g.kind),
  );
  autos.forEach((g, i) => {
    const next = autos[i + 1];
    if (next && next.fromMs - g.fromMs < LIMITS.autoGapMs)
      problems.push(`automatic actions too close at ${g.fromMs} and ${next.fromMs} ms`);
  });
  if (plan.transitions.filter((t) => t.trigger).length > LIMITS.maxTriggers)
    problems.push('more than 2 mascot-triggered transitions');
  for (const t of times) {
    const from = sh(t.startMs);
    const to = sh(t.endMs);
    const hops = plan.moves.some(
      (m) => m.gait === 'hop' && m.atMs < to && m.atMs + m.durationMs > from,
    );
    const holds = plan.props.some((p) => p.fromMs < to && p.toMs > from);
    const top =
      Math.min(GEOMETRY.rollTop, holds ? GEOMETRY.propTop : Infinity) -
      (hops ? GEOMETRY.hopRise : 0);
    const bottom = headlineBottom(t);
    if (bottom > top)
      problems.push(
        `beat ${t.beat.id}: headline (${headlineLines(t.beat.say)} lines, bottom ${bottom}) reaches the mascot (top ${top})`,
      );
  }
  return { plan, problems, warnings };
}

function speechStretches(report: AlignReport): Array<{ startMs: number; endMs: number }> {
  const out: Array<{ startMs: number; endMs: number }> = [];
  for (const w of report.words) {
    const last = out.at(-1);
    const pause =
      last && report.pauses.some((q) => q.startMs >= last.endMs - 30 && q.endMs <= w.startMs + 30);
    if (last && !pause) last.endMs = w.endMs;
    else out.push({ startMs: w.startMs, endMs: w.endMs });
  }
  return out;
}

function beatAt(times: BeatTime[], sh: (ms: number) => number, ms: number): string {
  return [...times].reverse().find((t) => sh(t.startMs) <= ms)?.beat.id ?? times[0]!.beat.id;
}
