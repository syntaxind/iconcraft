import type { IconShape, StyleDNA } from '../types/iconTheme';
import { getPattern, safeColor } from './dna';
import { patternMarkup } from './pattern';
import { shapePathData } from './shapes';

/**
 * Sizes and proportions measured from a published Xiaomi Theme Store icon module:
 * - icon_mask.png is 180x180 with the shape occupying 118px (31px inset on every side),
 * - folder backgrounds are 434x434, full-bleed shape, accent colour at ~10% with a slightly stronger rim.
 */
export const ICON_SIZE = 256;
export const MASK_SIZE = 180;
export const MASK_INSET = 31;
export const FOLDER_SIZE = 434;

/** Solid black shape on a transparent canvas (the launcher uses its alpha as the icon mask). */
export function buildMaskSvg(shape: IconShape): string {
  const inner = MASK_SIZE - MASK_INSET * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MASK_SIZE} ${MASK_SIZE}" width="${MASK_SIZE}" height="${MASK_SIZE}"><path d="${shapePathData(shape, inner, MASK_INSET, MASK_INSET)}" fill="#000"/></svg>`;
}

/** Translucent folder plate in the pack's accent colour, textured with the DNA pattern. */
export function buildFolderSvg(dna: StyleDNA, shape: IconShape): string {
  const accent = safeColor(dna.colors.accentColor, '#ffffff');
  const pat = getPattern(dna);
  // Pattern is kept quieter than on icons so folder thumbnails stay readable.
  const pattern = patternMarkup({ ...pat, opacity: pat.opacity * 0.6 }, 512, 'fd');
  const full = shapePathData(shape, 512);
  const rim = shapePathData(shape, 506, 3, 3);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${FOLDER_SIZE}" height="${FOLDER_SIZE}">
  <defs><clipPath id="fd-clip"><path d="${full}"/></clipPath></defs>
  <path d="${full}" fill="${accent}" fill-opacity="0.10"/>
  <g clip-path="url(#fd-clip)">${pattern}</g>
  <path d="${rim}" fill="none" stroke="${accent}" stroke-opacity="0.2" stroke-width="5"/>
</svg>`;
}
