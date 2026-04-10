import { useState, useEffect } from "react";
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
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const AUTH_HEADER = { Authorization: "Bearer 1111" };

const GitHubCourseModal = ({ courseId, onClose }) => {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [status, setStatus] = useState(null); // { has_credentials, connected, github_username, github_client_id }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchStatus();
  }, [courseId]);

  // Check for OAuth callback result in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const githubResult = params.get("github");
    if (githubResult === "connected") {
      setSuccess("GitHub connected successfully!");
      // Clean URL
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
        headers: AUTH_HEADER,
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.github_client_id) {
          setClientId(data.github_client_id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch GitHub status:", err);
    } finally {
      setLoading(false);
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
        headers: { ...AUTH_HEADER, "Content-Type": "application/json" },
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
      const res = await fetch(
        `${API_BASE}/courses/${courseId}/github/token`,
        { method: "DELETE", headers: AUTH_HEADER }
      );
      if (!res.ok) throw new Error("Failed to disconnect");
      setSuccess("GitHub disconnected.");
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteCredentials = async () => {
    if (
      !window.confirm(
        "Remove all GitHub credentials for this course? This cannot be undone."
      )
    )
      return;

    try {
      setError("");
      const res = await fetch(`${API_BASE}/courses/${courseId}/github`, {
        method: "DELETE",
        headers: AUTH_HEADER,
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
      <div className="relative bg-gray-800 p-8 rounded-2xl border border-gray-700 max-w-lg w-full shadow-2xl mx-4">
        {/* Decorative glow */}
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
              <h2 className="text-xl font-bold text-white">
                GitHub Integration
              </h2>
              <p className="text-sm text-gray-400">
                Connect GitHub Classroom for this course
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-8 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading...</span>
            </div>
          ) : status?.connected ? (
            // Connected state
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <Github className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {status.github_username}
                      </span>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      GitHub account connected
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDisconnect}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors"
                >
                  <Unplug className="w-4 h-4" />
                  Disconnect
                </button>
                <button
                  onClick={handleDeleteCredentials}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove All
                </button>
              </div>
            </div>
          ) : status?.has_credentials ? (
            // Credentials saved but not connected
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Info className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-300">
                  Credentials saved. Click below to authorize with GitHub.
                </p>
              </div>

              <button
                onClick={handleConnect}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 hover:bg-gray-950 text-white border border-gray-600 hover:border-gray-500 rounded-xl font-medium transition-all duration-300"
              >
                <Github className="w-5 h-5" />
                Connect GitHub
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setStatus({ has_credentials: false, connected: false });
                    setClientSecret("");
                  }}
                  className="flex-1 text-sm text-gray-400 hover:text-gray-300 py-2 transition-colors"
                >
                  Update Credentials
                </button>
                <button
                  onClick={handleDeleteCredentials}
                  className="text-sm text-red-400 hover:text-red-300 py-2 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            // No credentials — show form
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Info className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                <div className="text-sm text-gray-300 leading-relaxed">
                  <p>
                    Create a{" "}
                    <span className="text-blue-400 font-medium">
                      GitHub OAuth App
                    </span>{" "}
                    under your organization, then enter the credentials below.
                  </p>
                  <p className="text-gray-400 mt-1">
                    Set the callback URL to:{" "}
                    <code className="text-xs bg-gray-700 px-1.5 py-0.5 rounded">
                      {window.location.origin.replace(
                        `:${window.location.port}`,
                        ":4000"
                      )}
                      /api/github/callback
                    </code>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Client ID
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value);
                    setError("");
                  }}
                  placeholder="Iv1.abc123..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Client Secret
                </label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={clientSecret}
                    onChange={(e) => {
                      setClientSecret(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter your client secret"
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    {showSecret ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSaveCredentials}
                disabled={
                  !clientId.trim() || !clientSecret.trim() || saving
                }
                className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all duration-300 shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving..." : "Save Credentials"}
              </button>
            </div>
          )}

          {/* Status messages */}
          {error && (
            <p className="text-sm text-red-400 mt-4">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-400 mt-4">{success}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GitHubCourseModal;
