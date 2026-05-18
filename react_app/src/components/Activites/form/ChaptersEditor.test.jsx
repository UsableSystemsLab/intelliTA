import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChaptersEditor from './ChaptersEditor';

describe('ChaptersEditor', () => {
  test('shows "click to add chapters" when no chapters exist', () => {
    render(<ChaptersEditor chapters={[]} onChaptersChange={() => {}} />);
    expect(screen.getByText('clickToAddChapters')).toBeInTheDocument();
  });

  test('summarizes existing chapters in trigger button', () => {
    const chapters = [
      { id: 1, title: 'Intro', start_time_seconds: 0 },
      { id: 2, title: 'Body', start_time_seconds: 90 },
    ];
    render(<ChaptersEditor chapters={chapters} onChaptersChange={() => {}} />);
    expect(screen.getByText(/2 chapters/)).toBeInTheDocument();
    expect(screen.getByText(/00:00 - Intro/)).toBeInTheDocument();
    expect(screen.getByText(/01:30 - Body/)).toBeInTheDocument();
  });

  test('opens the modal when the trigger is clicked', () => {
    render(<ChaptersEditor chapters={[]} onChaptersChange={() => {}} />);
    fireEvent.click(screen.getByText('clickToAddChapters'));
    expect(screen.getByText('noChaptersYet')).toBeInTheDocument();
  });

  test('clicking "Add Chapter" calls onChaptersChange with a new empty chapter', () => {
    const onChaptersChange = jest.fn();
    render(<ChaptersEditor chapters={[]} onChaptersChange={onChaptersChange} />);
    fireEvent.click(screen.getByText('clickToAddChapters'));
    const addBtns = screen.getAllByRole('button', { name: /addChapter/i });
    fireEvent.click(addBtns[addBtns.length - 1]);
    expect(onChaptersChange).toHaveBeenCalledTimes(1);
    const next = onChaptersChange.mock.calls[0][0];
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ title: '', start_time_seconds: 0 });
  });

  test('editing chapter title bubbles up via onChaptersChange', () => {
    const onChaptersChange = jest.fn();
    const chapters = [{ id: 1, title: 'Old', start_time_seconds: 0 }];
    render(
      <ChaptersEditor chapters={chapters} onChaptersChange={onChaptersChange} />,
    );
    fireEvent.click(screen.getByText(/1 chapter/));
    const titleInput = screen.getByPlaceholderText('e.g., Introduction');
    fireEvent.change(titleInput, { target: { value: 'New title' } });
    expect(onChaptersChange).toHaveBeenCalled();
    const last = onChaptersChange.mock.calls.pop()[0];
    expect(last[0].title).toBe('New title');
  });

  test('removing a chapter calls onChaptersChange with one fewer item', () => {
    const onChaptersChange = jest.fn();
    const chapters = [
      { id: 1, title: 'A', start_time_seconds: 0 },
      { id: 2, title: 'B', start_time_seconds: 30 },
    ];
    render(
      <ChaptersEditor chapters={chapters} onChaptersChange={onChaptersChange} />,
    );
    fireEvent.click(screen.getByText(/2 chapters/));
    const removeBtns = screen.getAllByRole('button', { name: /remove/i });
    fireEvent.click(removeBtns[0]);
    expect(onChaptersChange).toHaveBeenCalled();
    const next = onChaptersChange.mock.calls.pop()[0];
    expect(next).toHaveLength(1);
  });

  test('close button hides the modal', () => {
    render(<ChaptersEditor chapters={[]} onChaptersChange={() => {}} />);
    fireEvent.click(screen.getByText('clickToAddChapters'));
    expect(screen.getByText('noChaptersYet')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /done/i }));
    expect(screen.queryByText('noChaptersYet')).not.toBeInTheDocument();
  });
});
