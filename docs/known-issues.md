# Known issues

Small problems found and deferred on purpose: none of them is visible in the reels rendered so far. Fix them when they show up in a reel or when the code around them changes. Remove an entry once it is fixed (the commit is the record).

## Mascot and choreography (D-032)

- **Depth swaps at once.** When a walk moves the mascot from behind the motifs to in front (or back), the depth changes on the first frame of the walk (`packages/video/src/mascot/choreo.ts`) instead of when the mascot clears the motif. Not visible in TD17, where the swaps happen away from any motif. Fix: switch depth at the moment the mascot's x leaves the motif's x range.
- **The flying letter follows the mascot.** After a `send`, the letter's path is computed from the mascot's current x (`packages/video/src/compositions/reel/MascotLayer.tsx`), so a `pull` right after a send drags the letter across the frame. Fix: freeze the start point of the path at the send time.
- **One reaction per motif per scene.** `PaletteBackdrop` takes the first reaction it finds for a motif (`reactions.find`), so a second lean or tickle on the same motif in the same scene is not drawn. Fix: pick the reaction active at the current frame.
- **Two blooms in a row.** When a `pull` trigger has no room, the planner falls back to the plain transition, and the bloom and cut alternation can then give two blooms one after the other. Fix: re-run the alternation after the fallbacks.
- **One random stream for the whole plan.** The automatic choices of the planner come from a single seeded stream, so editing one beat can change the automatic gestures of every later beat. Fix: seed each beat on its own (`seededRandom(postId, beatId, ...)`), as the music already is in the sound plan.

## Tooling

- **Stray `dev/` folder.** `pnpm install` (the `simple-git-hooks` postinstall) creates a `dev/null/` folder in the repository root on Windows, with copies of the Git LFS hooks. It is untracked; delete it by hand. Cause not investigated (probably a hook path that resolves `/dev/null` relative to the repository).
