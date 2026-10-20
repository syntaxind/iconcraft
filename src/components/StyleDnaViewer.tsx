import React, { useRef, useState } from 'react';
import type { IconShape, PatternType, StyleDNA } from '../types/iconTheme';
import { Sliders, ChevronDown, ChevronUp, RotateCcw, Zap, RefreshCw, Save, Trash2, Download, Upload, FolderOpen } from 'lucide-react';
import { ALL_SHAPES } from '../shared/shapes';
import { DEFAULT_PATTERN, PATTERN_TYPES, getPattern, safeColor } from '../shared/dna';
import { deletePreset, loadSavedPresets, mergePresets, parsePresetsJson, presetsToJson, savePreset, type SavedPreset } from '../utils/dnaPresets';
import { downloadBlob } from '../utils/download';

interface StyleDnaViewerProps {
  lang: 'id' | 'en';
  styleDNA: StyleDNA;
  onUpdateDNA: (updated: StyleDNA) => void;
  /** DNA as it was loaded (preset / AI analysis / saved preset); the target of "Reset". */
  baselineDna: StyleDNA;
  /** Number of icons whose artwork no longer matches the current DNA. */
  outdatedCount: number;
  isBusy: boolean;
  onApplyToIcons: () => void;
  onRegenerateAll: () => void;
  /** Loads a DNA from a saved preset (also becomes the new reset baseline). */
  onLoadDna: (dna: StyleDNA) => void;
  notify: (kind: 'error' | 'success' | 'info', text: string) => void;
}

const FINISHES: StyleDNA['visualDNA']['finish'][] = ['3d-clay', 'glassmorphism', 'flat-minimal', 'neumorphism', 'neon-glyph', 'retro-pixel', 'skeuomorphic', 'material-you', 'gradient-duotone'];
const STROKES: StyleDNA['visualDNA']['strokeWeight'][] = ['none', 'thin', 'medium', 'bold'];
const ELEVATIONS: StyleDNA['visualDNA']['elevation'][] = ['flat', 'subtle-float', 'deep-3d', 'pressed-inset'];
const BORDERS: StyleDNA['visualDNA']['borderEffect'][] = ['none', 'frosted-rim', 'neon-stroke', 'inner-bevel', 'soft-ring'];

const PATTERN_LABELS: Record<PatternType, { id: string; en: string }> = {
  none: { id: 'Polos', en: 'None' },
  dots: { id: 'Titik', en: 'Dots' },
  halftone: { id: 'Halftone', en: 'Halftone' },
  grid: { id: 'Grid', en: 'Grid' },
  lines: { id: 'Garis', en: 'Lines' },
  diagonal: { id: 'Diagonal', en: 'Diagonal' },
  hex: { id: 'Heksagon', en: 'Hex' },
  constellation: { id: 'Konstelasi', en: 'Constellation' },
};

/** <input type="color"> only understands #rrggbb; convert any CSS colour we may hold. */
function toHex6(value: string, fallback = '#000000'): string {
  const v = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(v)) return ('#' + v.slice(1).split('').map((c) => c + c).join('')).toLowerCase();
  if (/^#[0-9a-f]{8}$/i.test(v)) return v.slice(0, 7).toLowerCase();
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillStyle = v;
      const out = ctx.fillStyle;
      if (/^#[0-9a-f]{6}$/i.test(out)) return out.toLowerCase();
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

const ColorField: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950/70 border border-slate-800">
      <input
        type="color"
        aria-label={label}
        value={toHex6(value)}
        onChange={(e) => onChange(e.target.value)}
        className="w-7 h-7 rounded-md border border-white/20 bg-transparent cursor-pointer p-0 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <span className="text-[9px] text-slate-400 block leading-none mb-0.5">{label}</span>
        <input
          type="text"
          value={draft ?? value}
          spellCheck={false}
          onChange={(e) => {
            setDraft(e.target.value);
            const next = safeColor(e.target.value, '');
            if (next) onChange(next);
          }}
          onBlur={() => setDraft(null)}
          className="w-full bg-transparent text-[11px] font-mono text-slate-200 focus:outline-none"
        />
      </div>
    </div>
  );
};

function SelectField<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly T[]; onChange: (v: T) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

const Slider: React.FC<{ label: string; value: number; min: number; max: number; step: number; display: string; onChange: (v: number) => void }> = ({ label, value, min, max, step, display, onChange }) => (
  <label className="block">
    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex justify-between mb-1">
      <span>{label}</span>
      <span className="font-mono text-slate-300 normal-case">{display}</span>
    </span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-indigo-500 cursor-pointer" />
  </label>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">{children}</h4>
);

export const StyleDnaViewer: React.FC<StyleDnaViewerProps> = ({
  lang,
  styleDNA,
  onUpdateDNA,
  baselineDna,
  outdatedCount,
  isBusy,
  onApplyToIcons,
  onRegenerateAll,
  onLoadDna,
  notify,
}) => {
  const t = (id: string, en: string) => (lang === 'id' ? id : en);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [presets, setPresets] = useState<SavedPreset[]>(() => loadSavedPresets());
  const [presetName, setPresetName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const c = styleDNA.colors;
  const v = styleDNA.visualDNA;
  const pat = getPattern(styleDNA);
  const grad = c.backgroundGradient;
  const angle = Math.round(parseFloat(grad.angle) || 0);

  const setColors = (patch: Partial<StyleDNA['colors']>) => onUpdateDNA({ ...styleDNA, colors: { ...c, ...patch } });
  const setGradient = (patch: Partial<StyleDNA['colors']['backgroundGradient']>) =>
    setColors({ backgroundGradient: { ...grad, ...patch } });
  const setVisual = (patch: Partial<StyleDNA['visualDNA']>) => onUpdateDNA({ ...styleDNA, visualDNA: { ...v, ...patch } });
  const setPattern = (patch: Partial<typeof pat>) => onUpdateDNA({ ...styleDNA, pattern: { ...pat, ...patch } });

  const isDirty = JSON.stringify(styleDNA) !== JSON.stringify(baselineDna);

  const handleSavePreset = () => {
    const name = presetName.trim() || styleDNA.styleName;
    setPresets((list) => savePreset(list, name, styleDNA));
    setPresetName('');
    notify('success', t(`Preset "${name}" tersimpan di browser ini.`, `Preset "${name}" saved in this browser.`));
  };

  const handleExport = () => {
    if (presets.length === 0) {
      notify('info', t('Belum ada preset tersimpan untuk diekspor.', 'No saved presets to export yet.'));
      return;
    }
    downloadBlob(new Blob([presetsToJson(presets)], { type: 'application/json' }), 'iconcraft_dna_presets.json');
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error(t('Berkas terlalu besar.', 'File is too large.'));
      const incoming = parsePresetsJson(await file.text());
      setPresets((list) => mergePresets(list, incoming));
      notify('success', t(`${incoming.length} preset diimpor.`, `${incoming.length} preset(s) imported.`));
    } catch (err) {
      notify('error', (err as Error).message);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-base font-extrabold text-white tracking-tight">{styleDNA.styleName}</h3>
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase bg-slate-800 text-indigo-400 border border-indigo-500/20 rounded">{v.finish}</span>
            {pat.type !== 'none' && (
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase bg-slate-800 text-emerald-300 border border-emerald-500/20 rounded">{pat.type}</span>
            )}
          </div>
          {styleDNA.summary && <p className="text-xs text-slate-300 mt-1 max-w-2xl">{styleDNA.summary}</p>}
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-expanded={showAdvanced}
          className="flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition-all cursor-pointer shrink-0"
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span>{showAdvanced ? t('Tutup Editor DNA', 'Close DNA editor') : t('Edit DNA, Warna & Pattern', 'Edit DNA, colors & pattern')}</span>
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Quick palette */}
      <div className="flex flex-wrap items-center gap-1.5 mb-1">
        {[c.primary, c.secondary, grad.from, grad.to, c.glyphColor, c.accentColor].map((col, i) => (
          <span key={i} className="w-6 h-6 rounded-md border border-white/20 shadow-sm" style={{ backgroundColor: col }} title={col} />
        ))}
        <span className="text-[11px] text-slate-400 ml-1">
          {t('Klik "Edit DNA" untuk mengubah warna & atribut.', 'Open "Edit DNA" to change colors & attributes.')}
        </span>
      </div>

      {/* Out-of-date banner: DNA changed after icons were made */}
      {outdatedCount > 0 && (
        <div className="mt-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center gap-2.5">
          <p className="text-xs text-amber-100 flex-1 leading-relaxed">
            {t(
              `DNA sudah diubah. ${outdatedCount} ikon masih memakai DNA lama.`,
              `DNA was changed. ${outdatedCount} icon(s) still use the old DNA.`,
            )}
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onApplyToIcons}
              disabled={isBusy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg cursor-pointer disabled:opacity-50"
              title={t('Instan & gratis: warna/pattern diterapkan ke ikon yang ada', 'Instant & free: recolors/applies pattern to existing icons')}
            >
              <Zap className="w-3.5 h-3.5" />
              {t('Terapkan ke ikon', 'Apply to icons')}
            </button>
            <button
              onClick={onRegenerateAll}
              disabled={isBusy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-100 bg-slate-900/70 hover:bg-slate-800 border border-amber-500/30 rounded-lg cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t('Buat ulang semua', 'Regenerate all')}
            </button>
          </div>
        </div>
      )}

      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-5 text-xs">
          {/* Name + reset */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <label className="flex-1 block">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">{t('Nama gaya', 'Style name')}</span>
              <input
                type="text"
                value={styleDNA.styleName}
                maxLength={80}
                onChange={(e) => onUpdateDNA({ ...styleDNA, styleName: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </label>
            <button
              onClick={() => onUpdateDNA(baselineDna)}
              disabled={!isDirty}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t('Reset ke DNA awal', 'Reset to original DNA')}
            </button>
          </div>

          {/* Colors */}
          <div>
            <SectionTitle>{t('Warna', 'Colors')}</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <ColorField label="Gradient from" value={grad.from} onChange={(x) => setGradient({ from: x })} />
              <ColorField label="Gradient to" value={grad.to} onChange={(x) => setGradient({ to: x })} />
              <ColorField label="Glyph" value={c.glyphColor} onChange={(x) => setColors({ glyphColor: x })} />
              <ColorField label="Accent" value={c.accentColor} onChange={(x) => setColors({ accentColor: x })} />
              <ColorField label="Primary" value={c.primary} onChange={(x) => setColors({ primary: x })} />
              <ColorField label="Secondary" value={c.secondary} onChange={(x) => setColors({ secondary: x })} />
              <ColorField label="Background" value={c.background} onChange={(x) => setColors({ background: x })} />
              <ColorField label="Shadow" value={c.shadowColor} onChange={(x) => setColors({ shadowColor: x })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">{t('Tipe gradien', 'Gradient type')}</span>
                <div className="flex gap-2">
                  {(['linear', 'radial'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGradient({ type: g })}
                      aria-pressed={grad.type === g}
                      className={`flex-1 px-3 py-1.5 rounded-lg border text-xs cursor-pointer ${grad.type === g ? 'border-indigo-500 bg-indigo-500/20 text-white font-bold' : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <Slider label={t('Sudut gradien', 'Gradient angle')} value={angle} min={0} max={360} step={5} display={`${angle}°`} onChange={(n) => setGradient({ angle: `${n}deg` })} />
            </div>
          </div>

          {/* Attributes */}
          <div>
            <SectionTitle>{t('Atribut visual', 'Visual attributes')}</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SelectField label="Finish" value={v.finish} options={FINISHES} onChange={(x) => setVisual({ finish: x })} />
              <SelectField label="Stroke" value={v.strokeWeight} options={STROKES} onChange={(x) => setVisual({ strokeWeight: x })} />
              <SelectField label="Elevation" value={v.elevation} options={ELEVATIONS} onChange={(x) => setVisual({ elevation: x })} />
              <SelectField label="Border" value={v.borderEffect} options={BORDERS} onChange={(x) => setVisual({ borderEffect: x })} />
            </div>
            <label className="block mt-3">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">{t('Pencahayaan', 'Lighting')}</span>
              <input
                type="text"
                value={v.lighting}
                maxLength={200}
                onChange={(e) => setVisual({ lighting: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </label>
          </div>

          {/* Shape */}
          <div>
            <SectionTitle>{t('Bentuk ikon (mask)', 'Icon shape (mask)')}</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {ALL_SHAPES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setVisual({ shapeCurvature: s.id as IconShape })}
                  aria-pressed={v.shapeCurvature === s.id}
                  className={`px-3 py-2 text-left rounded-lg border transition-all cursor-pointer ${v.shapeCurvature === s.id ? 'border-indigo-500 bg-indigo-500/20 text-white font-bold' : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'}`}
                >
                  {s.short}
                </button>
              ))}
            </div>
          </div>

          {/* Pattern */}
          <div>
            <SectionTitle>{t('Pattern latar (ikon + folder)', 'Background pattern (icons + folder)')}</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {PATTERN_TYPES.map((p) => (
                <button
                  key={p}
                  onClick={() => setPattern(p === 'none' ? { type: p } : { type: p, opacity: pat.type === 'none' ? DEFAULT_PATTERN.opacity : pat.opacity })}
                  aria-pressed={pat.type === p}
                  className={`px-3 py-1.5 rounded-lg border text-xs cursor-pointer ${pat.type === p ? 'border-indigo-500 bg-indigo-500/20 text-white font-bold' : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'}`}
                >
                  {PATTERN_LABELS[p][lang]}
                </button>
              ))}
            </div>
            {pat.type !== 'none' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <ColorField label={t('Warna pattern', 'Pattern color')} value={pat.color} onChange={(x) => setPattern({ color: x })} />
                <Slider label={t('Opasitas', 'Opacity')} value={pat.opacity} min={0.02} max={0.6} step={0.01} display={`${Math.round(pat.opacity * 100)}%`} onChange={(n) => setPattern({ opacity: n })} />
                <Slider label={t('Skala', 'Scale')} value={pat.scale} min={0.5} max={3} step={0.1} display={`×${pat.scale.toFixed(1)}`} onChange={(n) => setPattern({ scale: n })} />
              </div>
            )}
            <p className="text-[10px] text-slate-500 mt-1.5">
              {t(
                'Pattern tergambar langsung di latar tiap ikon (generator offline). Ikon buatan AI hanya mendapat petunjuk pattern lewat prompt saat dibuat ulang.',
                'The pattern is drawn straight into each icon background (offline generator). AI-made icons only get the pattern as a prompt hint when regenerated.',
              )}
            </p>
          </div>

          {/* Rules */}
          <div>
            <SectionTitle>{t('Aturan replikasi gaya AI (prompt)', 'AI style replication rules (prompt)')}</SectionTitle>
            <textarea
              value={styleDNA.replicationRules}
              maxLength={1500}
              rows={4}
              onChange={(e) => onUpdateDNA({ ...styleDNA, replicationRules: e.target.value })}
              className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-300 leading-relaxed focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Saved presets */}
          <div className="pt-4 border-t border-slate-800">
            <SectionTitle>{t('Preset DNA saya', 'My DNA presets')}</SectionTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={presetName}
                maxLength={60}
                placeholder={t('Nama preset (opsional)', 'Preset name (optional)')}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                className="flex-1 px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button onClick={handleSavePreset} className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg cursor-pointer">
                <Save className="w-3.5 h-3.5" />
                {t('Simpan DNA ini', 'Save this DNA')}
              </button>
              <button onClick={handleExport} className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700 rounded-lg cursor-pointer">
                <Download className="w-3.5 h-3.5" />
                JSON
              </button>
              <button onClick={() => fileRef.current?.click()} className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700 rounded-lg cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                {t('Impor', 'Import')}
              </button>
              <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => handleImport(e.target.files?.[0])} />
            </div>

            {presets.length === 0 ? (
              <p className="text-[11px] text-slate-500 mt-2">
                {t('Belum ada preset. Preset disimpan di browser ini; ekspor JSON untuk cadangan atau pindah perangkat.', 'No presets yet. Presets live in this browser; export JSON to back up or move devices.')}
              </p>
            ) : (
              <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {presets.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="flex shrink-0">
                      {[p.dna.colors.backgroundGradient.from, p.dna.colors.backgroundGradient.to, p.dna.colors.accentColor].map((col, i) => (
                        <span key={i} className="w-4 h-4 rounded-full border border-slate-900 -ml-1 first:ml-0" style={{ backgroundColor: col }} />
                      ))}
                    </span>
                    <span className="flex-1 min-w-0 text-xs text-slate-200 truncate" title={p.name}>{p.name}</span>
                    <button onClick={() => onLoadDna(p.dna)} aria-label={t('Muat preset', 'Load preset')} title={t('Muat', 'Load')} className="p-1.5 rounded-md text-indigo-300 hover:bg-slate-800 cursor-pointer">
                      <FolderOpen className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setPresets((list) => deletePreset(list, p.id))} aria-label={t('Hapus preset', 'Delete preset')} title={t('Hapus', 'Delete')} className="p-1.5 rounded-md text-rose-300 hover:bg-slate-800 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
