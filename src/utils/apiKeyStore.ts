const KEY = 'iconcraft.geminiKey';
const MODEL = 'iconcraft.geminiModel';

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

/** Key lives only in this browser (localStorage) or, if the user opts out, in memory for the session. */
export const loadApiKey = (): string => safe(() => localStorage.getItem(KEY) ?? '', '');
export const saveApiKey = (key: string) => safe(() => localStorage.setItem(KEY, key), undefined);
export const clearApiKey = () => safe(() => localStorage.removeItem(KEY), undefined);
export const loadModel = (): string => safe(() => localStorage.getItem(MODEL) ?? '', '');
export const saveModel = (model: string) => safe(() => (model ? localStorage.setItem(MODEL, model) : localStorage.removeItem(MODEL)), undefined);
