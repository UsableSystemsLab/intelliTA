import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
  updateProfile,
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

import SignUp from './SignUp';

const KAU = 'student@stu.kau.edu.sa';
const PASS = 'password123';

const submitButton = () => document.querySelector('button[type="submit"]');

const fillAllValid = async (user) => {
  await user.type(screen.getByLabelText('fName'), 'Test');
  await user.type(screen.getByLabelText('lName'), 'User');
  await user.type(screen.getByLabelText('email'), KAU);
  await user.type(screen.getByLabelText('password'), PASS);
  await user.type(screen.getByLabelText('confirmPass'), PASS);
};

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

beforeEach(() => {
  mockNavigate.mockClear();
  createUserWithEmailAndPassword.mockReset();
  signInWithPopup.mockReset();
  sendEmailVerification.mockReset();
  sendEmailVerification.mockResolvedValue();
  updateProfile.mockReset();
  getDoc.mockReset();
  setDoc.mockReset();

  createUserWithEmailAndPassword.mockResolvedValue({
    user: {
      uid: 'new-uid',
      email: KAU,
      getIdToken: jest.fn().mockResolvedValue('id-token'),
    },
  });
  updateProfile.mockResolvedValue();
  getDoc.mockResolvedValue({ exists: () => true });
  setDoc.mockResolvedValue();

  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
});

afterEach(() => {
  delete global.fetch;
});

describe('SignUp — email/password flow', () => {
  test('mismatched passwords shows errPassMismatch and does NOT call createUser', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignUp />);

    await user.type(screen.getByLabelText('fName'), 'Test');
    await user.type(screen.getByLabelText('lName'), 'User');
    await user.type(screen.getByLabelText('email'), KAU);
    await user.type(screen.getByLabelText('password'), PASS);
    await user.type(screen.getByLabelText('confirmPass'), 'different');
    await user.click(submitButton());

    expect(await screen.findByText('errPassMismatch')).toBeInTheDocument();
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test('non-KAU email shows modal and does NOT call createUser', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignUp />);

    await user.type(screen.getByLabelText('fName'), 'Test');
    await user.type(screen.getByLabelText('lName'), 'User');
    await user.type(screen.getByLabelText('email'), 'someone@gmail.com');
    await user.type(screen.getByLabelText('password'), PASS);
    await user.type(screen.getByLabelText('confirmPass'), PASS);
    await user.click(submitButton());

    expect(await screen.findByText('kauModalTitle')).toBeInTheDocument();
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test('successful signup creates user, updates profile, writes Firestore + Postgres, sends verification email, navigates to verify-email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignUp />);

    await fillAllValid(user);
    await user.click(submitButton());

    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledTimes(1);
    });
    expect(createUserWithEmailAndPassword.mock.calls[0][1]).toBe(KAU);
    expect(createUserWithEmailAndPassword.mock.calls[0][2]).toBe(PASS);

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledTimes(1);
    });
    expect(updateProfile.mock.calls[0][1]).toEqual({ displayName: 'Test User' });

    await waitFor(() => {
      expect(setDoc).toHaveBeenCalledTimes(1);
    });
    const setDocPayload = setDoc.mock.calls[0][1];
    expect(setDocPayload.firstName).toBe('Test');
    expect(setDocPayload.lastName).toBe('User');
    expect(setDocPayload.email).toBe(KAU);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/users$/);
    const body = JSON.parse(opts.body);
    expect(body.firebaseId).toBe('new-uid');
    expect(body.first_name).toBe('Test');
    expect(body.last_name).toBe('User');

    await waitFor(() => {
      expect(sendEmailVerification).toHaveBeenCalledTimes(1);
    });
    expect(sendEmailVerification.mock.calls[0][0]).toEqual(
      expect.objectContaining({ uid: 'new-uid', email: KAU }),
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/verify-email');
    });
  });

  test('email-already-in-use shows errEmailInUse', async () => {
    createUserWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/email-already-in-use' });
    const user = userEvent.setup();
    renderWithProviders(<SignUp />);

    await fillAllValid(user);
    await user.click(submitButton());

    expect(await screen.findByText('errEmailInUse')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('weak-password shows errWeakPassword', async () => {
    createUserWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/weak-password' });
    const user = userEvent.setup();
    renderWithProviders(<SignUp />);

    await fillAllValid(user);
    await user.click(submitButton());

    expect(await screen.findByText('errWeakPassword')).toBeInTheDocument();
  });

  test('invalid-email shows errInvalidEmail', async () => {
    createUserWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/invalid-email' });
    const user = userEvent.setup();
    renderWithProviders(<SignUp />);

    await fillAllValid(user);
    await user.click(submitButton());

    expect(await screen.findByText('errInvalidEmail')).toBeInTheDocument();
  });

  test('network-request-failed shows errNetwork', async () => {
    createUserWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/network-request-failed' });
    const user = userEvent.setup();
    renderWithProviders(<SignUp />);

    await fillAllValid(user);
    await user.click(submitButton());

    expect(await screen.findByText('errNetwork')).toBeInTheDocument();
  });

  test('unknown error code shows errGeneric', async () => {
    createUserWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/something-weird' });
    const user = userEvent.setup();
    renderWithProviders(<SignUp />);

    await fillAllValid(user);
    await user.click(submitButton());

    expect(await screen.findByText('errGeneric')).toBeInTheDocument();
  });

  test('show-password toggle flips password input type', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignUp />);

    const pw = screen.getByLabelText('password');
    expect(pw).toHaveAttribute('type', 'password');

    const toggle = pw.parentElement.querySelector('button[type="button"]');
    await user.click(toggle);
    expect(pw).toHaveAttribute('type', 'text');
  });

  test('show-confirm-password toggle flips confirm input type independently', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignUp />);

    const cpw = screen.getByLabelText('confirmPass');
    expect(cpw).toHaveAttribute('type', 'password');

    const toggle = cpw.parentElement.querySelector('button[type="button"]');
    await user.click(toggle);
    expect(cpw).toHaveAttribute('type', 'text');

    // The other password field should still be password-type
    expect(screen.getByLabelText('password')).toHaveAttribute('type', 'password');
  });

  test('KAU modal close button hides the modal', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignUp />);

    await user.type(screen.getByLabelText('fName'), 'A');
    await user.type(screen.getByLabelText('lName'), 'B');
    await user.type(screen.getByLabelText('email'), 'x@gmail.com');
    await user.type(screen.getByLabelText('password'), PASS);
    await user.type(screen.getByLabelText('confirmPass'), PASS);
    await user.click(submitButton());

    const okBtn = await screen.findByRole('button', { name: 'ok' });
    await user.click(okBtn);

    await waitFor(() => {
      expect(screen.queryByText('kauModalTitle')).not.toBeInTheDocument();
    });
  });
});

describe('SignUp — Google sign-up flow', () => {
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
    renderWithProviders(<SignUp />);

    await ue.click(screen.getByRole('button', { name: /google/i }));

    await waitFor(() => {
      expect(user.delete).toHaveBeenCalled();
    });
    expect(await screen.findByText('kauModalTitle')).toBeInTheDocument();
  });

  test('KAU Google email with new doc creates Firestore + Postgres records and navigates', async () => {
    const user = googleUser();
    signInWithPopup.mockResolvedValueOnce({ user });
    getDoc.mockResolvedValueOnce({ exists: () => false });

    const ue = userEvent.setup();
    renderWithProviders(<SignUp />);

    await ue.click(screen.getByRole('button', { name: /google/i }));

    await waitFor(() => {
      expect(setDoc).toHaveBeenCalledTimes(1);
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.first_name).toBe('Test');
    expect(body.last_name).toBe('User');
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('KAU Google email with existing doc skips setDoc and navigates', async () => {
    const user = googleUser();
    signInWithPopup.mockResolvedValueOnce({ user });
    getDoc.mockResolvedValueOnce({ exists: () => true });

    const ue = userEvent.setup();
    renderWithProviders(<SignUp />);

    await ue.click(screen.getByRole('button', { name: /google/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
    expect(setDoc).not.toHaveBeenCalled();
  });

  test('popup-closed-by-user shows signUpCancelled', async () => {
    signInWithPopup.mockRejectedValueOnce({ code: 'auth/popup-closed-by-user' });
    const ue = userEvent.setup();
    renderWithProviders(<SignUp />);

    await ue.click(screen.getByRole('button', { name: /google/i }));

    expect(await screen.findByText('signUpCancelled')).toBeInTheDocument();
  });

  test('other Google error shows errGeneric', async () => {
    signInWithPopup.mockRejectedValueOnce({ code: 'auth/internal-error' });
    const ue = userEvent.setup();
    renderWithProviders(<SignUp />);

    await ue.click(screen.getByRole('button', { name: /google/i }));

    expect(await screen.findByText('errGeneric')).toBeInTheDocument();
  });
});
