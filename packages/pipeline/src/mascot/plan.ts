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
} as const;

/** Frame geometry used by the checks. */
const GEOMETRY = {
  mascotTop: 1040,
  hopRise: 67,
  propRise: 40,
  headlineTop: 480,
  headlineLine: 119,
  headlineWidth: 834,
  // Calibrated on the TD17 render: about 15 characters per line at 112 px.
  charWidth: 54,
  kickerBottom: 456,
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

  const moves: Move[] = [{ atMs: 0, durationMs: 0, x: 540, gait: 'stand', depth: 'front' }];
  const cues: Cue[] = [];
  const gaze: Plan['gaze'] = [{ atMs: 0, target: 'camera' }];
  const props: Plan['props'] = [];
  const gags: Plan['gags'] = [];
  const transitions: Plan['transitions'] = [];
  const autoAt: number[] = [];
  let x = 540;

  const lastMove = () => moves.at(-1)!;
  const walkMs = (target: number, speed: number = LIMITS.walkPxPerSecond) => {
    const dist = Math.abs(target - x);
    return dist < 20 ? 0 : Math.min(1800, Math.round((dist / speed) * 1000));
  };
  const walkTo = (
    atMs: number,
    target: number,
    depth: 'front' | 'behind' = 'front',
    speed: number = LIMITS.walkPxPerSecond,
  ) => {
    const durationMs = walkMs(target, speed);
    if (durationMs === 0) return atMs;
    moves.push({ atMs, durationMs, x: target, gait: 'walk', depth });
    x = target;
    return atMs + durationMs;
  };
  const autoFree = (ms: number) =>
    autoAt.every((a) => Math.abs(a - ms) >= LIMITS.autoGapMs) &&
    times.every(
      (t) =>
        t.highlightMs === undefined || Math.abs(sh(t.highlightMs) - ms) >= LIMITS.highlightGuardMs,
    );

  // ------------------------------------------------------------------------- scenes
  scenes.forEach((s, si) => {
    const layout = sceneLayouts[s.key];
    const sceneStart = sh(s.beats[0]!.startMs);
    const sceneEnd = sh(s.beats.at(-1)!.endMs);

    // Transition into this scene, and the mascot gesture that starts it.
    if (si > 0 && s.kind) {
      transitions.push({
        beat: s.beats[0]!.beat.id,
        kind: s.kind,
        ...(s.trigger ? { trigger: s.trigger } : {}),
      });
      const tStart = sceneStart - f2ms(transitionTiming[s.kind].lead);
      const tEnd = tStart + f2ms(transitionTiming[s.kind].frames);
      const gStart = Math.round(tStart - f2ms(LIMITS.gestureLeadFrames));
      if (s.trigger === 'scissors') {
        props.push({ fromMs: gStart, toMs: Math.round(tEnd), hand: 'right', prop: 'scissors' });
        cues.push({ atMs: gStart, pose: 'hold', eyes: 'wide', lean: 0 });
      } else if (s.trigger === 'blow') {
        cues.push({ atMs: gStart, pose: 'neutral', eyes: 'closed', lean: -3 });
        gags.push({
          fromMs: Math.round(tStart - LIMITS.blowPuffMs),
          toMs: Math.round(tStart + 200),
          kind: 'puff',
          source: 'auto',
          beat: s.beats[0]!.beat.id,
          sfx: SFX.blow,
        });
      } else if (s.trigger === 'pull') {
        // The mascot grabs the edge of the new sheet on its side and runs across the frame
        // pulling it: the torn edge follows its trailing hand. Then it walks back in.
        const exit = x < 540 ? 1380 : -300;
        cues.push({ atMs: gStart, pose: 'pull', eyes: 'wide', lean: exit > 0 ? 8 : -8 });
        moves.push({
          atMs: Math.round(tStart),
          durationMs: Math.round(tEnd - tStart),
          x: exit,
          gait: 'walk',
          depth: 'front',
        });
        x = exit;
        // Back in quickly on the new sheet, so a pull near the end still lands in the frame.
        walkTo(Math.round(tEnd), exit > 0 ? 820 : 260, 'front', 520);
      }
      if (s.trigger) {
        gags.push({
          fromMs: gStart,
          toMs: Math.round(tEnd),
          kind: s.trigger,
          source: s.beats[0]!.beat.transition ? 'script' : 'auto',
          beat: s.beats[0]!.beat.id,
          sfx: SFX[s.trigger],
        });
      }
    }

    // Script gags of the scene.
    const scriptGag = s.beats.some((b) => b.beat.mascot?.action);
    for (const t of s.beats) {
      const action = t.beat.mascot?.action;
      if (!action) continue;
      const from = sh(t.startMs);
      const to = sh(t.endMs);
      const at = sh(t.atMs ?? t.startMs + 300);
      const id = t.beat.id;
      const obj = OBJECT_OF[action];
      const prop = PROP_OF[action];
      let target: string | undefined = obj;
      if (action === 'water' || action === 'hide') {
        const need: Interaction = action;
        const motif = layout.motifs.find((m) => m.lane?.interactions.includes(need));
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
        const arrive = walkTo(from, spot, action === 'hide' ? 'behind' : 'front');
        cues.push({
          atMs: Math.min(arrive, at),
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
      if (prop)
        props.push({ fromMs: from, toMs: action === 'send' ? at : to, hand: 'right', prop });
      // The gag starts at its moment (stamp hit, letter sent, water poured), its props and
      // poses cover the beat.
      gags.push({
        fromMs: at,
        toMs: Math.max(at + 400, to),
        kind: action,
        source: 'script',
        beat: id,
        ...(target ? { target } : {}),
        ...(SFX[action] ? { sfx: SFX[action] } : {}),
      });
      // Back from the side motif to the open lane, in front again, when the beat ends.
      if (action === 'hide' || action === 'water') {
        walkTo(to, x < 540 ? 380 : 700, 'front');
      }
    }

    // Automatic side-motif interaction, once per scene, when there is time and no script gag.
    const reachable = layout.motifs.filter(
      (m): m is MotifSpot & { lane: NonNullable<MotifSpot['lane']> } =>
        !!m.lane && m.lane.interactions.some((i) => i === 'lean' || i === 'tickle'),
    );
    if (!scriptGag && reachable.length > 0 && sceneEnd - sceneStart > 2500 && rnd() < 0.6) {
      const m = reachable[Math.floor(rnd() * reachable.length)]!;
      const kind: Interaction = m.lane.interactions.includes('tickle') ? 'tickle' : 'lean';
      const left = m.x < 540;
      const startAt = sceneStart + 300;
      const spot = left
        ? Math.min(LIMITS.laneMax, m.lane.to + 70)
        : Math.max(LIMITS.laneMin, m.lane.from - 70);
      // The action happens on arrival: that is the time the rate limit looks at.
      if (autoFree(startAt + walkMs(spot))) {
        const arrive = walkTo(startAt, spot);
        cues.push({
          atMs: arrive,
          pose: left ? 'lean' : 'lean-r',
          eyes: kind === 'tickle' ? 'happy' : 'open',
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
      }
    } else if (si > 0 && !scriptGag && s.trigger !== 'pull' && rnd() < 0.5) {
      // Otherwise sometimes walk to a new spot at the scene change.
      const target = Math.round(LIMITS.laneMin + rnd() * (LIMITS.laneMax - LIMITS.laneMin));
      if (Math.abs(target - x) > 160 && autoFree(sceneStart)) {
        walkTo(sceneStart, target);
        autoAt.push(sceneStart);
      }
    }

    // Per beat: pose, gaze to the headline and back, beat-start hop or weight shift.
    for (const t of s.beats) {
      const from = sh(t.startMs);
      const scripted = !!t.beat.mascot?.action;
      if (!scripted)
        cues.push({ atMs: from, pose: t.beat.mascot?.pose ?? 'neutral', eyes: 'open', lean: 0 });
      gaze.push(
        { atMs: from, target: 'headline' },
        { atMs: from + LIMITS.gazeReturnMs, target: 'camera' },
      );
      if (
        !scripted &&
        autoFree(from) &&
        rnd() < 0.5 &&
        lastMove().atMs + lastMove().durationMs < from
      ) {
        if (rnd() < 0.5) {
          moves.push({ atMs: from, durationMs: 500, x, gait: 'hop', depth: lastMove().depth });
          gags.push({
            fromMs: from,
            toMs: from + 500,
            kind: 'hop',
            source: 'auto',
            beat: t.beat.id,
          });
        } else {
          const lean = rnd() < 0.5 ? -4 : 4;
          cues.push({ atMs: from, pose: t.beat.mascot?.pose ?? 'neutral', eyes: 'open', lean });
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
      if (t.highlightMs !== undefined && !scripted) {
        const h = sh(t.highlightMs);
        const eyes: Eyes = rnd() < 0.5 ? 'happy' : 'wide';
        cues.push({ atMs: h, pose: t.beat.mascot?.pose ?? 'neutral', eyes, lean: 0 });
        cues.push({ atMs: h + 600, pose: t.beat.mascot?.pose ?? 'neutral', eyes: 'open', lean: 0 });
        gaze.push(
          { atMs: h, target: 'label' },
          { atMs: h + LIMITS.gazeReturnMs, target: 'camera' },
        );
        gags.push({ fromMs: h, toMs: h + 600, kind: 'react', source: 'auto', beat: t.beat.id });
      }
    }
  });

  // Foot tap in long speech stretches without other actions.
  for (const w of speechStretches(report)) {
    const from = sh(w.startMs);
    const to = sh(w.endMs);
    const mid = Math.round((from + to) / 2);
    if (
      to - from > LIMITS.longSpeechMs &&
      autoFree(mid) &&
      !gags.some((g) => g.fromMs < to && g.toMs > from && g.source === 'script')
    ) {
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

  const alt = script.beats.find((b) => b.mascot?.scene);
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
    ...(alt ? { alternate: { beat: alt.id, scene: alt.mascot!.scene! } } : {}),
  });

  // --------------------------------------------------------------------------- checks
  for (const m of plan.moves) {
    if (m.gait !== 'walk' && (m.x < LIMITS.laneMin || m.x > LIMITS.laneMax)) {
      const hideLeft = m.x >= LIMITS.hideLeftMin && m.x < LIMITS.laneMin;
      if (!hideLeft)
        problems.push(`stand at x ${m.x} at ${m.atMs} ms is outside the lane 160..860`);
    }
  }
  // Where the mascot actually is on the last frame (a walk may still be running).
  const end = sh(report.durationMs);
  let endX = 540;
  for (const m of plan.moves) {
    if (m.atMs > end) break;
    const t = m.durationMs > 0 ? Math.min(1, (end - m.atMs) / m.durationMs) : 1;
    endX = endX + (m.x - endX) * t;
  }
  if (endX < 60 || endX > 1020) {
    problems.push(`the mascot ends outside the frame (x ${Math.round(endX)})`);
  }
  const autos = plan.gags.filter(
    (g) => g.source === 'auto' && ['hop', 'shift', 'tap', 'lean', 'tickle'].includes(g.kind),
  );
  autos.forEach((g, i) => {
    const next = autos[i + 1];
    if (next && next.fromMs - g.fromMs < LIMITS.autoGapMs)
      problems.push(`automatic actions too close at ${g.fromMs} and ${next.fromMs} ms`);
  });
  if (plan.transitions.filter((t) => t.trigger).length > LIMITS.maxTriggers)
    problems.push('more than 2 mascot-triggered transitions');
  for (const t of times) {
    const bottom = GEOMETRY.headlineTop + headlineLines(t.beat.say) * GEOMETRY.headlineLine;
    const hops = plan.moves.some(
      (m) => m.gait === 'hop' && m.atMs < sh(t.endMs) && m.atMs + m.durationMs > sh(t.startMs),
    );
    // A held prop can rise above the roll when the arm is up (magnifier lens, stamp).
    const holds = plan.props.some((p) => p.fromMs < sh(t.endMs) && p.toMs > sh(t.startMs));
    const top =
      GEOMETRY.mascotTop - (hops ? GEOMETRY.hopRise : 0) - (holds ? GEOMETRY.propRise : 0);
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
