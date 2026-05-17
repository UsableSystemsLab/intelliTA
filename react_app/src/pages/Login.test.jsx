import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { getDoc, setDoc } from 'firebase/firestore';
import { renderWithProviders } from '../__tests__/helpers/renderWithProviders';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import Login from './Login';

const KAU = 'student@stu.kau.edu.sa';
const PASS = 'password123';

const submitButton = () => {
  // The submit button has type="submit"; query by it to avoid the
  // ambiguity with the heading that also reads "login".
  return document.querySelector('button[type="submit"]');
};

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

beforeEach(() => {
  mockNavigate.mockClear();
  signInWithEmailAndPassword.mockReset();
  signInWithPopup.mockReset();
  getDoc.mockReset();
  setDoc.mockReset();
  signInWithEmailAndPassword.mockResolvedValue({
    user: { uid: 'test-uid', email: KAU, emailVerified: true },
  });
  getDoc.mockResolvedValue({ exists: () => true, data: () => ({}) });
  setDoc.mockResolvedValue();

  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
});

afterEach(() => {
  delete global.fetch;
});

describe('Login — email/password flow', () => {
  test('shows KAU modal and does NOT call signIn for non-KAU email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText('email'), 'someone@gmail.com');
    await user.type(screen.getByLabelText('password'), PASS);
    await user.click(submitButton());

    expect(await screen.findByText('kauModalTitle')).toBeInTheDocument();
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('successful sign-in calls firebase and navigates home', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText('email'), KAU);
    await user.type(screen.getByLabelText('password'), PASS);
    await user.click(submitButton());

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(1);
    });
    const args = signInWithEmailAndPassword.mock.calls[0];
    expect(args[1]).toBe(KAU);
    expect(args[2]).toBe(PASS);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('sign-in with an unverified email navigates to /verify-email, not home', async () => {
    signInWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: 'test-uid', email: KAU, emailVerified: false },
    });
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText('email'), KAU);
    await user.type(screen.getByLabelText('password'), PASS);
    await user.click(submitButton());

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/verify-email');
    });
    expect(mockNavigate).not.toHaveBeenCalledWith('/');
  });

  test('wrong-password error displays errWrongPassword', async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/wrong-password' });
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText('email'), KAU);
    await user.type(screen.getByLabelText('password'), PASS);
    await user.click(submitButton());

    expect(await screen.findByText('errWrongPassword')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('user-not-found error displays errAccountNotFound', async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/user-not-found' });
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText('email'), KAU);
    await user.type(screen.getByLabelText('password'), PASS);
    await user.click(submitButton());

    expect(await screen.findByText('errAccountNotFound')).toBeInTheDocument();
  });

  test('network error displays errNetwork', async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/network-request-failed' });
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText('email'), KAU);
    await user.type(screen.getByLabelText('password'), PASS);
    await user.click(submitButton());

    expect(await screen.findByText('errNetwork')).toBeInTheDocument();
  });

  test('unknown error code displays errGeneric', async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/something-weird' });
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText('email'), KAU);
    await user.type(screen.getByLabelText('password'), PASS);
    await user.click(submitButton());

    expect(await screen.findByText('errGeneric')).toBeInTheDocument();
  });

  test('show-password toggle flips input type from password to text and back', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    const pw = screen.getByLabelText('password');
    expect(pw).toHaveAttribute('type', 'password');

    // The toggle is the only icon-only button inside the password field's relative wrapper.
    const toggle = pw.parentElement.querySelector('button[type="button"]');
    await user.click(toggle);
    expect(pw).toHaveAttribute('type', 'text');

    await user.click(toggle);
    expect(pw).toHaveAttribute('type', 'password');
  });

  test('KAU modal close button hides the modal', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText('email'), 'x@gmail.com');
    await user.type(screen.getByLabelText('password'), PASS);
    await user.click(submitButton());

    const okBtn = await screen.findByRole('button', { name: 'ok' });
    await user.click(okBtn);

    await waitFor(() => {
      expect(screen.queryByText('kauModalTitle')).not.toBeInTheDocument();
    });
  });
});

describe('Login — Google sign-in flow', () => {
  const googleUser = (email = KAU) => ({
    uid: 'g-uid',
    email,
    displayName: 'Test User',
    delete: jest.fn().mockResolvedValue(),
    getIdToken: jest.fn().mockResolvedValue('id-token'),
  });

  test('non-KAU Google email triggers user.delete() and shows KAU modal', async () => {
    const user = googleUser('intruder@gmail.com');
    signInWithPopup.mockResolvedValueOnce({ user });

    const ue = userEvent.setup();
    renderWithProviders(<Login />);

    await ue.click(screen.getByRole('button', { name: /google/i }));

    await waitFor(() => {
      expect(user.delete).toHaveBeenCalled();
    });
    expect(await screen.findByText('kauModalTitle')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('KAU Google email with existing doc skips setDoc and navigates', async () => {
    const user = googleUser();
    signInWithPopup.mockResolvedValueOnce({ user });
    getDoc.mockResolvedValueOnce({ exists: () => true });

    const ue = userEvent.setup();
    renderWithProviders(<Login />);

    await ue.click(screen.getByRole('button', { name: /google/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
    expect(setDoc).not.toHaveBeenCalled();
  });

  test('KAU Google email with NEW doc calls setDoc and POSTs to /users', async () => {
    const user = googleUser();
    signInWithPopup.mockResolvedValueOnce({ user });
    getDoc.mockResolvedValueOnce({ exists: () => false });

    const ue = userEvent.setup();
    renderWithProviders(<Login />);

    await ue.click(screen.getByRole('button', { name: /google/i }));

    await waitFor(() => {
      expect(setDoc).toHaveBeenCalledTimes(1);
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/users$/);
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body.firebaseId).toBe('g-uid');
    expect(body.email).toBe(KAU);
    expect(body.first_name).toBe('Test');
    expect(body.last_name).toBe('User');
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('popup closed by user shows the cancelled message', async () => {
    signInWithPopup.mockRejectedValueOnce({ code: 'auth/popup-closed-by-user' });
    const ue = userEvent.setup();
    renderWithProviders(<Login />);

    await ue.click(screen.getByRole('button', { name: /google/i }));

    expect(await screen.findByText('cancelled')).toBeInTheDocument();
  });

  test('other Google sign-in error shows the generic message', async () => {
    signInWithPopup.mockRejectedValueOnce({ code: 'auth/internal-error' });
    const ue = userEvent.setup();
    renderWithProviders(<Login />);

    await ue.click(screen.getByRole('button', { name: /google/i }));

    expect(await screen.findByText('errGeneric')).toBeInTheDocument();
  });
});
