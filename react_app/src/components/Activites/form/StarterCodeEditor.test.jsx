import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: ({ value, onChange }) => (
    <textarea
      data-testid="monaco"
      value={value || ''}
      onChange={(e) => onChange && onChange(e.target.value)}
    />
  ),
}));

import StarterCodeEditor from './StarterCodeEditor';

describe('StarterCodeEditor', () => {
  test('renders empty-state prompt when no files', () => {
    render(<StarterCodeEditor files={[]} onFilesChange={() => {}} />);
    // The trigger derives from defaults (3 files) but label still uses no-files text only when currentFiles empty.
    // currentFiles falls back to defaults — so a "3 files" summary should be present.
    expect(screen.getByText(/3 files/)).toBeInTheDocument();
  });

  test('summarizes file count and test count', () => {
    const files = [{ name: 'a.js', content: 'x' }];
    const testFiles = [{ name: 'a.test.js', content: 'x' }];
    render(
      <StarterCodeEditor
        files={files}
        onFilesChange={() => {}}
        testFiles={testFiles}
        testsLanguage="javascript"
      />,
    );
    expect(screen.getByText(/1 file/)).toBeInTheDocument();
    expect(screen.getByText(/1 test/)).toBeInTheDocument();
  });

  test('opening modal when no files seeds defaults via onFilesChange', () => {
    const onFilesChange = jest.fn();
    render(<StarterCodeEditor files={[]} onFilesChange={onFilesChange} />);
    fireEvent.click(screen.getByText(/3 files/));
    expect(onFilesChange).toHaveBeenCalled();
    const seeded = onFilesChange.mock.calls[0][0];
    const names = seeded.map((f) => f.name);
    expect(names).toEqual(['index.html', 'style.css', 'script.js']);
  });

  test('opening modal does not overwrite existing files', () => {
    const onFilesChange = jest.fn();
    const files = [{ name: 'main.py', content: '' }];
    render(<StarterCodeEditor files={files} onFilesChange={onFilesChange} />);
    fireEvent.click(screen.getByText(/1 file/));
    expect(onFilesChange).not.toHaveBeenCalled();
  });

  test('shows testsLanguage label on trigger when set', () => {
    render(
      <StarterCodeEditor
        files={[{ name: 'a.js', content: '' }]}
        onFilesChange={() => {}}
        testsLanguage="python"
      />,
    );
    expect(screen.getByText(/Python/i)).toBeInTheDocument();
  });
});
