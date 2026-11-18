import { refattura } from '@reelkit/brand';
import { AbsoluteFill } from 'remotion';
import { fontsOf } from '../../brand/fonts';
import { BOARDS, type Board } from './boards';

/**
 * One moodboard per art direction (1920 x 1080): a sample reel frame on the left, the notes
 * on the right. Plus an overview strip with all the sample frames side by side.
 *   pnpm render:moodboards  ->  packages/video/out/lab/moodboards/*.png
 */
export const MOODBOARD_SIZE = { width: 1920, height: 1080 } as const;
export const MOODBOARD_OVERVIEW = { width: 7 * 400, height: 711 + 90 } as const;

const fonts = fontsOf('brand');
const SCALE = 0.48;

const Frame: React.FC<{ board: Board; scale: number }> = ({ board, scale }) => (
  <div
    style={{
      width: 1080 * scale,
      height: 1920 * scale,
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 26,
      boxShadow: '0 24px 60px oklch(0% 0 0 / 0.22)',
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 1080,
        height: 1920,
        transform: `scale(${scale})`,
        transformOrigin: 'left top',
      }}
    >
      <board.Sample />
    </div>
  </div>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      ...fonts.mono,
      fontSize: 18,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: refattura.pencil,
      marginBottom: 6,
    }}
  >
    {children}
  </div>
);

export const MoodBoard: React.FC<{ index: number }> = ({ index }) => {
  const b = BOARDS[index]!;
  const body: React.CSSProperties = {
    fontFamily: fonts.display.fontFamily,
    fontWeight: 500,
    fontSize: 25,
    lineHeight: 1.32,
    color: refattura.graphite,
  };
  return (
    <AbsoluteFill style={{ backgroundColor: refattura.paperCool }}>
      <div style={{ position: 'absolute', left: 70, top: 79 }}>
        <Frame board={b} scale={SCALE} />
      </div>
      <div style={{ position: 'absolute', left: 660, top: 70, right: 80 }}>
        <div
          style={{ ...fonts.mono, fontSize: 20, letterSpacing: '0.14em', color: refattura.inkBlue }}
        >
          MOODBOARD {String(index + 1).padStart(2, '0')} / {String(BOARDS.length).padStart(2, '0')}
        </div>
        <div
          style={{
            ...fonts.display,
            fontSize: 78,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            color: refattura.graphite,
            marginTop: 8,
          }}
        >
          {b.title}
        </div>
        <div style={{ ...fonts.hand, fontSize: 38, color: refattura.inkBlue, marginTop: 4 }}>
          {b.after}
        </div>

        <ul style={{ ...body, margin: '18px 0 0', paddingLeft: 26 }}>
          {b.traits.map((t) => (
            <li key={t} style={{ marginBottom: 2 }}>
              {t}
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', gap: 46, marginTop: 22, alignItems: 'flex-start' }}>
          <div>
            <Label>Palette</Label>
            <div style={{ display: 'flex', gap: 14 }}>
              {b.palette.map((s) => (
                <div key={s.name} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: 66,
                      height: 66,
                      borderRadius: 14,
                      backgroundColor: s.color,
                      border: `2px solid oklch(0% 0 0 / 0.12)`,
                    }}
                  />
                  <div
                    style={{ ...fonts.mono, fontSize: 15, color: refattura.pencil, marginTop: 6 }}
                  >
                    {s.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <Label>Motifs</Label>
            <div style={{ transform: 'scale(0.6)', transformOrigin: 'left top', height: 96 }}>
              {b.motifs()}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 40, marginTop: 18 }}>
          <div style={{ flex: 1 }}>
            <Label>How we build it</Label>
            <div style={{ ...body, fontSize: 23 }}>{b.build}</div>
          </div>
          <div style={{ flex: 1 }}>
            <Label>How it moves</Label>
            <div style={{ ...body, fontSize: 23 }}>{b.motion}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 40, marginTop: 18 }}>
          <div style={{ flex: 1 }}>
            <Label>For Refattura</Label>
            <div style={{ ...body, fontSize: 23, color: refattura.stampGreen }}>+ {b.pro}</div>
            <div style={{ ...body, fontSize: 23, color: refattura.stampRed }}>- {b.con}</div>
          </div>
          <div style={{ flex: 1 }}>
            <Label>References</Label>
            {b.refs.map((r) => (
              <div
                key={r}
                style={{ ...fonts.mono, fontSize: 18, lineHeight: 1.45, color: refattura.graphite }}
              >
                {r}
              </div>
            ))}
          </div>
        </div>
        {b.note && (
          <div
            style={{
              ...body,
              fontSize: 20,
              color: refattura.pencil,
              marginTop: 14,
              fontStyle: 'italic',
            }}
          >
            {b.note}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/** All seven sample frames side by side, to compare the directions at a glance. */
export const MoodBoardOverview: React.FC = () => (
  <AbsoluteFill
    style={{ backgroundColor: refattura.paperCool, flexDirection: 'row', padding: '0 0 0 0' }}
  >
    {BOARDS.map((b, i) => (
      <div key={b.key} style={{ width: 400, padding: '20px 10px 0', boxSizing: 'border-box' }}>
        <Frame board={b} scale={380 / 1080} />
        <div
          style={{
            ...fonts.mono,
            fontSize: 20,
            color: refattura.graphite,
            marginTop: 14,
            textAlign: 'center',
          }}
        >
          {String(i + 1).padStart(2, '0')} · {b.title}
        </div>
      </div>
    ))}
  </AbsoluteFill>
);
