import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  updatePassword,
  reauthenticateWithCredential,
  deleteUser,
} from 'firebase/auth';
import { deleteDoc } from 'firebase/firestore';
import { auth } from '@/utils/firebase';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import SecuritySettings from './SecuritySettings';

const passwordUser = {
  uid: 'user-1',
  email: 'me@stu.kau.edu.sa',
  providerData: [{ providerId: 'password' }],
  getIdToken: jest.fn().mockResolvedValue('id-token'),
};

const googleUser = {
  uid: 'user-1',
  email: 'me@stu.kau.edu.sa',
  providerData: [{ providerId: 'google.com' }],
  getIdToken: jest.fn().mockResolvedValue('id-token'),
};

beforeEach(() => {
  mockNavigate.mockClear();
  updatePassword.mockReset();
  reauthenticateWithCredential.mockReset();
  deleteUser.mockReset();
  deleteDoc.mockReset();
  updatePassword.mockResolvedValue();
  reauthenticateWithCredential.mockResolvedValue();
  deleteUser.mockResolvedValue();
  deleteDoc.mockResolvedValue();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
});

afterEach(() => {
  console.error.mockRestore();
  delete global.fetch;
});

const renderSec = (user = passwordUser, setUser = jest.fn()) => {
  auth.currentUser = user;
  return render(
    <MemoryRouter>
      <SecuritySettings user={user} setUser={setUser} />
    </MemoryRouter>
  );
};

describe('SecuritySettings — password change (email user)', () => {
  test('renders the change-password form', () => {
    renderSec();
    expect(screen.getByText('changePassword')).toBeInTheDocument();
    expect(screen.getByLabelText('currentPassword')).toBeInTheDocument();
    expect(screen.getByLabelText('newPassword')).toBeInTheDocument();
    expect(screen.getByLabelText('confirmNewPassword')).toBeInTheDocument();
  });

  test('shows errPassMin6 when new password is too short', async () => {
    const user = userEvent.setup();
    renderSec();
    await user.type(screen.getByLabelText('currentPassword'), 'old1234');
    await user.type(screen.getByLabelText('newPassword'), 'abc');
    await user.type(screen.getByLabelText('confirmNewPassword'), 'abc');
    await user.click(screen.getByRole('button', { name: 'updatePassword' }));

    expect(await screen.findByText('errPassMin6')).toBeInTheDocument();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  test('shows errPassNoMatch when new and confirm differ', async () => {
    const user = userEvent.setup();
    renderSec();
    await user.type(screen.getByLabelText('currentPassword'), 'old12345');
    await user.type(screen.getByLabelText('newPassword'), 'abcdef1');
    await user.type(screen.getByLabelText('confirmNewPassword'), 'abcdef2');
    await user.click(screen.getByRole('button', { name: 'updatePassword' }));

    expect(await screen.findByText('errPassNoMatch')).toBeInTheDocument();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  test('shows errPassSameAsCurrent when current and new are the same', async () => {
    const user = userEvent.setup();
    renderSec();
    await user.type(screen.getByLabelText('currentPassword'), 'samesame');
    await user.type(screen.getByLabelText('newPassword'), 'samesame');
    await user.type(screen.getByLabelText('confirmNewPassword'), 'samesame');
    await user.click(screen.getByRole('button', { name: 'updatePassword' }));

    expect(await screen.findByText('errPassSameAsCurrent')).toBeInTheDocument();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  test('successful password change shows passwordChanged', async () => {
    const user = userEvent.setup();
    renderSec();
    await user.type(screen.getByLabelText('currentPassword'), 'oldpass1');
    await user.type(screen.getByLabelText('newPassword'), 'newpass1');
    await user.type(screen.getByLabelText('confirmNewPassword'), 'newpass1');
    await user.click(screen.getByRole('button', { name: 'updatePassword' }));

    expect(await screen.findByText('passwordChanged')).toBeInTheDocument();
    expect(reauthenticateWithCredential).toHaveBeenCalledTimes(1);
    expect(updatePassword).toHaveBeenCalledTimes(1);
  });

  test('wrong-password reauth error shows errCurrentPassWrong', async () => {
    reauthenticateWithCredential.mockRejectedValueOnce({ code: 'auth/wrong-password' });
    const user = userEvent.setup();
    renderSec();
    await user.type(screen.getByLabelText('currentPassword'), 'oldpass1');
    await user.type(screen.getByLabelText('newPassword'), 'newpass1');
    await user.type(screen.getByLabelText('confirmNewPassword'), 'newpass1');
    await user.click(screen.getByRole('button', { name: 'updatePassword' }));

    expect(await screen.findByText('errCurrentPassWrong')).toBeInTheDocument();
  });

  test('weak-password updatePassword error shows errPassTooWeak', async () => {
    updatePassword.mockRejectedValueOnce({ code: 'auth/weak-password' });
    const user = userEvent.setup();
    renderSec();
    await user.type(screen.getByLabelText('currentPassword'), 'oldpass1');
    await user.type(screen.getByLabelText('newPassword'), 'newpass1');
    await user.type(screen.getByLabelText('confirmNewPassword'), 'newpass1');
    await user.click(screen.getByRole('button', { name: 'updatePassword' }));

    expect(await screen.findByText('errPassTooWeak')).toBeInTheDocument();
  });

  test('unknown error shows errPassChangeFailed', async () => {
    updatePassword.mockRejectedValueOnce({ code: 'auth/unknown-thing' });
    const user = userEvent.setup();
    renderSec();
    await user.type(screen.getByLabelText('currentPassword'), 'oldpass1');
    await user.type(screen.getByLabelText('newPassword'), 'newpass1');
    await user.type(screen.getByLabelText('confirmNewPassword'), 'newpass1');
    await user.click(screen.getByRole('button', { name: 'updatePassword' }));

    expect(await screen.findByText('errPassChangeFailed')).toBeInTheDocument();
  });

  test('show-password toggle flips input type', async () => {
    const user = userEvent.setup();
    renderSec();

    const newPw = screen.getByLabelText('newPassword');
    expect(newPw).toHaveAttribute('type', 'password');

    const toggle = newPw.parentElement.querySelector('button[type="button"]');
    await user.click(toggle);
    expect(newPw).toHaveAttribute('type', 'text');
  });
});

describe('SecuritySettings — password change (Google-only user)', () => {
  test('hides the form and shows the googleSignInNote', () => {
    renderSec(googleUser);
    expect(screen.getByText('googleSignInNote')).toBeInTheDocument();
    expect(screen.queryByLabelText('currentPassword')).not.toBeInTheDocument();
  });
});

describe('SecuritySettings — delete account', () => {
  test('initial state shows the deleteMyAccount button', () => {
    renderSec();
    expect(screen.getByRole('button', { name: 'deleteMyAccount' })).toBeInTheDocument();
  });

  test('clicking deleteMyAccount expands the confirmation panel', async () => {
    const user = userEvent.setup();
    renderSec();
    await user.click(screen.getByRole('button', { name: 'deleteMyAccount' }));

    expect(screen.getByText('thisWillPermanently')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('DELETE')).toBeInTheDocument();
  });

  test('Cancel collapses the confirmation panel', async () => {
    const user = userEvent.setup();
    renderSec();
    await user.click(screen.getByRole('button', { name: 'deleteMyAccount' }));
    await user.click(screen.getByRole('button', { name: 'cancel' }));

    expect(screen.queryByText('thisWillPermanently')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'deleteMyAccount' })).toBeInTheDocument();
  });

  test('confirm button is disabled until DELETE is typed and password is entered', async () => {
    const user = userEvent.setup();
    renderSec();
    await user.click(screen.getByRole('button', { name: 'deleteMyAccount' }));

    const confirmBtn = screen.getByRole('button', { name: 'permanentlyDeleteAccount' });
    expect(confirmBtn).toBeDisabled();

    await user.type(screen.getByPlaceholderText('DELETE'), 'DELETE');
    expect(confirmBtn).toBeDisabled(); // still need password

    await user.type(screen.getByLabelText('enterYourPassword'), 'mypass');
    expect(confirmBtn).not.toBeDisabled();
  });

  test('successful delete removes user and navigates to /login', async () => {
    const setUser = jest.fn();
    const user = userEvent.setup();
    renderSec(passwordUser, setUser);
    await user.click(screen.getByRole('button', { name: 'deleteMyAccount' }));
    await user.type(screen.getByPlaceholderText('DELETE'), 'DELETE');
    await user.type(screen.getByLabelText('enterYourPassword'), 'mypass');
    await user.click(screen.getByRole('button', { name: 'permanentlyDeleteAccount' }));

    await waitFor(() => {
      expect(deleteUser).toHaveBeenCalledTimes(1);
    });
    expect(reauthenticateWithCredential).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(setUser).toHaveBeenCalledWith(null);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('wrong-password during delete shows errIncorrectPass', async () => {
    reauthenticateWithCredential.mockRejectedValueOnce({ code: 'auth/wrong-password' });
    const user = userEvent.setup();
    renderSec();
    await user.click(screen.getByRole('button', { name: 'deleteMyAccount' }));
    await user.type(screen.getByPlaceholderText('DELETE'), 'DELETE');
    await user.type(screen.getByLabelText('enterYourPassword'), 'badpw');
    await user.click(screen.getByRole('button', { name: 'permanentlyDeleteAccount' }));

    expect(await screen.findByText('errIncorrectPass')).toBeInTheDocument();
    expect(deleteUser).not.toHaveBeenCalled();
  });

  test('Google-only user does not need password to delete', async () => {
    const user = userEvent.setup();
    renderSec(googleUser);
    await user.click(screen.getByRole('button', { name: 'deleteMyAccount' }));
    await user.type(screen.getByPlaceholderText('DELETE'), 'DELETE');

    const confirmBtn = screen.getByRole('button', { name: 'permanentlyDeleteAccount' });
    expect(confirmBtn).not.toBeDisabled();

    await user.click(confirmBtn);
    await waitFor(() => {
      expect(deleteUser).toHaveBeenCalledTimes(1);
    });
    expect(reauthenticateWithCredential).not.toHaveBeenCalled();
  });
});
