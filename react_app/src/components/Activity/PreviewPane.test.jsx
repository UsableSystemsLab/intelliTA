import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PreviewPane from './PreviewPane';

describe('PreviewPane', () => {
  test('renders "add HTML" hint when no html file present', () => {
    render(<PreviewPane files={[{ name: 'a.js', content: '' }]} />);
    expect(screen.getByText('addHtmlHint')).toBeInTheDocument();
  });

  test('renders run/clear/popOut controls when html file present', () => {
    render(<PreviewPane files={[{ name: 'index.html', content: '<p>hi</p>' }]} />);
    expect(screen.getByRole('button', { name: /runLabel/i })).toBeInTheDocument();
    expect(screen.getByTitle('clearLogsLabel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /popOut/i })).toBeInTheDocument();
  });

  test('clicking Run swaps the placeholder for an iframe and increments runCount', () => {
    const { container } = render(
      <PreviewPane files={[{ name: 'index.html', content: '<p>hi</p>' }]} />,
    );
    expect(screen.getByText('pressRunHint')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /runLabel/i }));
    expect(container.querySelector('iframe[title="preview"]')).toBeInTheDocument();
    expect(screen.queryByText('pressRunHint')).not.toBeInTheDocument();
  });

  test('popOut notifies via onFloatingChange and switches inline area to popIn hint', () => {
    const onFloatingChange = jest.fn();
    render(
      <PreviewPane
        files={[{ name: 'index.html', content: '<p>hi</p>' }]}
        onFloatingChange={onFloatingChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /popOut/i }));
    expect(onFloatingChange).toHaveBeenCalledWith(true);
    expect(screen.getAllByText('popIn').length).toBeGreaterThan(0);
  });

  test('clear button after run does not crash and inline preview still mounted', () => {
    const { container } = render(
      <PreviewPane files={[{ name: 'index.html', content: '<p>hi</p>' }]} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /runLabel/i }));
    fireEvent.click(screen.getByTitle('clearLogsLabel'));
    expect(container.querySelector('iframe[title="preview"]')).toBeInTheDocument();
  });
});
