import { parseFrontmatter } from '../frontmatter';

describe('parseFrontmatter', () => {
  test('strips YAML and exposes typed values', () => {
    const src = `---\ntitle: "Lab 1"\ntoc: true\ndraft: false\nweek: 3\n---\n# Body`;
    const { data, content } = parseFrontmatter(src);
    expect(data).toEqual({ title: 'Lab 1', toc: true, draft: false, week: 3 });
    expect(content).toBe('# Body');
  });

  test('returns empty data when no frontmatter present', () => {
    const { data, content } = parseFrontmatter('# Just markdown');
    expect(data).toEqual({});
    expect(content).toBe('# Just markdown');
  });

  test('handles single-quoted values and floats', () => {
    const { data } = parseFrontmatter(`---\nname: 'Lab'\nratio: 1.5\n---\nbody`);
    expect(data.name).toBe('Lab');
    expect(data.ratio).toBe(1.5);
  });

  test('skips blank and commented lines', () => {
    const { data } = parseFrontmatter(`---\n# a comment\n\ntitle: X\n---\n`);
    expect(data).toEqual({ title: 'X' });
  });

  test('handles non-string input safely', () => {
    expect(parseFrontmatter(undefined)).toEqual({ data: {}, content: '' });
    expect(parseFrontmatter(null)).toEqual({ data: {}, content: '' });
  });
});
