import {
  isKauEmail,
  KAU_INSTRUCTOR_DOMAIN,
  KAU_STUDENT_DOMAIN,
  KAU_DOMAIN_ERROR,
} from './kauDomain';

describe('kauDomain', () => {
  describe('constants', () => {
    test('exports the expected domain strings', () => {
      expect(KAU_INSTRUCTOR_DOMAIN).toBe('kau.edu.sa');
      expect(KAU_STUDENT_DOMAIN).toBe('stu.kau.edu.sa');
    });

    test('exports a non-empty error message', () => {
      expect(typeof KAU_DOMAIN_ERROR).toBe('string');
      expect(KAU_DOMAIN_ERROR.length).toBeGreaterThan(0);
    });
  });

  describe('isKauEmail', () => {
    test('accepts instructor domain', () => {
      expect(isKauEmail('jane@kau.edu.sa')).toBe(true);
    });

    test('accepts student domain', () => {
      expect(isKauEmail('s123@stu.kau.edu.sa')).toBe(true);
    });

    test('is case-insensitive', () => {
      expect(isKauEmail('Jane@KAU.EDU.SA')).toBe(true);
      expect(isKauEmail('S123@Stu.Kau.Edu.Sa')).toBe(true);
    });

    test('trims surrounding whitespace', () => {
      expect(isKauEmail('  jane@kau.edu.sa  ')).toBe(true);
    });

    test('rejects unrelated domains', () => {
      expect(isKauEmail('jane@gmail.com')).toBe(false);
      expect(isKauEmail('jane@example.edu')).toBe(false);
    });

    test('rejects look-alike domains', () => {
      expect(isKauEmail('jane@kau.edu.sa.evil.com')).toBe(false);
      expect(isKauEmail('jane@notkau.edu.sa')).toBe(false);
      expect(isKauEmail('jane@kau-edu-sa.com')).toBe(false);
    });

    test('rejects empty / null / non-string inputs', () => {
      expect(isKauEmail('')).toBe(false);
      expect(isKauEmail(null)).toBe(false);
      expect(isKauEmail(undefined)).toBe(false);
      expect(isKauEmail(123)).toBe(false);
      expect(isKauEmail({})).toBe(false);
    });
  });
});
