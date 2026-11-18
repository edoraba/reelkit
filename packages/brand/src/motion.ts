/**
 * Timing of the paper transitions in frames at 30 fps (D-023, D-031, D-032): `lead` is how many
 * frames before the first word of the incoming scene the transition starts, `frames` how long
 * it lasts. Shared by the mascot planner and the video so both agree on when a scene changes.
 */
export type TransitionName = 'bloom' | 'cut' | 'collage' | 'star' | 'pull';

export const transitionTiming: Record<TransitionName, { lead: number; frames: number }> = {
  bloom: { lead: 10, frames: 20 },
  cut: { lead: 14, frames: 28 },
  collage: { lead: 10, frames: 24 },
  star: { lead: 10, frames: 20 },
  pull: { lead: 20, frames: 32 },
};

/**
 * Closing of every reel (brief, generation.md; D-033): after the last word, a bloom into a
 * dark palette and a white paper card with the Refattura logotype, the tagline and the site.
 */
export const outroTiming = {
  /** Pause after the last word before the closing starts. */
  gapMs: 250,
  durationMs: 2400,
} as const;

/** A dark palette for the closing, different from the reel's last scene. */
export function outroPalette(lastPalette: string): 'blu' | 'notte' {
  return lastPalette === 'blu' ? 'notte' : 'blu';
}
