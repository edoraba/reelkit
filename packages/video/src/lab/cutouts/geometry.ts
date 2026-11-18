/** Small geometry helpers for procedural cut-paper shapes. */

export type Pt = readonly [number, number];

/** Closed smooth path through points (Catmull-Rom converted to cubic Bezier). */
export function smoothClosed(points: Pt[], tension = 1): string {
  const n = points.length;
  if (n < 3) return '';
  const p = (i: number) => points[((i % n) + n) % n]!;
  let d = `M ${p(0)[0].toFixed(1)} ${p(0)[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = p(i - 1);
    const p1 = p(i);
    const p2 = p(i + 1);
    const p3 = p(i + 2);
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension;
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension;
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension;
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return `${d} Z`;
}

/** Open smooth path through points. */
export function smoothOpen(points: Pt[]): string {
  if (points.length < 2) return '';
  const p = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))]!;
  let d = `M ${p(0)[0].toFixed(1)} ${p(0)[1].toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = p(i - 1);
    const p1 = p(i);
    const p2 = p(i + 1);
    const p3 = p(i + 2);
    d += ` C ${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/** Quadratic Bezier point and tangent angle (degrees). */
export function quad(p0: Pt, p1: Pt, p2: Pt, s: number): { x: number; y: number; angle: number } {
  const u = 1 - s;
  const x = u * u * p0[0] + 2 * u * s * p1[0] + s * s * p2[0];
  const y = u * u * p0[1] + 2 * u * s * p1[1] + s * s * p2[1];
  const tx = 2 * u * (p1[0] - p0[0]) + 2 * s * (p2[0] - p1[0]);
  const ty = 2 * u * (p1[1] - p0[1]) + 2 * s * (p2[1] - p1[1]);
  return { x, y, angle: (Math.atan2(ty, tx) * 180) / Math.PI };
}

/** Pointed leaf from the origin to (0, -length), as a path. */
export function leafPath(length: number, width: number): string {
  const L = length;
  const w = width;
  return `M 0 0 C ${w * 0.95} ${-L * 0.22} ${w * 0.75} ${-L * 0.78} 0 ${-L} C ${-w * 0.75} ${-L * 0.78} ${-w * 0.95} ${-L * 0.22} 0 0 Z`;
}

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Smooth 0..1 ramp between two frames. */
export function ramp(frame: number, from: number, duration: number): number {
  const t = clamp01((frame - from) / duration);
  return t * t * (3 - 2 * t);
}

/** Overshooting 0..1 pop, like a paper piece landing (damped). */
export function pop(frame: number, from: number, duration = 12): number {
  if (frame < from) return 0;
  const t = (frame - from) / duration;
  if (t >= 1) return 1;
  return 1 - Math.exp(-5 * t) * Math.cos(t * 9);
}

/** Frame quantized to "twos" (or more): hand-animated timing. */
export const onTwos = (frame: number, step = 2) => Math.floor(frame / step) * step;
