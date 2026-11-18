import {
  contrast,
  cutoutPalettes,
  paper,
  pickerFor,
  visibleOn,
  type PaperName,
} from '@reelkit/brand';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { fontsOf } from '../../brand/fonts';
import { smoothClosed, type Pt } from './geometry';
import { OFFICE_OBJECTS } from './office';
import { BoilFilter } from './paper';

/**
 * Visibility rules of the cut-paper palettes (D-026), as pictures:
 * - VisibilityMatrix: every paper color on every palette background, with its contrast and
 *   whether it may sit there (min 2:1, no exceptions);
 * - ObjectsOnPalettes: the twelve office objects on the six palettes, colors chosen by rule.
 *   pnpm render:cutouts  ->  packages/video/out/lab/cutouts/{visibility.png,objects-palettes.png}
 */

const mono = fontsOf('brand').mono;
const HEAD = "'Sour Gummy', sans-serif";
const COLORS: PaperName[] = ['blue', 'navy', 'sky', 'ice', 'violet', 'lavender', 'white', 'ink'];
const CELL = 150;
const LABEL_W = 250;

export const VISIBILITY = {
  width: LABEL_W + COLORS.length * CELL + 40,
  height: 230 + cutoutPalettes.length * CELL + 40,
} as const;

function blob(r: number): string {
  const pts: Pt[] = [];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const rr = r * (1 + 0.08 * Math.sin(3 * a) + 0.05 * Math.sin(5 * a + 1));
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  return smoothClosed(pts);
}

export const VisibilityMatrix: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: 'oklch(97% 0.005 90)', padding: 20 }}>
    <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 52, color: paper.ink }}>
      What can sit on what
    </div>
    <div
      style={{
        ...mono,
        fontSize: 18,
        color: 'oklch(40% 0 0)',
        marginTop: 6,
        width: VISIBILITY.width - 60,
        lineHeight: 1.4,
      }}
    >
      A cut piece needs at least 2:1 luminance contrast with what it sits on. All the papers are
      blues and violets, so luminance is the only separation: blue and violet (1.16:1), sky and
      lavender (1.36:1), white and ice are never paired.
    </div>
    <div style={{ display: 'flex', marginTop: 24, marginLeft: LABEL_W }}>
      {COLORS.map((c) => (
        <div
          key={c}
          style={{ width: CELL, ...mono, fontSize: 17, textAlign: 'center', color: paper.ink }}
        >
          {c}
        </div>
      ))}
    </div>
    {cutoutPalettes.map((p) => (
      <div key={p.key} style={{ display: 'flex', alignItems: 'center', marginTop: 6 }}>
        <div
          style={{
            width: LABEL_W,
            fontFamily: HEAD,
            fontWeight: 800,
            fontSize: 30,
            color: paper.ink,
          }}
        >
          {p.name}
        </div>
        {COLORS.map((name) => {
          const color = paper[name];
          const same = color === p.bg;
          const ok = !same && visibleOn(color, p.bg);
          const ratio = same ? 1 : contrast(color, p.bg);
          return (
            <div
              key={name}
              style={{
                width: CELL - 8,
                height: CELL - 8,
                marginRight: 8,
                backgroundColor: p.bg,
                borderRadius: 12,
                position: 'relative',
              }}
            >
              {!same && (
                <svg width={CELL - 8} height={CELL - 8} style={{ position: 'absolute', inset: 0 }}>
                  <path
                    d={blob(36)}
                    transform={`translate(${(CELL - 8) / 2} ${(CELL - 8) / 2 - 12})`}
                    fill={color}
                  />
                </svg>
              )}
              <div
                style={{
                  position: 'absolute',
                  bottom: 6,
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  ...mono,
                  fontSize: 16,
                  color: p.text,
                }}
              >
                {same ? 'bg' : `${ratio.toFixed(2)} ${ok ? '✓' : '✗'}`}
              </div>
              {!same && !ok && (
                <svg width={CELL - 8} height={CELL - 8} style={{ position: 'absolute', inset: 0 }}>
                  <line
                    x1={20}
                    y1={20}
                    x2={CELL - 28}
                    y2={CELL - 44}
                    stroke={p.text}
                    strokeWidth={5}
                    strokeLinecap="round"
                    opacity={0.75}
                  />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    ))}
  </AbsoluteFill>
);

// ---------------------------------------------------------------- objects on every palette

const OW = 170;
const OH = 210;
export const OBJECTS_ON_PALETTES = {
  width: 160 + OFFICE_OBJECTS.length * OW,
  height: 50 + cutoutPalettes.length * OH,
  frame: 100,
} as const;

export const ObjectsOnPalettes: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: 'oklch(97% 0.005 90)' }}>
      <div style={{ display: 'flex', marginLeft: 160, height: 50, alignItems: 'center' }}>
        {OFFICE_OBJECTS.map((o) => (
          <div
            key={o.key}
            style={{ width: OW, ...mono, fontSize: 15, textAlign: 'center', color: paper.ink }}
          >
            {o.key}
          </div>
        ))}
      </div>
      {cutoutPalettes.map((p, r) => (
        <div key={p.key} style={{ display: 'flex', height: OH }}>
          <div
            style={{
              width: 160,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 12,
              fontFamily: HEAD,
              fontWeight: 800,
              fontSize: 24,
              color: paper.ink,
            }}
          >
            {p.name}
          </div>
          {OFFICE_OBJECTS.map((o, i) => {
            const Obj = o.C;
            const id = `op${r}${i}`;
            return (
              <svg
                key={o.key}
                width={OW}
                height={OH}
                style={{ backgroundColor: p.bg, display: 'block' }}
              >
                <defs>
                  <BoilFilter id={id} frame={frame} scale={4} />
                </defs>
                <g filter={`url(#${id})`}>
                  <Obj
                    f={frame}
                    x={OW / 2}
                    y={OH / 2 + 10}
                    scale={0.42}
                    start={0}
                    a={p.motifs[0]}
                    b={p.motifs[1]}
                    c={p.motifs[2]}
                    hole={p.bg}
                    ink={p.text}
                    pick={pickerFor(p)}
                  />
                </g>
              </svg>
            );
          })}
        </div>
      ))}
    </AbsoluteFill>
  );
};
