import type { GeneratedIconItem, StyleDNA } from '../types/iconTheme';
import { categorizeApp, cleanAppName, cleanText, normalizeDna } from '../shared/dna';
import { sanitizeSvg } from '../shared/svg';

/**
 * Autosave of the whole working session (icons, DNA, app list, reference image) so a mobile
 * browser discarding the tab, or the app being closed, never loses work. Stored in IndexedDB.
 */

const DB_NAME = 'iconcraft';
const STORE = 'kv';
const KEY = 'project';
export const MAX_APPS = 300;
const MAX_REFERENCE_CHARS = 2_000_000;
export const MAX_PROJECT_FILE_BYTES = 25_000_000;

export interface ProjectData {
  version: 1;
  savedAt: number;
  lang: 'id' | 'en';
  styleDNA: StyleDNA;
  baselineDna: StyleDNA;
  selectedPresetId: string | null;
  selectedApps: string[];
  referenceImage: string | null;
  icons: GeneratedIconItem[];
}

const CATEGORIES = ['social', 'system', 'media', 'tools', 'finance', 'other'] as const;
const IMAGE_URL_RE = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

/** Coerces untrusted stored/imported data into a valid project, or null if unusable. */
export function sanitizeProject(raw: unknown): ProjectData | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, any>;
  if (!r.styleDNA || typeof r.styleDNA !== 'object') return null;

  const styleDNA = normalizeDna(r.styleDNA);
  const baselineDna = r.baselineDna ? normalizeDna(r.baselineDna) : styleDNA;

  const selectedApps = Array.from(
    new Set((Array.isArray(r.selectedApps) ? r.selectedApps : []).map((a: unknown) => cleanAppName(a)).filter(Boolean)),
  ).slice(0, MAX_APPS) as string[];

  const icons: GeneratedIconItem[] = [];
  for (const it of Array.isArray(r.icons) ? r.icons.slice(0, MAX_APPS) : []) {
    if (!it || typeof it !== 'object') continue;
    const appName = cleanAppName(it.appName);
    const svg = typeof it.svg === 'string' && it.svg ? sanitizeSvg(it.svg) : undefined;
    const imageUrl = typeof it.imageUrl === 'string' && IMAGE_URL_RE.test(it.imageUrl) ? it.imageUrl : undefined;
    if (!appName || (!svg && !imageUrl)) continue;
    icons.push({
      id: cleanText(it.id, 80) || `icon-${appName}-${Math.random().toString(36).slice(2, 8)}`,
      appName,
      category: (CATEGORIES as readonly string[]).includes(it.category) ? it.category : categorizeApp(appName),
      status: 'ready',
      svg,
      imageUrl,
      source: it.source === 'ai' ? 'ai' : 'offline',
      dnaSnap: it.dnaSnap ? normalizeDna(it.dnaSnap) : undefined,
      updatedAt: typeof it.updatedAt === 'number' ? it.updatedAt : Date.now(),
    });
  }

  const reference = typeof r.referenceImage === 'string' && IMAGE_URL_RE.test(r.referenceImage) && r.referenceImage.length <= MAX_REFERENCE_CHARS ? r.referenceImage : null;

  return {
    version: 1,
    savedAt: typeof r.savedAt === 'number' ? r.savedAt : Date.now(),
    lang: r.lang === 'en' ? 'en' : 'id',
    styleDNA,
    baselineDna,
    selectedPresetId: typeof r.selectedPresetId === 'string' ? cleanText(r.selectedPresetId, 80) : null,
    selectedApps,
    referenceImage: reference,
    icons,
  };
}

/** Snapshot to persist: only icons that have artwork, never half-finished states. */
export function toSnapshot(p: Omit<ProjectData, 'version' | 'savedAt'>): ProjectData {
  return {
    ...p,
    version: 1,
    savedAt: Date.now(),
    referenceImage: p.referenceImage && p.referenceImage.length <= MAX_REFERENCE_CHARS ? p.referenceImage : null,
    icons: p.icons.filter((i) => i.svg || i.imageUrl).map((i) => ({ ...i, status: 'ready' as const })),
  };
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB error'));
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = run(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB error'));
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB aborted'));
    });
  } finally {
    db.close();
  }
}

export async function saveProject(data: ProjectData): Promise<void> {
  await withStore('readwrite', (s) => s.put(data, KEY));
}

export async function loadProject(): Promise<ProjectData | null> {
  try {
    return sanitizeProject(await withStore('readonly', (s) => s.get(KEY)));
  } catch {
    return null;
  }
}

export async function clearProject(): Promise<void> {
  try {
    await withStore('readwrite', (s) => s.delete(KEY));
  } catch {
    /* ignore */
  }
}

export function projectToJson(p: ProjectData): string {
  return JSON.stringify({ app: 'iconcraft-ai', ...p });
}

export function parseProjectJson(text: string): ProjectData {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Berkas bukan JSON yang valid. / Not a valid JSON file.');
  }
  const project = sanitizeProject(data);
  if (!project) throw new Error('Bukan berkas proyek IconCraft. / Not an IconCraft project file.');
  return project;
}
