import { backgrounds, refattura, safeZone, social } from '@reelkit/brand';
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { fontsOf } from '../brand/fonts';
import {
  activeBackground,
  BackgroundTrack,
  type BackgroundSegment,
} from '../components/BackgroundTrack';
import { Logo } from '../components/Logo';
import { Dashes, Receipt } from '../components/Receipt';
import { PopWords, RevealText, type RevealWord } from '../components/RevealText';
import { BinderTabs } from '../headers/Headers';
import { StickerFilter } from '../mascot/StickerFilter';
import { InvoiceRoll, type TalkSpan } from '../mascot/InvoiceRoll';
import type { PoseCue } from '../mascot/poses';
import { Stamp } from '../stickers/Stamp';

/**
 * Full test reel with placeholder copy (no voice yet): the whole visual system in one video.
 * Hook, problem on a receipt, rule and solution on squared paper, A/B question, close with
 * logo. Rendered twice to compare the two mascot styles (01 flat outline, 02 sticker).
 *   pnpm render:test-reels  ->  packages/video/out/test-reel-{flat,sticker}.mp4
 */
export type TestReelProps = { mascotStyle: 'flat' | 'sticker' };
export const testReelDefaultProps: TestReelProps = { mascotStyle: 'sticker' };

const S = {
  hook: { from: 0, to: 90 },
  problem: { from: 90, to: 240 },
  rule: { from: 240, to: 390 },
  solution: { from: 390, to: 510 },
  question: { from: 510, to: 630 },
  close: { from: 630, to: 750 },
} as const;
export const TEST_REEL_DURATION = S.close.to;

const SEGMENTS: BackgroundSegment[] = [
  { from: S.hook.from, bg: 'blue', texture: 'grid' },
  { from: S.problem.from, bg: 'ink', texture: 'plain' },
  { from: S.rule.from, bg: 'paper', texture: 'grid' },
  { from: S.solution.from, bg: 'sky', texture: 'grid' },
  { from: S.question.from, bg: 'blue', texture: 'grid' },
  { from: S.close.from, bg: 'paper', texture: 'plain' },
];

const CUES: PoseCue[] = [
  { at: 0, pose: 'neutral' },
  { at: 44, pose: 'wave' },
  { at: 96, pose: 'neutral' },
  { at: 480, pose: 'arms-up', mouth: 'open', eyes: 'happy' },
  { at: 520, pose: 'neutral' },
  { at: 640, pose: 'arms-up', mouth: 'open', eyes: 'happy' },
];

/** Where a voice would speak: the mouth moves (placeholder for Rhubarb lip sync). */
const TALK: TalkSpan[] = [
  { from: 6, to: 80 },
  { from: 136, to: 228 },
  { from: 250, to: 378 },
  { from: 398, to: 470 },
  { from: 516, to: 610 },
  { from: 668, to: 720 },
];

const TABS = ['Problema', 'Regola', 'Soluzione', 'Tocca a te'];
const tabs = (active: number) =>
  TABS.map((t, i) => (i === active ? `${i + 1} · ${t}` : `${i + 1}`));

const fonts = fontsOf('brand');
const LEFT = 96;
const MASCOT_W = 360;
const MASCOT_TOP = 1040;

/** Stamp that slams onto the page: big and transparent, then down to size. */
const StampIn: React.FC<{ at: number; children: React.ReactNode; x: number; y: number }> = ({
  at,
  children,
  x,
  y,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const t = spring({ frame: frame - at, fps, config: { damping: 14, stiffness: 260, mass: 0.5 } });
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `scale(${1.8 - 0.8 * t})`,
        opacity: Math.min(1, t * 1.5),
      }}
    >
      {children}
    </div>
  );
};

const Hook: React.FC = () => {
  const bg = backgrounds.blue;
  const words: RevealWord[] = [
    { text: 'Paghi', at: 6 },
    { text: 'software', at: 22 },
    { text: 'esteri?', at: 40, highlight: { kind: 'underline', color: social.markerYellow } },
  ];
  return (
    <PopWords
      words={words}
      until={90}
      font={fonts.display}
      fontSize={150}
      color={bg.text}
      y={640}
    />
  );
};

const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ink = refattura.graphite;
  const drop = spring({ frame, fps, config: { damping: 16, stiffness: 120, mass: 0.8 } });
  const rows: Array<[string, string, number]> = [
    ['GOOGLE ADS', '120,00 €', 16],
    ['CANVA PRO', '11,99 €', 24],
    ['HOSTING', '24,00 €', 32],
  ];
  const words: RevealWord[] = [
    { text: 'Ogni', at: 50 },
    { text: 'fattura', at: 56 },
    { text: 'estera', at: 62 },
    { text: 'vuole', at: 72, br: true },
    { text: 'la', at: 78 },
    { text: 'sua', at: 82 },
    {
      text: 'autofattura.',
      at: 88,
      br: true,
      highlight: { kind: 'marker', color: social.markerYellow },
    },
  ];
  return (
    <>
      <Receipt
        x={120}
        y={safeZone.top - 10}
        width={840}
        height={740}
        fill={refattura.paperCool}
        style={{ transform: `translateY(${(1 - drop) * -900}px) rotate(-1.5deg)` }}
      >
        <div style={{ textAlign: 'center', ...fonts.mono, color: ink }}>
          <div style={{ fontSize: 32, letterSpacing: '0.2em' }}>REFATTURA</div>
          <div style={{ fontSize: 22, letterSpacing: '0.08em', marginTop: 6, opacity: 0.7 }}>
            SCONTRINO N. 01 · IL PROBLEMA
          </div>
        </div>
        <Dashes color={refattura.fieldRule} margin={18} />
        {rows.map(([label, amount, at]) => (
          <div
            key={label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              ...fonts.mono,
              fontSize: 32,
              lineHeight: 1.5,
              color: ink,
              opacity: interpolate(frame, [at, at + 6], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            <span>{label}</span>
            <span>{amount}</span>
          </div>
        ))}
        <Dashes color={refattura.fieldRule} margin={18} />
        <div style={{ position: 'relative', height: 260 }}>
          <RevealText
            words={words}
            font={fonts.display}
            fontSize={72}
            color={ink}
            style={{ left: 0, right: 0, top: 0 }}
          />
        </div>
      </Receipt>
      <StampIn at={118} x={600} y={830}>
        <Stamp
          text="Da fare"
          color={refattura.stampAmber}
          font={fonts.mono}
          fontSize={44}
          rotate={-10}
        />
      </StampIn>
    </>
  );
};

const Rule: React.FC = () => {
  const bg = backgrounds.paper;
  const words: RevealWord[] = [
    { text: 'Servizi', at: 10 },
    { text: 'comprati', at: 18, br: true },
    { text: 'all’estero?', at: 24 },
    { text: 'L’IVA', at: 48, br: true },
    { text: 'la', at: 54 },
    { text: 'integri', at: 58 },
    { text: 'tu', at: 64 },
    { text: 'con', at: 80, br: true },
    { text: 'il', at: 84 },
    { text: 'TD17.', at: 90, highlight: { kind: 'marker', color: social.markerYellow } },
  ];
  return (
    <>
      <BinderTabs
        tabs={tabs(1)}
        active={1}
        color={bg.text}
        activeFill={refattura.inkBlue}
        activeText={refattura.sheetWhite}
        mono={fonts.mono}
      />
      <RevealText
        words={words}
        font={fonts.display}
        fontSize={96}
        color={bg.text}
        style={{ top: 430, left: LEFT, right: safeZone.right }}
      />
    </>
  );
};

const Solution: React.FC = () => {
  const bg = backgrounds.sky;
  const words: RevealWord[] = [
    { text: 'Refattura', at: 8 },
    { text: 'legge', at: 16 },
    { text: 'il', at: 20, br: true },
    { text: 'PDF', at: 24 },
    { text: 'e', at: 36 },
    { text: 'prepara', at: 40 },
    { text: 'l’autofattura', at: 48, br: true },
    {
      text: 'per te.',
      at: 62,
      br: true,
      highlight: { kind: 'marker', color: social.markerYellow },
    },
  ];
  return (
    <>
      <BinderTabs
        tabs={tabs(2)}
        active={2}
        color={bg.text}
        activeFill={refattura.inkBlue}
        activeText={refattura.sheetWhite}
        mono={fonts.mono}
      />
      <RevealText
        words={words}
        font={fonts.display}
        fontSize={96}
        color={bg.text}
        style={{ top: 430, left: LEFT, right: safeZone.right }}
      />
      <StampIn at={84} x={540} y={850}>
        <Stamp
          text="Pronta"
          color={refattura.stampGreen}
          font={fonts.mono}
          fontSize={46}
          rotate={-8}
        />
      </StampIn>
    </>
  );
};

const Card: React.FC<{
  letter: string;
  text: string;
  at: number;
  from: 'left' | 'right';
  x: number;
}> = ({ letter, text, at, from, x }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame: frame - at, fps, config: { damping: 14, stiffness: 160, mass: 0.7 } });
  if (frame < at) return null;
  const dx = (1 - t) * (from === 'left' ? -500 : 500);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: 640,
        width: 390,
        height: 244,
        padding: '22px 28px',
        boxSizing: 'border-box',
        borderRadius: 18,
        backgroundColor: refattura.paperCool,
        transform: `translateX(${dx}px) rotate(${from === 'left' ? -2 : 2}deg)`,
      }}
    >
      <div style={{ ...fonts.display, fontSize: 92, lineHeight: 1, color: refattura.inkBlue }}>
        {letter}
      </div>
      <div
        style={{
          ...fonts.display,
          fontSize: 40,
          lineHeight: 1.1,
          color: refattura.graphite,
          marginTop: 8,
        }}
      >
        {text}
      </div>
    </div>
  );
};

const Question: React.FC = () => {
  const frame = useCurrentFrame();
  const bg = backgrounds.blue;
  const words: RevealWord[] = [
    { text: 'Tu', at: 6 },
    { text: 'come', at: 10, highlight: { kind: 'underline', color: social.markerYellow } },
    { text: 'le', at: 16 },
    { text: 'fai?', at: 20 },
  ];
  return (
    <>
      <BinderTabs
        tabs={tabs(3)}
        active={3}
        color={bg.text}
        activeFill={refattura.paperCool}
        activeText={refattura.graphite}
        mono={fonts.mono}
      />
      <RevealText
        words={words}
        font={fonts.display}
        fontSize={112}
        color={bg.text}
        style={{ top: 440, left: LEFT, right: safeZone.right }}
      />
      <Card letter="A" text="A mano, una alla volta" at={30} from="left" x={LEFT} />
      <Card letter="B" text="In automatico" at={40} from="right" x={LEFT + 418} />
      <div
        style={{
          position: 'absolute',
          left: LEFT,
          top: 920,
          ...fonts.mono,
          fontSize: 30,
          letterSpacing: '0.1em',
          color: bg.text,
          opacity: interpolate(frame, [64, 74], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        SCRIVI A O B NEI COMMENTI
      </div>
    </>
  );
};

const Close: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cta = spring({
    frame: frame - 40,
    fps,
    config: { damping: 12, stiffness: 180, mass: 0.6 },
  });
  return (
    <>
      <Logo at={10} width={720} y={440} />
      {frame >= 24 && (
        <div
          style={{
            position: 'absolute',
            top: 600,
            left: 0,
            right: 0,
            textAlign: 'center',
            ...fonts.hand,
            fontSize: 74,
            color: refattura.inkBlue,
            transform: 'rotate(-2deg)',
          }}
        >
          autofatture, senza pensieri
        </div>
      )}
      {frame >= 40 && (
        <div
          style={{
            position: 'absolute',
            top: 780,
            left: '50%',
            transform: `translateX(-50%) scale(${cta})`,
            padding: '18px 44px',
            borderRadius: 999,
            backgroundColor: refattura.inkBlue,
            color: refattura.sheetWhite,
            ...fonts.display,
            fontSize: 46,
            whiteSpace: 'nowrap',
          }}
        >
          Provalo: link in bio
        </div>
      )}
    </>
  );
};

export const TestReel: React.FC<TestReelProps> = ({ mascotStyle }) => {
  const frame = useCurrentFrame();
  const bg = backgrounds[activeBackground(SEGMENTS, frame)];
  const sticker = mascotStyle === 'sticker';
  const feetY = MASCOT_TOP + MASCOT_W * (566 / 400);
  const scene = (key: keyof typeof S, node: React.ReactNode) => (
    <Sequence from={S[key].from} durationInFrames={S[key].to - S[key].from} name={key}>
      {node}
    </Sequence>
  );
  return (
    <AbsoluteFill>
      <BackgroundTrack segments={SEGMENTS} />
      {scene('hook', <Hook />)}
      {scene('problem', <Problem />)}
      {scene('rule', <Rule />)}
      {scene('solution', <Solution />)}
      {scene('question', <Question />)}
      {scene('close', <Close />)}
      {!sticker && (
        <div
          style={{
            position: 'absolute',
            left: 540 - 120,
            top: feetY - 12,
            width: 240,
            height: 24,
            borderRadius: '50%',
            backgroundColor: 'oklch(0% 0 0 / 0.14)',
          }}
        />
      )}
      <InvoiceRoll
        width={MASCOT_W}
        cues={CUES}
        talk={TALK}
        gaze={{ x: 0, y: -0.6 }}
        seed="test-reel"
        pen={sticker ? refattura.inkBlue : bg.pen}
        defs={
          sticker ? (
            <StickerFilter id="reelsticker" radius={12} color={refattura.sheetWhite} />
          ) : undefined
        }
        filter={sticker ? 'url(#reelsticker)' : undefined}
        style={{ position: 'absolute', left: 540 - MASCOT_W / 2, top: MASCOT_TOP }}
      />
    </AbsoluteFill>
  );
};
