import type { StyleDNA } from '../types/iconTheme';
import { cleanText, normalizeDna } from '../shared/dna';

const KEY = 'iconcraft.dnaPresets';
const MAX_PRESETS = 50;

export interface SavedPreset {
  id: string;
  name: string;
  savedAt: number;
  dna: StyleDNA;
}

const newId = () => `dna-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

function sanitizeList(raw: unknown): SavedPreset[] {
  if (!Array.isArray(raw)) return [];
  const out: SavedPreset[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const dna = normalizeDna(r.dna);
    out.push({
      id: typeof r.id === 'string' && r.id ? cleanText(r.id, 60) : newId(),
      name: cleanText(r.name, 60) || dna.styleName,
      savedAt: typeof r.savedAt === 'number' ? r.savedAt : Date.now(),
      dna,
    });
  }
  return out.slice(0, MAX_PRESETS);
}

export function loadSavedPresets(): SavedPreset[] {
  try {
    return sanitizeList(JSON.parse(localStorage.getItem(KEY) || '[]'));
  } catch {
    return [];
  }
}

function persist(list: SavedPreset[]): SavedPreset[] {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* private mode / quota: keep working in memory */
  }
  return list;
}

/** Saves (or overwrites by name) a preset and returns the new list, newest first. */
export function savePreset(list: SavedPreset[], name: string, dna: StyleDNA): SavedPreset[] {
  const clean = cleanText(name, 60) || dna.styleName;
  const rest = list.filter((p) => p.name.toLowerCase() !== clean.toLowerCase());
  return persist([{ id: newId(), name: clean, savedAt: Date.now(), dna: normalizeDna(dna) }, ...rest].slice(0, MAX_PRESETS));
}

export function deletePreset(list: SavedPreset[], id: string): SavedPreset[] {
  return persist(list.filter((p) => p.id !== id));
}

export function replacePresets(list: SavedPreset[]): SavedPreset[] {
  return persist(list.slice(0, MAX_PRESETS));
}

export function presetsToJson(list: SavedPreset[]): string {
  return JSON.stringify({ app: 'iconcraft-ai', version: 1, presets: list }, null, 2);
}

/**
 * Accepts our own export ({ presets: [...] }), a bare array, or a single Style DNA
 * (e.g. the style_dna.json that icon pack exports contain). Throws on unusable input.
 */
export function parsePresetsJson(text: string): SavedPreset[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Berkas bukan JSON yang valid. / Not a valid JSON file.');
  }
  const obj = data as Record<string, unknown> | null;
  let list: SavedPreset[] = [];
  if (Array.isArray(data)) list = sanitizeList(data);
  else if (obj && Array.isArray(obj.presets)) list = sanitizeList(obj.presets);
  else if (obj && typeof obj === 'object' && obj.colors && typeof obj.colors === 'object') {
    const dna = normalizeDna(obj);
    list = [{ id: newId(), name: dna.styleName, savedAt: Date.now(), dna }];
  }
  if (list.length === 0) throw new Error('Tidak ada preset DNA di berkas ini. / No DNA preset found in this file.');
  return list;
}

/** Merges imported presets into the current list (imported names win), newest first. */
export function mergePresets(current: SavedPreset[], incoming: SavedPreset[]): SavedPreset[] {
  const names = new Set(incoming.map((p) => p.name.toLowerCase()));
  return replacePresets([...incoming, ...current.filter((p) => !names.has(p.name.toLowerCase()))]);
}
