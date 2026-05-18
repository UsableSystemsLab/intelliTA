// runCode.js does `import { auth } from './firebase.js'` — that relative path
// doesn't match the moduleNameMapper patterns (which require `utils/` in the
// path), so mock it explicitly here.
jest.mock('./firebase.js', () => ({
  auth: { currentUser: null },
}));

import { runCode } from './runCode';
import { auth } from './firebase.js';

beforeEach(() => {
  auth.currentUser = { getIdToken: jest.fn(() => Promise.resolve('test-token')) };
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
  delete global.fetch;
});

const baseArgs = {
  courseId: 'c1',
  activityId: 'a1',
  files: [{ name: 'main.py', content: 'print(1)', extra: 'ignored' }],
  language: 'python',
  version: '3.10.0',
  stdin: 'in',
};

describe('runCode', () => {
  test('POSTs to the run endpoint with auth + content-type and returns parsed JSON', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ stdout: '1\n' }),
    });

    const result = await runCode(baseArgs);

    expect(result).toEqual({ stdout: '1\n' });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/courses\/c1\/activities\/a1\/run$/);
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-token',
    });
  });

  test('only sends {name, content} for each file (drops extra keys)', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    await runCode(baseArgs);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.files).toEqual([{ name: 'main.py', content: 'print(1)' }]);
    expect(body.language).toBe('python');
    expect(body.version).toBe('3.10.0');
    expect(body.stdin).toBe('in');
  });

  test('defaults stdin to empty string when omitted', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
    const { stdin: _omit, ...rest } = baseArgs;
    await runCode(rest);
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.stdin).toBe('');
  });

  test('throws RATE_LIMITED on 429 with backend message', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: 'Too many requests' }),
    });
    await expect(runCode(baseArgs)).rejects.toMatchObject({
      message: 'Too many requests',
      code: 'RATE_LIMITED',
    });
  });

  test('429 without parseable body still uses default message', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: () => Promise.reject(new Error('not json')),
    });
    await expect(runCode(baseArgs)).rejects.toMatchObject({
      code: 'RATE_LIMITED',
    });
  });

  test('throws UNAVAILABLE on 503', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: () => Promise.resolve({}),
    });
    await expect(runCode(baseArgs)).rejects.toMatchObject({
      code: 'UNAVAILABLE',
    });
  });

  test('non-ok status throws backend error message', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Boom' }),
    });
    await expect(runCode(baseArgs)).rejects.toThrow('Boom');
  });

  test('non-ok status without error body falls back to status message', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 418,
      json: () => Promise.reject(new Error('not json')),
    });
    await expect(runCode(baseArgs)).rejects.toThrow('Run failed (418)');
  });
});
