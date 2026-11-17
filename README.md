# reelkit

Generatore di reel verticali, copertine e caroselli per [Refattura](https://refattura.it), pilotato da Claude Code. Tutto gira in locale: TypeScript, Remotion, whisper.cpp, Rhubarb Lip Sync e ffmpeg. Nessun servizio a pagamento.

Brief del progetto: [docs/brief.md](docs/brief.md). Decisioni prese: [docs/decisions.md](docs/decisions.md). Istruzioni operative: [CLAUDE.md](CLAUDE.md).

## Requisiti

- Node.js 22 o superiore, pnpm 10 (`corepack enable`)
- Git LFS
- Windows x64 oppure Linux x64
- Solo Linux: `git`, `build-essential` (whisper.cpp si compila da sorgente), `xz-utils`, e le librerie di Chrome elencate da `pnpm tools:check`

## Avvio

```bash
pnpm install
pnpm bootstrap
pnpm tools:check
pnpm render:demo
```

`pnpm bootstrap` scarica in `tools/` (ignorata da git) ffmpeg, Rhubarb, whisper.cpp con il modello e il browser usato da Remotion. Si può rilanciare: salta quello che è già installato. Opzioni: `--only ffmpeg,rhubarb,whisper,browser`, `--model small|medium`, `--force`.

| Comando               | Cosa fa                                                           |
| --------------------- | ----------------------------------------------------------------- |
| `pnpm studio`         | Remotion Studio per vedere le composizioni                        |
| `pnpm render:demo`    | Render di prova di 5 secondi in `packages/video/out/demo.mp4`     |
| `pnpm render:fontlab` | Confronto dei set di font in `packages/video/out/fontlab.png`     |
| `pnpm brand:contrast` | Valori hex dei token e contrasto WCAG di ogni coppia testo/sfondo |
| `pnpm lfs:usage`      | Spazio Git LFS occupato rispetto alla quota gratuita              |
| `pnpm typecheck`      | Controllo dei tipi di tutto il monorepo                           |

## Licenze

- Codice: MIT, vedi [LICENSE](LICENSE).
- Logo, mascotte, illustrazioni e contenuti pubblicati di Refattura: tutti i diritti riservati, vedi [ASSETS-LICENSE](ASSETS-LICENSE).
- Font: SIL Open Font License, file `OFL.txt` accanto a ogni font in `assets/fonts/`.
