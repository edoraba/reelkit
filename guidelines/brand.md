# Brand for social

> **DRAFT of 2026-11-17, to be approved.** Until Edoardo approves it, no generation uses it as a definitive rule. Every recurring feedback becomes a rule written here.

Style reference: the visual grammar of match.creativelab (rhythm, text that follows the voice, a mascot that reacts, mockups that illustrate the sentence, SFX), never its identity. Palette, mascot, fonts and texts belong to Refattura.

### Distance from the reference (Edoardo's feedback, 2026-11-17)

The first test render looked too much like match.creativelab. Rule: take the **mechanisms** (what happens and when) from the reference, never the **signs** (how it looks). Do not use:

- the rotated lime box with black shadow as highlight;
- the dot grid in the background;
- the light cone under the mascot;
- tube limbs with white glove-like hands;
- the chapter label in the `01 / 03 · TITOLO` format under a segmented bar;
- in general, any element that is recognizable as "theirs" at a glance.

Every visual sign must come from the world of Refattura (paper, ledger, ink blue, stamps).

### Visual system: squared paper and receipts (chosen by Edoardo, 2026-11-17, D-015)

Two scene families, alternated inside the same reel and across reels:

- **Quadretti** (squared paper): a full-frame squared-paper texture, binder tabs as chapter header, big type on the paper. Good for explanations, rules, steps.
- **Scontrino** (receipt): a torn receipt strip over a plain background, rows in DM Mono, a pen circle or a stamp on the slip. Good for amounts, costs, counts, totals, "what you lose".

Backgrounds change between scenes and between reels: blue, paper (white), sky, graphite, and the stamp colors when the concept calls for them. Both families work on every background; the paper strip and the squared texture keep the look consistent while the color changes.

Highlighting the key word:

- **yellow marker** (`markerYellow` behind the word, dark text) on light backgrounds and on the receipt;
- **pen underline** (hand-drawn stroke under the word) on blue and dark backgrounds.

The rotated lime box is retired. Not chosen: ruled ledger paper with margin, minimal flat counter (kept in `pnpm render:lab` for reference only).

Token source: `refattura/DESIGN.md`, copied to `packages/brand/src/tokens.ts`. In code, colors always come from `@reelkit/brand`, never written by hand.

## Palette

The Refattura app is calm: one ink blue, cool paper, three status stamps. Reels need more energy, so they use the same base with two additions (`lime`, `sky`) and a background change for each concept.

> **`lime` retired** (Edoardo, 2026-11-17): too bright for Refattura. Replaced by `markerYellow` and the pen underline (D-015). Do not use it in new content.

| Name                       | OKLCH                | Hex     | Role in the reels                                          |
| -------------------------- | -------------------- | ------- | ---------------------------------------------------------- |
| `inkBlue`                  | 52.82% 0.2628 262.87 | #0052ff | Main background, brand color                               |
| `graphite`                 | 21.03% 0.002 262.87  | #181819 | Dark background, outlines, text on light                   |
| `paperCool`                | 97.02% 0.002 262.87  | #f4f5f6 | Light background, closing with the logo                    |
| `sheetWhite`               | 100% 0.001 262.87    | #ffffff | Text on saturated backgrounds, mascot body                 |
| `stampGreen`               | 49% 0.14 151.89      | #007439 | "Solution", "right" background                             |
| `stampRed`                 | 53% 0.205 26.82      | #c7171e | "Error", "penalty" background                              |
| `stampAmber`               | 52% 0.12 70          | #915b00 | "Warning" stickers and stamps only, never a background     |
| `lime` (new)               | 93% 0.2 123          | #cffd4d | Highlight box, keyword sticker                             |
| `sky` (new)                | 75% 0.13 264         | #84acff | Secondary light background, pen ink on dark backgrounds    |
| `markerYellow` (candidate) | 92% 0.12 98          | #fae685 | Soft highlighter, candidate replacement for `lime` (D-013) |

### Backgrounds and allowed pairs

Six backgrounds, one per concept. Every pair is verified with `pnpm brand:contrast` (minimum 4.5:1).

| Background | Text     | Highlight box            | Text contrast | Box contrast |
| ---------- | -------- | ------------------------ | ------------- | ------------ |
| `blue`     | white    | lime with graphite text  | 5.75          | 15.05        |
| `ink`      | paper    | lime with graphite text  | 16.26         | 15.05        |
| `paper`    | graphite | lime with graphite text  | 16.26         | 15.05        |
| `sky`      | graphite | blue with white text     | 7.88          | 5.75         |
| `green`    | white    | lime with graphite text  | 5.90          | 15.05        |
| `red`      | white    | paper with graphite text | 5.88          | 16.26        |

Rules:

- The background color changes when the concept changes, not at every beat.
- `red` only for errors, penalties, things not to do. `green` only for solutions and right answers.
- Backgrounds always carry a very low-contrast dot grid.
- Never gradients: flat fills, shadows only as a solid offset.

## Typography

Default set (`brand`):

- **Bricolage Grotesque 800**: kinetic typography, titles, covers. Tracking -0.03em, line height 1.
- **Caveat 700**: cover kickers, stamps, handwritten notes. Slightly rotated (-2°).
- **DM Mono 500**: numbers, amounts, dates, codes (TD17), uppercase chapter labels.

Playful sets on trial (decision D-002), comparable with `pnpm render:fontlab`: `gabarito` (Gabarito + Shantell Sans), `rubik` (Rubik + Gochi Hand), `baloo` (Baloo 2 + Patrick Hand), `fredoka` (Fredoka + Caveat). The final choice is made on the first reels.

Scale in px for the 1080×1920 format:

| Role                      | px  |
| ------------------------- | --- |
| Single word in the center | 168 |
| Karaoke lines (2-4 words) | 104 |
| Cover title               | 150 |
| Handwritten kicker        | 72  |
| Text in mockups           | 48  |
| Chapter label, pill       | 34  |

## Safe zone and formats

- Reel and cover: 1080×1920, 30 fps. Carousel: 1080×1350.
- No text or sticker within 250 px from the top, 480 px from the bottom, 64 px from the left, 150 px from the right (Instagram and TikTok interface). Values to be verified on real screenshots of the app.
- The mascot's feet can go down into the bottom band; the face cannot.
- Cover: title and subjects in the central 1080×1440 band (from y 240 to y 1680), the one that stays visible in the profile grid.

## Logo

- Files: `assets/brand/logo.svg` (symbol) and `assets/brand/logotype.svg` (symbol and wordmark). Copied from `refattura/public/img/`, all rights reserved.
- The logotype goes on `paper` or `sheetWhite`. On saturated backgrounds only the symbol is used, inside a white circle (to be drawn in Phase 3).
- Closing of every reel: logotype and tagline.
- **Provisional** tagline: "autofatture, senza pensieri" (self-issued invoices, no worries). To be confirmed.

## Mascot

The mascot is the **invoice roll, A4 variant** (chosen by Edoardo, D-016), code in `packages/video/src/mascot/InvoiceRoll.tsx`:

- an A4 invoice sheet (1:1.41) with straight edges, a "FATTURA" header with the number "N.12", table rows (description left, amount right) and a blue "TOT" pill;
- a roll of paper on top, with a spiral at the left end: it squashes for a moment at every pose change and sways with the idle;
- dot eyes (blink squashes them, happy turns them into arcs) and a small mouth;
- arms, loop hands and legs are pen doodles in the `pen` color of the background (ink blue on light, white or light blue on dark).

The old provisional `Mascot` (sheet with folded corner and round eyes) stays only in the Phase 0 demo until the demo is restyled.

Personality (proposal):

- a bit cynical about bureaucracy, never about the user: always on the user's side;
- practical: when there is a problem, it already has the solution in its pocket;
- expressive but not hysterical: it reacts, it does not shout.

What it never does: mock people who make mistakes, cry, appear sad at the end, touch or cover the text, make vulgar gestures.

Name: to be decided.

### Poses and expressions

Poses (full library in Phase 2): `neutral`, `arms-up`, `point-left`, `point-up`, `shrug`, `thinking`, `wave`, `facepalm`, `celebrate`. Today `neutral`, `arms-up` and `wave` exist.

Expressions (Phase 2): `happy`, `worried`, `skeptical`, `surprised`. With dot eyes and no eyebrows, expressions come from eye shape (round, squashed, arcs), mouth, roll and arm pose. Today `happy` (arc eyes) exists.

### SVG layer naming

Every animated part is a `<g>` group with this `id`. An SVG exported from Figma with the same layer names attaches to the rig without code changes. ViewBox 400×600, feet at y 566. Target contract for the invoice roll; Phase 2 aligns `InvoiceRoll.tsx` and `rig.ts` to it (today `rig.ts` still describes the old provisional mascot).

| id                           | Content                                                | Pivot (rotation)              |
| ---------------------------- | ------------------------------------------------------ | ----------------------------- |
| `mascot`                     | the whole character                                    | 200, 566 (feet)               |
| `leg-l`, `leg-r`             | pen leg and foot                                       | hip                           |
| `body`                       | sheet, roll, arms and face (breathes)                  | 200, 470 (bottom edge)        |
| `roll`                       | rolled paper on top (squash on pose change, idle sway) | roll center                   |
| `arm-l-upper`, `arm-r-upper` | pen upper arm, contains the forearm                    | shoulders at mid sheet height |
| `arm-l-lower`, `arm-r-lower` | pen forearm, contains the hand                         | elbow                         |
| `hand-l`, `hand-r`           | loop hand                                              | wrist                         |
| `sheet`                      | A4 sheet: FATTURA header, number, table rows, TOT pill |                               |
| `head`                       | the face area                                          |                               |
| `eye-l`, `eye-r`             | dot eye (blink, happy arcs, gaze offset)               | eye center                    |
| `mouth`                      | mouth (Rhubarb shapes A-H and X in Phase 2)            | under the eyes                |

## Illustration style

Applies to mascot, icons and mockups:

- thick, uniform graphite outline (8 px at 1080 width);
- flat fills, 2-3 colors per object;
- rounded corners (radius 18 px);
- no gradients, no realistic shadows; shadow only as a solid graphite offset of 12 px;
- everything vector (SVG), no generated raster images.

## Tone of voice

- Italian, using "tu" (informal you).
- Direct and ironic about tax bureaucracy, never about the reader.
- No useless jargon: every technical term (TD17, reverse charge, integrazione) explained in one sentence the first time it appears.
- Never the em dash in texts.
