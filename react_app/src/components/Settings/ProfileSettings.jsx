import React, { useState, useEffect, useRef } from 'react';
import { Camera, User, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { auth } from '@/utils/firebase.js';
import { updateProfile } from 'firebase/auth';
import { API_BASE, getAuthHeaders } from '../../config/api';
const MAX_BIO = 500;

const ProfileSettings = ({ user, setUser }) => {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user?.uid) return;
    getAuthHeaders(auth.currentUser).then(authHeaders =>
    fetch(`${API_BASE}/users/${user.uid}/profile`, {
      headers: authHeaders,
    }))
      .then((r) => r.ok ? r.json() : Promise.reject(r))
      .then((data) => setBio(data.bio || ''))
      .catch(() => {});
  }, [user?.uid]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      let photoURL = user?.photoURL || null;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('avatar', selectedFile);
        const uploadRes = await fetch(`${API_BASE}/users/${user.uid}/profile/avatar`, {
          method: 'POST',
          headers: await getAuthHeaders(auth.currentUser),
          body: formData,
        });
        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData.message || `Upload failed (${uploadRes.status})`);
        }
        const { photoURL: uploadedUrl } = await uploadRes.json();
        photoURL = uploadedUrl;
      }

      await updateProfile(auth.currentUser, { displayName, photoURL });

      const res = await fetch(`${API_BASE}/users/${user.uid}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...await getAuthHeaders(auth.currentUser) },
        body: JSON.stringify({ bio }),
      });
      if (!res.ok) throw new Error('Failed to save bio');

      setUser((prev) => ({ ...prev, displayName, photoURL }));
      setSelectedFile(null);
      setPreviewUrl(photoURL || null);
      setSuccess(t('changesSaved'));
    } catch (err) {
      setError(err.message || t('saveError'));
    } finally {
      setLoading(false);
    }
  };

  const avatarSrc = previewUrl || user?.photoURL;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Profile Picture */}
      <div className="flex items-center space-x-4 mb-8">
        <div
          className="relative group cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-700 group-hover:border-blue-500 transition-colors">
            {avatarSrc ? (
              <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">
                <User size={40} />
              </div>
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-100">{t('profilePicture')}</h2>
          <p className="text-sm text-gray-400 mt-1">{t('imageFormatsHint')}</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="grid gap-6">
        {/* Display Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <User className="w-4 h-4" />
            {t('displayName')}
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-500"
            placeholder={t('enterYourName')}
          />
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {t('bio')}
          </label>
          <textarea
            rows="4"
            value={bio}
            maxLength={MAX_BIO}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-500 resize-none"
            placeholder={t('bioPlaceholder')}
          />
          <p className={`text-xs text-right ${bio.length >= MAX_BIO ? 'text-red-400' : 'text-gray-500'}`}>
            {bio.length} / {MAX_BIO}
          </p>
        </div>
      </div>

      {/* Feedback */}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-green-400">{success}</p>}

      <div className="pt-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-900/20"
        >
          {loading ? t('saving') : t('saveChanges')}
        </button>
      </div>
    </div>
  );
};

export default ProfileSettings;
