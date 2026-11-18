import {
  bloomLayers,
  cutoutPalette,
  type CutoutPalette,
  type CutoutPaletteKey,
} from '@reelkit/brand';
import { seededRandom } from '@reelkit/schema';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { fontsOf } from '../../brand/fonts';
import { onTwos, pop, ramp, smoothClosed, type Pt } from './geometry';
import { BoilFilter } from './paper';
import { PaletteScene } from './PaletteBoard';

/**
 * Paper transitions between cut-out scenes (no sliding, Edoardo 2026-11-18), on the six
 * palettes in Refattura tones (D-027), dark and light alternated. Chosen: bloom and
 * cut, alternated (D-023); collage and star stay available but are not used in the reel.
 * - bloom: two organic paper layers grow from the star in the corner, the new scene grows
 *   inside them (layer colors from bloomLayers, visible on both scenes);
 * - cut: a dashed scissor line crosses the old scene, then the two pieces fall away;
 * - collage: sheets of the new color fly in and stack until they cover the frame, then the
 *   accent pieces fly off;
 * - star: a turning cut-paper star opens onto the new scene.
 *   pnpm render:cutouts  ->  packages/video/out/lab/cutouts/transitions.mp4
 */
export type TransitionKind = 'bloom' | 'cut' | 'collage' | 'star';

const SCENE = 90;
/** Length of each transition in frames. */
export const TRANSITION_FRAMES: Record<TransitionKind, number> = {
  bloom: 20,
  cut: 28,
  collage: 24,
  star: 20,
};
const DURATION = TRANSITION_FRAMES;

const PLAN: Array<{ key: CutoutPaletteKey; transition?: TransitionKind }> = [
  { key: 'blu' },
  { key: 'lavanda', transition: 'bloom' },
  { key: 'notte', transition: 'cut' },
  { key: 'azzurro', transition: 'bloom' },
  { key: 'viola', transition: 'cut' },
  { key: 'ghiaccio', transition: 'bloom' },
];
export const TRANSITION_REEL_DURATION = PLAN.length * SCENE;

const W = 1080;
const H = 1920;
const fonts = fontsOf('brand');

// ------------------------------------------------------------------------------------ shapes

/** Organic lobed outline (cut with scissors), boiling on twos. */
function organic(cx: number, cy: number, R: number, t: number, seed: string): string {
  const rnd = seededRandom('transition', seed);
  const ph = [rnd() * 6.3, rnd() * 6.3, rnd() * 6.3];
  const q = onTwos(t);
  const pts: Pt[] = [];
  for (let i = 0; i < 44; i++) {
    const th = (i / 44) * Math.PI * 2;
    const r =
      R *
      (1 +
        0.1 * Math.sin(5 * th + ph[0]! + q * 0.15) +
        0.05 * Math.sin(9 * th + ph[1]! - q * 0.2) +
        0.04 * Math.sin(3 * th + ph[2]!));
    pts.push([cx + Math.cos(th) * r, cy + Math.sin(th) * r]);
  }
  return smoothClosed(pts);
}

function star(cx: number, cy: number, R: number, rotate: number, points = 9, inner = 0.56): string {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const a = ((i / (points * 2)) * 360 + rotate) * (Math.PI / 180);
    const r = i % 2 === 0 ? R : R * inner;
    d += `${i === 0 ? 'M' : 'L'} ${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)} `;
  }
  return `${d}Z`;
}

/** Wobbly quadrilateral (a hand-cut sheet) around a box. */
function sheet(x: number, y: number, w: number, h: number, seed: string): string {
  const rnd = seededRandom('transition', seed);
  const j = () => (rnd() - 0.5) * 40;
  const pts: Pt[] = [
    [x + j(), y + j()],
    [x + w / 2 + j(), y + j() * 0.5],
    [x + w + j(), y + j()],
    [x + w + j() * 0.5, y + h / 2 + j()],
    [x + w + j(), y + h + j()],
    [x + w / 2 + j(), y + h + j() * 0.5],
    [x + j(), y + h + j()],
    [x + j() * 0.5, y + h / 2 + j()],
  ];
  return `M ${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ')} Z`;
}

const clip = (d: string): React.CSSProperties => ({ clipPath: `path('${d}')` });

// ------------------------------------------------------------------------------- transitions

/**
 * Incoming scene (on top), revealed by a paper transition. `lf` = frames since the incoming
 * scene started. The cut needs the outgoing scene again (`prevScene`), drawn at the frame it
 * had reached: `prevOffset` frames after its own start.
 */
export const PaperIn: React.FC<{
  to: CutoutPalette;
  from?: CutoutPalette;
  kind?: TransitionKind;
  scene: React.ReactNode;
  prevScene?: (idSuffix: string) => React.ReactNode;
  prevOffset?: number;
  /**
   * Paper layers and cut line (default). Off for the second pass that draws only the front
   * motifs above the mascot (D-032): there the old front motifs disappear under the bloom.
   */
  decor?: boolean;
}> = ({ to: v, from: prev, kind, scene, prevScene, prevOffset = 0, decor = true }) => {
  const [a1, a2] = prev ? bloomLayers(prev, v) : v.bloom;
  const lf = useCurrentFrame();
  if (!kind || !prev || lf >= DURATION[kind]) return <AbsoluteFill>{scene}</AbsoluteFill>;

  if (kind === 'bloom') {
    // Blooms out of the star in the top-right corner of the old scene.
    const cx = 880;
    const cy = 320;
    const maxR = 2500;
    const ra = maxR * ramp(lf, 0, 14);
    const rs = maxR * ramp(lf, 5, 14);
    if (!decor) {
      // Old front motifs stay outside the growing paper layers, new ones grow inside.
      const hole = organic(cx, cy, Math.max(1, ra), lf, 'bloomA');
      return (
        <AbsoluteFill>
          {prevScene && (
            <Sequence from={-prevOffset} layout="none">
              <AbsoluteFill
                style={{ clipPath: `path(evenodd, 'M 0 0 H ${W} V ${H} H 0 Z ${hole}')` }}
              >
                {prevScene('f')}
              </AbsoluteFill>
            </Sequence>
          )}
          {rs > 1 && (
            <AbsoluteFill style={clip(organic(cx, cy, rs, lf + 7, 'bloomB'))}>{scene}</AbsoluteFill>
          )}
        </AbsoluteFill>
      );
    }
    return (
      <AbsoluteFill>
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <path d={organic(cx, cy, Math.max(1, ra), lf, 'bloomA')} fill={a1} />
          <path d={organic(cx, cy, Math.max(1, ra * 0.82), lf + 3, 'bloomC')} fill={a2} />
        </svg>
        {rs > 1 && (
          <AbsoluteFill style={clip(organic(cx, cy, rs, lf + 7, 'bloomB'))}>{scene}</AbsoluteFill>
        )}
      </AbsoluteFill>
    );
  }

  if (kind === 'star') {
    const cx = 540;
    const cy = 960;
    const maxR = 2300;
    const ra = maxR * ramp(lf, 0, 14);
    const rs = maxR * ramp(lf, 4, 15);
    const rot = onTwos(lf) * 3;
    return (
      <AbsoluteFill>
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <path d={star(cx, cy, Math.max(1, ra), rot)} fill={a1} />
        </svg>
        {rs > 1 && <AbsoluteFill style={clip(star(cx, cy, rs, rot + 20))}>{scene}</AbsoluteFill>}
      </AbsoluteFill>
    );
  }

  if (kind === 'collage') {
    const covered = 12;
    const sheets = [
      { d: sheet(-80, -80, 720, 1080, 's1'), from: [-900, -300], rot: -6, at: 0, color: v.bg },
      { d: sheet(440, -80, 720, 1100, 's2'), from: [900, -400], rot: 5, at: 2, color: v.bg },
      { d: sheet(-80, 860, 740, 1140, 's3'), from: [-800, 900], rot: 4, at: 4, color: v.bg },
      { d: sheet(400, 820, 760, 1180, 's4'), from: [900, 800], rot: -5, at: 6, color: v.bg },
    ];
    const accents = [
      { d: organic(300, 520, 260, lf, 'acc1'), from: [-700, -200], at: 7, color: a1 },
      { d: organic(790, 1420, 300, lf, 'acc2'), from: [700, 600], at: 9, color: a2 },
    ];
    const out = ramp(lf, covered, 10);
    return (
      <AbsoluteFill>
        {lf >= covered && scene}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <defs>
            <BoilFilter id="collageBoil" frame={lf} scale={6} />
            <filter id="collageShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="6"
                dy="12"
                stdDeviation="9"
                floodColor="black"
                floodOpacity="0.28"
              />
            </filter>
          </defs>
          {lf < covered &&
            sheets.map((s, i) => {
              const p = pop(onTwos(lf), s.at, 10);
              return (
                <g key={i} filter="url(#collageShadow)">
                  <path
                    d={s.d}
                    fill={s.color}
                    filter="url(#collageBoil)"
                    transform={`translate(${s.from[0]! * (1 - p)} ${s.from[1]! * (1 - p)}) rotate(${s.rot * (1 - p)} 540 960)`}
                  />
                </g>
              );
            })}
          {accents.map((a, i) => {
            const pin = pop(onTwos(lf), a.at, 9);
            const dx = a.from[0]! * (1 - pin) - a.from[0]! * out * 1.3;
            const dy = a.from[1]! * (1 - pin) - a.from[1]! * out * 1.3;
            return (
              <g key={i} filter="url(#collageShadow)">
                <path
                  d={a.d}
                  fill={a.color}
                  filter="url(#collageBoil)"
                  transform={`translate(${dx} ${dy}) rotate(${(i ? 1 : -1) * 20 * out} 540 960)`}
                />
              </g>
            );
          })}
        </svg>
      </AbsoluteFill>
    );
  }

  // cut: the new scene is underneath, the old one is cut in two and falls away.
  const wave = (x: number) => 980 + 70 * Math.sin((x / W) * Math.PI * 3);
  const line: Pt[] = Array.from({ length: 25 }, (_, i) => [
    (i / 24) * (W + 40) - 20,
    wave((i / 24) * W),
  ]);
  const lineD = `M ${line.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ')}`;
  const top = `${lineD} L ${W + 40} -40 L -20 -40 Z`;
  const bottom = `${lineD} L ${W + 40} ${H + 40} L -20 ${H + 40} Z`;
  const CUT = 10;
  const drawn = ramp(lf, 0, CUT);
  const fall = Math.max(0, onTwos(lf) - CUT);
  const fallTop = Math.max(0, onTwos(lf) - CUT - 3);
  return (
    <AbsoluteFill>
      {scene}
      <Sequence from={-prevOffset} layout="none">
        <AbsoluteFill
          style={{
            ...clip(bottom),
            transform: `translateY(${0.5 * 7 * fall * fall}px) rotate(${fall * 1.1}deg)`,
            transformOrigin: '540px 1400px',
          }}
        >
          {prevScene?.('b')}
        </AbsoluteFill>
        <AbsoluteFill
          style={{
            ...clip(top),
            transform: `translate(${-fallTop * fallTop * 1.6}px, ${-fallTop * fallTop * 2.6}px) rotate(${-fallTop * 1.4}deg)`,
            transformOrigin: '540px 500px',
          }}
        >
          {prevScene?.('t')}
        </AbsoluteFill>
      </Sequence>
      {decor && lf < CUT + 2 && (
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <mask id="cutMask" maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
            <rect x={0} y={0} width={(W + 40) * drawn} height={H} fill="white" />
          </mask>
          <path
            d={lineD}
            fill="none"
            stroke={prev.text}
            strokeWidth={7}
            strokeDasharray="22 14"
            mask="url(#cutMask)"
          />
        </svg>
      )}
    </AbsoluteFill>
  );
};

const Incoming: React.FC<{ v: CutoutPalette; kind?: TransitionKind; prev?: CutoutPalette }> = ({
  v,
  kind,
  prev,
}) => (
  <PaperIn
    to={v}
    from={prev}
    kind={kind}
    scene={<PaletteScene p={v} />}
    prevScene={(s) => (prev ? <PaletteScene p={prev} idSuffix={s} /> : null)}
    prevOffset={SCENE}
  />
);

const Caption: React.FC = () => {
  const frame = useCurrentFrame();
  const i = PLAN.findIndex(
    (p, k) => p.transition && frame >= k * SCENE - 12 && frame < k * SCENE + 40,
  );
  const p = PLAN[i];
  if (!p?.transition) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 40,
        bottom: 40,
        padding: '10px 18px',
        borderRadius: 12,
        backgroundColor: 'oklch(0% 0 0 / 0.55)',
        color: 'white',
        ...fonts.mono,
        fontSize: 26,
        letterSpacing: '0.08em',
      }}
    >
      TRANSITION {i} · {p.transition.toUpperCase()}
    </div>
  );
};

export const TransitionReel: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: cutoutPalette('notte').bg }}>
    {PLAN.map((p, i) => {
      const v = cutoutPalette(p.key);
      const next = PLAN[i + 1];
      // The outgoing scene stays underneath while the next transition runs.
      const tail = next?.transition && next.transition !== 'cut' ? DURATION[next.transition] : 0;
      return (
        <Sequence key={p.key} from={i * SCENE} durationInFrames={SCENE + tail}>
          <Incoming
            v={v}
            kind={p.transition}
            prev={i > 0 ? cutoutPalette(PLAN[i - 1]!.key) : undefined}
          />
        </Sequence>
      );
    })}
    <Caption />
  </AbsoluteFill>
);
