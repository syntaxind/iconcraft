import type { CSSProperties } from 'react';
import type { IconShape } from '../types/iconTheme';

export const ALL_SHAPES: { id: IconShape; label: string; short: string }[] = [
  { id: 'squircle', label: 'Squircle (Android/OneUI)', short: 'Squircle' },
  { id: 'circle', label: 'Circle (Pixel/Poco)', short: 'Circle' },
  { id: 'rounded-rect', label: 'Rounded Square', short: 'Square' },
  { id: 'teardrop', label: 'Teardrop', short: 'Teardrop' },
  { id: 'hexagon', label: 'Hexagon', short: 'Hexagon' },
];

/** Corner radii as a fraction of the icon size: [tl, tr, br, bl]. */
const RADII: Record<Exclude<IconShape, 'hexagon'>, [number, number, number, number]> = {
  squircle: [0.3, 0.3, 0.3, 0.3],
  'rounded-rect': [0.16, 0.16, 0.16, 0.16],
  circle: [0.5, 0.5, 0.5, 0.5],
  teardrop: [0.5, 0.5, 0.08, 0.5],
};

/** Hexagon (pointy-top) vertices in 0..1 space. */
const HEXAGON: [number, number][] = Array.from({ length: 6 }, (_, i) => {
  const angle = (Math.PI / 3) * i - Math.PI / 6;
  return [0.5 + 0.5 * Math.cos(angle), 0.5 + 0.5 * Math.sin(angle)];
});

/** CSS used by the live preview. Mirrors `traceShapePath` used for export. */
export function shapeStyle(shape: IconShape): CSSProperties {
  if (shape === 'hexagon') {
    return {
      clipPath: `polygon(${HEXAGON.map(([x, y]) => `${(x * 100).toFixed(2)}% ${(y * 100).toFixed(2)}%`).join(', ')})`,
    };
  }
  const r = RADII[shape] ?? RADII.squircle;
  return { borderRadius: r.map((v) => `${v * 100}%`).join(' ') };
}

/** Traces the mask onto a canvas context (full-bleed, no padding). */
export function traceShapePath(ctx: CanvasRenderingContext2D, shape: IconShape, size: number) {
  ctx.beginPath();
  if (shape === 'hexagon') {
    HEXAGON.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x * size, y * size);
      else ctx.lineTo(x * size, y * size);
    });
    ctx.closePath();
    return;
  }
  const r = (RADII[shape] ?? RADII.squircle).map((v) => v * size);
  ctx.roundRect(0, 0, size, size, r);
}

const f2 = (n: number) => Number(n.toFixed(2));

/** SVG path data for the mask, placed at (x, y) with the given size. Mirrors `traceShapePath`. */
export function shapePathData(shape: IconShape, size: number, x = 0, y = 0): string {
  if (shape === 'hexagon') {
    return (
      HEXAGON.map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${f2(x + px * size)} ${f2(y + py * size)}`).join(' ') + ' Z'
    );
  }
  const [tl, tr, br, bl] = (RADII[shape] ?? RADII.squircle).map((v) => v * size);
  const r = f2;
  return [
    `M${r(x + tl)} ${r(y)}`,
    `H${r(x + size - tr)}`,
    `A${r(tr)} ${r(tr)} 0 0 1 ${r(x + size)} ${r(y + tr)}`,
    `V${r(y + size - br)}`,
    `A${r(br)} ${r(br)} 0 0 1 ${r(x + size - br)} ${r(y + size)}`,
    `H${r(x + bl)}`,
    `A${r(bl)} ${r(bl)} 0 0 1 ${r(x)} ${r(y + size - bl)}`,
    `V${r(y + tl)}`,
    `A${r(tl)} ${r(tl)} 0 0 1 ${r(x + tl)} ${r(y)}`,
    'Z',
  ].join(' ');
}
