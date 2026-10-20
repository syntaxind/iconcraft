import React from 'react';
import { Sparkles, HelpCircle, Download, KeyRound } from 'lucide-react';

interface NavbarProps {
  lang: 'id' | 'en';
  setLang: (lang: 'id' | 'en') => void;
  onOpenHelp: () => void;
  onOpenExport: () => void;
  readyIconCount: number;
  onOpenApiKey: () => void;
  hasApiKey: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  setLang,
  onOpenHelp,
  onOpenExport,
  readyIconCount,
  onOpenApiKey,
  hasApiKey,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                IconCraft AI
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md">
                Android Theme
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {lang === 'id' ? 'Pembuat Ikon Tema Android Massal' : 'Bulk Android Theme Icon Generator'}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenApiKey}
            className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-all cursor-pointer"
            title={lang === 'id' ? 'Kunci API Gemini' : 'Gemini API key'}
            aria-label={lang === 'id' ? 'Kunci API Gemini' : 'Gemini API key'}
          >
            <KeyRound className={`w-4 h-4 ${hasApiKey ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">{lang === 'id' ? 'Kunci AI' : 'AI key'}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${hasApiKey ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          </button>

          {/* Help button */}
          <button
            onClick={onOpenHelp}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-all"
            title={lang === 'id' ? 'Panduan Pasang di Android' : 'Android Install Guide'}
          >
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">
              {lang === 'id' ? 'Cara Pasang di HP' : 'Install Guide'}
            </span>
          </button>

          {/* Export Button */}
          <button
            onClick={onOpenExport}
            disabled={readyIconCount === 0}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all ${
              readyIconCount > 0
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-indigo-500/20 cursor-pointer'
                : 'bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{lang === 'id' ? 'Ekspor Paket' : 'Export Pack'}</span>
            {readyIconCount > 0 && (
              <span className="px-1.5 py-0.2 bg-white/20 text-white rounded text-[10px] font-bold">
                {readyIconCount}
              </span>
            )}
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
            className="px-2.5 py-1 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-all uppercase tracking-wider"
            title="Toggle Language"
            aria-label="Toggle language"
          >
            {lang === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}
          </button>
        </div>
      </div>
    </header>
  );
};
