import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { MascotPlan } from '@reelkit/schema';
import { stretchVoice } from './src/audio/stretch';
import { postPaths, timelineOf } from './src/post/post';

// Writes the render props of a post without rendering, for quick stills.
const id = process.argv[2]!;
const plan = MascotPlan.parse(JSON.parse(readFileSync(postPaths(id).mascot, 'utf8')));
const audio = `.scratch/${id}/voice.wav`;
stretchVoice(postPaths(id).voice, path.resolve('../../assets', audio), plan.stretch);
writeFileSync(path.resolve('out/render', `${id}.json`), JSON.stringify(timelineOf(id, audio, plan)));
console.log('props written');
