import path from 'node:path';
import { Config } from '@remotion/cli/config';

Config.setEntryPoint('./src/index.ts');
// Fonts, logo, icons, SFX and music live in the repo-level assets/ folder.
Config.setPublicDir(path.resolve(process.cwd(), '../../assets'));

// Reel output: H.264 + AAC, yuv420p for Instagram/TikTok compatibility.
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
// Limited range BT.709 with full tags: without it the file is full range tagged bt470bg
// (yuvj420p), which some players and platform transcoders read with shifted colors.
Config.setColorSpace('bt709');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);

// GPU rendering (D-034): Chrome left to itself rasterizes the SVG paper filters (turbulence,
// displacement, morphology) in software; through ANGLE on the GPU the same frames render about
// 13 times faster, pixel for pixel the same. On a machine without a GPU pass --gl=swangle.
Config.setChromiumOpenGlRenderer('angle');
