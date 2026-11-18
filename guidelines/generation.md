# Generation rules

> **DRAFT of 2026-11-17, to be approved.** Re-read this file before every script. Every recurring feedback from Edoardo becomes a rule here, with the date.

## Reel length and structure

- Length from 30 to 90 seconds.
- Hook within the first 2 seconds: always a question or a number.
- Arc: hook, problem, explanation, concrete example, question to the audience (A or B in the comments), CTA, closing with tagline and logo.
- The CTA points to the site: "refattura.it" on screen, spoken "refattura punto it" (the pronunciation pass does it). Never "link in bio" (Edoardo, 2026-11-18).
- 3 to 5 chapters, each with a short uppercase label (`01 / 04 · IL PROBLEMA`) in the top bar. Alternatively a fixed header with the reel title, for reels under 40 seconds.

## Beats

- One idea per beat, 4 to 14 spoken words.
- Every beat has a visual change (scene, mockup, sticker, pose or background).
- No beat shorter than 0.8 s or longer than 5 s without a visual change.
- Scene change roughly every 2-3 seconds; the background changes only when the concept changes.
- Time references (`at`) always point to spoken words, never to seconds.

## Writing for the voice

- Short sentences, at most one subordinate clause.
- Numbers written as they are pronounced when needed ("duemilaquattrocento euro" in the speech, "2.400 €" on screen).
- No unexplained acronyms. First time: "il TD17, cioè l'autofattura per i servizi dall'estero" (TD17, i.e. the autofattura for services from abroad).
- Punctuation drives the pauses: full stop for a full pause, comma for a breath.
- Never the em dash, neither in the speech nor on screen.
- Use "tu" (informal you), direct tone, irony about bureaucracy and never about the reader.

## Tax accuracy

- Every regulatory statement must be correct and up to date at the publication date.
- If you are not sure, check official sources (Agenzia delle Entrate: regulations, circulars, technical specifications of the electronic invoice) and note source and verification date in `post.json`.
- If you cannot verify, do not use the statement.
- Never promise savings or tax outcomes; numeric examples are clearly marked as examples.

## On-screen text

- Single word in the center for hooks and impact sentences; karaoke lines of 2-4 words with the current word highlighted for explanations.
- Only one highlighted word per beat (`highlight`), in the rotated lime box.
- The highlighted word never wraps onto a line apart from the punctuation that follows it.

## Scenes and stickers

| Scene                             | When                                                       |
| --------------------------------- | ---------------------------------------------------------- |
| Chat or notification mockup       | A person writes, a message arrives, a supplier replies     |
| Counter on a dot grid             | An amount, a number of invoices, a penalty                 |
| A/B cards                         | Comparison between two choices, question to the audience   |
| Calendar                          | Deadlines, dates, "by day X"                               |
| Stamp                             | A clear outcome: SANZIONE (penalty), OK, SCADUTA (expired) |
| Struck-through and corrected text | A common mistake followed by the right version             |

- At most 2 simultaneous stickers.
- No sticker over the mascot or over the subtitles.
- Mockups above the mascot, never behind.

## Mascot in the beat

The mascot is planned by `pnpm pipeline mascot <id>` (D-032): an automatic layer keeps it alive (weight shifts, hops, a look at the headline and the label, a reaction on the highlighted word, a foot tap in long stretches, a walk or a lean on a side motif now and then). The script adds only what the automatic layer cannot know:

- `mascot.pose`: `neutral`, `arms-up`, `wave`, `point`, `shrug`, `think`, `hold`, `lean`, `lean-r`, `hide`, `type`, `stamp`, `walk`, `push`, `pull`. Without one the beat goes back to idle.
- `mascot.action` (and optionally `mascot.at`, a word of the beat): `stamp` on an outcome, `type` on an amount, `send` when something goes to the SDI or to someone, `inspect` on a check, `point` at a key line, `water` and `hide` with a side motif of the scene (the planner refuses them when the scene has none). At most one action per beat, a few per reel.
- `transition.trigger` on the first beat of a scene: `scissors` (cut), `blow` (bloom), `pull` (the mascot runs across pulling the new sheet). At most 2 per reel, at most one `pull`, never on the first beat; without room the planner falls back to the plain transition and says so.
- `mascot.scene`: a rare alternative scene for one beat (`reading`); at most one per reel.
- Mouth closed when the voice is silent; the mascot, its props and its marks never touch the headline.

## SFX

Sound is planned by `pnpm pipeline sound <id>` (D-034) after the mascot plan, and never written by hand in the script or the video. Every file comes from the CC0 library, with source and author in the manifests: effects in `assets/sfx` (`pnpm pipeline audio-fetch`, Freesound), music in `assets/music`, only loops Edoardo kept by ear (`pnpm pipeline music-test <id>`, then `music-pick`; dropped loops are listed in `assets/music/rejected.json` and never proposed again).

- **Gestures of the script**: the SFX tag of each script gag (`stamp`, `typing`, `swish` on send, `whoosh-soft` on hide, `water`), on the gesture. Typing and pouring stop with the gesture.
- **Transitions**: bloom `paper-swoosh`, cut `snip` then `paper-tear` as the pieces fall, pull `paper-pull`; a blow trigger adds `puff` just before.
- **Automatic layer**: `hop` and `tap` on the automatic hops and foot taps, quieter than everything else.
- **Closing**: `pop` when the card lands, `sting` on the logo.

Mix rules (in the code, `packages/pipeline/src/audio/sound.ts`):

- the voice is the reference: SFX peaks from about 3 dB (script gestures) to 13 dB (automatic layer) under the voice peaks; a quiet file is raised by 12 dB at most;
- every file is placed on its first transient, not on its start;
- two SFX do not start less than 250 ms apart; on conflict the script gesture wins, then the transition, then the automatic layer;
- no SFX over the attack of a highlighted word, except the gesture the script anchors there;
- the same tag does not use the same file twice in a row; variants are seeded by the post id;
- a single music loop per reel (seeded on its own, so it stays the same when the events change), about 7 LU under the voice in the pauses and about 13 LU under it while the voice speaks (ducking of about 6 dB), with fade in and fade out;
- integrated loudness of the mix -14 LUFS (±1), true peak -1.5 dBTP, with one linear gain for the whole reel (two-pass loudnorm), so the balance above is kept.

## Cover

- Handwritten kicker at the top = rubric name.
- Title of at most 6 words, one highlighted word.
- SVG illustration in the center, mascot in a corner with pose and expression consistent with the topic.
- Everything inside the central band that survives the grid crop.
- The cover is the first frame of the reel.
- It must stay readable when reduced to a grid thumbnail.

## Post text

- Caption: hook in the first line, at most 3 short paragraphs, closing question.
- 3 to 5 relevant hashtags.
- Optional first comment (regulatory source, link).

## Self-review

Before moving a post to `ready-for-review`:

- no text outside the safe zones or cut off;
- no sticker overlapping the mascot or subtitles;
- no beat under 0.8 s or over 5 s without a visual change;
- readable contrast on every frame;
- mouth closed in silences (10 consecutive frames in speech, 1 in silence);
- loudness around -14 LUFS measured with ffmpeg;
- return transcription of the mix compared with the script;
- cover readable as a thumbnail.

At most 3 correction iterations, then report the remaining problems.
