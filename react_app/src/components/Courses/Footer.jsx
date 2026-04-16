import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Twitter, Github } from "lucide-react";

export default function HomeFooter() {
  const { t } = useTranslation();

  return (
    <>
      <footer className="bg-gray-900 border-t border-gray-800 relative z-10 overflow-hidden">

        <div className="w-full max-w-screen-xl mx-auto p-8 relative z-20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <span className="self-center text-2xl font-bold whitespace-nowrap text-white tracking-tight">
                IntelliTA
              </span>
            </div>

            {/* Navigation Links */}
            <ul className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm font-medium text-gray-400">
              <li>
                <a href="#" className="hover:text-blue-400 transition-colors duration-200">
                  {t("about")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400 transition-colors duration-200">
                  {t("gitHub")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400 transition-colors duration-200">
                  {t("licensing")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400 transition-colors duration-200">
                  {t("contact")}
                </a>
              </li>
            </ul>
          </div>

          <div className="my-8 border-t border-gray-800" />

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <span className="text-center md:text-left">
              © {new Date().getFullYear()} <span className="text-gray-300 font-medium">IntelliTA</span>. {t("rights")}
            </span>
            
            {/* Social Icons */}
            <div className="flex gap-4">
              <a href="#" className="text-gray-500 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors">
                <span className="sr-only">GitHub</span>
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}