import { formats } from '@reelkit/brand';
import { Composition, Still } from 'remotion';
import './brand/fonts';
import { Demo, DEMO_DURATION, demoDefaultProps } from './compositions/Demo';
import { FontLab, FONTLAB_HEIGHT } from './compositions/FontLab';
import { TestReel, TEST_REEL_DURATION } from './compositions/TestReel';
import { MotifLab, MOTIF_LAB_DURATION } from './lab/cutouts/MotifLab';
import {
  CutoutBackgrounds,
  CutoutReel,
  CUTOUT_REEL_DURATION,
  CUTOUT_SHEET,
} from './lab/cutouts/scenes';
import { HighlightLab, HIGHLIGHT_LAB_HEIGHT } from './lab/HighlightLab';
import { InvoiceRollLab, INVOICE_ROLL_LAB_DURATION } from './lab/InvoiceRollLab';
import { MascotLab, MASCOT_SHEETS, sheetHeight, type MascotSheet } from './lab/mascots/MascotLab';
import { BOARDS } from './lab/moodboards/boards';
import {
  MoodBoard,
  MoodBoardOverview,
  MOODBOARD_OVERVIEW,
  MOODBOARD_SIZE,
} from './lab/moodboards/MoodBoard';
import { Proposal, PROPOSALS } from './lab/Proposals';
import { StyleLab, STYLE_SHEETS, styleSheetHeight } from './lab/StyleLab';
import { StyleMotionLab, STYLE_MOTION_DURATION } from './lab/StyleMotionLab';

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
    {(['flat', 'sticker'] as const).map((mascotStyle) => (
      <Composition
        key={mascotStyle}
        id={`TestReel-${mascotStyle}`}
        component={TestReel}
        durationInFrames={TEST_REEL_DURATION}
        fps={formats.reel.fps}
        width={formats.reel.width}
        height={formats.reel.height}
        defaultProps={{ mascotStyle }}
      />
    ))}
    <Composition
      id="InvoiceRollLab"
      component={InvoiceRollLab}
      durationInFrames={INVOICE_ROLL_LAB_DURATION}
      fps={formats.reel.fps}
      width={formats.reel.width}
      height={formats.reel.height}
    />
    <Composition
      id="StyleMotionLab"
      component={StyleMotionLab}
      durationInFrames={STYLE_MOTION_DURATION}
      fps={formats.reel.fps}
      width={formats.reel.width}
      height={formats.reel.height}
    />
    <Composition
      id="CutoutMotifs"
      component={MotifLab}
      durationInFrames={MOTIF_LAB_DURATION}
      fps={formats.reel.fps}
      width={formats.reel.width}
      height={formats.reel.height}
    />
    <Composition
      id="CutoutReel"
      component={CutoutReel}
      durationInFrames={CUTOUT_REEL_DURATION}
      fps={formats.reel.fps}
      width={formats.reel.width}
      height={formats.reel.height}
    />
    <Composition
      id="CutoutBackgrounds"
      component={CutoutBackgrounds}
      durationInFrames={CUTOUT_SHEET.frame + 1}
      fps={formats.reel.fps}
      width={CUTOUT_SHEET.width}
      height={CUTOUT_SHEET.height}
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
    {Array.from({ length: STYLE_SHEETS }, (_, sheet) => (
      <Still
        key={sheet}
        id={`StyleLab-${sheet + 1}`}
        component={StyleLab}
        width={1080}
        height={styleSheetHeight(sheet)}
        defaultProps={{ sheet }}
      />
    ))}
    {BOARDS.map((b, index) => (
      <Still
        key={b.key}
        id={`MoodBoard-${index + 1}-${b.key}`}
        component={MoodBoard}
        width={MOODBOARD_SIZE.width}
        height={MOODBOARD_SIZE.height}
        defaultProps={{ index }}
      />
    ))}
    <Still
      id="MoodBoard-overview"
      component={MoodBoardOverview}
      width={MOODBOARD_OVERVIEW.width}
      height={MOODBOARD_OVERVIEW.height}
    />
  </>
);
