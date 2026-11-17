/**
 * Pre-commit guard (installed by simple-git-hooks on `pnpm install`). Blocks the commit if a
 * staged file:
 *   - is over 50 MB and not stored with Git LFS
 *   - is a .env file or contains something that looks like a secret
 *   - contains an em dash (U+2014) in text we write: guidelines, docs, content, code
 * Run by hand with `pnpm guard`.
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const MAX_BYTES = 50 * 1024 * 1024;
const TEXT_EXT = new Set([
  '.md',
  '.json',
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.yaml',
  '.yml',
  '.txt',
  '.css',
]);
/** Third-party or generated text we do not control. */
const EM_DASH_EXEMPT = [/^assets\/fonts\//, /^pnpm-lock\.yaml$/, /(^|\/)OFL\.txt$/];

const SECRET_PATTERNS: Array<[string, RegExp]> = [
  ['Google API key', /AIza[0-9A-Za-z_-]{35}/],
  ['Meta/Instagram access token', /\bEAA[A-Za-z0-9]{60,}/],
  ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{36,}/],
];

// Built from the code point so this file does not contain the character it forbids.
const EM_DASH = String.fromCharCode(0x2014);

function git(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

const staged = git(['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'])
  .split('\0')
  .filter(Boolean);

const errors: string[] = [];

for (const file of staged) {
  const name = path.posix.basename(file);
  if (/^\.env(\..+)?$/.test(name) && name !== '.env.example') {
    errors.push(`${file}: env files must never be committed`);
    continue;
  }

  const size = Number(git(['cat-file', '-s', `:${file}`]).trim());
  const isLfs = git(['check-attr', 'filter', '--', file]).trim().endsWith(': lfs');
  if (size > MAX_BYTES && !isLfs) {
    errors.push(`${file}: ${(size / 1e6).toFixed(1)} MB and not tracked by Git LFS`);
  }

  if (isLfs || !TEXT_EXT.has(path.posix.extname(file)) || size > 4 * 1024 * 1024) continue;
  const content = git(['show', `:${file}`]);

  for (const [label, pattern] of SECRET_PATTERNS) {
    if (pattern.test(content)) errors.push(`${file}: looks like it contains a ${label}`);
  }

  if (!EM_DASH_EXEMPT.some((re) => re.test(file)) && content.includes(EM_DASH)) {
    const lines = content
      .split('\n')
      .map((l, i) => (l.includes(EM_DASH) ? i + 1 : 0))
      .filter(Boolean);
    errors.push(`${file}: em dash on line ${lines.join(', ')} (use a colon, comma or period)`);
  }
}

if (errors.length > 0) {
  console.error('guard: commit blocked\n');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`guard: ${staged.length} staged file(s) ok`);
