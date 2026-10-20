/**
 * SVG helpers shared by the browser and the Node server.
 *
 * AI-generated SVG is untrusted input. We never inject it into the DOM with
 * `innerHTML`; it is rendered through <img src="data:..."> (scripts and external
 * requests are blocked in that context) and is additionally sanitized here so the
 * exported .svg files are safe to open on their own.
 */

export const MAX_SVG_BYTES = 200_000;

const BLOCKED_ELEMENTS = [
  'script',
  'foreignObject',
  'iframe',
  'object',
  'embed',
  'audio',
  'video',
  'canvas',
  'link',
  'meta',
  'animate',
  'animateTransform',
  'animateMotion',
  'set',
  'discard',
];

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripBlockedElements(svg: string): string {
  let out = svg;
  for (const tag of BLOCKED_ELEMENTS) {
    const pair = new RegExp(`<${tag}\\b[^>]*?>[\\s\\S]*?</${tag}\\s*>`, 'gi');
    const single = new RegExp(`<${tag}\\b[^>]*?/?>`, 'gi');
    let prev: string;
    do {
      prev = out;
      out = out.replace(pair, '').replace(single, '');
    } while (out !== prev);
  }
  return out;
}

function cleanCss(css: string): string {
  return css
    .replace(/@import[^;]*;?/gi, '')
    .replace(/url\(\s*(?!['"]?#)[^)]*\)/gi, 'none')
    .replace(/expression\([^)]*\)/gi, '');
}

function stripDangerousAttributes(svg: string): string {
  let out = svg;
  // Event handlers: onload=, onclick=, ...
  out = out.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  // href / xlink:href may only point to local fragments or embedded raster images.
  out = out.replace(
    /\s+(?:xlink:)?href\s*=\s*("([^"]*)"|'([^']*)'|[^\s>]+)/gi,
    (match, _all, dq, sq) => {
      const value = String(dq ?? sq ?? '').trim();
      if (value.startsWith('#')) return match;
      if (/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(value)) return match;
      return '';
    },
  );
  // Remaining attributes carrying a script scheme.
  out = out.replace(/\s+[a-z:-]+\s*=\s*("[^"]*javascript:[^"]*"|'[^']*javascript:[^']*')/gi, '');
  // Inline style attributes and <style> blocks.
  out = out.replace(/\sstyle\s*=\s*"([^"]*)"/gi, (_m, css) => ` style="${cleanCss(css)}"`);
  out = out.replace(/\sstyle\s*=\s*'([^']*)'/gi, (_m, css) => ` style='${cleanCss(css)}'`);
  out = out.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (_m, a, css, b) => `${a}${cleanCss(css)}${b}`);
  return out;
}

/**
 * Returns a safe, standalone `<svg>` string, or throws if the input does not
 * contain one. Always guarantees an xmlns and a viewBox.
 */
export function sanitizeSvg(input: string): string {
  if (typeof input !== 'string') throw new Error('SVG must be a string.');

  let svg = input.replace(/<!--[\s\S]*?-->/g, '').replace(/<!(?:DOCTYPE|ENTITY)[^>]*>/gi, '').replace(/<\?[\s\S]*?\?>/g, '');

  const start = svg.search(/<svg[\s>]/i);
  const end = svg.toLowerCase().lastIndexOf('</svg>');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('Response did not contain a valid SVG.');
  }
  svg = svg.slice(start, end + '</svg>'.length);

  if (svg.length > MAX_SVG_BYTES) throw new Error('SVG is too large.');

  svg = stripBlockedElements(svg);
  svg = stripDangerousAttributes(svg);

  // Normalise the root element.
  svg = svg.replace(/<svg\b([^>]*)>/i, (_m, attrs: string) => {
    let a = attrs;
    if (!/\sxmlns\s*=/.test(` ${a}`)) a += ' xmlns="http://www.w3.org/2000/svg"';
    if (!/\sviewBox\s*=/i.test(` ${a}`)) a += ' viewBox="0 0 512 512"';
    return `<svg${a.startsWith(' ') ? '' : ' '}${a}>`;
  });

  return svg.trim();
}

/** Percent-encoded data URI that is safe to use as <img src>. */
export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
