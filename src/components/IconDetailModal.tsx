import React, { useEffect, useState } from 'react';
import { GeneratedIconItem, IconShape, StyleDNA } from '../types/iconTheme';
import { X, Download, Copy, Check, RefreshCw, Sparkles, Code2 } from 'lucide-react';
import { rasterizeSvgToBlob, rasterizeDataUrlToBlob } from '../utils/canvasRasterizer';
import { downloadBlob, slugify } from '../utils/download';
import { clampSize, MIN_SIZE, MAX_SIZE } from '../utils/androidExport';
import { IconTile } from './IconTile';

interface IconDetailModalProps {
  lang: 'id' | 'en';
  icon: GeneratedIconItem;
  onClose: () => void;
  activeShape: IconShape;
  onRegenerate: (appName: string, customPrompt?: string) => void;
  isRegenerating: boolean;
  styleDNA: StyleDNA | null;
}

export const IconDetailModal: React.FC<IconDetailModalProps> = ({
  lang,
  icon,
  onClose,
  activeShape,
  onRegenerate,
  isRegenerating,
  styleDNA,
}) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [copiedSvg, setCopiedSvg] = useState(false);
  const [showSvgCode, setShowSvgCode] = useState(false);
  const [customSize, setCustomSize] = useState(256);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCopySvg = () => {
    if (icon.svg) {
      navigator.clipboard?.writeText(icon.svg).catch(() => undefined);
      setCopiedSvg(true);
      setTimeout(() => setCopiedSvg(false), 2000);
    }
  };

  const handleDownload = async (size: number) => {
    try {
      const blob = icon.svg
        ? await rasterizeSvgToBlob(icon.svg, size, activeShape)
        : icon.imageUrl
        ? await rasterizeDataUrlToBlob(icon.imageUrl, size, activeShape)
        : null;
      if (blob) downloadBlob(blob, `${slugify(icon.appName)}_${size}px.png`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={icon.appName}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{icon.appName}</span>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase bg-slate-800 text-slate-300 rounded">
                {icon.category}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {styleDNA?.styleName || 'Custom Theme'} • {activeShape} mask
            </p>
          </div>
        </div>

        {/* Content: Visual Preview & Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
          {/* Main Visual */}
          <IconTile icon={icon} shape={activeShape} className="w-40 h-40 sm:w-48 sm:h-48 shadow-2xl" />

          {/* Quick Download & Copy Options */}
          <div className="flex-1 space-y-3 w-full">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              {lang === 'id' ? 'Unduh Format Gambar:' : 'Download Formats:'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleDownload(192)}
                className="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>192px (xxxhdpi)</span>
              </button>
              <button
                onClick={() => handleDownload(512)}
                className="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>512px (HD)</span>
              </button>
              <button
                onClick={() => handleDownload(1024)}
                className="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>1024px (Master)</span>
              </button>
              <div className="col-span-2 flex gap-2">
                <input
                  type="number"
                  min={MIN_SIZE}
                  max={MAX_SIZE}
                  value={customSize}
                  onChange={(e) => setCustomSize(Number(e.target.value))}
                  aria-label="Custom size"
                  className="w-24 px-2.5 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => handleDownload(clampSize(customSize))}
                  className="flex-1 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{lang === 'id' ? `Unduh ${clampSize(customSize)}px (ukuran bebas)` : `Download ${clampSize(customSize)}px (custom)`}</span>
                </button>
              </div>
              {icon.svg && (
                <button
                  onClick={handleCopySvg}
                  className="px-3 py-2 text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-xl border border-indigo-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedSvg ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSvg ? 'Tersalin!' : 'Copy SVG'}</span>
                </button>
              )}
            </div>

            {icon.svg && (
              <button
                onClick={() => setShowSvgCode(!showSvgCode)}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 pt-1"
              >
                <Code2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{showSvgCode ? 'Tutup Kode Vektor' : 'Lihat Kode Vektor SVG'}</span>
              </button>
            )}
          </div>
        </div>

        {/* SVG Code drawer */}
        {showSvgCode && icon.svg && (
          <div className="mb-4 p-3 bg-slate-950 border border-slate-800 rounded-xl max-h-36 overflow-y-auto text-[10px] font-mono text-slate-400 whitespace-pre-wrap break-all">
            {icon.svg}
          </div>
        )}

        {/* Custom Regenerate Prompt */}
        <div className="pt-4 border-t border-slate-800">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            {lang === 'id' ? 'Instruksi Kustom Tambahan (Opsional):' : 'Custom Tweak Instruction (Optional):'}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={
                lang === 'id'
                  ? 'Contoh: Buat glif lebih tebal, ubah sedikit gradasi warna, atau tambah efek kilau'
                  : 'E.g. Make symbol bolder, enhance inner neon bloom, or add glossy rim'
              }
              className="flex-1 px-3.5 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => onRegenerate(icon.appName, customPrompt.trim() || undefined)}
              disabled={isRegenerating}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>{lang === 'id' ? 'Generate Ulang' : 'Regenerate'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
