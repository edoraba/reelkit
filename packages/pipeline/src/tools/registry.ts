import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { downloadsDir, exe, toolsDir } from '../paths';
import { download, extractTarXz, extractZip } from './download';

/**
 * External binaries used by the pipeline, downloaded by `pnpm bootstrap` into tools/
 * (gitignored). Versions are pinned here; bump them on purpose and re-run bootstrap.
 */
export const pinned = {
  /** BtbN static builds, release branch 9.0 (rolling patch builds on the `latest` tag). */
  ffmpegBranch: '9.0',
  rhubarb: '1.14.0',
  /** Remotion recommends 1.5.5 for token-level timestamps; Windows binaries stop at 1.6.0. */
  whisper: '1.5.5',
} as const;

export const WHISPER_MODELS = ['tiny', 'base', 'small', 'medium'] as const;
export type WhisperModelName = (typeof WHISPER_MODELS)[number];

export type Platform = 'win' | 'linux';

export function currentPlatform(): Platform {
  if (process.platform === 'win32') return 'win';
  if (process.platform === 'linux' && process.arch === 'x64') return 'linux';
  throw new Error(
    `Unsupported platform ${process.platform}/${process.arch}: only Windows x64 and Linux x64 are supported`,
  );
}

export const bin = {
  ffmpeg: path.join(toolsDir, 'ffmpeg', 'bin', exe('ffmpeg')),
  ffprobe: path.join(toolsDir, 'ffmpeg', 'bin', exe('ffprobe')),
  rhubarb: path.join(toolsDir, 'rhubarb', exe('rhubarb')),
  whisperDir: path.join(toolsDir, 'whisper.cpp'),
  whisperMain: path.join(toolsDir, 'whisper.cpp', exe('main')),
} as const;

export function whisperModelPath(model: WhisperModelName): string {
  return path.join(bin.whisperDir, `ggml-${model}.bin`);
}

// ---------------------------------------------------------------------------
// versions.json: what is installed, so bootstrap can skip work (idempotent)
// ---------------------------------------------------------------------------

export interface InstalledVersions {
  ffmpeg?: string;
  rhubarb?: string;
  whisper?: string;
  whisperModel?: WhisperModelName;
}

const versionsFile = path.join(toolsDir, 'versions.json');

export function readInstalled(): InstalledVersions {
  if (!existsSync(versionsFile)) return {};
  return JSON.parse(readFileSync(versionsFile, 'utf8')) as InstalledVersions;
}

export function writeInstalled(versions: InstalledVersions): void {
  writeFileSync(versionsFile, JSON.stringify(versions, null, 2) + '\n');
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

/** Runs a binary and returns the first line of its output, or null if it fails. */
export function firstLine(binary: string, args: string[]): string | null {
  if (!existsSync(binary)) return null;
  const res = spawnSync(binary, args, { encoding: 'utf8' });
  if (res.error) return null;
  const out = `${res.stdout ?? ''}${res.stderr ?? ''}`.trim();
  return out.split(/\r?\n/)[0] ?? null;
}

export function hasCommand(cmd: string): boolean {
  const probe = process.platform === 'win32' ? 'where' : 'which';
  return spawnSync(probe, [cmd], { stdio: 'ignore' }).status === 0;
}

/** Moves the single top-level directory of `extracted` to `target`. */
function promoteSingleDir(extracted: string, target: string): void {
  const entries = readdirSync(extracted, { withFileTypes: true }).filter((e) => e.isDirectory());
  if (entries.length !== 1 || !entries[0]) {
    throw new Error(`Expected one directory in ${extracted}, found ${entries.length}`);
  }
  rmSync(target, { recursive: true, force: true });
  renameSync(path.join(extracted, entries[0].name), target);
}

function makeExecutable(...files: string[]): void {
  if (process.platform === 'win32') return;
  for (const f of files) chmodSync(f, 0o755);
}

// ---------------------------------------------------------------------------
// installers
// ---------------------------------------------------------------------------

export async function installFfmpeg(platform: Platform): Promise<string> {
  const b = pinned.ffmpegBranch;
  const asset =
    platform === 'win'
      ? `ffmpeg-n${b}-latest-win64-gpl-${b}.zip`
      : `ffmpeg-n${b}-latest-linux64-gpl-${b}.tar.xz`;
  const url = `https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/${asset}`;
  const archive = path.join(downloadsDir, asset);
  const tmp = path.join(toolsDir, '.tmp-ffmpeg');

  await download(url, archive);
  rmSync(tmp, { recursive: true, force: true });
  if (platform === 'win') await extractZip(archive, tmp);
  else extractTarXz(archive, tmp);
  promoteSingleDir(tmp, path.join(toolsDir, 'ffmpeg'));
  rmSync(tmp, { recursive: true, force: true });
  rmSync(archive, { force: true });
  makeExecutable(bin.ffmpeg, bin.ffprobe);

  const line = firstLine(bin.ffmpeg, ['-version']);
  if (!line) throw new Error('ffmpeg installed but does not run');
  return line.replace(/^ffmpeg version\s+/, '').split(' ')[0] ?? line;
}

export async function installRhubarb(platform: Platform): Promise<string> {
  const v = pinned.rhubarb;
  const asset = `Rhubarb-Lip-Sync-${v}-${platform === 'win' ? 'Windows' : 'Linux'}.zip`;
  const url = `https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v${v}/${asset}`;
  const archive = path.join(downloadsDir, asset);
  const tmp = path.join(toolsDir, '.tmp-rhubarb');

  await download(url, archive);
  rmSync(tmp, { recursive: true, force: true });
  await extractZip(archive, tmp);
  promoteSingleDir(tmp, path.join(toolsDir, 'rhubarb'));
  rmSync(tmp, { recursive: true, force: true });
  rmSync(archive, { force: true });
  makeExecutable(bin.rhubarb);

  const line = firstLine(bin.rhubarb, ['--version']);
  if (!line) throw new Error('rhubarb installed but does not run');
  return v;
}

export async function installWhisper(platform: Platform): Promise<string> {
  if (platform === 'linux') {
    const missing = ['git', 'make', 'g++'].filter((c) => !hasCommand(c));
    if (missing.length > 0) {
      throw new Error(
        `whisper.cpp is compiled from source on Linux and needs: ${missing.join(', ')}.\n` +
          `    Debian/Ubuntu: sudo apt install -y git build-essential`,
      );
    }
  }
  const { installWhisperCpp } = await import('@remotion/install-whisper-cpp');
  const version = pinned.whisper;
  // installWhisperCpp skips work when the folder already holds the executable;
  // on a version bump we wipe it so the new version gets installed.
  const installed = readInstalled().whisper;
  if (installed && installed !== version) rmSync(bin.whisperDir, { recursive: true, force: true });
  await installWhisperCpp({ to: bin.whisperDir, version, printOutput: true });
  return version;
}

export async function installWhisperModel(model: WhisperModelName): Promise<WhisperModelName> {
  const { downloadWhisperModel } = await import('@remotion/install-whisper-cpp');
  let nextMark = 10;
  await downloadWhisperModel({
    model,
    folder: bin.whisperDir,
    printOutput: false,
    onProgress: (done, total) => {
      const pct = total > 0 ? Math.floor((done / total) * 100) : 0;
      while (pct >= nextMark) {
        console.log(`    ggml-${model}.bin ${nextMark}% of ${(total / 1e6).toFixed(0)} MB`);
        nextMark += 10;
      }
    },
  });
  return model;
}

/** Downloads the Chrome Headless Shell used by Remotion to render. */
export async function installBrowser(): Promise<void> {
  const { ensureBrowser } = await import('@remotion/renderer');
  await ensureBrowser();
}
