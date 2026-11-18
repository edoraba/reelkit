# reelkit

Generator of vertical reels, covers and carousels for [Refattura](https://refattura.it), driven by Claude Code. Everything runs locally: TypeScript, Remotion, whisper.cpp, Rhubarb Lip Sync and ffmpeg. No paid services.

Project brief: [docs/brief.md](docs/brief.md). Decisions taken: [docs/decisions.md](docs/decisions.md). Operating instructions: [CLAUDE.md](CLAUDE.md).

## Requirements

- Node.js 22 or later, pnpm 10 (`corepack enable`)
- Git LFS
- Windows x64 or Linux x64
- Linux only: `git`, `build-essential` (whisper.cpp is built from source), `xz-utils`, and the Chrome libraries listed by `pnpm tools:check`

## Getting started

```bash
pnpm install
pnpm bootstrap
pnpm tools:check
pnpm render:demo
```

`pnpm bootstrap` downloads ffmpeg, Rhubarb, whisper.cpp with its model and the browser used by Remotion into `tools/` (ignored by git). It can be re-run: it skips what is already installed. Options: `--only ffmpeg,rhubarb,whisper,browser`, `--model small|medium`, `--force`.

| Command                    | What it does                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `pnpm studio`              | Remotion Studio to preview the compositions                                                                        |
| `pnpm render:demo`         | 5-second test render to `packages/video/out/demo.mp4`                                                              |
| `pnpm render:test-reels`   | Two full test reels (mascot styles 01 and 02) in `packages/video/out/test-reel-*.mp4`                              |
| `pnpm render:fontlab`      | Font set comparison in `packages/video/out/fontlab.png`                                                            |
| `pnpm render:lab`          | Visual direction proposals in `packages/video/out/lab/`                                                            |
| `pnpm render:mascots`      | Mascot candidate sheets in `packages/video/out/lab/mascots-*.png`                                                  |
| `pnpm render:invoice-roll` | Motion test of the invoice roll mascot variants in `packages/video/out/lab/invoice-roll.mp4`                       |
| `pnpm render:styles`       | The mascot in 18 rendering styles in `packages/video/out/lab/styles-*.png`                                         |
| `pnpm render:style-motion` | Motion test of styles 01 and 02 on three backgrounds in `packages/video/out/lab/style-motion.mp4`                  |
| `pnpm render:moodboards`   | Seven art direction moodboards and an overview in `packages/video/out/lab/moodboards/`                             |
| `pnpm render:cutouts`      | Papiers découpés lab: animated motif catalogue, 8 backgrounds and a 12 s reel in `packages/video/out/lab/cutouts/` |
| `pnpm brand:contrast`      | Hex values of the tokens and WCAG contrast of each text/background pair                                            |
| `pnpm lfs:usage`           | Git LFS space used compared with the free quota                                                                    |
| `pnpm typecheck`           | Type check of the whole monorepo                                                                                   |

## Licenses

- Code: MIT, see [LICENSE](LICENSE).
- Logo, mascot, illustrations and published Refattura content: all rights reserved, see [ASSETS-LICENSE](ASSETS-LICENSE).
- Fonts: SIL Open Font License, `OFL.txt` file next to each font in `assets/fonts/`.
