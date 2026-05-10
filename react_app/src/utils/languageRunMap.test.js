import { LANGUAGE_RUN_MAP, isRunnable, getRunConfig } from './languageRunMap';

describe('languageRunMap', () => {
  test('LANGUAGE_RUN_MAP has python, javascript and java entries', () => {
    expect(LANGUAGE_RUN_MAP.py).toEqual({ language: 'python', version: '3.10.0' });
    expect(LANGUAGE_RUN_MAP.js).toEqual({ language: 'javascript', version: '18.15.0' });
    expect(LANGUAGE_RUN_MAP.java).toEqual({ language: 'java', version: '15.0.2' });
  });

  describe('isRunnable', () => {
    test.each([
      ['main.py', true],
      ['index.js', true],
      ['Main.java', true],
      ['MAIN.PY', true], // case-insensitive ext
      ['readme.md', false],
      ['styles.css', false],
      ['file', false],   ])('isRunnable(%s) === %s', (name, expected) => {
      expect(isRunnable(name)).toBe(expected);
    });

    test('returns false for null/undefined', () => {
      expect(isRunnable(null)).toBe(false);
      expect(isRunnable(undefined)).toBe(false);
    });
  });

  describe('getRunConfig', () => {
    test('returns the matching runtime config for runnable extensions', () => {
      expect(getRunConfig('main.py')).toEqual({ language: 'python', version: '3.10.0' });
      expect(getRunConfig('index.js')).toEqual({ language: 'javascript', version: '18.15.0' });
    });

    test('returns null for unknown extensions', () => {
      expect(getRunConfig('readme.md')).toBeNull();
      expect(getRunConfig('file')).toBeNull();
    });

    test('returns null for null/undefined input', () => {
      expect(getRunConfig(null)).toBeNull();
      expect(getRunConfig(undefined)).toBeNull();
    });
  });
});
