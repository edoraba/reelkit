# reelkit: operating instructions

Repo that generates vertical reels, covers, carousels and post texts for **Refattura** (Italian SaaS for autofatture TD17/TD18/TD19, i.e. self-issued invoices). You, Claude Code, drive it: given a topic or a calendar you produce script, voice, animation, SFX, cover and caption. You stop at the human approval gate before publishing.

- Original brief: `docs/brief.md`
- Decisions that complete or change the brief: `docs/decisions.md` (read them before changing the architecture)
- Content rules: `guidelines/brand.md`, `guidelines/generation.md`, `guidelines/strategy.md` (re-read them before every generation)
- Brand source: `refattura/DESIGN.md` in the Refattura repo (read-only, never modify that repo from here)

## Always valid rules

- Language: everything written in the repository is in English: code, identifiers, comments, docs, README, guidelines, CLAUDE.md, decisions, commit messages, branch names and PR text. Only published content stays in Italian: voice scripts, on-screen text, captions, hashtags, cover titles, rubric names, and Italian examples quoted in the guidelines.
- No reference to Claude or Anthropic and no `Co-Authored-By` in commits, branches, tags, PRs.
- Small, descriptive commits. Branches `feat/`, `fix/`, `docs/`, `chore/`.
- Never the em dash (U+2014) in guidelines, docs, content and code: the pre-commit hook blocks it.
- No secrets in the repo: keys go in `.env` (see `.env.example`).
- No paid services and no accounts requiring a card or billing. Every external service must only be able to refuse requests beyond the free limit.
- Files as the source of truth, no database (trial phase, see D-005).
- Determinism: every random choice uses `seededRandom(postId, ...)` from `@reelkit/schema`.
- You can move a post at most to `ready-for-review`. `approved` and `rejected` are decided by the human.
- Recurring human feedback becomes a rule in `guidelines/`.
- For every external library or API, check the current documentation instead of relying on memory.
- If a choice in the brief turns out to be wrong or outdated: stop, explain why, propose the alternative, record the decision in `docs/decisions.md`.
- Minimal tests: no e2e, no TDD scaffolding. Verify with real renders and extracted frames.
- Always `pnpm`, never `npm`.

## Commands

| Command                    | What it does                                                                                                                                                                        |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install`             | Dependencies and pre-commit hook                                                                                                                                                    |
| `pnpm bootstrap`           | Downloads ffmpeg, Rhubarb, whisper.cpp + model, Remotion browser into `tools/`. Idempotent. `--only`, `--model`, `--force`                                                          |
| `pnpm tools:check`         | Status of the binaries and the Git LFS hooks                                                                                                                                        |
| `pnpm studio`              | Remotion Studio                                                                                                                                                                     |
| `pnpm render:demo`         | 5 s test render to `packages/video/out/demo.mp4`                                                                                                                                    |
| `pnpm render:test-reels`   | Two full test reels (mascot styles 01 and 02) in `packages/video/out/test-reel-*.mp4`                                                                                               |
| `pnpm render:fontlab`      | Font set comparison in `packages/video/out/fontlab.png`                                                                                                                             |
| `pnpm render:lab`          | Visual direction proposals and highlight options in `packages/video/out/lab/`                                                                                                       |
| `pnpm render:mascots`      | Mascot candidate sheets in `packages/video/out/lab/mascots-*.png`                                                                                                                   |
| `pnpm render:invoice-roll` | Motion test of the invoice roll mascot variants in `packages/video/out/lab/invoice-roll.mp4`                                                                                        |
| `pnpm render:styles`       | The mascot in 18 rendering styles in `packages/video/out/lab/styles-*.png`                                                                                                          |
| `pnpm render:style-motion` | Motion test of styles 01 and 02 on three backgrounds in `packages/video/out/lab/style-motion.mp4`                                                                                   |
| `pnpm render:moodboards`   | Seven art direction moodboards and an overview in `packages/video/out/lab/moodboards/`                                                                                              |
| `pnpm render:cutouts`      | Papiers découpés lab: animated motif catalogue, 8 backgrounds, transition test reel, headline font tests, office objects and the palette board in `packages/video/out/lab/cutouts/` |
| `pnpm brand:contrast`      | Token hex values and WCAG contrast of the text/background pairs                                                                                                                     |
| `pnpm typecheck`           | Types of the whole monorepo                                                                                                                                                         |
| `pnpm guard`               | Pre-commit checks on staged files                                                                                                                                                   |
| `pnpm lfs:usage`           | Git LFS usage compared with the free quota                                                                                                                                          |

Render the demo with another font set (from `packages/video`):

```bash
pnpm exec remotion render Demo out/demo-gabarito.mp4 --props='{"fontSet":"gabarito","seed":"demo"}'
```

Extract frames for review (ffmpeg from `tools/`), for example a 4-frame contact sheet:

```bash
tools/ffmpeg/bin/ffmpeg -v error -y -i packages/video/out/demo.mp4 -vf "select='eq(n,15)+eq(n,64)+eq(n,80)+eq(n,135)',scale=360:-1,tile=4x1" -vframes 1 packages/video/out/review/sheet.png
```

## Structure

```
CLAUDE.md, README.md, LICENSE (MIT, code), ASSETS-LICENSE (brand reserved)
docs/            brief.md, decisions.md
guidelines/      brand.md, generation.md, strategy.md (drafts to approve)
packages/
  schema/        Zod: post state and ids, deterministic seed (beats and manifest from Phase 1)
  brand/         color tokens (OKLCH), backgrounds, font sets, type scale, safe zone
  pipeline/      tsx CLI: bootstrap and check (from Phase 1: tts, align, lipsync, sfx-plan, render, publish)
  video/         Remotion: src/{brand,components,stickers,mascot,scenes,compositions}
apps/            Next.js planner (Phase 5)
assets/          fonts (OFL), brand (logo), icons, sfx and music (manifest.json): Remotion public dir
content/posts/   <yyyy-mm-dd>-<slug>/ with post.json, script.json, voice.wav, words.json, mouth.json, out/
scripts/         guard.ts (pre-commit), lfs-usage.ts
tools/           binaries downloaded by bootstrap (gitignored, root only)
```

## Conventions

- Internal packages export TypeScript sources (`"exports": "./src/index.ts"`), no build step.
- `remotion` and all `@remotion/*` at the same exact version (currently 4.0.544).
- Colors always from the `@reelkit/brand` tokens; never a hand-written color in a component.
- Safe zone (`safeZone`) and grid band (`gridCrop`) in `@reelkit/brand`.
- Mascot: rig contract in `packages/video/src/mascot/rig.ts`, layer naming in `guidelines/brand.md`.
- `.gitignore`: folder patterns that also exist inside `packages/` must be anchored to the root (`/tools/`).
- Post videos, covers and voice in Git LFS (`.gitattributes`); fonts, logo and SFX in regular git.

## Phase status

| Phase                     | Status                                                                                                                                                                                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 Foundations             | Done 2026-11-17: pipeline, visual system (D-015), mascot (D-016, D-018) in sticker style (D-019), full test reel (`pnpm render:test-reels`). The old `Demo` composition is legacy (provisional mascot, lime box): remove or rebuild it on the new system |
| 1 Voice and text          | Next. Start with the TTS listening test (D-003): needs `GEMINI_API_KEY` in `.env` from a Google project with no billing account                                                                                                                          |
| 2 Mascot                  | Invoice roll A4, sticker finish. To do: full rig and layer ids, pose library, expressions, Rhubarb mouths                                                                                                                                                |
| 3 Scenes and audio        | To do                                                                                                                                                                                                                                                    |
| 4 Covers and carousels    | To do                                                                                                                                                                                                                                                    |
| 5 Planner                 | To do                                                                                                                                                                                                                                                    |
| 6 Autonomy and publishing | To do                                                                                                                                                                                                                                                    |
