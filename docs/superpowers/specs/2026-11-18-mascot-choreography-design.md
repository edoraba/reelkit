# Mascot choreography: design

Date: 2026-11-18. Status: approved by Edoardo on 2026-11-18. Brings forward part of Phase 2 (mascot).

## Intent

In the first real reel (`2026-11-24-td17-servizi-esteri`) the mascot "va abbastanza bene" but is still static: it only opens the mouth, blinks and moves the arms (Edoardo, 2026-11-18). It should feel alive and part of the paper world: move more, interact with what is on screen (the office objects at the top and the motifs on the sides at the bottom: fronds, kelp, blobs), sometimes cause a scene change, and walk along the bottom of the frame, passing in front of and behind the paper pieces to give a 2D sense of depth. Rarely, for some situations, the standard mascot can be replaced by an alternative scene (with reading glasses, writing at a desk, paying with a card terminal).

## Goals

1. An automatic base layer that keeps the mascot alive in every reel without any script work.
2. A short repertoire of authored actions ("gags") that a beat can ask for, with office objects and side motifs.
3. Mascot-triggered transitions, added to the existing bloom and cut, never replacing them.
4. Walking along the X axis in a bottom lane, with depth: in front of some motifs, behind others.
5. A mechanism for rare alternative mascot scenes, with one example built to prove it.
6. Everything deterministic and inspectable before rendering.

## Non-goals

- Phoneme lip sync with Rhubarb (separate Phase 2 item; the mouth keeps opening only inside speech stretches).
- Vertical travel beyond hops, or the mascot entering the headline area.
- Drawing the whole alternative-scene catalogue now (only one example).
- SFX for the new actions (they will declare SFX tags for `sfx-plan` in Phase 3; this project only leaves the hook).

## Anti-goals (failure even if it works)

- A frenetic mascot that steals attention from the headline: text stays the protagonist.
- The mascot covering a headline or the kicker, ever.
- Transitions that read as a slide (Edoardo disliked the slide, 2026-11-18). The lateral transition must look like a paper sheet pulled by hand, with a torn, boiling edge.
- Bloom and cut disappearing or becoming rare: they stay the default.
- Mirrored text: the body carries "REFATTURA" and the logo, so the character is never flipped horizontally.
- Non-deterministic output.

## Constraints

- Cut-paper rules (`guidelines/brand.md`, D-020 to D-028): graphite outline plus white sticker border on the mascot, boiling edges, motion on twos, colors from the current palette, limbs never white.
- Every random choice through `seededRandom(postId, ...)`.
- Files as the source of truth: the plan is a JSON file in the post folder.
- Safe zones (`@reelkit/brand` `safeZone`): headline area from y 480 to about 960, kicker at y 418. The mascot lives below.
- Render cost: checks at half size (about 3 minutes per reel); a dedicated lab composition for the behaviors.
- Remotion 4.0.544; the rig contract in `packages/video/src/mascot/rig.ts` and layer naming in `guidelines/brand.md` must stay valid (Figma export path).

## Approaches considered

- **A. A choreography plan computed before the render (chosen by Edoardo).** A pipeline step writes `mascot.json` per post: position on the lane, facing, depth, poses, expressions, props, gags and mascot-triggered transitions. The video only executes it. Deterministic, readable, checkable (overlaps, rate limits, room before a transition); more structure up front.
- **B. Behaviors computed inside the Remotion composition.** Quick to start, but logic spread through drawing code, hard to plan ahead (a transition gesture must start before the transition) and hard to check.
- **C. Pre-animated clips inserted by the script.** Polished per clip, but rigid: does not follow the voice timings and the hand-over between clip and normal mascot snaps. Kept only for the rare alternative scenes, where a scene drawn on purpose makes sense.

## Design

### 1. Pipeline step and file

`pnpm pipeline mascot <id>` runs after `align` and before `render`. It reads `script.json`, `words.json` and the scene layout of each palette, and writes `content/posts/<id>/mascot.json`, validated by a `MascotPlan` schema in `@reelkit/schema`. `render` passes it to the `Reel` composition with the timeline. All times are milliseconds resolved from words (never written by hand).

`MascotPlan` holds time-ordered tracks:

- `moves`: where the mascot stands and how it gets there: `{ atMs, x, gait: 'stand' | 'walk' | 'hop', depth: 'front' | 'behind', durationMs }`. `x` is the center of the feet on the lane.
- `cues`: pose and expression: `{ atMs, pose, eyes, lean }` (mouth stays driven by the speech stretches).
- `gaze`: `{ atMs, target: 'camera' | 'headline' | 'label' | { x, y } }`, eased.
- `props`: something held in a hand: `{ fromMs, toMs, hand: 'left' | 'right', prop }`.
- `gags`: the actions, automatic or authored: `{ fromMs, toMs, kind, source: 'auto' | 'script', target? }`, for the record and for checks.
- `transitions`: per scene change, `{ beat, kind, trigger?: 'scissors' | 'blow' | 'pull' }`.
- `alternate`: at most one `{ beat, scene }` replacing the standard mascot for that beat.

### 2. Lane and depth

- The lane is the band where the feet stand: y about 1634 (current feet line). Standing positions keep the face clear of the platform's right-hand buttons (`safeZone.right`): feet center from x 160 to 860. Only while walking (and in `pull`) the mascot may cross beyond, out of the frame. Right-side motifs (x 930 to 950 in the layouts) are reached by leaning or reaching, not by standing on them. (Builder check, my call.)
- Each scene is drawn in three layers: **back** (background color, top motifs, office object, side motifs marked `back`), **mascot**, **front** (side motifs marked `front`). Back motifs are always behind the mascot. Every motif in the palette layouts gets a `depth` tag and a lane footprint (x range), so the planner knows what it crosses. Headlines and the kicker stay above everything.
- `depth: 'behind'`: the mascot is drawn under the front motifs, which occlude it as it walks past; `'front'`: drawn above them. Two states are enough. (Builder check, my call.)

### 3. Rig upgrades the plan needs (Phase 2 pieces)

- Legs in two segments with a walk cycle on twos and a hop with squash and stretch; feet planted while standing.
- Facing without mirroring: direction shown by feet, arm swing, gaze and a slight body lean, never by flipping the drawing.
- Hand prop slots (left and right) following the forearm.
- New poses: `point` (at the headline), `shrug`, `think`, `hold`, `lean` (on a motif), `hide` (crouched), `type`, `stamp`, `walk` (arm swing), `push` and `pull` (sheet).
- Expressions without eyebrows: the approved character has dot eyes and no eyebrows (`guidelines/brand.md`, D-016, D-018), so surprise, joy or worry come from the eyes (`open | happy | wide | closed | half`), the mouth, the roll (tilt, lift, squash) and the arms. (Builder check, my call: the character Edoardo approved stays as it is.)
- Contract: `guidelines/brand.md` is the reference. The leftover `brow-l` and `brow-r` ids in `rig.ts` (from the provisional mascot) are removed; new layers (leg segments, hand props) are added to both files with the same names.

### 4. Automatic base layer (planner rules)

Applied everywhere a script gag is not running, rate-limited so it never gets busy (at most one automatic action every 1.5 s, none in the 0.3 s around a highlighted word's attack):

- Beat start: weight shift or a small hop, seeded, not on every beat.
- Highlighted word: micro gesture at its start (nod with happy eyes, or wide eyes with the roll lifting).
- Gaze: toward the headline when a new beat starts, toward the label when it is drawn, back to the camera after about 0.6 s.
- Long speech stretches (over 2 s): foot tap or small step.
- Scene change: sometimes walks to a new spot on the lane, choosing depth by the motifs it crosses.
- Side motifs: at most once per scene, when a motif is within reach on the lane: leans on a frond, a kelp tickles it and it giggles, hides half behind a blob.

### 5. Authored gags

A beat may add `mascot.action` (and optionally `at`, a word of the beat) in `script.json`:

| action    | what happens                                                                                                                                                               |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stamp`   | stamps the ground beside it on the word `at`; on impact the label of the highlighted word thumps (a small squash). Nothing is drawn over the text (my call, builder check) |
| `type`    | holds the calculator and types, the display counts to the amount                                                                                                           |
| `send`    | drops a letter in the envelope, which flies off                                                                                                                            |
| `inspect` | looks through the magnifier at the headline                                                                                                                                |
| `point`   | points at the headline or the word `at`                                                                                                                                    |
| `water`   | waters the side frond, which grows a leaf                                                                                                                                  |
| `hide`    | hides behind the nearest front motif and peeks out                                                                                                                         |

When a gag uses an office object, the mascot holds its own copy as a prop; the scene's top-left office object of the same kind is hidden during that scene, so there are never two. The planner refuses an action whose target does not exist in the scene (for example `water` with no frond) and reports it.

### 6. Mascot-triggered transitions (added, never replacing)

The default rotation stays bloom, cut, bloom, cut. At most 2 scene changes per reel get a mascot trigger:

- `scissors` on a **cut**: the mascot holds scissors and the dashed cut line starts from them.
- `blow` on a **bloom**: the bloom grows from the mascot's mouth instead of the corner motif; the mascot puffs its cheeks first.
- `pull`: a new kind used at most once per reel: the mascot walks out at one side pulling a sheet of the new scene, with a torn boiling edge, and walks back in on it. Not a clean slide: the sheet is paper, it wobbles and its edge is cut by hand.

Timing (builder check, my call):

- The body part of the gesture (arms, props, walking) starts on the last words of the previous beat, at least 12 frames before the transition. While the voice speaks, the mouth keeps talking: speech always wins the mouth.
- Mouth parts of a gesture (the cheek puff of `blow`) happen only in silence.
- In the TD17 reel the silences before scene changes are only 270 to 450 ms, shorter than the transition lead plus a puff. So when a trigger needs it, `pipeline mascot` lengthens that pause by up to 0.4 s: it inserts silence into the voice track at the pause and shifts every later timing in the timeline by the same amount. The pause after a scene's last sentence becomes a little longer, nothing else changes.
- If even with 0.4 s the room is not enough, the planner falls back to the plain bloom or cut and says so.

A beat can ask for a trigger in the script (`transition: { trigger }`); otherwise the planner may add one, seeded, within the limit.

### 7. Alternative mascot scenes

- A beat may set `mascot.scene` (for example `reading`); at most one per reel, checked by the schema.
- Each alternative scene is a component in `packages/video/src/mascot/scenes/`, drawn as a small set piece (desk, glasses, card terminal) with its own mascot pose; it takes the beat's duration and speech stretches, so it still talks.
- Enter and exit with a paper flip (the standard mascot flips into the set piece and back).
- This project builds the mechanism and one example: `reading` (glasses on, holds a sheet, follows the lines with the eyes). `desk` and `pos` are left for later.

### 8. Checks before render

`pipeline mascot` fails, with a readable report, if:

- the box of the mascot, of anything it holds or of any mark it leaves overlaps the headline or kicker box at any frame;
- a standing position puts the face under the right-hand buttons;
- two automatic actions are closer than the rate limit;
- more than 2 mascot-triggered transitions, or more than one alternative scene;
- a gag target is missing in its scene.

### 9. How to verify

- A `MascotLab` composition: every gag, the automatic behaviors and the three triggers on loop, rendered at half size.
- The TD17 reel re-rendered with its plan, at half size first, then full size.
- Frame sheets around each gag and transition.

## Decided

- Approach A (plan file), with clips only for alternative scenes (Edoardo).
- Both automatic and authored actions (Edoardo).
- Mascot transitions add to bloom and cut, never replace them (Edoardo).
- Objects include the side motifs at the bottom (Edoardo).
- Bottom lane with walking on X and front/behind depth (Edoardo).
- Alternative scenes are rare and only prepared now (Edoardo).

## Left to the builder

- Motion curves, timing constants and rate-limit numbers within the limits above.
- Drawing of props, poses and the `reading` set piece in the cut-paper style.
- Which motifs of each palette layout are `front` or `back`, and their lane footprints.
- The exact schema field names inside the shapes described above.
