import LogoLoop from "@/components/lib/LogoLoop";
import { imageLogos } from "@/utils/imageLogos";
import CodeFrame from "@/components/CodeFrame";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function HomeMain() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  return (
    <>
      {/* HERO SECTION */}
      <section dir={isArabic ? "rtl" : "ltr"}>
        <div className="isolate px-6 pt-0 lg:px-8 overflow-hidden">
          {" "}
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
                     -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5]
                     to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)]
                     sm:w-[72.1875rem]"
            ></div>
          </div>
          <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-34">
            <div className="text-center">
              <h1 className="text-balance text-5xl font-semibold tracking-tight text-white sm:text-7xl">
                {t("welcomeMsg")}
              </h1>
              <p className="mt-8 text-pretty text-lg font-medium text-gray-400 sm:text-xl/8">
                {t("subWelcome")}
              </p>
              <br />

              <div dir="ltr">
                <CodeFrame />
              </div>

              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  to="/login"
                  className="rounded-md bg-indigo-500 px-3.5 py-2.5 text-2xl font-semibold
                         text-white shadow-sm hover:bg-indigo-400 focus-visible:outline
                         focus-visible:outline-2 focus-visible:outline-offset-2
                         focus-visible:outline-indigo-500"
                >
                  {t("getStarted")}
                </Link>
                <a
                  href="#"
                  className="relative text-2xl font-semibold text-white hover:text-neutral-400 transition-colors duration-300"
                >
                  <span
                    className="relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px]
               after:bg-white hover:after:w-full after:transition-all after:duration-300"
                  >
                    {t("learnMore")}{" "}
                  </span>{" "}
                  <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-[calc(100%-13rem)] z-0 transform-gpu
             overflow-hidden blur-3xl sm:top-[calc(100%-30rem)] pointer-events-none"
          >
            <div
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
              className="relative left-[calc(50%+11rem)] aspect-[1155/678]
               w-[36.125rem] -translate-x-1/2 -rotate-[30deg]
               bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30
               sm:left-[calc(50%+30rem)] sm:w-[72.1875rem]"
            ></div>
          </div>
        </div>
        {/* CARD SECTION */}
        {/* Ask if we maybe need to change Background color */}
        <section className="py-20 bg-gray-900 text-white">
          {" "}
          <div className="text-center mb-12">
            <h2 className="text-5xl font-semibold tracking-tight">
              {t("coreFeatures")}
            </h2>
            <p className="mt-8 text-pretty text-lg text-gray-400">
              {t("subFeatures")}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 px-6">
            {/* CARD 1 */}
            <div className="max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <a href="#">
                <img
                  className="rounded-t-lg w-full h-66 object-cover"
                  src="https://intellita-media-storage.s3.us-east-1.amazonaws.com/images/InstantFeedback.jpg"
                  alt="Instant feedback image"
                />
              </a>
              <div className="p-5">
                <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {t("InsFeedback")}
                </h5>

                <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                  {t("feedbackDesc")}{" "}
                </p>
                <a
                  href="#"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  {t("readMore")}
                  <svg
                    className="rtl:rotate-180 w-3.5 h-3.5 ms-2"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 10"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M1 5h12m0 0L9 1m4 4L9 9"
                    />
                  </svg>
                </a>
              </div>
            </div>

            {/* CARD 2 */}
            <div className="max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <a href="#">
                <img
                  className="rounded-t-lg w-full h-66 object-cover"
                  src="https://intellita-media-storage.s3.us-east-1.amazonaws.com/images/Leaderboard.jpg"
                  alt="Leaderboard image"
                />
              </a>
              <div className="p-5">
                <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {t("gamification")}
                </h5>

                <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                  {t("gamificationDesc")}
                </p>
                <a
                  href="#"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  {t("readMore")}
                  <svg
                    className="rtl:rotate-180 w-3.5 h-3.5 ms-2"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 10"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M1 5h12m0 0L9 1m4 4L9 9"
                    />
                  </svg>
                </a>
              </div>
            </div>

            {/* CARD 3 */}
            <div className="max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <a href="#">
                <img
                  className="rounded-t-lg w-full h-66 object-cover"
                  src="https://intellita-media-storage.s3.us-east-1.amazonaws.com/images/CourseLabMaker.jpg"
                  alt="Course lab maker image"
                />
              </a>
              <div className="p-5">
                <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {t("AI-Integration")}
                </h5>

                <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                  {t("AI-IntegrationDesc")}
                </p>
                <a
                  href="#"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  {t("readMore")}
                  <svg
                    className="rtl:rotate-180 w-3.5 h-3.5 ms-2"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 10"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M1 5h12m0 0L9 1m4 4L9 9"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gray-900 text-white">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-semibold tracking-tight">
              {t("courses")}
            </h2>
            <p className="mt-8 text-pretty text-lg text-gray-400">
              {t("subCourses")}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8 px-6">
            {/* CARD 1 */}
            <div className="max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <a href="#">
                <img
                  className="rounded-t-lg w-full h-66 object-cover"
                  src="https://intellita-media-storage.s3.us-east-1.amazonaws.com/images/CPCS-203.jpeg"
                  alt="CPCS-203 image"
                />
              </a>
              <div className="p-5">
                <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  CPCS-203
                </h5>

                <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                  {t("203Desc")}{" "}
                </p>
                <a
                  href="#"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  {t("readMore")}
                  <svg
                    className="rtl:rotate-180 w-3.5 h-3.5 ms-2"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 10"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M1 5h12m0 0L9 1m4 4L9 9"
                    />
                  </svg>
                </a>
              </div>
            </div>

            {/* CARD 2 */}
            <div className="max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <a href="#">
                <img
                  className="rounded-t-lg w-full h-66 object-cover"
                  src="https://intellita-media-storage.s3.us-east-1.amazonaws.com/images/CPCS-204.jpg"
                  alt="CPCS 204 image"
                />
              </a>
              <div className="p-5">
                <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  CPCS-204
                </h5>

                <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                  {t("204Desc")}
                </p>
                <a
                  href="#"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  {t("readMore")}
                  <svg
                    className="rtl:rotate-180 w-3.5 h-3.5 ms-2"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 10"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M1 5h12m0 0L9 1m4 4L9 9"
                    />
                  </svg>
                </a>
              </div>
            </div>

            {/* CARD 3 */}
            <div className="max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <a href="#">
                <img
                  className="rounded-t-lg w-full h-66 object-cover"
                  src="https://intellita-media-storage.s3.us-east-1.amazonaws.com/images/React-Php.png"
                  alt="React and Php image"
                />
              </a>
              <div className="p-5">
                <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  CPIT-405
                </h5>

                <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                  {t("405Desc")}
                </p>
                <a
                  href="#"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  {t("readMore")}
                  <svg
                    className="rtl:rotate-180 w-3.5 h-3.5 ms-2"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 10"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M1 5h12m0 0L9 1m4 4L9 9"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <a
              href="#"
              className="inline-flex items-center pt-10.5 text-2xl font-semibold text-white hover:text-neutral-400 transition-colors duration-300"
            >
              <span
                className="relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px]
         after:bg-white hover:after:w-full after:transition-all after:duration-300"
              >
                {t("seeAll")}
              </span>
              <span aria-hidden="true" className="ml-2">
                →
              </span>
            </a>
          </div>
        </section>
        <section className="relative isolate px-6 py-30 lg:px-8 overflow-hidden bg-gray-900">
          {/* Top gradient background */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden sm:-top-80"
          >
            <div
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
            ></div>
          </div>

          {/* Main content */}
          <div className="text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-white mb-12 animate-bounce">
              {t("progLangs")}
            </h2>
            {/* Made new div to contain the logo loop and make the transition works */}
            <div dir="ltr">
              <LogoLoop
                className="loop-logos"
                logos={imageLogos}
                speed={120}
                direction="left"
                logoHeight={48}
                gap={40}
                pauseOnHover
                scaleOnHover
                fadeOut
                fadeOutColor="#111827"
                ariaLabel="Technology partners"
              />
            </div>
          </div>

          {/* Bottom gradient background */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu sm:top-[calc(100%-30rem)]"
          >
            <div
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
            ></div>
          </div>
        </section>
      </section>
    </>
  );
}
