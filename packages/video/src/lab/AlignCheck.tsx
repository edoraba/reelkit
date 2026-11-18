import { cutoutPalette } from '@reelkit/brand';
import { Audio } from '@remotion/media';
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { fontsOf } from '../brand/fonts';

/**
 * Word alignment check (D-030): the voice plays and the word being spoken is highlighted, so
 * sync can be judged by eye and ear. Props come from words.json of `pnpm pipeline align`.
 *   pnpm exec remotion render AlignCheck out/lab/align-check.mp4 --props=<file> --scale=0.5
 */
export type AlignCheckProps = {
  /** Audio path inside the public folder (assets/). */
  audio: string;
  durationMs: number;
  words: Array<{ word: string; startMs: number; endMs: number; match: string }>;
  pauses: Array<{ startMs: number; endMs: number }>;
};

export const alignCheckDefaults: AlignCheckProps = {
  audio: '',
  durationMs: 1000,
  words: [],
  pauses: [],
};

const p = cutoutPalette('notte');
const mono = fontsOf('brand').mono;

export const AlignCheck: React.FC<AlignCheckProps> = ({ audio, words, pauses }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const current = words.findIndex((w) => ms >= w.startMs && ms < w.endMs);
  const inPause = pauses.some((q) => ms >= q.startMs && ms < q.endMs);
  return (
    <AbsoluteFill style={{ backgroundColor: p.bg, padding: 70, gap: 40 }}>
      {audio && <Audio src={staticFile(audio)} />}
      <div style={{ ...mono, fontSize: 34, color: p.motifs[0] }}>
        {(ms / 1000).toFixed(2)} s · {inPause ? 'PAUSE' : current >= 0 ? `#${current}` : ''}
      </div>
      <div
        style={{
          fontFamily: "'Sour Gummy', sans-serif",
          fontWeight: 800,
          fontSize: 150,
          color: p.text,
          minHeight: 200,
        }}
      >
        {current >= 0 ? words[current]!.word : ''}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px 16px',
          fontFamily: "'Sour Gummy', sans-serif",
          fontWeight: 700,
          fontSize: 48,
          lineHeight: 1.15,
        }}
      >
        {words.map((w, i) => (
          <span
            key={i}
            style={{
              color: i === current ? p.highlight.text : p.text,
              backgroundColor: i === current ? p.highlight.color : 'transparent',
              opacity: i < current || i === current ? 1 : 0.35,
              padding: '0 6px',
              borderRadius: 6,
              textDecoration: w.match === 'guessed' ? 'underline dotted' : undefined,
            }}
          >
            {w.word}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
