import React, { useState } from 'react';
import { Layers, Plus, X, Sparkles, Trash2 } from 'lucide-react';
import { APP_PACK_PRESETS } from '../utils/presets';

interface BatchAppSelectorProps {
  lang: 'id' | 'en';
  selectedApps: string[];
  onChangeSelectedApps: (apps: string[]) => void;
}

export const BatchAppSelector: React.FC<BatchAppSelectorProps> = ({
  lang,
  selectedApps,
  onChangeSelectedApps,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [pasteMode, setPasteMode] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const handleAddApp = () => {
    if (!inputValue.trim()) return;
    const names = inputValue
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const merged = Array.from(new Set([...selectedApps, ...names]));
    onChangeSelectedApps(merged);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddApp();
    }
  };

  const handleRemoveApp = (appName: string) => {
    onChangeSelectedApps(selectedApps.filter((a) => a !== appName));
  };

  const handleSelectPresetPack = (apps: string[]) => {
    const merged = Array.from(new Set([...selectedApps, ...apps]));
    onChangeSelectedApps(merged);
  };

  const handleClearAll = () => {
    if (window.confirm(lang === 'id' ? 'Kosongkan semua daftar ikon?' : 'Clear all icons from list?')) {
      onChangeSelectedApps([]);
    }
  };

  const handleApplyBulkText = () => {
    const names = bulkText
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (names.length > 0) {
      onChangeSelectedApps(names);
      setPasteMode(false);
      setBulkText('');
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                {lang === 'id' ? '2. Daftar Ikon Massal (Batch)' : '2. Batch Icon List'}
              </h2>
              <span className="px-2 py-0.5 text-xs font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 rounded-full">
                {selectedApps.length} {lang === 'id' ? 'aplikasi' : 'apps'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {lang === 'id'
                ? 'Tentukan aplikasi apa saja yang akan dibuat ikon temanya'
                : 'Specify which apps to generate themed icons for'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => {
              setBulkText(selectedApps.join(', '));
              setPasteMode(!pasteMode);
            }}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg border border-slate-700 transition-all cursor-pointer"
          >
            {pasteMode
              ? lang === 'id' ? 'Mode Chip' : 'Chip Mode'
              : lang === 'id' ? 'Mode Teks Masal' : 'Bulk Text Mode'}
          </button>
          {selectedApps.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-2 py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg border border-rose-500/20 transition-all cursor-pointer flex items-center gap-1"
              title="Clear all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Preset Pack Quick Buttons */}
      <div className="mb-4">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
          {lang === 'id' ? 'Tambah Cepat Paket Populer:' : 'Quick Add Popular Packs:'}
        </label>
        <div className="flex flex-wrap gap-2">
          {APP_PACK_PRESETS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => handleSelectPresetPack(pack.apps)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-950/70 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-300 transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>{pack.name}</span>
              <span className="text-[10px] text-slate-500 ml-0.5">({pack.apps.length})</span>
            </button>
          ))}
        </div>
      </div>

      {pasteMode ? (
        /* Bulk Textarea Input */
        <div className="space-y-2">
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono leading-relaxed"
            placeholder="WhatsApp, Camera, Settings, Gallery, Browser, Phone, Messages, Instagram, TikTok..."
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setPasteMode(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              {lang === 'id' ? 'Batal' : 'Cancel'}
            </button>
            <button
              onClick={handleApplyBulkText}
              className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow cursor-pointer"
            >
              {lang === 'id' ? 'Terapkan Daftar' : 'Apply List'}
            </button>
          </div>
        </div>
      ) : (
        /* Chips & Input View */
        <div>
          {/* Quick Input Bar */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  lang === 'id'
                    ? 'Ketik nama aplikasi (misal: Tokopedia, BCA, Gojek, CapCut) lalu tekan Enter...'
                    : 'Type app name (e.g. Spotify, Discord, Notion) and hit Enter...'
                }
                className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner"
              />
            </div>
            <button
              onClick={handleAddApp}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-indigo-600 rounded-xl border border-slate-700 hover:border-indigo-500 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'id' ? 'Tambah' : 'Add'}</span>
            </button>
          </div>

          {/* App Chips */}
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
            {selectedApps.map((appName) => (
              <span
                key={appName}
                className="group inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 text-xs font-semibold bg-slate-950/80 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-lg shadow-sm transition-all"
              >
                <span>{appName}</span>
                <button
                  onClick={() => handleRemoveApp(appName)}
                  className="w-4 h-4 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer"
                  title={`Remove ${appName}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {selectedApps.length === 0 && (
              <p className="text-xs text-slate-500 italic py-2">
                {lang === 'id'
                  ? 'Belum ada aplikasi yang dipilih. Klik salah satu paket di atas atau ketik nama aplikasi.'
                  : 'No apps selected yet. Click a preset pack above or type an app name.'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
