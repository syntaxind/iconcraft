import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, Sparkles, Check, RefreshCw, Palette } from 'lucide-react';
import { PRESET_STYLES } from '../utils/presets';
import { PresetStyle, StyleDNA } from '../types/iconTheme';
import { fileToResizedDataUrl } from '../utils/imageUtils';
import { svgToDataUri } from '../shared/svg';

interface ReferenceUploaderProps {
  lang: 'id' | 'en';
  referenceImage: string | null;
  onImageSelected: (dataUrl: string) => void;
  onPresetSelected: (preset: PresetStyle) => void;
  selectedPresetId: string | null;
  onAnalyzeStyle: () => void;
  isAnalyzing: boolean;
  styleDNA: StyleDNA | null;
  onError: (message: string) => void;
}

export const ReferenceUploader: React.FC<ReferenceUploaderProps> = ({
  lang,
  referenceImage,
  onImageSelected,
  onPresetSelected,
  selectedPresetId,
  onAnalyzeStyle,
  isAnalyzing,
  styleDNA,
  onError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const readFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        onError(lang === 'id' ? 'Silakan unggah berkas gambar (PNG, JPG, WebP, SVG).' : 'Please upload an image file (PNG, JPG, WebP, SVG).');
        return;
      }
      try {
        onImageSelected(await fileToResizedDataUrl(file));
      } catch (err) {
        onError((err as Error).message);
      }
    },
    [lang, onError, onImageSelected],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void readFile(file);
    e.target.value = ''; // allow re-selecting the same file
  };

  // Ctrl+V / Cmd+V anywhere on the page pastes an image from the clipboard.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith('image/'));
      const file = item?.getAsFile();
      if (file) {
        e.preventDefault();
        void readFile(file);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [readFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void readFile(file);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {lang === 'id' ? '1. Ikon Acuan (Reference)' : '1. Reference Style'}
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'id' ? 'Unggah contoh ikon atau pilih dari tema terpopuler' : 'Upload an icon example or pick a designer preset'}
            </p>
          </div>
        </div>

        {styleDNA && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <Check className="w-3.5 h-3.5" />
            {lang === 'id' ? 'DNA Terbaca' : 'DNA Extracted'}
          </span>
        )}
      </div>

      {/* Preset Styles Carousel */}
      <div className="mb-4">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
          {lang === 'id' ? 'Pilihan Tema Populer (Siap Pakai):' : 'Popular Style Presets:'}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {PRESET_STYLES.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onPresetSelected(preset)}
                className={`group relative p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/15 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500/40'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-800/40'
                }`}
              >
                <img
                  src={svgToDataUri(preset.previewSvg)}
                  alt=""
                  draggable={false}
                  className="w-12 h-12 rounded-xl shadow-md transition-transform group-hover:scale-105"
                />
                <div className="text-center w-full">
                  <div className="text-[11px] font-bold text-white truncate group-hover:text-indigo-300">
                    {preset.name}
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">
                    {preset.category}
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div className="relative">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), fileInputRef.current?.click())}
          className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-indigo-400 bg-indigo-500/10'
              : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleFileChange}
            className="hidden"
          />

          {referenceImage ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="relative group">
                <img
                  src={referenceImage}
                  alt="Reference Icon"
                  className="w-20 h-20 rounded-2xl object-cover shadow-xl border border-slate-700"
                />
                <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-medium transition-opacity">
                  {lang === 'id' ? 'Ganti' : 'Change'}
                </div>
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-white">
                  {lang === 'id' ? 'Gambar acuan aktif terunggah' : 'Active reference icon loaded'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {lang === 'id'
                    ? 'Klik untuk memilih gambar lain atau tarik file baru ke sini'
                    : 'Click to choose another image or drag & drop a new file'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-2">
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 text-slate-300 flex items-center justify-center mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-200">
                {lang === 'id' ? 'Unggah Ikon Acuan Sendiri (PNG / JPG / WebP)' : 'Upload your own reference icon'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {lang === 'id'
                  ? 'Klik untuk memilih berkas atau seret ke kotak ini (bisa Ctrl+V)'
                  : 'Click or drag & drop your image here'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action to Analyze */}
      {referenceImage && !selectedPresetId && (
        <div className="mt-3.5 flex justify-end">
          <button
            onClick={onAnalyzeStyle}
            disabled={isAnalyzing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl shadow-md shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{lang === 'id' ? 'AI Membaca DNA Gaya...' : 'AI Analyzing Style DNA...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'id' ? 'Ekstrak Style DNA dengan AI' : 'Extract Style DNA with AI'}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
