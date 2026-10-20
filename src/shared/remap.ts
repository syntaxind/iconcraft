import type { StyleDNA } from '../types/iconTheme';

/** Colour fields of a DNA, in the order used to build the old -> new mapping. */
function colorList(dna: StyleDNA): string[] {
  const c = dna.colors;
  return [c.primary, c.secondary, c.background, c.backgroundGradient.from, c.backgroundGradient.to, c.glyphColor, c.accentColor, c.shadowColor];
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Builds a case-insensitive old -> new colour map. Colours that did not change, and old
 * colours that would be mapped to two different new colours, are left out (ambiguous).
 */
export function buildColorMap(from: StyleDNA, to: StyleDNA): Map<string, string> {
  const a = colorList(from);
  const b = colorList(to);
  const map = new Map<string, string>();
  const ambiguous = new Set<string>();
  a.forEach((oldC, i) => {
    const key = oldC.trim().toLowerCase();
    const next = b[i].trim();
    if (!key || key === next.toLowerCase()) return;
    const prev = map.get(key);
    if (prev !== undefined && prev.toLowerCase() !== next.toLowerCase()) ambiguous.add(key);
    map.set(key, next);
  });
  ambiguous.forEach((k) => map.delete(k));
  return map;
}

/**
 * Recolours existing SVG artwork by swapping the old DNA colours for the new ones in a single
 * pass (so A->B and B->C never chain). Used for AI-made icons, which cannot be re-rendered
 * offline without losing their drawing.
 */
export function remapSvgColors(svg: string, from: StyleDNA, to: StyleDNA): string {
  const map = buildColorMap(from, to);
  if (map.size === 0) return svg;
  const keys = [...map.keys()].sort((x, y) => y.length - x.length);
  // A colour token must not be followed by more hex digits (so #fff does not hit #ffffff).
  const re = new RegExp(`(${keys.map(escapeRe).join('|')})(?![0-9a-zA-Z])`, 'gi');
  return svg.replace(re, (m) => map.get(m.toLowerCase()) ?? m);
}
