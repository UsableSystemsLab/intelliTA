import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  X,
  Github,
  CheckCircle,
  Loader2,
  Info,
  Eye,
  EyeOff,
  Trash2,
  Unplug,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import { API_BASE, getAuthHeaders } from "../../config/api";
import { auth } from "@/utils/firebase.js";

const GitHubCourseModal = ({ courseId, onClose }) => {
  const { t } = useTranslation();
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Classroom picker state
  const [classrooms, setClassrooms] = useState([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [showClassroomPicker, setShowClassroomPicker] = useState(false);
  const [savingClassroom, setSavingClassroom] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, [courseId]);

  // Check for OAuth callback result in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const githubResult = params.get("github");
    if (githubResult === "connected") {
      setSuccess("GitHub connected successfully!");
      const url = new URL(window.location);
      url.searchParams.delete("github");
      window.history.replaceState({}, "", url);
      fetchStatus();
    } else if (githubResult === "error") {
      setError(params.get("message") || "GitHub connection failed.");
      const url = new URL(window.location);
      url.searchParams.delete("github");
      url.searchParams.delete("message");
      window.history.replaceState({}, "", url);
    }
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/courses/${courseId}/github`, {
        headers: await getAuthHeaders(auth.currentUser),
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.github_client_id) setClientId(data.github_client_id);
      }
    } catch (err) {
      console.error("Failed to fetch GitHub status:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassrooms = async () => {
    setLoadingClassrooms(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/courses/${courseId}/github/classrooms`, {
        headers: await getAuthHeaders(auth.currentUser),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to fetch classrooms");
      }
      const data = await res.json();
      setClassrooms(data);
      setShowClassroomPicker(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingClassrooms(false);
    }
  };

  const handleSelectClassroom = async (classroom) => {
    setSavingClassroom(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/courses/${courseId}/github/classroom`, {
        method: "PATCH",
        headers: { ...await getAuthHeaders(auth.currentUser), "Content-Type": "application/json" },
        body: JSON.stringify({
          classroom_id: classroom.id,
          classroom_name: classroom.name,
          classroom_org: classroom.organization,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to save classroom");
      }
      setSuccess(`Classroom "${classroom.name}" linked successfully!`);
      setShowClassroomPicker(false);
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingClassroom(false);
    }
  };

  const handleSaveCredentials = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      setError("Both Client ID and Client Secret are required.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/courses/${courseId}/github`, {
        method: "POST",
        headers: { ...await getAuthHeaders(auth.currentUser), "Content-Type": "application/json" },
        body: JSON.stringify({
          github_client_id: clientId.trim(),
          github_client_secret: clientSecret.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to save credentials");
      }
      setClientSecret("");
      setSuccess("Credentials saved. You can now connect GitHub.");
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = () => {
    const redirectUrl = window.location.href.split("?")[0];
    window.location.href = `${API_BASE}/github/auth?courseId=${courseId}&redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Disconnect GitHub? You can reconnect later.")) return;
    try {
      setError("");
      const res = await fetch(`${API_BASE}/courses/${courseId}/github/token`, {
        method: "DELETE",
        headers: await getAuthHeaders(auth.currentUser),
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      setSuccess("GitHub disconnected.");
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteCredentials = async () => {
    if (!window.confirm("Remove all GitHub credentials for this course? This cannot be undone.")) return;
    try {
      setError("");
      const res = await fetch(`${API_BASE}/courses/${courseId}/github`, {
        method: "DELETE",
        headers: await getAuthHeaders(auth.currentUser),
      });
      if (res.status !== 204) throw new Error("Failed to delete credentials");
      setClientId("");
      setClientSecret("");
      setStatus({ has_credentials: false, connected: false });
      setSuccess("Credentials removed.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative bg-gray-800 p-8 rounded-2xl border border-gray-700 max-w-lg w-full shadow-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center">
              <Github className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t('githubIntegration')}</h2>
              <p className="text-sm text-gray-400">{t('connectGitHubClassroom')}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-8 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t('loading')}</span>
            </div>
          ) : status?.connected ? (
            // ── Connected State ──
            <div className="space-y-4">
              {/* GitHub Account */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <Github className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{status.github_username}</span>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{t('githubAccountConnected')}</p>
                  </div>
                </div>
              </div>

              {/* Classroom Picker Section */}
              <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-gray-200">{t('githubClassroom')}</span>
                  </div>
                  {status.github_classroom_id && (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <CheckCircle className="w-3 h-3" />
                      {t('linked')}
                    </span>
                  )}
                </div>

                {status.github_classroom_id ? (
                  <div className="mb-3">
                    <p className="text-sm text-white font-medium">{status.github_classroom_name}</p>
                    {status.github_org && (
                      <p className="text-xs text-gray-400 mt-0.5">{t('orgLabel')} {status.github_org}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t('autoCreateReposDesc')}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mb-3">
                    {t('linkClassroomDesc')}
                  </p>
                )}

                {/* Classroom list */}
                {showClassroomPicker && (
                  <div className="mt-2 mb-3 border border-gray-700 rounded-xl overflow-hidden">
                    {classrooms.length === 0 ? (
                      <p className="text-sm text-gray-400 p-3 text-center">{t('noClassroomsFound')}</p>
                    ) : (
                      classrooms.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleSelectClassroom(c)}
                          disabled={savingClassroom}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-700 transition-colors text-left border-b border-gray-700 last:border-0 disabled:opacity-50"
                        >
                          <div>
                            <p className="text-sm text-white font-medium">{c.name}</p>
                            {c.organization && (
                              <p className="text-xs text-gray-400">@{c.organization}</p>
                            )}
                          </div>
                          {savingClassroom ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-500 rotate-[-90deg]" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}

                <button
                  onClick={fetchClassrooms}
                  disabled={loadingClassrooms}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl transition-colors disabled:opacity-50"
                >
                  {loadingClassrooms ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <BookOpen className="w-4 h-4" />
                  )}
                  {loadingClassrooms
                    ? t('loadingClassrooms')
                    : status.github_classroom_id
                    ? t('changeClassroom')
                    : t('selectClassroom')}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDisconnect}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors"
                >
                  <Unplug className="w-4 h-4" />
                  {t('disconnect')}
                </button>
                <button
                  onClick={handleDeleteCredentials}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('removeAll')}
                </button>
              </div>
            </div>
          ) : status?.has_credentials ? (
            // ── Credentials saved, not connected ──
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Info className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-300">
                  {t('credentialsSavedClickToAuth')}
                </p>
              </div>

              <button
                onClick={handleConnect}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 hover:bg-gray-950 text-white border border-gray-600 hover:border-gray-500 rounded-xl font-medium transition-all duration-300"
              >
                <Github className="w-5 h-5" />
                {t('connectGitHub')}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setStatus({ has_credentials: false, connected: false })}
                  className="flex-1 text-sm text-gray-400 hover:text-gray-300 py-2 transition-colors"
                >
                  {t('updateCredentials')}
                </button>
                <button
                  onClick={handleDeleteCredentials}
                  className="text-sm text-red-400 hover:text-red-300 py-2 transition-colors"
                >
                  {t('remove')}
                </button>
              </div>
            </div>
          ) : (
            // ── No credentials — show form ──
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Info className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                <div className="text-sm text-gray-300 leading-relaxed">
                  <p>
                    {t('createA')}{" "}
                    <span className="text-blue-400 font-medium">{t('gitHubOAuthApp')}</span>{" "}
                    {t('underYourOrgEnterCredentials')}
                  </p>
                  <p className="text-gray-400 mt-1">
                    {t('setCallbackUrlTo')}{" "}
                    <code className="text-xs bg-gray-700 px-1.5 py-0.5 rounded">
                      {`${API_BASE}/github/callback`}
                    </code>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">{t('clientId')}</label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => { setClientId(e.target.value); setError(""); }}
                  placeholder="Iv1.abc123..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">{t('clientSecret')}</label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={clientSecret}
                    onChange={(e) => { setClientSecret(e.target.value); setError(""); }}
                    placeholder="Enter your client secret"
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSaveCredentials}
                disabled={!clientId.trim() || !clientSecret.trim() || saving}
                className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all duration-300 shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? t('saving') : t('saveCredentials')}
              </button>
            </div>
          )}

          {error && <p className="text-sm text-red-400 mt-4">{error}</p>}
          {success && <p className="text-sm text-green-400 mt-4">{success}</p>}
        </div>
      </div>
    </div>
  );
};

export default GitHubCourseModal;
