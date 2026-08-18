import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '@/utils/firebase';
import { useTranslation } from 'react-i18next';

const RESEND_COOLDOWN = 60;

const VerifyEmailMain = ({ setUser }) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [checking, setChecking] = useState(false);
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');

  // Guard the route: must have a logged-in, not-yet-verified user.
  useEffect(() => {
    const current = auth.currentUser;
    if (!current) {
      navigate('/login', { replace: true });
      return;
    }
    if (current.emailVerified) {
      navigate('/', { replace: true });
      return;
    }
    setEmail(current.email || '');
  }, [navigate]);

  // Resend cooldown ticker.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleResend = async () => {
    setInfo('');
    setError('');
    if (!auth.currentUser || cooldown > 0) return;

    try {
      await sendEmailVerification(auth.currentUser);
      setInfo(t('verifyResent'));
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      console.error('Resend verification error:', err);
      setError(t('verifyResendError'));
      // Firebase rate-limits aggressively; back off either way.
      setCooldown(RESEND_COOLDOWN);
    }
  };

  const handleContinue = async () => {
    setInfo('');
    setError('');
    if (!auth.currentUser) {
      navigate('/login', { replace: true });
      return;
    }

    setChecking(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        // Spreading a Firebase User drops the emailVerified getter; keep it explicit.
        setUser({ ...auth.currentUser, emailVerified: true });
        navigate('/', { replace: true });
        return;
      }
      setError(t('verifyStillNot'));
    } catch (err) {
      console.error('Verification check error:', err);
      setError(t('errGeneric'));
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 to-gray-900 flex items-center justify-center p-4 sm:p-8 pt-24 sm:pt-8 overflow-x-hidden relative">
      {/* Animated gradient blob 1 */}
      <div className="absolute left-[calc(50%-11rem)] top-[10%] w-[36.125rem] aspect-[1155/678] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 rounded-full blur-[80px] animate-blob1" />

      {/* Animated gradient blob 2 */}
      <div className="absolute right-[calc(50%-11rem)] bottom-[10%] w-[36.125rem] aspect-[1155/678] translate-x-1/2 -rotate-[30deg] bg-gradient-to-bl from-[#9089fc] to-[#ff80b5] opacity-30 rounded-full blur-[80px] animate-blob2" />

      {/* Logo */}
      <Link
        to="/"
        className="fixed top-4 right-4 sm:top-8 sm:right-8 flex items-center gap-2 h-10 no-underline z-10"
      >
        <img
          src="https://intellita-media-storage.s3.us-east-1.amazonaws.com/logos/IntelliTA.svg"
          alt="IntelliTA Logo"
          className="w-12 h-12 sm:w-20 sm:h-20 object-contain"
        />
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight italic leading-none">
          IntelliTA
        </h1>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md relative z-[1]">
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 shadow-2xl text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/15 text-blue-400">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>

          <h2 className="text-2xl font-semibold text-white mb-3">
            {t('verifyTitle')}
          </h2>

          <p className="text-sm text-gray-300 mb-1">{t('verifyDesc')}</p>
          <p className="text-sm font-medium text-white mb-4 break-all">{email}</p>
          <p className="text-sm text-gray-400 mb-6">{t('verifyInstruction')}</p>

          {info && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-400 py-3 px-4 rounded-lg text-sm mb-4">
              {info}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 py-3 px-4 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <button
            dir={isArabic ? 'rtl' : 'ltr'}
            type="button"
            onClick={handleContinue}
            disabled={checking}
            className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 border-none cursor-pointer hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checking ? t('verifyChecking') : t('verifyContinue')}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0}
            className="w-full bg-gray-700/50 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 mt-3 border border-gray-600/50 cursor-pointer hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cooldown > 0 ? `${t('verifyResend')} (${cooldown}s)` : t('verifyResend')}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 text-sm text-blue-400 transition-colors duration-200 bg-transparent border-none cursor-pointer hover:text-blue-300"
          >
            {t('verifyUseAnother')}
          </button>
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

export default VerifyEmailMain;
