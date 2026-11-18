import { geminiTts } from './gemini';
import { kokoroTts, piperTts } from './local';
import type { TtsProvider, TtsProviderName } from './types';

/**
 * House voice (D-030): Gemini 3.8 Flash TTS, voice Puck, chosen by Edoardo after the
 * listening test (D-029). Overridable from .env for experiments, never silently replaced.
 */
export const VOICE_STYLE =
  'Friendly, lightly ironic narrator of a short social video. Lively but clear pace, ' +
  'smiling while speaking, short natural pauses at full stops.';

export interface VoiceConfig {
  provider: TtsProviderName;
  model: string;
  voice: string;
  style: string;
}

export function houseVoice(): VoiceConfig {
  const provider = (process.env.TTS_PROVIDER ?? 'gemini') as TtsProviderName;
  return {
    provider,
    model: process.env.GEMINI_TTS_MODEL ?? 'gemini-3.8-flash-tts',
    voice: process.env.GEMINI_TTS_VOICE ?? 'Puck',
    style: VOICE_STYLE,
  };
}

export function providerOf(config: VoiceConfig): TtsProvider {
  if (config.provider === 'kokoro') return kokoroTts();
  if (config.provider === 'piper') return piperTts();
  return geminiTts(config.model);
}
