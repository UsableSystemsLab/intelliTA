import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__tests__/helpers/renderWithProviders';
import { auth } from '@/utils/firebase';
import MembersList from './MembersList';

const instructor = { uid: 'instructor-uid' };
const alice = {
  user_id: 's1',
  first_name: 'Alice',
  last_name: 'Smith',
  email: 'alice@stu.kau.edu.sa',
  status: 'active',
  enrollment_date: '2025-01-01',
};
const bob = {
  user_id: 's2',
  first_name: 'Bob',
  last_name: 'Jones',
  email: 'bob@stu.kau.edu.sa',
  status: 'active',
  enrollment_date: '2025-01-02',
};

beforeEach(() => {
  auth.currentUser = { getIdToken: jest.fn().mockResolvedValue('test-token') };
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
  delete global.fetch;
});

const renderList = (props = {}) =>
  renderWithProviders(
    <MembersList courseId="123" user={instructor} onClose={jest.fn()} {...props} />
  );

describe('MembersList', () => {
  test('shows loading state on mount', () => {
    global.fetch = jest.fn(() => new Promise(() => {})); // never resolves
    renderList();
    expect(screen.getByText('loadingMembers')).toBeInTheDocument();
  });

  test('shows error and retry button when fetch fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
    renderList();
    expect(await screen.findByText('retry')).toBeInTheDocument();
  });

  test('shows empty state when no members', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    renderList();
    expect(await screen.findByText('noStudentsYet')).toBeInTheDocument();
  });

  test('renders member names when members are returned', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [alice, bob],
    });
    renderList();
    expect(await screen.findByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });

  test('search input filters members by first name', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [alice, bob],
    });
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Alice Smith');

    const searchInput = screen.getByPlaceholderText('searchMembers');
    await user.type(searchInput, 'Bob');

    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });

  test('shows noSearchResults when search matches nothing', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [alice],
    });
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Alice Smith');

    const searchInput = screen.getByPlaceholderText('searchMembers');
    await user.type(searchInput, 'Zzz');

    expect(screen.getByText('noSearchResults')).toBeInTheDocument();
  });

  test('retry button refetches members after error', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true, json: async () => [alice] });

    const user = userEvent.setup();
    renderList();

    const retryBtn = await screen.findByText('retry');
    await user.click(retryBtn);

    expect(await screen.findByText('Alice Smith')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test('clicking kick on a card opens the KickConfirmModal', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [alice],
    });
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Alice Smith');

    const kickBtn = screen.getByTitle('removeFromCourse');
    await user.click(kickBtn);

    expect(
      await screen.findByRole('heading', { name: 'removeStudent' })
    ).toBeInTheDocument();
  });

  test('confirming kick removes the member from the list', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [alice, bob] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const user = userEvent.setup();
    renderList();
    await screen.findByText('Alice Smith');

    // Click kick on Alice's card (first one)
    const kickButtons = screen.getAllByTitle('removeFromCourse');
    await user.click(kickButtons[0]);

    // Confirm in the modal — the destructive button reads "remove"
    const confirmBtn = await screen.findByRole('button', { name: 'remove' });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });
});
