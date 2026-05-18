jest.mock('../services/pistonService.js', () => ({
  __esModule: true,
  executeCode: jest.fn(),
  DEFAULT_VERSIONS: { python: '3.10.0', javascript: '18.15.0', java: '15.0.2' },
  ALLOWED_LANGUAGES: new Set(['python', 'javascript', 'java']),
}));

jest.mock('../configs/postgresDB.js', () => ({
  __esModule: true,
  sequelize: { query: jest.fn().mockResolvedValue([]) },
}));

import { executeCode } from '../services/pistonService.js';
import { sequelize } from '../configs/postgresDB.js';
import RunController from '../controllers/runController.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const baseReq = (overrides = {}) => ({
  params: { courseId: '1', activityId: '2' },
  body: {
    files: [{ name: 'main.py', content: "print('hi')" }],
    language: 'python',
    stdin: '',
  },
  firebaseUser: { uid: 'user1' },
  ...overrides,
});

const okResult = {
  stdout: 'hi',
  stderr: '',
  exitCode: 0,
  signal: null,
  compileStdout: '',
  compileStderr: '',
  language: 'python',
  version: '3.10.0',
};

describe('RunController.runCode', () => {
  beforeEach(() => {
    executeCode.mockReset();
    sequelize.query.mockReset();
    sequelize.query.mockResolvedValue([]);
  });

  test('returns 400 when files is not an array', async () => {
    const res = makeRes();
    await RunController.runCode(baseReq({ body: { files: null, language: 'python' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 400 when files is empty', async () => {
    const res = makeRes();
    await RunController.runCode(baseReq({ body: { files: [], language: 'python' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 400 when file lacks name/content strings', async () => {
    const res = makeRes();
    await RunController.runCode(
      baseReq({ body: { files: [{ name: 1, content: 'x' }], language: 'python' } }),
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 400 when file name contains illegal characters', async () => {
    const res = makeRes();
    await RunController.runCode(
      baseReq({ body: { files: [{ name: '../bad name.py', content: 'x' }], language: 'python' } }),
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('Invalid file name') })
    );
  });

  test('returns 413 when payload exceeds 256KB', async () => {
    const big = 'a'.repeat(300 * 1024);
    const res = makeRes();
    await RunController.runCode(
      baseReq({ body: { files: [{ name: 'big.py', content: big }], language: 'python' } }),
      res
    );
    expect(res.status).toHaveBeenCalledWith(413);
  });

  test('returns 400 when language is not allowed', async () => {
    const res = makeRes();
    await RunController.runCode(
      baseReq({ body: { files: [{ name: 'a.rb', content: 'x' }], language: 'ruby' } }),
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 400 when stdin is not a string', async () => {
    const res = makeRes();
    await RunController.runCode(
      baseReq({ body: { files: [{ name: 'a.py', content: 'x' }], language: 'python', stdin: 123 } }),
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('uses DEFAULT_VERSIONS when version is not provided', async () => {
    executeCode.mockResolvedValueOnce(okResult);
    const res = makeRes();
    await RunController.runCode(baseReq(), res);
    expect(executeCode).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'python', version: '3.10.0' })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('uses provided version when version is a string', async () => {
    executeCode.mockResolvedValueOnce(okResult);
    const res = makeRes();
    await RunController.runCode(
      baseReq({
        body: {
          files: [{ name: 'a.py', content: 'x' }],
          language: 'python',
          version: '3.11.0',
        },
      }),
      res
    );
    expect(executeCode).toHaveBeenCalledWith(
      expect.objectContaining({ version: '3.11.0' })
    );
  });

  test('returns 503 when piston error has no status', async () => {
    executeCode.mockRejectedValueOnce(new Error('network down'));
    const res = makeRes();
    await RunController.runCode(baseReq(), res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('Code runner unavailable') })
    );
  });

  test('forwards piston error status when set (400)', async () => {
    const err = new Error('bad payload');
    err.status = 400;
    executeCode.mockRejectedValueOnce(err);
    const res = makeRes();
    await RunController.runCode(baseReq(), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'bad payload' })
    );
  });

  test('returns 200 with execution result and writes audit row', async () => {
    executeCode.mockResolvedValueOnce(okResult);
    const res = makeRes();
    await RunController.runCode(baseReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body).toEqual(
      expect.objectContaining({
        stdout: 'hi',
        exitCode: 0,
        language: 'python',
        version: '3.10.0',
        durationMs: expect.any(Number),
      })
    );
    expect(sequelize.query).toHaveBeenCalled();
  });

  test('handles non-numeric courseId/activityId by passing null in audit', async () => {
    executeCode.mockResolvedValueOnce(okResult);
    const res = makeRes();
    await RunController.runCode(
      baseReq({ params: { courseId: 'abc', activityId: 'xyz' } }),
      res
    );
    expect(sequelize.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        replacements: expect.objectContaining({ courseId: null, activityId: null }),
      })
    );
  });

  test('does not throw when audit insert fails', async () => {
    executeCode.mockResolvedValueOnce(okResult);
    sequelize.query.mockReturnValueOnce(Promise.reject(new Error('insert fail')));
    const res = makeRes();
    await RunController.runCode(baseReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('returns 500 when unexpected error occurs', async () => {
    const res = makeRes();
    res.status = jest.fn(() => {
      throw new Error('boom');
    });
    const res2 = makeRes();
    res2.status = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error('boom');
      })
      .mockReturnValue(res2);
    await RunController.runCode(baseReq({ body: null }), res2);
    expect(res2.status).toHaveBeenLastCalledWith(500);
  });
});
