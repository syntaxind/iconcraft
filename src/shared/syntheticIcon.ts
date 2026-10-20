import type { StyleDNA } from '../types/iconTheme';
import { getPattern, safeColor } from './dna';
import { patternMarkup } from './pattern';
import { escapeXml } from './svg';
import { getExtraGlyph } from './extraGlyphs';

/**
 * Offline icon generator. Produces a full-bleed 512x512 SVG: the background fills
 * the whole canvas (no rounded corners, no padding) and the glyph sits inside the
 * launcher safe zone. The shape mask is applied by the app at preview/export time,
 * so switching the mask shape always works.
 */

function gradientVector(angle: string) {
  const deg = parseFloat(angle);
  const a = ((Number.isFinite(deg) ? deg : 135) * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const f = (n: number) => (n * 100).toFixed(1) + '%';
  return { x1: f(0.5 - dx / 2), y1: f(0.5 - dy / 2), x2: f(0.5 + dx / 2), y2: f(0.5 + dy / 2) };
}

export function createSyntheticIconSvg(appName: string, dna: StyleDNA): string {
  const fallbackFrom = '#1e1b4b';
  const fromColor = safeColor(dna.colors.backgroundGradient?.from ?? dna.colors.background, fallbackFrom);
  const toColor = safeColor(dna.colors.backgroundGradient?.to ?? dna.colors.secondary, '#4f46e5');
  const glyphColor = safeColor(dna.colors.glyphColor, '#ffffff');
  const accentColor = safeColor(dna.colors.accentColor, '#38bdf8');
  const finish = dna.visualDNA?.finish ?? 'flat-minimal';
  const radial = dna.colors.backgroundGradient?.type === 'radial';
  const v = gradientVector(dna.colors.backgroundGradient?.angle ?? '135deg');

  const bgDef = radial
    ? `<radialGradient id="ic-bg" cx="50%" cy="40%" r="75%"><stop offset="0%" stop-color="${fromColor}"/><stop offset="100%" stop-color="${toColor}"/></radialGradient>`
    : `<linearGradient id="ic-bg" x1="${v.x1}" y1="${v.y1}" x2="${v.x2}" y2="${v.y2}"><stop offset="0%" stop-color="${fromColor}"/><stop offset="100%" stop-color="${toColor}"/></linearGradient>`;

  let extraDefs = '';
  let overlay = '';
  let glyphFilter = '';

  switch (finish) {
    case '3d-clay':
      extraDefs = `<radialGradient id="ic-hl" cx="30%" cy="20%" r="75%"><stop offset="0%" stop-color="#fff" stop-opacity="0.38"/><stop offset="55%" stop-color="#fff" stop-opacity="0.04"/><stop offset="100%" stop-color="#000" stop-opacity="0.28"/></radialGradient>`;
      overlay = `<rect width="512" height="512" fill="url(#ic-hl)"/>`;
      break;
    case 'glassmorphism':
      extraDefs = `<linearGradient id="ic-sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fff" stop-opacity="0.32"/><stop offset="55%" stop-color="#fff" stop-opacity="0.04"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
      overlay = `<rect width="512" height="512" fill="url(#ic-sheen)"/><rect x="6" y="6" width="500" height="500" fill="none" stroke="#fff" stroke-opacity="0.25" stroke-width="3"/>`;
      break;
    case 'skeuomorphic':
      extraDefs = `<linearGradient id="ic-metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fff" stop-opacity="0.22"/><stop offset="45%" stop-color="#fff" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.3"/></linearGradient>`;
      overlay = `<rect width="512" height="512" fill="url(#ic-metal)"/>`;
      break;
    default:
      break;
  }

  if (finish === 'neon-glyph') {
    glyphFilter = `<filter id="ic-gf" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  } else if (finish !== 'flat-minimal' && finish !== 'material-you') {
    glyphFilter = `<filter id="ic-gf" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#000" flood-opacity="0.32"/></filter>`;
  }

  const glyph = getAppGlyphSvg(appName, glyphColor, accentColor);
  const pattern = patternMarkup(getPattern(dna), 512, 'ic');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>${bgDef}${extraDefs}${glyphFilter}</defs>
  <rect width="512" height="512" fill="url(#ic-bg)"/>
  ${pattern}
  ${overlay}
  <g transform="translate(106 106)"${glyphFilter ? ' filter="url(#ic-gf)"' : ''}>
    ${glyph}
  </g>
</svg>`;
}

function getAppGlyphSvg(appName: string, glyphColor: string, accentColor: string): string {
  const name = appName.toLowerCase();

  const extra = getExtraGlyph(appName, glyphColor, accentColor);
  if (extra) return extra;

  if (name.includes('whatsapp')) {
    return `<path d="M150 0 C232.8 0 300 67.2 300 150 C300 232.8 232.8 300 150 300 C115 300 83 288 58 268 L10 286 L32 242 C12 217 0 185 0 150 C0 67.2 67.2 0 150 0 Z" fill="${glyphColor}"/>
            <path d="M110 90 C105 90 98 92 95 96 C88 107 82 130 98 164 C114 198 143 218 174 221 C198 223 210 208 210 198 C210 191 193 182 183 178 C173 174 169 176 164 182 C158 189 153 192 146 189 C135 184 115 163 111 149 C108 142 113 138 117 132 C121 127 119 122 116 113 C113 105 108 90 110 90 Z" fill="${accentColor}"/>`;
  }
  if (name.includes('camera')) {
    return `<rect x="20" y="50" width="260" height="200" rx="36" fill="${glyphColor}"/>
            <circle cx="150" cy="150" r="64" fill="${accentColor}"/>
            <circle cx="150" cy="150" r="36" fill="${glyphColor}"/>
            <circle cx="230" cy="88" r="14" fill="#ffffff" fill-opacity="0.7"/>
            <path d="M90 50 L110 20 L190 20 L210 50 Z" fill="${glyphColor}"/>`;
  }
  if (name.includes('phone') || name.includes('telepon')) {
    return `<path d="M70 40 C60 40 50 48 45 60 C32 90 35 150 90 205 C145 260 205 263 235 250 C247 245 255 235 255 225 L235 175 C230 165 218 160 208 165 L180 180 C155 165 130 140 115 115 L130 87 C135 77 130 65 120 60 Z" fill="${glyphColor}"/>`;
  }
  if (name.includes('messages') || name.includes('pesan') || name.includes('chat')) {
    return `<rect x="25" y="40" width="250" height="190" rx="40" fill="${glyphColor}"/>
            <polygon points="60,230 40,270 100,230" fill="${glyphColor}"/>
            <circle cx="95" cy="135" r="14" fill="${accentColor}"/>
            <circle cx="150" cy="135" r="14" fill="${accentColor}"/>
            <circle cx="205" cy="135" r="14" fill="${accentColor}"/>`;
  }
  if (name.includes('settings') || name.includes('pengaturan')) {
    return `<path d="M150 60 C100 60 60 100 60 150 C60 200 100 240 150 240 C200 240 240 200 240 150 C240 100 200 60 150 60 Z" fill="${glyphColor}"/>
            <circle cx="150" cy="150" r="42" fill="${accentColor}"/>
            <!-- Cog Teeth -->
            <rect x="135" y="20" width="30" height="40" rx="8" fill="${glyphColor}"/>
            <rect x="135" y="240" width="30" height="40" rx="8" fill="${glyphColor}"/>
            <rect x="20" y="135" width="40" height="30" rx="8" fill="${glyphColor}"/>
            <rect x="240" y="135" width="40" height="30" rx="8" fill="${glyphColor}"/>`;
  }
  if (name.includes('youtube')) {
    return `<rect x="25" y="55" width="250" height="180" rx="48" fill="${glyphColor}"/>
            <polygon points="125,105 200,145 125,185" fill="${accentColor}"/>`;
  }
  if (name.includes('spotify') || name.includes('music')) {
    return `<circle cx="150" cy="150" r="120" fill="${glyphColor}"/>
            <path d="M75 110 C125 95 195 105 225 120" stroke="${accentColor}" stroke-width="20" stroke-linecap="round" fill="none"/>
            <path d="M85 150 C130 138 185 146 215 160" stroke="${accentColor}" stroke-width="16" stroke-linecap="round" fill="none"/>
            <path d="M95 190 C135 180 175 185 205 198" stroke="${accentColor}" stroke-width="12" stroke-linecap="round" fill="none"/>`;
  }
  if (name.includes('instagram')) {
    return `<rect x="35" y="35" width="230" height="230" rx="58" fill="none" stroke="${glyphColor}" stroke-width="26"/>
            <circle cx="150" cy="150" r="54" fill="none" stroke="${glyphColor}" stroke-width="24"/>
            <circle cx="215" cy="85" r="14" fill="${glyphColor}"/>`;
  }
  if (name.includes('gallery') || name.includes('photos') || name.includes('galeri')) {
    return `<rect x="35" y="45" width="230" height="190" rx="36" fill="${glyphColor}"/>
            <circle cx="95" cy="100" r="22" fill="${accentColor}"/>
            <polygon points="50,215 120,135 170,185 210,145 250,215" fill="${accentColor}"/>`;
  }
  if (name.includes('chrome') || name.includes('browser')) {
    return `<circle cx="150" cy="150" r="115" fill="none" stroke="${glyphColor}" stroke-width="26"/>
            <circle cx="150" cy="150" r="48" fill="${glyphColor}"/>
            <line x1="150" y1="35" x2="225" y2="105" stroke="${accentColor}" stroke-width="20" stroke-linecap="round"/>
            <line x1="250" y1="205" x2="160" y2="260" stroke="${accentColor}" stroke-width="20" stroke-linecap="round"/>
            <line x1="45" y1="210" x2="65" y2="105" stroke="${accentColor}" stroke-width="20" stroke-linecap="round"/>`;
  }
  if (name.includes('clock') || name.includes('jam')) {
    return `<circle cx="150" cy="150" r="120" fill="none" stroke="${glyphColor}" stroke-width="24"/>
            <circle cx="150" cy="150" r="14" fill="${glyphColor}"/>
            <line x1="150" y1="150" x2="150" y2="80" stroke="${glyphColor}" stroke-width="16" stroke-linecap="round"/>
            <line x1="150" y1="150" x2="200" y2="150" stroke="${accentColor}" stroke-width="16" stroke-linecap="round"/>`;
  }
  if (name.includes('files') || name.includes('berkas')) {
    return `<path d="M40 70 C40 55 52 45 66 45 L120 45 L150 75 L234 75 C248 75 260 85 260 100 L260 220 C260 235 248 245 234 245 L66 245 C52 245 40 235 40 220 Z" fill="${glyphColor}"/>
            <path d="M40 110 L260 110 L260 220 C260 235 248 245 234 245 L66 245 C52 245 40 235 40 220 Z" fill="${accentColor}" fill-opacity="0.3"/>`;
  }
  if (name.includes('mail') || name.includes('gmail')) {
    return `<rect x="30" y="55" width="240" height="180" rx="30" fill="${glyphColor}"/>
            <polygon points="30,70 150,155 270,70" fill="${accentColor}"/>`;
  }
  if (name.includes('calendar') || name.includes('kalender')) {
    return `<rect x="35" y="60" width="230" height="195" rx="32" fill="${glyphColor}"/>
            <rect x="35" y="60" width="230" height="55" rx="16" fill="${accentColor}"/>
            <line x1="85" y1="35" x2="85" y2="75" stroke="${glyphColor}" stroke-width="16" stroke-linecap="round"/>
            <line x1="215" y1="35" x2="215" y2="75" stroke="${glyphColor}" stroke-width="16" stroke-linecap="round"/>
            <circle cx="95" cy="155" r="12" fill="${accentColor}"/>
            <circle cx="150" cy="155" r="12" fill="${accentColor}"/>
            <circle cx="205" cy="155" r="12" fill="${accentColor}"/>`;
  }
  if (name.includes('calculator') || name.includes('kalkulator')) {
    return `<rect x="45" y="40" width="210" height="230" rx="36" fill="${glyphColor}"/>
            <rect x="70" y="65" width="160" height="50" rx="12" fill="${accentColor}"/>
            <circle cx="95" cy="150" r="14" fill="${accentColor}"/>
            <circle cx="150" cy="150" r="14" fill="${accentColor}"/>
            <circle cx="205" cy="150" r="14" fill="${accentColor}"/>
            <circle cx="95" cy="210" r="14" fill="${accentColor}"/>
            <circle cx="150" cy="210" r="14" fill="${accentColor}"/>
            <circle cx="205" cy="210" r="14" fill="${accentColor}"/>`;
  }

  // Generic fallback stylized monogram glyph
  const letter = escapeXml(Array.from(appName.trim())[0]?.toUpperCase() ?? '?');
  return `<circle cx="150" cy="150" r="115" fill="none" stroke="${glyphColor}" stroke-width="20"/>
          <text x="150" y="195" font-family="system-ui, sans-serif" font-size="130" font-weight="900" fill="${glyphColor}" text-anchor="middle">${letter}</text>`;
}
