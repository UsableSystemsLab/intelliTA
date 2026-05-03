import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__tests__/helpers/renderWithProviders';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import SubmissionResultOverlay from './SubmissionResultOverlay';

const checkpoints = [
  { id: 1, type: 'challenge', title: 'Sum two numbers', status: 'verified' },
  { id: 2, type: 'challenge', title: 'Reverse string',  status: 'failed'   },
  { id: 3, type: 'instructor_update', title: 'Look at this', status: 'shown' },
  { id: 4, type: 'mcq', title: 'Quiz', status: 'verified' }, // ignored — only challenges count
];

beforeEach(() => {
  mockNavigate.mockClear();
});

describe('SubmissionResultOverlay', () => {
  test('renders the score', () => {
    renderWithProviders(
      <SubmissionResultOverlay
        checkpoints={checkpoints}
        score={50}
        courseId={42}
        onClose={() => {}}
      />
    );
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  test('only shows challenge-type checkpoints in the list', () => {
    renderWithProviders(
      <SubmissionResultOverlay
        checkpoints={checkpoints}
        score={50}
        courseId={42}
      />
    );
    expect(screen.getByText('Sum two numbers')).toBeInTheDocument();
    expect(screen.getByText('Reverse string')).toBeInTheDocument();
    // Non-challenge entries excluded
    expect(screen.queryByText('Look at this')).not.toBeInTheDocument();
    expect(screen.queryByText('Quiz')).not.toBeInTheDocument();
  });

  test('verified/total counts reflect challenges only', () => {
    renderWithProviders(
      <SubmissionResultOverlay
        checkpoints={checkpoints}
        score={50}
        courseId={42}
      />
    );
    // 1 verified, 2 total (challenges only)
    const verifiedTile = screen.getByText('verified').parentElement;
    expect(verifiedTile).toHaveTextContent('1');
    const totalTile = screen.getByText('totalTasks').parentElement;
    expect(totalTile).toHaveTextContent('2');
  });

  test('clicking My Courses navigates to /courses', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SubmissionResultOverlay
        checkpoints={checkpoints}
        score={50}
        courseId={42}
      />
    );
    await user.click(screen.getByRole('button', { name: /myCourses/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/courses');
  });

  test('clicking Continue navigates to /courses/:courseId', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SubmissionResultOverlay
        checkpoints={checkpoints}
        score={75}
        courseId={42}
      />
    );
    await user.click(screen.getByRole('button', { name: /continueBtn/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/courses/42');
  });

  test('handles an empty checkpoints array', () => {
    renderWithProviders(
      <SubmissionResultOverlay checkpoints={[]} score={0} courseId={1} />
    );
    expect(screen.getByText('0%')).toBeInTheDocument();
    // Verified/total tiles should both show 0
    const verifiedTile = screen.getByText('verified').parentElement;
    expect(verifiedTile).toHaveTextContent('0');
  });
});
