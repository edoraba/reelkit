# Generation rules

> **DRAFT of 2026-11-17, to be approved.** Re-read this file before every script. Every recurring feedback from Edoardo becomes a rule here, with the date.

## Reel length and structure

- Length from 30 to 90 seconds.
- Hook within the first 2 seconds: always a question or a number.
- Arc: hook, problem, explanation, concrete example, question to the audience (A or B in the comments), CTA, closing with tagline and logo.
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

- Every beat can specify `pose` and `expression`. If it does not, the mascot stays in idle and makes a micro-gesture on the highlighted word.
- Gaze toward the element entering the scene, then back to the camera.
- Mouth closed when the voice is silent.

## SFX

SFX are resolved by the pipeline (`pipeline sfx-plan`), they are not written by hand in the video.

- **Component SFX**, automatic: lime sticker `pop`, stamp `stamp`, dashed arrow `swish`, strike-through `marker`, sliding cards `whoosh-soft`, counter `tick` at every step, background change `swoosh`.
- **Semantic SFX**, chosen in the beat and anchored to a word: `cash-register` on an amount, `notification` on a message, `typing` on a chat, `ding` on an idea, `error` on a penalty.

Mix rules (in the code):

- voice as the reference; SFX from -12 to -18 dB below the voice; music from -20 to -24 dB with ducking when the voice speaks;
- integrated loudness of the mix around -14 LUFS;
- two SFX do not start less than 250 ms apart; on conflict the semantic one wins;
- whoosh and swoosh anticipated by 2-3 frames relative to the movement;
- no SFX over the attack of a highlighted word;
- the same tag does not use the same file twice in a row;
- a single music loop per reel, with fade in and fade out.

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
