import { describe, expect, it } from 'vitest';
import { DEFAULT_DNA } from '../src/shared/dna';
import { parseProjectJson, projectToJson, sanitizeProject, toSnapshot } from '../src/utils/projectStore';

const icon = (appName: string, extra: object = {}) => ({
  id: `i-${appName}`,
  appName,
  category: 'tools' as const,
  status: 'generating' as const,
  svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#123"/></svg>',
  updatedAt: 1,
  ...extra,
});
const base = () => toSnapshot({ lang: 'id', styleDNA: DEFAULT_DNA, baselineDna: DEFAULT_DNA, selectedPresetId: null, selectedApps: ['A', 'B'], referenceImage: null, icons: [icon('A'), icon('B', { svg: undefined })] });

describe('project autosave', () => {
  it('only snapshots icons that have artwork, as ready', () => {
    const s = base();
    expect(s.icons).toHaveLength(1);
    expect(s.icons[0].status).toBe('ready');
  });
  it('round-trips through JSON', () => {
    const back = parseProjectJson(projectToJson(base()));
    expect(back.selectedApps).toEqual(['A', 'B']);
    expect(back.icons[0].appName).toBe('A');
  });
  it('sanitizes hostile content', () => {
    const p = sanitizeProject({
      styleDNA: DEFAULT_DNA,
      selectedApps: ['ok', '<b>x</b>', 5, 'ok'],
      referenceImage: 'javascript:alert(1)',
      icons: [icon('X', { svg: '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><rect/></svg>', imageUrl: 'http://evil/x.png' })],
    })!;
    expect(p.referenceImage).toBeNull();
    expect(p.selectedApps.filter((a) => a === 'ok')).toHaveLength(1);
    expect(p.selectedApps).not.toContain('<b>x</b>');
    expect(p.icons[0].svg).not.toMatch(/script/i);
    expect(p.icons[0].imageUrl).toBeUndefined();
  });
  it('rejects non-projects', () => {
    expect(sanitizeProject(null)).toBeNull();
    expect(sanitizeProject({ nope: 1 })).toBeNull();
    expect(() => parseProjectJson('not json')).toThrow();
  });
});
