// Parses Hugo shortcodes ({{< name k="v" "positional" >}}) into tokens that
// HugoMarkdown replaces with React components. Unknown shortcodes are dropped
// silently rather than leaking as raw text.

const SHORTCODE_RE = /\{\{<\s*([a-zA-Z0-9_-]+)([\s\S]*?)\s*>\}\}/g;

// Extract argument list. Hugo accepts both named (k="v") and positional ("v").
// We tokenize on quoted strings so values containing spaces or '=' survive.
function parseArgs(raw) {
  const named = {};
  const positional = [];
  if (!raw) return { named, positional };

  const tokenRe = /([a-zA-Z0-9_-]+)\s*=\s*"([^"]*)"|"([^"]*)"|([^\s"]+)/g;
  let m;
  while ((m = tokenRe.exec(raw)) !== null) {
    if (m[1] !== undefined) {
      named[m[1]] = m[2];
    } else if (m[3] !== undefined) {
      positional.push(m[3]);
    } else if (m[4] !== undefined) {
      // bare token like 'k=v' (no quotes)
      const eq = m[4].indexOf('=');
      if (eq > 0) {
        named[m[4].slice(0, eq)] = m[4].slice(eq + 1);
      } else {
        positional.push(m[4]);
      }
    }
  }
  return { named, positional };
}

// Split a YouTube id field. Hugo uses `id="cnb0Wb6sFVk?rel=0"` — the part
// after `?` is query params for the embed iframe.
export function parseYoutubeId(raw) {
  if (!raw) return { id: '', query: '' };
  const idx = raw.indexOf('?');
  if (idx === -1) return { id: raw, query: '' };
  return { id: raw.slice(0, idx), query: raw.slice(idx + 1) };
}

// Parse githubclassroom positional args of the form `LABEL=URL`.
// Entries with URL `#` are treated as disabled (no link).
export function parseClassroomLinks(positional) {
  return positional
    .map((entry) => {
      const eq = entry.indexOf('=');
      if (eq < 0) return null;
      const label = entry.slice(0, eq).trim();
      const url = entry.slice(eq + 1).trim();
      if (!label) return null;
      return { label, url, disabled: !url || url === '#' };
    })
    .filter(Boolean);
}

// Tokenize markdown into an ordered list of {type:'md', text} and
// {type:'shortcode', name, named, positional} segments.
export function tokenizeShortcodes(markdown) {
  if (!markdown) return [];
  const tokens = [];
  let cursor = 0;
  SHORTCODE_RE.lastIndex = 0;
  let m;
  while ((m = SHORTCODE_RE.exec(markdown)) !== null) {
    if (m.index > cursor) {
      tokens.push({ type: 'md', text: markdown.slice(cursor, m.index) });
    }
    const { named, positional } = parseArgs(m[2]);
    tokens.push({ type: 'shortcode', name: m[1], named, positional });
    cursor = m.index + m[0].length;
  }
  if (cursor < markdown.length) {
    tokens.push({ type: 'md', text: markdown.slice(cursor) });
  }
  return tokens;
}
