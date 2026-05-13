import { useState } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MarkdownEditor from '../MarkdownEditor';

function Harness({ initial = '' }) {
  const [value, setValue] = useState(initial);
  return (
    <div>
      <MarkdownEditor value={value} onChange={setValue} />
      <textarea data-testid="captured" value={value} readOnly />
    </div>
  );
}

function openModal() {
  fireEvent.click(screen.getByText(/click to write markdown|markdownEditor/i, { selector: 'button, span' }) || screen.getAllByRole('button')[0]);
}

describe('MarkdownEditor toolbar (Hugo additions)', () => {
  test('YouTube button inserts youtube shortcode', () => {
    render(<Harness />);
    // Open modal
    fireEvent.click(screen.getByRole('button')); // first trigger button
    const ytBtn = screen.getByTitle('YouTube Shortcode');
    act(() => fireEvent.click(ytBtn));
    expect(screen.getByTestId('captured').value).toContain('{{< youtube id="VIDEO_ID?rel=0" title="Video title" >}}');
  });

  test('GitHub Classroom button inserts shortcode', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button'));
    act(() => fireEvent.click(screen.getByTitle('GitHub Classroom Shortcode')));
    expect(screen.getByTestId('captured').value).toContain('{{< githubclassroom');
  });

  test('Frontmatter button inserts YAML scaffold', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button'));
    act(() => fireEvent.click(screen.getByTitle('Frontmatter')));
    const captured = screen.getByTestId('captured').value;
    expect(captured).toMatch(/^---\ntitle: "Lab Title"/);
    expect(captured).toContain('toc: true');
  });

  test('Info Hint Box button inserts Bulma message', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button'));
    act(() => fireEvent.click(screen.getByTitle('Info Hint Box')));
    const captured = screen.getByTestId('captured').value;
    expect(captured).toContain('<article class="message is-info">');
    expect(captured).toContain('<strong>Hint:</strong>');
  });

  test('Preview pane renders HugoMarkdown for entered value', () => {
    render(<Harness initial={'{{< youtube id="abc" title="Demo" >}}'} />);
    fireEvent.click(screen.getByRole('button')); // open modal
    expect(screen.getByTitle('Demo').tagName).toBe('IFRAME');
  });
});
