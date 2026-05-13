import { render, screen } from '@testing-library/react';
import HugoMarkdown from '../HugoMarkdown';

describe('HugoMarkdown', () => {
  test('renders nothing for empty source', () => {
    const { container } = render(<HugoMarkdown source="" />);
    expect(container).toBeEmptyDOMElement();
  });

  test('renders frontmatter title as a heading', () => {
    const src = `---\ntitle: "Lab 1: OOP"\n---\n# body heading`;
    render(<HugoMarkdown source={src} />);
    expect(screen.getByRole('heading', { name: 'Lab 1: OOP' })).toBeInTheDocument();
  });

  test('renders youtube shortcode as iframe with parsed src', () => {
    render(<HugoMarkdown source={'{{< youtube id="abc?rel=0" title="My Vid" >}}'} />);
    const iframe = screen.getByTitle('My Vid');
    expect(iframe.tagName).toBe('IFRAME');
    expect(iframe.getAttribute('src')).toBe('https://www.youtube.com/embed/abc?rel=0');
  });

  test('renders githubclassroom links and disables # entries', () => {
    render(<HugoMarkdown source={'{{< githubclassroom "IT1 =https://x" "IT3 =#" >}}'} />);
    const live = screen.getByRole('link', { name: 'IT1' });
    expect(live).toHaveAttribute('href', 'https://x');
    expect(screen.getByText(/IT3 \(coming soon\)/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'IT3' })).toBeNull();
  });

  test('drops unknown shortcodes without leaking raw text', () => {
    const { container } = render(<HugoMarkdown source={'{{< unknown foo="bar" >}}'} />);
    expect(container.textContent).not.toMatch(/unknown/);
    expect(container.textContent).not.toMatch(/\{\{</);
  });

  test('passes markdown body through react-markdown (mocked)', () => {
    render(<HugoMarkdown source={'# Hello\n\nworld'} />);
    // The mock renders markdown content inside [data-testid="markdown"]
    const blocks = screen.getAllByTestId('markdown');
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks[0].textContent).toContain('# Hello');
  });

  test('splits markdown around shortcodes into separate blocks', () => {
    render(<HugoMarkdown source={'before\n{{< youtube id="x" >}}\nafter'} />);
    const blocks = screen.getAllByTestId('markdown');
    expect(blocks).toHaveLength(2);
    expect(blocks[0].textContent).toContain('before');
    expect(blocks[1].textContent).toContain('after');
  });
});
