import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileExplorer from './FileExplorer';

const sample = [
  { name: 'Main.java', content: '' },
  { name: 'helper.js', content: '' },
  { name: 'app.tsx', content: '' },
  { name: 'README.md', content: '' },
  { name: 'package.json', content: '' },
  { name: 'styles.css', content: '' },
  { name: 'index.html', content: '' },
  { name: 'unknown.xyz', content: '' },
];

describe('FileExplorer', () => {
  test('returns null when files is undefined', () => {
    const { container } = render(
      <FileExplorer files={undefined} activeFile={{ name: '' }} onFileSelect={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('lists all file names', () => {
    render(
      <FileExplorer files={sample} activeFile={sample[0]} onFileSelect={() => {}} />
    );
    sample.forEach((f) => {
      expect(screen.getByText(f.name)).toBeInTheDocument();
    });
  });

  test('clicking a file invokes onFileSelect with that file', async () => {
    const onFileSelect = jest.fn();
    const user = userEvent.setup();
    render(
      <FileExplorer files={sample} activeFile={sample[0]} onFileSelect={onFileSelect} />
    );
    await user.click(screen.getByText('helper.js'));
    expect(onFileSelect).toHaveBeenCalledTimes(1);
    expect(onFileSelect).toHaveBeenCalledWith(sample[1]);
  });

  test('highlights the active file', () => {
    render(
      <FileExplorer files={sample} activeFile={sample[2]} onFileSelect={() => {}} />
    );
    const activeBtn = screen.getByText('app.tsx').closest('button');
    expect(activeBtn.className).toMatch(/bg-blue-500/);
    const inactiveBtn = screen.getByText('Main.java').closest('button');
    expect(inactiveBtn.className).not.toMatch(/bg-blue-500/);
  });

  test('renders distinct icons per file extension (smoke check)', () => {
    const { container } = render(
      <FileExplorer files={sample} activeFile={sample[0]} onFileSelect={() => {}} />
    );
    // Each row has a leading icon (svg or styled span).
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(sample.length);
    buttons.forEach((btn) => {
      const hasIcon = btn.querySelector('svg') || btn.querySelector('span.text-orange-400');
      expect(hasIcon).toBeTruthy();
    });
  });
});
