import express from 'express';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { cleanAppName, cleanText, normalizeDna, DEFAULT_DNA } from './src/shared/dna';
import { sanitizeSvg } from './src/shared/svg';
import { ANALYZE_PROMPT, buildIconPrompt } from './src/shared/prompts';
import { createSyntheticIconSvg } from './src/shared/syntheticIcon';

dotenv.config({ path: ['.env.local', '.env'], quiet: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-3.8-flash';
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-lite-image';
const RATE_LIMIT_PER_MIN = Number(process.env.RATE_LIMIT_PER_MIN) || 30;

const app = express();
app.disable('x-powered-by');
// The client downsizes reference images to <= 1024px, so a small body limit is plenty.
app.use(express.json({ limit: '8mb' }));

app.use(
  '/api',
  rateLimit({
    windowMs: 60_000,
    limit: RATE_LIMIT_PER_MIN,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Terlalu banyak permintaan. Coba lagi sebentar lagi. / Too many requests, please slow down.' },
  }),
);

// ---------------------------------------------------------------------------
// Gemini helpers
// ---------------------------------------------------------------------------

class ApiKeyMissingError extends Error {
  constructor() {
    super('GEMINI_API_KEY belum diatur. / GEMINI_API_KEY is not configured.');
  }
}

let cachedClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') throw new ApiKeyMissingError();
  cachedClient ??= new GoogleGenAI({ apiKey });
  return cachedClient;
}

/** Parses JSON that may be wrapped in a markdown code fence. */
function parseJsonLoose(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();
  return JSON.parse(cleaned || '{}');
}

const publicError = (err: unknown) => (err instanceof Error ? err.message : 'Unexpected error');

function parseDataUrl(value: unknown): { data: string; mimeType: string } | null {
  if (typeof value !== 'string') return null;
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(value.trim());
  return match ? { mimeType: match[1], data: match[2] } : null;
}

// ---------------------------------------------------------------------------
// 1. Analyze icon "Style DNA" from a reference image
// ---------------------------------------------------------------------------

app.post('/api/analyze-icon-style', async (req, res) => {
  const image = parseDataUrl(req.body?.imageBase64);
  if (!image) {
    return res.status(400).json({ error: 'imageBase64 harus berupa data URL PNG/JPEG/WebP. / imageBase64 must be a PNG/JPEG/WebP data URL.' });
  }

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: { parts: [{ inlineData: image }, { text: ANALYZE_PROMPT }] },
      config: { responseMimeType: 'application/json', temperature: 0.2 },
    });

    const dna = normalizeDna(parseJsonLoose(response.text ?? '{}'), DEFAULT_DNA);
    res.json({ success: true, data: dna });
  } catch (error) {
    console.error('analyze-icon-style failed:', error);
    const status = error instanceof ApiKeyMissingError ? 503 : 502;
    res.status(status).json({ error: publicError(error), code: error instanceof ApiKeyMissingError ? 'NO_API_KEY' : 'UPSTREAM_ERROR' });
  }
});

// ---------------------------------------------------------------------------
// 2. Generate one themed icon as SVG (falls back to the offline generator)
// ---------------------------------------------------------------------------

app.post('/api/generate-icon-svg', async (req, res) => {
  const appName = cleanAppName(req.body?.appName);
  if (!appName || !req.body?.styleDNA) {
    return res.status(400).json({ error: 'appName dan styleDNA wajib diisi. / appName and styleDNA are required.' });
  }
  const dna = normalizeDna(req.body.styleDNA);
  const customPrompt = cleanText(req.body?.customPrompt, 300);

  const offline = (reason: string) =>
    res.json({ success: true, appName, svg: createSyntheticIconSvg(appName, dna), isFallback: true, fallbackReason: reason });

  let ai: GoogleGenAI;
  try {
    ai = getGeminiClient();
  } catch {
    return offline('NO_API_KEY');
  }

  try {
    const prompt = buildIconPrompt(appName, dna, customPrompt);

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: { temperature: 0.3 },
    });

    const svg = sanitizeSvg(response.text ?? '');
    res.json({ success: true, appName, svg, isFallback: false });
  } catch (error) {
    console.warn(`Gemini generation failed for "${appName}":`, publicError(error));
    offline('UPSTREAM_ERROR');
  }
});

// ---------------------------------------------------------------------------
// 3. Batch creative-direction plan (optional helper, not used by the UI yet)
// ---------------------------------------------------------------------------

app.post('/api/batch-plan-icons', async (req, res) => {
  const appList: string[] = Array.isArray(req.body?.appList) ? req.body.appList.map(cleanAppName).filter(Boolean).slice(0, 60) : [];
  if (appList.length === 0 || !req.body?.styleDNA) {
    return res.status(400).json({ error: 'appList dan styleDNA wajib diisi. / appList and styleDNA are required.' });
  }
  const dna = normalizeDna(req.body.styleDNA);

  try {
    const ai = getGeminiClient();
    const prompt = `
We are batch creating an Android icon theme pack for these apps (labels only): ${appList.join(', ')}
Theme: ${dna.styleName} (${dna.visualDNA.finish}). Rules: ${dna.replicationRules}

For each app return: "appName" (exactly as given), "glyphSymbol" (key visual motif), "accentTone" (#hex harmonised with the theme), "category" ("social"|"system"|"media"|"tools"|"finance"|"other").
Respond ONLY with a JSON array: [{ "appName": "...", "glyphSymbol": "...", "accentTone": "#hex", "category": "..." }]`;

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.2 },
    });
    const plan = parseJsonLoose(response.text ?? '[]');
    res.json({ success: true, plan: Array.isArray(plan) ? plan : [] });
  } catch (error) {
    console.error('batch-plan-icons failed:', error);
    res.status(error instanceof ApiKeyMissingError ? 503 : 502).json({ error: publicError(error) });
  }
});

// ---------------------------------------------------------------------------
// 4. Raster icon via an image model (optional, not used by the UI yet)
// ---------------------------------------------------------------------------

app.post('/api/generate-icon-image', async (req, res) => {
  const appName = cleanAppName(req.body?.appName);
  if (!appName || !req.body?.styleDNA) {
    return res.status(400).json({ error: 'appName dan styleDNA wajib diisi. / appName and styleDNA are required.' });
  }
  const dna = normalizeDna(req.body.styleDNA);
  const customPrompt = cleanText(req.body?.customPrompt, 300);

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [
          {
            text: `Single modern Android app icon for "${appName}". Style: ${dna.styleName}. ${dna.replicationRules} Centered composition, clean silhouette, full-bleed square artwork with no outer padding, professional app icon design, high resolution. ${customPrompt}`,
          },
        ],
      },
      config: { imageConfig: { aspectRatio: '1:1' } },
    });

    const part = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!part?.inlineData?.data) {
      return res.status(502).json({ error: 'Model tidak mengembalikan gambar. / No image returned.' });
    }
    res.json({ success: true, appName, imageUrl: `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}` });
  } catch (error) {
    console.error('generate-icon-image failed:', error);
    res.status(error instanceof ApiKeyMissingError ? 503 : 502).json({ error: publicError(error) });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', aiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'), timestamp: new Date().toISOString() });
});

// Unknown /api routes should not fall through to the SPA.
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// ---------------------------------------------------------------------------
// Frontend: Vite middleware in dev, static `dist/` in production
// ---------------------------------------------------------------------------

async function startServer() {
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (!fs.existsSync(path.join(distPath, 'index.html'))) {
      console.error('dist/ tidak ditemukan. Jalankan `npm run build` dulu. / dist/ not found. Run `npm run build` first.');
      process.exit(1);
    }
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IconCraft AI ready on http://localhost:${PORT} (${IS_PROD ? 'production' : 'development'})`);
  });
}

startServer();
