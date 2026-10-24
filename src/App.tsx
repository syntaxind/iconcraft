import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navbar } from './components/Navbar';
import { ReferenceUploader } from './components/ReferenceUploader';
import { StyleDnaViewer } from './components/StyleDnaViewer';
import { BatchAppSelector } from './components/BatchAppSelector';
import { IconGallery } from './components/IconGallery';
import { AndroidPhonePreview } from './components/AndroidPhonePreview';
import { IconDetailModal } from './components/IconDetailModal';
import { ExportModal } from './components/ExportModal';
import { HowToInstallModal } from './components/HowToInstallModal';
import { Toast, ToastMessage } from './components/Toast';
import { PRESET_STYLES } from './utils/presets';
import { GeneratedIconItem, IconShape, PresetStyle, StyleDNA } from './types/iconTheme';
import { categorizeApp, normalizeDna, renderSignature } from './shared/dna';
import { remapSvgColors } from './shared/remap';
import { createSyntheticIconSvg } from './shared/syntheticIcon';
import { sanitizeSvg } from './shared/svg';
import { API_BASE } from './utils/api';
import { analyzeStyleDirect, generateSvgDirect, DEFAULT_TEXT_MODEL, type AiStatus } from './utils/geminiClient';
import { useWakeLock } from './utils/useWakeLock';
import { loadApiKey, loadModel } from './utils/apiKeyStore';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Sparkles, RefreshCw, Play, Check, Download, Square, FilePlus2, Save, FolderOpen, Smartphone } from 'lucide-react';
import { MAX_PROJECT_FILE_BYTES, clearProject, loadProject, parseProjectJson, projectToJson, saveProject, toSnapshot, type ProjectData } from './utils/projectStore';
import { usePwaInstall } from './utils/usePwaInstall';
import { downloadBlob } from './utils/download';

const DEFAULT_APPS = ['WhatsApp', 'Camera', 'Gallery', 'Phone', 'Messages', 'Settings', 'Chrome', 'YouTube', 'Spotify', 'Instagram', 'Clock', 'Files'];
const CONCURRENCY_OPTIONS = [1, 2, 3, 4, 6];

type Lang = 'id' | 'en';

function makeOfflineIcon(appName: string, dna: StyleDNA, existing?: GeneratedIconItem): GeneratedIconItem {
  return {
    id: existing?.id ?? `icon-${appName}-${Math.random().toString(36).slice(2, 8)}`,
    appName,
    category: existing?.category ?? categorizeApp(appName),
    status: 'ready',
    svg: createSyntheticIconSvg(appName, dna),
    source: 'offline',
    dnaSnap: dna,
    updatedAt: Date.now(),
  };
}

interface GenerateResult {
  svg: string;
  source: 'ai' | 'offline';
  reason?: string;
}

interface AiCreds {
  key: string;
  model: string;
}

/** Asks Gemini (browser key) or the server for an icon; never throws — falls back to the offline generator. */
async function requestIcon(appName: string, dna: StyleDNA, customPrompt: string | undefined, signal?: AbortSignal, creds?: AiCreds): Promise<GenerateResult> {
  if (creds?.key) {
    try {
      const svg = await generateSvgDirect(creds.key, creds.model, appName, dna, customPrompt, signal);
      return { svg, source: 'ai' };
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') throw err;
      return { svg: createSyntheticIconSvg(appName, dna), source: 'offline', reason: (err as Error).message };
    }
  }
  try {
    const res = await fetch(`${API_BASE}/api/generate-icon-svg`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appName, styleDNA: dna, customPrompt }),
      signal,
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success && typeof data.svg === 'string') {
      return {
        svg: sanitizeSvg(data.svg),
        source: data.isFallback ? 'offline' : 'ai',
        reason: data.fallbackReason,
      };
    }
    return { svg: createSyntheticIconSvg(appName, dna), source: 'offline', reason: data.error || `HTTP ${res.status}` };
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    return { svg: createSyntheticIconSvg(appName, dna), source: 'offline', reason: 'NETWORK' };
  }
}

export default function App() {
  const [lang, setLang] = useState<Lang>('id');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(PRESET_STYLES[0].id);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [styleDNA, setStyleDNA] = useState<StyleDNA>(PRESET_STYLES[0].dna);
  const [baselineDna, setBaselineDna] = useState<StyleDNA>(PRESET_STYLES[0].dna);
  const [selectedApps, setSelectedApps] = useState<string[]>(DEFAULT_APPS);
  const [icons, setIcons] = useState<GeneratedIconItem[]>(() =>
    DEFAULT_APPS.map((name) => makeOfflineIcon(name, PRESET_STYLES[0].dna)),
  );

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, currentApp: '' });
  const abortRef = useRef<AbortController | null>(null);

  const [detailIconId, setDetailIconId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState(() => loadApiKey());
  const [aiModel, setAiModel] = useState(() => loadModel() || DEFAULT_TEXT_MODEL);
  const creds: AiCreds | undefined = apiKey ? { key: apiKey, model: aiModel } : undefined;

  const t = useCallback((id: string, en: string) => (lang === 'id' ? id : en), [lang]);
  const { canInstall, install } = usePwaInstall();
  const projectFileRef = useRef<HTMLInputElement>(null);
  const [hydrated, setHydrated] = useState(false);
  const [aiStatus, setAiStatus] = useState<AiStatus>({ state: 'unknown' });
  const [concurrency, setConcurrency] = useState(() => {
    try {
      const n = Number(localStorage.getItem('iconcraft.concurrency'));
      return CONCURRENCY_OPTIONS.includes(n) ? n : 3;
    } catch {
      return 3;
    }
  });
  const notify = useCallback((kind: ToastMessage['kind'], text: string) => setToast({ id: Date.now(), kind, text }), []);

  // Single source of truth for the mask shape: the Style DNA.
  const activeShape: IconShape = styleDNA.visualDNA.shapeCurvature;
  const applyProject = (p: ProjectData) => {
    setLang(p.lang);
    setStyleDNA(p.styleDNA);
    setBaselineDna(p.baselineDna);
    setSelectedPresetId(p.selectedPresetId);
    setReferenceImage(p.referenceImage);
    const apps = p.selectedApps.length ? p.selectedApps : p.icons.map((i) => i.appName);
    setSelectedApps(apps);
    setIcons(apps.map((name) => p.icons.find((i) => i.appName === name) ?? makeOfflineIcon(name, p.styleDNA)));
  };

  // Restore the previous session (mobile browsers discard background tabs, which reloads the page).
  useEffect(() => {
    let cancelled = false;
    loadProject().then((p) => {
      if (cancelled) return;
      if (p && (p.icons.length > 0 || p.selectedApps.length > 0)) {
        applyProject(p);
        notify('info', p.lang === 'id' ? 'Proyek terakhir dipulihkan otomatis.' : 'Your last project was restored.');
      }
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave (debounced) + an immediate save when the page is hidden/closed.
  const latest = useRef({ lang, styleDNA, baselineDna, selectedPresetId, selectedApps, referenceImage, icons });
  latest.current = { lang, styleDNA, baselineDna, selectedPresetId, selectedApps, referenceImage, icons };
  useEffect(() => {
    if (!hydrated) return;
    const id = setTimeout(() => saveProject(toSnapshot(latest.current)).catch(() => undefined), 800);
    return () => clearTimeout(id);
  }, [hydrated, lang, styleDNA, baselineDna, selectedPresetId, selectedApps, referenceImage, icons]);
  useEffect(() => {
    if (!hydrated) return;
    const flush = () => {
      if (document.visibilityState === 'hidden') saveProject(toSnapshot(latest.current)).catch(() => undefined);
    };
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('pagehide', flush);
    };
  }, [hydrated]);

  const handleNewProject = () => {
    if (!window.confirm(t('Mulai proyek baru? Ikon dan pengaturan saat ini akan dihapus (preset DNA tersimpan tetap aman).', 'Start a new project? Current icons and settings will be cleared (saved DNA presets are kept).'))) return;
    abortRef.current?.abort();
    const dna = PRESET_STYLES[0].dna;
    setSelectedPresetId(PRESET_STYLES[0].id);
    setStyleDNA(dna);
    setBaselineDna(dna);
    setReferenceImage(null);
    setSelectedApps(DEFAULT_APPS);
    setIcons(DEFAULT_APPS.map((name) => makeOfflineIcon(name, dna)));
    clearProject();
    notify('success', t('Proyek baru dimulai.', 'New project started.'));
  };

  const handleExportProject = () => {
    const json = projectToJson(toSnapshot(latest.current));
    downloadBlob(new Blob([json], { type: 'application/json' }), 'iconcraft_project.json');
  };

  const handleImportProject = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (file.size > MAX_PROJECT_FILE_BYTES) throw new Error(t('Berkas proyek terlalu besar.', 'Project file is too large.'));
      applyProject(parseProjectJson(await file.text()));
      notify('success', t('Proyek dibuka.', 'Project opened.'));
    } catch (err) {
      notify('error', (err as Error).message);
    } finally {
      if (projectFileRef.current) projectFileRef.current.value = '';
    }
  };

  const handleChangeShape = (shape: IconShape) =>
    setStyleDNA((prev) => ({ ...prev, visualDNA: { ...prev.visualDNA, shapeCurvature: shape } }));

  const detailIcon = icons.find((i) => i.id === detailIconId) ?? null;

  const handleSelectPreset = (preset: PresetStyle) => {
    setSelectedPresetId(preset.id);
    setStyleDNA(preset.dna);
    setBaselineDna(preset.dna);
    setReferenceImage(null);
    setIcons(selectedApps.map((name) => makeOfflineIcon(name, preset.dna, icons.find((i) => i.appName === name))));
  };

  const handleImageSelected = (dataUrl: string) => {
    setReferenceImage(dataUrl);
    setSelectedPresetId(null);
  };

  // Keep the gallery in sync with the app list (new apps get an instant offline preview).
  const handleChangeSelectedApps = (apps: string[]) => {
    setSelectedApps(apps);
    setIcons((prev) => apps.map((name) => prev.find((i) => i.appName === name) ?? makeOfflineIcon(name, styleDNA)));
  };

  const handleAnalyzeStyle = async () => {
    if (!referenceImage) return;
    setIsAnalyzing(true);
    try {
      let dna: StyleDNA;
      if (creds) {
        dna = await analyzeStyleDirect(creds.key, creds.model, referenceImage);
      } else {
        const res = await fetch(`${API_BASE}/api/analyze-icon-style`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: referenceImage }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          if (res.status === 404 || res.status === 405 || data.code === 'NO_API_KEY') {
            setShowKeyModal(true);
            throw new Error(t('Masukkan API key Gemini dulu (tombol "Kunci AI"), atau pilih preset gaya untuk mode offline.', 'Add your Gemini API key first (the "AI key" button), or pick a style preset to work offline.'));
          }
          throw new Error(data.error || t('Gagal membaca DNA gaya', 'Failed to read style DNA'));
        }
        dna = normalizeDna(data.data);
      }
      setStyleDNA(dna);
      setBaselineDna(dna);

      if (dna.defaultIconTags?.length) {
        handleChangeSelectedApps(Array.from(new Set([...selectedApps, ...dna.defaultIconTags.slice(0, 8)])));
      }
      notify('success', t('Style DNA berhasil dibaca. Lanjut ke Generate Massal!', 'Style DNA extracted. Now run the batch generation!'));
    } catch (err) {
      notify('error', `${t('Analisis gaya gagal', 'Style analysis failed')}: ${(err as Error).message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const patchIcon = (appName: string, patch: Partial<GeneratedIconItem>) =>
    setIcons((prev) => prev.map((i) => (i.appName === appName ? { ...i, ...patch } : i)));

  const handleStartBatchGenerate = async (fromScratch = false) => {
    if (selectedApps.length === 0) {
      notify('error', t('Daftar aplikasi kosong. Tambahkan aplikasi di langkah 2.', 'App list is empty. Add apps in step 2.'));
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    const dna = styleDNA;
    const sig = renderSignature(dna);
    // Resume: icons already made by AI with this exact DNA are kept (they survive a reload via autosave).
    const isDone = (i?: GeneratedIconItem) => Boolean(i && i.source === 'ai' && i.status === 'ready' && i.svg && i.dnaSnap && renderSignature(i.dnaSnap) === sig);
    const queue = selectedApps.filter((name) => fromScratch || !isDone(icons.find((i) => i.appName === name)));
    if (queue.length === 0) {
      notify('success', t('Semua ikon sudah dibuat dengan DNA ini. Pakai "Ulang dari awal" untuk membuat ulang.', 'All icons already exist for this DNA. Use "Start over" to regenerate them.'));
      return;
    }
    let aiCount = 0;
    let next = 0;
    let completed = 0;
    let offlineCount = 0;
    let firstReason: string | undefined;

    setIsBatchGenerating(true);
    setBatchProgress({ current: 0, total: queue.length, currentApp: '' });
    setIcons((prev) => prev.map((i) => (queue.includes(i.appName) ? { ...i, status: 'pending' as const } : i)));

    const worker = async () => {
      while (next < queue.length && !controller.signal.aborted) {
        const appName = queue[next++];
        patchIcon(appName, { status: 'generating' });
        setBatchProgress((p) => ({ ...p, currentApp: appName }));
        try {
          const result = await requestIcon(appName, dna, undefined, controller.signal, creds);
          if (result.source === 'offline') {
            offlineCount++;
            firstReason ??= result.reason;
          } else {
            aiCount++;
          }
          patchIcon(appName, { status: 'ready', svg: result.svg, source: result.source, dnaSnap: dna, note: result.source === 'offline' ? result.reason : undefined, updatedAt: Date.now() });
        } catch {
          patchIcon(appName, { status: 'ready' }); // aborted: keep previous artwork
        } finally {
          completed++;
          setBatchProgress((p) => ({ ...p, current: completed }));
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));

    // Anything never reached (cancelled) goes back to its previous state.
    setIcons((prev) => prev.map((i) => (i.status === 'pending' ? { ...i, status: 'ready' } : i)));
    setIsBatchGenerating(false);
    abortRef.current = null;
    if (creds && !controller.signal.aborted) {
      if (aiCount > 0) setAiStatus({ state: 'ok' });
      else if (offlineCount > 0 && firstReason !== 'NO_API_KEY') setAiStatus({ state: 'error', message: firstReason });
    }

    if (controller.signal.aborted) {
      notify('info', t('Pembuatan dibatalkan.', 'Generation cancelled.'));
    } else if (offlineCount > 0) {
      const noKey = firstReason === 'NO_API_KEY' || firstReason === 'NETWORK';
      notify(
        'info',
        noKey
          ? t(`${offlineCount} ikon dibuat dengan generator offline. Masukkan API key Gemini (tombol "Kunci AI") untuk ikon buatan AI.`, `${offlineCount} icons used the offline generator. Add a Gemini API key (the "AI key" button) for AI-made icons.`)
          : t(`${offlineCount} ikon memakai generator offline. Penyebab: ${firstReason ?? 'AI gagal'}`, `${offlineCount} icons used the offline generator. Reason: ${firstReason ?? 'AI failed'}`),
      );
    } else {
      notify('success', t('Semua ikon berhasil dibuat!', 'All icons generated!'));
    }
  };

  const handleRegenerateSingle = async (appName: string, customPrompt?: string) => {
    patchIcon(appName, { status: 'generating' });
    try {
      const result = await requestIcon(appName, styleDNA, customPrompt, undefined, creds);
      patchIcon(appName, { status: 'ready', svg: result.svg, source: result.source, dnaSnap: styleDNA, note: result.source === 'offline' ? result.reason : undefined, updatedAt: Date.now() });
      if (creds) setAiStatus(result.source === 'ai' ? { state: 'ok' } : { state: 'error', message: result.reason });
      if (result.source === 'offline') {
        notify('info', t(`"${appName}" memakai generator offline (AI tidak tersedia).`, `"${appName}" used the offline generator (AI unavailable).`));
      }
    } catch {
      patchIcon(appName, { status: 'ready' });
    }
  };

  // Icons whose artwork was made with a different DNA than the one currently shown.
  const currentSig = useMemo(() => renderSignature(styleDNA), [styleDNA]);
  const outdatedCount = useMemo(
    () => icons.filter((i) => i.status === 'ready' && i.svg && (!i.dnaSnap || renderSignature(i.dnaSnap) !== currentSig)).length,
    [icons, currentSig],
  );

  /** Instant + free: re-render offline icons with the new DNA and recolour AI-made ones. */
  const handleApplyToIcons = () => {
    const dna = styleDNA;
    const sig = renderSignature(dna);
    const aiCount = icons.filter((i) => i.source === 'ai' && i.svg && i.dnaSnap && renderSignature(i.dnaSnap) !== sig).length;
    setIcons((prev) =>
      prev.map((icon) => {
        if (icon.status !== 'ready' || !icon.svg) return icon;
        if (icon.dnaSnap && renderSignature(icon.dnaSnap) === renderSignature(dna)) return icon;
        if (icon.source === 'ai' && icon.dnaSnap) {
          return { ...icon, svg: remapSvgColors(icon.svg, icon.dnaSnap, dna), dnaSnap: dna, updatedAt: Date.now() };
        }
        return { ...icon, svg: createSyntheticIconSvg(icon.appName, dna), source: 'offline' as const, dnaSnap: dna, updatedAt: Date.now() };
      }),
    );
    notify(
      'success',
      t(
        'DNA diterapkan ke ikon yang ada.' + (aiCount ? ' Ikon AI hanya diwarnai ulang; gunakan "Buat ulang semua" untuk finish/pattern baru.' : ''),
        'DNA applied to existing icons.' + (aiCount ? ' AI icons were only recolored; use "Regenerate all" for new finish/pattern.' : ''),
      ),
    );
  };

  const handleLoadSavedDna = (dna: StyleDNA) => {
    setStyleDNA(dna);
    setBaselineDna(dna);
    setSelectedPresetId(null);
    notify('info', t('Preset dimuat. Klik "Terapkan ke ikon" untuk memakainya pada ikon yang ada.', 'Preset loaded. Click "Apply to icons" to use it on the existing icons.'));
  };

  // Resume bookkeeping for the batch button.
  const doneAiCount = useMemo(
    () => icons.filter((i) => i.source === 'ai' && i.status === 'ready' && i.svg && i.dnaSnap && renderSignature(i.dnaSnap) === currentSig).length,
    [icons, currentSig],
  );
  const remainingCount = Math.max(0, selectedApps.length - doneAiCount);
  useWakeLock(isBatchGenerating);
  useEffect(() => {
    if (!isBatchGenerating) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isBatchGenerating]);

  const readyIconCount = icons.filter((i) => i.status === 'ready' && (i.svg || i.imageUrl)).length;
  const progressPct = Math.round((batchProgress.current / (batchProgress.total || 1)) * 100);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      <Navbar
        lang={lang}
        setLang={setLang}
        onOpenHelp={() => setShowHelpModal(true)}
        onOpenExport={() => setShowExportModal(true)}
        readyIconCount={readyIconCount}
        onOpenApiKey={() => setShowKeyModal(true)}
        hasApiKey={Boolean(apiKey)}
        aiState={!apiKey ? 'none' : aiStatus.state}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/50 border border-indigo-500/20 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Vision & Batch Vector Engine</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {t('Buat Tema Ikon Android Massal Berdasarkan Ikon Acuan', 'Batch Generate Android Themed Icons from Reference Image')}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-2.5 leading-relaxed">
              {t(
                'Unggah 1 ikon acuan apa saja. AI mengekstrak "Style DNA" (pencahayaan, tekstur 3D/flat, bentuk & palet warna), lalu otomatis menghasilkan belasan ikon tema seragam yang siap diuji di simulator Android dan diekspor ke file ZIP.',
                'Upload 1 reference icon. AI extracts the "Style DNA" (lighting, 3D/flat textures, shape & color palette), then batch-produces consistent themed icons ready for the Android launcher preview and icon pack ZIP export.',
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-6">
            <ReferenceUploader
              lang={lang}
              referenceImage={referenceImage}
              onImageSelected={handleImageSelected}
              onPresetSelected={handleSelectPreset}
              selectedPresetId={selectedPresetId}
              onAnalyzeStyle={handleAnalyzeStyle}
              isAnalyzing={isAnalyzing}
              styleDNA={styleDNA}
              onError={(msg) => notify('error', msg)}
            />

            <StyleDnaViewer
              lang={lang}
              styleDNA={styleDNA}
              onUpdateDNA={setStyleDNA}
              baselineDna={baselineDna}
              outdatedCount={outdatedCount}
              isBusy={isBatchGenerating}
              onApplyToIcons={handleApplyToIcons}
              onRegenerateAll={() => handleStartBatchGenerate(true)}
              onLoadDna={handleLoadSavedDna}
              notify={notify}
            />

            <BatchAppSelector lang={lang} selectedApps={selectedApps} onChangeSelectedApps={handleChangeSelectedApps} />

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>{t('3. Mulai Pembuatan Massal', '3. Start Batch Generation')}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {doneAiCount > 0
                      ? t(`${doneAiCount} ikon AI sudah jadi, ${remainingCount} tersisa`, `${doneAiCount} AI icons done, ${remainingCount} left`)
                      : t(`Siap membuat ${selectedApps.length} ikon tema seragam sekaligus`, `Ready to batch craft ${selectedApps.length} themed icons`)}
                  </p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  {isBatchGenerating && (
                    <button
                      onClick={() => abortRef.current?.abort()}
                      className="flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-bold text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>{t('Batal', 'Cancel')}</span>
                    </button>
                  )}
                  {!isBatchGenerating && doneAiCount > 0 && remainingCount > 0 && (
                    <button
                      onClick={() => handleStartBatchGenerate(true)}
                      className="px-3 py-3 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 border border-slate-700 rounded-xl cursor-pointer"
                    >
                      {t('Ulang dari awal', 'Start over')}
                    </button>
                  )}
                  <button
                    onClick={() => handleStartBatchGenerate(remainingCount === 0 && doneAiCount > 0)}
                    disabled={isBatchGenerating || selectedApps.length === 0}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 text-sm font-extrabold text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBatchGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{t('Memproses', 'Generating')} ({batchProgress.current}/{batchProgress.total})...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>
                          {doneAiCount > 0 && remainingCount > 0
                            ? t(`Lanjutkan (${remainingCount} tersisa)`, `Resume (${remainingCount} left)`)
                            : doneAiCount > 0
                              ? t('Buat ulang semua', 'Regenerate all')
                              : t(`Mulai Generate Massal (${selectedApps.length} Ikon)`, `Batch Generate All (${selectedApps.length} Icons)`)}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                <label htmlFor="conc">{t('Dibuat bersamaan:', 'In parallel:')}</label>
                <select
                  id="conc"
                  value={concurrency}
                  disabled={isBatchGenerating}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setConcurrency(n);
                    try {
                      localStorage.setItem('iconcraft.concurrency', String(n));
                    } catch {
                      /* ignore */
                    }
                  }}
                  className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-md text-slate-200 cursor-pointer"
                >
                  {CONCURRENCY_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span className="text-slate-500">{t('Lebih besar = lebih cepat, tapi lebih mudah kena batas kuota Gemini.', 'Higher = faster, but hits Gemini rate limits sooner.')}</span>
              </div>

              {isBatchGenerating && (
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">
                      {t('Aplikasi saat ini:', 'Currently creating:')} <span className="font-bold text-indigo-300">{batchProgress.currentApp}</span>
                    </span>
                    <span className="font-bold text-indigo-400">{progressPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              )}
            </div>

            <IconGallery
              lang={lang}
              icons={icons}
              activeShape={activeShape}
              onRegenerateSingle={handleRegenerateSingle}
              onSelectIconForDetail={(icon) => setDetailIconId(icon.id)}
              isBatchGenerating={isBatchGenerating}
            />
          </div>

          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
            <AndroidPhonePreview
              lang={lang}
              icons={icons}
              activeShape={activeShape}
              onChangeShape={handleChangeShape}
              onSelectIconForDetail={(icon) => setDetailIconId(icon.id)}
            />

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">{t('Ringkasan Paket Ikon', 'Icon Pack Summary')}</h3>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {readyIconCount} / {selectedApps.length} {t('Siap', 'Ready')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 mb-4">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Style DNA</span>
                  <span className="font-bold text-white truncate block">{styleDNA.styleName}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Shape Mask</span>
                  <span className="font-bold text-white capitalize block">{activeShape}</span>
                </div>
              </div>

              <button
                onClick={() => setShowExportModal(true)}
                disabled={readyIconCount === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>{t('Unduh Paket Android (.ZIP)', 'Download Android Icon Pack (.ZIP)')}</span>
              </button>

              <div className="mt-4 pt-3 border-t border-slate-800">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {t('Proyek (tersimpan otomatis di perangkat ini)', 'Project (autosaved on this device)')}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={handleNewProject} className="flex flex-col items-center gap-1 px-2 py-2 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 border border-slate-700 rounded-xl cursor-pointer">
                    <FilePlus2 className="w-4 h-4 text-indigo-400" />
                    {t('Proyek baru', 'New')}
                  </button>
                  <button onClick={handleExportProject} className="flex flex-col items-center gap-1 px-2 py-2 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 border border-slate-700 rounded-xl cursor-pointer">
                    <Save className="w-4 h-4 text-indigo-400" />
                    {t('Simpan .json', 'Save .json')}
                  </button>
                  <button onClick={() => projectFileRef.current?.click()} className="flex flex-col items-center gap-1 px-2 py-2 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 border border-slate-700 rounded-xl cursor-pointer">
                    <FolderOpen className="w-4 h-4 text-indigo-400" />
                    {t('Buka .json', 'Open .json')}
                  </button>
                </div>
                <input ref={projectFileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => handleImportProject(e.target.files?.[0])} />
                {canInstall && (
                  <button onClick={install} className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl cursor-pointer">
                    <Smartphone className="w-4 h-4" />
                    {t('Pasang sebagai aplikasi', 'Install as app')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {detailIcon && (
        <IconDetailModal
          lang={lang}
          icon={detailIcon}
          onClose={() => setDetailIconId(null)}
          activeShape={activeShape}
          onRegenerate={handleRegenerateSingle}
          isRegenerating={detailIcon.status === 'generating'}
          styleDNA={styleDNA}
        />
      )}

      {showExportModal && (
        <ExportModal
          lang={lang}
          icons={icons}
          styleDNA={styleDNA}
          activeShape={activeShape}
          onClose={() => setShowExportModal(false)}
          onOpenHelp={() => {
            setShowExportModal(false);
            setShowHelpModal(true);
          }}
        />
      )}

      {showHelpModal && <HowToInstallModal lang={lang} onClose={() => setShowHelpModal(false)} />}

      {showKeyModal && (
        <ApiKeyModal
          lang={lang}
          apiKey={apiKey}
          model={aiModel}
          onSave={(key, model) => {
            setApiKey(key);
            setAiModel(model || DEFAULT_TEXT_MODEL);
            setAiStatus((s) => (key === apiKey && (model || DEFAULT_TEXT_MODEL) === aiModel ? s : { state: 'unknown' }));
            setShowKeyModal(false);
            notify('success', key ? t('API key tersimpan. Fitur AI aktif.', 'API key saved. AI features are on.') : t('API key dihapus.', 'API key removed.'));
          }}
          onClose={() => setShowKeyModal(false)}
          onTested={setAiStatus}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
