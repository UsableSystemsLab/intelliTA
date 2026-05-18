jest.mock('../configs/s3.js', () => ({
  __esModule: true,
  s3: { send: jest.fn() },
  S3_BUCKET: 'test-bucket',
  S3_PUBLIC_URL: 'https://s3.example.com',
}));

jest.mock('@aws-sdk/client-s3', () => ({
  PutObjectCommand: jest.fn().mockImplementation((params) => ({ params })),
}));

import { s3 } from '../configs/s3.js';
import { uploadActivityFilesToS3 } from '../middlewares/uploadActivityFiles.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const makeFile = (name, body = 'data', mimetype = 'application/octet-stream') => ({
  originalname: name,
  buffer: Buffer.from(body),
  mimetype,
});

describe('uploadActivityFilesToS3 middleware', () => {
  test('calls next() when req.files is missing', async () => {
    const req = { body: {} };
    const res = makeRes();
    const next = jest.fn();
    await uploadActivityFilesToS3(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(s3.send).not.toHaveBeenCalled();
  });

  test('calls next() when req.files is empty object', async () => {
    const req = { body: {}, files: {} };
    const res = makeRes();
    const next = jest.fn();
    await uploadActivityFilesToS3(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(s3.send).not.toHaveBeenCalled();
  });

  test('uploads all file types and populates req.body', async () => {
    s3.send.mockResolvedValue({});
    const manifest = { tests: [{ name: 'a.js' }] };
    const req = {
      body: {},
      files: {
        video: [makeFile('clip.mp4', 'v', 'video/mp4')],
        md_file: [makeFile('README.md', '# hello', 'text/markdown')],
        starter_code: [makeFile('main.py', 'print(1)', 'text/x-python')],
        quiz_file: [makeFile('quiz.json', '{}', 'application/json')],
        tests_manifest: [makeFile('tests.json', JSON.stringify(manifest), 'application/json')],
      },
    };
    const res = makeRes();
    const next = jest.fn();
    await uploadActivityFilesToS3(req, res, next);
    expect(s3.send).toHaveBeenCalledTimes(5);
    expect(req.body.video_url).toMatch(/videos\/\d+-clip\.mp4/);
    expect(req.body.md_file_url).toMatch(/docs\//);
    expect(req.body._md_content).toBe('# hello');
    expect(req.body.starter_code_url).toMatch(/starter-code\//);
    expect(req.body._starter_code_content).toBe('print(1)');
    expect(req.body.quiz_url).toMatch(/quizzes\//);
    expect(req.body.tests_url).toMatch(/tests\//);
    expect(req.body._tests_manifest_parsed).toEqual(manifest);
    expect(next).toHaveBeenCalled();
  });

  test('tolerates invalid JSON in tests_manifest and still calls next', async () => {
    s3.send.mockResolvedValue({});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const req = {
      body: {},
      files: {
        tests_manifest: [makeFile('tests.json', 'not-json', 'application/json')],
      },
    };
    const res = makeRes();
    const next = jest.fn();
    await uploadActivityFilesToS3(req, res, next);
    expect(req.body._tests_manifest_parsed).toBeUndefined();
    expect(req.body.tests_url).toBeDefined();
    expect(warnSpy).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  test('returns 500 when S3 upload fails', async () => {
    s3.send.mockRejectedValueOnce(new Error('boom'));
    const req = {
      body: {},
      files: { video: [makeFile('clip.mp4')] },
    };
    const res = makeRes();
    const next = jest.fn();
    await uploadActivityFilesToS3(req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'S3 upload failed' })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
