import { cutoutPalette } from '@reelkit/brand';
import { Audio } from '@remotion/media';
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { fontsOf } from '../brand/fonts';

/**
 * Word alignment check (D-030): the voice plays and the screen text being spoken is
 * highlighted ("TD17" while the voice says "ti di diciassette"), with the spoken word under it,
 * so sync can be judged by eye and ear. Props come from words.json of `pnpm pipeline align`.
 *   pnpm exec remotion render AlignCheck out/lab/align-check.mp4 --props=<file> --scale=0.5
 */
type Timed = { startMs: number; endMs: number };

export type AlignCheckProps = {
  /** Audio path inside the public folder (assets/). */
  audio: string;
  durationMs: number;
  screen: Array<Timed & { text: string }>;
  words: Array<Timed & { word: string; match: string }>;
  pauses: Timed[];
};

export const alignCheckDefaults: AlignCheckProps = {
  audio: '',
  durationMs: 1000,
  screen: [],
  words: [],
  pauses: [],
};

const p = cutoutPalette('notte');
const mono = fontsOf('brand').mono;
const at = (ms: number) => (t: Timed) => ms >= t.startMs && ms < t.endMs;

export const AlignCheck: React.FC<AlignCheckProps> = ({ audio, screen, words, pauses }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const unit = screen.findIndex(at(ms));
  const word = words.findIndex(at(ms));
  const inPause = pauses.some(at(ms));
  return (
    <AbsoluteFill style={{ backgroundColor: p.bg, padding: 70, gap: 30 }}>
      {audio && <Audio src={staticFile(audio)} />}
      <div style={{ ...mono, fontSize: 34, color: p.motifs[0] }}>
        {(ms / 1000).toFixed(2)} s · {inPause ? 'PAUSE' : unit >= 0 ? `#${unit}` : ''}
      </div>
      <div
        style={{
          fontFamily: "'Sour Gummy', sans-serif",
          fontWeight: 800,
          fontSize: 150,
          color: p.text,
          minHeight: 190,
        }}
      >
        {unit >= 0 ? screen[unit]!.text : ''}
      </div>
      <div style={{ ...mono, fontSize: 40, color: p.motifs[0], minHeight: 50 }}>
        {word >= 0 ? `voice: ${words[word]!.word}` : ''}
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
        {screen.map((u, i) => (
          <span
            key={i}
            style={{
              color: i === unit ? p.highlight.text : p.text,
              backgroundColor: i === unit ? p.highlight.color : 'transparent',
              opacity: i <= unit ? 1 : 0.35,
              padding: '0 6px',
              borderRadius: 6,
            }}
          >
            {u.text}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
