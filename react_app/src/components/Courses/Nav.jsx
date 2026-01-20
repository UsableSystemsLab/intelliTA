import Shuffle from "@/components/lib/Shuffle";
import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "@/utils/firebase";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function Nav({ user }) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const [showDropdown, setShowDropdown] = useState(false);

  // Changes the language between English and Arabic
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
    return "User";
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
      <header className="top-0 z-50 bg-black/50 backdrop-blur-lg relative">

        <nav
          aria-label="Global"
          className="flex items-center justify-between p-6 lg:px-8"
        >
          <div className="flex lg:flex-1">
            <div className="-m-1.5 p-1.5" dir="ltr">
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
                  style={{ fontSize: "1.5rem", fontWeight: "bold" }}
                />
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex lg:flex-1 lg:justify-end gap-x-6">
            {/* Language Toggle */}
            <button
              onClick={changeLanguage}
              type="button"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium 
                         text-gray-900 bg-white border border-gray-300 rounded-lg 
                         transition-all duration-300 ease-in-out 
                         hover:bg-gray-200 hover:border-gray-400 
                         dark:text-white dark:bg-gray-800 dark:border-gray-600 
                         dark:hover:bg-gray-700 hover:cursor-pointer"
            >
              {i18n.language === "en" ? "عربي" : "English"}
            </button>

            {user ? (
              <div className="relative">
                {/* Avatar Button */}
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="relative inline-flex items-center justify-center w-10 h-10 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600 cursor-pointer hover:ring-2 hover:ring-white transition-all"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="User profile"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="font-medium text-gray-600 dark:text-gray-300 text-xs">
                      {getUserInitials().split(' ').map(n => n[0]).join('')}
                    </span>
                  )}
                </button>

                {/* Dropdown menu */}
                {showDropdown && (
                  <div
                    className={`absolute ${
                      isArabic ? "left-0" : "right-0"
                    } mt-2 z-50 bg-gray-900 divide-y divide-gray-100 rounded-lg shadow-xl w-44 border border-gray-800`}
                  >
                    <div className="px-4 py-3 text-sm text-gray-100">
                      <div className="font-bold truncate">{getUserInitials()}</div>
                    </div>
                    <ul className="py-2 text-sm text-gray-200">
                      <li>
                        <Link
                          to="/dashboard"
                          className="block px-4 py-2 hover:bg-gray-800 transition-colors"
                          onClick={() => setShowDropdown(false)}
                        >
                          {t("dashboard")}
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/settings"
                          className="block px-4 py-2 hover:bg-gray-800 transition-colors"
                          onClick={() => setShowDropdown(false)}
                        >
                          {t("settings")}
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/earnings"
                          className="block px-4 py-2 hover:bg-gray-800 transition-colors"
                          onClick={() => setShowDropdown(false)}
                        >
                          {t("earnings")}
                        </Link>
                      </li>
                    </ul>
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="cursor-pointer block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 transition-colors"
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
                className="relative text-xl font-semibold text-white hover:text-neutral-400 transition-colors duration-300 flex items-center"
              >
                <span className="relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-white hover:after:w-full after:transition-all after:duration-300">
                  {t("login")}
                </span>
                <span className={`ml-2 ${isArabic ? 'rotate-180' : ''}`} aria-hidden="true">&rarr;</span>
              </Link>
            )}
          </div>
        </nav>
      </header>
    </>
  );
}