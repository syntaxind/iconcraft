import React, { useState } from 'react';
import { GeneratedIconItem, IconShape } from '../types/iconTheme';
import { Smartphone, Mic, Wifi, BatteryMedium } from 'lucide-react';
import { IconTile } from './IconTile';
import { ALL_SHAPES } from '../shared/shapes';

interface AndroidPhonePreviewProps {
  lang: 'id' | 'en';
  icons: GeneratedIconItem[];
  activeShape: IconShape;
  onChangeShape: (shape: IconShape) => void;
  onSelectIconForDetail: (icon: GeneratedIconItem) => void;
}

const WALLPAPERS = [
  {
    id: 'oled-dark',
    name: 'OLED Dark',
    style: 'bg-gradient-to-b from-slate-950 via-zinc-900 to-black',
  },
  {
    id: 'cyber-neon',
    name: 'Cyberpunk',
    style: 'bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950',
  },
  {
    id: 'material-flora',
    name: 'Material You',
    style: 'bg-gradient-to-b from-emerald-950 via-slate-900 to-teal-950',
  },
  {
    id: 'sunset-amber',
    name: 'Sunset Glow',
    style: 'bg-gradient-to-b from-amber-950 via-stone-900 to-slate-950',
  },
];

export const AndroidPhonePreview: React.FC<AndroidPhonePreviewProps> = ({
  lang,
  icons,
  activeShape,
  onChangeShape,
  onSelectIconForDetail,
}) => {
  const [selectedWallpaper, setSelectedWallpaper] = useState(WALLPAPERS[0].id);
  const [showLabels, setShowLabels] = useState(true);

  // Group ready icons
  const readyIcons = icons.filter((i) => i.status === 'ready' && (i.svg || i.imageUrl));

  // Dock apps (defaults)
  const dockAppNames = ['Phone', 'Messages', 'WhatsApp', 'Chrome'];
  const dockIcons = dockAppNames.map((name) => {
    return readyIcons.find((i) => i.appName.toLowerCase() === name.toLowerCase()) || {
      id: `dock-${name}`,
      appName: name,
      category: 'system' as const,
      status: 'pending' as const,
      updatedAt: 0,
    };
  });

  // Home grid apps (up to 12 apps on first screen)
  const gridIcons = readyIcons.length > 0 ? readyIcons.slice(0, 12) : icons.slice(0, 8);

  const activeWallpaperStyle = WALLPAPERS.find((w) => w.id === selectedWallpaper)?.style || WALLPAPERS[0].style;

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {lang === 'id' ? 'Simulator Beranda Android' : 'Live Android Launcher Preview'}
          </h3>
        </div>

        {/* Shape and controls */}
        <div className="flex flex-wrap items-center justify-end gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          {ALL_SHAPES.map(({ id: shape, short }) => (
            <button
              key={shape}
              onClick={() => onChangeShape(shape)}
              aria-pressed={activeShape === shape}
              className={`px-2 py-1 text-[10px] font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                activeShape === shape
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {short}
            </button>
          ))}
        </div>
      </div>

      {/* Realistic Android Phone Device Shell */}
      <div className="relative w-[290px] sm:w-[320px] h-[590px] sm:h-[630px] bg-slate-950 rounded-[44px] p-3 shadow-2xl border-4 border-slate-700/80 ring-1 ring-white/10 overflow-hidden flex flex-col select-none">
        {/* Outer Frame Edge Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-950 rounded-b-xl z-30 flex items-center justify-center">
          {/* Camera punch hole */}
          <div className="w-3.5 h-3.5 rounded-full bg-slate-900 ring-2 ring-slate-800/80 shadow-inner" />
        </div>

        {/* Screen Display Area */}
        <div className={`relative w-full h-full rounded-[34px] overflow-hidden flex flex-col justify-between p-3.5 ${activeWallpaperStyle} transition-colors duration-500`}>
          {/* Subtle Ambient Wallpaper Glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 pointer-events-none" />

          {/* Top Status Bar */}
          <div className="relative z-10 flex items-center justify-between text-[11px] font-semibold text-slate-200 px-1 pt-1.5">
            <span>{timeStr}</span>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="text-[10px] font-bold">5G</span>
              <Wifi className="w-3.5 h-3.5" />
              <BatteryMedium className="w-4 h-4" />
            </div>
          </div>

          {/* Android At-A-Glance Widget */}
          <div className="relative z-10 px-2 mt-4 text-left">
            <p className="text-xs font-semibold text-white/90 drop-shadow-md">
              {dateStr} • 29°C ☀️
            </p>
            <p className="text-[11px] text-white/70 drop-shadow">
              {readyIcons.length > 0
                ? `${readyIcons.length} ${lang === 'id' ? 'ikon tema aktif' : 'themed icons active'}`
                : lang === 'id' ? 'Menunggu generate ikon...' : 'Waiting for batch icons...'}
            </p>
          </div>

          {/* Home App Grid (4 Columns) */}
          <div className="relative z-10 flex-1 grid grid-cols-4 content-start gap-y-3.5 gap-x-2 px-1 pt-5">
            {gridIcons.map((item) => {
              const isReady = item.status === 'ready' && (item.svg || item.imageUrl);
              return (
                <div
                  key={item.id}
                  onClick={() => isReady && onSelectIconForDetail(item)}
                  className={`flex flex-col items-center group ${isReady ? 'cursor-pointer active:scale-95' : 'opacity-40'} transition-transform`}
                >
                  <IconTile icon={item} shape={activeShape} className="w-12 h-12 shadow-lg transition-all group-hover:scale-105" />
                  {showLabels && (
                    <span className="text-[10px] font-medium text-white/90 drop-shadow-md truncate max-w-[58px] mt-1 text-center">
                      {item.appName}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Area: Search Bar & Floating Dock */}
          <div className="relative z-10 space-y-3 pb-1">
            {/* Google Search Bar Pill Widget */}
            <div className="w-full h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-3 flex items-center justify-between text-white/80 shadow-md">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs tracking-tight bg-gradient-to-r from-blue-400 via-rose-400 to-amber-300 bg-clip-text text-transparent">
                  G
                </span>
                <span className="text-[11px] text-white/60">
                  {lang === 'id' ? 'Telusuri...' : 'Search...'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <Mic className="w-3.5 h-3.5" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/40" />
              </div>
            </div>

            {/* Bottom Dock (Favorites) */}
            <div className="w-full pt-2 pb-1 bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl px-2 flex items-center justify-around shadow-lg">
              {dockIcons.map((dockItem) => (
                <div
                  key={dockItem.id}
                  onClick={() => dockItem.status === 'ready' && onSelectIconForDetail(dockItem)}
                  className="flex flex-col items-center group cursor-pointer active:scale-95 transition-transform"
                >
                  <IconTile icon={dockItem} shape={activeShape} className="w-11 h-11 shadow-md" />
                </div>
              ))}
            </div>

            {/* Android Navigation Pill */}
            <div className="flex justify-center pt-1">
              <div className="w-24 h-1 rounded-full bg-white/40" />
            </div>
          </div>
        </div>
      </div>

      {/* Simulator Quick Toggles */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
        {WALLPAPERS.map((wp) => (
          <button
            key={wp.id}
            onClick={() => setSelectedWallpaper(wp.id)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
              selectedWallpaper === wp.id
                ? 'border-indigo-500 bg-indigo-500/20 text-white'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            {wp.name}
          </button>
        ))}

        <button
          onClick={() => setShowLabels(!showLabels)}
          className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 text-[11px] font-semibold cursor-pointer"
        >
          {showLabels ? (lang === 'id' ? 'Sembunyikan Nama' : 'Hide Labels') : (lang === 'id' ? 'Tampilkan Nama' : 'Show Labels')}
        </button>
      </div>
    </div>
  );
};
