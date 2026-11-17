# Decisioni

Registro delle scelte che completano o cambiano il brief (`docs/brief.md`). Ogni voce: data, decisione, motivo. Le voci si aggiungono, non si riscrivono: se una decisione cambia, se ne aggiunge una nuova che la sostituisce.

## D-001 Remotion con licenza gratuita (2026-11-17)

La licenza gratuita di Remotion vale per aziende fino a 3 persone **in totale** (conta l'organico dell'intera azienda, non solo chi usa Remotion). Edoardo conferma che su Refattura lavora solo lui: la licenza gratuita è valida. Se l'organico cresce oltre 3 persone, rivalutare (Company License oppure motore MIT come Motion Canvas o Revideo).

## D-002 Font: brand reale più set giocosi in prova (2026-11-17)

Il brief diceva "DM Sans, già nel brand". Il brand reale (`refattura/DESIGN.md`) usa Bricolage Grotesque, Inter, DM Mono e Instrument Serif. Set predefinito:

- Bricolage Grotesque 800 per kinetic typography, titoli e cover;
- Caveat 700 per kicker e timbri;
- DM Mono per numeri, importi e etichette dei capitoli.

Su richiesta di Edoardo restano in prova set più giocosi, sul modello del riferimento: Gabarito + Shantell Sans, Rubik + Gochi Hand, Baloo 2 + Patrick Hand, Fredoka + Caveat. Tutti con licenza OFL, file e `OFL.txt` in `assets/fonts/`. Confronto con `pnpm render:fontlab`; ogni composizione accetta il prop `fontSet`. La scelta finale si fa guardando i primi reel veri.

## D-003 TTS: Gemini 3.8 Flash TTS come predefinito, prova d'ascolto in Fase 1 (2026-11-17)

- `gemini-3.1-flash-tts-preview` del brief è in preview e la documentazione Google chiede di migrare ai modelli 3.8. `gemini-3.8-flash-tts` non è in preview, sul free tier è "Free of charge" e supporta l'italiano. Il modello si sceglie da config (`GEMINI_TTS_MODEL`).
- La Fase 1 del brief cita "Google Chirp": è Cloud Text-to-Speech, richiede un account di fatturazione. Scartato.
- In Fase 1: prova d'ascolto a costo zero sullo stesso testo con Gemini 3.8 Flash TTS, 3.8 Flash-Lite TTS, Kokoro e Piper. Sceglie Edoardo ascoltando.

## D-004 `pnpm bootstrap` al posto di `pnpm setup` (2026-11-17)

`pnpm setup` è un comando interno di pnpm (configura `PNPM_HOME` e il PATH dell'utente): lo script del progetto con quel nome non verrebbe mai eseguito. Lo script che scarica i binari si chiama `bootstrap`.

## D-005 Storage provvisorio su Git LFS (2026-11-17)

Git LFS sul repo pubblico è la soluzione **di prova per partire**. Limiti gratuiti verificati il 2026-11-17: 10 GiB di spazio e 10 GiB di banda al mese per account personali; oltre il limite GitHub blocca invece di addebitare solo se il budget LFS dell'account è 0 $ (da verificare nelle impostazioni di fatturazione GitHub).

Se il progetto funziona, l'architettura si sposta su un server proprio (per esempio Hetzner) con un database e/o un object storage (per esempio Backblaze B2) per i render. Per rendere il passaggio economico:

- i percorsi dei file di un post si risolvono in un solo modulo della pipeline (da Fase 1), così cambiare backend tocca un punto;
- i JSON restano piccoli e leggibili, pronti per essere importati in un database;
- `pnpm lfs:usage` misura l'occupazione rispetto alla quota.

## D-006 Package `brand` separato (2026-11-17)

Il brief metteva i token in `packages/video/brand/`. Stanno in `packages/brand` perché servono anche alla pipeline (contrasto, colori delle cover) e al planner Next.js, che non deve dipendere da Remotion.

## D-007 Sorgenti video in `packages/video/src/` (2026-11-17)

Le cartelle `brand`, `mascot`, `scenes`, `stickers`, `components`, `compositions` stanno sotto `src/`, come da convenzione Remotion e TypeScript.

## D-008 Cartella public di Remotion = `assets/` (2026-11-17)

Font, logo, icone, SFX e musica vivono in `assets/` alla radice e Remotion li serve da lì (`Config.setPublicDir`). Un solo posto per gli asset, condiviso con pipeline e planner.

## D-009 TypeScript 5.9 (2026-11-17)

TypeScript 7 (compilatore nativo) è disponibile, ma Next.js e parte dell'ecosistema usano ancora l'API JavaScript del compilatore. Restiamo su 5.9; rivalutare in Fase 5.

## D-010 Binari esterni (2026-11-17)

- ffmpeg: build statiche BtbN, ramo n9.0 (win64 e linux64).
- Rhubarb Lip Sync 1.14.0.
- whisper.cpp 1.5.5 tramite `@remotion/install-whisper-cpp`: su Windows binario precompilato (non esistono binari oltre 1.6.0), su Linux compilato da sorgente (servono git, make, g++). Remotion indica 1.5.5 per i timestamp a livello di token. Modello predefinito `medium`.
- Chrome Headless Shell di Remotion tramite `ensureBrowser()`.

Tutto in `tools/` (ignorata da git), versioni in `tools/versions.json`.

## D-011 Hook git (2026-11-17)

Il pre-commit (`scripts/guard.ts`) è installato da `simple-git-hooks` con `preserveUnused`, per non cancellare gli hook di Git LFS. `pnpm bootstrap` reinstalla comunque gli hook LFS (`git lfs install --local`).

## D-012 Colori social oltre la palette dell'app (2026-11-17)

Aggiunti due colori che l'app non usa, da approvare in `guidelines/brand.md`:

- `lime` per il box di evidenziazione e gli sticker;
- `sky`, azzurro vicino al tono chiaro del logotipo, come sfondo chiaro secondario e colore degli arti della mascotte (il blu dell'inchiostro spariva sullo sfondo blu).

## D-013 Identità visiva propria, non quella di match.creativelab (2026-11-17, aperta)

Feedback di Edoardo sul primo render: troppe caratteristiche identiche a match.creativelab, e il `lime` forse troppo acceso per Refattura. Nessun template Remotion o codice di terzi è stato usato: la somiglianza viene dall'aver preso alla lettera alcuni segni citati nel brief e visti nello screenshot di riferimento (box lime ruotato con ombra, barra segmentata con etichetta, cono di luce, griglia di punti, arti a tubo con mani bianche).

Regola da subito (in `guidelines/brand.md`): dal riferimento si prendono i meccanismi, mai i segni. La nuova direzione visiva è da decidere con Edoardo prima della Fase 1; la demo della Fase 0 resta come prova tecnica della pipeline, non come stile.
