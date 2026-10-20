/**
 * Reads an image file and downsizes it so uploads stay small (the model does not
 * need more than ~768px to read an icon's style). Also converts SVG to PNG.
 */
export async function fileToResizedDataUrl(file: File, maxSize = 768): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Berkas gambar tidak dapat dibaca / Could not read the image'));
      el.src = objectUrl;
    });

    const w = img.naturalWidth || maxSize;
    const h = img.naturalHeight || maxSize;
    const scale = Math.min(1, maxSize / Math.max(w, h));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
