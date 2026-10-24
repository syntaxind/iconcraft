/**
 * Calls the Gemini REST API straight from the browser using a key the user typed in.
 * Used when the app runs on static hosting (GitHub Pages) where there is no server.
 */
import type { StyleDNA } from '../types/iconTheme';
import { ANALYZE_PROMPT, buildIconPrompt } from '../shared/prompts';
import { cleanAppName, cleanText, normalizeDna, DEFAULT_DNA } from '../shared/dna';
import { sanitizeSvg } from '../shared/svg';

export const DEFAULT_TEXT_MODEL = 'gemini-3.8-flash';
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

export class GeminiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

/** Temporary overload / rate-limit statuses worth retrying. */
const RETRYABLE = new Set([429, 500, 502, 503, 504]);
export const RETRY_DELAYS_MS = [2000, 5000, 10000];

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });

function friendlyMessage(status: number | undefined, raw: string): string {
  if (status === 503 || status === 500 || status === 502 || status === 504) {
    return 'Server Gemini sedang sibuk (sudah dicoba ulang beberapa kali). Coba lagi beberapa menit lagi, atau ganti model di tombol "Kunci AI". / Gemini is overloaded (retried several times). Try again in a few minutes, or switch the model in the "AI key" dialog.';
  }
  if (status === 429) {
    return 'Kuota/batas permintaan Gemini tercapai. Tunggu sebentar lalu coba lagi. / Gemini rate limit or quota reached. Wait a moment and try again.';
  }
  if (status === 400 || status === 403) return `${raw} (periksa API key / check your API key)`;
  return raw;
}

export const REQUEST_TIMEOUT_MS = 90_000;

export async function generate(
  apiKey: string,
  model: string,
  body: unknown,
  signal?: AbortSignal,
  delays: number[] = RETRY_DELAYS_MS,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    // Each attempt gets its own timeout so a hung connection can never freeze the UI.
    const ctl = new AbortController();
    let timedOut = false;
    const onAbort = () => ctl.abort();
    signal?.addEventListener('abort', onAbort, { once: true });
    const timer = setTimeout(() => {
      timedOut = true;
      ctl.abort();
    }, timeoutMs);

    let res: Response | undefined;
    let data: any = {};
    try {
      res = await fetch(`${ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body),
        signal: ctl.signal,
      });
      data = await res.json().catch(() => ({}));
    } catch (err) {
      if (signal?.aborted) throw err; // the user cancelled
      res = undefined;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }

    if (!res) {
      if (attempt < delays.length) {
        await sleep(delays[attempt], signal);
        continue;
      }
      throw new GeminiError(
        timedOut
          ? `Gemini tidak merespons dalam ${Math.round(timeoutMs / 1000)} detik. Coba lagi, atau ganti model. / Gemini did not respond within ${Math.round(timeoutMs / 1000)} s. Try again or switch the model.`
          : 'Tidak bisa menghubungi Gemini. Periksa koneksi internet. / Could not reach Gemini. Check your connection.',
      );
    }

    if (res.ok) {
      const text = (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('');
      if (!text) throw new GeminiError('Model tidak mengembalikan teks. / The model returned no text.');
      return text;
    }
    if (RETRYABLE.has(res.status) && attempt < delays.length) {
      await sleep(delays[attempt], signal);
      continue;
    }
    throw new GeminiError(friendlyMessage(res.status, data?.error?.message || `HTTP ${res.status}`), res.status);
  }
}

export async function analyzeStyleDirect(apiKey: string, model: string, imageDataUrl: string): Promise<StyleDNA> {
  const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(imageDataUrl);
  if (!m) throw new GeminiError('Format gambar tidak didukung. / Unsupported image format.');
  const text = await generate(apiKey, model, {
    contents: [{ parts: [{ inlineData: { mimeType: m[1], data: m[2] } }, { text: ANALYZE_PROMPT }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
  });
  const json = JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, ''));
  return normalizeDna(json, DEFAULT_DNA);
}

export async function generateSvgDirect(
  apiKey: string,
  model: string,
  appName: string,
  dna: StyleDNA,
  customPrompt: string | undefined,
  signal?: AbortSignal,
): Promise<string> {
  const prompt = buildIconPrompt(cleanAppName(appName), normalizeDna(dna), cleanText(customPrompt, 300));
  const text = await generate(apiKey, model, { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3 } }, signal);
  return sanitizeSvg(text);
}

export interface AiStatus {
  state: 'unknown' | 'ok' | 'error';
  message?: string;
}

/** Sends one tiny request to prove the key + model work. Throws GeminiError with a readable message. */
export async function testConnection(apiKey: string, model: string): Promise<{ ms: number }> {
  const started = performance.now();
  await generate(apiKey, model, { contents: [{ parts: [{ text: 'Reply with the single word OK.' }] }] }, undefined, [1500], 25_000);
  return { ms: Math.round(performance.now() - started) };
}
