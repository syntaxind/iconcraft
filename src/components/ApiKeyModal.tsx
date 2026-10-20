import React, { useEffect, useState } from 'react';
import { X, KeyRound, ShieldAlert, ExternalLink, Trash2 } from 'lucide-react';
import { clearApiKey, saveApiKey, saveModel } from '../utils/apiKeyStore';
import { DEFAULT_TEXT_MODEL } from '../utils/geminiClient';

interface ApiKeyModalProps {
  lang: 'id' | 'en';
  apiKey: string;
  model: string;
  onSave: (key: string, model: string) => void;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ lang, apiKey, model, onSave, onClose }) => {
  const [key, setKey] = useState(apiKey);
  const [modelName, setModelName] = useState(model);
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const t = (id: string, en: string) => (lang === 'id' ? id : en);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSave = () => {
    const trimmed = key.trim();
    const m = modelName.trim() || DEFAULT_TEXT_MODEL;
    if (trimmed && remember) {
      saveApiKey(trimmed);
      saveModel(m === DEFAULT_TEXT_MODEL ? '' : m);
    } else {
      clearApiKey(); // not remembered: keep it in memory for this tab only
    }
    onSave(trimmed, m);
  };

  const handleRemove = () => {
    clearApiKey();
    saveModel('');
    onSave('', DEFAULT_TEXT_MODEL);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{t('Kunci API Gemini', 'Gemini API key')}</h3>
            <p className="text-xs text-slate-400">{t('Mengaktifkan ekstraksi Style DNA & ikon buatan AI', 'Enables AI Style DNA extraction & AI-made icons')}</p>
          </div>
        </div>

        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">API key</label>
        <div className="flex gap-2 mb-3">
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="AIza..."
            autoComplete="off"
            spellCheck={false}
            className="flex-1 px-3.5 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
          <button onClick={() => setShow(!show)} className="px-3 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 cursor-pointer">
            {show ? t('Sembunyi', 'Hide') : t('Lihat', 'Show')}
          </button>
        </div>

        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-indigo-300 hover:underline mb-4"
        >
          {t('Buat key gratis di Google AI Studio', 'Get a free key at Google AI Studio')}
          <ExternalLink className="w-3 h-3" />
        </a>

        <label className="flex items-start gap-2 text-xs text-slate-300 mb-4 cursor-pointer">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="mt-0.5" />
          <span>
            {t('Ingat di browser ini', 'Remember on this browser')}
            <span className="block text-[11px] text-slate-500">
              {t('Jika tidak dicentang, key hanya hidup sampai tab ditutup.', 'If unchecked, the key only lives until this tab is closed.')}
            </span>
          </span>
        </label>

        <details className="mb-4 text-xs text-slate-400">
          <summary className="cursor-pointer text-slate-300">{t('Lanjutan: nama model', 'Advanced: model name')}</summary>
          <input
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder={DEFAULT_TEXT_MODEL}
            spellCheck={false}
            className="mt-2 w-full px-3.5 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
          />
          <p className="mt-1 text-[11px] text-slate-500">{t('Ganti jika model default tidak tersedia untuk key kamu.', 'Change this if the default model is not available for your key.')}</p>
        </details>

        <div className="mb-5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-100/90 leading-relaxed flex gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            {t(
              'Key dikirim langsung dari browser kamu ke Google dan tidak melewati server mana pun. Pakai key pribadi, pasang batas kuota di AI Studio, dan jangan isi key di komputer umum. Hapus key lewat tombol di bawah bila perlu.',
              'The key goes straight from your browser to Google and never through any server. Use a personal key, set a quota limit in AI Studio, and do not enter it on a shared computer. Remove it with the button below at any time.',
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          {apiKey ? (
            <button onClick={handleRemove} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 rounded-xl cursor-pointer">
              <Trash2 className="w-3.5 h-3.5" />
              {t('Hapus key', 'Remove key')}
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={handleSave}
            disabled={!key.trim() && !apiKey}
            className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl cursor-pointer disabled:opacity-40"
          >
            {t('Simpan', 'Save')}
          </button>
        </div>
      </div>
    </div>
  );
};
