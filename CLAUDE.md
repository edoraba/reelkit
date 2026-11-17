# reelkit: istruzioni operative

Repo che genera reel verticali, copertine, caroselli e testi dei post per **Refattura** (SaaS italiano di autofatture TD17/TD18/TD19). Lo piloti tu, Claude Code: dato un argomento o un calendario produci script, voce, animazione, SFX, cover e caption. Ti fermi al gate di approvazione umana prima della pubblicazione.

- Brief originale: `docs/brief.md`
- Decisioni che completano o cambiano il brief: `docs/decisions.md` (leggile prima di cambiare architettura)
- Regole di contenuto: `guidelines/brand.md`, `guidelines/generation.md`, `guidelines/strategy.md` (rileggile prima di ogni generazione)
- Fonte del brand: `refattura/DESIGN.md` nel repo Refattura (solo lettura, mai modificare quel repo da qui)

## Regole sempre valide

- Nessun riferimento a Claude o Anthropic e nessun `Co-Authored-By` in commit, branch, tag, PR.
- Commit piccoli e descrittivi in inglese. Branch `feat/`, `fix/`, `docs/`, `chore/`.
- Mai il trattino lungo (U+2014) in guideline, docs, contenuti e codice: il pre-commit lo blocca.
- Nessun segreto nel repo: chiavi in `.env` (vedi `.env.example`).
- Nessun servizio a pagamento e nessun account con carta o fatturazione. Ogni servizio esterno deve poter solo rifiutare oltre il limite gratuito.
- File come fonte di verità, niente database (fase di prova, vedi D-005).
- Determinismo: ogni scelta casuale usa `seededRandom(postId, ...)` di `@reelkit/schema`.
- Puoi portare un post al massimo a `ready-for-review`. `approved` e `rejected` li decide l'umano.
- Feedback ricorrente dell'umano: diventa una regola in `guidelines/`.
- Per ogni libreria o API esterna verifica la documentazione attuale invece della memoria.
- Se una scelta del brief si rivela sbagliata o superata: fermati, spiega perché, proponi l'alternativa, registra la decisione in `docs/decisions.md`.
- Test minimi: niente e2e, niente scaffolding TDD. Si verifica con render reali e frame estratti.
- Sempre `pnpm`, mai `npm`.

## Comandi

| Comando               | Cosa fa                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install`        | Dipendenze e hook pre-commit                                                                                              |
| `pnpm bootstrap`      | Scarica ffmpeg, Rhubarb, whisper.cpp + modello, browser Remotion in `tools/`. Idempotente. `--only`, `--model`, `--force` |
| `pnpm tools:check`    | Stato dei binari e degli hook Git LFS                                                                                     |
| `pnpm studio`         | Remotion Studio                                                                                                           |
| `pnpm render:demo`    | Render di prova 5 s in `packages/video/out/demo.mp4`                                                                      |
| `pnpm render:fontlab` | Confronto set di font in `packages/video/out/fontlab.png`                                                                 |
| `pnpm brand:contrast` | Hex dei token e contrasto WCAG delle coppie testo/sfondo                                                                  |
| `pnpm typecheck`      | Tipi di tutto il monorepo                                                                                                 |
| `pnpm guard`          | Controlli del pre-commit sui file in stage                                                                                |
| `pnpm lfs:usage`      | Occupazione Git LFS rispetto alla quota gratuita                                                                          |

Render della demo con un altro set di font (da `packages/video`):

```bash
pnpm exec remotion render Demo out/demo-gabarito.mp4 --props='{"fontSet":"gabarito","seed":"demo"}'
```

Estrarre frame per la review (ffmpeg di `tools/`), per esempio un contact sheet di 4 frame:

```bash
tools/ffmpeg/bin/ffmpeg -v error -y -i packages/video/out/demo.mp4 -vf "select='eq(n,15)+eq(n,64)+eq(n,80)+eq(n,135)',scale=360:-1,tile=4x1" -vframes 1 packages/video/out/review/sheet.png
```

## Struttura

```
CLAUDE.md, README.md, LICENSE (MIT, codice), ASSETS-LICENSE (brand riservato)
docs/            brief.md, decisions.md
guidelines/      brand.md, generation.md, strategy.md (bozze da approvare)
packages/
  schema/        Zod: stato e id dei post, seed deterministico (beat e manifest da Fase 1)
  brand/         token colore (OKLCH), sfondi, font set, scala tipografica, safe zone
  pipeline/      CLI tsx: bootstrap e check (da Fase 1: tts, align, lipsync, sfx-plan, render, publish)
  video/         Remotion: src/{brand,components,stickers,mascot,scenes,compositions}
apps/            planner Next.js (Fase 5)
assets/          fonts (OFL), brand (logo), icons, sfx e music (manifest.json): public dir di Remotion
content/posts/   <yyyy-mm-dd>-<slug>/ con post.json, script.json, voice.wav, words.json, mouth.json, out/
scripts/         guard.ts (pre-commit), lfs-usage.ts
tools/           binari scaricati da bootstrap (gitignored, solo alla radice)
```

## Convenzioni

- I package interni esportano sorgenti TypeScript (`"exports": "./src/index.ts"`), senza build.
- `remotion` e tutti i `@remotion/*` alla stessa versione esatta (oggi 4.0.544).
- Colori sempre dai token di `@reelkit/brand`; mai un colore scritto a mano in un componente.
- Safe zone (`safeZone`) e fascia della griglia (`gridCrop`) in `@reelkit/brand`.
- Mascotte: contratto del rig in `packages/video/src/mascot/rig.ts`, naming dei livelli in `guidelines/brand.md`.
- `.gitignore`: i pattern di cartelle che esistono anche dentro `packages/` vanno ancorati alla radice (`/tools/`).
- Video, cover e voice dei post in Git LFS (`.gitattributes`); font, logo e SFX in git normale.

## Stato delle fasi

| Fase                        | Stato                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| 0 Fondamenta                | Pipeline fatta il 2026-11-17. Stile della demo da rifare: troppo simile al riferimento (D-013) |
| 1 Voce e testo              | Da fare, dopo la nuova direzione visiva. Partire dalla prova d'ascolto TTS (D-003)             |
| 2 Mascotte                  | Da fare. La mascotte provvisoria è solo un punto di partenza, va rilavorata molto              |
| 3 Scene e audio             | Da fare                                                                                        |
| 4 Cover e caroselli         | Da fare                                                                                        |
| 5 Planner                   | Da fare                                                                                        |
| 6 Autonomia e pubblicazione | Da fare                                                                                        |
