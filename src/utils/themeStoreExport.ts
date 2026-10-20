import JSZip from 'jszip';
import type { GeneratedIconItem, IconShape, StyleDNA } from '../types/iconTheme';
import { getComponentCandidates } from './presets';
import { rasterizeDataUrlToBlob, rasterizeSvgRaw, rasterizeSvgToBlob } from './canvasRasterizer';
import { sanitizeSvg } from '../shared/svg';
import { FOLDER_SIZE, ICON_SIZE, MASK_SIZE, buildFolderSvg, buildMaskSvg } from '../shared/themeAssets';

/** Folder inside the `icons` module that holds every PNG (xxhdpi, as used by Theme Store packs). */
export const ICON_DIR = 'res/drawable-xxhdpi';

const PACKAGE_RE = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+)+$/;

export interface ThemeStoreResult {
  blob: Blob;
  /** Number of app PNG files written (an icon can be written under several names). */
  appFileCount: number;
  /** Apps that had no package mapping, so no PNG could be named for them. */
  unmapped: string[];
  failed: string[];
}

/** Parses "pkg.one, pkg.two" into valid, unique package/class names. */
export function parsePackageList(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/[\s,;]+/)) {
    const n = raw.trim();
    if (PACKAGE_RE.test(n) && !out.includes(n)) out.push(n);
  }
  return out;
}

/**
 * File names (without .png) an app icon is published under: the package name, plus the fully
 * qualified launcher activity when it is a different name (as in real Theme Store packs,
 * e.g. com.android.contacts.activities.TwelveKeyDialer), plus user supplied packages.
 */
export function themeFileNames(appName: string, extraPackages: string[] = []): string[] {
  const names: string[] = [];
  const add = (n: string) => PACKAGE_RE.test(n) && !names.includes(n) && names.push(n);
  for (const c of getComponentCandidates(appName)) {
    add(c.packageName);
    if (c.component && c.component !== c.packageName) add(c.component.startsWith('.') ? c.packageName + c.component : c.component);
  }
  extraPackages.forEach(add);
  return names;
}

export function buildCopyright(author: string): string {
  const who = author.replace(/[<>\r\n]/g, ' ').replace(/-{2,}/g, '-').trim();
  const lines = who
    ? [`<!-- CREATED BY ${who}-->`, `<!-- DESIGNED BY ${who}-->`, `<!-- DEVELOPED BY ${who}-->`]
    : ['<!-- CREATED WITH ICONCRAFT AI -->'];
  return `${lines.join('\n')}\n\n# If you share or use, please give credits.\n`;
}

/** Same structure as published packs: point mapping + shadow filters for icons without their own PNG. */
export function buildTransformConfig(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<IconTransform>
    <!-- Scales the base icon so it fits inside the mask frame -->
    <PointsMapping>
        <Point fromX="0.0" fromY="0.0" toX="12.0" toY="12.0"/>
        <Point fromX="0.0" fromY="90.0" toX="12.0" toY="78.0"/>
        <Point fromX="90.0" fromY="90.0" toX="78.0" toY="78.0"/>
        <Point fromX="90.0" fromY="0.0" toX="78.0" toY="12.0"/>
    </PointsMapping>

    <IconFilters>
        <Filter name="Hsl">
            <Param name="SaturationModify" value="1.0" />
            <Param name="LightnessModify" value="0.0" />
        </Filter>

        <Filter name="Levels">
            <Param name="InputMin" value="0" />
            <Param name="InputMiddle" value="0.5" />
            <Param name="InputMax" value="150" />
            <Param name="OutputMin" value="0" />
            <Param name="OutputMax" value="100" />
        </Filter>

        <!-- Shadow colour -->
        <Filter name="ColorMap">
            <Param name="Color" value="#99000000" />
        </Filter>

        <!-- Shadow falls downwards -->
        <Filter name="Offset">
            <Param name="OffsetX" value="2" />
            <Param name="OffsetY" value="5" />
        </Filter>

        <!-- Shadow softness -->
        <Filter name="GaussianBlur">
            <Param name="Radius" value="2.0" />
        </Filter>
    </IconFilters>
</IconTransform>
`;
}

async function renderIconPng(icon: GeneratedIconItem, shape: IconShape): Promise<Blob> {
  if (icon.svg) return rasterizeSvgToBlob(sanitizeSvg(icon.svg), ICON_SIZE, shape);
  if (icon.imageUrl) return rasterizeDataUrlToBlob(icon.imageUrl, ICON_SIZE, shape);
  throw new Error('No artwork');
}

/**
 * Builds the Theme Store `icons` module: a zip (shipped without extension inside the .mtz) with
 * res/drawable-xxhdpi/<package>.png (256px), icon_mask.png, folder plates, transform_config.xml
 * and Copyright.txt.
 */
export async function exportThemeStoreIcons(
  icons: GeneratedIconItem[],
  dna: StyleDNA,
  shape: IconShape,
  opts: { author: string; packageOverrides?: Record<string, string> },
  onProgress?: (percent: number, msg: string) => void,
): Promise<ThemeStoreResult> {
  const valid = icons.filter((i) => i.status === 'ready' && (i.svg || i.imageUrl));
  if (valid.length === 0) throw new Error('Tidak ada ikon yang siap diekspor. / No icons ready to export.');

  const zip = new JSZip();
  const used = new Set<string>();
  const unmapped: string[] = [];
  const failed: string[] = [];
  let appFileCount = 0;

  for (let i = 0; i < valid.length; i++) {
    const icon = valid[i];
    onProgress?.(Math.round((i / valid.length) * 90), icon.appName);
    const extras = parsePackageList(opts.packageOverrides?.[icon.appName] ?? '');
    const names = themeFileNames(icon.appName, extras).filter((n) => !used.has(n));
    if (names.length === 0) {
      if (themeFileNames(icon.appName, extras).length === 0) unmapped.push(icon.appName);
      continue;
    }
    try {
      const png = await renderIconPng(icon, shape);
      for (const n of names) {
        used.add(n);
        zip.file(`${ICON_DIR}/${n}.png`, png);
        appFileCount++;
      }
    } catch (err) {
      console.error(`Failed to render ${icon.appName}:`, err);
      failed.push(icon.appName);
    }
  }

  if (appFileCount === 0) {
    throw new Error('Tidak ada ikon yang punya nama paket. Isi nama paket di daftar. / No icon has a package name. Fill in package names in the list.');
  }

  onProgress?.(92, 'icon_mask & folder');
  zip.file(`${ICON_DIR}/icon_mask.png`, await rasterizeSvgRaw(buildMaskSvg(shape), MASK_SIZE, MASK_SIZE));
  const folder = await rasterizeSvgRaw(buildFolderSvg(dna, shape), FOLDER_SIZE, FOLDER_SIZE);
  for (const n of ['icon_folder', 'folder_bg_grid_four_reserved', 'folder_bg_grid_four_light_reserved']) {
    zip.file(`${ICON_DIR}/${n}.png`, folder);
  }
  zip.file('transform_config.xml', buildTransformConfig());
  zip.file('Copyright.txt', buildCopyright(opts.author));

  onProgress?.(97, 'ZIP');
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  return { blob, appFileCount, unmapped, failed };
}
