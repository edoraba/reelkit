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
