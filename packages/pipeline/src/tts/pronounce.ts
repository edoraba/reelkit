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

/** Acronyms and symbols read the way an Italian accountant says them. Order matters. */
const LEXICON: Array<[RegExp, string | ((...m: string[]) => string)]> = [
  [/\bTD ?(\d{2})\b/g, (_, n) => `ti di ${numberToWords(Number(n))}`],
  [/\bF24\b/g, 'effe ventiquattro'],
  [/\bP\. ?IVA\b/gi, 'partita Iva'],
  [/\bIVA\b/g, 'Iva'],
  // "allo SDI" -> "all'esse di i": the article elides before the spelled letters.
  [/\b([Ll]|[Aa]ll|[Dd]ell|[Nn]ell|[Ss]ull|[Dd]all)o (?:SDI|SdI)\b/g, "$1'esse di i"],
  [/\bSdI\b|\bSDI\b/g, 'esse di i'],
  [/\bPEC\b/g, 'pec'],
];

const NUMBER = String.raw`(\d{1,3}(?:\.\d{3})+|\d+)`;

/** Text for the voice: lexicon first, then amounts, percentages and the remaining numbers. */
export function spoken(text: string): string {
  let out = text;
  for (const [pattern, replacement] of LEXICON) {
    out = out.replace(pattern, replacement as string);
  }
  // Amounts: "49,99 €", "49,99 euro", "€ 1.220".
  const amount = (whole: string, cents?: string) => {
    const n = toInt(whole);
    const euros = n === 1 ? 'un euro' : `${numberToWords(n)} euro`;
    const c = cents ? toCents(cents) : 0;
    return c ? `${euros} e ${numberToWords(c)}` : euros;
  };
  out = out.replace(new RegExp(`${NUMBER}(?:,(\\d{1,2}))?\\s*(?:€|euro\\b)`, 'g'), (_, w, c) =>
    amount(w, c),
  );
  out = out.replace(new RegExp(`€\\s*${NUMBER}(?:,(\\d{1,2}))?`, 'g'), (_, w, c) => amount(w, c));
  // Percentages: "22%", "4,5 %".
  out = out.replace(new RegExp(`${NUMBER}(?:,(\\d+))?\\s*%`, 'g'), (_, w, d) =>
    d
      ? `${numberToWords(toInt(w))} virgola ${numberToWords(Number(d))} per cento`
      : `${numberToWords(toInt(w))} per cento`,
  );
  // Decimals and plain numbers.
  out = out.replace(
    new RegExp(`${NUMBER},(\\d+)`, 'g'),
    (_, w, d) => `${numberToWords(toInt(w))} virgola ${numberToWords(Number(d))}`,
  );
  out = out.replace(new RegExp(`\\b${NUMBER}\\b`, 'g'), (_, w) => numberToWords(toInt(w)));
  return out;
}
