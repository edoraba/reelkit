import { formats } from '@reelkit/brand';
import { Composition, Still } from 'remotion';
import './brand/fonts';
import { Demo, DEMO_DURATION, demoDefaultProps } from './compositions/Demo';
import { FontLab, FONTLAB_HEIGHT } from './compositions/FontLab';
import { HighlightLab, HIGHLIGHT_LAB_HEIGHT } from './lab/HighlightLab';
import { MascotLab, MASCOT_SHEETS, sheetHeight, type MascotSheet } from './lab/mascots/MascotLab';
import { Proposal, PROPOSALS } from './lab/Proposals';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Demo"
      component={Demo}
      durationInFrames={DEMO_DURATION}
      fps={formats.reel.fps}
      width={formats.reel.width}
      height={formats.reel.height}
      defaultProps={demoDefaultProps}
    />
    <Still id="FontLab" component={FontLab} width={1080} height={FONTLAB_HEIGHT} />
    <Still id="HighlightLab" component={HighlightLab} width={1080} height={HIGHLIGHT_LAB_HEIGHT} />
    {PROPOSALS.map((variant) => (
      <Still
        key={variant}
        id={`Proposal-${variant}`}
        component={Proposal}
        width={formats.reel.width}
        height={formats.reel.height}
        defaultProps={{ variant }}
      />
    ))}
    {(Object.keys(MASCOT_SHEETS) as MascotSheet[]).map((sheet) => (
      <Still
        key={sheet}
        id={`MascotLab-${sheet}`}
        component={MascotLab}
        width={1080}
        height={sheetHeight(sheet)}
        defaultProps={{ sheet }}
      />
    ))}
  </>
);
