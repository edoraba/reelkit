import { cutoutPalettes, pickerFor } from '@reelkit/brand';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { fontsOf } from '../../brand/fonts';
import { Grain } from '../moodboards/kit';
import { OFFICE_OBJECTS } from './office';
import { BoilFilter } from './paper';

/**
 * Catalogue of the animated office objects, each cell on a different cut-paper palette.
 *   pnpm render:cutouts  ->  packages/video/out/lab/cutouts/office.mp4
 */
export const OFFICE_LAB_DURATION = 240;

const CW = 360;
const CH = 480;
const mono = fontsOf('brand').mono;

export const OfficeLab: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {OFFICE_OBJECTS.map((o, i) => {
        const p = cutoutPalettes[i % cutoutPalettes.length]!;
        const id = `ol${i}`;
        const Obj = o.C;
        return (
          <div
            key={o.key}
            style={{
              position: 'relative',
              width: CW,
              height: CH,
              overflow: 'hidden',
              backgroundColor: p.bg,
            }}
          >
            <svg width={CW} height={CH} style={{ position: 'absolute', inset: 0 }}>
              <defs>
                <BoilFilter id={id} frame={frame} scale={5} />
              </defs>
              <g filter={`url(#${id})`}>
                <Obj
                  f={frame}
                  x={180}
                  y={270}
                  scale={0.85}
                  start={6 + (i % 3) * 4}
                  a={p.motifs[0]}
                  b={p.motifs[1]}
                  c={p.motifs[2]}
                  hole={p.bg}
                  ink={p.text}
                  pick={pickerFor(p)}
                />
              </g>
            </svg>
            <Grain id={`${id}g`} opacity={0.16} width={CW} height={CH} />
            <div
              style={{
                position: 'absolute',
                left: 16,
                top: 14,
                ...mono,
                fontSize: 17,
                letterSpacing: '0.04em',
                color: p.text,
                opacity: 0.85,
                textTransform: 'uppercase',
              }}
            >
              {String(i + 1).padStart(2, '0')} {o.label}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
