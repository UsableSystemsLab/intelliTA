import { useTranslation } from "react-i18next";
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
          <div
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem]
                 -translate-x-1/2 rotate-[30deg]
                 bg-gradient-to-tr from-pink-300 to-indigo-300 opacity-30
                 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          ></div>
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
