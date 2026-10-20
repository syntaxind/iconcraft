import React, { useState } from 'react';
import { GeneratedIconItem, IconShape, StyleDNA } from '../types/iconTheme';
import { X, Download, Archive, Layers, FileCode, Check, RefreshCw, Smartphone, AlertCircle, Palette } from 'lucide-react';
import { exportThemeStoreIcons, parsePackageList, themeFileNames } from '../utils/themeStoreExport';
import { exportAndroidIconPackZip, exportHighResPngZip, exportSvgZip, clampSize, MIN_SIZE, MAX_SIZE } from '../utils/androidExport';
import { downloadBlob, slugify } from '../utils/download';

interface ExportModalProps {
  lang: 'id' | 'en';
  icons: GeneratedIconItem[];
  styleDNA: StyleDNA | null;
  activeShape: IconShape;
  onClose: () => void;
  onOpenHelp: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  lang,
  icons,
  styleDNA,
  activeShape,
  onClose,
  onOpenHelp,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [exportedSuccess, setExportedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [size, setSize] = useState(256);
  const [author, setAuthor] = useState(() => {
    try {
      return localStorage.getItem('iconcraft.author') || '';
    } catch {
      return '';
    }
  });
  const [pkgOverrides, setPkgOverrides] = useState<Record<string, string>>({});
  const [themeReport, setThemeReport] = useState<string | null>(null);

  const readyIcons = icons.filter((i) => i.status === 'ready' && (i.svg || i.imageUrl));
  const unmappedIcons = readyIcons.filter((i) => themeFileNames(i.appName, parsePackageList(pkgOverrides[i.appName] ?? '')).length === 0);

  const runExport = async (label: string, job: () => Promise<{ blob: Blob; fileName: string }>) => {
    setIsExporting(true);
    setExportedSuccess(false);
    setErrorMsg(null);
    setThemeReport(null);
    setProgressPercent(5);
    setProgressMsg(label);
    try {
      const { blob, fileName } = await job();
      downloadBlob(blob, fileName);
      setProgressPercent(100);
      setExportedSuccess(true);
    } catch (e) {
      setErrorMsg((e as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const onProgress = (percent: number, msg: string) => {
    setProgressPercent(percent);
    setProgressMsg(msg);
  };

  const handleExportThemeStore = (fileName: 'icons' | 'icons.zip') =>
    styleDNA &&
    runExport(lang === 'id' ? 'Menyiapkan modul icons Theme Store...' : 'Preparing Theme Store icons module...', async () => {
      try {
        localStorage.setItem('iconcraft.author', author);
      } catch {
        /* ignore */
      }
      const res = await exportThemeStoreIcons(icons, styleDNA, activeShape, { author, packageOverrides: pkgOverrides }, onProgress);
      const notes: string[] = [`${res.appFileCount} PNG`];
      if (res.unmapped.length) notes.push((lang === 'id' ? 'Tanpa nama paket (dilewati): ' : 'No package name (skipped): ') + res.unmapped.join(', '));
      if (res.failed.length) notes.push((lang === 'id' ? 'Gagal dirender: ' : 'Failed to render: ') + res.failed.join(', '));
      setThemeReport(notes.join(' • '));
      return { blob: res.blob, fileName };
    });

  const handleExportAndroidPack = () =>
    styleDNA &&
    runExport(lang === 'id' ? 'Menyiapkan berkas Android...' : 'Preparing Android files...', async () => ({
      blob: await exportAndroidIconPackZip(icons, styleDNA, activeShape, onProgress, size),
      fileName: `${slugify(styleDNA.styleName, 'android_theme')}_icon_pack.zip`,
    }));

  const handleExportPngZip = () =>
    runExport(lang === 'id' ? `Merender gambar ${clampSize(size)}px...` : `Rendering ${clampSize(size)}px images...`, async () => ({
      blob: await exportHighResPngZip(icons, activeShape, onProgress, size),
      fileName: `theme_icons_${clampSize(size)}px_png.zip`,
    }));

  const handleExportSvgZip = () =>
    runExport(lang === 'id' ? 'Mengompres berkas SVG...' : 'Compressing SVG files...', async () => ({
      blob: await exportSvgZip(icons),
      fileName: 'theme_icons_vectors.zip',
    }));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && !isExporting && onClose()}
    >
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {lang === 'id' ? 'Ekspor Paket Ikon Tema' : 'Export Icon Theme Pack'}
            </h3>
            <p className="text-xs text-slate-400">
              {readyIcons.length} {lang === 'id' ? 'ikon siap diunduh' : 'icons ready for export'} • Mask: {activeShape}
            </p>
          </div>
        </div>

        {/* Progress Bar when Exporting */}
        {isExporting && (
          <div className="mb-6 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-medium text-slate-300 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                {progressMsg}
              </span>
              <span className="font-bold text-indigo-400">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-2 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {exportedSuccess && (
          <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-emerald-300 font-medium">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{themeReport ?? (lang === 'id' ? 'Berkas ZIP berhasil diunduh!' : 'ZIP file downloaded successfully!')}</span>
            </div>
            <button
              onClick={onOpenHelp}
              className="text-xs font-bold text-emerald-400 hover:underline cursor-pointer"
            >
              {lang === 'id' ? 'Cara Pasang di HP' : 'How to Install'}
            </button>
          </div>
        )}

        {/* Xiaomi Theme Store module */}
        <div className="mb-4 p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-white">{lang === 'id' ? 'Modul "icons" Xiaomi Theme Store' : 'Xiaomi Theme Store "icons" module'}</h4>
                <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-amber-500 text-slate-950 rounded">MIUI / HyperOS</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {lang === 'id'
                  ? 'PNG 256px bernama paket + icon_mask (180), icon_folder & folder_bg (434), transform_config.xml, Copyright.txt. Tempel sebagai modul "icons" di .mtz Anda.'
                  : '256px PNGs named by package + icon_mask (180), icon_folder & folder_bg (434), transform_config.xml, Copyright.txt. Drop it in your .mtz as the "icons" module.'}
              </p>
            </div>
          </div>

          <label className="block mt-3">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">{lang === 'id' ? 'Nama kredit (Copyright.txt)' : 'Credit name (Copyright.txt)'}</span>
            <input
              type="text"
              value={author}
              maxLength={60}
              placeholder={lang === 'id' ? 'Nama desainer' : 'Designer name'}
              onChange={(e) => setAuthor(e.target.value.replace(/[<>\r\n]/g, ''))}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </label>

          {unmappedIcons.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] text-amber-200 mb-1.5">
                {lang === 'id'
                  ? `${unmappedIcons.length} ikon belum punya nama paket. Isi nama paket (pisahkan koma) agar ikut diekspor:`
                  : `${unmappedIcons.length} icon(s) have no package name. Fill in package names (comma separated) to include them:`}
              </p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {unmappedIcons.map((i) => (
                  <label key={i.id} className="flex items-center gap-2">
                    <span className="w-24 shrink-0 text-[11px] text-slate-300 truncate" title={i.appName}>{i.appName}</span>
                    <input
                      type="text"
                      value={pkgOverrides[i.appName] ?? ''}
                      placeholder="com.example.app"
                      spellCheck={false}
                      onChange={(e) => setPkgOverrides((p) => ({ ...p, [i.appName]: e.target.value }))}
                      className="flex-1 min-w-0 px-2 py-1 text-[11px] font-mono bg-slate-950 border border-slate-800 rounded-md text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={() => handleExportThemeStore('icons')}
              disabled={isExporting || readyIcons.length === 0}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {lang === 'id' ? 'Unduh "icons"' : 'Download "icons"'}
            </button>
            <button
              onClick={() => handleExportThemeStore('icons.zip')}
              disabled={isExporting || readyIcons.length === 0}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-100 bg-slate-900/70 hover:bg-slate-800 border border-amber-500/30 rounded-lg cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              icons.zip
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">
            {lang === 'id'
              ? 'File "icons" tanpa ekstensi adalah zip yang sama. Jika browser menambah ekstensi, hapus manual atau pakai icons.zip lalu ganti namanya.'
              : 'The extensionless "icons" file is the same zip. If your browser adds an extension, remove it, or use icons.zip and rename it.'}
          </p>
        </div>

        {/* Size setting */}
        <div className="mb-4 p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            {lang === 'id' ? 'Ukuran PNG (px)' : 'PNG size (px)'}
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {[96, 128, 192, 256, 512, 1024].map((n) => (
              <button
                key={n}
                onClick={() => setSize(n)}
                aria-pressed={size === n}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border cursor-pointer ${
                  size === n ? 'border-indigo-500 bg-indigo-500/20 text-white' : 'border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {n}
              </button>
            ))}
            <input
              type="number"
              min={MIN_SIZE}
              max={MAX_SIZE}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              onBlur={() => setSize(clampSize(size))}
              aria-label="Custom size"
              className="w-24 px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">
            {lang === 'id'
              ? `Dipakai untuk PNG master paket Android dan ekspor PNG. Rentang ${MIN_SIZE}–${MAX_SIZE}px.`
              : `Used for the Android pack master PNG and the PNG export. Range ${MIN_SIZE}-${MAX_SIZE}px.`}
          </p>
        </div>

        {/* Export Options Cards */}
        <div className="space-y-3">
          {/* Option 1: Full Android Pack */}
          <button
            onClick={handleExportAndroidPack}
            disabled={isExporting || readyIcons.length === 0}
            className="w-full group p-4 rounded-2xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all text-left flex items-start justify-between cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white group-hover:text-indigo-200">
                    {lang === 'id' ? 'Paket Lengkap Android (.ZIP)' : 'Full Android Icon Pack (.ZIP)'}
                  </h4>
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-indigo-500 text-white rounded">
                    {lang === 'id' ? 'Direkomendasikan' : 'Recommended'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {lang === 'id'
                    ? 'Paket resource Android (PNG semua densitas, appfilter.xml untuk Nova/Lawnchair, dan panduan)'
                    : 'Standard Android structure with drawable densities, appfilter.xml for launchers, and instructions'}
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-indigo-400 group-hover:translate-y-0.5 transition-transform" />
          </button>

          {/* Option 2: High Res PNG */}
          <button
            onClick={handleExportPngZip}
            disabled={isExporting || readyIcons.length === 0}
            className="w-full group p-3.5 rounded-2xl border border-slate-800 hover:border-slate-700 bg-slate-950/70 hover:bg-slate-800/40 transition-all text-left flex items-start justify-between cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-indigo-300">
                  {lang === 'id' ? `Semua Gambar PNG (${clampSize(size)}px)` : `All PNG Images (${clampSize(size)}px)`}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {lang === 'id'
                    ? 'File PNG transparan dengan masker bentuk terpilih, sesuai ukuran di atas'
                    : 'Transparent PNGs with the active shape mask, at the size set above'}
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:translate-y-0.5 transition-transform" />
          </button>

          {/* Option 3: Vector SVG Zip */}
          <button
            onClick={handleExportSvgZip}
            disabled={isExporting || readyIcons.length === 0}
            className="w-full group p-3.5 rounded-2xl border border-slate-800 hover:border-slate-700 bg-slate-950/70 hover:bg-slate-800/40 transition-all text-left flex items-start justify-between cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-indigo-300">
                  {lang === 'id' ? 'Semua Berkas Vektor SVG' : 'All Scalable Vector SVGs'}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {lang === 'id'
                    ? 'File vektor murni yang bisa dibuka di Figma, Illustrator, atau Android Studio'
                    : 'Pure scalable vector code for Figma, Illustrator, or Android Studio'}
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
