import { useTranslation } from "react-i18next";
import Background from "@/components/Background";
export default function HomeFooter() {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";

  return (
    <>
      <footer className="bg-blue-550 shadow-sm border-t border-gray-500 ">
      <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        >
          <Background />
        </div>
        <div className="w-full max-w-screen-xl mx-auto p-4 md:py-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <a
              href="#"
              className="flex items-center mb-4 sm:mb-0 space-x-3 rtl:space-x-reverse"
            >
              <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white pl-2.5">
                IntelliTA
              </span>
            </a>
            <ul className="flex flex-wrap items-center mb-6 text-sm font-medium text-shadow-amber-50 sm:mb-0 dark:text-gray-400">
              <li>
                <a href="#" className="hover:underline me-4 md:me-6">
                  {t("about")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline me-4 md:me-6">
                  {t("gitHub")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline me-4 md:me-6">
                  {t("licensing")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  {t("contact")}
                </a>
              </li>
            </ul>
          </div>
          <hr className="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
          <span className="block text-sm text-shadow-amber-50 sm:text-center dark:text-gray-400" >
            © 2025{" "}
            <a href="#" className="hover:underline">
              <span>IntelliTA&nbsp;</span>
            </a>
            {t("rights")}
          </span>
        </div>
      </footer>
    </>
  );
}
