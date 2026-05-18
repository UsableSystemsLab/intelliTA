import rateLimitRun from '../middlewares/rateLimitRun.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

describe('rateLimitRun middleware', () => {
  let nowSpy;
  let currentTime;

  beforeEach(() => {
    currentTime = 1_000_000_000_000;
    nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => currentTime);
  });

  afterEach(() => {
    nowSpy.mockRestore();
  });

  test('returns 401 when firebaseUser is missing', () => {
    const req = {};
    const res = makeRes();
    const next = jest.fn();
    rateLimitRun(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing user context' });
    expect(next).not.toHaveBeenCalled();
  });

  test('allows first request and calls next', () => {
    const req = { firebaseUser: { uid: 'user_first' } };
    const res = makeRes();
    const next = jest.fn();
    rateLimitRun(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('blocks rapid second request with 429 and Retry-After', () => {
    const uid = 'user_rapid';
    const next = jest.fn();
    rateLimitRun({ firebaseUser: { uid } }, makeRes(), next);
    currentTime += 500;
    const res = makeRes();
    rateLimitRun({ firebaseUser: { uid } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.set).toHaveBeenCalledWith('Retry-After', expect.any(String));
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('Slow down') })
    );
  });

  test('allows request after MIN_INTERVAL_MS passes', () => {
    const uid = 'user_spaced';
    rateLimitRun({ firebaseUser: { uid } }, makeRes(), jest.fn());
    currentTime += 2500;
    const res = makeRes();
    const next = jest.fn();
    rateLimitRun({ firebaseUser: { uid } }, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('resets minute window after 60s passes', () => {
    const uid = 'user_reset';
    rateLimitRun({ firebaseUser: { uid } }, makeRes(), jest.fn());
    currentTime += 60_001;
    const res = makeRes();
    const next = jest.fn();
    rateLimitRun({ firebaseUser: { uid } }, res, next);
    expect(next).toHaveBeenCalled();
  });
});
