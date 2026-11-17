import path from 'node:path';
import { Config } from '@remotion/cli/config';

Config.setEntryPoint('./src/index.ts');
// Fonts, logo, icons, SFX and music live in the repo-level assets/ folder.
Config.setPublicDir(path.resolve(process.cwd(), '../../assets'));

// Reel output: H.264 + AAC, yuv420p for Instagram/TikTok compatibility.
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
