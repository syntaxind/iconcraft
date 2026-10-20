import { describe, expect, it } from 'vitest';
import { buildAppFilterXml, buildDrawableNames, buildDrawableXml } from '../src/utils/androidExport';
import { getComponentCandidates } from '../src/utils/presets';

describe('buildDrawableNames', () => {
  it('creates valid, unique android resource names', () => {
    expect(buildDrawableNames(['Mi Browser', 'Mi-Browser', '9GAG', 'WhatsApp', '日本'])).toEqual([
      'mi_browser',
      'mi_browser_2',
      'app_9gag',
      'whatsapp',
      'icon',
    ]);
  });
});

describe('appfilter', () => {
  it('emits ComponentInfo items and escapes content', () => {
    const xml = buildAppFilterXml(
      [{ drawable: 'whatsapp', appName: 'Whats<App>--', component: 'com.whatsapp/com.whatsapp.HomeActivity' }],
      'My "Style"',
    );
    expect(xml).toContain('<item component="ComponentInfo{com.whatsapp/com.whatsapp.HomeActivity}" drawable="whatsapp" />');
    expect(xml).not.toContain('Whats<App>');
    expect(xml).not.toMatch(/<!--[^>]*--[^>]/);
  });

  it('lists drawables in drawable.xml', () => {
    expect(buildDrawableXml(['a', 'b'])).toContain('<item drawable="b" />');
  });

  it('knows stock and Xiaomi components', () => {
    expect(getComponentCandidates('camera').length).toBeGreaterThanOrEqual(2);
    expect(getComponentCandidates('Totally Unknown App')).toEqual([]);
  });
});
