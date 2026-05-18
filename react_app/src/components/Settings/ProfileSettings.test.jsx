import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import ProfileSettings from './ProfileSettings';
import { auth } from '@/utils/firebase';
import { updateProfile } from 'firebase/auth';

describe('ProfileSettings', () => {
  const originalFetch = global.fetch;
  const originalCreateUrl = global.URL.createObjectURL;

  beforeAll(() => {
    auth.currentUser = { getIdToken: jest.fn(() => Promise.resolve('tkn')) };
    global.URL.createObjectURL = jest.fn(() => 'blob:preview');
  });
  afterAll(() => {
    auth.currentUser = null;
    global.URL.createObjectURL = originalCreateUrl;
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('renders display name and bio fields', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ bio: 'hello bio' }) }),
    );
    await act(async () => {
      render(
        <ProfileSettings user={{ uid: 'u1', displayName: 'Alice' }} setUser={() => {}} />,
      );
    });
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByDisplayValue('hello bio')).toBeInTheDocument());
  });

  test('updates display name when typing', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ bio: '' }) }),
    );
    await act(async () => {
      render(
        <ProfileSettings user={{ uid: 'u1', displayName: 'Alice' }} setUser={() => {}} />,
      );
    });
    const input = screen.getByDisplayValue('Alice');
    fireEvent.change(input, { target: { value: 'Bob' } });
    expect(screen.getByDisplayValue('Bob')).toBeInTheDocument();
  });

  test('character counter reflects bio length', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ bio: '' }) }),
    );
    await act(async () => {
      render(<ProfileSettings user={{ uid: 'u1' }} setUser={() => {}} />);
    });
    const bio = screen.getByPlaceholderText('bioPlaceholder');
    fireEvent.change(bio, { target: { value: 'short bio' } });
    expect(screen.getByText('9 / 500')).toBeInTheDocument();
  });

  test('save flow calls updateProfile and PUT bio, then notifies success', async () => {
    let putCalled = false;
    global.fetch = jest.fn((url, opts) => {
      if (opts && opts.method === 'PUT') {
        putCalled = true;
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ bio: '' }) });
    });
    updateProfile.mockClear();
    const setUser = jest.fn();
    await act(async () => {
      render(
        <ProfileSettings user={{ uid: 'u1', displayName: 'Alice' }} setUser={setUser} />,
      );
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /saveChanges/i }));
    });
    expect(updateProfile).toHaveBeenCalled();
    expect(putCalled).toBe(true);
    expect(setUser).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText('changesSaved')).toBeInTheDocument());
  });

  test('shows error message when PUT fails', async () => {
    global.fetch = jest.fn((url, opts) => {
      if (opts && opts.method === 'PUT') {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ bio: '' }) });
    });
    await act(async () => {
      render(<ProfileSettings user={{ uid: 'u1' }} setUser={() => {}} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /saveChanges/i }));
    });
    await waitFor(() =>
      expect(screen.getByText(/Failed to save bio/i)).toBeInTheDocument(),
    );
  });

  test('selecting a file generates a preview via createObjectURL', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ bio: '' }) }),
    );
    const { container } = await act(async () => {
      return render(<ProfileSettings user={{ uid: 'u1' }} setUser={() => {}} />);
    });
    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(['x'], 'avatar.png', { type: 'image/png' });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
  });
});
