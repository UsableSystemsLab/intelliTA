const mockVerifyIdToken = jest.fn();

jest.mock('../configs/firebase.js', () => ({
  __esModule: true,
  default: {
    auth: () => ({ verifyIdToken: mockVerifyIdToken }),
  },
}));

import validateApiKey from '../middlewares/validateApiKey.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('validateApiKey middleware', () => {
  test('returns 401 when Authorization header is missing', async () => {
    const req = { headers: {} };
    const res = makeRes();
    const next = jest.fn();
    await validateApiKey(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authorization header is missing' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when authorization type is not Bearer', async () => {
    const req = { headers: { authorization: 'Basic abc123' } };
    const res = makeRes();
    const next = jest.fn();
    await validateApiKey(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when Bearer token is absent', async () => {
    const req = { headers: { authorization: 'Bearer' } };
    const res = makeRes();
    const next = jest.fn();
    await validateApiKey(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next() and attaches decoded user for a valid token', async () => {
    const decoded = { uid: 'user123', email: 'test@kau.edu.sa' };
    mockVerifyIdToken.mockResolvedValueOnce(decoded);
    const req = { headers: { authorization: 'Bearer valid-token' } };
    const res = makeRes();
    const next = jest.fn();
    await validateApiKey(req, res, next);
    expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-token');
    expect(req.firebaseUser).toEqual(decoded);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('returns 401 when token verification throws', async () => {
    mockVerifyIdToken.mockRejectedValueOnce(new Error('Token expired'));
    const req = { headers: { authorization: 'Bearer bad-token' } };
    const res = makeRes();
    const next = jest.fn();
    await validateApiKey(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });
});
