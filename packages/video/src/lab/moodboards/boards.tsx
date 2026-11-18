import { refattura, social } from '@reelkit/brand';
import { fontsOf, type ResolvedFont } from '../../brand/fonts';
import { Highlight } from '../../highlights/Highlight';
import { InvoiceRoll, type InvoiceRollProps } from '../../mascot/InvoiceRoll';
import {
  Confetti,
  CutStar,
  Frond,
  Grain,
  InvoicePictogram,
  JaggedFilter,
  OffsetShadow,
  ScissorFilter,
  Squiggle,
  TornFilter,
  Zigzag,
} from './kit';

/**
 * Style moodboards: seven simple 2D art directions, each with a sample reel frame drawn with
 * our mascot and the same hook, plus the notes shown next to it. Exploration only: colors
 * outside the brand tokens live here, not in @reelkit/brand.
 */

export const C = {
  blue: refattura.inkBlue,
  sky: social.sky,
  yellow: social.markerYellow,
  red: refattura.stampRed,
  green: refattura.stampGreen,
  ink: refattura.graphite,
  paper: refattura.paperCool,
  white: refattura.sheetWhite,
  // exploration colors (not brand tokens)
  coral: 'oklch(68% 0.17 35)',
  lemon: 'oklch(90% 0.16 100)',
  cream: 'oklch(95% 0.03 90)',
  pink: 'oklch(83% 0.09 5)',
  mint: 'oklch(88% 0.08 165)',
  kraft: 'oklch(93% 0.025 80)',
} as const;

export interface Swatch {
  name: string;
  color: string;
}

export interface Board {
  key: string;
  title: string;
  after: string;
  traits: string[];
  palette: Swatch[];
  motifs: () => React.ReactNode;
  build: string;
  motion: string;
  pro: string;
  con: string;
  refs: string[];
  note?: string;
  Sample: React.FC;
}

const fonts = fontsOf('brand');
const W = 1080;
const H = 1920;

const Bg: React.FC<{ color: string; children?: React.ReactNode }> = ({ color, children }) => (
  <div style={{ position: 'absolute', inset: 0, backgroundColor: color, overflow: 'hidden' }}>
    {children}
  </div>
);

const Art: React.FC<{ children: React.ReactNode; defs?: React.ReactNode }> = ({
  children,
  defs,
}) => (
  <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
    {defs && <defs>{defs}</defs>}
    {children}
  </svg>
);

const Text: React.FC<{
  children: React.ReactNode;
  font?: ResolvedFont;
  size: number;
  color: string;
  top: number;
  left?: number;
  right?: number;
  style?: React.CSSProperties;
}> = ({ children, font = fonts.display, size, color, top, left = 96, right = 150, style }) => (
  <div
    style={{
      position: 'absolute',
      top,
      left,
      right,
      ...font,
      fontSize: size,
      lineHeight: 1.02,
      letterSpacing: '-0.03em',
      color,
      ...style,
    }}
  >
    {children}
  </div>
);

const Mascot: React.FC<Partial<InvoiceRollProps> & { x?: number; y?: number; w?: number }> = ({
  x = 330,
  y = 1010,
  w = 420,
  ...props
}) => (
  <InvoiceRoll
    width={w}
    cues={[{ at: 0, pose: 'wave' }]}
    seed="moodboard"
    gaze={{ x: -0.2, y: -0.5 }}
    {...props}
    style={{ position: 'absolute', left: x, top: y }}
  />
);

const motifSvg = (children: React.ReactNode, defs?: React.ReactNode) => (
  <svg width={1120} height={150} viewBox="0 0 1120 150" style={{ overflow: 'visible' }}>
    {defs && <defs>{defs}</defs>}
    {children}
  </svg>
);

// ------------------------------------------------------------------------------- 1 Matisse

const MatisseSample: React.FC = () => (
  <Bg color={C.blue}>
    <Art defs={<ScissorFilter id="mtCut" />}>
      <g filter="url(#mtCut)">
        <Frond x={170} y={1660} scale={1.75} rotate={-6} color={C.white} />
        <Frond x={980} y={1930} scale={1.5} rotate={14} color={C.green} leaves={6} />
        <CutStar x={870} y={300} r={140} color={C.coral} seed="m1" />
        <circle cx={190} cy={290} r={84} fill={C.lemon} />
        <CutStar x={950} y={1160} r={62} color={C.lemon} seed="m2" points={7} />
      </g>
    </Art>
    <Text size={130} color={C.white} top={470}>
      Paghi software{' '}
      <span style={{ color: C.ink }}>
        <Highlight kind="marker" color={C.lemon}>
          esteri?
        </Highlight>
      </span>
    </Text>
    <Mascot
      pen={C.coral}
      look={{
        outlineWidth: 0,
        roll: C.lemon,
        accent: C.coral,
        limbWidth: 16,
        rule: 'oklch(85% 0.04 264)',
      }}
      defs={<ScissorFilter id="mtMascot" scale={5} />}
      filter="url(#mtMascot)"
      x={440}
      w={440}
    />
    <Grain id="mtGrain" opacity={0.18} width={W} height={H} />
  </Bg>
);

const matisse: Board = {
  key: 'matisse',
  title: 'Papiers découpés',
  after: 'after Henri Matisse, gouache cut-outs 1943-1954',
  traits: [
    'Shapes cut with scissors from sheets painted in gouache: no outlines, edges that wobble',
    'Organic motifs (leaves, algae, stars) floating around the subject',
    'Few saturated colors side by side, white paper used as a color',
    'Pieces overlap and shift, as if pinned to the studio wall',
  ],
  palette: [
    { name: 'ultramarine', color: C.blue },
    { name: 'coral', color: C.coral },
    { name: 'lemon', color: C.lemon },
    { name: 'emerald', color: C.green },
    { name: 'paper', color: C.white },
  ],
  motifs: () =>
    motifSvg(
      <g filter="url(#mtMotif)">
        <Frond x={70} y={140} scale={0.38} color={C.blue} />
        <CutStar x={260} y={75} r={58} color={C.coral} seed="mm1" />
        <Frond x={430} y={140} scale={0.38} rotate={25} color={C.green} leaves={5} />
        <circle cx={600} cy={75} r={50} fill={C.lemon} />
        <CutStar x={760} y={75} r={52} color={C.blue} seed="mm2" points={7} />
        <rect x={880} y={30} width={170} height={90} rx={40} fill={C.coral} />
      </g>,
      <ScissorFilter id="mtMotif" scale={5} />,
    ),
  build: 'SVG shapes with a scissor-wobble filter and gouache grain; no outlines anywhere',
  motion: 'Pieces slide in and settle like paper being pinned; leaves sway slowly',
  pro: 'Warm, artistic, unlike any SaaS account',
  con: 'Needs restraint or the frame gets busy',
  refs: [
    'The Snail, 1953 (Tate)',
    'Blue Nude II, 1952 (Centre Pompidou)',
    'Jazz, 1947 (book)',
    'The Swimming Pool, 1952 (MoMA)',
  ],
  note: 'Matisse died in 1954: his works are public domain in Italy since 2025. We take the method, not the images.',
  Sample: MatisseSample,
};

// --------------------------------------------------------------------------------- 2 Lionni

const LionniSample: React.FC = () => (
  <Bg color={C.kraft}>
    <Art defs={<TornFilter id="lnTorn" />}>
      <g filter="url(#lnTorn)">
        <circle cx={190} cy={330} r={95} fill={C.blue} />
        <circle cx={300} cy={380} r={70} fill={C.yellow} />
        <rect x={-40} y={1600} width={1160} height={80} fill={C.green} />
        <circle cx={920} cy={1180} r={60} fill={C.yellow} />
      </g>
    </Art>
    <Text size={128} color={C.ink} top={560}>
      Paghi software{' '}
      <Highlight kind="marker" color={C.yellow}>
        esteri?
      </Highlight>
    </Text>
    <Mascot
      pen={C.ink}
      look={{
        outlineWidth: 0,
        sheet: C.blue,
        roll: C.yellow,
        rule: 'oklch(100% 0 0 / 0.45)',
        accent: C.yellow,
        ink: C.white,
        limbWidth: 6,
        headerOpacity: 0.55,
      }}
      defs={<TornFilter id="lnMascot" scale={7} />}
      filter="url(#lnMascot)"
      y={1000}
    />
    <Grain id="lnGrain" opacity={0.22} width={W} height={H} />
  </Bg>
);

const lionni: Board = {
  key: 'lionni',
  title: 'Torn paper',
  after: 'after Leo Lionni, collage picture books 1959-1970s',
  traits: [
    'Characters are torn shapes: a dot, a crooked rectangle, nothing more',
    'White paper fibres show along every torn edge',
    'Printed and pressed textures inside the shapes, colored pencil for details',
    'Lots of empty page: a story told with very little',
  ],
  palette: [
    { name: 'blue', color: C.blue },
    { name: 'yellow', color: C.yellow },
    { name: 'green', color: C.green },
    { name: 'kraft', color: C.kraft },
    { name: 'pencil', color: C.ink },
  ],
  motifs: () =>
    motifSvg(
      <g filter="url(#lnMotif)">
        <circle cx={70} cy={75} r={52} fill={C.blue} />
        <circle cx={190} cy={85} r={40} fill={C.yellow} />
        <rect
          x={290}
          y={40}
          width={150}
          height={80}
          rx={6}
          fill={C.green}
          transform="rotate(-4 365 80)"
        />
        <circle cx={560} cy={75} r={50} fill={C.yellow} />
        <rect x={660} y={30} width={110} height={100} fill={C.blue} transform="rotate(5 715 80)" />
        <circle cx={880} cy={80} r={44} fill={C.green} />
      </g>,
      <TornFilter id="lnMotif" scale={7} />,
    ),
  build: 'Torn-edge filter: high frequency wobble plus a white fibre border',
  motion: 'Shapes tear in and wobble; colors can overlap and blend like in the book',
  pro: 'Gentle and human; blue and yellow are already our colors',
  con: 'Very soft: needs strong type to keep the punch',
  refs: ['Little Blue and Little Yellow, 1959', 'Swimmy, 1963', 'Frederick, 1967'],
  Sample: LionniSample,
};

// --------------------------------------------------------------------------------- 3 Depero

const DeperoSample: React.FC = () => (
  <Bg color={C.red}>
    <Art>
      <polygon points="1080,0 1080,1250 760,0" fill={C.ink} />
      <circle cx={260} cy={1500} r={300} fill={C.cream} />
      <g fill={C.yellow}>
        <polygon points="890,800 930,930 1040,880" />
        <polygon points="860,300 920,380 980,260" />
      </g>
      <rect x={96} y={1660} width={890} height={26} fill={C.ink} />
    </Art>
    <Text
      size={124}
      color={C.cream}
      top={420}
      font={fontsOf('rubik').display}
      style={{
        textTransform: 'uppercase',
        letterSpacing: '0.01em',
        lineHeight: 1,
        transform: 'rotate(-6deg)',
        transformOrigin: 'left top',
      }}
    >
      Paghi
      <br />
      <span style={{ color: C.yellow }}>software</span>
      <br />
      <span style={{ backgroundColor: C.ink, color: C.cream, padding: '0 0.12em' }}>esteri?</span>
    </Text>
    <Mascot
      pen={C.ink}
      look={{
        outline: C.ink,
        outlineWidth: 10,
        sheet: C.cream,
        cel: 'oklch(80% 0.05 80)',
        roll: C.yellow,
        accent: C.red,
        limbWidth: 15,
        rule: 'oklch(70% 0.03 80)',
      }}
      x={400}
      y={1020}
    />
  </Bg>
);

const depero: Board = {
  key: 'depero',
  title: 'Futurist advertising',
  after: 'after Fortunato Depero, work for Campari 1924-1936',
  traits: [
    'Characters built like wooden puppets from cylinders, cones and blocks',
    'Primary colors, black and cream, hard two-tone shading',
    'Type as architecture: big blocky letters, tilted and stacked',
    'Born for advertising: one product, one bold idea per image',
  ],
  palette: [
    { name: 'red', color: C.red },
    { name: 'black', color: C.ink },
    { name: 'cream', color: C.cream },
    { name: 'yellow', color: C.yellow },
    { name: 'blue', color: C.blue },
  ],
  motifs: () =>
    motifSvg(
      <g>
        <polygon points="0,140 120,10 120,140" fill={C.red} />
        <circle cx={230} cy={75} r={62} fill={C.ink} />
        <path d="M 168 75 A 62 62 0 0 1 292 75 Z" fill={C.yellow} />
        <rect x={340} y={20} width={60} height={120} fill={C.blue} />
        <rect x={400} y={20} width={60} height={120} fill="oklch(42% 0.2 263)" />
        <polygon points="520,140 600,10 680,140" fill={C.cream} stroke={C.ink} strokeWidth={6} />
        <text x={730} y={115} fontSize={100} fontWeight={900} fill={C.red} fontFamily="Rubik">
          RF
        </text>
      </g>,
    ),
  build: 'Plain geometric SVG shapes, two-tone fills, rotated blocks of type',
  motion: 'Mechanical: parts snap, rotate and pop like toys; type stamps in',
  pro: 'Italian, bold and made for selling',
  con: 'Strongly retro: risk of looking like a period piece',
  refs: [
    'Numero unico futurista Campari, 1931',
    'Squisito al selz, 1926',
    'Casa d’Arte Futurista Depero, Rovereto',
  ],
  Sample: DeperoSample,
};

// ----------------------------------------------------------------------------- 4 Rand Munari

const RandSample: React.FC = () => (
  <Bg color={C.cream}>
    <Art defs={<ScissorFilter id="rdCut" scale={4} grain={0.12} />}>
      <g filter="url(#rdCut)">
        <rect
          x={250}
          y={960}
          width={580}
          height={580}
          fill={C.blue}
          transform="rotate(7 540 1250)"
        />
        <circle cx={880} cy={330} r={120} fill={C.red} />
        <polygon points="96,1650 300,1650 198,1470" fill={C.yellow} />
      </g>
    </Art>
    <Text size={124} color={C.ink} top={470}>
      Paghi software{' '}
      <Highlight kind="underline" color={C.red} strokeWidth={14}>
        esteri?
      </Highlight>
    </Text>
    <Text
      size={58}
      color={C.blue}
      top={800}
      font={fonts.hand}
      style={{ transform: 'rotate(-3deg)', letterSpacing: 0 }}
    >
      (Google, Canva, hosting...)
    </Text>
    <Mascot
      pen={C.ink}
      look={{
        outlineWidth: 0,
        roll: C.red,
        accent: C.yellow,
        limbWidth: 8,
        rule: 'oklch(85% 0.02 264)',
      }}
      defs={<ScissorFilter id="rdMascot" scale={3} grain={0.08} />}
      filter="url(#rdMascot)"
      y={1000}
    />
  </Bg>
);

const rand: Board = {
  key: 'rand',
  title: 'Playful modernism',
  after: 'after Paul Rand and Bruno Munari, 1940s-1970s',
  traits: [
    'Square, circle and triangle as a whole visual alphabet',
    'Cut paper shapes with a visible human edge',
    'Visual puns and rebuses instead of illustrations',
    'Hand-scribbled notes over a strict, calm layout',
  ],
  palette: [
    { name: 'blue', color: C.blue },
    { name: 'red', color: C.red },
    { name: 'yellow', color: C.yellow },
    { name: 'black', color: C.ink },
    { name: 'cream', color: C.cream },
  ],
  motifs: () =>
    motifSvg(
      <g filter="url(#rdMotif)">
        <rect x={10} y={20} width={110} height={110} fill={C.blue} />
        <circle cx={220} cy={75} r={56} fill={C.red} />
        <polygon points="300,135 420,135 360,20" fill={C.yellow} />
        <text
          x={470}
          y={110}
          fontSize={96}
          fontWeight={800}
          fill={C.ink}
          fontFamily="Bricolage Grotesque"
        >
          €
        </text>
        <text x={540} y={110} fontSize={60} fill={C.blue} fontFamily="Caveat">
          + mail = e-mail
        </text>
      </g>,
      <ScissorFilter id="rdMotif" scale={3} grain={0.1} />,
    ),
  build: 'Basic shapes with a light scissor wobble, the handwritten font for notes',
  motion: 'Shapes roll, flip and snap into a pun; notes write themselves on',
  pro: 'Clever and clean, fits a product that explains things',
  con: 'Needs a good idea per post: puns do not come out of a template',
  refs: [
    'Paul Rand, Eye Bee M poster for IBM, 1981',
    'Paul Rand, Direction magazine covers, 1938-1945',
    'Bruno Munari, Discovery of the Square, Circle, Triangle, 1960-1976',
  ],
  Sample: RandSample,
};

// -------------------------------------------------------------------------------- 5 Memphis

const MemphisSample: React.FC = () => (
  <Bg color={C.mint}>
    <Art
      defs={
        <pattern
          id="mpStripes"
          width={28}
          height={28}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width={14} height={28} fill={C.ink} />
          <rect x={14} width={14} height={28} fill={C.white} />
        </pattern>
      }
    >
      <Confetti
        w={W}
        h={H}
        colors={[C.ink, C.pink, C.blue, C.yellow]}
        count={46}
        seed="mp"
        avoid={[
          { x: 60, y: 420, w: 960, h: 520 },
          { x: 260, y: 980, w: 560, h: 700 },
        ]}
      />
      <circle cx={900} cy={300} r={110} fill="url(#mpStripes)" stroke={C.ink} strokeWidth={8} />
      <Squiggle x={80} y={300} color={C.pink} length={300} width={18} />
      <Zigzag x={700} y={1620} color={C.blue} length={300} />
      <rect
        x={60}
        y={1500}
        width={160}
        height={160}
        fill={C.yellow}
        stroke={C.ink}
        strokeWidth={8}
        transform="rotate(-12 140 1580)"
      />
    </Art>
    <Text size={124} color={C.ink} top={470}>
      Paghi software{' '}
      <span style={{ textShadow: `6px 6px 0 ${C.pink}` }}>
        <Highlight kind="underline" color={C.blue} strokeWidth={14}>
          esteri?
        </Highlight>
      </span>
    </Text>
    <Mascot
      pen={C.ink}
      look={{
        outline: C.ink,
        outlineWidth: 9,
        roll: 'url(#mpStripesM)',
        accent: C.pink,
        limbWidth: 10,
      }}
      defs={
        <>
          <pattern
            id="mpStripesM"
            width={20}
            height={20}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width={10} height={20} fill={C.ink} />
            <rect x={10} width={10} height={20} fill={C.white} />
          </pattern>
          <OffsetShadow id="mpShadow" color={C.ink} d={12} />
        </>
      }
      filter="url(#mpShadow)"
      y={1000}
    />
  </Bg>
);

const memphis: Board = {
  key: 'memphis',
  title: 'Memphis Milano',
  after: 'after Ettore Sottsass and the Memphis Group, Milan 1981',
  traits: [
    'Squiggles, zigzags, confetti and black-and-white stripes',
    'Pastels clashing with primaries',
    'Thick black outlines and hard drop shadows',
    'Pattern as decoration on every surface',
  ],
  palette: [
    { name: 'mint', color: C.mint },
    { name: 'pink', color: C.pink },
    { name: 'yellow', color: C.yellow },
    { name: 'blue', color: C.blue },
    { name: 'black', color: C.ink },
  ],
  motifs: () =>
    motifSvg(
      <g>
        <defs>
          <pattern
            id="mpStripesB"
            width={20}
            height={20}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width={10} height={20} fill={C.ink} />
            <rect x={10} width={10} height={20} fill={C.white} />
          </pattern>
        </defs>
        <Squiggle x={10} y={75} color={C.pink} length={200} width={14} />
        <Zigzag x={260} y={75} color={C.blue} length={180} />
        <circle cx={540} cy={75} r={58} fill="url(#mpStripesB)" stroke={C.ink} strokeWidth={6} />
        <rect
          x={650}
          y={25}
          width={100}
          height={100}
          fill={C.yellow}
          stroke={C.ink}
          strokeWidth={6}
          transform="rotate(-10 700 75)"
        />
        <g fill={C.ink}>
          {Array.from({ length: 12 }, (_, i) => (
            <circle key={i} cx={820 + (i % 4) * 34} cy={35 + Math.floor(i / 4) * 34} r={7} />
          ))}
        </g>
      </g>,
    ),
  build: 'Pattern fills and scattered motifs, all placed with the post seed',
  motion: 'Confetti and squiggles bounce in on the beats',
  pro: 'Loud, fun and very Italian',
  con: 'Trendy and noisy: hard to keep readable, close to many 2018-2020 brands',
  refs: [
    'Bacterio pattern, Sottsass, 1978',
    'Carlton bookcase, Sottsass, 1981',
    'Nathalie Du Pasquier textiles, 1980s',
  ],
  Sample: MemphisSample,
};

// ----------------------------------------------------------------------------------- 6 Bass

const BassSample: React.FC = () => (
  <Bg color={C.ink}>
    <Art defs={<JaggedFilter id="bsJag" />}>
      <g filter="url(#bsJag)">
        <rect
          x={-60}
          y={1030}
          width={1300}
          height={110}
          fill={C.red}
          transform="rotate(-14 540 1085)"
        />
        <rect x={96} y={190} width={40} height={270} fill={C.white} />
        <rect x={180} y={190} width={40} height={170} fill={C.white} />
        <rect x={860} y={1500} width={60} height={300} fill={C.white} />
      </g>
    </Art>
    <Text
      size={140}
      color={C.white}
      top={520}
      left={96}
      style={{
        textTransform: 'uppercase',
        filter: 'url(#bsJag)',
        letterSpacing: '-0.02em',
        lineHeight: 0.95,
      }}
    >
      Paghi
      <br />
      software
      <br />
      <span style={{ color: C.red }}>esteri?</span>
    </Text>
    <Mascot
      pen={C.white}
      look={{
        outlineWidth: 0,
        sheet: C.white,
        roll: C.white,
        rule: C.white,
        accent: C.red,
        limbWidth: 14,
        headerOpacity: 0,
      }}
      defs={<JaggedFilter id="bsMascot" scale={8} />}
      filter="url(#bsMascot)"
      x={560}
      y={1180}
      w={360}
    />
  </Bg>
);

const bass: Board = {
  key: 'bass',
  title: 'Cut-out cinema',
  after: 'after Saul Bass, title sequences and posters 1955-1960s',
  traits: [
    'Black, white and one strong color',
    'Jagged hand-cut shapes, no shading at all',
    'One simple symbol that tells the whole story',
    'Kinetic: bars and shapes move like opening titles',
  ],
  palette: [
    { name: 'black', color: C.ink },
    { name: 'white', color: C.white },
    { name: 'red', color: C.red },
  ],
  motifs: () =>
    motifSvg(
      <g filter="url(#bsMotif)">
        <rect x={0} y={20} width={30} height={120} fill={C.ink} />
        <rect x={50} y={50} width={30} height={90} fill={C.ink} />
        <rect x={100} y={0} width={30} height={140} fill={C.red} />
        <rect x={180} y={55} width={300} height={40} fill={C.ink} transform="rotate(-10 330 75)" />
        <circle cx={600} cy={75} r={60} fill={C.red} />
        <rect x={720} y={20} width={110} height={110} fill={C.ink} />
        <rect x={745} y={45} width={60} height={60} fill="white" />
      </g>,
      <JaggedFilter id="bsMotif" scale={10} />,
    ),
  build: 'Jagged-edge filter on shapes and on type, three colors only',
  motion: 'Bars slide and slice the frame, symbols assemble from pieces',
  pro: 'Dramatic: perfect for sanctions and deadlines',
  con: 'Serious tone: it has to stay ironic, not scary',
  refs: [
    'The Man with the Golden Arm, titles, 1955',
    'Vertigo, poster, 1958',
    'Anatomy of a Murder, titles, 1959',
  ],
  Sample: BassSample,
};

// -------------------------------------------------------------------------------- 7 Isotype

const IsotypeSample: React.FC = () => (
  <Bg color={C.paper}>
    <Text
      size={30}
      color={C.ink}
      top={300}
      right={60}
      font={fonts.mono}
      style={{ letterSpacing: '0.04em' }}
    >
      ESEMPIO · UN MESE DI ACQUISTI ESTERI
    </Text>
    <Text size={118} color={C.ink} top={380}>
      12 fatture, <span style={{ color: C.red }}>4 da sistemare</span>
    </Text>
    <Art>
      {Array.from({ length: 12 }, (_, i) => (
        <InvoicePictogram
          key={i}
          x={110 + (i % 6) * 145}
          y={760 + Math.floor(i / 6) * 150}
          scale={1.5}
          color={i >= 8 ? C.red : C.blue}
          mark={i >= 8 ? '!' : undefined}
        />
      ))}
      <text x={110} y={1090} fontSize={30} fill={C.ink} fontFamily="DM Mono" letterSpacing={2}>
        1 SIMBOLO = 1 FATTURA
      </text>
    </Art>
    <Mascot pen={C.blue} look={{ limbWidth: 10 }} x={600} y={1200} w={340} />
  </Bg>
);

const isotype: Board = {
  key: 'isotype',
  title: 'Pictograms (Isotype)',
  after: 'after Otto Neurath and Gerd Arntz, Vienna 1925-1940',
  traits: [
    'Numbers become rows of identical pictograms',
    'A bigger quantity means more symbols, never a bigger symbol',
    'Flat silhouettes: no perspective, no decoration',
    'Built to be read in a second, in any language',
  ],
  palette: [
    { name: 'blue', color: C.blue },
    { name: 'red', color: C.red },
    { name: 'black', color: C.ink },
    { name: 'paper', color: C.paper },
  ],
  motifs: () =>
    motifSvg(
      <g>
        {Array.from({ length: 9 }, (_, i) => (
          <InvoicePictogram
            key={i}
            x={10 + i * 82}
            y={30}
            scale={1.1}
            color={i > 5 ? C.red : C.blue}
          />
        ))}
        <text x={780} y={100} fontSize={44} fill={C.ink} fontFamily="DM Mono">
          = 9 fatture
        </text>
      </g>,
    ),
  build: 'A small pictogram set (invoice, euro, person, calendar) laid out on a grid',
  motion: 'Symbols appear one by one, then some change color to show the share',
  pro: 'Turns invoices and amounts into something you can see at a glance',
  con: 'A module for number scenes, not a full style on its own',
  refs: [
    'Gerd Arntz pictogram archive (about 4,000 signs)',
    'Otto Neurath, Gesellschaft und Wirtschaft, 1930',
  ],
  note: 'Combines with any of the other six directions for scenes with numbers.',
  Sample: IsotypeSample,
};

export const BOARDS: Board[] = [matisse, lionni, depero, rand, memphis, bass, isotype];
