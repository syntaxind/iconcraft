import { PresetStyle, StyleDNA } from '../types/iconTheme';

export const ANDROID_PACKAGE_MAPPINGS: Record<string, { packageName: string; component: string }> = {
  WhatsApp: { packageName: 'com.whatsapp', component: 'com.whatsapp.HomeActivity' },
  Instagram: { packageName: 'com.instagram.android', component: 'com.instagram.mainactivity.MainActivity' },
  Camera: { packageName: 'com.google.android.GoogleCamera', component: 'com.android.camera.CameraLauncher' },
  Gallery: { packageName: 'com.google.android.apps.photos', component: 'com.google.android.apps.photos.home.HomeActivity' },
  Settings: { packageName: 'com.android.settings', component: 'com.android.settings.Settings' },
  Phone: { packageName: 'com.google.android.dialer', component: 'com.google.android.dialer.extensions.GoogleDialtactsActivity' },
  Messages: { packageName: 'com.google.android.apps.messaging', component: 'com.google.android.apps.messaging.ui.ConversationListActivity' },
  Chrome: { packageName: 'com.android.chrome', component: 'com.google.android.apps.chrome.Main' },
  YouTube: { packageName: 'com.google.android.youtube', component: 'com.google.android.youtube.HomeActivity' },
  Spotify: { packageName: 'com.spotify.music', component: 'com.spotify.music.MainActivity' },
  Netflix: { packageName: 'com.netflix.mediaclient', component: 'com.netflix.mediaclient.ui.launch.UIWebViewActivity' },
  Clock: { packageName: 'com.google.android.deskclock', component: 'com.android.deskclock.DeskClock' },
  Calculator: { packageName: 'com.google.android.calculator', component: 'com.android.calculator2.Calculator' },
  Files: { packageName: 'com.google.android.documentsui', component: 'com.android.documentsui.FilesActivity' },
  Calendar: { packageName: 'com.google.android.calendar', component: 'com.android.calendar.AllInOneActivity' },
  Gmail: { packageName: 'com.google.android.gm', component: 'com.google.android.gm.ConversationListActivityGmail' },
  Maps: { packageName: 'com.google.android.apps.maps', component: 'com.google.android.maps.MapsActivity' },
  Telegram: { packageName: 'org.telegram.messenger', component: 'org.telegram.ui.LaunchActivity' },
  TikTok: { packageName: 'com.zhiliaoapp.musically', component: 'com.ss.android.ugc.aweme.splash.SplashActivity' },
  'Play Store': { packageName: 'com.android.vending', component: 'com.android.vending.AssetBrowserActivity' },
  Notes: { packageName: 'com.google.android.keep', component: 'com.google.android.apps.keep.ui.BrowseActivity' },
  Weather: { packageName: 'com.google.android.apps.weather', component: 'com.google.android.apps.weather.WeatherActivity' },
  Contacts: { packageName: 'com.google.android.contacts', component: 'com.android.contacts.activities.PeopleActivity' },
  Discord: { packageName: 'com.discord', component: 'com.discord.main.MainActivity' },
  Facebook: { packageName: 'com.facebook.katana', component: 'com.facebook.katana.LoginActivity' },
  Messenger: { packageName: 'com.facebook.orca', component: 'com.facebook.orca.auth.StartScreenActivity' },
  Drive: { packageName: 'com.google.android.apps.docs', component: 'com.google.android.apps.docs.app.NewMainProxyActivity' },
  Photos: { packageName: 'com.google.android.apps.photos', component: 'com.google.android.apps.photos.home.HomeActivity' },
  Translate: { packageName: 'com.google.android.apps.translate', component: 'com.google.android.apps.translate.TranslateActivity' },
  Zoom: { packageName: 'us.zoom.videomeetings', component: 'com.zipow.videobox.LauncherActivity' },
  Shopee: { packageName: 'com.shopee.id', component: 'com.shopee.app.ui.home.HomeActivity_' },
  Tokopedia: { packageName: 'com.tokopedia.tkpd', component: 'com.tokopedia.navigation.presentation.activity.MainParentActivity' },
  CapCut: { packageName: 'com.lemon.lvoverseas', component: 'com.vega.main.MainActivity' },
  Snapchat: { packageName: 'com.snapchat.android', component: 'com.snap.mushroom.MainActivity' },
  'X / Twitter': { packageName: 'com.twitter.android', component: 'com.twitter.android.MainActivity' },
};

/**
 * Extra launcher components used by Xiaomi (MIUI / HyperOS) system apps.
 * These are best-effort candidates: a component that does not exist on a device is
 * simply ignored by the launcher, so listing several is harmless. Verify on-device
 * (e.g. with `adb shell cmd package resolve-activity --brief <package>`).
 */
export const XIAOMI_COMPONENT_CANDIDATES: Record<string, { packageName: string; component: string }[]> = {
  Camera: [{ packageName: 'com.android.camera', component: 'com.android.camera.Camera' }],
  Gallery: [{ packageName: 'com.miui.gallery', component: 'com.miui.gallery.activity.HomePageActivity' }],
  Settings: [{ packageName: 'com.android.settings', component: 'com.android.settings.MainSettings' }],
  Calculator: [{ packageName: 'com.miui.calculator', component: 'com.miui.calculator.cal.CalculatorActivity' }],
  Clock: [{ packageName: 'com.android.deskclock', component: 'com.android.deskclock.DeskClockTabActivity' }],
  Contacts: [{ packageName: 'com.android.contacts', component: 'com.android.contacts.activities.TwoPanesActivity' }],
  Messages: [{ packageName: 'com.android.mms', component: 'com.android.mms.ui.MmsTabActivity' }],
  Notes: [{ packageName: 'com.miui.notes', component: 'com.miui.notes.ui.NotesListActivity' }],
};

/** All known launcher components (stock Android + Xiaomi) for an app label. */
export function getComponentCandidates(appName: string): { packageName: string; component: string }[] {
  const key = Object.keys(ANDROID_PACKAGE_MAPPINGS).find((k) => k.toLowerCase() === appName.toLowerCase());
  const xiaomiKey = Object.keys(XIAOMI_COMPONENT_CANDIDATES).find((k) => k.toLowerCase() === appName.toLowerCase());
  return [...(key ? [ANDROID_PACKAGE_MAPPINGS[key]] : []), ...(xiaomiKey ? XIAOMI_COMPONENT_CANDIDATES[xiaomiKey] : [])];
}

export const APP_PACK_PRESETS = [
  {
    id: 'essentials',
    name: 'Paket Android Utama (Essentials)',
    description: '12 aplikasi sistem & harian paling sering digunakan',
    apps: ['WhatsApp', 'Camera', 'Gallery', 'Phone', 'Messages', 'Settings', 'Chrome', 'Clock', 'Files', 'Calculator', 'Calendar', 'Gmail'],
  },
  {
    id: 'system',
    name: 'Sistem Android/Xiaomi',
    description: 'Aplikasi bawaan HP',
    apps: ['Phone', 'Messages', 'Contacts', 'Camera', 'Gallery', 'Settings', 'Clock', 'Calculator', 'Calendar', 'Notes', 'Files', 'Weather', 'Recorder', 'Compass', 'Music', 'Video', 'Browser', 'Security', 'Themes', 'Mi Home', 'Mi Fitness'],
  },
  {
    id: 'social',
    name: 'Paket Sosial & Media',
    description: 'Aplikasi obrolan, streaming video, dan musik populer',
    apps: ['WhatsApp', 'Instagram', 'TikTok', 'YouTube', 'Spotify', 'Netflix', 'Telegram', 'Discord', 'X / Twitter'],
  },
  {
    id: 'social_full',
    name: 'Media Sosial Lengkap',
    description: 'Semua jejaring sosial & chat',
    apps: ['WhatsApp', 'Instagram', 'Facebook', 'Messenger', 'TikTok', 'Telegram', 'Twitter', 'Threads', 'Snapchat', 'Pinterest', 'LinkedIn', 'Discord', 'Line', 'Reddit'],
  },
  {
    id: 'entertainment',
    name: 'Hiburan & Musik',
    description: 'Streaming video dan musik',
    apps: ['YouTube', 'Spotify', 'Netflix', 'Disney+', 'Vidio', 'Viu', 'WeTV', 'Twitch', 'SoundCloud', 'Joox', 'Podcasts'],
  },
  {
    id: 'google_workspace',
    name: 'Paket Google Suite & Produktivitas',
    description: 'Alat kerja, navigasi, dan catatan Google ecosystem',
    apps: ['Gmail', 'Maps', 'Chrome', 'Calendar', 'Notes', 'Files', 'Play Store', 'Weather', 'Contacts', 'Drive', 'Photos', 'Translate', 'Google Meet', 'Docs', 'Sheets', 'Slides', 'Gemini'],
  },
  {
    id: 'shopping_id',
    name: 'Belanja & Transportasi (ID)',
    description: 'E-commerce, ojek online, tiket',
    apps: ['Tokopedia', 'Shopee', 'Lazada', 'Bukalapak', 'Blibli', 'TikTok Shop', 'OLX', 'Gojek', 'Grab', 'Maxim', 'inDrive', 'Traveloka', 'Tiket.com', 'KAI Access'],
  },
  {
    id: 'finance_id',
    name: 'Dompet Digital, Bank & Operator (ID)',
    description: 'Pembayaran, perbankan, pulsa & listrik',
    apps: ['GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja', 'BCA Mobile', 'myBCA', 'BRImo', 'Livin Mandiri', 'BNI Mobile', 'Jago', 'SeaBank', 'Blu', 'Jenius', 'Flip', 'MyTelkomsel', 'by.U', 'myXL', 'Indosat', 'Tri', 'PLN Mobile', 'MyPertamina'],
  },
  {
    id: 'work_creator',
    name: 'Kerja & Kreator',
    description: 'Meeting, dokumen, desain, edit video',
    apps: ['Zoom', 'Teams', 'Slack', 'Trello', 'Notion', 'Word', 'Excel', 'PowerPoint', 'PDF Reader', 'CapCut', 'VN', 'Canva', 'Lightroom', 'Snapseed', 'PicsArt'],
  },
  {
    id: 'games_ai',
    name: 'Game & AI',
    description: 'Game populer dan asisten AI',
    apps: ['Mobile Legends', 'Free Fire', 'PUBG Mobile', 'Genshin Impact', 'Roblox', 'Minecraft', 'ChatGPT', 'Gemini', 'Claude', 'Copilot', 'Duolingo', 'Quran', 'Shalat', 'SATUSEHAT'],
  },
];

export const PRESET_STYLES: PresetStyle[] = [
  {
    id: 'clay-3d',
    name: '3D Glossy Claymorphism',
    category: '3D & Tactile',
    dna: {
      styleName: '3D Glossy Claymorphism',
      summary: 'Gaya 3D clay membal dengan pencahayaan lembut, bayangan halus, dan sentuhan glossy ceria.',
      colors: {
        primary: '#6366f1',
        secondary: '#a855f7',
        background: '#1e1b4b',
        backgroundGradient: {
          type: 'linear',
          from: '#4f46e5',
          to: '#7c3aed',
          angle: '135deg',
        },
        glyphColor: '#ffffff',
        accentColor: '#38bdf8',
        shadowColor: 'rgba(0,0,0,0.35)',
      },
      visualDNA: {
        finish: '3d-clay',
        shapeCurvature: 'squircle',
        lighting: 'Top-left soft directional key light with diffuse bottom bounce reflection',
        strokeWeight: 'none',
        elevation: 'deep-3d',
        borderEffect: 'inner-bevel',
        surfaceTexture: 'smooth-glossy',
      },
      replicationRules: 'Smooth 3D tactile clay aesthetic with deep pillowy volume, subtle top-left ambient specular highlight, soft dark drop shadow, and clean centered rounded glyphs with slight 3D extrusion.',
      defaultIconTags: ['WhatsApp', 'Camera', 'Gallery', 'Settings', 'Phone', 'Messages', 'Chrome', 'YouTube'],
    },
    previewSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <defs>
        <linearGradient id="bgGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#6366f1" />
          <stop offset="100%" stop-color="#9333ea" />
        </linearGradient>
        <radialGradient id="clayHighlight" cx="30%" cy="20%" r="70%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.4" />
          <stop offset="50%" stop-color="#ffffff" stop-opacity="0.05" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0.3" />
        </radialGradient>
        <filter id="shadow1" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="24" stdDeviation="20" flood-color="#000000" flood-opacity="0.4" />
        </filter>
        <filter id="glyphGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.25" />
        </filter>
      </defs>
      <g filter="url(#shadow1)">
        <rect x="48" y="48" width="416" height="416" rx="104" fill="url(#bgGrad1)" />
        <rect x="48" y="48" width="416" height="416" rx="104" fill="url(#clayHighlight)" />
      </g>
      <!-- Center 3D Glyph -->
      <g filter="url(#glyphGlow)" transform="translate(146, 146)">
        <path d="M110 0 C170.75 0 220 49.25 220 110 C220 170.75 170.75 220 110 220 C85 220 62 211 44 196 L10 210 L25 177 C9 158 0 135 0 110 C0 49.25 49.25 0 110 0 Z" fill="#ffffff" />
        <path d="M80 65 C76 65 72 67 70 70 C65 78 60 95 72 120 C84 145 105 160 128 162 C146 163 155 152 155 145 C155 140 142 133 135 130 C128 127 125 128 121 133 C117 138 113 140 108 138 C100 134 85 119 82 108 C80 103 84 100 87 96 C90 92 88 88 86 82 C84 76 80 65 80 65 Z" fill="#4f46e5" />
      </g>
    </svg>`,
  },
  {
    id: 'glass-frost',
    name: 'Frosted Prism Glassmorphism',
    category: 'Modern & Translucent',
    dna: {
      styleName: 'Frosted Prism Glassmorphism',
      summary: 'Lapisan kaca frosted semi-transparan dengan border chromatic prisma dan pendar neon lembut.',
      colors: {
        primary: '#0ea5e9',
        secondary: '#06b6d4',
        background: '#090d16',
        backgroundGradient: {
          type: 'linear',
          from: '#0ea5e9',
          to: '#3b82f6',
          angle: '145deg',
        },
        glyphColor: '#f8fafc',
        accentColor: '#38bdf8',
        shadowColor: 'rgba(14,165,233,0.3)',
      },
      visualDNA: {
        finish: 'glassmorphism',
        shapeCurvature: 'squircle',
        lighting: 'Top specular bright edge with internal chromatic dispersion',
        strokeWeight: 'thin',
        elevation: 'subtle-float',
        borderEffect: 'frosted-rim',
        surfaceTexture: 'translucent-glass',
      },
      replicationRules: 'Refined frosted glass aesthetic with subtle transparency, chromatic aberration edge highlights, crisp 1.5px semi-opaque border, luminous internal color blur, and ultra-clean white glyphs.',
      defaultIconTags: ['Camera', 'Gallery', 'Instagram', 'Chrome', 'Spotify', 'Settings', 'Phone', 'Messages'],
    },
    previewSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <defs>
        <linearGradient id="glassBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#0284c7" />
        </linearGradient>
        <linearGradient id="glassBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.6" />
          <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.1" />
        </linearGradient>
        <filter id="glassGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#0284c7" flood-opacity="0.4" />
        </filter>
      </defs>
      <rect x="48" y="48" width="416" height="416" rx="100" fill="url(#glassBg)" filter="url(#glassGlow)" />
      <rect x="52" y="52" width="408" height="408" rx="96" fill="#ffffff" fill-opacity="0.08" stroke="url(#glassBorder)" stroke-width="4" />
      <circle cx="256" cy="256" r="90" fill="none" stroke="#f8fafc" stroke-width="24" />
      <circle cx="256" cy="256" r="45" fill="#38bdf8" />
      <circle cx="330" cy="180" r="14" fill="#ffffff" />
    </svg>`,
  },
  {
    id: 'cyber-neon',
    name: 'Cyberpunk Neon Hologram',
    category: 'Dark & Glowing',
    dna: {
      styleName: 'Cyberpunk Neon Hologram',
      summary: 'Latar belakang matte carbon ultra-gelap dengan pendar neon cyan dan magenta elektrik.',
      colors: {
        primary: '#06b6d4',
        secondary: '#ec4899',
        background: '#090a0f',
        backgroundGradient: {
          type: 'linear',
          from: '#090a0f',
          to: '#181829',
          angle: '180deg',
        },
        glyphColor: '#22d3ee',
        accentColor: '#f43f5e',
        shadowColor: 'rgba(6,182,212,0.6)',
      },
      visualDNA: {
        finish: 'neon-glyph',
        shapeCurvature: 'hexagon',
        lighting: 'Internal electric glow emanating from neon cathode glyph paths',
        strokeWeight: 'medium',
        elevation: 'deep-3d',
        borderEffect: 'neon-stroke',
        surfaceTexture: 'matte-soft',
      },
      replicationRules: 'Deep pitch-black matte substrate with high-contrast electric dual-tone neon tubes (cyan and vivid neon pink/magenta), soft outer bloom blur, and minimalist geometric wireframe silhouette.',
      defaultIconTags: ['YouTube', 'Spotify', 'Instagram', 'Settings', 'Phone', 'Camera', 'WhatsApp', 'Discord'],
    },
    previewSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <defs>
        <filter id="neonBloom" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="12" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect x="48" y="48" width="416" height="416" rx="90" fill="#090a0f" stroke="#1e293b" stroke-width="4" />
      <rect x="52" y="52" width="408" height="408" rx="86" fill="none" stroke="#06b6d4" stroke-width="2" stroke-opacity="0.4" />
      <g filter="url(#neonBloom)" stroke="#06b6d4" stroke-width="18" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="200,160 350,256 200,352" fill="#06b6d4" fill-opacity="0.2" />
        <rect x="120" y="140" width="272" height="232" rx="40" />
      </g>
    </svg>`,
  },
  {
    id: 'material-you',
    name: 'Material You Dynamic Pastel',
    category: 'Clean & Adaptive',
    dna: {
      styleName: 'Material You Dynamic Pastel',
      summary: 'Gaya modern Google Android 14/15 dengan warna tonal pastel lembut dan siluet adaptif yang rapi.',
      colors: {
        primary: '#4ade80',
        secondary: '#22c55e',
        background: '#14281d',
        backgroundGradient: {
          type: 'linear',
          from: '#1e3a2b',
          to: '#0d1f14',
          angle: '135deg',
        },
        glyphColor: '#bbf7d0',
        accentColor: '#86efac',
        shadowColor: 'rgba(0,0,0,0.2)',
      },
      visualDNA: {
        finish: 'material-you',
        shapeCurvature: 'squircle',
        lighting: 'Flat ambient with harmonious tonal contrast',
        strokeWeight: 'none',
        elevation: 'flat',
        borderEffect: 'none',
        surfaceTexture: 'matte-soft',
      },
      replicationRules: 'Official Google Material 3 expressive guidelines: organic muted nature-inspired tonal color container, high-contrast monochrome stylized glyph centered with 35% viewport padding, clean curves.',
      defaultIconTags: ['Phone', 'Messages', 'WhatsApp', 'Settings', 'Camera', 'Gallery', 'Chrome', 'Calendar'],
    },
    previewSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <rect x="48" y="48" width="416" height="416" rx="110" fill="#243f30" />
      <path d="M210 140 C170 140 140 170 140 210 C140 270 210 372 210 372 C210 372 280 270 280 210 C280 170 250 140 210 140 Z" transform="translate(46, -10)" fill="#bbf7d0" />
      <circle cx="256" cy="190" r="28" fill="#14281d" />
      <rect x="176" y="320" width="160" height="40" rx="20" fill="#86efac" />
    </svg>`,
  },
  {
    id: 'skeuo-gold',
    name: 'Luxury Dark Skeuomorphic',
    category: 'Premium & Detailed',
    dna: {
      styleName: 'Luxury Dark Skeuomorphic',
      summary: 'Tekstur metal brushed obsidian dengan bevel emas mengkilap dan emboss taktil.',
      colors: {
        primary: '#eab308',
        secondary: '#ca8a04',
        background: '#18181b',
        backgroundGradient: {
          type: 'linear',
          from: '#27272a',
          to: '#09090b',
          angle: '160deg',
        },
        glyphColor: '#fef08a',
        accentColor: '#facc15',
        shadowColor: 'rgba(0,0,0,0.6)',
      },
      visualDNA: {
        finish: 'skeuomorphic',
        shapeCurvature: 'rounded-rect',
        lighting: 'Sharp metallic linear specular reflection across 45-degree bevel rim',
        strokeWeight: 'bold',
        elevation: 'deep-3d',
        borderEffect: 'inner-bevel',
        surfaceTexture: 'metallic',
      },
      replicationRules: 'Hyper-detailed luxury skeuomorphic craftsmanship: brushed dark titanium container, radial micro-texture, bevel rim with polished 24K gold metallic gradient, realistic deep drop shadows and embossed emblems.',
      defaultIconTags: ['Settings', 'Phone', 'Camera', 'Gallery', 'Clock', 'Files', 'Calculator', 'Chrome'],
    },
    previewSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <defs>
        <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef08a" />
          <stop offset="25%" stop-color="#eab308" />
          <stop offset="50%" stop-color="#a16207" />
          <stop offset="75%" stop-color="#fde047" />
          <stop offset="100%" stop-color="#713f12" />
        </linearGradient>
      </defs>
      <rect x="48" y="48" width="416" height="416" rx="90" fill="#0f0f12" stroke="url(#goldRim)" stroke-width="12" />
      <circle cx="256" cy="256" r="120" fill="#18181b" stroke="url(#goldRim)" stroke-width="6" />
      <path d="M256 160 L280 230 L350 256 L280 282 L256 352 L232 282 L162 256 L232 230 Z" fill="url(#goldRim)" />
    </svg>`,
  },
];
