import { backgrounds, refattura, social } from '@reelkit/brand';
import { AbsoluteFill } from 'remotion';
import { fontsOf } from '../brand/fonts';
import { Ground } from '../components/Ground';
import { Dashes, Receipt } from '../components/Receipt';
import { BinderTabs, CounterHeader, DocHeader } from '../headers/Headers';
import { Highlight } from '../highlights/Highlight';
import { Mascot } from '../mascot/Mascot';
import type { PoseCue } from '../mascot/poses';
import { Stamp } from '../stickers/Stamp';
import { GraphPaper, RuledPaper } from '../textures/Paper';

/**
 * Visual direction proposals (D-013): the same beat drawn four ways, every sign taken from
 * Refattura's own world (ledger, paper, ink, stamps, receipts). Review artifacts, not
 * production scenes.
 *   pnpm render:lab  ->  packages/video/out/lab/*.png
 */
export const PROPOSALS = ['registro', 'quadretti', 'scontrino', 'minimal'] as const;
export type ProposalId = (typeof PROPOSALS)[number];

const CUES: PoseCue[] = [{ at: 0, pose: 'neutral' }];
const MASCOT_W = 400;
const MASCOT_TOP = 990;
const FEET_Y = MASCOT_TOP + 568;
const SHADOW_LIGHT = 'oklch(0% 0 0 / 0.08)';
const SHADOW_DARK = 'oklch(0% 0 0 / 0.22)';

const fonts = fontsOf('brand');

const Headline: React.FC<{ word: React.ReactNode; style: React.CSSProperties }> = ({
  word,
  style,
}) => (
  <div style={{ position: 'absolute', ...fonts.display, letterSpacing: '-0.03em', ...style }}>
    Quanti {word} perdi con le autofatture sbagliate?
  </div>
);

const Character: React.FC<{ pen: string; shadow: string; gaze?: { x: number; y: number } }> = ({
  pen,
  shadow,
  gaze = { x: -0.4, y: -0.6 },
}) => (
  <>
    <Ground x={540} y={FEET_Y} width={440} pen={pen} shadow={shadow} />
    <Mascot
      width={MASCOT_W}
      cues={CUES}
      seed="lab"
      pen={pen}
      gaze={gaze}
      style={{ position: 'absolute', left: 540 - MASCOT_W / 2, top: MASCOT_TOP }}
    />
  </>
);

/** A. Ledger: ruled paper, red margin, document header, highlighter, rubber stamp. */
const Registro: React.FC = () => {
  const bg = backgrounds.paper;
  return (
    <AbsoluteFill>
      <RuledPaper
        fill={bg.fill}
        line="oklch(75% 0.13 264 / 0.35)"
        margin="oklch(53% 0.205 26.82 / 0.45)"
        offsetY={-10}
      />
      <DocHeader
        left="Registro n. 07"
        right="Pag. 1 di 3"
        title="Il problema"
        color={bg.text}
        titleColor={refattura.inkBlue}
        mono={fonts.mono}
        display={fonts.display}
        x={170}
      />
      <Headline
        word={
          <Highlight kind="marker" color={social.markerYellow}>
            soldi
          </Highlight>
        }
        style={{
          top: 470,
          left: 170,
          right: 150,
          fontSize: 100,
          lineHeight: '128px',
          color: bg.text,
        }}
      />
      <Stamp
        text="Sanzione"
        color={refattura.stampRed}
        font={fonts.mono}
        rotate={-9}
        style={{ position: 'absolute', left: 600, top: 870 }}
      />
      <Character pen={bg.pen} shadow={SHADOW_LIGHT} />
    </AbsoluteFill>
  );
};

/** B. Squared paper on brand blue, binder tabs, pen underline. */
const Quadretti: React.FC = () => {
  const bg = backgrounds.blue;
  return (
    <AbsoluteFill>
      <GraphPaper fill={bg.fill} line="oklch(100% 0 0 / 0.10)" />
      <BinderTabs
        tabs={['1 Problema', '2 Regola', '3 Esempio']}
        active={0}
        color={bg.text}
        activeFill={refattura.paperCool}
        activeText={refattura.graphite}
        mono={fonts.mono}
      />
      <Headline
        word={
          <Highlight kind="underline" color={social.markerYellow} strokeWidth={14}>
            soldi
          </Highlight>
        }
        style={{ top: 440, left: 96, right: 150, fontSize: 108, lineHeight: 1.08, color: bg.text }}
      />
      <Stamp
        text="Sanzione"
        color={refattura.paperCool}
        font={fonts.mono}
        rotate={6}
        style={{ position: 'absolute', left: 560, top: 860 }}
      />
      <Character pen={bg.pen} shadow={SHADOW_DARK} />
    </AbsoluteFill>
  );
};

/** C. Receipt: a torn slip on graphite, mono rows, red pen circle, amber stamp. */
const Scontrino: React.FC = () => {
  const bg = backgrounds.ink;
  const paper = refattura.paperCool;
  const ink = refattura.graphite;
  const row: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    ...fonts.mono,
    fontSize: 32,
    color: ink,
  };
  return (
    <AbsoluteFill style={{ backgroundColor: bg.fill }}>
      <Receipt
        x={120}
        y={230}
        width={840}
        height={760}
        fill={paper}
        style={{ transform: 'rotate(-1.5deg)' }}
      >
        <div style={{ textAlign: 'center', ...fonts.mono, color: ink }}>
          <div style={{ fontSize: 34, letterSpacing: '0.2em' }}>REFATTURA</div>
          <div style={{ fontSize: 24, letterSpacing: '0.08em', marginTop: 6, opacity: 0.75 }}>
            SCONTRINO N. 01 · IL PROBLEMA
          </div>
        </div>
        <Dashes color={refattura.fieldRule} />
        <div
          style={{
            ...fonts.display,
            fontSize: 74,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            color: ink,
          }}
        >
          Quanti{' '}
          <Highlight kind="circle" color={refattura.stampRed} strokeWidth={9}>
            soldi
          </Highlight>{' '}
          perdi con le autofatture sbagliate?
        </div>
        <Dashes color={refattura.fieldRule} />
        <div style={row}>
          <span>AUTOFATTURE SBAGLIATE</span>
          <span>12</span>
        </div>
        <div style={{ ...row, marginTop: 10, fontSize: 40 }}>
          <span>COSTO</span>
          <span>???</span>
        </div>
      </Receipt>
      <Stamp
        text="Da rifare"
        color={refattura.stampAmber}
        font={fonts.mono}
        fontSize={40}
        rotate={-12}
        style={{ position: 'absolute', left: 600, top: 880 }}
      />
      <Character pen={bg.pen} shadow={SHADOW_DARK} gaze={{ x: 0.3, y: -0.7 }} />
    </AbsoluteFill>
  );
};

/** D. Minimal: flat brand blue, big counter, word in color, plain label. */
const Minimal: React.FC = () => {
  const bg = backgrounds.blue;
  return (
    <AbsoluteFill style={{ backgroundColor: bg.fill }}>
      <CounterHeader
        current={1}
        total={3}
        label="Il problema"
        color={bg.text}
        display={fonts.display}
        mono={fonts.mono}
      />
      <Headline
        word={
          <Highlight kind="color" color={social.markerYellow}>
            soldi
          </Highlight>
        }
        style={{ top: 440, left: 96, right: 150, fontSize: 112, lineHeight: 1, color: bg.text }}
      />
      <div
        style={{
          position: 'absolute',
          left: 96,
          top: 925,
          padding: '12px 30px',
          borderRadius: 999,
          backgroundColor: refattura.paperCool,
          color: refattura.graphite,
          ...fonts.mono,
          fontSize: 34,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        Sanzione
      </div>
      <Character pen={bg.pen} shadow={SHADOW_DARK} />
    </AbsoluteFill>
  );
};

export const Proposal: React.FC<{ variant: ProposalId }> = ({ variant }) => {
  switch (variant) {
    case 'registro':
      return <Registro />;
    case 'quadretti':
      return <Quadretti />;
    case 'scontrino':
      return <Scontrino />;
    case 'minimal':
      return <Minimal />;
  }
};
