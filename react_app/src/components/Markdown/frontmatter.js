// Strip Hugo-style YAML frontmatter from a markdown string and return both
// the parsed object and the body. Hand-rolled so we don't ship gray-matter
// (and its js-yaml dep) just to read a handful of scalar fields.

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function coerce(value) {
  const v = value.trim();
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'null' || v === '') return null;
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
  // Strip surrounding quotes
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

export function parseFrontmatter(source) {
  if (typeof source !== 'string') return { data: {}, content: '' };
  const match = source.match(FRONTMATTER_RE);
  if (!match) return { data: {}, content: source };

  const data = {};
  for (const rawLine of match[1].split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1);
    if (!key) continue;
    data[key] = coerce(value);
  }

  return { data, content: source.slice(match[0].length) };
}
