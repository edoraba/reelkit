import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { rel, repoRoot, toolsDir } from './paths';
import {
  bin,
  currentPlatform,
  firstLine,
  installBrowser,
  installFfmpeg,
  installRhubarb,
  installWhisper,
  installWhisperModel,
  pinned,
  readInstalled,
  whisperModelPath,
  writeInstalled,
  type WhisperModelName,
} from './tools/registry';

export const TOOL_NAMES = ['ffmpeg', 'rhubarb', 'whisper', 'browser'] as const;
export type ToolName = (typeof TOOL_NAMES)[number];

export interface BootstrapOptions {
  only: ToolName[];
  model: WhisperModelName;
  force: boolean;
}

/**
 * Installs the external binaries into tools/. Safe to run again: anything already installed
 * at the pinned version is skipped (use --force to reinstall).
 */
export async function bootstrap(opts: BootstrapOptions): Promise<void> {
  const platform = currentPlatform();
  mkdirSync(toolsDir, { recursive: true });
  const installed = readInstalled();
  const want = (t: ToolName) => opts.only.includes(t);
  console.log(`bootstrap on ${platform}, tools dir ${rel(toolsDir)}/\n`);

  ensureGitLfs();

  if (want('ffmpeg')) {
    const ok = !opts.force && installed.ffmpeg && existsSync(bin.ffmpeg) && existsSync(bin.ffprobe);
    if (ok) console.log(`  ffmpeg   up to date (${installed.ffmpeg})`);
    else {
      console.log(`  ffmpeg   installing branch n${pinned.ffmpegBranch}`);
      installed.ffmpeg = await installFfmpeg(platform);
      writeInstalled(installed);
      console.log(`  ffmpeg   installed ${installed.ffmpeg}`);
    }
  }

  if (want('rhubarb')) {
    const ok = !opts.force && installed.rhubarb === pinned.rhubarb && existsSync(bin.rhubarb);
    if (ok) console.log(`  rhubarb  up to date (${installed.rhubarb})`);
    else {
      console.log(`  rhubarb  installing ${pinned.rhubarb}`);
      installed.rhubarb = await installRhubarb(platform);
      writeInstalled(installed);
      console.log(`  rhubarb  installed ${installed.rhubarb}`);
    }
  }

  if (want('whisper')) {
    const ok = !opts.force && installed.whisper === pinned.whisper && existsSync(bin.whisperMain);
    if (ok) console.log(`  whisper  up to date (${installed.whisper})`);
    else {
      if (opts.force) rmSync(bin.whisperDir, { recursive: true, force: true });
      console.log(`  whisper  installing whisper.cpp ${pinned.whisper}`);
      installed.whisper = await installWhisper(platform);
      writeInstalled(installed);
      console.log(`  whisper  installed ${installed.whisper}`);
    }
    if (existsSync(whisperModelPath(opts.model))) {
      console.log(`  whisper  model ${opts.model} present`);
    } else {
      console.log(`  whisper  downloading model ${opts.model}`);
      await installWhisperModel(opts.model);
    }
    installed.whisperModel = opts.model;
    writeInstalled(installed);
  }

  if (want('browser')) {
    console.log('  browser  ensuring Remotion Chrome Headless Shell');
    await installBrowser();
    console.log('  browser  ready');
  }

  console.log('\nbootstrap done. Run `pnpm tools:check` to verify.');
}

/**
 * Videos, covers and voice tracks are stored with Git LFS: make sure the LFS hooks are in
 * this clone (pnpm install only sets the pre-commit guard).
 */
function ensureGitLfs(): void {
  const version = spawnSync('git', ['lfs', 'version'], { encoding: 'utf8', cwd: repoRoot });
  if (version.status !== 0) {
    throw new Error(
      'Git LFS is not installed. Install it (https://git-lfs.com, or `sudo apt install git-lfs`) and re-run.',
    );
  }
  const res = spawnSync('git', ['lfs', 'install', '--local'], { encoding: 'utf8', cwd: repoRoot });
  if (res.status !== 0) throw new Error(`git lfs install failed: ${res.stderr}`);
  console.log(`  git-lfs  hooks installed (${version.stdout.trim().split(' ')[0]})`);
}

function lfsHooksInstalled(): boolean {
  return existsSync(path.join(repoRoot, '.git', 'hooks', 'pre-push'));
}

/** Prints the status of every tool. Returns false if something is missing. */
export function check(model: WhisperModelName): boolean {
  const platform = currentPlatform();
  const installed = readInstalled();
  const rows: Array<[string, boolean, string]> = [
    [
      'ffmpeg',
      !!firstLine(bin.ffmpeg, ['-version']),
      `${rel(bin.ffmpeg)} ${installed.ffmpeg ?? ''}`,
    ],
    ['ffprobe', !!firstLine(bin.ffprobe, ['-version']), rel(bin.ffprobe)],
    [
      'rhubarb',
      !!firstLine(bin.rhubarb, ['--version']),
      `${rel(bin.rhubarb)} ${installed.rhubarb ?? ''}`,
    ],
    ['whisper', existsSync(bin.whisperMain), `${rel(bin.whisperMain)} ${installed.whisper ?? ''}`],
    ['model', existsSync(whisperModelPath(model)), rel(whisperModelPath(model))],
    ['git-lfs', lfsHooksInstalled(), '.git/hooks/pre-push'],
  ];
  console.log(`tools on ${platform}\n`);
  for (const [name, ok, detail] of rows) {
    console.log(`  ${ok ? 'OK     ' : 'MISSING'}  ${name.padEnd(8)} ${detail}`);
  }
  const allOk = rows.every(([, ok]) => ok);
  if (!allOk) console.log('\nRun `pnpm bootstrap` to install what is missing.');
  if (platform === 'linux') {
    console.log(
      '\nLinux: Remotion needs Chrome shared libraries. If a render fails to launch the browser:\n' +
        '  sudo apt install -y libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 libxrandr2 \\\n' +
        '    libxkbcommon-dev libxfixes3 libxcomposite1 libxdamage1 libatk-bridge2.0-0 \\\n' +
        '    libpango-1.0-0 libcairo2 libcups2',
    );
  }
  return allOk;
}
