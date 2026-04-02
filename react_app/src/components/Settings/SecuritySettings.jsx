import React, { useState } from 'react';
import { Lock, Trash2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { auth, db } from '@/utils/firebase.js';
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const AUTH_HEADER = { Authorization: 'Bearer 1111' };

const isGoogleOnly = (user) => {
  return user?.providerData?.every((p) => p.providerId === 'google.com');
};

const PasswordInput = ({ id, label, value, onChange, show, onToggle, placeholder, ringColor = 'focus:ring-blue-500/50 focus:border-blue-500' }) => (
  <div className="space-y-2">
    <label htmlFor={id} className="text-sm font-medium text-gray-300">
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-100 focus:outline-none focus:ring-2 ${ringColor} transition-all placeholder-gray-500 pr-12`}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
      >
        {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  </div>
);

const SecuritySettings = ({ user, setUser }) => {
  const navigate = useNavigate();

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Delete Account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const googleOnly = isGoogleOnly(auth.currentUser);

  // Password strength
  const getPasswordStrength = (pass) => {
    if (!pass) return { label: '', color: '', width: '0%' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: '20%' };
    if (score <= 2) return { label: 'Fair', color: 'bg-orange-500', width: '40%' };
    if (score <= 3) return { label: 'Good', color: 'bg-yellow-500', width: '60%' };
    if (score <= 4) return { label: 'Strong', color: 'bg-green-500', width: '80%' };
    return { label: 'Very Strong', color: 'bg-emerald-400', width: '100%' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    setPasswordLoading(true);
    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword,
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);

      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPasswordError('Current password is incorrect.');
      } else if (err.code === 'auth/weak-password') {
        setPasswordError('New password is too weak. Use at least 6 characters.');
      } else {
        setPasswordError('Failed to change password. Please try again.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleteLoading(true);

    try {
      // Re-authenticate
      if (!googleOnly) {
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email,
          deletePassword,
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
      }

      const uid = auth.currentUser.uid;

      // Soft delete from PostgreSQL backend 
      const deactivateRes = await fetch(`${API_BASE}/users/${uid}/deactivate`, {
        method: 'PATCH',
        headers: AUTH_HEADER,
      });
      if (!deactivateRes.ok && deactivateRes.status !== 404) {
        const data = await deactivateRes.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to deactivate account on server.');
      }

      // Mark as deleted in Firestore
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch (firestoreErr) {
        console.error('Firestore doc cleanup failed', firestoreErr);
      }

      // Delete from Firebase Auth (last step)
      await deleteUser(auth.currentUser);

      setUser(null);
      navigate('/login');
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setDeleteError('Incorrect password.');
      } else if (err.code === 'auth/requires-recent-login') {
        setDeleteError('Please log out and log back in, then try again.');
      } else {
        setDeleteError(err.message || 'Failed to delete account. Please try again.');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-10 max-w-3xl">
      {/* Change Password Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Change Password
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Update your password to keep your account secure.
          </p>
        </div>

        {googleOnly ? (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-300">
              Your account is using Google sign-in. Password is managed through your Google account.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            <PasswordInput
              id="current-password"
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              show={showCurrent}
              onToggle={() => setShowCurrent(!showCurrent)}
            />
            <PasswordInput
              id="new-password"
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              onToggle={() => setShowNew(!showNew)}
            />

            {/* Strength indicator */}
            {newPassword && (
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                    style={{ width: strength.width }}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  Strength: <span className="font-medium">{strength.label}</span>
                </p>
              </div>
            )}

            <PasswordInput
              id="confirm-password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm(!showConfirm)}
            />

            {passwordError && <p className="text-sm text-red-400">{passwordError}</p>}
            {passwordSuccess && <p className="text-sm text-green-400">{passwordSuccess}</p>}

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleChangePassword}
                disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-900/20"
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-700/50" />

      {/* Delete Account Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-red-400 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Delete Account
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
        </div>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-6 py-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 hover:border-red-500/50 font-medium rounded-xl transition-all"
          >
            Delete My Account
          </button>
        ) : (
          <div className="p-6 rounded-xl bg-red-500/5 border border-red-500/20 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
              <div className="text-sm text-gray-300 space-y-2">
                <p className="font-medium text-red-400">This will permanently:</p>
                <ul className="list-disc list-inside text-gray-400 space-y-1">
                  <li>Delete your account and profile</li>
                  <li>Remove you from all courses</li>
                  <li>Delete all your submissions and progress</li>
                </ul>
              </div>
            </div>

            {/* Type confirmation */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Type <span className="text-red-400 font-mono">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all placeholder-gray-500"
                placeholder="DELETE"
              />
            </div>

            {/* Password for re-auth (email users only) */}
            {!googleOnly && (
              <PasswordInput
                id="delete-password"
                label="Enter your password"
                value={deletePassword}
                onChange={setDeletePassword}
                show={showDeletePassword}
                onToggle={() => setShowDeletePassword(!showDeletePassword)}
              />
            )}

            {deleteError && <p className="text-sm text-red-400">{deleteError}</p>}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                  setConfirmText('');
                  setDeleteError('');
                }}
                className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={
                  deleteLoading ||
                  confirmText !== 'DELETE' ||
                  (!googleOnly && !deletePassword)
                }
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors shadow-lg shadow-red-900/20"
              >
                {deleteLoading ? 'Deleting...' : 'Permanently Delete Account'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecuritySettings;
