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
import { uploadToS3 } from '../middlewares/uploadToS3.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('uploadToS3 middleware', () => {
  test('calls next() with no action when req.file is missing', async () => {
    const req = {};
    const res = makeRes();
    const next = jest.fn();
    await uploadToS3(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(s3.send).not.toHaveBeenCalled();
  });

  test('uploads file, sets req.file.location, and calls next', async () => {
    s3.send.mockResolvedValueOnce({});
    const req = {
      file: {
        originalname: 'My Video.MP4',
        buffer: Buffer.from('data'),
        mimetype: 'video/mp4',
      },
    };
    const res = makeRes();
    const next = jest.fn();
    await uploadToS3(req, res, next);
    expect(s3.send).toHaveBeenCalled();
    expect(req.file.location).toMatch(
      /^https:\/\/s3\.example\.com\/test-bucket\/videos\/\d+-my_video\.mp4$/
    );
    expect(next).toHaveBeenCalled();
  });

  test('returns 500 when S3 upload fails', async () => {
    s3.send.mockRejectedValueOnce(new Error('boom'));
    const req = {
      file: {
        originalname: 'clip.mp4',
        buffer: Buffer.from('data'),
        mimetype: 'video/mp4',
      },
    };
    const res = makeRes();
    const next = jest.fn();
    await uploadToS3(req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'S3 upload failed' })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
