import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

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

jest.mock('./FileExplorer', () => ({
  __esModule: true,
  default: ({ files, activeFile, onFileSelect }) => (
    <ul data-testid="file-explorer">
      {files.map((f) => (
        <li key={f.name}>
          <button onClick={() => onFileSelect(f)} aria-current={f.name === activeFile?.name}>
            {f.name}
          </button>
        </li>
      ))}
    </ul>
  ),
}));

jest.mock('./PreviewPane', () => ({
  __esModule: true,
  default: () => <div data-testid="preview-pane" />,
}));

import CodeEditorSection from './CodeEditorSection';

const baseFiles = [
  { name: 'index.js', content: 'console.log(1);', language: 'javascript' },
  { name: 'README.md', content: '# hi', language: 'markdown' },
];

const renderUI = (overrides = {}) => {
  const props = {
    files: baseFiles,
    activeFile: baseFiles[0],
    feedback: null,
    activeCheckpoint: null,
    onFileSelect: jest.fn(),
    onFileChange: jest.fn(),
    courseName: 'CS101',
    courseId: 'c1',
    activityTitle: 'Activity 1',
    onAskAI: jest.fn(),
    onRun: jest.fn(),
    runState: 'idle',
    runOutput: '',
    ...overrides,
  };
  return {
    props,
    ...render(
      <MemoryRouter>
        <CodeEditorSection {...props} />
      </MemoryRouter>,
    ),
  };
};

describe('CodeEditorSection', () => {
  test('renders Monaco editor for non-markdown active file', () => {
    renderUI();
    expect(screen.getByTestId('monaco')).toBeInTheDocument();
  });

  test('renders Markdown preview when active file is .md', () => {
    renderUI({ activeFile: baseFiles[1] });
    expect(screen.queryByTestId('monaco')).not.toBeInTheDocument();
    expect(screen.getByTestId('markdown')).toHaveTextContent('# hi');
  });

  test('shows Run button for runnable files and triggers onRun', () => {
    const { props } = renderUI();
    const runBtn = screen.getByRole('button', { name: /run/i });
    fireEvent.click(runBtn);
    expect(props.onRun).toHaveBeenCalled();
  });

  test('Run button is disabled while running', () => {
    renderUI({ runState: 'running' });
    const runBtn = screen.getByRole('button', { name: /running/i });
    expect(runBtn).toBeDisabled();
  });

  test('breadcrumb shows course and activity titles', () => {
    renderUI();
    expect(screen.getByText('CS101')).toBeInTheDocument();
    expect(screen.getByText('Activity 1')).toBeInTheDocument();
  });

  test('shows feedback dot when feedback is provided', () => {
    const { container } = renderUI({ feedback: { type: 'success', message: 'ok' } });
    expect(container.querySelector('.bg-emerald-400')).toBeInTheDocument();
  });

  test('shows Preview tab when project has html', () => {
    const webFiles = [
      { name: 'index.html', content: '<p>hi</p>', language: 'html' },
      { name: 'style.css', content: '', language: 'css' },
    ];
    renderUI({ files: webFiles, activeFile: webFiles[0] });
    expect(screen.getByText('previewTab')).toBeInTheDocument();
  });

  test('passes onFileChange through to the editor', () => {
    const { props } = renderUI();
    fireEvent.change(screen.getByTestId('monaco'), { target: { value: 'next' } });
    expect(props.onFileChange).toHaveBeenCalledWith('next');
  });
});
