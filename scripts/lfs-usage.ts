/**
 * Estimates Git LFS usage against the GitHub free quota (10 GiB storage, 10 GiB bandwidth
 * per month for personal accounts, checked 2026-11-17). Storage counts every version ever
 * pushed, so the history total is the number that matters.
 *   pnpm lfs:usage
 * Git LFS is temporary storage for the test period: see docs/decisions.md D-005.
 */
import { execFileSync } from 'node:child_process';

const QUOTA_BYTES = 10 * 1024 ** 3;
const UNITS: Record<string, number> = { B: 1, KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12 };

function lfsFiles(all: boolean): Map<string, number> {
  const args = ['lfs', 'ls-files', '--long', '--size'];
  if (all) args.push('--all');
  let out = '';
  try {
    out = execFileSync('git', args, { encoding: 'utf8' });
  } catch {
    return new Map();
  }
  const byOid = new Map<string, number>();
  for (const line of out.split('\n')) {
    // <oid> <*|-> <path> (<size> <unit>)
    const m = line.match(/^([0-9a-f]{64}) [*-] .+ \(([\d.]+) ([KMGT]?B)\)$/);
    if (m) byOid.set(m[1]!, Number(m[2]) * (UNITS[m[3]!] ?? 1));
  }
  return byOid;
}

const sum = (m: Map<string, number>) => [...m.values()].reduce((a, b) => a + b, 0);
const fmt = (b: number) => `${(b / 1024 ** 3).toFixed(2)} GiB`;

const current = lfsFiles(false);
const history = lfsFiles(true);
const total = sum(history.size > 0 ? history : current);

console.log(`LFS objects in HEAD:     ${current.size} files, ${fmt(sum(current))}`);
console.log(`LFS objects in history:  ${history.size} files, ${fmt(total)}`);
console.log(`Free quota used:         ${((total / QUOTA_BYTES) * 100).toFixed(1)}% of 10 GiB`);
if (total > QUOTA_BYTES * 0.7) {
  console.log('\nOver 70%: plan the move of renders to GitHub Releases or to own storage (D-005).');
}
