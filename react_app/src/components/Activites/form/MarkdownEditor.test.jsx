import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MarkdownEditor from './MarkdownEditor';

describe('MarkdownEditor', () => {
  test('renders default label and prompt when value is empty', () => {
    render(<MarkdownEditor value="" onChange={() => {}} />);
    expect(screen.getByText('Markdown Content')).toBeInTheDocument();
    expect(screen.getByText('clickToWriteMarkdown')).toBeInTheDocument();
  });

  test('renders custom label', () => {
    render(<MarkdownEditor value="" onChange={() => {}} label="Description" />);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  test('shows the value as a truncated preview in the trigger', () => {
    const long = 'a'.repeat(200);
    render(<MarkdownEditor value={long} onChange={() => {}} />);
    const trigger = screen.getByRole('button');
    expect(trigger.textContent).toContain('a'.repeat(150));
    expect(trigger.textContent).toContain('...');
  });

  test('opens the modal when trigger is clicked', () => {
    render(<MarkdownEditor value="" onChange={() => {}} />);
    fireEvent.click(screen.getByText('clickToWriteMarkdown'));
    expect(screen.getByText('markdownEditor')).toBeInTheDocument();
  });

  test('typing in textarea calls onChange with new value', () => {
    const onChange = jest.fn();
    render(<MarkdownEditor value="" onChange={onChange} />);
    fireEvent.click(screen.getByText('clickToWriteMarkdown'));
    const textarea = screen.getByPlaceholderText(/startWritingMarkdown|markdown/i);
    fireEvent.change(textarea, { target: { value: '# Hello' } });
    expect(onChange).toHaveBeenCalledWith('# Hello');
  });

  test('done button closes the modal', () => {
    render(<MarkdownEditor value="content" onChange={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /content/i }));
    expect(screen.getByText('markdownEditor')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^done$/i }));
    expect(screen.queryByText('markdownEditor')).not.toBeInTheDocument();
  });
});
