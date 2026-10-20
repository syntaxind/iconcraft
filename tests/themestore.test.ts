import { describe, expect, it } from 'vitest';
import { DEFAULT_DNA, normalizeDna, renderSignature } from '../src/shared/dna';
import { patternMarkup } from '../src/shared/pattern';
import { remapSvgColors } from '../src/shared/remap';
import { createSyntheticIconSvg } from '../src/shared/syntheticIcon';
import { buildFolderSvg, buildMaskSvg } from '../src/shared/themeAssets';
import { buildCopyright, buildTransformConfig, parsePackageList, themeFileNames } from '../src/utils/themeStoreExport';
import { parsePresetsJson, presetsToJson } from '../src/utils/dnaPresets';
import { PATTERN_TYPES } from '../src/shared/dna';

const withPattern = (type: any) => normalizeDna({ ...DEFAULT_DNA, pattern: { type, color: '#ff8800', opacity: 0.3, scale: 1 } });

describe('pattern', () => {
  it('draws every pattern type except none, deterministically', () => {
    for (const type of PATTERN_TYPES) {
      const a = patternMarkup({ type, color: '#fff', opacity: 0.2, scale: 1 });
      const b = patternMarkup({ type, color: '#fff', opacity: 0.2, scale: 1 });
      expect(a).toBe(b);
      expect(type === 'none' ? a === '' : a.length > 50).toBe(true);
    }
  });
  it('is part of the generated icon and of the render signature', () => {
    const svg = createSyntheticIconSvg('Camera', withPattern('constellation'));
    expect(svg).toContain('opacity="0.3"');
    expect(renderSignature(withPattern('dots'))).not.toBe(renderSignature(withPattern('grid')));
  });
  it('rejects unsafe colours', () => {
    const dna = normalizeDna({ pattern: { type: 'dots', color: '"/><script>', opacity: 9, scale: 99 } });
    expect(dna.pattern!.color).not.toContain('<');
    expect(dna.pattern!.opacity).toBe(1);
    expect(dna.pattern!.scale).toBe(3);
  });
});

describe('remapSvgColors', () => {
  it('swaps colours in a single pass without chaining', () => {
    const from = normalizeDna({ colors: { glyphColor: '#111111', accentColor: '#222222' } });
    const to = normalizeDna({ colors: { glyphColor: '#222222', accentColor: '#333333' } });
    const out = remapSvgColors('<path fill="#111111"/><path fill="#222222"/>', from, to);
    expect(out).toBe('<path fill="#222222"/><path fill="#333333"/>');
  });
  it('does not touch longer hex values sharing a prefix', () => {
    const from = normalizeDna({ colors: { glyphColor: '#fff' } });
    const to = normalizeDna({ colors: { glyphColor: '#000' } });
    expect(remapSvgColors('<a fill="#fff"/><b fill="#ffffff"/>', from, to)).toBe('<a fill="#000"/><b fill="#ffffff"/>');
  });
});

describe('theme store assets', () => {
  it('builds mask and folder svgs', () => {
    expect(buildMaskSvg('squircle')).toContain('viewBox="0 0 180 180"');
    expect(buildFolderSvg(withPattern('halftone'), 'circle')).toContain('width="434"');
  });
  it('names files by package and fully qualified activity', () => {
    const names = themeFileNames('Phone');
    expect(names.length).toBeGreaterThan(0);
    expect(new Set(names).size).toBe(names.length);
    expect(names.every((n) => /^[a-zA-Z][\w]*(\.\w+)+$/.test(n))).toBe(true);
  });
  it('returns nothing for unknown apps but accepts user packages', () => {
    expect(themeFileNames('Totally Unknown App')).toEqual([]);
    expect(themeFileNames('Totally Unknown App', ['com.example.app'])).toEqual(['com.example.app']);
  });
  it('parses package lists safely', () => {
    expect(parsePackageList('com.a.b, com.c.d; bad name, ../x')).toEqual(['com.a.b', 'com.c.d']);
  });
  it('emits valid config and a safe copyright', () => {
    expect(buildTransformConfig()).toContain('<IconTransform>');
    expect(buildCopyright('A--B <x>')).not.toMatch(/--B|<x>/);
    expect(buildCopyright('')).toContain('ICONCRAFT');
  });
});

describe('dna presets json', () => {
  it('round-trips and accepts a bare style_dna.json', () => {
    const list = parsePresetsJson(JSON.stringify(DEFAULT_DNA));
    expect(list).toHaveLength(1);
    const again = parsePresetsJson(presetsToJson(list));
    expect(again[0].dna.styleName).toBe(DEFAULT_DNA.styleName);
    expect(() => parsePresetsJson('{"nope":1}')).toThrow();
    expect(() => parsePresetsJson('not json')).toThrow();
  });
});
