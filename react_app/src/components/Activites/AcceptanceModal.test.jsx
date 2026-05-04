import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { auth } from '@/utils/firebase';
import AcceptanceModal from './AcceptanceModal';

beforeEach(() => {
  auth.currentUser = { getIdToken: jest.fn().mockResolvedValue('tok') };
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
  delete global.fetch;
});

const renderModal = (props = {}) =>
  render(
    <AcceptanceModal
      courseId="c1"
      activityId="a1"
      activityTitle="Lab 1"
      onClose={jest.fn()}
      {...props}
    />
  );

describe('AcceptanceModal', () => {
  test('shows the loading spinner while fetching', () => {
    global.fetch = jest.fn(() => new Promise(() => {})); // never resolves
    renderModal();
    expect(screen.getByText('fetchingFromGitHub')).toBeInTheDocument();
    expect(screen.getByText('Lab 1')).toBeInTheDocument();
  });

  test('shows error message when fetch fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Server is down' }),
    });
    renderModal();
    expect(await screen.findByText('Server is down')).toBeInTheDocument();
  });

  test('renders summary stats and student list on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        total_enrolled: 3,
        accepted_count: 2,
        students: [
          { user_id: 's1', name: 'Alice', accepted: true, github_username: 'alice', github_verified: true, commit_count: 5, repo_url: 'http://example.com/a' },
          { user_id: 's2', name: 'Bob', accepted: true, github_username: 'bob', github_verified: false, commit_count: 1 },
          { user_id: 's3', name: 'Charlie', accepted: false, github_username: null },
        ],
      }),
    });
    renderModal();

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // total_enrolled
    expect(screen.getByText('2')).toBeInTheDocument(); // accepted_count
    expect(screen.getByText('1')).toBeInTheDocument(); // pending = 3-2 (and bob's 1 commit)
    expect(screen.getByText('noGitHubLinked')).toBeInTheDocument();
    expect(screen.getByTitle('View repo')).toHaveAttribute('href', 'http://example.com/a');
  });

  test('renders empty-list placeholder when there are no students', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ total_enrolled: 0, accepted_count: 0, students: [] }),
    });
    renderModal();
    expect(await screen.findByText('noStudentsEnrolledInCourse')).toBeInTheDocument();
  });

  test('clicking the close button calls onClose', async () => {
    global.fetch = jest.fn(() => new Promise(() => {}));
    const onClose = jest.fn();
    const user = userEvent.setup();
    renderModal({ onClose });

    // Two SVG-only buttons: only one is the close button (the X in header)
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
