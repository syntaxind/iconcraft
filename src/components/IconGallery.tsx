import React, { useState } from 'react';
import { GeneratedIconItem, IconShape } from '../types/iconTheme';
import { Download, RefreshCw, Copy, Check, Sparkles, Search, AlertCircle } from 'lucide-react';
import { rasterizeSvgToBlob, rasterizeDataUrlToBlob } from '../utils/canvasRasterizer';
import { downloadBlob, slugify } from '../utils/download';
import { IconTile } from './IconTile';

interface IconGalleryProps {
  lang: 'id' | 'en';
  icons: GeneratedIconItem[];
  activeShape: IconShape;
  onRegenerateSingle: (appName: string, customPrompt?: string) => void;
  onSelectIconForDetail: (icon: GeneratedIconItem) => void;
  isBatchGenerating: boolean;
}

export const IconGallery: React.FC<IconGalleryProps> = ({
  lang,
  icons,
  activeShape,
  onRegenerateSingle,
  onSelectIconForDetail,
  isBatchGenerating,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredIcons = icons.filter((i) =>
    i.appName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopySvg = (icon: GeneratedIconItem) => {
    if (icon.svg) {
      navigator.clipboard?.writeText(icon.svg).catch(() => undefined);
      setCopiedId(icon.id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const handleDownloadSingle = async (icon: GeneratedIconItem) => {
    try {
      const blob = icon.svg
        ? await rasterizeSvgToBlob(icon.svg, 1024, activeShape)
        : icon.imageUrl
        ? await rasterizeDataUrlToBlob(icon.imageUrl, 1024, activeShape)
        : null;
      if (blob) downloadBlob(blob, `${slugify(icon.appName)}_icon.png`);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            {lang === 'id' ? 'Galeri Hasil Ikon Tema' : 'Themed Icon Gallery'}
          </h2>
          <p className="text-xs text-slate-400">
            {lang === 'id'
              ? 'Seluruh ikon seragam sesuai DNA gaya acuan. Klik ikon untuk detail atau unduh satuan.'
              : 'Consistent icons matching your reference DNA. Click to inspect or download individually.'}
          </p>
        </div>

        {/* Search */}
        {icons.length > 0 && (
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'id' ? 'Cari ikon...' : 'Filter icons...'}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}
      </div>

      {icons.length === 0 ? (
        <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
          <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-600" />
          <p className="text-sm font-semibold text-slate-400">
            {lang === 'id' ? 'Belum ada ikon dibuat' : 'No icons generated yet'}
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {lang === 'id'
              ? 'Pilih ikon acuan di atas dan tekan tombol "Mulai Generate Massal" untuk menghasilkan tema ikon seragam.'
              : 'Pick a reference icon and click "Start Batch Generation" to create the icons.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
          {filteredIcons.map((item) => {
            const isReady = item.status === 'ready' && (item.svg || item.imageUrl);
            const isGenerating = item.status === 'generating';
            const isError = item.status === 'error';

            return (
              <div
                key={item.id}
                className="group relative bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-3.5 transition-all flex flex-col items-center shadow-md hover:shadow-indigo-500/10"
              >
                {/* Icon Visual */}
                {isReady ? (
                  <button
                    type="button"
                    onClick={() => onSelectIconForDetail(item)}
                    aria-label={`${lang === 'id' ? 'Perbesar' : 'Preview'} ${item.appName}`}
                    className="relative block cursor-pointer transition-transform group-hover:scale-105 focus-visible:outline-2 focus-visible:outline-indigo-400 rounded-xl"
                  >
                    <IconTile icon={item} shape={activeShape} className="w-20 h-20" />
                    {item.source === 'offline' && (
                      <span title={item.note} className="absolute bottom-0 inset-x-0 text-[8px] leading-4 font-bold uppercase bg-black/60 text-amber-300 text-center">
                        offline
                      </span>
                    )}
                  </button>
                ) : (
                  <div className="w-20 h-20 rounded-[26%] overflow-hidden border border-white/10 flex items-center justify-center">
                    {isGenerating ? (
                      <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-1.5 p-2 text-center">
                        <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                        <span className="text-[9px] text-indigo-300 font-medium">Generating...</span>
                      </div>
                    ) : isError ? (
                      <div className="w-full h-full bg-rose-950/40 border border-rose-500/30 flex flex-col items-center justify-center gap-1 p-2 text-center">
                        <AlertCircle className="w-5 h-5 text-rose-400" />
                        <span className="text-[9px] text-rose-300">{lang === 'id' ? 'Gagal' : 'Failed'}</span>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-slate-900/80 flex items-center justify-center text-xs text-slate-500 font-bold">
                        {item.appName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                )}

                {/* Title & Category */}
                <div className="mt-2.5 text-center w-full">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                    {item.appName}
                  </h4>
                  <span className="text-[10px] text-slate-400 capitalize block">
                    {item.category || 'App'}
                  </span>
                </div>

                {/* Card Actions */}
                <div className="mt-3 w-full flex items-center justify-between pt-2 border-t border-slate-800/80 gap-1">
                  {/* Copy SVG */}
                  {item.svg && (
                    <button
                      onClick={() => handleCopySvg(item)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title={copiedId === item.id ? 'Tersalin!' : 'Salin kode SVG'}
                      aria-label="Copy SVG"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  {/* Regenerate Single */}
                  <button
                    onClick={() => onRegenerateSingle(item.appName)}
                    disabled={isBatchGenerating || isGenerating}
                    className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                    title={lang === 'id' ? 'Generate ulang ikon ini' : 'Regenerate this icon'}
                    aria-label="Regenerate"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-indigo-400' : ''}`} />
                  </button>

                  {/* Download Single PNG */}
                  {isReady && (
                    <button
                      onClick={() => handleDownloadSingle(item)}
                      className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title={lang === 'id' ? 'Unduh PNG 1024px' : 'Download 1024px PNG'}
                      aria-label="Download PNG"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
