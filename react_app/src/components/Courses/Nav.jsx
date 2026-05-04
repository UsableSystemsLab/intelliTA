import Shuffle from "@/components/lib/Shuffle";
import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "@/utils/firebase";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function Nav({ user }) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const [scrolled, setScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function changeLanguage() {
    i18n.changeLanguage(i18n.language === "en" ? "ar" : "en");
  }

  const getUserInitials = () => {
    if (user?.displayName) {
      const names = user.displayName.split(" ");
      if (names.length >= 2) {
        return `${names[0].charAt(0).toUpperCase() + names[0].slice(1).toLowerCase()} ${names[names.length - 1].charAt(0).toUpperCase() + names[names.length - 1].slice(1).toLowerCase()}`;
      }
      return names[0].charAt(0).toUpperCase() + names[0].slice(1).toLowerCase();
    }
    return t("noUserNameFound");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowDropdown(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <>
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-gray-900/80 backdrop-blur-xl border-b border-gray-800"
          : "bg-transparent"
      }`}
    >
      <nav
        aria-label="Global"
        className="flex items-center justify-between px-6 py-4 lg:px-8"
      >
        {/* Logo */}
        <div className="flex shrink-0">
          <div className="-m-1.5 p-1.5 flex items-center gap-2" dir="ltr">
            <span className="sr-only">IntelliTA</span>
            <Link to="/">
              <Shuffle
                className="shuffle-text"
                text="IntelliTA"
                shuffleDirection="right"
                duration={0.35}
                animationMode="evenodd"
                shuffleTimes={1}
                ease="power3.out"
                stagger={0.03}
                threshold={0.1}
                triggerOnce={true}
                triggerOnHover={true}
                respectReducedMotion={true}
                style={{ fontSize: "1.25rem", fontWeight: "bold" }}
              />
            </Link>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            onClick={changeLanguage}
            type="button"
            className="px-3 py-1.5 text-xs font-medium text-gray-300 border border-gray-600/50 rounded-full
                       hover:bg-gray-700/50 hover:text-white transition-all duration-200 cursor-pointer"
          >
            {i18n.language === "en" ? "عربي" : "English"}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative inline-flex items-center justify-center w-9 h-9 overflow-hidden rounded-full
                           bg-gray-600 cursor-pointer
                           hover:ring-2 hover:ring-white transition-all"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="User profile"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="font-medium text-white text-sm">
                    {user.displayName?.charAt(0) || "U"}
                  </span>
                )}
              </button>

              {showDropdown && (
                <div
                  className={`absolute ${isArabic ? "left-0" : "right-0"} mt-2 z-10
                    bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-xl shadow-2xl w-48 overflow-hidden`}
                >
                  <div className="px-4 py-3 border-b border-gray-800">
                    <p className="text-sm font-medium text-white">{getUserInitials() || t("userFallback")}</p>
                  </div>
                  <ul className="py-1">
                    {[
                      { to: "/settings", label: t("settings") },
                    ].map((item) => (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                          onClick={() => setShowDropdown(false)}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-gray-800 py-1">
                    <button
                      onClick={handleLogout}
                      className="cursor-pointer block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors"
                    >
                      {t("logout")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="px-5 py-2 text-sm font-semibold text-white rounded-full
                         bg-blue-600 hover:bg-blue-700
                         hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5
                         transition-all duration-200"
            >
              {t("login")}
            </Link>
          )}
        </div>
      </nav>
    </header>
    {/* Spacer for fixed header */}
    <div className="h-16" />
    </>
  );
}
