import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import { tokenizeShortcodes, parseYoutubeId, parseClassroomLinks } from './hugoShortcodes';
import { parseFrontmatter } from './frontmatter';

const MARKDOWN_COMPONENTS = {
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold text-white mb-4 pb-2 border-b border-gray-700">{children}</h1>
  ),
  h2: ({ children }) => <h2 className="text-xl font-semibold text-white mb-3 mt-6">{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-semibold text-white mb-2 mt-4">{children}</h3>,
  h4: ({ children }) => <h4 className="text-base font-semibold text-white mb-2 mt-4">{children}</h4>,
  p: ({ children }) => <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc list-outside text-gray-300 mb-4 space-y-1 ml-6">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-outside text-gray-300 mb-4 space-y-1 ml-6">{children}</ol>,
  li: ({ children }) => <li className="text-gray-300">{children}</li>,
  strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic text-gray-200">{children}</em>,
  code: ({ inline, className, children }) => {
    if (inline) {
      return <code className="bg-gray-800 px-1.5 py-0.5 rounded text-blue-400 text-sm font-mono">{children}</code>;
    }
    return <code className={`${className || ''} text-sm font-mono`}>{children}</code>;
  },
  pre: ({ children }) => (
    <pre className="bg-[#0d1117] p-4 rounded-lg overflow-x-auto mb-4 border border-gray-700 text-sm">{children}</pre>
  ),
  a: ({ href, children }) => (
    <a href={href} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-400 mb-4 bg-gray-800/50 py-2 rounded-r">{children}</blockquote>
  ),
  hr: () => <hr className="border-gray-700 my-6" />,
  img: ({ src, alt }) => (
    <img src={src} alt={alt} className="max-w-full h-auto rounded-lg my-4 border border-gray-700" />
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4">
      <table className="w-full border-collapse border border-gray-700 text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-800">{children}</thead>,
  th: ({ children }) => <th className="border border-gray-700 px-3 py-2 text-left text-white font-semibold">{children}</th>,
  td: ({ children }) => <td className="border border-gray-700 px-3 py-2 text-gray-300">{children}</td>,
};

const REMARK_PLUGINS = [remarkGfm];
const REHYPE_PLUGINS = [rehypeRaw, rehypeHighlight];

function MarkdownBlock({ source }) {
  return (
    <ReactMarkdown
      remarkPlugins={REMARK_PLUGINS}
      rehypePlugins={REHYPE_PLUGINS}
      components={MARKDOWN_COMPONENTS}
    >
      {source}
    </ReactMarkdown>
  );
}

function YoutubeShortcode({ id, title }) {
  const { id: videoId, query } = parseYoutubeId(id);
  if (!videoId) return null;
  const src = `https://www.youtube.com/embed/${videoId}${query ? `?${query}` : ''}`;
  return (
    <div className="relative my-6 rounded-lg overflow-hidden border border-gray-700 bg-black" style={{ paddingBottom: '56.25%' }}>
      <iframe
        src={src}
        title={title || 'YouTube video'}
        className="absolute top-0 left-0 w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function GithubClassroomShortcode({ positional }) {
  const links = parseClassroomLinks(positional);
  if (links.length === 0) return null;
  return (
    <div className="my-6 p-5 bg-gray-900/60 border border-gray-700 rounded-xl">
      <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">GitHub Classroom</h4>
      <ul className="grid grid-cols-2 gap-2 ml-0 list-none">
        {links.map((l) => (
          <li key={l.label}>
            {l.disabled ? (
              <span className="inline-block px-3 py-2 bg-gray-800/50 text-gray-500 rounded-md text-sm cursor-not-allowed">
                {l.label} (coming soon)
              </span>
            ) : (
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 hover:text-white rounded-md text-sm transition-colors border border-blue-500/30"
              >
                {l.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function renderShortcode(token, key) {
  switch (token.name) {
    case 'youtube':
      return <YoutubeShortcode key={key} id={token.named.id || token.positional[0]} title={token.named.title} />;
    case 'githubclassroom':
      return <GithubClassroomShortcode key={key} positional={token.positional} />;
    default:
      // Unknown shortcode — silently drop instead of leaking raw text.
      return null;
  }
}

export default function HugoMarkdown({ source = '' }) {
  const { data, content, tokens } = useMemo(() => {
    const fm = parseFrontmatter(source);
    return { data: fm.data, content: fm.content, tokens: tokenizeShortcodes(fm.content) };
  }, [source]);

  if (!source) return null;

  return (
    <div className="hugo-markdown">
      {data.title && (
        <h1 className="text-3xl font-bold text-white mb-2">{data.title}</h1>
      )}
      {tokens.map((tok, i) =>
        tok.type === 'md'
          ? <MarkdownBlock key={i} source={tok.text} />
          : renderShortcode(tok, i)
      )}
    </div>
  );
}
