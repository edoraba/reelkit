import { execFileSync } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import extract from 'extract-zip';

/** Downloads `url` to `dest` (skipped if `dest` exists), printing progress every 10%. */
export async function download(url: string, dest: string): Promise<void> {
  if (existsSync(dest)) return;
  mkdirSync(path.dirname(dest), { recursive: true });

  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok || !res.body) throw new Error(`Download failed (${res.status}): ${url}`);

  const total = Number(res.headers.get('content-length') ?? 0);
  const name = path.basename(dest);
  let received = 0;
  let nextMark = 10;
  const progress = new Transform({
    transform(chunk: Buffer, _enc, callback) {
      received += chunk.length;
      if (total > 0) {
        const pct = Math.floor((received / total) * 100);
        while (pct >= nextMark) {
          console.log(`    ${name} ${nextMark}%`);
          nextMark += 10;
        }
      }
      callback(null, chunk);
    },
  });

  const partial = `${dest}.part`;
  rmSync(partial, { force: true });
  console.log(`    downloading ${url}${total ? ` (${(total / 1e6).toFixed(0)} MB)` : ''}`);
  await pipeline(
    Readable.fromWeb(res.body as unknown as WebReadableStream<Uint8Array>),
    progress,
    createWriteStream(partial),
  );
  renameSync(partial, dest);
}

export async function extractZip(archive: string, dir: string): Promise<void> {
  mkdirSync(dir, { recursive: true });
  await extract(archive, { dir: path.resolve(dir) });
}

/** .tar.xz extraction through the system tar (Linux only: needs tar and xz). */
export function extractTarXz(archive: string, dir: string): void {
  mkdirSync(dir, { recursive: true });
  execFileSync('tar', ['-xJf', archive, '-C', dir], { stdio: 'inherit' });
}
