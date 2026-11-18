import { paper } from '@reelkit/brand';
import { useCurrentFrame } from 'remotion';
import { CutoutStickerFilter } from '../../lab/cutouts/paper';
import { InvoiceRoll } from '../InvoiceRoll';
import type { AltSceneProps } from './registry';

/**
 * Alternative scene `reading` (D-032): glasses on, a sheet in hand, the eyes run along the
 * lines and drop to the next one. Talks on the speech stretches like the standard mascot.
 */
export const Reading: React.FC<AltSceneProps> = ({ p, talk, seed, width }) => {
  const frame = useCurrentFrame();
  // Eyes sweep left to right along a line in 24 frames, then hop back and down a little.
  const step = Math.floor(frame / 2) * 2;
  const along = (step % 24) / 24;
  const gaze = { x: -0.7 + 1.4 * along, y: 0.35 + 0.15 * (Math.floor(step / 24) % 3) };
  return (
    <InvoiceRoll
      width={width}
      cues={[{ at: 0, pose: 'hold' }]}
      talk={talk}
      gaze={gaze}
      seed={`${seed}-reading`}
      pen={p.pen}
      palette={p}
      eyes="half"
      lean={-3}
      hold={{ right: 'sheet' }}
      look={{ limbWidth: 12, roll: p.roll, accent: p.pill, rule: 'oklch(85% 0.04 264)' }}
      faceOverlay={({ eyeY, eyeDx, ink }) => (
        <g fill={paper.white} fillOpacity={0.35} stroke={ink} strokeWidth={6}>
          <circle cx={200 - eyeDx} cy={eyeY} r={21} />
          <circle cx={200 + eyeDx} cy={eyeY} r={21} />
          <path
            d={`M ${200 - eyeDx + 21} ${eyeY - 3} Q 200 ${eyeY - 12} ${200 + eyeDx - 21} ${eyeY - 3}`}
            fill="none"
          />
        </g>
      )}
      defs={<CutoutStickerFilter id="altReading" frame={frame} />}
      filter="url(#altReading)"
    />
  );
};
