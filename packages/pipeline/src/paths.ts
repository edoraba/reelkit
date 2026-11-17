import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function findRepoRoot(start: string): string {
  let dir = start;
  for (;;) {
    if (existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir)
      throw new Error('Repo root not found: no pnpm-workspace.yaml above ' + start);
    dir = parent;
  }
}

export const repoRoot = findRepoRoot(path.dirname(fileURLToPath(import.meta.url)));
export const toolsDir = path.join(repoRoot, 'tools');
export const downloadsDir = path.join(toolsDir, '.downloads');
export const contentDir = path.join(repoRoot, 'content');

/** Executable file name for the current OS. */
export function exe(name: string): string {
  return process.platform === 'win32' ? `${name}.exe` : name;
}

/** Path relative to the repo root, with forward slashes, for logs. */
export function rel(p: string): string {
  return path.relative(repoRoot, p).split(path.sep).join('/');
}
