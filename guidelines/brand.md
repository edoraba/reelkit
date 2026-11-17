# Brand per i social

> **BOZZA del 2026-11-17, da approvare.** Finché Edoardo non la approva, nessuna generazione la usa come regola definitiva. Ogni feedback ricorrente diventa una regola scritta qui.

Riferimento stilistico: la grammatica visiva di match.creativelab (ritmo, testo che segue la voce, mascotte che reagisce, mockup che illustrano la frase, SFX), mai la sua identità. Palette, mascotte, font e testi sono di Refattura.

### Distanza dal riferimento (feedback di Edoardo, 2026-11-17)

Il primo render di prova somigliava troppo a match.creativelab. Regola: dal riferimento si prendono i **meccanismi** (cosa succede e quando), mai i **segni** (come appare). Non si usano:

- il box lime ruotato con ombra nera come evidenziazione;
- la griglia di punti sullo sfondo;
- il cono di luce sotto la mascotte;
- arti a tubo con mani bianche a guanto;
- l'etichetta capitolo nel formato `01 / 03 · TITOLO` sotto una barra segmentata;
- in generale, qualsiasi elemento che si riconosca come "loro" a colpo d'occhio.

Ogni segno visivo deve nascere dal mondo di Refattura (carta, registro, inchiostro blu, timbri). Direzione in discussione: vedi `docs/decisions.md` D-013.

Fonte dei token: `refattura/DESIGN.md`, copiati in `packages/brand/src/tokens.ts`. Nel codice i colori si prendono sempre da `@reelkit/brand`, mai scritti a mano.

## Palette

L'app Refattura è calma: un inchiostro blu, carta fredda, tre timbri di stato. I reel hanno bisogno di più energia, quindi usano la stessa base con due aggiunte (`lime`, `sky`) e un cambio di sfondo per ogni concetto.

> **`lime` in discussione** (Edoardo, 2026-11-17): forse troppo acceso per Refattura. Non usarlo in contenuti nuovi finché non si sceglie l'alternativa (D-013).

| Nome           | OKLCH                | Hex     | Ruolo nei reel                                 |
| -------------- | -------------------- | ------- | ---------------------------------------------- |
| `inkBlue`      | 52.82% 0.2628 262.87 | #0052ff | Sfondo principale, colore del brand            |
| `graphite`     | 21.03% 0.002 262.87  | #181819 | Sfondo scuro, contorni, testo su chiaro        |
| `paperCool`    | 97.02% 0.002 262.87  | #f4f5f6 | Sfondo chiaro, chiusura col logo               |
| `sheetWhite`   | 100% 0.001 262.87    | #ffffff | Testo su sfondi saturi, corpo della mascotte   |
| `stampGreen`   | 49% 0.14 151.89      | #007439 | Sfondo "soluzione", "giusto"                   |
| `stampRed`     | 53% 0.205 26.82      | #c7171e | Sfondo "errore", "sanzione"                    |
| `stampAmber`   | 52% 0.12 70          | #915b00 | Solo sticker e timbri "attenzione", mai sfondo |
| `lime` (nuovo) | 93% 0.2 123          | #cffd4d | Box di evidenziazione, sticker parola chiave   |
| `sky` (nuovo)  | 75% 0.13 264         | #84acff | Sfondo chiaro secondario, arti della mascotte  |

### Sfondi e coppie ammesse

Sei sfondi, uno per concetto. Ogni coppia è verificata con `pnpm brand:contrast` (minimo 4,5:1).

| Sfondo  | Testo   | Box evidenziazione      | Contrasto testo | Contrasto box |
| ------- | ------- | ----------------------- | --------------- | ------------- |
| `blue`  | bianco  | lime con testo grafite  | 5,75            | 15,05         |
| `ink`   | carta   | lime con testo grafite  | 16,26           | 15,05         |
| `paper` | grafite | lime con testo grafite  | 16,26           | 15,05         |
| `sky`   | grafite | blu con testo bianco    | 7,88            | 5,75          |
| `green` | bianco  | lime con testo grafite  | 5,90            | 15,05         |
| `red`   | bianco  | carta con testo grafite | 5,88            | 16,26         |

Regole:

- Il colore di sfondo cambia quando cambia il concetto, non a ogni beat.
- `red` solo per errori, sanzioni, cose da non fare. `green` solo per soluzioni e risposte giuste.
- Sugli sfondi c'è sempre una griglia di punti a contrasto bassissimo.
- Mai sfumature: campiture piatte, ombre solo come offset pieno.

## Tipografia

Set predefinito (`brand`):

- **Bricolage Grotesque 800**: kinetic typography, titoli, cover. Tracking -0.03em, interlinea 1.
- **Caveat 700**: kicker delle cover, timbri, note scritte a mano. Leggermente ruotato (-2°).
- **DM Mono 500**: numeri, importi, date, codici (TD17), etichette dei capitoli in maiuscolo.

Set giocosi in prova (decisione D-002), confrontabili con `pnpm render:fontlab`: `gabarito` (Gabarito + Shantell Sans), `rubik` (Rubik + Gochi Hand), `baloo` (Baloo 2 + Patrick Hand), `fredoka` (Fredoka + Caveat). La scelta finale si fa sui primi reel.

Scala in px per il formato 1080×1920:

| Ruolo                      | px  |
| -------------------------- | --- |
| Parola singola al centro   | 168 |
| Righe karaoke (2-4 parole) | 104 |
| Titolo cover               | 150 |
| Kicker a mano              | 72  |
| Testo nei mockup           | 48  |
| Etichetta capitolo, pill   | 34  |

## Safe zone e formati

- Reel e cover: 1080×1920, 30 fps. Carosello: 1080×1350.
- Nessun testo o sticker entro 250 px dall'alto, 480 px dal basso, 64 px da sinistra, 150 px da destra (interfaccia di Instagram e TikTok). Valori da verificare su screenshot reali dell'app.
- La mascotte può scendere con i piedi nella fascia bassa; il viso no.
- Cover: titolo e soggetti nella fascia centrale 1080×1440 (da y 240 a y 1680), quella che resta visibile nella griglia del profilo.

## Logo

- File: `assets/brand/logo.svg` (simbolo) e `assets/brand/logotype.svg` (simbolo e scritta). Copiati da `refattura/public/img/`, diritti riservati.
- Il logotipo va su `paper` o `sheetWhite`. Su sfondi saturi si usa il solo simbolo dentro un cerchio bianco (da disegnare in Fase 3).
- Chiusura di ogni reel: logotipo e tagline.
- Tagline **provvisoria**: "autofatture, senza pensieri". Da confermare.

## Mascotte

La mascotte attuale è **provvisoria** (Fase 0): un foglio di fattura con angolo piegato, faccia, braccia e gambe a tubo azzurre, mani bianche, scarpe grafite. Quella definitiva la fornisce Edoardo e deve rispettare il naming dei livelli qui sotto.

Personalità (proposta):

- un po' cinica sulla burocrazia, mai sull'utente: sta sempre dalla sua parte;
- pratica: quando c'è un problema, ha già la soluzione in tasca;
- espressiva ma non isterica: reagisce, non urla.

Cosa non fa mai: deridere chi sbaglia, piangere, comparire triste sul finale, toccare o coprire il testo, fare gesti volgari, comparire senza il cono di luce nelle scene centrali.

Nome: da decidere.

### Pose ed espressioni

Pose (libreria completa in Fase 2): `neutral`, `arms-up`, `point-left`, `point-up`, `shrug`, `thinking`, `wave`, `facepalm`, `celebrate`. In Fase 0 esistono `neutral` e `arms-up`.

Espressioni (Fase 2): `happy`, `worried`, `skeptical`, `surprised`, combinando sopracciglia, palpebre e bocca a riposo.

### Naming dei livelli SVG

Ogni parte animata è un gruppo `<g>` con questo `id`. Un SVG esportato da Figma con gli stessi nomi di livello si aggancia al rig senza modificare il codice. ViewBox 400×600, piedi a y 580.

| id                           | Contenuto                               | Pivot (rotazione)       |
| ---------------------------- | --------------------------------------- | ----------------------- |
| `mascot`                     | tutto il personaggio                    | 200, 580 (piedi)        |
| `leg-l`, `leg-r`             | gamba e scarpa                          | anca                    |
| `body`                       | foglio, braccia, testa (respira)        | 200, 472 (bordo basso)  |
| `arm-l-upper`, `arm-r-upper` | braccio, contiene l'avambraccio         | spalla 88,262 e 312,262 |
| `arm-l-lower`, `arm-r-lower` | avambraccio, contiene la mano           | gomito                  |
| `hand-l`, `hand-r`           | mano                                    | polso                   |
| `sheet`                      | il foglio con angolo piegato e righe    |                         |
| `head`                       | la zona del viso                        |                         |
| `eye-l`, `eye-r`             | bianco dell'occhio                      | centro dell'occhio      |
| `pupil-l`, `pupil-r`         | pupilla (segue lo sguardo)              |                         |
| `lid-l`, `lid-r`             | palpebra (ammiccamento)                 |                         |
| `brow-l`, `brow-r`           | sopracciglio                            |                         |
| `mouth`                      | bocca (forme Rhubarb A-H e X in Fase 2) | 200, 284                |

Il contratto vive in `packages/video/src/mascot/rig.ts`.

## Stile illustrativo

Vale per mascotte, icone e mockup:

- contorno grafite spesso e uniforme (8 px a 1080 di larghezza);
- campiture piatte, 2-3 colori per oggetto;
- angoli arrotondati (raggio 18 px);
- nessuna sfumatura, nessuna ombra realistica; ombra solo come offset pieno grafite di 12 px;
- tutto vettoriale (SVG), niente immagini raster generate.

## Tono di voce

- Italiano, del "tu".
- Diretto e ironico sulla burocrazia fiscale, mai sul lettore.
- Niente gergo inutile: ogni termine tecnico (TD17, reverse charge, integrazione) spiegato in una frase la prima volta che compare.
- Mai il trattino lungo nei testi.
