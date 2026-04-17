import { useState, useEffect } from 'react';
import { Github, CheckCircle, Loader2, ShieldCheck, ShieldAlert, X } from 'lucide-react';
import { API_BASE, getAuthHeaders } from '../../config/api';
import { auth } from '@/utils/firebase.js';

const GitHubSettings = ({ user }) => {
  const [profile, setProfile] = useState(null);   // { github_username, github_verified }
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load profile on mount
  useEffect(() => {
    if (!user?.uid) return;
    getAuthHeaders(auth.currentUser)
      .then(headers => fetch(`${API_BASE}/users/${user.uid}/profile`, { headers }))
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setProfile({
        github_username: data.github_username || null,
        github_verified: data.github_verified || false,
      }))
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, [user?.uid]);

  // Handle OAuth callback params (?github=verified&username=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get('github');
    if (result === 'verified') {
      const username = params.get('username');
      setProfile({ github_username: username, github_verified: true });
      setSuccess(`GitHub account verified: @${username}`);
      const url = new URL(window.location);
      url.searchParams.delete('github');
      url.searchParams.delete('username');
      window.history.replaceState({}, '', url);
    } else if (result === 'error') {
      setError(params.get('message') || 'GitHub verification failed.');
      const url = new URL(window.location);
      url.searchParams.delete('github');
      url.searchParams.delete('message');
      window.history.replaceState({}, '', url);
    }
  }, []);

  const handleVerify = () => {
    const redirectBack = window.location.href.split('?')[0];
    window.location.href =
      `${API_BASE}/github/student-auth` +
      `?firebaseId=${encodeURIComponent(user.uid)}` +
      `&redirect=${encodeURIComponent(redirectBack)}`;
  };

  const handleRemove = async () => {
    setRemoving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE}/users/${user.uid}/profile`, {
        method: 'PUT',
        headers: { ...await getAuthHeaders(auth.currentUser), 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_username: null }),
      });
      if (!res.ok) throw new Error('Failed to remove');
      setProfile({ github_username: null, github_verified: false });
      setSuccess('GitHub account disconnected.');
    } catch {
      setError('Failed to remove GitHub account.');
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm py-8">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h2 className="text-xl font-semibold text-gray-100 mb-1">GitHub Account</h2>
        <p className="text-gray-400 text-sm">
          Connect your GitHub account so your instructor can match you to your assignment repository.
        </p>
      </div>

      {profile?.github_username ? (
        // ── Connected state ──
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/50 border border-gray-700">
            <div className="flex items-center gap-3">
              <Github className="w-5 h-5 text-gray-300" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-100 font-medium">@{profile.github_username}</span>
                  {profile.github_verified ? (
                    <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                      <ShieldAlert className="w-3 h-3" />
                      Not verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {profile.github_verified
                    ? 'Identity confirmed via GitHub OAuth'
                    : 'Verify ownership by connecting with GitHub'}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              disabled={removing}
              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
              title="Disconnect"
            >
              {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
            </button>
          </div>

          {!profile.github_verified && (
            <button
              onClick={handleVerify}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 hover:bg-gray-950 text-white border border-gray-600 hover:border-gray-400 rounded-xl font-medium transition-all duration-300"
            >
              <Github className="w-5 h-5" />
              Verify with GitHub
            </button>
          )}
        </div>
      ) : (
        // ── Not connected state ──
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-gray-300 leading-relaxed">
            Click the button below to authorize with GitHub. We will read only your
            <span className="text-blue-400 font-medium"> public username </span>
            — no repositories, no write access.
          </div>
          <button
            onClick={handleVerify}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gray-900 hover:bg-gray-800 text-white border border-gray-600 hover:border-gray-400 rounded-xl font-semibold transition-all duration-300 shadow-lg"
          >
            <Github className="w-5 h-5" />
            Connect GitHub Account
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-sm text-green-400 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}
    </div>
  );
};

export default GitHubSettings;
