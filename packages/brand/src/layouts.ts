import type { CutoutPaletteKey } from './cutout';

/**
 * Scene layouts of the cut-paper palettes as data (mascot choreography, D-032): where each motif
 * and the office object sit, whether a motif is drawn behind the mascot (`back`) or can cover
 * it (`front`), and, for motifs on the mascot's lane, the x range they occupy and what the
 * mascot can do with them. The video draws from this; the pipeline plans the mascot with it.
 */
export type MotifKind =
  'frond' | 'blob' | 'kelp' | 'starBloom' | 'spiral' | 'sun' | 'waveBand' | 'palmette';

export type Interaction = 'lean' | 'tickle' | 'hide' | 'water';

export type OfficeObjectKey =
  | 'calculator'
  | 'scissors'
  | 'stapler'
  | 'binders'
  | 'stamp'
  | 'pencil'
  | 'envelope'
  | 'coins'
  | 'calendar'
  | 'coffee'
  | 'magnifier'
  | 'note';

export interface MotifSpot {
  id: string;
  kind: MotifKind;
  x: number;
  y: number;
  /** Extra props of the motif component (r, scale, rotate, seed, phase, points...). */
  params: Record<string, number | string>;
  /** Index into the palette's motif colors. */
  color: 0 | 1 | 2;
  start: number;
  depth: 'back' | 'front';
  /** Present when the motif stands on the mascot's lane (feet line y 1634). */
  lane?: { from: number; to: number; interactions: Interaction[] };
}

export interface SceneLayout {
  object: OfficeObjectKey;
  objectAt: { x: number; y: number; scale: number };
  motifs: MotifSpot[];
  /** Sample headline of the palette board (lab only) and the index of its marked word. */
  sample: { headline: string; mark: number };
}

const OBJECT_AT = { x: 220, y: 290, scale: 0.8 } as const;

export const sceneLayouts: Record<CutoutPaletteKey, SceneLayout> = {
  blu: {
    object: 'calculator',
    objectAt: OBJECT_AT,
    sample: { headline: 'Paghi software esteri?', mark: 2 },
    motifs: [
      {
        id: 'blu-star',
        kind: 'starBloom',
        x: 890,
        y: 300,
        params: { r: 120, seed: 'pb1' },
        color: 1,
        start: 8,
        depth: 'back',
      },
      {
        id: 'blu-frond',
        kind: 'frond',
        x: 130,
        y: 1760,
        params: { scale: 1.5, rotate: -6, seed: 'pb2' },
        color: 0,
        start: 4,
        depth: 'front',
        lane: { from: 40, to: 230, interactions: ['lean', 'water', 'hide'] },
      },
      {
        id: 'blu-blob',
        kind: 'blob',
        x: 950,
        y: 1700,
        params: { r: 80, seed: 'pb3' },
        color: 2,
        start: 12,
        depth: 'front',
        lane: { from: 870, to: 1030, interactions: ['lean'] },
      },
    ],
  },
  notte: {
    object: 'stapler',
    objectAt: OBJECT_AT,
    sample: { headline: 'Ogni fattura estera vuole la sua autofattura.', mark: 6 },
    motifs: [
      {
        id: 'notte-spiral',
        kind: 'spiral',
        x: 890,
        y: 300,
        params: { r: 105 },
        color: 1,
        start: 6,
        depth: 'back',
      },
      {
        id: 'notte-kelp-l',
        kind: 'kelp',
        x: 110,
        y: 1930,
        params: { scale: 1.5 },
        color: 0,
        start: 4,
        depth: 'front',
        lane: { from: 50, to: 170, interactions: ['tickle', 'hide'] },
      },
      {
        id: 'notte-kelp-r',
        kind: 'kelp',
        x: 950,
        y: 1930,
        params: { scale: 1.4, phase: 2 },
        color: 2,
        start: 12,
        depth: 'front',
        lane: { from: 890, to: 1010, interactions: ['tickle'] },
      },
    ],
  },
  azzurro: {
    object: 'calendar',
    objectAt: OBJECT_AT,
    sample: { headline: 'Tu come le fai?', mark: 1 },
    motifs: [
      {
        id: 'azzurro-sun',
        kind: 'sun',
        x: 880,
        y: 300,
        params: { scale: 1.5 },
        color: 1,
        start: 8,
        depth: 'back',
      },
      {
        id: 'azzurro-frond',
        kind: 'frond',
        x: 120,
        y: 1680,
        params: { scale: 1.5, rotate: -8, seed: 'pp1' },
        color: 0,
        start: 4,
        depth: 'front',
        lane: { from: 30, to: 220, interactions: ['lean', 'water', 'hide'] },
      },
      {
        id: 'azzurro-waves',
        kind: 'waveBand',
        x: 0,
        y: 1800,
        params: { width: 1080, scallops: 9, h: 40 },
        color: 0,
        start: 0,
        depth: 'back',
      },
    ],
  },
  ghiaccio: {
    object: 'stamp',
    objectAt: OBJECT_AT,
    sample: { headline: 'L’IVA la integri tu con il TD17.', mark: 6 },
    motifs: [
      {
        id: 'ghiaccio-palmette',
        kind: 'palmette',
        x: 900,
        y: 340,
        params: { scale: 1.1 },
        color: 0,
        start: 6,
        depth: 'back',
      },
      {
        id: 'ghiaccio-blob',
        kind: 'blob',
        x: 150,
        y: 1600,
        params: { r: 90, seed: 'pl1' },
        color: 2,
        start: 14,
        depth: 'front',
        lane: { from: 60, to: 240, interactions: ['hide', 'lean'] },
      },
      {
        id: 'ghiaccio-star',
        kind: 'starBloom',
        x: 940,
        y: 1640,
        params: { r: 80, seed: 'pl2' },
        color: 1,
        start: 10,
        depth: 'front',
        lane: { from: 860, to: 1020, interactions: ['tickle'] },
      },
    ],
  },
  viola: {
    object: 'envelope',
    objectAt: OBJECT_AT,
    sample: { headline: 'Refattura legge il PDF e prepara l’autofattura.', mark: 6 },
    motifs: [
      {
        id: 'viola-star',
        kind: 'starBloom',
        x: 900,
        y: 290,
        params: { r: 95, points: 7, seed: 'ps1' },
        color: 1,
        start: 8,
        depth: 'back',
      },
      {
        id: 'viola-frond',
        kind: 'frond',
        x: 950,
        y: 1780,
        params: { scale: 1.4, rotate: 10, seed: 'ps2' },
        color: 0,
        start: 12,
        depth: 'front',
        lane: { from: 860, to: 1040, interactions: ['lean', 'water'] },
      },
      {
        id: 'viola-blob',
        kind: 'blob',
        x: 150,
        y: 1640,
        params: { r: 85, seed: 'ps3' },
        color: 2,
        start: 16,
        depth: 'front',
        lane: { from: 65, to: 235, interactions: ['hide', 'lean'] },
      },
    ],
  },
  lavanda: {
    object: 'coffee',
    objectAt: OBJECT_AT,
    sample: { headline: 'Provalo: link in bio.', mark: 1 },
    motifs: [
      {
        id: 'lavanda-blob',
        kind: 'blob',
        x: 890,
        y: 290,
        params: { r: 95, seed: 'pr1' },
        color: 0,
        start: 8,
        depth: 'back',
      },
      {
        id: 'lavanda-kelp',
        kind: 'kelp',
        x: 120,
        y: 1930,
        params: { scale: 1.4, phase: 0.5 },
        color: 1,
        start: 4,
        depth: 'front',
        lane: { from: 60, to: 180, interactions: ['tickle', 'hide'] },
      },
      {
        id: 'lavanda-palmette',
        kind: 'palmette',
        x: 930,
        y: 1720,
        params: { scale: 1.1 },
        color: 1,
        start: 12,
        depth: 'front',
        lane: { from: 850, to: 1010, interactions: ['lean'] },
      },
    ],
  },
};
