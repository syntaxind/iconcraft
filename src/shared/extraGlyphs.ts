/**
 * Extra offline glyphs for popular apps. Each glyph is drawn in a 300x300 box
 * (the caller centres it inside the 512 canvas safe zone).
 * Ordered: first matching rule wins. `g` = glyph colour, `a` = accent colour.
 */
type Glyph = (g: string, a: string) => string;

const note: Glyph = (g, a) =>
  `<circle cx="105" cy="220" r="52" fill="${g}"/><rect x="140" y="40" width="34" height="180" rx="8" fill="${g}"/><path d="M170 40 C178 100 215 118 262 120 V158 C225 156 195 145 170 124Z" fill="${a}"/>`;
const cloud: Glyph = (g) =>
  `<circle cx="105" cy="170" r="55" fill="${g}"/><circle cx="170" cy="145" r="68" fill="${g}"/><circle cx="225" cy="190" r="45" fill="${g}"/><rect x="60" y="175" width="195" height="60" rx="30" fill="${g}"/>`;
const doc: Glyph = (g, a) =>
  `<path d="M65 25 H185 L255 95 V275 H65Z" fill="${g}"/><path d="M185 25 V95 H255Z" fill="${a}"/><rect x="100" y="140" width="120" height="16" rx="8" fill="${a}" fill-opacity="0.8"/><rect x="100" y="180" width="120" height="16" rx="8" fill="${a}" fill-opacity="0.8"/><rect x="100" y="220" width="75" height="16" rx="8" fill="${a}" fill-opacity="0.8"/>`;
const video: Glyph = (g, a) =>
  `<rect x="25" y="85" width="175" height="130" rx="30" fill="${g}"/><path d="M215 128 L275 92 V208 L215 172Z" fill="${a}"/>`;
const wallet: Glyph = (g, a) =>
  `<rect x="25" y="65" width="250" height="175" rx="36" fill="${g}"/><rect x="165" y="125" width="110" height="62" rx="31" fill="${a}"/><circle cx="195" cy="156" r="11" fill="${g}"/>`;
const card: Glyph = (g, a) =>
  `<rect x="20" y="65" width="260" height="170" rx="30" fill="${g}"/><rect x="20" y="105" width="260" height="38" fill="${a}"/><rect x="50" y="177" width="80" height="16" rx="8" fill="${a}" fill-opacity="0.8"/>`;
const bag: Glyph = (g, a) =>
  `<path d="M55 95 H245 L268 272 H32Z" fill="${g}"/><path d="M105 110 V80 C105 35 195 35 195 80 V110" fill="none" stroke="${a}" stroke-width="22" stroke-linecap="round"/>`;
const car: Glyph = (g, a) =>
  `<path d="M35 175 L68 98 Q78 78 100 78 H200 Q222 78 232 98 L265 175 V225 H35Z" fill="${g}"/><path d="M85 100 H215 L240 160 H60Z" fill="${a}" fill-opacity="0.55"/><circle cx="92" cy="228" r="30" fill="${a}"/><circle cx="208" cy="228" r="30" fill="${a}"/>`;
const plane: Glyph = (g, a) =>
  `<path d="M150 18 L182 108 L275 150 L182 172 L162 275 L150 255 L138 275 L118 172 L25 150 L118 108Z" fill="${g}"/><circle cx="150" cy="150" r="16" fill="${a}"/>`;
const sparkle: Glyph = (g, a) =>
  `<path d="M150 15 C162 98 202 138 285 150 C202 162 162 202 150 285 C138 202 98 162 15 150 C98 138 138 98 150 15Z" fill="${g}"/><circle cx="240" cy="62" r="20" fill="${a}"/>`;
const pad: Glyph = (g, a) =>
  `<path d="M70 85 H230 C262 85 282 115 285 175 C287 215 270 235 245 235 C225 235 215 220 200 205 H100 C85 220 75 235 55 235 C30 235 13 215 15 175 C18 115 38 85 70 85Z" fill="${g}"/><rect x="62" y="132" width="52" height="16" rx="8" fill="${a}"/><rect x="80" y="114" width="16" height="52" rx="8" fill="${a}"/><circle cx="205" cy="125" r="13" fill="${a}"/><circle cx="238" cy="155" r="13" fill="${a}"/>`;
const bars: Glyph = (g, a) =>
  `<rect x="35" y="190" width="42" height="70" rx="12" fill="${g}"/><rect x="95" y="145" width="42" height="115" rx="12" fill="${g}"/><rect x="155" y="95" width="42" height="165" rx="12" fill="${g}"/><rect x="215" y="40" width="42" height="220" rx="12" fill="${a}"/>`;
const house: Glyph = (g, a) =>
  `<path d="M150 28 L275 140 H238 V268 H62 V140 H25Z" fill="${g}"/><rect x="125" y="185" width="50" height="83" rx="12" fill="${a}"/>`;
const shield: Glyph = (g, a) =>
  `<path d="M150 22 L262 62 V150 C262 218 212 262 150 282 C88 262 38 218 38 150 V62Z" fill="${g}"/><path d="M98 150 L135 188 L205 112" fill="none" stroke="${a}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>`;
const book: Glyph = (g, a) =>
  `<path d="M25 70 C75 50 120 55 150 85 V260 C120 235 75 232 25 250Z" fill="${g}"/><path d="M275 70 C225 50 180 55 150 85 V260 C180 235 225 232 275 250Z" fill="${a}"/>`;
const pin: Glyph = (g, a) =>
  `<path d="M150 18 C93 18 52 62 52 117 C52 188 150 285 150 285 C150 285 248 188 248 117 C248 62 207 18 150 18Z" fill="${g}"/><circle cx="150" cy="117" r="42" fill="${a}"/>`;
const bolt: Glyph = (g, a) =>
  `<path d="M172 15 L65 160 H137 L115 285 L238 128 H163Z" fill="${g}"/><path d="M172 15 L163 128 H238Z" fill="${a}" fill-opacity="0.6"/>`;
const mic: Glyph = (g, a) =>
  `<rect x="105" y="25" width="90" height="150" rx="45" fill="${g}"/><path d="M60 140 C60 220 240 220 240 140" fill="none" stroke="${a}" stroke-width="20" stroke-linecap="round"/><rect x="140" y="205" width="20" height="55" rx="8" fill="${a}"/>`;
const compass: Glyph = (g, a) =>
  `<circle cx="150" cy="150" r="120" fill="none" stroke="${g}" stroke-width="22"/><path d="M150 50 L190 150 L150 250 L110 150Z" fill="${g}"/><path d="M150 50 L190 150 H110Z" fill="${a}"/>`;
const translate: Glyph = (g, a) =>
  `<rect x="25" y="35" width="155" height="155" rx="34" fill="${g}"/><rect x="120" y="110" width="155" height="155" rx="34" fill="${a}"/><rect x="70" y="95" width="65" height="16" rx="8" fill="${a}"/><rect x="160" y="190" width="75" height="16" rx="8" fill="${g}"/>`;
const play: Glyph = (g, a) =>
  `<path d="M60 28 L268 150 L60 272Z" fill="${g}"/><path d="M60 28 L175 150 L60 272Z" fill="${a}" fill-opacity="0.55"/>`;
const ghost: Glyph = (g) =>
  `<path d="M150 28 C98 28 78 68 78 112 V150 C66 160 48 160 36 158 C52 190 78 200 90 206 C84 232 68 242 48 246 C88 262 118 252 150 275 C182 252 212 262 252 246 C232 242 216 232 210 206 C222 200 248 190 264 158 C252 160 234 160 222 150 V112 C222 68 202 28 150 28Z" fill="${g}"/>`;
const letterF: Glyph = (g, a) =>
  `<circle cx="150" cy="150" r="125" fill="${g}"/><path d="M168 270 V168 H205 L212 128 H168 V104 C168 90 176 84 192 84 H214 V46 C204 44 190 43 178 43 C145 43 128 64 128 100 V128 H96 V168 H128 V270Z" fill="${a}"/>`;
const letterN: Glyph = (g, a) =>
  `<rect x="62" y="32" width="46" height="236" rx="6" fill="${g}"/><rect x="192" y="32" width="46" height="236" rx="6" fill="${g}"/><path d="M62 32 H108 L238 268 H192Z" fill="${a}"/>`;
const letterX: Glyph = (g, a) =>
  `<path d="M55 40 L245 260" stroke="${g}" stroke-width="38" stroke-linecap="round"/><path d="M245 40 L55 260" stroke="${a}" stroke-width="38" stroke-linecap="round"/>`;
const plane2: Glyph = (g, a) =>
  `<path d="M22 140 L275 28 L228 262 L148 200 L112 245 L106 172Z" fill="${g}"/><path d="M106 172 L228 70 L148 200Z" fill="${a}" fill-opacity="0.75"/>`;
const camera: Glyph = (g, a) =>
  `<rect x="30" y="70" width="240" height="180" rx="34" fill="${g}"/><circle cx="150" cy="160" r="55" fill="${a}"/><circle cx="150" cy="160" r="28" fill="${g}"/>`;
const palette: Glyph = (g, a) =>
  `<path d="M150 25 C80 25 25 80 25 150 C25 220 80 275 150 275 C175 275 182 255 168 238 C155 222 165 200 188 200 H225 C255 200 275 185 275 150 C275 80 220 25 150 25Z" fill="${g}"/><circle cx="92" cy="130" r="16" fill="${a}"/><circle cx="135" cy="85" r="16" fill="${a}"/><circle cx="195" cy="95" r="16" fill="${a}"/>`;
const heart: Glyph = (g, a) =>
  `<path d="M150 265 C40 190 20 120 55 75 C85 40 130 50 150 90 C170 50 215 40 245 75 C280 120 260 190 150 265Z" fill="${g}"/><path d="M60 160 H120 L140 120 L165 200 L185 160 H245" fill="none" stroke="${a}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>`;

const RULES: [RegExp, Glyph][] = [
  [/facebook|^fb$/, letterF],
  [/messenger|^line$|^linkedin|threads|reddit|pinterest/, (g, a) => `<path d="M150 20 C75 20 20 70 20 135 C20 172 38 205 68 226 V282 L120 252 C130 254 140 255 150 255 C225 255 280 205 280 135 C280 70 225 20 150 20Z" fill="${g}"/><path d="M70 160 L120 108 L150 138 L205 108 L150 175 L120 145Z" fill="${a}"/>`],
  [/telegram/, plane2],
  [/play store|google play|playstore/, play],
  [/tiktok shop|shopee|tokopedia|lazada|bukalapak|blibli|olx|shop|store(?!.*play)/, bag],
  [/tiktok|capcut|^vn$/, note],
  [/snapchat/, ghost],
  [/^x$|x \/ twitter|twitter/, letterX],
  [/netflix/, letterN],
  [/maps|navigasi|waze/, pin],
  [/soundcloud|joox|podcast/, note],
  [/weather|cuaca|^drive$|google drive|^cloud/, cloud],
  [/translate/, translate],
  [/notes|docs|word|pdf|sheets|excel|slides|powerpoint|notion|trello/, doc],
  [/^mic$|mikrofon|recorder|rekam/, mic],
  [/compass|kompas/, compass],
  [/gopay|ovo|dana|linkaja|shopeepay|google pay|flip|wallet|dompet|pay$/, wallet],
  [/bca|bri|bni|mandiri|livin|jago|seabank|blu$|jenius|bank/, card],
  [/gojek|grab|maxim|indrive|taxi|ride|ojek/, car],
  [/traveloka|tiket|kai access|pesawat|flight/, plane],
  [/zoom|meet|teams|vidio|viu|wetv|twitch|disney|video|slack/, video],
  [/mobile legends|free fire|pubg|genshin|roblox|minecraft|game|discord/, pad],
  [/chatgpt|gemini|claude|copilot|^ai$|assistant/, sparkle],
  [/quran|alquran|shalat|sholat|duolingo|kamus|book|buku/, book],
  [/security|keamanan|antivirus|vpn/, shield],
  [/telkomsel|^by\.?u$|myxl|^xl$|indosat|^tri$|pulsa|sinyal/, bars],
  [/pln|pertamina|listrik/, bolt],
  [/mi home|home|rumah|satusehat/, house],
  [/mi fitness|health|kesehatan|fitness/, heart],
  [/themes|tema|canva|picsart|snapseed|lightroom/, palette],
  [/photos? edit|camera pro|kamera/, camera],
];

export function getExtraGlyph(appName: string, glyphColor: string, accentColor: string): string | null {
  const n = appName.toLowerCase().trim();
  for (const [re, fn] of RULES) if (re.test(n)) return fn(glyphColor, accentColor);
  return null;
}
