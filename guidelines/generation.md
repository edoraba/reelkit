# Regole di generazione

> **BOZZA del 2026-11-17, da approvare.** Rileggi questo file prima di ogni script. Ogni feedback ricorrente di Edoardo diventa una regola qui, con la data.

## Durata e struttura del reel

- Durata da 30 a 90 secondi.
- Hook entro i primi 2 secondi: sempre una domanda o un numero.
- Arco: hook, problema, spiegazione, esempio concreto, domanda al pubblico (A o B nei commenti), CTA, chiusura con tagline e logo.
- Da 3 a 5 capitoli, ognuno con etichetta breve in maiuscolo (`01 / 04 · IL PROBLEMA`) nella barra in alto. In alternativa un header fisso col titolo del reel, per i reel sotto i 40 secondi.

## Beat

- Un'idea per beat, da 4 a 14 parole parlate.
- Ogni beat ha un cambio visivo (scena, mockup, sticker, posa o sfondo).
- Nessun beat più breve di 0,8 s o più lungo di 5 s senza cambio visivo.
- Cambio di scena ogni 2-3 secondi circa; lo sfondo cambia solo quando cambia il concetto.
- Riferimenti temporali (`at`) sempre a parole del parlato, mai a secondi.

## Scrivere per la voce

- Frasi brevi, una subordinata al massimo.
- Numeri scritti come si pronunciano quando serve ("duemilaquattrocento euro" nel parlato, "2.400 €" a schermo).
- Niente sigle non spiegate. Prima volta: "il TD17, cioè l'autofattura per i servizi dall'estero".
- La punteggiatura guida le pause: punto per pausa piena, virgola per respiro.
- Mai il trattino lungo, né nel parlato né a schermo.
- Del "tu", tono diretto, ironia sulla burocrazia e mai sul lettore.

## Accuratezza fiscale

- Ogni affermazione normativa deve essere corretta e aggiornata alla data di pubblicazione.
- Se non sei certo, verifica su fonti ufficiali (Agenzia delle Entrate: normativa, circolari, specifiche tecniche della fattura elettronica) e annota fonte e data di verifica in `post.json`.
- Se non puoi verificare, non usare l'affermazione.
- Mai promettere risparmi o esiti fiscali; esempi numerici chiaramente indicati come esempi.

## Testo a schermo

- Parola singola al centro per hook e frasi d'impatto; righe karaoke da 2-4 parole con la parola corrente evidenziata per le spiegazioni.
- Una sola parola evidenziata per beat (`highlight`), nel box lime ruotato.
- La parola evidenziata non va mai da sola a capo staccata dalla punteggiatura che la segue.

## Scene e sticker

| Scena                         | Quando                                                         |
| ----------------------------- | -------------------------------------------------------------- |
| Mockup chat o notifiche       | Una persona scrive, arriva un messaggio, un fornitore risponde |
| Contatore su griglia di punti | Un importo, un numero di fatture, una sanzione                 |
| Card A/B                      | Confronto fra due scelte, domanda al pubblico                  |
| Calendario                    | Scadenze, date, "entro il giorno X"                            |
| Timbro                        | Esito netto: SANZIONE, OK, SCADUTA                             |
| Testo barrato e corretto      | Errore comune seguito dalla versione giusta                    |

- Massimo 2 sticker contemporanei.
- Nessuno sticker sopra la mascotte o sopra i sottotitoli.
- Mockup sopra la mascotte, mai dietro.

## Mascotte nel beat

- Ogni beat può indicare `pose` ed `expression`. Se non le indica, la mascotte resta in idle e fa un micro-gesto sulla parola evidenziata.
- Sguardo verso l'elemento che entra in scena, poi di nuovo verso la camera.
- Bocca chiusa quando la voce tace.

## SFX

Gli SFX li risolve la pipeline (`pipeline sfx-plan`), non si scrivono a mano nel video.

- **Di componente**, automatici: sticker lime `pop`, timbro `stamp`, freccia tratteggiata `swish`, barrato `marker`, card che scorrono `whoosh-soft`, contatore `tick` a ogni step, cambio sfondo `swoosh`.
- **Semantici**, scelti nel beat e ancorati a una parola: `cash-register` su un importo, `notification` su un messaggio, `typing` su una chat, `ding` su un'idea, `error` su una sanzione.

Regole di mix (nel codice):

- voce a riferimento; SFX da -12 a -18 dB sotto la voce; musica da -20 a -24 dB con ducking quando la voce parla;
- loudness integrata del mix intorno a -14 LUFS;
- due SFX non partono a meno di 250 ms l'uno dall'altro; in conflitto vince il semantico;
- whoosh e swoosh anticipati di 2-3 frame rispetto al movimento;
- nessun SFX sopra l'attacco di una parola evidenziata;
- lo stesso tag non usa lo stesso file due volte di fila;
- un solo loop musicale per reel, con fade in e fade out.

## Cover

- Kicker a mano in alto = nome della rubrica.
- Titolo di massimo 6 parole, una parola evidenziata.
- Illustrazione SVG al centro, mascotte in un angolo con posa ed espressione coerenti col tema.
- Tutto dentro la fascia centrale che sopravvive al ritaglio della griglia.
- La cover è il primo frame del reel.
- Deve restare leggibile ridotta a miniatura della griglia.

## Testo del post

- Caption: hook nella prima riga, massimo 3 paragrafi brevi, domanda finale.
- Da 3 a 5 hashtag pertinenti.
- Primo commento facoltativo (fonte normativa, link).

## Auto-review

Prima di portare un post a `ready-for-review`:

- nessun testo fuori dalle safe zone o tagliato;
- nessuno sticker sovrapposto a mascotte o sottotitoli;
- nessun beat sotto 0,8 s o sopra 5 s senza cambio visivo;
- contrasto leggibile su ogni frame;
- bocca chiusa nei silenzi (10 frame consecutivi nel parlato, 1 nel silenzio);
- loudness intorno a -14 LUFS misurata con ffmpeg;
- trascrizione di ritorno del mix confrontata con lo script;
- cover leggibile in miniatura.

Massimo 3 iterazioni di correzione, poi segnala i problemi residui.
