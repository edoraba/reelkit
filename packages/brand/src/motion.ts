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
  pull: { lead: 16, frames: 36 },
};
