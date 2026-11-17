/**
 * Deterministic randomness. Every random choice (SFX variant, blink timing, micro movement)
 * goes through here with a key derived from the post id, so the same input renders the same output.
 */

/** 32-bit FNV-1a hash of a string. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Mulberry32 generator seeded by the joined key parts. Returns floats in [0, 1). */
export function seededRandom(...keyParts: Array<string | number>): () => number {
  let state = hashString(keyParts.join(':'));
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Single deterministic value in [0, 1) for a key. */
export function randomFor(...keyParts: Array<string | number>): number {
  return seededRandom(...keyParts)();
}
