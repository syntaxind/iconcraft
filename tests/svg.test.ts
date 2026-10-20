import { describe, expect, it } from 'vitest';
import { sanitizeSvg, escapeXml } from '../src/shared/svg';

describe('sanitizeSvg', () => {
  it('extracts the svg from surrounding text and code fences', () => {
    const out = sanitizeSvg('Here you go:\n```svg\n<svg viewBox="0 0 10 10"><rect width="10" height="10"/></svg>\n```');
    expect(out.startsWith('<svg')).toBe(true);
    expect(out.endsWith('</svg>')).toBe(true);
    expect(out).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('removes scripts, foreignObject, event handlers and animations', () => {
    const out = sanitizeSvg(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" onload="alert(1)">
        <script>alert(1)</script>
        <foreignObject><div>hi</div></foreignObject>
        <rect width="10" height="10" onclick='x()' />
        <animate attributeName="href" values="javascript:alert(1)"/>
      </svg>`,
    );
    expect(out).not.toMatch(/script|foreignObject|onload|onclick|animate|alert/i);
    expect(out).toContain('<rect');
  });

  it('keeps local fragment hrefs but drops external ones', () => {
    const out = sanitizeSvg(
      `<svg viewBox="0 0 1 1"><use href="#a"/><image href="https://evil.test/x.png"/><use xlink:href="javascript:alert(1)"/></svg>`,
    );
    expect(out).toContain('href="#a"');
    expect(out).not.toContain('evil.test');
    expect(out).not.toContain('javascript');
  });

  it('neutralises external css urls and @import', () => {
    const out = sanitizeSvg(
      `<svg viewBox="0 0 1 1"><style>@import url(https://evil.test/a.css); .a{fill:url(https://evil.test/p)}</style><rect style="fill:url(http://evil.test)"/></svg>`,
    );
    expect(out).not.toContain('evil.test');
  });

  it('adds a default viewBox when missing', () => {
    expect(sanitizeSvg('<svg><rect/></svg>')).toContain('viewBox="0 0 512 512"');
  });

  it('throws when there is no svg', () => {
    expect(() => sanitizeSvg('sorry, I cannot do that')).toThrow();
  });
});

describe('escapeXml', () => {
  it('escapes markup characters', () => {
    expect(escapeXml(`<a href="x">&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&apos;&lt;/a&gt;');
  });
});
