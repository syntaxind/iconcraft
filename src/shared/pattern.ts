import type { PatternSpec } from '../types/iconTheme';
import { safeColor } from './dna';

/**
 * Background pattern layers for the 512x512 icon canvas (also reused for folder assets).
 * Everything is deterministic so every icon in a pack gets the exact same texture.
 */

const f = (n: number) => Number(n.toFixed(2));

/** Small seeded PRNG (mulberry32) so the constellation is stable between renders. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function halftone(color: string, scale: number, size: number): string {
  const cell = Math.max(14, 26 * scale);
  const max = cell * 0.46;
  const out: string[] = [];
  for (let y = cell / 2; y < size + cell; y += cell) {
    for (let x = cell / 2; x < size + cell; x += cell) {
      // radius grows along the diagonal from the top-left towards the bottom-right
      const t = Math.min(1, Math.max(0, (x + y) / (size * 2)));
      const r = max * (0.08 + 0.92 * t);
      if (r > 0.6) out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}"/>`);
    }
  }
  return `<g fill="${color}">${out.join('')}</g>`;
}

function hexGrid(color: string, scale: number, size: number): string {
  const a = Math.max(14, 24 * scale); // hexagon side length
  const h = Math.sqrt(3) * a;
  const parts: string[] = [];
  for (let row = -1, y = 0; y < size + h; row++, y = row * (h / 2)) {
    for (let x = (row % 2 === 0 ? 0 : 1.5 * a); x < size + 2 * a; x += 3 * a) {
      const pts = Array.from({ length: 6 }, (_, i) => {
        const ang = (Math.PI / 3) * i;
        return `${f(x + a * Math.cos(ang))} ${f(y + a * Math.sin(ang))}`;
      });
      parts.push(`M${pts.join(' L')} Z`);
    }
  }
  return `<path d="${parts.join(' ')}" fill="none" stroke="${color}" stroke-width="${f(Math.max(1.2, 1.6 * scale))}" stroke-linejoin="round"/>`;
}

function constellation(color: string, scale: number, size: number): string {
  const rand = rng(20260);
  const count = Math.round(16 + 6 / Math.max(0.5, scale));
  const pts = Array.from({ length: count }, () => ({ x: rand() * size, y: rand() * size, r: 2 + rand() * 4 * scale }));
  const maxDist = 170 * Math.max(0.8, scale);
  const lines: string[] = [];
  pts.forEach((p, i) => {
    pts
      .map((q, j) => ({ j, d: Math.hypot(p.x - q.x, p.y - q.y) }))
      .filter((o) => o.j > i && o.d < maxDist)
      .sort((u, v) => u.d - v.d)
      .slice(0, 2)
      .forEach((o) => lines.push(`M${f(p.x)} ${f(p.y)} L${f(pts[o.j].x)} ${f(pts[o.j].y)}`));
  });
  const dots = pts.map((p) => `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(p.r)}"/>`).join('');
  return `<path d="${lines.join(' ')}" fill="none" stroke="${color}" stroke-width="${f(1.6 * Math.max(0.8, scale))}" stroke-linecap="round"/><g fill="${color}">${dots}</g>`;
}

/**
 * Returns SVG markup (to be placed inside an <svg> with a 0 0 `size` viewBox) for the pattern,
 * or an empty string for `none`. `idPrefix` keeps <pattern> ids unique per document.
 */
export function patternMarkup(spec: PatternSpec, size = 512, idPrefix = 'ic'): string {
  if (!spec || spec.type === 'none') return '';
  const color = safeColor(spec.color, '#ffffff');
  const opacity = Math.min(1, Math.max(0, spec.opacity));
  const scale = Math.min(3, Math.max(0.5, spec.scale));
  if (opacity <= 0) return '';
  const id = `${idPrefix}-pat`;
  const fill = `<rect width="${size}" height="${size}" fill="url(#${id})"/>`;

  let inner = '';
  switch (spec.type) {
    case 'dots': {
      const c = 30 * scale;
      inner = `<defs><pattern id="${id}" width="${f(c)}" height="${f(c)}" patternUnits="userSpaceOnUse"><circle cx="${f(c / 2)}" cy="${f(c / 2)}" r="${f(2.6 * scale)}" fill="${color}"/></pattern></defs>${fill}`;
      break;
    }
    case 'grid': {
      const c = 36 * scale;
      inner = `<defs><pattern id="${id}" width="${f(c)}" height="${f(c)}" patternUnits="userSpaceOnUse"><path d="M${f(c)} 0 H0 V${f(c)}" fill="none" stroke="${color}" stroke-width="${f(1.4 * scale)}"/></pattern></defs>${fill}`;
      break;
    }
    case 'lines': {
      const c = 22 * scale;
      inner = `<defs><pattern id="${id}" width="${f(c)}" height="${f(c)}" patternUnits="userSpaceOnUse"><path d="M0 ${f(c / 2)} H${f(c)}" stroke="${color}" stroke-width="${f(2 * scale)}"/></pattern></defs>${fill}`;
      break;
    }
    case 'diagonal': {
      const c = 26 * scale;
      inner = `<defs><pattern id="${id}" width="${f(c)}" height="${f(c)}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 ${f(c / 2)} H${f(c)}" stroke="${color}" stroke-width="${f(2.2 * scale)}"/></pattern></defs>${fill}`;
      break;
    }
    case 'halftone':
      inner = halftone(color, scale, size);
      break;
    case 'hex':
      inner = hexGrid(color, scale, size);
      break;
    case 'constellation':
      inner = constellation(color, scale, size);
      break;
    default:
      return '';
  }
  return `<g opacity="${f(opacity)}">${inner}</g>`;
}
