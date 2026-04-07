import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth,db } from '@/utils/firebase';
import { updateProfile } from 'firebase/auth';
import { useTranslation } from "react-i18next";
import { doc, setDoc,getDoc  } from "firebase/firestore";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const AUTH_HEADER = { 'Content-Type': 'application/json', Authorization: 'Bearer 1111' };

const SignUp = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return "This email is already registered. Please login instead.";
      case 'auth/weak-password':
        return "Password should be at least 6 characters.";
      case 'auth/invalid-email':
        return "Please enter a valid email address.";
      case 'auth/network-request-failed':
        return "Network error. Please check your connection.";
      default:
        return "An error occurred. Please try again.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(userCredential.user, {
        displayName: `${firstName} ${lastName}`
      });
      // Save user data in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        firstName: firstName,
        lastName: lastName,
        email: email,
        createdAt: new Date()
      });

      // Sync user to PostgreSQL
      await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: AUTH_HEADER,
        body: JSON.stringify({
          firebaseId: userCredential.user.uid,
          first_name: firstName,
          last_name: lastName,
          email: email,
        }),
      });

      navigate('/');
    } catch (err) {
      console.error('Sign up error:', err);
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
  setError('');
  setLoading(true);

  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Firestore reference
    const userRef = doc(db, "users", user.uid);
    const existingDoc = await getDoc(userRef);

    // Only create user document if it doesn't exist
    if (!existingDoc.exists()) {
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName || "",
        provider: "google",
        createdAt: new Date(),
      });

      // Sync user to PostgreSQL
      const nameParts = (user.displayName || '').split(' ');
      await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: AUTH_HEADER,
        body: JSON.stringify({
          firebaseId: user.uid,
          first_name: nameParts[0] || 'Unknown',
          last_name: nameParts.slice(1).join(' ') || 'Unknown',
          email: user.email,
        }),
      });
    }

    navigate('/');

  } catch (err) {
    console.error('Google sign up error:', err);

    if (err.code === 'auth/popup-closed-by-user') {
      setError('Sign up cancelled.');
    } else {
      setError(getErrorMessage(err.code));
    }

  } finally {
    setLoading(false);
  }
};
 

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-gray-900 to-gray-900 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
      {/* Animated gradient blob 1 */}
      <div className="absolute left-[calc(50%-11rem)] top-[10%] w-[36.125rem] aspect-[1155/678] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 rounded-full blur-[80px] animate-blob1" />

      {/* Animated gradient blob 2 */}
      <div className="absolute right-[calc(50%-11rem)] bottom-[10%] w-[36.125rem] aspect-[1155/678] translate-x-1/2 -rotate-[30deg] bg-gradient-to-bl from-[#9089fc] to-[#ff80b5] opacity-30 rounded-full blur-[80px] animate-blob2" />

      {/* Back button to home */}
      <Link
        to="/"
        className="fixed top-8 left-8 flex items-center justify-center w-10 h-10 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white cursor-pointer transition-all duration-200 hover:bg-gray-700 hover:-translate-x-0.5 z-10"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </Link>

      {/* Logo on the right */}
      <Link
        to="/"
        className="fixed top-8 right-8 flex items-center gap-2 h-10 no-underline z-10"
      >
        <img
          src="https://intellita-media-storage.s3.us-east-1.amazonaws.com/logos/IntelliTA.svg"
          alt="IntelliTA Logo"
          className="w-20 h-20 object-contain"
        />
        <h1 className="text-2xl font-bold text-white tracking-tight italic leading-none">
          IntelliTA
        </h1>
      </Link>

      {/* SignUp Card */}
      <div className="w-full max-w-2xl relative z-[1]">
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">
            {t("create")}
          </h2>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full bg-gray-700/50 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 border border-gray-600/50 cursor-pointer hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6 text-center">
            <div className="flex-1 h-px bg-gray-600/50"></div>
            <span className="text-gray-400 text-sm flex-shrink-0">
              {t("or")}
            </span>
            <div className="flex-1 h-px bg-gray-600/50"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* First Name and Last Name Row */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              dir={isArabic ? "rtl" : "ltr"}
            >
              <div className="flex flex-col gap-2 text-left">
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-300 text-left"
                >
                  {t("fName")}
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t("fName")}
                  required
                  className="w-full bg-gray-700/30 border border-gray-600/50 text-white rounded-lg py-3 px-4 transition-all duration-200 text-left placeholder:text-gray-500 placeholder:text-left focus:outline-none focus:border-transparent focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="flex flex-col gap-2 text-left">
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-300 text-left"
                >
                  {t("lName")}
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t("lName")}
                  required
                  className="w-full bg-gray-700/30 border border-gray-600/50 text-white rounded-lg py-3 px-4 transition-all duration-200 text-left placeholder:text-gray-500 placeholder:text-left focus:outline-none focus:border-transparent focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="flex flex-col gap-2 text-left">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 text-left"
              >
                {t("email")}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("enterEmail")}
                required
                className="w-full bg-gray-700/30 border border-gray-600/50 text-white rounded-lg py-3 px-4 transition-all duration-200 text-left placeholder:text-gray-500 placeholder:text-left focus:outline-none focus:border-transparent focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2 text-left">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 text-left"
              >
                {t("password")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("enterPass")}
                  required
                  minLength="6"
                  className="w-full bg-gray-700/30 border border-gray-600/50 text-white rounded-lg py-3 px-4 pr-12 transition-all duration-200 text-left placeholder:text-gray-500 placeholder:text-left focus:outline-none focus:border-transparent focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200 p-1 bg-transparent border-none cursor-pointer hover:text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="flex flex-col gap-2 text-left">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-300 text-left"
              >
                {t("confirmPass")}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("enterPass")}
                  required
                  minLength="6"
                  className="w-full bg-gray-700/30 border border-gray-600/50 text-white rounded-lg py-3 px-4 pr-12 transition-all duration-200 text-left placeholder:text-gray-500 placeholder:text-left focus:outline-none focus:border-transparent focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200 p-1 bg-transparent border-none cursor-pointer hover:text-gray-300"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 py-3 px-4 rounded-lg text-sm text-left">
                {error}
              </div>
            )}

            {/* SignUp Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 mt-6 border-none cursor-pointer hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? t("loading") : t("create")}
            </button>
          </form>

          {/* Login Prompt */}
          <div className="mt-6 text-center text-sm text-gray-400">
            {t("alreadyHave")}{" "}
            <Link
              to="/login"
              className="text-blue-400 font-medium transition-colors duration-200 no-underline hover:text-blue-300"
            >
              {t("login")}
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob1 {
          0%, 100% {
            transform: translateX(-50%) rotate(30deg) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translateX(-50%) rotate(45deg) scale(1.1);
            opacity: 0.4;
          }
        }

        @keyframes blob2 {
          0%, 100% {
            transform: translateX(50%) rotate(-30deg) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translateX(50%) rotate(-45deg) scale(1.1);
            opacity: 0.4;
          }
        }

        .animate-blob1 {
          animation: blob1 20s ease-in-out infinite;
        }

        .animate-blob2 {
          animation: blob2 20s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default SignUp;