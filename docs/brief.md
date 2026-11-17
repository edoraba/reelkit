# Refattura Reels: initial prompt for Claude Code

Translated from the Italian original on 2026-11-17.

Nov 17, 2026 · @Edoardo

## Role and goal

Build from scratch a repo that automatically generates vertical reels for Instagram and TikTok, covers and carousels for **Refattura**, an Italian SaaS for self-invoicing and re-invoicing (autofatturazione and rifatturazione). The repo must be fully drivable by you (Claude Code): given a topic or a calendar, you produce script, voice, animation, SFX, cover and post text without manual intervention, stopping only at the approval gate before publishing.

Before writing code, read this whole document, then propose a plan for Phase 0 (see the last section) and wait for confirmation. Work in small, verifiable phases: every phase ends with a real render that you can inspect.

The project is personal, run by a single person, on a public GitHub repo. Everything runs locally on a PC or a personal server: no paid services, no account that requires a credit card or a billing profile, no third-party hosting for rendering. Every external service must only be able to refuse requests beyond the free limit, never charge them.

## Style reference

The reference is the Instagram profile match.creativelab: take its visual grammar, not its identity. Palette, mascot, fonts and texts of Refattura must be original. From the analysis of two reels (2:00 and 0:55, 720×1280, 30 fps) these patterns emerge, to be replicated as a system:

- **Kinetic typography.** The speech appears on screen as large text in a heavy grotesque. Two variants: one word at a time in the center, or short lines of 2-4 words with the current word highlighted in a colored box (karaoke style).
- **Rhythm.** A scene change roughly every 2-3 seconds; the background color changes when the concept changes, from a fixed palette of 5-6 colors.
- **Mascot in the center.** A character on a light cone, never static: continuous idle (breathing, blinking), different poses depending on the beat (arms up, pointing, shrugging) and lip sync on the voice.
- **UI mockups above the mascot.** Chat bubbles, notifications, calendars, thermometers, numeric counters on dot grids, A/B cards: they illustrate the sentence in progress.
- **Recurring stickers.** Keyword in a rotated lime box with shadow, pills with labels, stamps in a handwritten font, struck-through and corrected text, speech bubbles.
- **Chapter structure.** Segmented progress bar at the top with the chapter label (e.g. 01/05 IL PROBLEMA), or a fixed header with the reel title.
- **SFX everywhere.** Every entrance, exit and concept has its own sound.
- **Narrative arc.** Hook with a question, problem, development, question to the audience (A or B in the comments), CTA, tagline and logo.
- **Covers.** Handwritten italic kicker at the top (rubric name), huge title with one highlighted word, central illustration, mascot in a corner. Recurring rubrics and color alternation designed around the feed grid.

## Stack and constraints

| Area | Choice | Notes |
| --- | --- | --- |
| Language | TypeScript strict, pnpm, Turborepo | Prettier, Zod for all schemas |
| Video, covers, carousels | Remotion | Free license valid for individual use |
| Planner and grid preview | Local Next.js + shadcn/ui | No deploy, runs on localhost |
| Script and editorial plan | Claude Code itself | No LLM API calls from the code |
| Voice | Gemini TTS (gemini-3.1-flash-tts-preview) on the Gemini API free tier | Google AI Studio key without billing: beyond the limits it answers 429, no charge possible. Model in preview: offline fallback Kokoro and Piper |
| Word timestamps | whisper.cpp via `@remotion/install-whisper-cpp` | Local, `medium` or `small` model for Italian |
| Lip sync | Rhubarb Lip Sync, phonetic mode | Fallback: mouth opening from audio amplitude |
| Audio | ffmpeg | Transient analysis, loudness, mix |

Constraints:

- **Cross-platform.** It must run on Windows and on Linux. Pipeline scripts in TypeScript run with `tsx`, no mandatory bash. External binaries (ffmpeg, whisper.cpp, Rhubarb) downloaded by a `setup` script into a git-ignored folder.
- **TTS behind an interface** `TtsProvider` with implementations `gemini-tts`, `kokoro` and `piper`, all free. The provider is chosen from config. If Gemini answers 429 because of the daily limits, the post stays in the queue and retries the next day; do not switch automatically to an offline voice without flagging it, because the quality changes. Timestamps always come from whisper.cpp, so the provider is interchangeable.
- **No secrets in the repo.** Gemini key and Instagram token via environment variables; documented `.env.example`. The Google project used for the key must never have a billing account attached. Note: on the free tier Google may use inputs and outputs to improve its models, which is acceptable for content meant for publication.
- **Determinism.** Same input, same output: every random choice (SFX variants, micro-movements) uses a seed derived from the post id.
- **Files as the source of truth.** No database: all state lives in versioned JSON and Markdown files, which you can read and edit directly.

## Repo structure

Propose this structure as a starting point; you can change it with a justification.

```
refattura-reels/
├─ CLAUDE.md                  # operating instructions for you, always up to date
├─ guidelines/
│  ├─ brand.md                # identity, palette, typography, mascot, tone
│  ├─ generation.md           # writing, rhythm, scenes, SFX, cover rules
│  └─ strategy.md             # pillars, rubrics, frequency, audience
├─ .claude/commands/          # slash commands: /plan-quarter, /new-reel, /render, /review
├─ packages/
│  ├─ schema/                 # shared Zod schemas (post, beat, calendar, manifest)
│  ├─ pipeline/               # CLI: tts, align, lipsync, sfx-plan, render, publish
│  └─ video/                  # Remotion project: compositions, scenes, components
│     ├─ brand/               # color tokens, fonts, spacing
│     ├─ mascot/              # SVG rig, poses, mouths, idle animations
│     ├─ scenes/              # parametric scenes (text, mockups, counters, A/B)
│     ├─ stickers/            # lime box, pills, stamps, strike-through, speech bubbles
│     └─ compositions/        # Reel, Cover, CarouselSlide, GridPreview
├─ apps/planner/              # local Next.js: calendar, grid, states
├─ assets/
│  ├─ icons/                  # original SVGs
│  ├─ sfx/                    # CC0 only, with manifest.json
│  └─ music/                  # compatible licenses only, with manifest.json
├─ content/
│  ├─ calendar.json           # 3-month plan
│  └─ posts/<yyyy-mm-dd>-<slug>/
│     ├─ post.json            # state, rubric, format, caption, hashtags
│     ├─ script.json          # beats validated by the schema
│     ├─ voice.wav, words.json, mouth.json
│     ├─ review/              # key frames extracted for the self-review
│     └─ out/                 # reel.mp4, cover.png, slide-01.png...
└─ tools/                     # binaries downloaded by setup (gitignored)
```

## Generation pipeline

Every step is an idempotent CLI command that reads from and writes to the post folder; `/new-reel` runs them in sequence and restarts from the failed step.

1. **Script.** Write `script.json` following `guidelines/generation.md`. The Zod schema must pass; if it fails, fix and revalidate.
2. **Voice.** `pipeline tts` generates `voice.wav` from the concatenated spoken text, with short pauses between beats.
3. **Alignment.** `pipeline align` produces `words.json` with the start and end of every word, and assigns the words to the beats.
4. **Lip sync.** `pipeline lipsync` produces `mouth.json` (mouth shape per time interval).
5. **SFX plan.** `pipeline sfx-plan` resolves the SFX: those declared by the components plus the semantic ones of the beat, applying the mix rules.
6. **Render.** Remotion produces `reel.mp4` (1080×1920, 30 fps, H.264, AAC), `cover.png` and any slides.
7. **Self-review.** Extract one frame per beat plus the first and last frame, look at them and check the checklist below. Also run the listening checks of the SFX section. Fix the script or the parameters and re-render, at most 3 iterations, then report the remaining problems.
8. **Gate.** Set the post state to `ready-for-review`. Publishing happens only after the human moves it to `approved`.

Beat example (you define the final schema in `packages/schema`):

```json
{
  "id": "b07",
  "say": "Quanti soldi perdi ogni anno con le autofatture sbagliate?",
  "chapter": "01 IL PROBLEMA",
  "background": "ink",
  "captionStyle": "karaoke",
  "highlight": ["soldi"],
  "mascot": { "pose": "shrug", "expression": "worried" },
  "scene": { "type": "counter", "from": 0, "to": 2400, "suffix": " €" },
  "stickers": [{ "type": "stamp", "text": "SANZIONE", "at": "soldi" }],
  "sfx": [{ "tag": "cash-register", "at": "soldi" }]
}
```

Time references (`at`) point to words of the speech, never to seconds: the real timings are resolved by the pipeline after the alignment.

Self-review checklist:

- No text outside the safe zones (at the top and bottom Instagram covers part of the frame) or cut off.
- No sticker overlapping the mascot or the subtitles.
- No beat shorter than 0.8 s or longer than 5 s without a visual change.
- Readable text/background contrast on every frame.
- The mascot's mouth is closed when the voice is silent.
- Integrated loudness of the mix around -14 LUFS, measured with ffmpeg.
- The cover is readable even when reduced to a grid thumbnail.

## Mascot, poses and lip sync

The mascot is an SVG rig animated via code, not an image: every part is a separate group with a defined pivot, and Remotion animates it frame by frame. All the illustrations of the project (mascot, icons, mockups) are vector SVGs drawn in the style of the guidelines; no raster image generation in this first version, for consistency and zero cost.

**Rig.** Separate groups for body, head, eyes, eyelids, eyebrows, mouth, left and right arm and forearm, hands, legs. Layer naming convention documented in `guidelines/brand.md`, so that an SVG exported from Figma with those names attaches to the rig without code changes. In Phase 0 you draw a simple provisional mascot (a document/invoice with face, tube arms and legs, thick outline); the definitive one is supplied by the human.

**Animation layers, added together:**

1. **Continuous idle.** Breathing (slight vertical scale on the body), light sway, blinking at irregular but deterministic intervals.
2. **Poses.** A library of named poses (`neutral`, `arms-up`, `point-left`, `point-up`, `shrug`, `thinking`, `wave`, `facepalm`, `celebrate`) defined as segment rotations. The pose change uses a spring with one frame of anticipation and a slight overshoot.
3. **Gestures on emphasis.** On the words in `highlight` the mascot makes a micro-gesture (arm flick, bounce) if the beat does not already specify a pose.
4. **Gaze.** The eyes follow the element entering the scene (mockup, sticker), then go back to the camera.
5. **Expressions.** Combinations of eyebrows, eyelids and resting mouth (`happy`, `worried`, `skeptical`, `surprised`).

**Lip sync.** Rhubarb Lip Sync in phonetic mode (language independent, suitable for Italian) produces the shapes A-H plus X (silence) with timings. Draw an SVG mouth for each shape. Keep each shape for at least 2 frames to avoid flicker and always close the mouth during pauses. If Rhubarb is not available or fails, fall back to a mouth opening proportional to the audio amplitude (`@remotion/media-utils`), with 3 opening levels.

Check the lip sync in the self-review by extracting 10 consecutive frames at a point of speech and one at a point of silence.

## SFX, music and mix

SFX work on two levels, both resolved by the pipeline and not written by hand in the video.

**Component SFX.** Every animated component declares its entrance and exit sounds as tags (lime sticker: `pop`; stamp: `stamp`; dashed arrow: `swish`; strike-through: `marker`; sliding cards: `whoosh-soft`; counter: `tick` at every step; background change: `swoosh`). If you use the component, the sound arrives automatically, synchronized with the animation.

**Semantic SFX.** You choose them in the beat based on the content (`cash-register` on an amount, `notification` on a message, `typing` on a chat, `ding` on an idea, `error` on a penalty), anchored to a word.

**Manifest.** `assets/sfx/manifest.json` lists every file with tag, duration, variants, license, source and `impactMs`: the real impact point, computed with ffmpeg on the first transient. The pipeline aligns the impact to the frame of the event, not the start of the file. An `sfx:index` script analyzes new files and updates the manifest; you propose the tags without being able to listen, based on file name, source and waveform, and flag the doubtful ones.

**Mix rules (in the code, not per single video):**

- Voice as the reference, SFX from -12 to -18 dB below the voice, music from -20 to -24 dB with ducking when the voice speaks.
- Variants in deterministic rotation: the same tag does not use the same file twice in a row.
- Maximum density: two SFX do not start less than 250 ms apart; on conflict the semantic one wins.
- Whoosh and swoosh anticipated by 2-3 frames relative to the movement.
- No SFX over a word in `highlight` if it covers its attack.
- Music: one loop per reel, fade in and fade out, chosen by mood tag from the music manifest.

**Listening checks.** You cannot listen directly, but you have four free signals to use in the self-review:

1. **Return transcription.** whisper.cpp re-transcribes the final mix and you compare the text with the script: skipped words, wrong pronunciations (TD17, acronyms) or speech covered by SFX and music show up as differences.
2. **Spectrogram.** ffmpeg generates the spectrogram of the track with the beat marks overlaid; you look at it like a frame to check density, ducking and synchronization.
3. **Second opinion.** Send the wav to Gemini (free tier, same key without billing) with precise questions about the naturalness of the voice and the coherence of the SFX, and evaluate the answer.
4. **SFX validation.** A local CLAP model verifies that every file of the library sounds like the tag you assigned to it.

On the first reels the listening judgment stays with the human; every recurring feedback from them becomes a rule in `guidelines/generation.md`.

## Planner, covers, grid and carousels

**Quarterly plan.** `/plan-quarter` reads `guidelines/strategy.md` and writes `content/calendar.json` with 13 weeks of posts: date, format (reel or carousel), rubric, topic, hook, dominant cover color. It balances the rubrics, avoids repeated topics and alternates the colors so that every block of 3 consecutive posts in the grid is varied. It creates a folder for each post with `post.json` in the `idea` state.

**Post lifecycle:** `idea` → `scripted` → `rendered` → `ready-for-review` → `approved` → `published`, plus `rejected` with a note from the human telling you what to redo. You can move a post forward only up to `ready-for-review`.

**Planner app** (`apps/planner`, Next.js on localhost): 3-month calendar view with a colored state per post; post detail with reel player, cover, caption and readable script; approve, reject with a note, and move date buttons, which edit the JSON files directly. The app generates nothing: generation stays in the commands that you run.

**Grid preview.** `GridPreview` Remotion composition and app view showing the next 12 covers in the profile's 3-column grid, with the crop format that Instagram uses for the grid. It serves to check the alternation before approving.

**Cover generator.** `Cover` composition at 1080×1920 with a template per rubric: handwritten kicker with the rubric name, large title with one highlighted word, central SVG illustration, mascot in a corner with pose and expression consistent with the topic. Keep text and subjects in the central zone that survives the grid crop. The cover is also the first frame of the reel, so it does not need to be set separately.

**Carousels.** `CarouselSlide` composition at 1080×1350 that reuses scenes, stickers and mascot; every slide is a static beat. Segmented progress bar and numbering (01/05) as in the reels.

**Post text.** For every post you write in `post.json` the caption (hook in the first line, at most 3 short paragraphs, closing question), 3-5 relevant hashtags and an optional first comment.

**Publishing (last phase).** A `publish` script that, for `approved` posts with a past date, publishes via the Instagram Graph API (Business or Creator account) and writes the outcome in `post.json`; launched by cron on Linux or Task Scheduler on Windows. Check in the current documentation whether the API accepts direct file upload; otherwise use the public URL of the file in the GitHub repo. TikTok later: its API requires an app audit to publish publicly.

## Guidelines to write

In Phase 0 you write a draft of the three files in `guidelines/` and submit it to the human before using it. They are your source of rules: every generation re-reads them, and every recurring feedback from the human becomes a rule written here.

**brand.md**

- Palette: 5-6 colors derived from the existing OKLCH tokens of Refattura (ask the human for them if they are not in the repo), with explicit roles: backgrounds, highlight accent, ink, paper. Allowed text/background pairs with verified contrast.
- Typography: DM Sans (already in the brand) in the heaviest weights for titles and subtitles, DM Mono for numbers and data, an OFL-licensed handwritten font for kickers and stamps. Typographic scale in pixels for the 1080×1920 format.
- Mascot: personality (e.g. a bit cynical about bureaucracy, always on the user's side), allowed poses and expressions, SVG layer naming, what it must never do.
- Illustration style: thick uniform outline, flat fills, 2-3 colors per object, rounded corners, no gradients or realistic shadows; shadows only as a solid offset.
- Tone of voice: Italian, using "tu", direct and ironic about tax bureaucracy but never about the reader; no useless jargon, every technical term (TD17, reverse charge) explained in one sentence.

**generation.md**

- Length: reels from 30 to 90 seconds; hook within the first 2 seconds, always a question or a number.
- Structure: hook, problem, explanation, concrete example, question to the audience, CTA, closing with the logo. 3 to 5 chapters.
- Beats: one idea per beat, 4 to 14 spoken words, every beat with a visual change.
- Writing for the voice: short sentences, numbers written as they must be pronounced, no unexplained acronyms, punctuation that drives the pauses; no em dash in texts.
- Tax accuracy: every regulatory statement must be correct and up to date. If you are not sure, check official sources (Agenzia delle Entrate) and note the source in `post.json`; if you cannot verify, do not use that statement.
- Scene rules: when to use mockups, counters, A/B, stamps; at most 2 simultaneous stickers; only one highlighted word per beat.
- Cover: title of at most 6 words, one highlighted word, kicker = rubric name.

**strategy.md**

- Audience: freelancers, small businesses and accountants who manage autofatture and rifatturazioni (re-invoicing).
- Content pillars (proposal to validate): common mistakes and penalties, deadlines and tax calendar, simple explanations of document types, stories and typical situations, how Refattura solves a concrete problem.
- Rubrics: 4-6 recurring rubrics with name, format, dominant color and frequency.
- Starting frequency: 3 reels and 1 carousel per week, to be confirmed with the human.

## Public repo: what to commit

The repo is public and also contains the generated videos and covers. This imposes precise rules on binary files, licenses and secrets.

| What | In the repo? | How |
| --- | --- | --- |
| Code, schemas, guidelines, `CLAUDE.md` | Yes | Normal |
| `script.json`, `post.json`, `words.json`, `mouth.json`, `calendar.json` | Yes | Normal, they are small and needed to re-render |
| `reel.mp4`, `cover.png`, slides, `voice.wav` | Yes | Git LFS, tracked by `.gitattributes` from the first commit |
| Self-review frames, Remotion cache, `tools/` | No | `.gitignore` |
| OFL fonts (DM Sans, DM Mono, handwritten font) | Yes | With the license file next to them |
| CC0 SFX and music (e.g. Kenney) | Yes | With source and license in the manifest |
| SFX and music with licenses that forbid redistribution of the files (Pixabay, Mixkit and similar) | No | Ignored local folder, manifest with download URLs and a script to download them again |
| Google credentials, Instagram token | Never | `.env` and files outside the repo |

Notes:

- The free Git LFS quota on GitHub is limited: check the current limits and add a script that estimates the space used. If the quota is not enough, move the final renders to GitHub Release assets, one per month, and keep only the links in the repo.
- Separate licenses: code under MIT, while mascot, logo and brand assets remain reserved. Write it in the README and in an `ASSETS-LICENSE` file.
- The calendar and the scripts are publicly visible before publication: choice confirmed by the human, everything stays in the public repo. A private repo for `content/` is not needed.
- Before every commit check that no files over 50 MB enter outside LFS and no file that matches secret patterns.

## Development order

Proceed one phase at a time. A phase is closed only when the acceptance criterion is verified on a real render and the human has seen it.

1. **Phase 0, foundations.** Monorepo, `CLAUDE.md`, `setup` script for the binaries, Git LFS configured, drafts of the three guidelines, provisional mascot. *Acceptance:* `pnpm setup` works on Windows and Linux; a 5-second render with logo and animated text.
2. **Phase 1, voice and text.** TTS providers (Google Chirp and Kokoro), alignment with whisper.cpp, single-word and karaoke subtitles, background changes per beat, chapter header or bar. *Acceptance:* a 30-second reel from a `script.json` written by you, with words synchronized within 1 perceptible frame.
3. **Phase 2, mascot.** Rig, idle, pose library, expressions, gaze, lip sync with Rhubarb and fallback. *Acceptance:* the same reel with the mascot speaking, changing pose on the beats and closing its mouth in the pauses.
4. **Phase 3, scenes and audio.** Scene library (chat and notification mockups, counters, A/B, calendar), stickers, SFX manifest with `impactMs`, mix rules, music with ducking. *Acceptance:* a complete 60-second reel that passes the self-review checklist and measures about -14 LUFS.
5. **Phase 4, covers and carousels.** Cover templates per rubric, `CarouselSlide`, `GridPreview`. *Acceptance:* 12 covers generated and a preview grid consistent with the alternation rules.
6. **Phase 5, planner.** `/plan-quarter`, `calendar.json`, Next.js app with calendar, detail, approve and reject. *Acceptance:* a 13-week plan generated and 3 posts moved from `idea` to `ready-for-review` with a single command each.
7. **Phase 6, autonomy and publishing.** Robust self-review loop, headless command to generate the week's posts in batch, `publish` script for Instagram. *Acceptance:* an approved post published on a test account.

Working rules valid in every phase:

- Small, descriptive commits in English; no reference to Claude and no co-author in the commit messages.
- No em dash in generated texts and in the documentation.
- Update `CLAUDE.md` at the end of the phase with commands, conventions and decisions taken.
- When a technical choice in this document turns out to be wrong or outdated, stop, explain why and propose the alternative before changing it.
- For every external library or API, check the current documentation instead of relying on memory.
