import {
  FILE_LANGUAGES,
  OTHER_LANGUAGE,
  TESTS_LANGUAGES,
  TEST_TEMPLATES,
  detectLanguageFromFilename,
  monacoLanguageFromFilename,
} from './fileLanguages';

describe('fileLanguages constants', () => {
  test('FILE_LANGUAGES contains the five expected entries', () => {
    expect(FILE_LANGUAGES.map((l) => l.id)).toEqual([
      'java',
      'python',
      'javascript',
      'css',
      'html',
    ]);
  });

  test('OTHER_LANGUAGE is plaintext fallback', () => {
    expect(OTHER_LANGUAGE.id).toBe('other');
    expect(OTHER_LANGUAGE.monaco).toBe('plaintext');
  });

  test('TESTS_LANGUAGES exposes piston runtimes', () => {
    expect(TESTS_LANGUAGES.map((l) => l.runtime)).toEqual([
      'python:3.10.0',
      'javascript:18.15.0',
      'java:15.0.2',
    ]);
  });

  test('TEST_TEMPLATES has a non-empty template for each tests language', () => {
    for (const { id } of TESTS_LANGUAGES) {
      expect(TEST_TEMPLATES[id]).toBeDefined();
      expect(TEST_TEMPLATES[id].length).toBeGreaterThan(0);
      expect(TEST_TEMPLATES[id][0].path).toEqual(expect.any(String));
      expect(TEST_TEMPLATES[id][0].content).toEqual(expect.any(String));
    }
  });
});

describe('detectLanguageFromFilename', () => {
  test.each([
    ['Foo.java', 'java'],
    ['main.py', 'python'],
    ['app.js', 'javascript'],
    ['styles.css', 'css'],
    ['index.html', 'html'],
    ['INDEX.HTML', 'html'], // case-insensitive
  ])('detects %s as %s', (filename, expected) => {
    expect(detectLanguageFromFilename(filename)).toBe(expected);
  });

  test('returns OTHER for unknown extensions', () => {
    expect(detectLanguageFromFilename('readme.md')).toBe(OTHER_LANGUAGE.id);
    expect(detectLanguageFromFilename('file')).toBe(OTHER_LANGUAGE.id);
  });

  test('returns OTHER for null/undefined/empty', () => {
    expect(detectLanguageFromFilename(null)).toBe(OTHER_LANGUAGE.id);
    expect(detectLanguageFromFilename(undefined)).toBe(OTHER_LANGUAGE.id);
    expect(detectLanguageFromFilename('')).toBe(OTHER_LANGUAGE.id);
  });
});

describe('monacoLanguageFromFilename', () => {
  test.each([
    ['main.py', 'python'],
    ['app.js', 'javascript'],
    ['Foo.java', 'java'],
    ['styles.css', 'css'],
    ['index.html', 'html'],
  ])('returns %s monaco language for %s', (filename, expected) => {
    expect(monacoLanguageFromFilename(filename)).toBe(expected);
  });

  test('returns plaintext for unknown extensions', () => {
    expect(monacoLanguageFromFilename('readme.md')).toBe('plaintext');
    expect(monacoLanguageFromFilename(null)).toBe('plaintext');
  });
});
