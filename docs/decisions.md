# Decisions

Log of the choices that complete or change the brief (`docs/brief.md`). Each entry: date, decision, reason. Entries are appended, not rewritten: if a decision changes, a new one is added that supersedes it.

## D-001 Remotion with the free license (2026-11-17)

Remotion's free license applies to companies of up to 3 people **in total** (the headcount of the whole company counts, not only those using Remotion). Edoardo confirms that he is the only one working on Refattura: the free license is valid. If the headcount grows beyond 3 people, reassess (Company License or an MIT engine such as Motion Canvas or Revideo).

## D-002 Fonts: real brand plus playful sets on trial (2026-11-17)

The brief said "DM Sans, already in the brand". The real brand (`refattura/DESIGN.md`) uses Bricolage Grotesque, Inter, DM Mono and Instrument Serif. Default set:

- Bricolage Grotesque 800 for kinetic typography, titles and covers;
- Caveat 700 for kickers and stamps;
- DM Mono for numbers, amounts and chapter labels.

At Edoardo's request, more playful sets stay on trial, modeled on the reference: Gabarito + Shantell Sans, Rubik + Gochi Hand, Baloo 2 + Patrick Hand, Fredoka + Caveat. All OFL-licensed, files and `OFL.txt` in `assets/fonts/`. Compare with `pnpm render:fontlab`; every composition accepts the `fontSet` prop. The final choice is made by looking at the first real reels.

## D-003 TTS: Gemini 3.8 Flash TTS as default, listening test in Phase 1 (2026-11-17)

- `gemini-3.1-flash-tts-preview` from the brief is in preview and the Google documentation asks to migrate to the 3.8 models. `gemini-3.8-flash-tts` is not in preview, is "Free of charge" on the free tier and supports Italian. The model is chosen from config (`GEMINI_TTS_MODEL`).
- Phase 1 of the brief mentions "Google Chirp": it is Cloud Text-to-Speech, which requires a billing account. Discarded.
- In Phase 1: zero-cost listening test on the same text with Gemini 3.8 Flash TTS, 3.8 Flash-Lite TTS, Kokoro and Piper. Edoardo chooses by listening.

## D-004 `pnpm bootstrap` instead of `pnpm setup` (2026-11-17)

`pnpm setup` is an internal pnpm command (it configures `PNPM_HOME` and the user's PATH): a project script with that name would never run. The script that downloads the binaries is called `bootstrap`.

## D-005 Provisional storage on Git LFS (2026-11-17)

Git LFS on the public repo is the **trial solution to get started**. Free limits verified on 2026-11-17: 10 GiB of storage and 10 GiB of bandwidth per month for personal accounts; beyond the limit GitHub blocks instead of charging only if the account's LFS budget is $0 (to be checked in the GitHub billing settings).

If the project works, the architecture moves to a dedicated server (for example Hetzner) with a database and/or an object storage (for example Backblaze B2) for the renders. To make the switch cheap:

- the file paths of a post are resolved in a single pipeline module (from Phase 1), so changing backend touches one place;
- the JSON files stay small and readable, ready to be imported into a database;
- `pnpm lfs:usage` measures usage against the quota.

## D-006 Separate `brand` package (2026-11-17)

The brief put the tokens in `packages/video/brand/`. They live in `packages/brand` because the pipeline also needs them (contrast, cover colors) and so does the Next.js planner, which must not depend on Remotion.

## D-007 Video sources in `packages/video/src/` (2026-11-17)

The `brand`, `mascot`, `scenes`, `stickers`, `components`, `compositions` folders live under `src/`, following the Remotion and TypeScript convention.

## D-008 Remotion public folder = `assets/` (2026-11-17)

Fonts, logo, icons, SFX and music live in `assets/` at the root and Remotion serves them from there (`Config.setPublicDir`). A single place for assets, shared with the pipeline and the planner.

## D-009 TypeScript 5.9 (2026-11-17)

TypeScript 7 (native compiler) is available, but Next.js and part of the ecosystem still use the compiler's JavaScript API. We stay on 5.9; reassess in Phase 5.

## D-010 External binaries (2026-11-17)

- ffmpeg: BtbN static builds, branch n9.0 (win64 and linux64).
- Rhubarb Lip Sync 1.14.0.
- whisper.cpp 1.5.5 via `@remotion/install-whisper-cpp`: prebuilt binary on Windows (no binaries exist beyond 1.6.0), built from source on Linux (needs git, make, g++). Remotion recommends 1.5.5 for token-level timestamps. Default model `medium`.
- Remotion's Chrome Headless Shell via `ensureBrowser()`.

Everything in `tools/` (ignored by git), versions in `tools/versions.json`.

## D-011 Git hooks (2026-11-17)

The pre-commit hook (`scripts/guard.ts`) is installed by `simple-git-hooks` with `preserveUnused`, so as not to delete the Git LFS hooks. `pnpm bootstrap` reinstalls the LFS hooks anyway (`git lfs install --local`).

## D-012 Social colors beyond the app palette (2026-11-17)

Added two colors that the app does not use, to be approved in `guidelines/brand.md`:

- `lime` for the highlight box and the stickers;
- `sky`, a light blue close to the light tone of the logotype, as a secondary light background and as the mascot's limb color (the ink blue disappeared against the blue background).

## D-013 Own visual identity, not that of match.creativelab (2026-11-17, closed by D-015)

Edoardo's feedback on the first render: too many features identical to match.creativelab, and `lime` perhaps too bright for Refattura. No Remotion template or third-party code was used: the resemblance comes from taking literally some signs mentioned in the brief and seen in the reference screenshot (rotated lime box with shadow, segmented bar with label, light cone, dot grid, tube limbs with white hands).

Rule from now on (in `guidelines/brand.md`): take the mechanisms from the reference, never the signs. The new visual direction is to be decided with Edoardo before Phase 1; the Phase 0 demo stays as a technical test of the pipeline, not as a style.

Proposals rendered with `pnpm render:lab` (`packages/video/out/lab/`), all on the same beat:

- **registro**: ruled ledger paper with red margin, document header ("Pag. 1 di 3"), highlighter behind the key word, rubber stamp;
- **quadretti**: squared paper on brand blue, binder tabs per chapter, pen underline;
- **scontrino**: torn receipt on graphite with mono rows, red pen circle, amber stamp;
- **minimal**: flat brand blue, big chapter counter, key word in color, plain label.

A separate sheet compares the lime replacements (yellow marker, light blue marker, pen underline, pen circle, word in color). Mascot limbs are now pen doodles in the `pen` color of each background, with no white hands.

## D-014 Repository language is English (2026-11-17)

Requested by Edoardo. Everything written in the repository is in English (code, identifiers, comments, docs, README, guidelines, CLAUDE.md, decisions, commit messages, branch names and PR text), as stated in the CLAUDE.md rule. Published content stays in Italian (voice scripts, on-screen text, captions, hashtags, cover titles, rubric names, and Italian examples quoted in the guidelines) because the audience is Italian.

## D-015 Visual system: squared paper and receipts (2026-11-17)

Edoardo picked two of the four D-013 proposals and asked to keep both: **quadretti** (squared paper, binder tabs) and **scontrino** (torn receipt strip, mono rows). They alternate inside a reel and across reels, on changing backgrounds (blue, paper, sky, graphite, stamp colors). Key word highlight: yellow marker or pen underline, both kept. The lime box is retired. Details in `guidelines/brand.md`, "Visual system".

The mascot is open again: Edoardo asked for many alternatives, from close to the current invoice sheet to very different ideas, including some derived from the logo (`pnpm render:mascots`).

## D-016 Mascot: the receipt reshaped into an invoice, A4 variant (2026-11-17)

From the 14 candidates Edoardo picked **05 Receipt**, asking to make it read more like an invoice while keeping the dot eyes, the small mouth and the rolled paper on top. `InvoiceRoll` (`packages/video/src/mascot/InvoiceRoll.tsx`) does that: straight edges instead of the torn zigzag, a FATTURA header, table rows with amounts, a blue TOT pill, pen-doodle limbs in the background `pen` color. Four variants are compared in motion with `pnpm render:invoice-roll`: slim (closest to 05), A4 proportions, blue header band, scroll rolled at both ends with a TD17 stamp. The variant choice is still open; the chosen one replaces the provisional `Mascot` and gets the full phase 2 rig.

**Chosen (2026-11-17):** the plain **A4** variant (B), without the blue header band. `InvoiceRoll` now defaults to `a4`. It replaces the provisional `Mascot` in new scenes; the full rig (pose library, expressions, Rhubarb mouths, layer ids from `guidelines/brand.md`) is phase 2 work.

## D-017 Mascot rendering style: sticker (2026-11-17)

Edoardo asked to try the chosen mascot in many rendering styles, white outlines included. `InvoiceRoll` now takes a `look` (colors, stroke widths, cel shading, roll shine), a `layer` (all, fills only, lines only) and SVG `defs`/`filter`, so a style is data and print-like looks are composed from two offset layers. `pnpm render:styles` renders 18 styles: flat outline (today), sticker, soft sticker, white outline, blue invoice, line art, blueprint, cartoon, comic, risograph, watercolor, pencil sketch, rubber stamp, paper cut-out, clay 3D, neon, pixel art, chalk. The style choice is open.

Motion test of the two shortlisted styles (01 flat outline, 02 sticker) on blue, paper and graphite: `pnpm render:style-motion`. On graphite the flat outline disappears into the background while the sticker border keeps the silhouette; on paper the sticker border is subtle and the shadow carries it.

## D-018 Mascot header and full test reels (2026-11-17)

Edoardo asked to replace "FATTURA" with "REFATTURA", to put the logo mark where "N.12" was, both faded, and to keep the blue pill without the "TOT" text. Done in `InvoiceRoll` (`look.headerOpacity`, default 0.4; `LogoMark` moved to `packages/video/src/brand/`).

`TestReel` is the first full reel with placeholder copy (25 s, no audio yet): hook on squared blue paper, problem on a receipt, rule and solution on squared paper with binder tabs, A/B question, close with logo, tagline and CTA. Words appear one by one, the highlighter sweeps and the pen draws, stamps slam in. Rendered with both shortlisted mascot styles to compare them in context: `pnpm render:test-reels`. Copy is placeholder and was kept to statements that are true in general (reverse charge on foreign services is integrated with a TD17); real scripts follow `guidelines/generation.md`.

## D-019 Sticker finish for the mascot (2026-11-17)

After the two full test reels Edoardo chose the **sticker** style (02, closes D-017): graphite outline, white die-cut border (dilate 12 in viewBox units) and a soft shadow, limbs always in ink blue. The border keeps the silhouette on every background, including graphite where the plain outline disappears. `StickerFilter` lives in `packages/video/src/mascot/StickerFilter.tsx`; production scenes use it, the labs keep the other styles for reference.

## D-020 Art direction exploration: simple 2D styles (2026-11-18, open)

Edoardo asked to push the look further, towards Matisse or other simple 2D art, with research and moodboards first. Seven directions, each a moodboard with a sample frame of the same hook and the mascot restyled (`pnpm render:moodboards`, code in `packages/video/src/lab/moodboards/`):

1. Papiers découpés, after Matisse's gouache cut-outs (scissor wobble, gouache grain, organic motifs);
2. Torn paper, after Leo Lionni (torn edges with white fibres, few shapes, empty page);
3. Futurist advertising, after Fortunato Depero for Campari (geometric puppets, blocky tilted type);
4. Playful modernism, after Paul Rand and Bruno Munari (square, circle, triangle, puns, handwritten notes);
5. Memphis Milano, after Sottsass (squiggles, stripes, confetti, hard shadows);
6. Cut-out cinema, after Saul Bass (black, white, one color, jagged cuts);
7. Pictograms, after Isotype (repeated symbols for numbers): a module for data scenes, combinable with any direction.

We take methods, never copy artworks. Choice open.

## D-021 Papiers découpés: animated motifs and backgrounds (2026-11-18, exploring)

Edoardo prefers the Matisse cut-out direction (D-020, moodboard 1) and asked for more backgrounds, more motifs, and real animation of the motifs, not only moves and rotations. `packages/video/src/lab/cutouts/`:

- Motifs are generated from parameters and animated by changing them frame by frame: a frond whose stem grows and bends while leaves sprout and flutter; blobs whose outline keeps changing; a star whose points shoot out and twinkle; coral that branches; a spiral that unrolls; scallop waves that ripple; swallows whose wings change shape; a palmette that opens like a hand; a shape cut along a dashed line, then lifted off the page; a sun with pulsing rays; kelp with a wave travelling up the blade.
- Stop-motion feel: motion runs on twos, and the scissor-cut edge "boils" (the wobble is re-cut every 4 frames with a new noise seed), with gouache grain. The mascot gets the same boiling paper finish.
- Eight backgrounds tested (ultramarine, coral, lemon, emerald, paper, black, collage blocks, kraft) and a 12 s reel where each scene slides in like a new sheet of paper.

`pnpm render:cutouts` renders the motif catalogue, the backgrounds sheet and the reel. Choice of palette, motifs and how far to push the style is open.

## D-022 Cut-paper rules: sticker border, no white, paper transitions (2026-11-18)

Feedback on the cut-paper reel: keep the white sticker border on the mascot, never use a pure white background (cream instead), and drop the sliding transition. The mascot now uses `CutoutStickerFilter` (boiling cut edge plus a sticker border that boils with it); the paper scene became cream; limbs are never white. Four paper transitions replace the slide (`packages/video/src/lab/cutouts/transitions.tsx`, `pnpm render:cutouts`): bloom (layered organic shapes growing out of a motif), cut (dashed scissor line, then the two pieces fall away), collage (stacking sheets with shadows, accent pieces fly off), star (turning cut-paper star iris). Each transition has explicit accent colors that contrast with both scenes. Rules recorded in `guidelines/brand.md`.

## D-023 Cut-paper choices: bloom and cut, outlined sticker mascot (2026-11-18)

Edoardo kept two of the four paper transitions, **bloom** and **cut**, to alternate between scenes (collage and star stay in the code, unused). The cut-paper mascot goes back to the graphite outline under the white sticker border, as in the sticker test reel (D-019): outline, sticker border and limbs all boil with the scissor-cut edge.

## D-024 Headline font for the cut-paper direction: Sour Gummy (2026-11-18)

Edoardo asked whether Bricolage Grotesque suits the cut-paper style. Ten OFL candidates were added to `assets/fonts/` (each with its `OFL.txt`) and compared on the same scene and in a real-size specimen (`pnpm render:cutouts`, `packages/video/src/lab/cutouts/FontTest.tsx`): Bricolage Grotesque, Bricolage with "cut letters" (each letter a slightly rotated, shifted piece with a boiling edge, a treatment that works with any font), Fraunces with the SOFT and WONK axes, Young Serif, Gloock, Instrument Serif (already used by the Refattura app), Bagel Fat One, Gluten, Sour Gummy and Caveat Brush. Choice open.

**Chosen:** Sour Gummy 800 (puffy, friendly, legible at reel size), now the default headline type of the cut-paper scenes. DM Mono stays for numbers and labels.

## D-025 Cut-paper palettes and office objects (2026-11-18, palettes replaced by D-027)

- **Palettes** in `@reelkit/brand` (`paper`, `cutoutPalettes`, draft): six palettes, each with background, text, three motif colors, highlight, limb color, mascot roll and pill colors, bloom transition layers and a dark/light tone for alternation: Blu Refattura, Corallo, Panna, Limone, Smeraldo, Rosa. `pnpm brand:contrast` checks text on background (min 4.5:1, lowest 4.97 on Blu Refattura) and the highlight (marker text 4.5:1, underline visibility 3:1). Coral fails with light text (2.67:1), so Corallo uses dark text. Board: `palettes.png` from `pnpm render:cutouts`.
- **Office objects** as animated cut-paper motifs, asked by Edoardo: calculator (keys press, display counts), scissors (snip), stapler (bites), binders (slide in and lean), rubber stamp (stamps a check), pencil (writes a line), envelope (opens, the letter comes out), coins (drop and stack), calendar page (flips), coffee cup (steams), magnifier (searches), pinned note (flutters). Colors come from the palette. Code in `packages/video/src/lab/cutouts/office.tsx`.

## D-026 Visibility rule for cut pieces (2026-11-18)

- **Problem** (Edoardo): some pieces had the same or a similar color as the background or as the piece under them (for example an emerald piece on ultramarine, 1.03:1) and disappeared.
- **Rule**: a cut piece needs at least 2:1 luminance contrast (WCAG formula) with what it sits on, text 4.5:1. Same color is never allowed. `visibleOn(color, base)` and `MIN_GRAPHIC_CONTRAST` in `@reelkit/brand`.
- **Two ways to apply it**: palettes only list motif colors visible on their background (`pnpm brand:contrast` exits 1 otherwise, and also checks the mascot limbs, roll and pill against the white sheet); pieces that sit on other pieces (calendar header on its page, envelope letter, stamp mark) choose their color at render time with `pickerFor(palette)`: the first preferred color that is visible, otherwise the palette color with the most contrast.
- **Boards**: `visibility.png` (every paper color on every palette, with ratio and verdict) and `objects-palettes.png` (the twelve office objects on the six palettes) from `pnpm render:cutouts`.

## D-027 Cut-paper palettes in Refattura tones only (2026-11-18, palettes to approve)

- **Why**: Edoardo, on the D-025 palettes: too many colors, it looked like a primary school. Stay on the Refattura tones: blues, light blues, violets, whites.
- **Papers** (`paper` in `@reelkit/brand`): blue (`inkBlue` of the app, #0052ff), navy `oklch(26% 0.11 266)` #0b1c58, sky `oklch(75% 0.13 264)` #84acff, ice `oklch(93% 0.035 255)` #d9eaff, violet `oklch(50% 0.22 292)` #6c38d2, lavender `oklch(84% 0.08 292)` #cbc2fb, white, graphite. Coral, cream, lemon, emerald and pink are gone. Stamp green, amber and red stay only on stamps, with their meaning.
- **Six palettes**: Blu Refattura (blue, white text 5.75:1), Notte (navy, white text 15.9:1), Viola (violet, white text 6.7:1) are dark; Azzurro (sky, graphite text 7.9:1), Ghiaccio (ice, graphite text 14.5:1), Lavanda (lavender, graphite text 10.7:1) are light. Every palette passes D-026; the weakest motif is white on sky (2.25:1).
- **Consequences of a single hue family**: luminance is the only separation, so some pairs are forbidden: blue with violet (1.16:1), sky with lavender (1.36:1), white on ice (1.22:1). On Ghiaccio the white sticker border of the mascot barely shows; the graphite outline carries the shape.
- **Transitions**: the bloom layers are no longer written by hand per transition; `bloomLayers(from, to)` picks two layers so that the outer one shows on the old background, the inner one on the outer, and the new background on the inner. The cut line takes the text color of the old scene. Test reel: Blu, Lavanda, Notte, Azzurro, Viola, Ghiaccio (dark and light alternated).
- **Lab**: the motif catalogue and the transition reel now use the palettes; the warm backgrounds sheet (D-021, `CutoutBackgrounds`) stays in code as history but is no longer rendered by `pnpm render:cutouts`.

## D-028 Key word highlight in the cut-paper direction: paper label (2026-11-18)

- **Problem** (Edoardo): white text on the highlight did not read well, the part above the band got lost. The marker band covered only the lower half of the word, so the top of the letters sat on the background: white on ice 1.22:1 (Ghiaccio), white on lavender 1.66:1 (Lavanda), graphite on navy 1.12:1 (Notte). Second defect: the word took the band text color as soon as it appeared, before the band was drawn under it.
- **Fix**: new highlight kind `label` in `Highlight.tsx`: a hand-cut paper strip (irregular corners, slight tilt) behind the whole word, from above the ascenders to below the baseline, and lower when the word has descenders (g, j, p, q, y). All six palettes use it. The word is drawn twice and clipped at the sweep: its own color where the strip has not arrived yet, the band text color where it has.
- **Rule** in `pnpm brand:contrast`: a band (label or marker) needs 4.5:1 between band and text; a `marker` also needs 3:1 between its text color and the background, because the top of the letters stays there.
- **Check**: `highlights.png` (still `CutoutHighlights`, a few seconds to render): every palette headline halfway through the sweep and complete, plus a key word with descenders above another line.

## D-029 TTS providers and the listening test (2026-11-18, voice chosen in D-030)

- **Interface**: `TtsProvider` in `packages/pipeline/src/tts/` with `gemini`, `kokoro` and `piper`. On HTTP 429 Gemini throws `TtsQuotaError`: the post waits for the next day, never a silent switch to an offline voice.
- **Gemini, current docs** (checked 2026-11-18, https://aistudio.google.com/docs/speech-generation): TTS now goes through the Interactions API (`POST v1beta/interactions`): `input` with a `user_input` text, delivery in a `speech_metadata` annotation (`style`), voice in `generation_config.speech_config: [{ voice }]`; the answer is a 24 kHz mono 16-bit WAV in base64 in `steps[].content[]`. Models `gemini-3.8-flash-tts` and `gemini-3.8-flash-lite-tts`, 30 prebuilt voices, Italian supported and detected from the text. Inline tags stay in English (`<short pause>`, `<laugh>`); the style never describes age, gender or accent.
- **Free quota**: Google does not publish the TTS limit; third-party reports say about 10 requests a day. So one request per reel (the whole script, pauses from punctuation and tags), never one per beat, and the listening test keeps existing samples so that it can be spread over several days.
- **Local engines**: Python venv in `tools/tts/` created by `pnpm bootstrap --only tts` (uv, Python 3.12 pinned because kokoro-onnx supports 3.10 to 3.13; `python -m venv` without uv), `piper-tts` 1.8.0, `kokoro-onnx` 0.6.1 with `kokoro-v1.0.onnx` (Apache 2.0). Italian voices: Kokoro `if_sara`, `im_nicola` (graded C by the authors); Piper `paola` medium (CC0 dataset), `riccardo` x_low (M-AILABS dataset, its own license), `serena` high (synthetic dataset, CC-BY-4.0: needs attribution).
- **Listening test**: `pnpm tts:test` runs the same reel-like text through every option, normalized to -16 LUFS, into `packages/pipeline/out/tts-test/index.html`. TD17, SDI and 49,99 are written raw on purpose. First objective check: whisper medium transcribes each sample back.
- **First results** (local engines only, back-transcription): both Kokoro voices are intelligible, with errors on English brand names ("Google It Ads") and on "allo SDI"; Nicola is slower (33 s against 27 s). Piper Paola reads IVA as English letters, loses "Canva o Notion" and turns "Refattura" into "la fattura". Riccardo x_low is low quality: out. Serena puts a question intonation on statements.
- **Local engines rejected** (Edoardo, 2026-11-18, after listening): all five samples are terrible, with an English accent and every Italian word wrong. Not a setup error: the phonemes are Italian (espeak `it`, "refatːˈura"); the voices themselves are weak in Italian (Kokoro is trained almost only on English). Kokoro and Piper stay in the code but are not a production voice and not an automatic fallback: when Gemini is over quota the post waits.
- **Gemini first run**: three requests answered 403 `SERVICE_DISABLED` because the Gemini API of the new Google project was still propagating ("wait a few minutes"); the test keeps the samples it has and a second run fills the gaps.
- **Gemini samples**: 9 of 10 (Charon still answered 403). Back-transcription is clean Italian with the right intonation on questions for all of them; whisper hears "allo SDI" as "allo SD" or "all'OSD" everywhere. Puck, Sadachbia, Zephyr, Leda and Achird (3.8 Flash) are the cleanest; Kore and the Lite Puck slur "con Refattura" into "corre fattura". Duration 28 to 31 s for the same text.
- **Consequence**: whatever the voice, a pronunciation pass before synthesis is needed: brand names, acronyms and amounts written as spoken ("quarantanove euro e novantanove", "il ti di diciassette", "lo SDI" spelled as Edoardo prefers, "Iva" as a word: espeak spells "IVA" letter by letter). The default voice is chosen by Edoardo after the Gemini samples.

## D-030 House voice, pronunciation pass and word alignment (2026-11-18)

- **Voice** (Edoardo, after the listening test): Gemini 3.8 Flash TTS, voice **Puck**, with the house style in `packages/pipeline/src/tts/voice.ts` (friendly, lightly ironic, lively but clear). `GEMINI_TTS_VOICE` and `GEMINI_TTS_MODEL` in `.env` only for experiments. One request per reel.
- **Pronunciation pass** (`spoken()` in `packages/pipeline/src/tts/pronounce.ts`): the screen keeps "TD17" and "49,99 €", the voice reads words. Italian numbers with their elisions and accents (ventuno, ventotto, ventitré, centottanta), amounts ("quarantanove euro e novantanove"), percentages, decimals ("virgola"). Lexicon: TD17 "ti di diciassette", SDI "esse di i" with the article elided ("all'esse di i"), IVA "Iva", P.IVA, F24, PEC. New acronyms go in the lexicon.
- **Screen text and spoken text** (Edoardo: acronyms and numbers still to fix): the first Puck sample was made from the raw text, and the check video showed the spoken forms. Now `speechMap()` splits the screen text into units and pairs each with its spoken words ("TD17," with "ti di diciassette,", "49,99 euro," with "quarantanove euro e novantanove,"; tokens touched by the same rule form one unit). `pnpm pipeline say` synthesizes the spoken form with the house voice; `pnpm pipeline align` takes the screen text and writes both timelines in words.json: `screen` (what captions show) and `words` (what the voice says).
- **Alignment** (`pnpm pipeline align`, `packages/pipeline/src/align/align.ts`): whisper.cpp medium with token-level DTW. Measured on the Puck sample: the token offsets that Remotion's `toCaptions()` uses drift by up to a second, while `t_dtw` marks the end of each token about 0.1 s late; so a word ends at the DTW time of its last token. Heard words are aligned to the script words with a similarity-weighted edit distance (numbers whisper writes as digits are spelled with `spoken()` first, joined with their unit), and words not heard are interpolated. Then every boundary snaps to the pauses measured by ffmpeg (at least 150 ms under -35 dB, pauses less than 80 ms apart merged), preferring boundaries after punctuation; every word lasts at least 80 ms.
- **words.json**: `durationMs`, `screen` (screen units with times and their word range), `words` (word, startMs, endMs, match exact/close/guessed, heard), `pauses` (for the closed mouth and SFX slots), `heardRatio`, `issues` (words to check, the base of the return transcription check).
- **Result on the Puck sample**: 78 words, 97% heard, all pauses on punctuation, no overlaps, shortest word 85 ms. Issues: "allo SDI" heard as "all'OSD", "invii" as "invi" (whisper spelling).
- **Squeezed words** (Edoardo: "integri" lit up a little early): words under 80 ms now share a window with their neighbours only, growing until they fit; before, one squeezed word made the whole stretch between two pauses be shared by length, which threw away the heard times ("integri" moved 0.3 s later with the fix).
- **Check video**: composition `AlignCheck` (voice plus the current word highlighted), rendered at half size in about a minute. Audio with `<Audio>` from `@remotion/media`, which the Remotion docs now prefer to `Html5Audio`.

## D-031 Script schema, post commands and the Reel composition (2026-11-18)

- **script.json** (`Script` in `@reelkit/schema`): `postId`, `kicker` (fixed header of short reels, the rubric name) and beats with `id`, `say` (screen text only: the voice text comes from the pronunciation pass, timings from the alignment), `palette` (cut-paper palette key), `highlight` (one word of `say`, also after an elision: "autofattura" in "l'autofattura") and an optional `mascot.pose`. The schema rejects beats outside 2 to 14 words, highlights that are not in the text and duplicate ids. **post.json** (`Post`): date, status, rubric, title, caption, 3 to 5 hashtags, first comment and the official sources with the date they were checked.
- **Post commands**: `pnpm pipeline tts <id>` (one Gemini request for the whole script, `voice.wav`), `pnpm pipeline align <id>` (`words.json`, screen units tagged with their beat), `pnpm pipeline render <id> [--scale 0.5]` (copies the voice into `assets/.scratch/`, writes the resolved `ReelTimeline` as props, renders `out/reel.mp4`; only a full-size render moves the post to `rendered`).
- **Reel composition**: consecutive beats on the same palette share one paper scene (`PaletteBackdrop`: color, motifs, office object); a palette change is a paper transition, bloom and cut alternated (`PaperIn`, generalized from the lab reel), started 10 (bloom) or 14 (cut) frames before the first word of the new scene. Each headline appears word by word when the voice says it, the key word on the paper label (D-028), and stays until the next beat or the next transition. The kicker sits under the office object, above the headline. The mascot stays on top with the colors of the current palette, takes the pose of each beat (idle when the beat has none) and moves the mouth only inside the speech stretches between pauses.
- **First post**: `2026-11-24-td17-servizi-esteri`, rubric "TD in 30 secondi". Statements checked on the Agenzia delle Entrate guide v1.10 (1 April 2025, TD17 pp. 11-12): TD17 integrates the invoice of an EU supplier or is an autofattura for an extra-EU one, sent through SDI since 1 July 2022. The transmission deadline is left out on purpose: the technical specifications say the 15th of the following month, the guide advises the end of the month for the pre-filled registers. The example (120 euro, 26,40 euro of IVA at 22%) is marked as an example.
- **Result**: voice 23.4 s, 77 words, 97% heard, beats from 1.1 to 2.6 s. Shorter than the 30 s minimum of the guidelines: the next scripts need about 10 more words.
- **Render time**: half size (540x960) about 3 minutes, used for checks; full size only for the final file.

## D-032 Mascot choreography (2026-11-18)

- **Why** (Edoardo, on the first reel): the mascot was still static; it should move more, interact with what is on screen (office objects and the side motifs at the bottom), sometimes start a transition, walk along the bottom passing in front of and behind the paper pieces, and rarely be replaced by an alternative scene. Design: `docs/superpowers/specs/2026-11-18-mascot-choreography-design.md` (approach A, approved); plan: `docs/superpowers/plans/2026-11-18-mascot-choreography.md`.
- **Plan file**: `pnpm pipeline mascot <id>` writes `mascot.json` (`MascotPlan` in `@reelkit/schema`): moves on the lane with gait and depth, pose and eye cues with body lean, gaze, held props, gags (automatic and from the script, each with a future SFX tag), transitions with their trigger, the optional alternative scene, and pause stretches. Deterministic (seeded by the post id) and checked before rendering: lane bounds, the mascot ending in the frame, the rate of automatic actions, trigger and scene counts, the headline never reaching the mascot or a held prop.
- **Scene layouts as data** (`sceneLayouts` in `@reelkit/brand`): every motif has a depth (`back` or `front`) and, on the lane, its x range and the interactions it allows (lean, tickle, hide, water). `transitionTiming` (lead and length of each transition) is shared by the planner and the video.
- **Rig**: `rig.ts` follows the brand.md table (pupils, lids and brows of the provisional mascot removed); two-segment legs with a sideways walk cycle and a hop with squash; eyes `open | happy | wide | closed | half`; body lean; hand props kept upright; 15 poses. Never mirrored: `lean` and `lean-r` are separate poses.
- **Reel**: scenes are drawn in two passes, back (color, back motifs, office object) and front (front motifs), with the mascot between or above; outgoing front motifs disappear under the bloom layers or leave with the cut. The label of the highlighted word thumps on a stamp hit; the scene's office object hides while the mascot holds its own copy.
- **Triggers**: `scissors` (the cut line opens from the scissors), `blow` (eyes closed, the bloom grows from the mouth), `pull` (the mascot runs across the frame and the torn edge of the new sheet follows its trailing hand; lead 20 and 32 frames, refused when the scene leaves less than 1.3 s after it). The room before a trigger is the silence after the previous scene; `pipeline mascot` lengthens it by up to 0.4 s by inserting silence in the middle of the pause (cutting at the word end left a click) and `render` applies the stretch to the voice and every timing.
- **Alternative scenes**: registry in `packages/video/src/mascot/scenes/`, entered and left with a paper flip (horizontal squash, never a mirror). `reading` exists (glasses, a sheet, eyes running along the lines); desk and card terminal later.
- **TD17 reel**: hide behind the frond (b02), typing on "120" with the scissors cut into the scene (b05), sending the letter on "SDI" (b06), the pulled sheet into the lavender scene (b07), pointing (b08). Stretches: 33 ms and 217 ms.
- **Lab**: `pnpm render:choreo` renders `mascot-poses.png` (poses, eyes, props, walk and hop strips) and `choreo.mp4` (every gag, the three triggers, the reading scene and the automatic behaviors from a hand-written plan).

## D-033 Closing with the logo, CTA to refattura.it, motifs that cover the mascot (2026-11-18)

- **Closing** (Edoardo: a closing with the real logo, like the first test reels): after the last word (+250 ms) a bloom leads into a dark palette (Blu, or Notte when the last scene is already blue) with a white paper card, boiling sticker edge, holding the real logotype (`assets/brand/logotype.svg`), then the tagline "autofatture, senza pensieri" (still provisional in brand.md) and "refattura.it". 2.4 s, no voice. The mascot walks to the middle and waves. `outroTiming` and `outroPalette` in `@reelkit/brand`, the `outro` field of the timeline, `reel/Outro.tsx`.
- **CTA**: "refattura.it" instead of "link in bio" (Edoardo). The pronunciation pass reads it "refattura punto it"; generation.md has the rule.
- **Motifs that can cover the mascot** (Edoardo: the white mascot vanished behind the white frond): a `front` motif must stand out from the mascot's white sheet and border by 2:1, or stay behind it. Blu frond now navy, Viola frond moved behind. `pnpm brand:contrast` fails otherwise (checked: the old colors fail).
- **TD17 after the new voice** (25.2 s): the pause before b07 became too short for the pull (needs 480 ms more than the 400 ms limit), so the pull moved to b03; the mascot runs out straight from its hiding spot behind the frond (the planner skips the walk back when the next gesture is a pull).
- **Branch review of D-032** (fresh reviewer): 7 important findings fixed in one pass (planner time cursor, no prop clashes, isolated alternative scene, rig-based headline check, stale-plan refusal, stamp rules, depth on automatic walks and the blow puff); minor ones deferred in the ledger.

## D-034 Sound: CC0 library, sound plan and mix (2026-11-18)

- **Why** (Edoardo): the reels need sound effects and music, all from libraries, nothing recorded by hand; the choice of sounds is left to Claude Code.
- **Library**: Freesound API v2 (free account, `FREESOUND_API_KEY` in `.env`, only the API key, no OAuth), filtered on Creative Commons 0 so the files can live in the public repository. `pnpm pipeline audio-fetch [--force]` downloads the high-quality mp3 previews (about 128 kbps, enough under a voice) into `assets/sfx/<tag>/` and `assets/music/<mood>/` (plain git, 4.7 MB in all) and writes the manifests with source, author, link, license, duration, first transient, loudness and peak. Ranking: downloads plus rating (three votes at least), Freesound tags where the text query is ambiguous (`scissors`, `keyboard`, `loop` for music) and a list of words that betray the wrong file (static, vinyl, balloon, sci-fi, coin...). 14 effect tags, 36 files; 6 loops (ukulele, marimba, upbeat). Attribution is not required by CC0; the manifests keep it anyway.
- **Sound plan**: `pnpm pipeline sound <id>` (after `mascot`) writes `sound.json`: effects from the script gestures (the SFX tags of the mascot gags), the transitions (bloom, cut, pull, blow), the automatic hops and taps and the closing, each placed on its first transient; spacing, priority, highlight and variant rules in `guidelines/generation.md`. The music loop has its own seed. `sound.json` carries a fingerprint of script, words and mascot plan: `render` refuses a stale one and renders voice only when there is none.
- **Mix**: one ffmpeg pass (about 1 s): voice, effects with their gains and delays, the loop repeated and cut to the reel length with fades, ducked by the voice through a sidechain compressor, then `loudnorm` to -14 LUFS integrated and -1.5 dBTP. The render uses the mix as the reel audio. TD17: 12 effects, marimba loop, -14.5 LUFS.
- **Not checked by ear by Claude Code**: levels, the music choice and the fit of every effect are for Edoardo to judge on the rendered reel; feedback becomes rules here and in the catalog.
- **Render speed** (Edoardo: a full render took 10 minutes or more): Chrome left to choose its OpenGL backend rasterized the SVG paper filters (turbulence, displacement, morphology, on every scene layer and on the mascot) in software. `remotion benchmark` on 60 frames of TD17: 50.4 s by default, 3.8 s with `--gl=angle` (ANGLE on the GPU, an RTX 3060 Ti here), frames the same to the eye with SSIM 0.993 against the software render (grain, boiling edge and sticker border checked on crops). `remotion.config.ts` sets `angle`; the whole TD17 reel with the mix now renders in about 36 s instead of 10 to 30 minutes. Rendering at 15 fps and doubling the frames was considered and dropped: no longer needed, and the Instagram publishing API wants 23 to 60 fps.
- **Output for Instagram and TikTok**: H.264 High, 1080x1920, 30 fps, AAC 48 kHz stereo, about 2.5 Mbps. Every render so far came out full range tagged bt470bg (`yuvj420p`), which players and platform transcoders can read with shifted colors; `remotion.config.ts` now sets the BT.709 color space (limited range, `yuv420p`, every tag bt709). Decoded colors match the reference still within 2/255.
