import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GitHubSettings from './GitHubSettings';
import { auth } from '@/utils/firebase';

describe('GitHubSettings', () => {
  const originalFetch = global.fetch;

  beforeAll(() => {
    auth.currentUser = { getIdToken: () => Promise.resolve('tkn') };
  });

  afterAll(() => {
    auth.currentUser = null;
  });

  beforeEach(() => {
    window.history.replaceState = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('shows connect button when no GitHub link', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
    );
    render(<GitHubSettings user={{ uid: 'u1' }} />);
    await waitFor(
      () =>
        expect(
          screen.getByRole('button', { name: /connectGitHubAccount/i }),
        ).toBeInTheDocument(),
      { timeout: 3000 },
    );
  }, 10000);

  test('shows verified state when profile has github_username and github_verified', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ github_username: 'octocat', github_verified: true }),
      }),
    );
    render(<GitHubSettings user={{ uid: 'u1' }} />);
    await waitFor(
      () => expect(screen.getByText('@octocat')).toBeInTheDocument(),
      { timeout: 3000 },
    );
    expect(screen.getByText('verified')).toBeInTheDocument();
  }, 10000);

  test('shows verify button when GitHub linked but not verified', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ github_username: 'foo', github_verified: false }),
      }),
    );
    render(<GitHubSettings user={{ uid: 'u1' }} />);
    await waitFor(() => expect(screen.getByText('@foo')).toBeInTheDocument(), {
      timeout: 3000,
    });
    expect(screen.getByRole('button', { name: /verifyWithGitHub/i })).toBeInTheDocument();
  }, 10000);

  test('remove (disconnect) PUTs github_username:null and shows success message', async () => {
    let putBody = null;
    global.fetch = jest.fn((url, opts) => {
      if (opts && opts.method === 'PUT') {
        putBody = JSON.parse(opts.body);
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ github_username: 'foo', github_verified: true }),
      });
    });
    render(<GitHubSettings user={{ uid: 'u1' }} />);
    await waitFor(() => expect(screen.getByText('@foo')).toBeInTheDocument(), {
      timeout: 3000,
    });
    fireEvent.click(screen.getByTitle('disconnect'));
    await waitFor(
      () => expect(screen.getByText('githubDisconnected')).toBeInTheDocument(),
      { timeout: 3000 },
    );
    expect(putBody).toEqual({ github_username: null });
  }, 10000);

  test('shows error when profile fetch fails', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false }));
    render(<GitHubSettings user={{ uid: 'u1' }} />);
    await waitFor(
      () => expect(screen.getByText('failedToLoadProfile')).toBeInTheDocument(),
      { timeout: 3000 },
    );
  }, 10000);
});
