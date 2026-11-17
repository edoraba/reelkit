import { refattura, social, type BackgroundName } from '@reelkit/brand';
import { fontsOf } from '../../brand/fonts';
import { Mascot } from '../../mascot/Mascot';
import { LogoMark } from './LogoMark';
import { DotEyes, Eyes, LW, OUT, PenArm, PenLegs, Shadow, Smile, WHITE } from './parts';

/**
 * Mascot candidates for review, from close to the current invoice sheet to very different
 * ideas and characters derived from the logo mark. Static drawings in a 400 x 480 viewBox;
 * the chosen one gets the full rig in phase 2.
 */

export type Family = 'close' | 'different' | 'logo';

export interface Candidate {
  name: string;
  note: string;
  family: Family;
  bg: BackgroundName;
  texture: 'grid' | 'plain';
  draw: (pen: string) => React.ReactNode;
}

const mono = fontsOf('brand').mono;
const BLUE = refattura.inkBlue;
const SHADE = refattura.sheetGrey;
const RULE = refattura.fieldRule;
const LOGO_LIGHT = 'oklch(75% 0.12 264)';

const InvoiceSheet: React.FC<{ face: React.ReactNode }> = ({ face }) => (
  <g strokeLinejoin="round">
    <path
      d="M 129 80 H 251 L 301 130 V 392 Q 301 412 281 412 H 129 Q 109 412 109 392 V 100 Q 109 80 129 80 Z"
      fill={WHITE}
      stroke={OUT}
      strokeWidth={LW}
    />
    <path d="M 251 80 V 118 Q 251 130 263 130 H 301 Z" fill={SHADE} stroke={OUT} strokeWidth={LW} />
    {face}
    <g stroke={RULE} strokeWidth={9} strokeLinecap="round">
      <line x1={140} y1={330} x2={270} y2={330} />
      <line x1={140} y1={354} x2={270} y2={354} />
      <line x1={140} y1={378} x2={200} y2={378} />
    </g>
  </g>
);

export const CANDIDATES: Candidate[] = [
  // ------------------------------------------------------------------ close to the current one
  {
    name: 'Invoice',
    note: 'current provisional, pen limbs',
    family: 'close',
    bg: 'blue',
    texture: 'grid',
    draw: (pen) => (
      <g transform="translate(40 -8)">
        <Mascot width={320} cues={[{ at: 0, pose: 'neutral' }]} seed="lab" pen={pen} />
      </g>
    ),
  },
  {
    name: 'Soft invoice',
    note: 'big head proportions, fold as a tuft',
    family: 'close',
    bg: 'paper',
    texture: 'grid',
    draw: (pen) => (
      <>
        <Shadow />
        <PenLegs x={200} gap={28} top={385} bottom={440} pen={pen} />
        <PenArm from={[114, 270]} elbow={[84, 290]} hand={[78, 330]} pen={pen} />
        <PenArm from={[286, 262]} elbow={[322, 250]} hand={[330, 205]} pen={pen} />
        <rect
          x={112}
          y={110}
          width={176}
          height={280}
          rx={48}
          fill={WHITE}
          stroke={OUT}
          strokeWidth={LW}
        />
        <path
          d="M 232 112 C 262 92, 296 104, 290 156 C 268 146, 246 132, 232 112 Z"
          fill={SHADE}
          stroke={OUT}
          strokeWidth={LW}
          strokeLinejoin="round"
        />
        <Eyes cx={200} dx={36} y={215} rx={27} ry={32} look={{ x: 0.2, y: -0.2 }} />
        <ellipse cx={146} cy={262} rx={14} ry={8} fill={social.sky} opacity={0.6} />
        <ellipse cx={254} cy={262} rx={14} ry={8} fill={social.sky} opacity={0.6} />
        <Smile x={200} y={268} w={18} />
        <g stroke={RULE} strokeWidth={9} strokeLinecap="round">
          <line x1={150} y1={318} x2={250} y2={318} />
          <line x1={150} y1={342} x2={220} y2={342} />
        </g>
      </>
    ),
  },
  {
    name: 'Invoice, logo face',
    note: 'the sheet with the logo mark as its face',
    family: 'close',
    bg: 'sky',
    texture: 'grid',
    draw: (pen) => (
      <>
        <Shadow />
        <PenLegs x={200} gap={34} top={410} bottom={442} pen={pen} />
        <PenArm from={[112, 250]} elbow={[78, 262]} hand={[70, 300]} pen={pen} />
        <PenArm from={[298, 250]} elbow={[330, 240]} hand={[336, 200]} pen={pen} />
        <InvoiceSheet
          face={
            <LogoMark
              x={205}
              y={236}
              scale={1.05}
              rotate={-45}
              ring={LOGO_LIGHT}
              ink={BLUE}
              eyeShine
            />
          }
        />
      </>
    ),
  },
  {
    name: 'Batch',
    note: 'the monthly batch: a stack of invoices',
    family: 'close',
    bg: 'ink',
    texture: 'plain',
    draw: (pen) => (
      <>
        <PenLegs x={200} gap={34} top={400} bottom={442} pen={pen} />
        <PenArm from={[108, 250]} elbow={[74, 270]} hand={[70, 310]} pen={pen} />
        <PenArm from={[292, 250]} elbow={[326, 270]} hand={[330, 310]} pen={pen} />
        <g strokeLinejoin="round">
          <rect
            x={102}
            y={118}
            width={190}
            height={286}
            rx={14}
            fill={SHADE}
            stroke={OUT}
            strokeWidth={LW}
            transform="rotate(-8 197 261)"
          />
          <rect
            x={106}
            y={114}
            width={190}
            height={286}
            rx={14}
            fill={SHADE}
            stroke={OUT}
            strokeWidth={LW}
            transform="rotate(5 201 257)"
          />
          <rect
            x={105}
            y={108}
            width={190}
            height={290}
            rx={14}
            fill={WHITE}
            stroke={OUT}
            strokeWidth={LW}
          />
        </g>
        <Eyes cx={200} dx={34} y={196} rx={22} ry={27} look={{ x: -0.3, y: 0.1 }} />
        <Smile x={200} y={250} w={16} />
        <g stroke={RULE} strokeWidth={9} strokeLinecap="round">
          <line x1={135} y1={292} x2={265} y2={292} />
          <line x1={135} y1={314} x2={235} y2={314} />
        </g>
        <rect x={146} y={338} width={108} height={40} rx={20} fill={BLUE} />
        <text x={200} y={367} textAnchor="middle" fill={WHITE} fontSize={26} {...mono}>
          ×12
        </text>
      </>
    ),
  },
  {
    name: 'Receipt',
    note: 'a receipt strip that curls at the top',
    family: 'close',
    bg: 'blue',
    texture: 'plain',
    draw: (pen) => {
      const teeth = 6;
      const w = 120 / teeth;
      let zig = '';
      for (let i = 0; i < teeth; i++) {
        zig += ` L ${254 - i * w - w / 2} 402 L ${254 - (i + 1) * w} 414`;
      }
      return (
        <>
          <PenLegs x={200} gap={26} top={410} bottom={442} pen={pen} />
          <PenArm from={[146, 250]} elbow={[112, 262]} hand={[100, 300]} pen={pen} />
          <PenArm from={[254, 240]} elbow={[290, 226]} hand={[300, 186]} pen={pen} />
          <path
            d={`M 146 92 H 254 V 414 ${zig} V 92 Z`}
            fill={WHITE}
            stroke={OUT}
            strokeWidth={LW}
            strokeLinejoin="round"
          />
          <rect
            x={136}
            y={70}
            width={128}
            height={30}
            rx={15}
            fill={SHADE}
            stroke={OUT}
            strokeWidth={LW}
          />
          <DotEyes cx={200} dx={22} y={164} r={9} />
          <Smile x={200} y={196} w={14} width={7} />
          <line
            x1={160}
            y1={232}
            x2={240}
            y2={232}
            stroke={RULE}
            strokeWidth={5}
            strokeDasharray="10 8"
          />
          <g fill={OUT} fontSize={22} {...mono}>
            <text x={160} y={268}>
              TD17
            </text>
            <text x={240} y={268} textAnchor="end">
              €
            </text>
            <text x={160} y={300}>
              IVA
            </text>
            <text x={240} y={300} textAnchor="end">
              %
            </text>
          </g>
          <line
            x1={160}
            y1={322}
            x2={240}
            y2={322}
            stroke={RULE}
            strokeWidth={5}
            strokeDasharray="10 8"
          />
          <text x={160} y={360} fill={OUT} fontSize={26} {...mono}>
            TOT
          </text>
        </>
      );
    },
  },
  {
    name: 'Stamp',
    note: 'the rubber stamp: it hops and stamps OK',
    family: 'close',
    bg: 'paper',
    texture: 'grid',
    draw: (pen) => (
      <>
        <ellipse
          cx={200}
          cy={448}
          rx={86}
          ry={20}
          fill="none"
          stroke={refattura.stampGreen}
          strokeWidth={6}
        />
        <text
          x={200}
          y={458}
          textAnchor="middle"
          fill={refattura.stampGreen}
          fontSize={30}
          {...mono}
        >
          OK
        </text>
        <PenArm from={[110, 250]} elbow={[74, 236]} hand={[66, 196]} pen={pen} />
        <PenArm from={[290, 250]} elbow={[326, 264]} hand={[334, 304]} pen={pen} />
        <g strokeLinejoin="round">
          <rect x={182} y={120} width={36} height={60} fill={OUT} />
          <circle cx={200} cy={100} r={42} fill={BLUE} stroke={OUT} strokeWidth={LW} />
          <circle cx={186} cy={86} r={9} fill={WHITE} opacity={0.7} />
          <rect
            x={108}
            y={172}
            width={184}
            height={172}
            rx={30}
            fill={WHITE}
            stroke={OUT}
            strokeWidth={LW}
          />
          <rect x={94} y={338} width={212} height={44} rx={10} fill={OUT} />
          <rect x={102} y={382} width={196} height={16} rx={6} fill={refattura.stampGreen} />
        </g>
        <Eyes cx={200} dx={38} y={238} rx={22} ry={26} look={{ x: 0, y: 0.3 }} />
        <Smile x={200} y={292} w={20} />
      </>
    ),
  },

  // ---------------------------------------------------------------------- very different ideas
  {
    name: 'Pen',
    note: 'stands on its tip and draws the underlines',
    family: 'different',
    bg: 'sky',
    texture: 'grid',
    draw: (pen) => (
      <>
        <path
          d="M 70 452 C 110 440, 150 460, 196 446"
          fill="none"
          stroke={social.markerYellow}
          strokeWidth={14}
          strokeLinecap="round"
        />
        <PenArm from={[164, 262]} elbow={[124, 250]} hand={[112, 212]} pen={pen} />
        <PenArm from={[236, 262]} elbow={[276, 276]} hand={[290, 312]} pen={pen} />
        <g strokeLinejoin="round">
          <rect
            x={164}
            y={168}
            width={72}
            height={190}
            rx={10}
            fill={WHITE}
            stroke={OUT}
            strokeWidth={LW}
          />
          <rect
            x={160}
            y={56}
            width={80}
            height={124}
            rx={30}
            fill={BLUE}
            stroke={OUT}
            strokeWidth={LW}
          />
          <rect x={232} y={74} width={14} height={96} rx={7} fill={OUT} />
          <rect x={166} y={350} width={68} height={40} fill={OUT} />
          <path
            d="M 170 388 L 230 388 L 205 436 Q 200 446 195 436 Z"
            fill={SHADE}
            stroke={OUT}
            strokeWidth={LW}
          />
        </g>
        <Eyes cx={200} dx={18} y={222} rx={13} ry={16} look={{ x: -0.6, y: 0.6 }} />
        <Smile x={200} y={262} w={13} width={6} />
      </>
    ),
  },
  {
    name: 'Ink drop',
    note: 'a drop of the brand blue, squash and stretch',
    family: 'different',
    bg: 'paper',
    texture: 'grid',
    draw: () => (
      <>
        <Shadow rx={90} />
        <ellipse cx={170} cy={410} rx={24} ry={12} fill={OUT} />
        <ellipse cx={232} cy={410} rx={24} ry={12} fill={OUT} />
        <path
          d="M 200 70 C 238 132, 306 204, 306 288 C 306 352, 258 400, 200 400 C 142 400, 94 352, 94 288 C 94 204, 162 132, 200 70 Z"
          fill={BLUE}
          stroke={OUT}
          strokeWidth={LW}
          strokeLinejoin="round"
        />
        <ellipse
          cx={138}
          cy={262}
          rx={11}
          ry={26}
          fill={WHITE}
          opacity={0.75}
          transform="rotate(18 138 262)"
        />
        <Eyes cx={208} dx={34} y={290} rx={23} ry={27} look={{ x: 0.1, y: -0.2 }} />
        <Smile x={208} y={342} w={18} color={WHITE} />
        <path
          d="M 318 150 C 324 162, 332 172, 326 182 C 320 190, 308 186, 310 174 C 311 166, 316 158, 318 150 Z"
          fill={BLUE}
          stroke={OUT}
          strokeWidth={5}
        />
        <circle cx={300} cy={120} r={8} fill={BLUE} stroke={OUT} strokeWidth={5} />
      </>
    ),
  },
  {
    name: 'Grid cell',
    note: 'one square of the squared paper, one cell marked',
    family: 'different',
    bg: 'blue',
    texture: 'plain',
    draw: (pen) => (
      <>
        <defs>
          <pattern
            id="cellgrid"
            width={30}
            height={30}
            patternUnits="userSpaceOnUse"
            x={110}
            y={110}
          >
            <path d="M 30 0 H 0 V 30" fill="none" stroke={social.sky} strokeWidth={2.5} />
          </pattern>
        </defs>
        <PenLegs x={200} gap={42} top={300} bottom={438} pen={pen} />
        <PenArm from={[112, 222]} elbow={[76, 236]} hand={[66, 276]} pen={pen} />
        <PenArm from={[288, 214]} elbow={[324, 200]} hand={[334, 160]} pen={pen} />
        <rect x={110} y={110} width={180} height={190} rx={26} fill={WHITE} />
        <rect x={230} y={230} width={30} height={30} fill={social.markerYellow} />
        <rect
          x={110}
          y={110}
          width={180}
          height={190}
          rx={26}
          fill="url(#cellgrid)"
          stroke={OUT}
          strokeWidth={LW}
        />
        <rect x={152} y={164} width={24} height={32} rx={4} fill={OUT} />
        <rect x={224} y={164} width={24} height={32} rx={4} fill={OUT} />
        <Smile x={200} y={228} w={20} />
      </>
    ),
  },
  {
    name: 'XML tag',
    note: 'e-invoices are XML: </> as a character',
    family: 'different',
    bg: 'ink',
    texture: 'plain',
    draw: (pen) => (
      <>
        <PenLegs x={200} gap={30} top={330} bottom={440} pen={pen} />
        <g stroke={pen} strokeWidth={24} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M 98 186 L 46 250 L 98 314" />
          <path d="M 302 186 L 354 250 L 302 314" />
        </g>
        <circle cx={200} cy={250} r={84} fill={WHITE} stroke={OUT} strokeWidth={LW} />
        <line
          x1={226}
          y1={112}
          x2={200}
          y2={172}
          stroke={pen}
          strokeWidth={22}
          strokeLinecap="round"
        />
        <Eyes cx={200} dx={30} y={240} rx={20} ry={24} look={{ x: 0, y: 0 }} />
        <Smile x={200} y={290} w={18} />
      </>
    ),
  },

  // --------------------------------------------------------------------------- from the logo
  {
    name: 'Logo head',
    note: 'round head, the mark is the face',
    family: 'logo',
    bg: 'paper',
    texture: 'grid',
    draw: (pen) => (
      <>
        <Shadow rx={80} />
        <PenLegs x={200} gap={24} top={392} bottom={440} pen={pen} />
        <PenArm from={[152, 330]} elbow={[116, 320]} hand={[100, 284]} pen={pen} />
        <PenArm from={[248, 330]} elbow={[284, 344]} hand={[296, 380]} pen={pen} />
        <rect
          x={150}
          y={290}
          width={100}
          height={104}
          rx={30}
          fill={BLUE}
          stroke={OUT}
          strokeWidth={LW}
        />
        <circle cx={200} cy={190} r={122} fill={WHITE} stroke={OUT} strokeWidth={LW} />
        <LogoMark x={200} y={210} scale={1.4} rotate={-45} ring={LOGO_LIGHT} ink={BLUE} eyeShine />
      </>
    ),
  },
  {
    name: 'Living logo',
    note: 'the mark itself, eyes, smile and tuft',
    family: 'logo',
    bg: 'paper',
    texture: 'grid',
    draw: (pen) => (
      <>
        <Shadow rx={90} />
        <PenLegs x={200} gap={34} top={318} bottom={440} pen={pen} />
        <PenArm from={[112, 258]} elbow={[74, 236]} hand={[66, 192]} pen={pen} />
        <PenArm from={[288, 258]} elbow={[326, 282]} hand={[334, 322]} pen={pen} />
        <LogoMark x={200} y={226} scale={2.15} rotate={-45} ring={LOGO_LIGHT} ink={BLUE} eyeShine />
      </>
    ),
  },
  {
    name: 'Seal',
    note: 'a blue seal (bollino) with the mark as face',
    family: 'logo',
    bg: 'sky',
    texture: 'grid',
    draw: (pen) => {
      const pts: string[] = [];
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        const r = i % 2 === 0 ? 128 : 116;
        pts.push(`${(200 + r * Math.cos(a)).toFixed(1)},${(212 + r * Math.sin(a)).toFixed(1)}`);
      }
      return (
        <>
          <Shadow rx={80} />
          <PenLegs x={200} gap={30} top={336} bottom={440} pen={pen} />
          <PenArm from={[80, 236]} elbow={[50, 210]} hand={[48, 168]} pen={pen} />
          <PenArm from={[320, 236]} elbow={[350, 262]} hand={[352, 302]} pen={pen} />
          <polygon
            points={pts.join(' ')}
            fill={BLUE}
            stroke={OUT}
            strokeWidth={LW}
            strokeLinejoin="round"
          />
          <circle
            cx={200}
            cy={212}
            r={98}
            fill="none"
            stroke={WHITE}
            strokeWidth={4}
            strokeDasharray="10 9"
          />
          <LogoMark x={200} y={224} scale={1.15} rotate={-45} ring={WHITE} ink={WHITE} />
        </>
      );
    },
  },
  {
    name: 'Logo figure',
    note: 'the mark upright: dot head, raised arm, curled body',
    family: 'logo',
    bg: 'paper',
    texture: 'grid',
    draw: () => (
      <>
        <Shadow x={168} y={430} rx={110} />
        <LogoMark x={168} y={262} scale={3.3} ring={LOGO_LIGHT} ink={BLUE} />
        {/* Face on the north dot, which becomes the head. */}
        <g fill={WHITE}>
          <circle cx={157} cy={106} r={6.5} />
          <circle cx={180} cy={106} r={6.5} />
        </g>
        <path
          d="M 156 124 Q 168 134 181 124"
          fill="none"
          stroke={WHITE}
          strokeWidth={5}
          strokeLinecap="round"
        />
      </>
    ),
  },
];
