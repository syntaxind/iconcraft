import React, { useState } from 'react';
import { X, Smartphone, CheckCircle2, ChevronRight, HelpCircle, Layers, Sparkles } from 'lucide-react';

interface HowToInstallModalProps {
  lang: 'id' | 'en';
  onClose: () => void;
}

export const HowToInstallModal: React.FC<HowToInstallModalProps> = ({
  lang,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'launcher' | 'samsung' | 'shortcut'>('launcher');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {lang === 'id' ? 'Panduan Pasang Ikon di HP Android' : 'How to Apply Theme Icons on Android'}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'id'
                ? 'Tiga cara termudah memasang paket ikon tema di smartphone Android Anda'
                : 'Three simple ways to apply your custom theme icons on Android devices'}
            </p>
          </div>
        </div>

        {/* Method Tabs */}
        <div className="flex border-b border-slate-800 mb-4 gap-2">
          <button
            onClick={() => setActiveTab('launcher')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'launcher'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {lang === 'id' ? 'Nova / Lawnchair' : 'Nova / Lawnchair'}
          </button>
          <button
            onClick={() => setActiveTab('samsung')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'samsung'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {lang === 'id' ? 'Samsung One UI' : 'Samsung Galaxy'}
          </button>
          <button
            onClick={() => setActiveTab('shortcut')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'shortcut'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {lang === 'id' ? 'Shortcut Maker (Semua HP)' : 'Shortcut Maker (Any Phone)'}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3 text-xs text-slate-300 pr-1">
          {activeTab === 'launcher' && (
            <div className="space-y-3">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 font-medium leading-relaxed">
                {lang === 'id'
                  ? 'Metode ini paling fleksibel jika Anda menggunakan launcher pihak ketiga seperti Nova Launcher, Lawnchair, Smart Launcher, atau Niagara.'
                  : 'Best and most flexible option if you use third-party launchers like Nova, Lawnchair, or Smart Launcher.'}
              </div>

              <ol className="space-y-2.5 list-decimal list-inside leading-relaxed text-slate-300">
                <li className="pl-1">
                  <strong>Ekspor & Ekstrak ZIP</strong>: Unduh file ZIP dari tombol <em>"Ekspor Paket"</em> lalu ekstrak di memori internal HP (misal di folder Download).
                </li>
                <li className="pl-1">
                  <strong>Pilih Ikon di Layar Beranda</strong>: Tekan lama (long-press) ikon aplikasi yang ingin diubah (contoh: WhatsApp).
                </li>
                <li className="pl-1">
                  <strong>Klik Tombol Edit (Ikon Pensil)</strong>: Ketuk gambar ikon yang muncul pada jendela edit.
                </li>
                <li className="pl-1">
                  <strong>Pilih dari Galeri</strong>: Pilih opsi <em>"Galeri"</em> atau <em>"Pilih Gambar"</em>, lalu pilih gambar PNG dari folder <code className="text-indigo-300">res/drawable-xxxhdpi</code> atau <code className="text-indigo-300">drawable-nodpi</code>.
                </li>
                <li className="pl-1">
                  <strong>Selesai!</strong> Ikon tema baru Anda langsung aktif dan rapi di layar utama.
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'samsung' && (
            <div className="space-y-3">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 font-medium leading-relaxed">
                {lang === 'id'
                  ? 'Khusus pengguna Samsung Galaxy: Anda bisa mengganti seluruh tema ikon tanpa mengganti launcher One UI asli menggunakan Theme Park.'
                  : 'For Samsung Galaxy users: replace system icons without changing the default One UI launcher via Theme Park.'}
              </div>

              <ol className="space-y-2.5 list-decimal list-inside leading-relaxed text-slate-300">
                <li className="pl-1">
                  Buka <strong>Galaxy Store</strong> di HP Samsung Anda, lalu pasang aplikasi resmi Samsung <strong>Theme Park</strong> (atau Good Lock).
                </li>
                <li className="pl-1">
                  Buka <strong>Theme Park</strong> lalu buka tab <strong>"Icon"</strong> di bagian bawah.
                </li>
                <li className="pl-1">
                  Pilih <strong>"Create New"</strong> untuk membuat paket tema baru.
                </li>
                <li className="pl-1">
                  Ketuk aplikasi yang ingin diubah, pilih <em>"Gallery"</em>, lalu pilih file gambar PNG dari paket ini.
                </li>
                <li className="pl-1">
                  Tekan tombol <strong>Download / Install</strong> di pojok kanan atas, beri nama tema (misal: "IconCraft Theme"), lalu klik <strong>Apply</strong>!
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'shortcut' && (
            <div className="space-y-3">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 font-medium leading-relaxed">
                {lang === 'id'
                  ? 'Bisa digunakan di SEMUA merk HP (Xiaomi, Vivo, Oppo, Realme, Infinix, Google Pixel, Asus) tanpa mengganti launcher bawaan sama sekali.'
                  : 'Works on ANY Android brand (Pixel, Xiaomi, Vivo, Oppo, Realme) without replacing your stock launcher.'}
              </div>

              <ol className="space-y-2.5 list-decimal list-inside leading-relaxed text-slate-300">
                <li className="pl-1">
                  Unduh aplikasi gratis <strong>Shortcut Maker</strong> dari Google Play Store.
                </li>
                <li className="pl-1">
                  Buka Shortcut Maker lalu pilih menu <strong>"Apps"</strong>.
                </li>
                <li className="pl-1">
                  Pilih aplikasi yang ingin dibuat ikon temanya (misal: Kamera).
                </li>
                <li className="pl-1">
                  Ketuk opsi <strong>"Icon"</strong> lalu pilih <strong>"Image"</strong> / Galeri foto.
                </li>
                <li className="pl-1">
                  Pilih gambar PNG ikon tema yang sudah diunduh.
                </li>
                <li className="pl-1">
                  Klik <strong>"Create Shortcut"</strong> (Buat Pintasan). Pintasan ikon tema cantik langsung muncul di layar utama Android Anda!
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow cursor-pointer transition-all"
          >
            {lang === 'id' ? 'Mengerti, Tutup' : 'Got it, Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
