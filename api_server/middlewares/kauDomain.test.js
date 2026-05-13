import { isKauEmail, restrictToKauDomain } from '../middlewares/kauDomain.js';

describe('isKauEmail', () => {
  test.each([
    ['instructor @kau.edu.sa', 'prof@kau.edu.sa', true],
    ['student @stu.kau.edu.sa', 's@stu.kau.edu.sa', true],
    ['uppercase domain', 'PROF@KAU.EDU.SA', true],
    ['mixed case', 'Prof@Stu.Kau.Edu.Sa', true],
    ['leading/trailing whitespace', '  prof@kau.edu.sa  ', true],
  ])('accepts %s', (_, email, expected) => {
    expect(isKauEmail(email)).toBe(expected);
  });

  test.each([
    ['gmail address', 'user@gmail.com'],
    ['empty string', ''],
    ['null', null],
    ['number', 123],
    ['undefined', undefined],
    ['just the domain', 'kau.edu.sa'],
    ['wrong subdomain', 'u@evil.kau.edu.sa'],
    ['kau in wrong tld', 'user@kau.com'],
    ['no @', 'profkau.edu.sa'],
  ])('rejects %s', (_, email) => {
    expect(isKauEmail(email)).toBe(false);
  });
});

describe('restrictToKauDomain middleware', () => {
  const makeRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  test('calls next() for a valid KAU instructor email', () => {
    const req = { body: { email: 'dr.smith@kau.edu.sa' } };
    const res = makeRes();
    const next = jest.fn();
    restrictToKauDomain(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('calls next() for a valid KAU student email', () => {
    const req = { body: { email: 'student123@stu.kau.edu.sa' } };
    const res = makeRes();
    const next = jest.fn();
    restrictToKauDomain(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('returns 403 and does not call next() for a non-KAU email', () => {
    const req = { body: { email: 'user@gmail.com' } };
    const res = makeRes();
    const next = jest.fn();
    restrictToKauDomain(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('KAU') })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when email is absent from request body', () => {
    const req = { body: {} };
    const res = makeRes();
    const next = jest.fn();
    restrictToKauDomain(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when body is undefined', () => {
    const req = {};
    const res = makeRes();
    const next = jest.fn();
    restrictToKauDomain(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
