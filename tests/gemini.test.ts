import { afterEach, describe, expect, it, vi } from 'vitest';
import { generate } from '../src/utils/geminiClient';

const ok = (text: string) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 });
const err = (status: number, message = 'busy') => new Response(JSON.stringify({ error: { message } }), { status });

afterEach(() => vi.unstubAllGlobals());

describe('gemini retry', () => {
  it('retries a 503 and then succeeds', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(err(503)).mockResolvedValueOnce(err(503)).mockResolvedValueOnce(ok('hello'));
    vi.stubGlobal('fetch', fetchMock);
    await expect(generate('k', 'm', {}, undefined, [0, 0, 0])).resolves.toBe('hello');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it('gives a friendly message after retries run out', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => err(503)));
    await expect(generate('k', 'm', {}, undefined, [0, 0])).rejects.toThrow(/sibuk/);
  });
  it('does not retry a bad key', async () => {
    const fetchMock = vi.fn().mockResolvedValue(err(403, 'API key invalid'));
    vi.stubGlobal('fetch', fetchMock);
    await expect(generate('k', 'm', {}, undefined, [0, 0])).rejects.toThrow(/API key/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
