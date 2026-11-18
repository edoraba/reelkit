/**
 * Pronunciation pass (D-030): turns script text into the text the voice reads. Screen text keeps
 * "TD17" and "49,99 €"; the voice gets "ti di diciassette" and "quarantanove euro e
 * novantanove". Deterministic, applied right before synthesis. Add new acronyms to LEXICON.
 */

const UNITS = [
  'zero',
  'uno',
  'due',
  'tre',
  'quattro',
  'cinque',
  'sei',
  'sette',
  'otto',
  'nove',
  'dieci',
  'undici',
  'dodici',
  'tredici',
  'quattordici',
  'quindici',
  'sedici',
  'diciassette',
  'diciotto',
  'diciannove',
];
const TENS = [
  '',
  '',
  'venti',
  'trenta',
  'quaranta',
  'cinquanta',
  'sessanta',
  'settanta',
  'ottanta',
  'novanta',
];

function below100(n: number): string {
  if (n < 20) return UNITS[n]!;
  const tens = TENS[Math.floor(n / 10)]!;
  const unit = n % 10;
  if (unit === 0) return tens;
  // "ventuno", "trentotto": the tens lose their final vowel before uno and otto.
  const head = unit === 1 || unit === 8 ? tens.slice(0, -1) : tens;
  return head + UNITS[unit]!;
}

function below1000(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  let head = hundreds === 0 ? '' : hundreds === 1 ? 'cento' : `${UNITS[hundreds]}cento`;
  if (rest === 0) return head;
  // "centottanta": cento loses its vowel before ottanta (but "centootto" keeps it).
  if (head && rest >= 80 && rest < 90) head = head.slice(0, -1);
  return head + below100(rest);
}

/** Italian words for a whole number, 0 to 999 999 999 ("ventitré", "duemilaventisei"). */
export function numberToWords(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n >= 1e9) throw new Error(`Unsupported number ${n}`);
  if (n === 0) return 'zero';
  const millions = Math.floor(n / 1e6);
  const thousands = Math.floor((n % 1e6) / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (millions) parts.push(millions === 1 ? 'un milione' : `${below1000(millions)} milioni`);
  let tail = '';
  if (thousands) tail += thousands === 1 ? 'mille' : `${below1000(thousands)}mila`;
  if (rest) tail += below1000(rest);
  if (tail) parts.push(tail);
  // Final "tre" of a compound takes the accent: ventitré, centotré (not tre alone).
  return parts.join(' ').replace(/([a-z])tre$/, '$1tré');
}

/** "1.220" or "1220" -> 1220. */
const toInt = (digits: string): number => Number(digits.replace(/\./g, ''));

/** Two-digit cents: ",5" means 50 cents. */
const toCents = (digits: string): number => Number(digits.padEnd(2, '0').slice(0, 2));

const NUMBER = String.raw`(\d{1,3}(?:\.\d{3})+|\d+)`;

function amount(whole: string, cents?: string): string {
  const n = toInt(whole);
  const euros = n === 1 ? 'un euro' : `${numberToWords(n)} euro`;
  const c = cents ? toCents(cents) : 0;
  return c ? `${euros} e ${numberToWords(c)}` : euros;
}

type Rule = [RegExp, (...m: string[]) => string];

/**
 * Rewrite rules, applied in order: acronyms read the way an Italian accountant says them, then
 * amounts, percentages, decimals and the remaining numbers. Add new acronyms at the top.
 */
const RULES: Rule[] = [
  // The site, as the CTA says it (Edoardo, 2026-11-18: refattura.it, not "link in bio").
  [/\brefattura\.it\b/gi, () => 'refattura punto it'],
  [/\bTD ?(\d{2})\b/g, (_, n) => `ti di ${numberToWords(Number(n))}`],
  [/\bF24\b/g, () => 'effe ventiquattro'],
  [/\bP\. ?IVA\b/gi, () => 'partita Iva'],
  [/\bIVA\b/g, () => 'Iva'],
  // "allo SDI" -> "all'esse di i": the article elides before the spelled letters.
  [/\b([Ll]|[Aa]ll|[Dd]ell|[Nn]ell|[Ss]ull|[Dd]all)o (?:SDI|SdI)\b/g, (_, a) => `${a}'esse di i`],
  [/\bSdI\b|\bSDI\b/g, () => 'esse di i'],
  [/\bPEC\b/g, () => 'pec'],
  // Amounts: "49,99 €", "49,99 euro", "€ 1.220".
  [
    new RegExp(String.raw`${NUMBER}(?:,(\d{1,2}))?\s*(?:€|euro\b)`, 'g'),
    (_, w, c) => amount(w!, c),
  ],
  [new RegExp(String.raw`€\s*${NUMBER}(?:,(\d{1,2}))?`, 'g'), (_, w, c) => amount(w!, c)],
  // Percentages: "22%", "4,5 %".
  [
    new RegExp(String.raw`${NUMBER}(?:,(\d+))?\s*%`, 'g'),
    (_, w, d) =>
      d
        ? `${numberToWords(toInt(w!))} virgola ${numberToWords(Number(d))} per cento`
        : `${numberToWords(toInt(w!))} per cento`,
  ],
  // Decimals and plain numbers.
  [
    new RegExp(String.raw`${NUMBER},(\d+)`, 'g'),
    (_, w, d) => `${numberToWords(toInt(w!))} virgola ${numberToWords(Number(d))}`,
  ],
  [new RegExp(String.raw`\b${NUMBER}\b`, 'g'), (_, w) => numberToWords(toInt(w!))],
];

/** Text for the voice. */
export function spoken(text: string): string {
  let out = text;
  for (const [pattern, replace] of RULES) out = out.replace(pattern, replace);
  return out;
}

/** One unit of screen text and the words the voice says for it. */
export interface SpeechUnit {
  /** As written on screen: "TD17,", "49,99 euro", "fattura". */
  screen: string;
  /** As spoken: ["ti", "di", "diciassette,"]. */
  spoken: string[];
}

/**
 * Splits screen text into units and pairs each with its spoken words, so that a caption can
 * show "TD17" for the time the voice says "ti di diciassette". Tokens touched by the same rule
 * ("49,99" and "euro") form one unit.
 */
export function speechMap(text: string): SpeechUnit[] {
  const tokens = [...text.matchAll(/\S+/g)].map((m) => ({
    text: m[0],
    from: m.index,
    to: m.index + m[0].length,
  }));
  // Character spans rewritten by any rule, merged when they overlap.
  const spans: Array<[number, number]> = [];
  for (const [pattern] of RULES) {
    for (const m of text.matchAll(new RegExp(pattern.source, pattern.flags))) {
      spans.push([m.index, m.index + m[0].length]);
    }
  }
  spans.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const s of spans) {
    const last = merged.at(-1);
    if (last && s[0] < last[1]) last[1] = Math.max(last[1], s[1]);
    else merged.push([...s]);
  }
  const units: SpeechUnit[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    const span = merged.find(([a, b]) => a < t.to && b > t.from);
    let j = i;
    if (span) while (j + 1 < tokens.length && tokens[j + 1]!.from < span[1]) j++;
    const screen = tokens
      .slice(i, j + 1)
      .map((x) => x.text)
      .join(' ');
    units.push({ screen, spoken: spoken(screen).split(/\s+/).filter(Boolean) });
    i = j;
  }
  return units;
}

/** The voice text of a speech map. */
export const spokenText = (units: SpeechUnit[]): string => units.flatMap((u) => u.spoken).join(' ');
