# Refattura Reels: prompt iniziale per Claude Code

Nov 17, 2026 · @Edoardo

## Ruolo e obiettivo

Costruisci da zero un repo che genera in automatico reel verticali per Instagram e TikTok, copertine e caroselli per **Refattura**, un SaaS italiano di autofatturazione e rifatturazione. Il repo deve essere pilotabile interamente da te (Claude Code): dato un argomento o un calendario, produci script, voce, animazione, SFX, copertina e testo del post senza interventi manuali, fermandoti solo al gate di approvazione prima della pubblicazione.

Prima di scrivere codice, leggi tutto questo documento, poi proponi un piano per la Fase 0 (vedi ultima sezione) e attendi conferma. Lavora per fasi piccole e verificabili: ogni fase termina con un render reale che puoi ispezionare.

Il progetto è personale, gestito da una sola persona, su repo pubblico GitHub. Tutto gira in locale su un PC o su un server personale: nessun servizio a pagamento, nessun account che richieda una carta di credito o un profilo di fatturazione, nessun hosting di terzi per il render. Ogni servizio esterno deve poter solo rifiutare le richieste oltre il limite gratuito, mai addebitarle.

## Riferimento stilistico

Il riferimento è il profilo Instagram match.creativelab: prendine la grammatica visiva, non l'identità. Palette, mascotte, font e testi di Refattura devono essere originali. Dall'analisi di due reel (2:00 e 0:55, 720×1280, 30 fps) emergono questi pattern da replicare come sistema:

- **Kinetic typography.** Il parlato appare a schermo come testo grande in un grotesk pesante. Due varianti: una parola alla volta al centro, oppure righe brevi da 2-4 parole con la parola corrente evidenziata in un box colorato (stile karaoke).
- **Ritmo.** Un cambio di scena ogni 2-3 secondi circa; il colore di sfondo cambia quando cambia il concetto, da una palette fissa di 5-6 colori.
- **Mascotte al centro.** Un personaggio su un cono di luce, mai statico: idle continuo (respiro, ammiccamento), pose diverse a seconda del beat (braccia alzate, indica, scrolla le spalle) e lip sync sulla voce.
- **UI mockup sopra la mascotte.** Bolle di chat, notifiche, calendari, termometri, contatori numerici su griglie di punti, card A/B: illustrano la frase in corso.
- **Sticker ricorrenti.** Parola chiave in box lime ruotato con ombra, pill con etichette, timbri in font scritto a mano, testo barrato e corretto, fumetti.
- **Struttura a capitoli.** Barra di avanzamento segmentata in alto con etichetta del capitolo (es. 01/05 IL PROBLEMA), oppure header fisso con il titolo del reel.
- **SFX ovunque.** Ogni ingresso, uscita e concetto ha il suo suono.
- **Arco narrativo.** Hook con domanda, problema, sviluppo, domanda al pubblico (A o B nei commenti), CTA, tagline e logo.
- **Copertine.** Kicker in corsivo a mano in alto (nome della rubrica), titolo enorme con una parola evidenziata, illustrazione centrale, mascotte in un angolo. Rubriche ricorrenti e alternanza di colori pensata sulla griglia del feed.

## Stack e vincoli

| Area | Scelta | Note |
| --- | --- | --- |
| Linguaggio | TypeScript strict, pnpm, Turborepo | Prettier, Zod per tutti gli schemi |
| Video, cover, caroselli | Remotion | Licenza gratuita valida per uso individuale |
| Planner e anteprima griglia | Next.js locale + shadcn/ui | Nessun deploy, gira su localhost |
| Script e piano editoriale | Claude Code stesso | Nessuna chiamata API a LLM dal codice |
| Voce | Gemini TTS (gemini-3.1-flash-tts-preview) sul free tier della Gemini API | Chiave di Google AI Studio senza fatturazione: oltre i limiti risponde 429, nessun addebito possibile. Modello in preview: fallback offline Kokoro e Piper |
| Timestamp parole | whisper.cpp via `@remotion/install-whisper-cpp` | Locale, modello `medium` o `small` per l'italiano |
| Lip sync | Rhubarb Lip Sync, modalità fonetica | Fallback: apertura bocca da ampiezza audio |
| Audio | ffmpeg | Analisi transienti, loudness, mix |

Vincoli:

- **Cross-platform.** Deve girare su Windows e su Linux. Script di pipeline in TypeScript eseguiti con `tsx`, niente bash obbligatoria. Binari esterni (ffmpeg, whisper.cpp, Rhubarb) scaricati da uno script `setup` in una cartella ignorata da git.
- **TTS dietro un'interfaccia** `TtsProvider` con implementazioni `gemini-tts`, `kokoro` e `piper`, tutte gratuite. Il provider si sceglie da config. Se Gemini risponde 429 per i limiti giornalieri, il post resta in coda e riprova il giorno dopo; non passare in automatico a una voce offline senza segnalarlo, perché la qualità cambia. I timestamp arrivano sempre da whisper.cpp, così il provider è intercambiabile.
- **Nessun segreto nel repo.** Chiave Gemini e token Instagram via variabili d'ambiente; `.env.example` documentato. Il progetto Google usato per la chiave non deve mai avere un account di fatturazione collegato. Nota: sul free tier Google può usare input e output per migliorare i modelli, accettabile per contenuti destinati alla pubblicazione.
- **Determinismo.** Stesso input, stesso output: ogni scelta casuale (varianti SFX, micro-movimenti) usa un seed derivato dall'id del post.
- **File come fonte di verità.** Niente database: tutto lo stato vive in file JSON e Markdown versionati, che puoi leggere e modificare direttamente.

## Struttura del repo

Proponi questa struttura come punto di partenza; puoi modificarla motivando la scelta.

```
refattura-reels/
├─ CLAUDE.md                  # istruzioni operative per te, sempre aggiornate
├─ guidelines/
│  ├─ brand.md                # identità, palette, tipografia, mascotte, tono
│  ├─ generation.md           # regole di scrittura, ritmo, scene, SFX, cover
│  └─ strategy.md             # pilastri, rubriche, frequenza, pubblico
├─ .claude/commands/          # slash command: /plan-quarter, /new-reel, /render, /review
├─ packages/
│  ├─ schema/                 # schemi Zod condivisi (post, beat, calendario, manifest)
│  ├─ pipeline/               # CLI: tts, align, lipsync, sfx-plan, render, publish
│  └─ video/                  # progetto Remotion: composizioni, scene, componenti
│     ├─ brand/               # token colore, font, spaziature
│     ├─ mascot/              # rig SVG, pose, bocche, animazioni idle
│     ├─ scenes/              # scene parametriche (testo, mockup, contatori, A/B)
│     ├─ stickers/            # box lime, pill, timbri, barrato, fumetti
│     └─ compositions/        # Reel, Cover, CarouselSlide, GridPreview
├─ apps/planner/              # Next.js locale: calendario, griglia, stati
├─ assets/
│  ├─ icons/                  # SVG originali
│  ├─ sfx/                    # solo CC0, con manifest.json
│  └─ music/                  # solo licenze compatibili, con manifest.json
├─ content/
│  ├─ calendar.json           # piano a 3 mesi
│  └─ posts/<yyyy-mm-dd>-<slug>/
│     ├─ post.json            # stato, rubrica, formato, caption, hashtag
│     ├─ script.json          # beat validati dallo schema
│     ├─ voice.wav, words.json, mouth.json
│     ├─ review/              # frame chiave estratti per l'auto-review
│     └─ out/                 # reel.mp4, cover.png, slide-01.png...
└─ tools/                     # binari scaricati da setup (gitignored)
```

## Pipeline di generazione

Ogni step è un comando CLI idempotente che legge e scrive nella cartella del post; `/new-reel` li esegue in sequenza e riparte dallo step fallito.

1. **Script.** Scrivi `script.json` seguendo `guidelines/generation.md`. Lo schema Zod deve passare; se fallisce, correggi e rivalida.
2. **Voce.** `pipeline tts` genera `voice.wav` dal testo parlato concatenato, con pause brevi tra i beat.
3. **Allineamento.** `pipeline align` produce `words.json` con inizio e fine di ogni parola, e assegna le parole ai beat.
4. **Lip sync.** `pipeline lipsync` produce `mouth.json` (forma della bocca per intervalli di tempo).
5. **Piano SFX.** `pipeline sfx-plan` risolve gli SFX: quelli dichiarati dai componenti più quelli semantici del beat, applicando le regole di mix.
6. **Render.** Remotion produce `reel.mp4` (1080×1920, 30 fps, H.264, AAC), `cover.png` e le eventuali slide.
7. **Auto-review.** Estrai un frame per beat più primo e ultimo frame, guardali e controlla la checklist sotto. Esegui anche i controlli d'ascolto della sezione SFX. Correggi lo script o i parametri e ri-renderizza, massimo 3 iterazioni, poi segnala i problemi residui.
8. **Gate.** Imposti lo stato del post a `ready-for-review`. La pubblicazione avviene solo dopo che l'umano lo porta ad `approved`.

Esempio di beat (lo schema definitivo lo definisci tu in `packages/schema`):

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

I riferimenti temporali (`at`) puntano a parole del parlato, mai a secondi: i tempi reali li risolve la pipeline dopo l'allineamento.

Checklist di auto-review:

- Nessun testo fuori dalle safe zone (in alto e in basso Instagram copre parte del frame) o tagliato.
- Nessuno sticker sovrapposto alla mascotte o ai sottotitoli.
- Nessun beat più breve di 0,8 s o più lungo di 5 s senza cambio visivo.
- Contrasto testo/sfondo leggibile su ogni frame.
- La bocca della mascotte è chiusa quando la voce tace.
- Loudness integrata del mix intorno a -14 LUFS, misurata con ffmpeg.
- La cover è leggibile anche ridotta a miniatura della griglia.

## Mascotte, pose e lip sync

La mascotte è un rig SVG animato via codice, non un'immagine: ogni parte è un gruppo separato con un pivot definito, e Remotion la anima frame per frame. Tutte le illustrazioni del progetto (mascotte, icone, mockup) sono SVG vettoriali disegnati nello stile delle guideline; niente generazione di immagini raster in questa prima versione, per coerenza e costo zero.

**Rig.** Gruppi separati per corpo, testa, occhi, palpebre, sopracciglia, bocca, braccio e avambraccio sinistro e destro, mani, gambe. Convenzione di naming dei layer documentata in `guidelines/brand.md`, così un SVG esportato da Figma con quei nomi si aggancia al rig senza modifiche al codice. In Fase 0 disegna tu una mascotte provvisoria semplice (un documento/fattura con faccia, braccia e gambe a tubo, contorno spesso); quella definitiva la fornisce l'umano.

**Livelli di animazione, sommati tra loro:**

1. **Idle continuo.** Respiro (scala verticale lieve sul corpo), oscillazione leggera, ammiccamento a intervalli irregolari ma deterministici.
2. **Pose.** Una libreria di pose nominate (`neutral`, `arms-up`, `point-left`, `point-up`, `shrug`, `thinking`, `wave`, `facepalm`, `celebrate`) definite come rotazioni dei segmenti. Il cambio di posa usa spring con un frame di anticipazione e un leggero overshoot.
3. **Gesti sull'enfasi.** Sulle parole in `highlight` la mascotte fa un micro-gesto (scatto del braccio, rimbalzo) se il beat non specifica già una posa.
4. **Sguardo.** Gli occhi seguono l'elemento che entra in scena (mockup, sticker), poi tornano verso la camera.
5. **Espressioni.** Combinazioni di sopracciglia, palpebre e bocca a riposo (`happy`, `worried`, `skeptical`, `surprised`).

**Lip sync.** Rhubarb Lip Sync in modalità fonetica (indipendente dalla lingua, adatta all'italiano) produce le forme A-H più X (silenzio) con i tempi. Disegna una bocca SVG per ogni forma. Mantieni ogni forma almeno 2 frame per evitare sfarfallii e chiudi sempre la bocca durante le pause. Se Rhubarb non è disponibile o fallisce, fallback su apertura della bocca proporzionale all'ampiezza dell'audio (`@remotion/media-utils`), con 3 livelli di apertura.

Verifica il lip sync in auto-review estraendo 10 frame consecutivi in un punto di parlato e uno in un punto di silenzio.

## SFX, musica e mix

Gli SFX lavorano su due livelli, entrambi risolti dalla pipeline e non scritti a mano nel video.

**SFX di componente.** Ogni componente animato dichiara i suoi suoni di ingresso e uscita come tag (sticker lime: `pop`; timbro: `stamp`; freccia tratteggiata: `swish`; barrato: `marker`; card che scorrono: `whoosh-soft`; contatore: `tick` ad ogni step; cambio sfondo: `swoosh`). Se usi il componente, il suono arriva in automatico, sincronizzato all'animazione.

**SFX semantici.** Li scegli tu nel beat in base al contenuto (`cash-register` su un importo, `notification` su un messaggio, `typing` su una chat, `ding` su un'idea, `error` su una sanzione), ancorati a una parola.

**Manifest.** `assets/sfx/manifest.json` elenca ogni file con tag, durata, varianti, licenza, fonte e `impactMs`: il punto d'impatto reale, calcolato con ffmpeg sul primo transiente. La pipeline allinea l'impatto al frame dell'evento, non l'inizio del file. Uno script `sfx:index` analizza i nuovi file e aggiorna il manifest; i tag li proponi tu senza poter ascoltare, basandoti su nome file, fonte e forma d'onda, e segnala quelli dubbi.

**Regole di mix (nel codice, non per singolo video):**

- Voce a riferimento, SFX da -12 a -18 dB sotto la voce, musica da -20 a -24 dB con ducking quando la voce parla.
- Varianti a rotazione deterministica: lo stesso tag non usa lo stesso file due volte di fila.
- Densità massima: due SFX non partono a meno di 250 ms l'uno dall'altro; in caso di conflitto vince il semantico.
- Whoosh e swoosh anticipati di 2-3 frame rispetto al movimento.
- Nessun SFX sopra una parola in `highlight` se ne copre l'attacco.
- Musica: un loop per reel, fade in e fade out, scelto per tag di mood dal manifest musica.

**Controlli d'ascolto.** Non puoi ascoltare direttamente, ma hai quattro segnali gratuiti da usare in auto-review:

1. **Trascrizione di ritorno.** whisper.cpp ritrascrive il mix finale e confronti il testo con lo script: parole saltate, pronunce sbagliate (TD17, sigle) o parlato coperto da SFX e musica emergono come differenze.
2. **Spettrogramma.** ffmpeg genera lo spettrogramma della traccia con le tacche dei beat sovrapposte; lo guardi come un frame per verificare densità, ducking e sincronia.
3. **Secondo parere.** Invia il wav a Gemini (free tier, stessa chiave senza fatturazione) con domande precise su naturalezza della voce e coerenza degli SFX, e valuta la risposta.
4. **Validazione SFX.** Un modello CLAP locale verifica che ogni file della libreria suoni come il tag che gli hai assegnato.

Sui primi reel il giudizio d'ascolto resta all'umano; ogni suo feedback ricorrente diventa una regola in `guidelines/generation.md`.

## Planner, copertine, griglia e caroselli

**Piano trimestrale.** `/plan-quarter` legge `guidelines/strategy.md` e scrive `content/calendar.json` con 13 settimane di post: data, formato (reel o carosello), rubrica, argomento, hook, colore dominante della cover. Bilancia le rubriche, evita argomenti ripetuti e alterna i colori in modo che ogni blocco di 3 post consecutivi nella griglia sia vario. Crea una cartella per ogni post con `post.json` in stato `idea`.

**Ciclo di vita del post:** `idea` → `scripted` → `rendered` → `ready-for-review` → `approved` → `published`, più `rejected` con una nota dell'umano che ti dice cosa rifare. Puoi far avanzare un post solo fino a `ready-for-review`.

**App planner** (`apps/planner`, Next.js su localhost): vista calendario a 3 mesi con stato colorato per post; dettaglio post con player del reel, cover, caption e script leggibile; pulsanti approva, rifiuta con nota, sposta data, che modificano direttamente i file JSON. L'app non genera nulla: la generazione resta nei comandi che esegui tu.

**Anteprima griglia.** Composizione Remotion `GridPreview` e vista nell'app che mostrano le prossime 12 cover nella griglia 3 colonne del profilo, con il formato di ritaglio usato da Instagram per la griglia. Serve a controllare l'alternanza prima di approvare.

**Generatore di copertine.** Composizione `Cover` a 1080×1920 con template per rubrica: kicker scritto a mano con il nome della rubrica, titolo grande con una parola evidenziata, illustrazione SVG centrale, mascotte in un angolo con posa ed espressione coerenti col tema. Tieni testo e soggetti nella zona centrale che sopravvive al ritaglio della griglia. La cover è anche il primo frame del reel, così non serve impostarla a parte.

**Caroselli.** Composizione `CarouselSlide` 1080×1350 che riusa scene, sticker e mascotte; ogni slide è un beat statico. Barra di avanzamento segmentata e numerazione (01/05) come nei reel.

**Testo del post.** Per ogni post scrivi in `post.json` caption (hook nella prima riga, massimo 3 paragrafi brevi, domanda finale), 3-5 hashtag pertinenti e un eventuale primo commento.

**Pubblicazione (ultima fase).** Script `publish` che, per i post `approved` con data passata, pubblica via Instagram Graph API (account Business o Creator) e scrive l'esito in `post.json`; lanciato da cron su Linux o Utilità di pianificazione su Windows. Verifica nella documentazione corrente se l'API accetta l'upload diretto del file; altrimenti usa l'URL pubblico del file nel repo GitHub. TikTok in un secondo momento: la sua API richiede un audit dell'app per pubblicare in pubblico.

## Guideline da scrivere

In Fase 0 scrivi una bozza dei tre file in `guidelines/` e sottoponila all'umano prima di usarla. Sono la tua fonte di regole: ogni generazione li rilegge, e ogni feedback ricorrente dell'umano diventa una regola scritta qui.

**brand.md**

- Palette: 5-6 colori derivati dai token OKLCH esistenti di Refattura (chiedili all'umano se non sono nel repo), con ruoli espliciti: sfondi, accento per l'evidenziazione, inchiostro, carta. Coppie testo/sfondo ammesse con contrasto verificato.
- Tipografia: DM Sans (già nel brand) nei pesi più pesanti per titoli e sottotitoli, DM Mono per numeri e dati, un font scritto a mano con licenza OFL per kicker e timbri. Scala tipografica in pixel per il formato 1080×1920.
- Mascotte: personalità (es. un po' cinica sulla burocrazia, sempre dalla parte dell'utente), pose ed espressioni ammesse, naming dei layer SVG, cosa non deve mai fare.
- Stile illustrativo: contorno spesso uniforme, campiture piatte, 2-3 colori per oggetto, angoli arrotondati, nessuna sfumatura o ombra realistica; ombre solo come offset pieno.
- Tono di voce: italiano, del "tu", diretto e ironico sulla burocrazia fiscale ma mai sul lettore; niente gergo inutile, ogni termine tecnico (TD17, reverse charge) spiegato in una frase.

**generation.md**

- Durata: reel da 30 a 90 secondi; hook entro i primi 2 secondi, sempre una domanda o un numero.
- Struttura: hook, problema, spiegazione, esempio concreto, domanda al pubblico, CTA, chiusura col logo. Capitoli da 3 a 5.
- Beat: un'idea per beat, da 4 a 14 parole parlate, ogni beat con un cambio visivo.
- Scrittura per la voce: frasi brevi, numeri scritti come vanno pronunciati, niente sigle non spiegate, punteggiatura che guida le pause; niente trattino lungo nei testi.
- Accuratezza fiscale: ogni affermazione normativa deve essere corretta e aggiornata. Se non sei certo, verifica su fonti ufficiali (Agenzia delle Entrate) e annota la fonte in `post.json`; se non puoi verificare, non usare quell'affermazione.
- Regole di scena: quando usare mockup, contatori, A/B, timbri; massimo 2 sticker contemporanei; una sola parola evidenziata per beat.
- Cover: titolo massimo 6 parole, una parola evidenziata, kicker = nome rubrica.

**strategy.md**

- Pubblico: freelance, piccole imprese e commercialisti che gestiscono autofatture e rifatturazioni.
- Pilastri di contenuto (proposta da validare): errori comuni e sanzioni, scadenze e calendario fiscale, spiegazioni semplici delle tipologie di documento, storie e situazioni tipiche, come Refattura risolve un problema concreto.
- Rubriche: 4-6 rubriche ricorrenti con nome, formato, colore dominante e frequenza.
- Frequenza di partenza: 3 reel e 1 carosello a settimana, da confermare con l'umano.

## Repo pubblico: cosa committare

Il repo è pubblico e contiene anche i video e le copertine generate. Questo impone regole precise su file binari, licenze e segreti.

| Cosa | Nel repo? | Come |
| --- | --- | --- |
| Codice, schemi, guideline, `CLAUDE.md` | Sì | Normale |
| `script.json`, `post.json`, `words.json`, `mouth.json`, `calendar.json` | Sì | Normale, sono piccoli e servono a ri-renderizzare |
| `reel.mp4`, `cover.png`, slide, `voice.wav` | Sì | Git LFS, tracciati da `.gitattributes` fin dal primo commit |
| Frame di auto-review, cache Remotion, `tools/` | No | `.gitignore` |
| Font OFL (DM Sans, DM Mono, font a mano) | Sì | Con il file di licenza accanto |
| SFX e musica CC0 (es. Kenney) | Sì | Con fonte e licenza nel manifest |
| SFX e musica con licenze che vietano la redistribuzione dei file (Pixabay, Mixkit e simili) | No | Cartella locale ignorata, manifest con URL di download e script per riscaricarli |
| Credenziali Google, token Instagram | Mai | `.env` e file fuori dal repo |

Note:

- La quota gratuita di Git LFS su GitHub è limitata: verifica i limiti attuali e aggiungi uno script che stima lo spazio occupato. Se la quota non basta, sposta i render finali come asset di GitHub Release, uno per mese, e tieni nel repo solo i link.
- Licenze distinte: codice sotto MIT, mentre mascotte, logo e asset di brand restano riservati. Scrivilo nel README e in un file `ASSETS-LICENSE`.
- Il calendario e gli script sono visibili pubblicamente prima della pubblicazione: scelta confermata dall'umano, tutto resta nel repo pubblico. Non serve un repo privato per `content/`.
- Prima di ogni commit verifica che non entrino file oltre 50 MB fuori da LFS e nessun file che corrisponda a pattern di segreti.

## Ordine di sviluppo

Procedi una fase alla volta. Una fase è chiusa solo quando il criterio di accettazione è verificato su un render reale e l'umano l'ha visto.

1. **Fase 0, fondamenta.** Monorepo, `CLAUDE.md`, script `setup` per i binari, Git LFS configurato, bozze delle tre guideline, mascotte provvisoria. *Accettazione:* `pnpm setup` funziona su Windows e Linux; un render di 5 secondi con logo e testo animato.
2. **Fase 1, voce e testo.** Provider TTS (Google Chirp e Kokoro), allineamento con whisper.cpp, sottotitoli parola singola e karaoke, cambi di sfondo per beat, header o barra capitoli. *Accettazione:* reel di 30 secondi da uno `script.json` scritto da te, con parole sincronizzate entro 1 frame percepibile.
3. **Fase 2, mascotte.** Rig, idle, libreria di pose, espressioni, sguardo, lip sync con Rhubarb e fallback. *Accettazione:* lo stesso reel con la mascotte che parla, cambia posa sui beat e chiude la bocca nelle pause.
4. **Fase 3, scene e audio.** Libreria di scene (mockup chat e notifiche, contatori, A/B, calendario), sticker, manifest SFX con `impactMs`, regole di mix, musica con ducking. *Accettazione:* reel completo di 60 secondi che passa la checklist di auto-review e misura circa -14 LUFS.
5. **Fase 4, cover e caroselli.** Template di cover per rubrica, `CarouselSlide`, `GridPreview`. *Accettazione:* 12 cover generate e una griglia di anteprima coerente con le regole di alternanza.
6. **Fase 5, planner.** `/plan-quarter`, `calendar.json`, app Next.js con calendario, dettaglio, approva e rifiuta. *Accettazione:* piano di 13 settimane generato e 3 post portati da `idea` a `ready-for-review` con un solo comando ciascuno.
7. **Fase 6, autonomia e pubblicazione.** Loop di auto-review robusto, comando headless per generare in batch i post della settimana, script `publish` per Instagram. *Accettazione:* un post approvato pubblicato su un account di test.

Regole di lavoro valide in ogni fase:

- Commit piccoli e descrittivi in inglese; nessun riferimento a Claude e nessun co-author nei messaggi di commit.
- Nessun trattino lungo nei testi generati e nella documentazione.
- Aggiorna `CLAUDE.md` a fine fase con comandi, convenzioni e decisioni prese.
- Quando una scelta tecnica di questo documento si rivela sbagliata o superata, fermati, spiega perché e proponi l'alternativa prima di cambiarla.
- Per ogni libreria o API esterna, verifica la documentazione attuale invece di affidarti alla memoria.
