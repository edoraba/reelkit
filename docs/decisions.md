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

## D-013 Own visual identity, not that of match.creativelab (2026-11-17, open)

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
