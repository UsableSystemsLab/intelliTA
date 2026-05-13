import {
  tokenizeShortcodes,
  parseYoutubeId,
  parseClassroomLinks,
} from '../hugoShortcodes';

describe('parseYoutubeId', () => {
  test('returns id without query when no question mark', () => {
    expect(parseYoutubeId('cnb0Wb6sFVk')).toEqual({ id: 'cnb0Wb6sFVk', query: '' });
  });
  test('splits id and query', () => {
    expect(parseYoutubeId('cnb0Wb6sFVk?rel=0')).toEqual({ id: 'cnb0Wb6sFVk', query: 'rel=0' });
  });
  test('handles empty input', () => {
    expect(parseYoutubeId('')).toEqual({ id: '', query: '' });
    expect(parseYoutubeId(undefined)).toEqual({ id: '', query: '' });
  });
});

describe('parseClassroomLinks', () => {
  test('parses LABEL=URL pairs', () => {
    const result = parseClassroomLinks(['IT1 =https://example.com/a', 'HAR =https://example.com/b']);
    expect(result).toEqual([
      { label: 'IT1', url: 'https://example.com/a', disabled: false },
      { label: 'HAR', url: 'https://example.com/b', disabled: false },
    ]);
  });
  test('marks # URLs as disabled', () => {
    const result = parseClassroomLinks(['IT3 =#']);
    expect(result[0]).toMatchObject({ label: 'IT3', disabled: true });
  });
  test('drops malformed entries', () => {
    const result = parseClassroomLinks(['nopair', '=onlyurl', 'OK =https://x']);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('OK');
  });
});

describe('tokenizeShortcodes', () => {
  test('returns single md token when no shortcodes', () => {
    const tokens = tokenizeShortcodes('# Hello\n\nworld');
    expect(tokens).toEqual([{ type: 'md', text: '# Hello\n\nworld' }]);
  });

  test('extracts youtube shortcode with named args', () => {
    const md = 'before\n{{< youtube id="abc?rel=0" title="Lab 1" >}}\nafter';
    const tokens = tokenizeShortcodes(md);
    expect(tokens).toHaveLength(3);
    expect(tokens[0]).toEqual({ type: 'md', text: 'before\n' });
    expect(tokens[1]).toMatchObject({
      type: 'shortcode',
      name: 'youtube',
      named: { id: 'abc?rel=0', title: 'Lab 1' },
    });
    expect(tokens[2]).toEqual({ type: 'md', text: '\nafter' });
  });

  test('extracts githubclassroom positional args', () => {
    const md = '{{< githubclassroom "IT1 =https://x" "IT2 =#" >}}';
    const tokens = tokenizeShortcodes(md);
    expect(tokens[0]).toMatchObject({
      type: 'shortcode',
      name: 'githubclassroom',
      positional: ['IT1 =https://x', 'IT2 =#'],
    });
  });

  test('preserves unknown shortcodes as tokens (renderer drops them)', () => {
    const tokens = tokenizeShortcodes('{{< unknown foo="bar" >}}');
    expect(tokens[0]).toMatchObject({ type: 'shortcode', name: 'unknown', named: { foo: 'bar' } });
  });

  test('returns empty array for empty input', () => {
    expect(tokenizeShortcodes('')).toEqual([]);
    expect(tokenizeShortcodes(null)).toEqual([]);
  });
});
