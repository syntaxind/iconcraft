export type IconShape = 'squircle' | 'circle' | 'rounded-rect' | 'teardrop' | 'hexagon';

export type PatternType = 'none' | 'dots' | 'halftone' | 'grid' | 'lines' | 'diagonal' | 'hex' | 'constellation';

/** Texture drawn on the icon background (and reused for folder assets). */
export interface PatternSpec {
  type: PatternType;
  color: string;
  /** 0..1 */
  opacity: number;
  /** 0.5..3, multiplier of the base cell size */
  scale: number;
}

export interface StyleDNA {
  styleName: string;
  summary: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    backgroundGradient: {
      type: 'linear' | 'radial';
      from: string;
      to: string;
      angle: string;
    };
    glyphColor: string;
    accentColor: string;
    shadowColor: string;
  };
  visualDNA: {
    finish: '3d-clay' | 'glassmorphism' | 'flat-minimal' | 'neumorphism' | 'neon-glyph' | 'retro-pixel' | 'skeuomorphic' | 'material-you' | 'gradient-duotone';
    shapeCurvature: IconShape;
    lighting: string;
    strokeWeight: 'none' | 'thin' | 'medium' | 'bold';
    elevation: 'flat' | 'subtle-float' | 'deep-3d' | 'pressed-inset';
    borderEffect: 'none' | 'frosted-rim' | 'neon-stroke' | 'inner-bevel' | 'soft-ring';
    surfaceTexture: string;
  };
  /** Background texture. Optional for backwards compatibility; use `getPattern(dna)`. */
  pattern?: PatternSpec;
  replicationRules: string;
  defaultIconTags?: string[];
}

export interface GeneratedIconItem {
  id: string;
  appName: string;
  packageName?: string;
  componentName?: string;
  category: 'social' | 'system' | 'media' | 'tools' | 'finance' | 'other';
  status: 'pending' | 'generating' | 'ready' | 'error';
  svg?: string;
  imageUrl?: string;
  /** 'ai' = produced by Gemini, 'offline' = built-in generator (API unavailable or failed). */
  source?: 'ai' | 'offline';
  error?: string;
  /** Why this icon fell back to the offline generator (shown as a tooltip). */
  note?: string;
  /** The Style DNA this artwork was made with; used to detect icons that are out of date. */
  dnaSnap?: StyleDNA;
  updatedAt: number;
}

export interface PresetStyle {
  id: string;
  name: string;
  category: string;
  previewSvg: string;
  dna: StyleDNA;
}
