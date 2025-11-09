import Shuffle from "@/components/lib/Shuffle";
import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "@/utils/firebase";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function Nav({ user }) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  function changeLanguage() {
    i18n.changeLanguage(i18n.language === "en" ? "ar" : "en");
  }

  const [showDropdown, setShowDropdown] = useState(false);

  const getUserInitials = () => {
    if (user?.displayName) {
      const names = user.displayName.split(" ");
      if (names.length >= 2) {
        return `${names[0].charAt(0).toUpperCase() + names[0].slice(1).toLowerCase()} ${names[names.length - 1].charAt(0).toUpperCase() + names[names.length - 1].slice(1).toLowerCase()}`;
      }
      return names[0].charAt(0).toUpperCase() + names[0].slice(1).toLowerCase();
    }
    
    return "No user name found";
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
      <header className="sticky top-0 z-50 bg-black/50 backdrop-blur-lg">
        <nav
          aria-label="Global"
          className="flex items-center justify-between p-6 lg:px-8"
        >
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5">
              <span className="sr-only">IntelliTA</span>
              <a href="">
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
              </a>
            </a>
          </div>
          <div className="flex lg:hidden">
            <button
              type="button"
              data-command="show-modal"
              data-commandfor="mobile-menu"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-200"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
                className="size-6"
              >
                <path
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            <a
              href="#"
              className="relative text-2xl font-semibold text-white hover:text-neutral-400 transition-colors duration-300
             after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px]
             after:bg-white hover:after:w-full after:transition-all after:duration-300"
            >
              {t("about")}
            </a>

            <a
              href="#"
              className="relative text-2xl font-semibold text-white hover:text-neutral-400 transition-colors duration-300
             after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px]
             after:bg-white hover:after:w-full after:transition-all after:duration-300"
            >
              {t("courses")}
            </a>
            <a
              href="#"
              className="relative text-2xl font-semibold text-white hover:text-neutral-400 transition-colors duration-300
             after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px]
             after:bg-white hover:after:w-full after:transition-all after:duration-300"
            >
              {t("contact")}
            </a>
          </div>

          <div className="hidden lg:flex lg:flex-1 lg:justify-end gap-6.5">
            <button
              onClick={changeLanguage}
              type="button"
              className="inline-flex items-center justify-center px-3 py-0 text-sm font-medium 
                          text-gray-900 bg-white border border-gray-300 rounded-lg 
                          transition-all duration-300 ease-in-out 
                          hover:bg-gray-200 hover:border-gray-400 
                          focus:outline-none focus:ring-2 focus:ring-gray-300 
                          dark:text-white dark:bg-gray-800 dark:border-gray-600 
                          dark:hover:bg-gray-700 dark:hover:border-gray-500 hover:cursor-pointer"
            >
              <p>{i18n.language === "en" ? "عربي" : "English"}</p>

              <span className="sr-only">Change language</span>
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
                    <span className="font-medium text-gray-600 dark:text-gray-300"></span>
                  )}
                </button>

                {/* Dropdown menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 z-10 bg-gray-900 divide-y divide-gray-100 rounded-lg shadow-sm w-44 dark:bg-gray-700 dark:divide-gray-600">
                    <div className="px-4 py-3 text-sm text-gray-100 dark:text-white">
                      <div>{getUserInitials() || "User"}</div>
                      
                    </div>
                    <ul
                      className="py-2 text-sm text-gray-100 dark:text-gray-200"
                      dir={isArabic ? "rtl" : "ltr"}
                    >
                      <li>
                        <Link
                          to="/dashboard"
                          className="block px-4 py-2 hover:bg-gray-700 dark:hover:bg-gray-600 dark:hover:text-white"
                          onClick={() => setShowDropdown(false)}
                        >
                          {t("dashboard")}
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/settings"
                          className="block px-4 py-2 hover:bg-gray-700 dark:hover:bg-gray-600 dark:hover:text-white"
                          onClick={() => setShowDropdown(false)}
                        >
                          {t("settings")}
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/earnings"
                          className="block px-4 py-2 hover:bg-gray-700 dark:hover:bg-gray-600 dark:hover:text-white"
                          onClick={() => setShowDropdown(false)}
                        >
                          {t("earnings")}
                        </Link>
                      </li>
                    </ul>
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="cursor-pointer block w-full  px-4 py-2 text-sm text-gray-100 hover:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
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
                className="relative text-2xl font-semibold text-white hover:text-neutral-400 transition-colors duration-300"
              >
                <span
                  className="relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px]
     after:bg-white hover:after:w-full after:transition-all after:duration-300"
                >
                  {t("login")}{" "}
                </span>{" "}
                <span aria-hidden="true">&rarr;</span>
              </Link>
            )}
          </div>
        </nav>
      </header>
    </>
  );
}
