import type { IconShape, PatternSpec, PatternType, StyleDNA } from '../types/iconTheme';

const FINISHES = [
  '3d-clay',
  'glassmorphism',
  'flat-minimal',
  'neumorphism',
  'neon-glyph',
  'retro-pixel',
  'skeuomorphic',
  'material-you',
  'gradient-duotone',
] as const;
const SHAPES: IconShape[] = ['squircle', 'circle', 'rounded-rect', 'teardrop', 'hexagon'];
const STROKES = ['none', 'thin', 'medium', 'bold'] as const;
const ELEVATIONS = ['flat', 'subtle-float', 'deep-3d', 'pressed-inset'] as const;
const BORDERS = ['none', 'frosted-rim', 'neon-stroke', 'inner-bevel', 'soft-ring'] as const;

export const PATTERN_TYPES: PatternType[] = ['none', 'dots', 'halftone', 'grid', 'lines', 'diagonal', 'hex', 'constellation'];
export const DEFAULT_PATTERN: PatternSpec = { type: 'none', color: '#ffffff', opacity: 0.18, scale: 1 };

const COLOR_RE = /^(#[0-9a-f]{3,8}|(?:rgb|hsl)a?\(\s*[0-9.,%\s/-]+\)|[a-z]{3,20})$/i;

/** Accepts only plain CSS colours so DNA values can be safely put in SVG attributes. */
export function safeColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && COLOR_RE.test(value.trim()) ? value.trim() : fallback;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function clampNum(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/** Always returns a complete pattern spec, even for DNA saved before patterns existed. */
export function getPattern(dna: Pick<StyleDNA, 'pattern'>): PatternSpec {
  return dna.pattern ?? DEFAULT_PATTERN;
}

function text(value: unknown, fallback: string, max = 600): string {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : fallback;
}

export const DEFAULT_DNA: StyleDNA = {
  styleName: 'Custom Style',
  summary: '',
  colors: {
    primary: '#6366f1',
    secondary: '#a855f7',
    background: '#1e1b4b',
    backgroundGradient: { type: 'linear', from: '#4f46e5', to: '#7c3aed', angle: '135deg' },
    glyphColor: '#ffffff',
    accentColor: '#38bdf8',
    shadowColor: 'rgba(0,0,0,0.35)',
  },
  visualDNA: {
    finish: 'flat-minimal',
    shapeCurvature: 'squircle',
    lighting: 'Soft diffuse top-left light',
    strokeWeight: 'none',
    elevation: 'subtle-float',
    borderEffect: 'none',
    surfaceTexture: 'smooth-glossy',
  },
  pattern: DEFAULT_PATTERN,
  replicationRules: '',
  defaultIconTags: [],
};

function normalizePattern(raw: unknown, base: PatternSpec): PatternSpec {
  const p = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>;
  return {
    type: oneOf(p.type, PATTERN_TYPES, base.type),
    color: safeColor(p.color, base.color),
    opacity: clampNum(p.opacity, 0, 1, base.opacity),
    scale: clampNum(p.scale, 0.5, 3, base.scale),
  };
}

/**
 * Signature of everything that changes how an icon *looks* (not shape, name or AI rules).
 * Used to tell whether existing icons are out of date compared to the current DNA.
 */
export function renderSignature(dna: StyleDNA): string {
  const { shapeCurvature: _shape, lighting: _l, surfaceTexture: _s, ...visual } = dna.visualDNA;
  return JSON.stringify({ colors: dna.colors, visual, pattern: getPattern(dna) });
}

/** Coerces untrusted (AI or user supplied) data into a complete, valid StyleDNA. */
export function normalizeDna(raw: unknown, base: StyleDNA = DEFAULT_DNA): StyleDNA {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>;
  const c = (r.colors && typeof r.colors === 'object' ? r.colors : {}) as Record<string, any>;
  const g = (c.backgroundGradient && typeof c.backgroundGradient === 'object' ? c.backgroundGradient : {}) as Record<string, any>;
  const v = (r.visualDNA && typeof r.visualDNA === 'object' ? r.visualDNA : {}) as Record<string, any>;

  const angle = typeof g.angle === 'string' && /^-?\d{1,3}(\.\d+)?deg$/.test(g.angle.trim()) ? g.angle.trim() : base.colors.backgroundGradient.angle;

  return {
    styleName: text(r.styleName, base.styleName, 80),
    summary: text(r.summary, base.summary, 400),
    colors: {
      primary: safeColor(c.primary, base.colors.primary),
      secondary: safeColor(c.secondary, base.colors.secondary),
      background: safeColor(c.background, base.colors.background),
      backgroundGradient: {
        type: g.type === 'radial' ? 'radial' : 'linear',
        from: safeColor(g.from, safeColor(c.background, base.colors.backgroundGradient.from)),
        to: safeColor(g.to, safeColor(c.secondary, base.colors.backgroundGradient.to)),
        angle,
      },
      glyphColor: safeColor(c.glyphColor, base.colors.glyphColor),
      accentColor: safeColor(c.accentColor, base.colors.accentColor),
      shadowColor: safeColor(c.shadowColor, base.colors.shadowColor),
    },
    visualDNA: {
      finish: oneOf(v.finish, FINISHES, base.visualDNA.finish),
      shapeCurvature: oneOf(v.shapeCurvature, SHAPES, base.visualDNA.shapeCurvature),
      lighting: text(v.lighting, base.visualDNA.lighting, 200),
      strokeWeight: oneOf(v.strokeWeight, STROKES, base.visualDNA.strokeWeight),
      elevation: oneOf(v.elevation, ELEVATIONS, base.visualDNA.elevation),
      borderEffect: oneOf(v.borderEffect, BORDERS, base.visualDNA.borderEffect),
      surfaceTexture: text(v.surfaceTexture, base.visualDNA.surfaceTexture, 60),
    },
    pattern: normalizePattern(r.pattern, getPattern(base)),
    replicationRules: text(r.replicationRules, base.replicationRules, 1500),
    defaultIconTags: Array.isArray(r.defaultIconTags)
      ? r.defaultIconTags
          .filter((t: unknown): t is string => typeof t === 'string')
          .map((t) => cleanAppName(t))
          .filter(Boolean)
          .slice(0, 24)
      : base.defaultIconTags ?? [],
  };
}

/** Single-line, length-limited free text; safe to embed in prompts. */
export function cleanText(value: unknown, max: number): string {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f<>`"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** Short app label (max 40 chars). */
export function cleanAppName(value: unknown): string {
  return cleanText(value, 40);
}

export type AppCategory = 'social' | 'system' | 'media' | 'tools' | 'finance' | 'other';

export function categorizeApp(appName: string): AppCategory {
  const n = appName.toLowerCase();
  if (/(whatsapp|instagram|telegram|tiktok|discord|facebook|twitter|^x\b|line|messenger)/.test(n)) return 'social';
  if (/(phone|telepon|messages|pesan|settings|pengaturan|camera|kamera|gallery|galeri|contacts|kontak|clock|jam)/.test(n)) return 'system';
  if (/(youtube|spotify|netflix|music|video|podcast|twitch)/.test(n)) return 'media';
  if (/(bank|bca|bri|mandiri|bni|gopay|ovo|dana|shopee|tokopedia|wallet|pay)/.test(n)) return 'finance';
  return 'tools';
}
