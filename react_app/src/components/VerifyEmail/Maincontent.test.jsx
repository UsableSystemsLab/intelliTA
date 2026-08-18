import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '@/utils/firebase';
import { renderWithProviders } from '../../__tests__/helpers/renderWithProviders';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import VerifyEmailMain from './Maincontent';

const EMAIL = 'student@stu.kau.edu.sa';

const renderWith = (setUser = jest.fn()) => {
  renderWithProviders(<VerifyEmailMain setUser={setUser} />);
  return setUser;
};

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
  auth.currentUser = null;
});

beforeEach(() => {
  mockNavigate.mockClear();
  sendEmailVerification.mockReset();
  sendEmailVerification.mockResolvedValue();
  signOut.mockReset();
  signOut.mockResolvedValue();
});

describe('VerifyEmail — route guard', () => {
  test('no signed-in user redirects to /login', async () => {
    auth.currentUser = null;
    renderWith();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  test('already-verified user redirects to home', async () => {
    auth.currentUser = { email: EMAIL, emailVerified: true };
    renderWith();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });
});

describe('VerifyEmail — unverified user', () => {
  beforeEach(() => {
    auth.currentUser = {
      email: EMAIL,
      emailVerified: false,
      reload: jest.fn().mockResolvedValue(),
    };
  });

  test('renders the title, the email address, and does not redirect', async () => {
    renderWith();

    expect(screen.getByText('verifyTitle')).toBeInTheDocument();
    expect(screen.getByText('verifyInstruction')).toBeInTheDocument();
    expect(screen.getByText(EMAIL)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('resend sends a verification email, shows confirmation, and starts the cooldown', async () => {
    const ue = userEvent.setup();
    renderWith();

    const resendBtn = screen.getByRole('button', { name: 'verifyResend' });
    await ue.click(resendBtn);

    await waitFor(() => {
      expect(sendEmailVerification).toHaveBeenCalledTimes(1);
    });
    expect(sendEmailVerification.mock.calls[0][0]).toBe(auth.currentUser);
    expect(await screen.findByText('verifyResent')).toBeInTheDocument();

    const cooldownBtn = screen.getByRole('button', { name: /verifyResend \(\d+s\)/ });
    expect(cooldownBtn).toBeDisabled();
  });

  test('resend failure shows the resend error message', async () => {
    sendEmailVerification.mockRejectedValueOnce({ code: 'auth/too-many-requests' });
    const ue = userEvent.setup();
    renderWith();

    await ue.click(screen.getByRole('button', { name: 'verifyResend' }));

    expect(await screen.findByText('verifyResendError')).toBeInTheDocument();
  });

  test('continue: verified after reload calls setUser and navigates home', async () => {
    auth.currentUser.reload = jest.fn(() => {
      auth.currentUser.emailVerified = true;
      return Promise.resolve();
    });
    const setUser = jest.fn();
    const ue = userEvent.setup();
    renderWith(setUser);

    await ue.click(screen.getByRole('button', { name: 'verifyContinue' }));

    await waitFor(() => {
      expect(auth.currentUser.reload).toHaveBeenCalledTimes(1);
    });
    expect(setUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: EMAIL, emailVerified: true }),
    );
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  test('continue: still unverified after reload shows the still-not message', async () => {
    const setUser = jest.fn();
    const ue = userEvent.setup();
    renderWith(setUser);

    await ue.click(screen.getByRole('button', { name: 'verifyContinue' }));

    expect(await screen.findByText('verifyStillNot')).toBeInTheDocument();
    expect(setUser).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalledWith('/', { replace: true });
  });

  test('continue: reload throwing shows the generic error', async () => {
    auth.currentUser.reload = jest.fn().mockRejectedValueOnce(new Error('boom'));
    const ue = userEvent.setup();
    renderWith();

    await ue.click(screen.getByRole('button', { name: 'verifyContinue' }));

    expect(await screen.findByText('errGeneric')).toBeInTheDocument();
  });

  test('log out signs the user out and navigates to /login', async () => {
    const ue = userEvent.setup();
    renderWith();

    await ue.click(screen.getByRole('button', { name: 'verifyUseAnother' }));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledTimes(1);
    });
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });
});
