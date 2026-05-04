import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertCircle, Loader, Info, Github, Eye, EyeOff, Copy, HelpCircle } from "lucide-react";
import Breadcrumb from "../shared/Breadcrumb";
import GitHubSetupInstructions from "../shared/GitHubSetupInstructions";
import { API_BASE, getAuthHeaders } from "../../config/api";
import { auth } from "@/utils/firebase.js";

export default function CreateCourseMain({ user }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [description, setDescription] = useState("");
  const [studentList, setStudentList] = useState("");

  // GitHub credentials (required)
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [copiedCallback, setCopiedCallback] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const navigate = useNavigate();

  const callbackUrl = `${API_BASE}/github/callback`;

  const copyCallback = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopiedCallback(true);
    setTimeout(() => setCopiedCallback(false), 2000);
  };

  const handleSubmit = async () => {
    const errors = {};
    if (!title.trim()) errors.title = true;
    if (!courseCode.trim()) errors.courseCode = true;
    if (!description.trim()) errors.description = true;
    if (!clientId.trim()) errors.clientId = true;
    if (!clientSecret.trim()) errors.clientSecret = true;
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setErrorMsg(t("fillAllRequired"));
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const allowedStudents = studentList
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const createCourseRequest = async () => fetch(`${API_BASE}/courses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...await getAuthHeaders(auth.currentUser),
      },
      body: JSON.stringify({
        title,
        course_code: courseCode,
        description,
        firebaseId: user?.uid,
        allowed_students: allowedStudents.length > 0 ? allowedStudents : null,
      }),
    });

    try {
      let response = await createCourseRequest();

      if (response.status === 404) {
        const data = await response.json();
        if (data.message === "User not found") {
           // Attempt to sync user to Postgres
           /* 
              We need to map Firestore keys (firstName, lastName) 
              to Postgres keys (first_name, last_name).
           */
           const syncResponse = await fetch(`${API_BASE}/users`, {
             method: "POST",
             headers: { "Content-Type": "application/json",
                        ...await getAuthHeaders(auth.currentUser),
             },
             body: JSON.stringify({
               firebaseId: user?.uid,
               first_name: user?.firstName || user?.displayName?.split(' ')[0] || "Unknown",
               last_name: user?.lastName || user?.displayName?.split(' ').slice(1).join(' ') || "User",
               email: user?.email
             })
           });

           if (syncResponse.ok) {
             // Retry course creation
             response = await createCourseRequest();
           } else {
             // If sync fails, throw the original error or sync error
             const syncData = await syncResponse.json();
             throw new Error("Account sync failed: " + (syncData.message || syncData.error));
           }
        } else {
          throw new Error(data.message || data.error || "Resource not found");
        }
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.error || "Failed to create course");
      }

      const course = await response.json();
      const courseId = course.course_id;

      // Save GitHub credentials for the new course
      const credRes = await fetch(`${API_BASE}/courses/${courseId}/github`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...await getAuthHeaders(auth.currentUser),
        },
        body: JSON.stringify({
          github_client_id: clientId.trim(),
          github_client_secret: clientSecret.trim(),
        }),
      });

      if (!credRes.ok) {
        const credData = await credRes.json();
        throw new Error("GitHub setup failed: " + (credData.message || "Unknown error"));
      }

      // Redirect browser to GitHub OAuth (must be a full page redirect)
      const redirectBack = `${window.location.origin}/courses/${courseId}`;
      window.location.href = `${API_BASE}/github/auth?courseId=${courseId}&redirect=${encodeURIComponent(redirectBack)}`;

    } catch (err) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 p-22 flex flex-col items-center text-white w-full overflow-y-auto">
      <div className="max-w-2xl w-full mb-4">
        <Breadcrumb items={[
          { label: t("courses"), href: "/courses" },
          { label: t("createCourse") }
        ]} />
      </div>
      <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 max-w-2xl w-full shadow-xl shadow-blue-900/10">
        <h1 className="text-3xl font-bold mb-4 text-white">{t("createNewCourse")}</h1>

        <div className="bg-blue-500/10 border border-blue-500/30 text-blue-300 p-4 rounded-xl mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{t("createCourseInfo")}</p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            {errorMsg}
          </div>
        )}

        {/* Course Details */}
        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-300">{t("courseTitleLabel")} <span className="text-red-400">*</span></label>
          <input
            type="text"
            className={`w-full p-3 rounded-xl bg-gray-900 border text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${fieldErrors.title ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-700 focus:border-blue-500 focus:ring-blue-500"}`}
            placeholder={t("enterCourseTitle")}
            value={title}
            onChange={(e) => { setTitle(e.target.value); setFieldErrors(prev => ({ ...prev, title: false })); }}
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-300">{t("courseCodeLabel")} <span className="text-red-400">*</span></label>
          <input
            type="text"
            className={`w-full p-3 rounded-xl bg-gray-900 border text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${fieldErrors.courseCode ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-700 focus:border-blue-500 focus:ring-blue-500"}`}
            placeholder={t("enterCourseCode")}
            value={courseCode}
            onChange={(e) => { setCourseCode(e.target.value); setFieldErrors(prev => ({ ...prev, courseCode: false })); }}
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-300">{t("descriptionLabel")} <span className="text-red-400">*</span></label>
          <textarea
            rows="4"
            className={`w-full p-3 rounded-xl bg-gray-900 border text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all resize-none ${fieldErrors.description ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-700 focus:border-blue-500 focus:ring-blue-500"}`}
            placeholder={t("writeCourseDescription")}
            value={description}
            onChange={(e) => { setDescription(e.target.value); setFieldErrors(prev => ({ ...prev, description: false })); }}
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-semibold">{t("allowedStudentNames")} <span className="text-gray-500 font-normal">{t("optional")}</span></label>
          <p className="text-sm text-gray-400 mb-2">{t("allowedStudentsHint")}</p>
          <textarea
            rows="4"
            className="w-full p-3 rounded bg-slate-700 border border-slate-600 outline-none"
            placeholder="Meshal Okairy&#10;Mohanad Babgi&#10;Amer Bugshan&#10;..."
            value={studentList}
            onChange={(e) => setStudentList(e.target.value)}
          />
        </div>

        {/* GitHub Organization — Required */}
        <div className="mb-8 p-5 rounded-xl border border-gray-600 bg-gray-900/50">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Github className="w-5 h-5 text-white" />
              {t("githubOrganization")} <span className="text-red-400 text-sm font-normal ml-1">{t("required")}</span>
            </h2>
            <button
              type="button"
              onClick={() => setShowInstructions(true)}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-300 hover:text-blue-200 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              {t("howToSetUp")}
            </button>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            {t("githubOrgInfo")}
          </p>

          {/* Callback URL helper */}
          <div className="mb-4">
            <label className="block mb-1 text-xs font-medium text-gray-400 uppercase tracking-wider">{t("oauthCallbackUrl")}</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-800 border border-gray-700 text-blue-300 text-xs px-3 py-2 rounded-lg font-mono truncate">
                {callbackUrl}
              </code>
              <button
                type="button"
                onClick={copyCallback}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-lg transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedCallback ? t("copied") : t("copy")}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">{t("callbackHint")}</p>
          </div>

          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-300">
              {t("clientId")} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              className={`w-full p-3 rounded-xl bg-gray-800 border text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all font-mono text-sm ${fieldErrors.clientId ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-600 focus:border-blue-500 focus:ring-blue-500"}`}
              placeholder="Ov23li..."
              value={clientId}
              onChange={(e) => { setClientId(e.target.value); setFieldErrors(prev => ({ ...prev, clientId: false })); }}
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">
              {t("clientSecret")} <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                className={`w-full p-3 pr-10 rounded-xl bg-gray-800 border text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all font-mono text-sm ${fieldErrors.clientSecret ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-600 focus:border-blue-500 focus:ring-blue-500"}`}
                placeholder="••••••••••••••••••••••••••••••••••••••••"
                value={clientSecret}
                onChange={(e) => { setClientSecret(e.target.value); setFieldErrors(prev => ({ ...prev, clientSecret: false })); }}
              />
              <button
                type="button"
                onClick={() => setShowSecret(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/20 transition-all hover:shadow-blue-600/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>{t("creatingAndConnecting")}</span>
              </>
            ) : (
              <>
                <Github className="w-5 h-5" />
                {t("createCourseAndConnect")}
              </>
            )}
          </button>
        </div>
      </div>

      {showInstructions && (
        <GitHubSetupInstructions
          callbackUrl={callbackUrl}
          onClose={() => setShowInstructions(false)}
        />
      )}
    </main>
  );
}
