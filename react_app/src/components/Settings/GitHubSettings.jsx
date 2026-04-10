import React, { useState, useEffect } from 'react';
import { Github, CheckCircle, Loader2, Info } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const AUTH_HEADER = { Authorization: 'Bearer 1111' };

const GitHubSettings = ({ user }) => {
  const [githubUsername, setGithubUsername] = useState('');
  const [savedUsername, setSavedUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.uid) return;
    fetch(`${API_BASE}/users/${user.uid}/profile`, {
      headers: AUTH_HEADER,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        setGithubUsername(data.github_username || '');
        setSavedUsername(data.github_username || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.uid]);

  const handleSave = async () => {
    const trimmed = githubUsername.trim();
    if (!trimmed) {
      setError('Please enter your GitHub username.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE}/users/${user.uid}/profile`, {
        method: 'PUT',
        headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_username: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to save GitHub username');
      }

      setSavedUsername(trimmed);
      setSuccess('GitHub username saved successfully.');
    } catch (err) {
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE}/users/${user.uid}/profile`, {
        method: 'PUT',
        headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_username: null }),
      });

      if (!res.ok) throw new Error('Failed to remove GitHub username');

      setGithubUsername('');
      setSavedUsername('');
      setSuccess('GitHub username removed.');
    } catch (err) {
      setError(err.message || 'An error occurred.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-100 mb-1">GitHub Integration</h2>
        <p className="text-gray-400 text-sm">Link your GitHub account for GitHub Classroom assignments.</p>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <Info className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
        <div className="text-sm text-gray-300 leading-relaxed">
          <p className="mb-1">
            Enter your <span className="text-blue-400 font-medium">GitHub username</span> to link your account.
            This is used to match you with your GitHub Classroom assignment repositories.
          </p>
          <p className="text-gray-400">
            Make sure to use the same GitHub account that you use to accept classroom assignments.
          </p>
        </div>
      </div>

      {savedUsername ? (
        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/50 border border-gray-700">
          <div className="flex items-center gap-3">
            <Github className="w-5 h-5 text-gray-300" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-gray-100 font-medium">{savedUsername}</span>
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-xs text-gray-500 mt-0.5">GitHub username linked</p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            disabled={saving}
            className="px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? 'Removing...' : 'Remove'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="github-username" className="block text-sm font-medium text-gray-300">
              GitHub Username
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <Github className="w-5 h-5" />
              </div>
              <input
                id="github-username"
                type="text"
                value={githubUsername}
                onChange={(e) => {
                  setGithubUsername(e.target.value);
                  setError('');
                  setSuccess('');
                }}
                placeholder="e.g. octocat"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all duration-300"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!githubUsername.trim() || saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all duration-300 shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-green-400">{success}</p>}
    </div>
  );
};

export default GitHubSettings;
