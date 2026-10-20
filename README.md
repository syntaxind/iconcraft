# IconCraft AI

Buat **paket ikon Android** yang seragam dari **satu ikon acuan**. Gemini Vision membaca "Style DNA" (warna, pencahayaan, bentuk, finishing), lalu aplikasi membuat belasan ikon bertema, menampilkannya di simulator launcher, dan mengekspornya sebagai ZIP.

Generate a consistent Android icon pack from a single reference icon: Gemini Vision extracts a "Style DNA", the app batch-generates themed icons, previews them in a launcher simulator and exports a ZIP.

## Fitur / Features

- Ekstraksi Style DNA dari gambar acuan (unggah, seret, atau tempel dengan Ctrl+V) atau pilih dari 5 preset
- Generate massal dengan progres, tombol Batal, dan generate ulang per ikon (dengan instruksi kustom)
- **Mode offline**: tanpa API key, ikon tetap dibuat dengan generator bawaan (ditandai badge `offline`)
- Mask bentuk: squircle, circle, rounded square, teardrop, hexagon, sama persis di preview dan hasil ekspor
- Simulator beranda Android + detail ikon
- **Editor Style DNA penuh**: warna, gradien, finish, elevasi, border, pattern latar (titik, halftone, grid, garis, diagonal, heksagon, konstelasi), aturan prompt; reset ke DNA awal
- **Terapkan ke ikon yang ada** (instan, gratis) atau buat ulang semua; **preset DNA sendiri** tersimpan di browser + ekspor/impor JSON
- **Ekspor modul `icons` Xiaomi Theme Store** (MIUI/HyperOS): PNG 256px bernama paket, `icon_mask`, `icon_folder`, `folder_bg_*`, `transform_config.xml`, `Copyright.txt`
- Ekspor: paket resource Android (PNG mdpi–xxxhdpi + 512px, `appfilter.xml`, `drawable.xml`), PNG 1024px, SVG
- **Simpan otomatis**: ikon, DNA, daftar aplikasi, dan gambar acuan tersimpan di perangkat (IndexedDB) dan dipulihkan saat halaman dimuat ulang; ekspor/impor proyek `.json`
- **PWA**: bisa dipasang sebagai aplikasi (tombol "Pasang sebagai aplikasi" atau menu Chrome → Instal aplikasi) dan terbuka offline setelah kunjungan pertama
- UI dwibahasa (ID/EN)

## Menjalankan / Run

Butuh Node.js 20+.

```bash
npm install
cp .env.example .env.local   # isi GEMINI_API_KEY (opsional)
npm run dev                  # http://localhost:3000
```

Produksi / production:

```bash
npm run build
npm start
```

Cek kualitas: `npm run check` (typecheck + test + build).

## Demo di GitHub Pages

Workflow `.github/workflows/deploy.yml` mem-build dan men-deploy ke GitHub Pages (Settings > Pages > Source: **GitHub Actions**). Versi statis ini berjalan **tanpa server**, jadi hanya mode offline (generator bawaan, preview, ekspor). Fitur AI (Gemini) butuh server Express, jalankan lokal atau deploy ke hosting Node (Render, Railway, dll.).

## Fitur AI di GitHub Pages / AI on static hosting

Di situs statis tidak ada server, jadi klik tombol **Kunci AI** di navbar dan tempel API key Gemini milikmu. Key dipakai langsung dari browser ke Google (tidak lewat server), disimpan hanya di browser kamu, dan bisa dihapus kapan saja. Pakai key pribadi dengan batas kuota, dan jangan isi di komputer umum.

On static hosting there is no server: click **AI key** in the navbar and paste your own Gemini API key. It goes straight from your browser to Google, is stored only in your browser, and can be removed at any time.

## Konfigurasi / Configuration

| Variabel | Fungsi |
| --- | --- |
| `GEMINI_API_KEY` | Kunci API Gemini. Tanpa ini, hanya mode offline yang aktif. |
| `GEMINI_TEXT_MODEL` | Model untuk analisis & SVG (default `gemini-3.8-flash`). |
| `GEMINI_IMAGE_MODEL` | Model gambar untuk endpoint opsional (default `gemini-3.1-flash-lite-image`). |
| `PORT` | Port server (default 3000). |
| `RATE_LIMIT_PER_MIN` | Batas permintaan API per IP per menit (default 30). |

> API key hanya dipakai di server dan tidak pernah dikirim ke browser. Jika instance dipublikasikan, setiap pengunjung memakai kuota key kamu; rate limit sudah ada, tetapi pertimbangkan autentikasi.

## Tentang file ZIP ekspor

ZIP berisi **resource** icon pack, bukan APK siap pasang. Pakai PNG langsung lewat edit ikon di launcher (Nova, Lawnchair, One UI Theme Park), atau salin `res/` dan `assets/` ke proyek Android Studio untuk membuat APK icon pack. Komponen aplikasi di `appfilter.xml` (terutama aplikasi sistem Xiaomi/HyperOS) adalah perkiraan terbaik; komponen yang tidak ada di perangkat diabaikan launcher. Tambahkan pemetaan di `src/utils/presets.ts`.

## Modul `icons` Theme Store Xiaomi

Tombol **Ekspor → Modul "icons"** menghasilkan zip dengan struktur yang sama seperti tema Theme Store yang sudah terbit:

```
res/drawable-xxhdpi/<package>.png            256x256, sudah bermask
res/drawable-xxhdpi/<package>.<Activity>.png  salinan untuk activity peluncur
res/drawable-xxhdpi/icon_mask.png             180x180 (bentuk 118px di tengah)
res/drawable-xxhdpi/icon_folder.png           434x434
res/drawable-xxhdpi/folder_bg_grid_four_reserved.png
res/drawable-xxhdpi/folder_bg_grid_four_light_reserved.png
transform_config.xml
Copyright.txt
```

Salin ke `.mtz` sebagai modul `icons` (zip tanpa ekstensi). Nama paket diambil dari `src/utils/presets.ts`; aplikasi tanpa pemetaan bisa diisi nama paketnya langsung di jendela ekspor. Beberapa nama paket/activity Xiaomi adalah perkiraan, jadi cocokkan dengan perangkat dan uji di Theme Editor sebelum submit. Pattern hanya tergambar di ikon buatan generator offline; ikon AI hanya dapat petunjuk pattern lewat prompt.

## Struktur / Structure

```
server.ts            Express API (Gemini) + Vite dev / static prod
src/shared/          kode bersama browser & server: sanitasi SVG, DNA, mask, generator offline
src/components/      UI
src/utils/           ekspor Android, rasterizer canvas, util gambar
tests/               Vitest
```

## Keamanan / Security

SVG dari AI dianggap tidak tepercaya: disanitasi (script, event handler, URL eksternal dibuang) dan ditampilkan lewat `<img>` data URI, bukan `innerHTML`. Input API divalidasi dan nama aplikasi dibersihkan sebelum masuk prompt.

## Lisensi

MIT
