import type { IconShape } from '../types/iconTheme';
import { svgToDataUri } from '../shared/svg';
import { traceShapePath } from '../shared/shapes';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Gagal memuat gambar / Failed to load image'));
    img.src = src;
  });
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))), 'image/png');
  });
}

async function rasterize(src: string, size: number, shape: IconShape): Promise<Blob> {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Artwork is full-bleed, so the mask is always applied (including squircle).
  ctx.save();
  traceShapePath(ctx, shape, size);
  ctx.clip();
  ctx.drawImage(img, 0, 0, size, size);
  ctx.restore();

  return canvasToPng(canvas);
}

/** Renders an SVG string to a PNG clipped to the given shape mask. */
export function rasterizeSvgToBlob(svg: string, size = 512, shape: IconShape = 'squircle'): Promise<Blob> {
  return rasterize(svgToDataUri(svg), size, shape);
}

/** Renders a raster data URL to a PNG clipped to the given shape mask. */
export function rasterizeDataUrlToBlob(dataUrl: string, size = 512, shape: IconShape = 'squircle'): Promise<Blob> {
  return rasterize(dataUrl, size, shape);
}

/** Renders a self-contained SVG (which already carries its own shape) to a PNG without extra masking. */
export async function rasterizeSvgRaw(svg: string, width: number, height: number): Promise<Blob> {
  const img = await loadImage(svgToDataUri(svg));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D canvas context');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  return canvasToPng(canvas);
}
