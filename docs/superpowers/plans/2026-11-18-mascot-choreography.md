# Mascot Choreography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the mascot alive in reels: automatic base behaviors, authored gags, walking on a bottom lane with front/behind depth, mascot-triggered transitions added to bloom and cut, and one rare alternative scene, all planned in `mascot.json` before rendering.

**Architecture:** A pure planner in `@reelkit/pipeline` turns `script.json` + `words.json` + scene layout data into a validated `MascotPlan` (`mascot.json`). `render` applies the plan's pause stretches to the voice and the timeline, then the `Reel` composition only executes the plan: per frame it resolves a mascot state (position, depth, pose, eyes, lean, gait, gaze, props) and draws scenes in back and front layers with the mascot between or above.

**Tech Stack:** TypeScript 5.9 strict, Zod 4, Remotion 4.0.544, ffmpeg (tools/), tsx CLI, pnpm.

**Spec:** `docs/superpowers/specs/2026-11-18-mascot-choreography-design.md` (approved 2026-11-18). Read it before any task.

## Global Constraints

- Repo text in English; published text (script, captions) in Italian. Never the em dash (U+2014): the pre-commit guard blocks it.
- No Claude/Anthropic references and no `Co-Authored-By` in commits. Small commits, conventional prefixes.
- Determinism: every random choice through `seededRandom(postId, ...)` from `@reelkit/schema`.
- Testing per CLAUDE.md: no test framework, no TDD scaffolding. Every task verifies with `pnpm typecheck`, CLI runs on the TD17 post and real renders/frames (half size: `--scale 0.5`). "Verify" steps below give the command and what to look for.
- Colors only from `@reelkit/brand` palettes; mascot keeps graphite outline + white sticker border; motion on twos; edges boil.
- Character: dot eyes, no eyebrows, never mirrored horizontally (body text "REFATTURA" and logo).
- Lane: feet line y 1634 (frame px); standing feet center x 160 to 860; beyond only while walking or in `pull`. Mascot top never above y 1040 except held props, which must still clear the headline box.
- Limits: at most 1 automatic action per 1500 ms; none within 300 ms of a highlighted word's start; gaze returns to camera after 600 ms; long speech stretch = over 2000 ms; at most 1 side-motif interaction per scene; at most 2 mascot-triggered transitions per reel, at most 1 `pull`; at most 1 alternative scene per reel; trigger gesture starts at least 12 frames before the transition; pause stretch at most 400 ms per scene change.
- Bloom and cut stay the default alternation; triggers only decorate them, `pull` is the only new kind.

## Review Focus

- A reel whose beats all share one palette (no scene change): planner must still produce an alive mascot and zero transitions, no crash. Pinned in Task 5.
- A script asking for `water`/`hide`/`stamp` in a scene whose layout has no matching target: `pipeline mascot` must fail naming the beat and the missing target, not render something wrong. Pinned in Task 5.
- Pause stretch changes the reel length: audio and video must end together and every later caption must shift by the same amount. Pinned in Task 6.
- Re-running `pipeline mascot` and `render` must give byte-identical `mascot.json` and the same frames (idempotent, stretch applied only at render). Pinned in Tasks 5 and 6.
- Held props raised by `point`/`inspect` near a 4-line headline: the overlap check must use the prop box, not only the body. Pinned in Task 5.

---

## File Structure

| File                                                                                                  | Responsibility                                                                                                             |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `packages/brand/src/layouts.ts` (new)                                                                 | Data-only scene layouts per palette: office object, motif spots with depth, lane footprint and allowed interactions        |
| `packages/brand/src/motion.ts` (new)                                                                  | Shared transition timing (lead and length in frames) used by planner and video                                             |
| `packages/schema/src/script.ts`                                                                       | Beat gains `mascot.action`, `mascot.at`, `mascot.scene`, optional `mascot.pose`, `transition.trigger`; script-level limits |
| `packages/schema/src/mascot.ts` (new)                                                                 | `MascotPlan` schema and types                                                                                              |
| `packages/schema/src/timeline.ts`                                                                     | `ReelTimeline` gains optional `mascot: MascotPlan`                                                                         |
| `packages/pipeline/src/mascot/plan.ts` (new)                                                          | Pure planner: auto layer, gags, lane, depth, triggers, stretches, checks                                                   |
| `packages/pipeline/src/audio/stretch.ts` (new)                                                        | Insert silences into a WAV, shift timings                                                                                  |
| `packages/pipeline/src/post/post.ts`, `src/cli.ts`                                                    | `pipeline mascot <id>`; render applies stretch and passes the plan                                                         |
| `packages/video/src/mascot/rig.ts`, `InvoiceRoll.tsx`, `poses.ts`, `gait.ts` (new), `props.tsx` (new) | Rig aligned to brand.md, two-segment legs, walk/hop, eyes, lean, hand props, new poses                                     |
| `packages/video/src/mascot/choreo.ts` (new)                                                           | `mascotAt(plan, frame, fps)`: plan to per-frame state                                                                      |
| `packages/video/src/mascot/scenes/` (new)                                                             | Alternative scene registry and `Reading`                                                                                   |
| `packages/video/src/lab/cutouts/PaletteBoard.tsx`                                                     | `PaletteBackdrop` renders from `sceneLayouts`, by layer, with object hiding and motif reactions                            |
| `packages/video/src/lab/cutouts/transitions.tsx`                                                      | `PaperIn`: bloom origin, cut line start, `decor` flag, new `pull` kind                                                     |
| `packages/video/src/compositions/Reel.tsx`, `compositions/reel/MascotLayer.tsx` (new)                 | Execute the plan with layered scenes                                                                                       |
| `packages/video/src/lab/ChoreoLab.tsx` (new)                                                          | Behaviors, gags and triggers on loop for review                                                                            |
| `docs/decisions.md`, `guidelines/brand.md`, `guidelines/generation.md`, `CLAUDE.md`                   | Record D-032, rig table, script fields, commands                                                                           |

---

### Task 1: Scene layout data with depth and lane footprints

**Files:**

- Create: `packages/brand/src/layouts.ts`, `packages/brand/src/motion.ts`
- Modify: `packages/brand/src/index.ts`, `packages/video/src/lab/cutouts/PaletteBoard.tsx` (LAYOUTS become a renderer of `sceneLayouts`), `packages/video/src/compositions/Reel.tsx` (LEAD from `transitionTiming`)

**Interfaces:**

- Produces (brand):
  - `type MotifKind = 'frond' | 'blob' | 'kelp' | 'starBloom' | 'spiral' | 'sun' | 'waveBand' | 'palmette'`
  - `type Interaction = 'lean' | 'tickle' | 'hide' | 'water'`
  - `interface MotifSpot { id: string; kind: MotifKind; x: number; y: number; params: Record<string, number | string>; color: 0 | 1 | 2; start: number; depth: 'back' | 'front'; lane?: { from: number; to: number; interactions: Interaction[] } }`
  - `type OfficeObjectKey = 'calculator' | 'scissors' | 'stapler' | 'binders' | 'stamp' | 'pencil' | 'envelope' | 'coins' | 'calendar' | 'coffee' | 'magnifier' | 'note'`
  - `interface SceneLayout { object: OfficeObjectKey; objectAt: { x: number; y: number; scale: number }; motifs: MotifSpot[]; sample: { headline: string; mark: number } }`
  - `const sceneLayouts: Record<CutoutPaletteKey, SceneLayout>`
  - `const transitionTiming: Record<'bloom' | 'cut' | 'collage' | 'star' | 'pull', { lead: number; frames: number }>` with bloom `{10, 20}`, cut `{14, 28}`, collage `{10, 24}`, star `{10, 20}`, pull `{16, 36}`
- Produces (video): `PaletteBackdrop: React.FC<{ p: CutoutPalette; idSuffix?: string; layer?: 'all' | 'back' | 'front'; hideObject?: boolean; reactions?: Array<{ motifId: string; kind: Interaction; frame: number }> }>`; `layer='front'` draws only front motifs on a transparent background.

- [ ] **Step 1:** Move every motif and object placement of the current `LAYOUTS` into `sceneLayouts` with identical values; tag bottom side motifs (y >= 1500) `front` when they sit at the lane edges and give them `lane` footprints from their x extent; top motifs `back`.
- [ ] **Step 2:** Rewrite `LAYOUTS`/`PaletteBackdrop` to render from `sceneLayouts` (kind to component map), honoring `layer`, `hideObject`, `reactions` (a reaction bends or nudges the motif for about 20 frames from `frame`).
- [ ] **Step 3:** Verify: `pnpm typecheck` passes; `cd packages/video && pnpm exec remotion still CutoutPalettes out/review/palettes-check.png --frame=84 --scale=0.5` matches the committed `palettes.png` by eye (same motifs, same places).
- [ ] **Step 4:** Commit `refactor(brand,video): scene layouts as data with depth and lane footprints`.

### Task 2: Script fields and MascotPlan schema

**Files:**

- Modify: `packages/schema/src/script.ts`, `packages/schema/src/timeline.ts`, `packages/schema/src/index.ts`
- Create: `packages/schema/src/mascot.ts`

**Interfaces:**

- `MascotAction = z.enum(['stamp', 'type', 'send', 'inspect', 'point', 'water', 'hide'])`; `AltScene = z.enum(['reading'])`; `Trigger = z.enum(['scissors', 'blow', 'pull'])`
- `Beat.mascot` becomes `{ pose?: string; action?: MascotAction; at?: string; scene?: AltScene }`; `Beat.transition?: { trigger: Trigger }`
- Script refine errors: `at` not in `say` (use `holdsHighlight`), more than one beat with `scene`, more than 2 triggers, more than one `pull`, a trigger on the first beat.
- `MascotPlan` (`mascot.ts`), all times in the final (stretched) timeline except `stretch`:
  - `postId`, `stretch: Array<{ atMs: number; addMs: number }>` (original voice time)
  - `moves: Array<{ atMs; durationMs; x; gait: 'stand' | 'walk' | 'hop'; depth: 'front' | 'behind' }>`
  - `cues: Array<{ atMs; pose: string; eyes: Eyes; lean: number }>`
  - `gaze: Array<{ atMs; target: 'camera' | 'headline' | 'label' | { x: number; y: number } }>`
  - `props: Array<{ fromMs; toMs; hand: 'left' | 'right'; prop: PropKind }>`
  - `gags: Array<{ fromMs; toMs; kind: string; source: 'auto' | 'script'; beat: string; target?: string; sfx?: string }>` (`sfx`: tag for the future `sfx-plan`, e.g. `stamp`, `typing`, `swish`)
  - `transitions: Array<{ beat: string; kind: 'bloom' | 'cut' | 'pull'; trigger?: Trigger }>`
  - `alternate?: { beat: string; scene: AltScene }`
- `ReelTimeline.mascot?: MascotPlan`

- `Eyes = z.enum(['open', 'happy', 'wide', 'closed', 'half'])`, `PropKind = z.enum(['scissors', 'stamp', 'calculator', 'magnifier', 'letter', 'wateringCan', 'sheet'])` in `mascot.ts`, exported with their types; the video package imports them (Task 3).

- [ ] **Step 1:** Implement the schemas.
- [ ] **Step 2:** Verify: `pnpm typecheck`; a tsx scratch run parses the TD17 `script.json` unchanged (all new fields optional) and rejects a copy with two `scene` beats and one with `at: "parola"` absent from `say`, printing the Zod messages.
- [ ] **Step 3:** Commit `feat(schema): mascot actions, triggers, alternative scenes and the mascot plan`.

### Task 3: Rig aligned to brand.md, legs, eyes, lean, hand props

**Files:**

- Modify: `packages/video/src/mascot/rig.ts`, `InvoiceRoll.tsx`, `poses.ts`, `guidelines/brand.md` (layer table)
- Create: `packages/video/src/mascot/gait.ts`, `packages/video/src/mascot/props.tsx`

**Interfaces:**

- `RIG_LAYERS` = brand.md table ids plus `roll`, `shin-l`, `shin-r`, `prop-l`, `prop-r`; remove `pupil-*`, `lid-*`, `brow-*`. Same ids added to the brand.md table.
- Consumes: `Eyes`, `PropKind` from `@reelkit/schema` (Task 2).
- `interface LegPose { l: [hip: number, knee: number]; r: [hip: number, knee: number]; lift: number }` (degrees, px)
- `gait.ts`: `walkCycle(phase: number): LegPose` (phase 0..1, one step per half cycle, on twos by the caller), `standLegs(): LegPose`, `hopAt(t: number): { lift: number; squash: number }` (t 0..1)
- `props.tsx`: `HandProp: React.FC<{ kind: PropKind; p: CutoutPalette; frame: number }>` drawn in hand coordinates.
- `InvoiceRoll` new optional props: `eyes?: Eyes`, `lean?: number` (degrees, tilts the body over the feet), `legs?: LegPose`, `hold?: { left?: PropKind; right?: PropKind }`, `palette?: CutoutPalette` (prop colors). Existing props unchanged.
- `poses` gains `point`, `shrug`, `think`, `hold`, `lean`, `hide`, `type`, `stamp`, `walk`, `push`, `pull`.

- [ ] **Step 1:** Align `rig.ts` and the brand.md table; keep the ids used by `InvoiceRoll` groups identical to the table.
- [ ] **Step 2:** Implement legs (hip and knee segments, feet), `gait.ts`, eyes, lean, the new poses and `HandProp` with the cut-paper look (outline, palette colors, boil inherited from the mascot filter).
- [ ] **Step 3:** Create a still `MascotPoseSheet` in `packages/video/src/lab/ChoreoLab.tsx` (grid: every pose x eyes, a row of props, a walk cycle strip, a hop strip) registered in `Root.tsx`.
- [ ] **Step 4:** Verify: `pnpm typecheck`; `pnpm exec remotion still MascotPoseSheet out/lab/mascot-poses.png --scale=0.5`; look: no mirrored text, no eyebrows, feet planted in stand, props in the hands at every pose.
- [ ] **Step 5:** Commit `feat(video): mascot legs, eyes, lean, hand props and new poses`.

### Task 4: Voice stretch

**Files:**

- Create: `packages/pipeline/src/audio/stretch.ts`

**Interfaces:**

- `shiftMs(ms: number, stretch: Array<{ atMs: number; addMs: number }>): number` (adds every `addMs` whose `atMs <= ms`)
- `stretchVoice(input: string, output: string, stretch: Array<{ atMs: number; addMs: number }>): { durationMs: number }` (ffmpeg: atrim segments, silence of `addMs` between, concat; same sample rate; empty stretch copies the file)

- [ ] **Step 1:** Implement both.
- [ ] **Step 2:** Verify with a scratch run on the TD17 voice, stretch `[{ atMs: 5130, addMs: 400 }]`: output duration = input + 400 ms (ffprobe); silencedetect shows the pause after 5.13 s longer by about 0.4 s; `shiftMs(4000)` = 4000, `shiftMs(5410)` = 5810.
- [ ] **Step 3:** Commit `feat(pipeline): insert silences into the voice and shift timings`.

### Task 5: The planner and `pipeline mascot`

**Files:**

- Create: `packages/pipeline/src/mascot/plan.ts`
- Modify: `packages/pipeline/src/post/post.ts` (`mascotPost`), `packages/pipeline/src/cli.ts` (`mascot` command), `package.json` usage line

**Interfaces:**

- Consumes: `sceneLayouts`, `transitionTiming` (Task 1), `MascotPlan`, `Script` (Task 2), `AlignReport` (existing), `shiftMs` (Task 4).
- Produces: `planMascot(input: { script: Script; report: AlignReport; seed: string }): { plan: MascotPlan; problems: string[] }` (pure, deterministic); `mascotPost(id: string): MascotPlan` (writes `content/posts/<id>/mascot.json`, throws listing `problems` if any).

- [ ] **Step 1:** Scenes and transitions: group beats by palette like `Reel` does; default kinds alternate bloom, cut; apply script triggers; then add seeded triggers up to the limit only where room allows.
- [ ] **Step 2:** Room and stretch: room = silence between the previous beat's last word end and the transition start (first word of the scene minus `lead`); if room is under 12 frames + gesture mouth part (400 ms for `blow`, 0 otherwise), add `stretch` up to 400 ms; if still short, drop the trigger (problem only if the script asked for it, as a warning line, not a failure).
- [ ] **Step 3:** Authored gags from `mascot.action`/`at`: props, poses and the target (motif id with the needed interaction, or the scene's office object kind, which is then reported in `gags[].target` so the video hides the duplicate); missing target = problem `beat bNN: action X needs Y, scene <palette> has none`.
- [ ] **Step 4:** Automatic layer with the Global Constraints limits: beat-start weight shift or hop (seeded, not every beat), highlight micro gesture, gaze to headline at beat start and to label at highlight, back to camera after 600 ms, foot tap in speech stretches over 2000 ms, one side-motif interaction per scene when a `lane` motif is within reach, occasional walk at scene changes choosing `depth` by the motifs crossed; nothing automatic during a script gag.
- [ ] **Step 5:** Alternative scene: copy `mascot.scene` to `alternate`. Every gag gets its `sfx` tag (stamp `stamp`, type `typing`, send `swish`, inspect none, point none, water `water`, hide `whoosh-soft`, triggers `snip`/`puff`/`paper-pull`).
- [ ] **Step 6:** Checks into `problems`: mascot/prop/mark box vs headline box (headline top 480, left 96, right 150, line height 119 px, lines estimated from text width at 112 px) and kicker box (y 418 to 456); standing x outside 160..860; rate limit; trigger and scene counts.
- [ ] **Step 7:** Wire `pnpm pipeline mascot <id>`.
- [ ] **Step 8:** Verify:
  - `pnpm pipeline mascot 2026-11-24-td17-servizi-esteri` prints a summary (moves, gags, triggers, stretches) and writes `mascot.json`; running it twice gives identical files (`git diff --no-index` empty).
  - A scratch copy of the TD17 script with every beat on `blu` plans with zero transitions and at least one automatic action per 5 s.
  - A scratch copy asking `water` in the `notte` scene (kelp only) fails with the beat and target in the message.
  - A scratch plan with `inspect` on the 4-line beat b08 reports no overlap only if the prop stays below the estimated headline bottom.
- [ ] **Step 9:** Commit `feat(pipeline): plan the mascot choreography of a post`.

### Task 6: Render applies the plan

**Files:**

- Modify: `packages/pipeline/src/post/post.ts` (`timelineOf`, `renderPost`)

**Interfaces:**

- Consumes: `stretchVoice`, `shiftMs` (Task 4), `mascot.json` (Task 5).
- Produces: `ReelTimeline` with every time shifted by the plan's stretch, `durationMs` including added silence, `mascot` set; the public voice copy is the stretched file.

- [ ] **Step 1:** If `mascot.json` exists, `renderPost` stretches the voice into `assets/.scratch/<id>/voice.wav`, shifts beats, units and speech, attaches the plan; without it, behavior is unchanged.
- [ ] **Step 2:** Verify: render at `--scale 0.5`; ffprobe shows audio and video durations within 1 frame; extract the frame at the first shifted beat start and see its first word appearing.
- [ ] **Step 3:** Commit `feat(pipeline): render with the stretched voice and the mascot plan`.

### Task 7: Reel executes the plan (lane, depth, gags)

**Files:**

- Create: `packages/video/src/mascot/choreo.ts`, `packages/video/src/compositions/reel/MascotLayer.tsx`
- Modify: `packages/video/src/compositions/Reel.tsx`, `packages/video/src/components/RevealText.tsx`, `packages/video/src/highlights/Highlight.tsx` (label `pulse`)

**Interfaces:**

- `mascotAt(plan: MascotPlan, frame: number, fps: number): { x: number; depth: 'front' | 'behind'; pose: PoseName; eyes: Eyes; lean: number; legs: LegPose; lift: number; squash: number; gaze: { x: number; y: number }; hold: { left?: PropKind; right?: PropKind } }` (eases moves and gaze, gait phase on twos)
- `MascotLayer: React.FC<{ plan: MascotPlan; speech: TalkSpan[]; p: CutoutPalette; seed: string }>` (InvoiceRoll positioned so feet center = `x`, feet on y 1634)
- `Highlight` label: `pulse?: number` (frames since a stamp impact; scale bump over 6 frames); `RevealWord.highlight.pulseAt?: number`
- `Reel` draws, per scene: `PaperIn` with `layer='back'` backdrop, then the mascot if `depth === 'behind'`, then `PaperIn` with `layer='front'` backdrop and `decor={false}`, then the mascot if `front`; headlines and kicker above all. Scenes with a gag on an office object pass `hideObject`; side-motif gags and auto interactions pass `reactions`.

- [ ] **Step 1:** Implement `choreo.ts`, `MascotLayer`, layered drawing in `Reel`, label pulse, object hiding and reactions.
- [ ] **Step 2:** Without a plan, `Reel` keeps today's behavior (static center mascot).
- [ ] **Step 3:** Verify: `pnpm pipeline mascot` + `pnpm pipeline render 2026-11-24-td17-servizi-esteri --scale 0.5`; frame sheet around each gag and each walk; the mascot passes behind a front kelp and in front of it later; no prop over the headline.
- [ ] **Step 4:** Commit `feat(video): reel follows the mascot plan with lane, depth and gags`.

### Task 8: Mascot-triggered transitions

**Files:**

- Modify: `packages/video/src/lab/cutouts/transitions.tsx`, `packages/video/src/compositions/Reel.tsx`

**Interfaces:**

- `PaperIn` new props: `origin?: { x: number; y: number }` (bloom center, default 880,320), `lineFrom?: { x: number; y: number }` (cut line starts here and runs to the far edge), `decor?: boolean` (accent layers and cut line, default true), `side?: 'left' | 'right'` (for `pull`); new kind `'pull'`: the incoming scene arrives as a sheet with a torn, boiling leading edge, wobbling, over `transitionTiming.pull.frames`, never a rigid translation.
- Reel maps `plan.transitions`: `blow` = bloom with `origin` at the mascot mouth; `scissors` = cut with `lineFrom` at the scissors tip; `pull` = kind `pull` with `side` the mascot walks out to.

- [ ] **Step 1:** Implement the props and the `pull` kind; the lab `TransitionReel` keeps rendering as before.
- [ ] **Step 2:** Verify: render `CutoutTransitions` at `--scale 0.5` (unchanged look); render the TD17 reel with a script trigger of each kind on a copy; frames at transition start, middle and end; `pull` must not read as a slide (edge torn, sheet wobbling, mascot pulling).
- [ ] **Step 3:** Commit `feat(video): mascot-triggered bloom, cut and the pulled sheet`.

### Task 9: Alternative scenes and `reading`

**Files:**

- Create: `packages/video/src/mascot/scenes/registry.ts`, `packages/video/src/mascot/scenes/Reading.tsx`
- Modify: `packages/video/src/compositions/reel/MascotLayer.tsx`

**Interfaces:**

- `interface AltSceneProps { p: CutoutPalette; talk: TalkSpan[]; durationInFrames: number; seed: string }`
- `ALT_SCENES: Record<AltScene, React.FC<AltSceneProps>>` with `reading`: glasses on, holding a sheet, eyes following lines, mouth on the speech stretches.
- MascotLayer: during `plan.alternate` the standard mascot flips (horizontal squash to 0 over 4 frames, never mirrored) into the set piece and back at the end.

- [ ] **Step 1:** Implement registry, `Reading`, flip in and out.
- [ ] **Step 2:** Verify: a TD17 copy with `mascot.scene: "reading"` on b04, render at half size, frames at flip in, middle, flip out.
- [ ] **Step 3:** Commit `feat(video): alternative mascot scenes, reading`.

### Task 10: ChoreoLab and the TD17 reel

**Files:**

- Modify: `packages/video/src/lab/ChoreoLab.tsx` (the spec calls it `MascotLab`; renamed because `lab/mascots/MascotLab.tsx` exists; add the `ChoreoLab` composition: each gag, the auto behaviors and the three triggers on loop from hand-written plans), `packages/video/src/Root.tsx`, `packages/video/package.json` and root `package.json` (`render:choreo`), `content/posts/2026-11-24-td17-servizi-esteri/script.json` (a few gags and one trigger), `docs/decisions.md` (D-032), `guidelines/generation.md` (script fields and limits), `guidelines/brand.md` (mascot behavior rules), `CLAUDE.md` (commands and phase table)

- [ ] **Step 1:** Implement `ChoreoLab` and `render:choreo` (half size).
- [ ] **Step 2:** Add to the TD17 script: `type` at "120" on b05, `send` at "SDI" on b06, `point` on b08, `scissors` trigger on b05; re-run `mascot` and render at half size, then full size.
- [ ] **Step 3:** Verify: frame sheet per beat; loudness and durations with ffprobe; send `choreo` and the reel to Edoardo.
- [ ] **Step 4:** Record D-032 and the guideline/CLAUDE.md updates; commit `feat(video): choreography lab and TD17 with mascot actions` and `docs: record the mascot choreography`.
