import { useTranslation } from "react-i18next";
import Background from "@/components/Background";
export default function Maincontent() {
  const { t, i18n } = useTranslation();
  //It is okay that isArabic variable to remain unused
  const isArabic = i18n.language === "ar";
  return (
    <>
      <main className="flex relative overflow-hidden bg-transparent min-h-screen w-full ">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        >
          <Background />
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu
               overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        >
          <div
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
            className="relative left-[calc(50%+11rem)] aspect-[1155/678] w-[36.125rem]
                 -translate-x-1/2 -rotate-[30deg]
                 bg-gradient-to-tr from-pink-300 to-indigo-300 opacity-30
                 sm:left-[calc(50%+30rem)] sm:w-[72.1875rem]"
          ></div>
        </div>      
        <div className="flex flex-wrap justify-center gap-8 px-6 mt-10 w-full">
          <div className="bg-slate-800 text-white max-w-sm p-6 border border-slate-700 rounded-xl shadow-md max-h-65">
            <h5 className="mb-3 text-2xl font-semibold tracking-tight">
              CPIT-252 Singleton lab
            </h5>
            <p className="mb-6 text-gray-300">
              The goal of this lab is to teach students how to implement and
              apply the Singleton Design Pattern, one of the most commonly used
              creational patterns in software engineering.
            </p>

            <a
              href="#"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium"
            >
              Start lab now !
            </a>
          </div>
          <div className="bg-slate-800 text-white max-w-sm p-6 border border-slate-700 rounded-xl shadow-md max-h-65">
            <h5 className="mb-3 text-2xl font-semibold tracking-tight">
              CPIT-252 Singleton lab
            </h5>
            <p className="mb-6 text-gray-300">
              The goal of this lab is to teach students how to implement and
              apply the Singleton Design Pattern, one of the most commonly used
              creational patterns in software engineering.
            </p>

            <a
              href="#"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium"
            >
              Start lab now !
            </a>
          </div>
          <div className="bg-slate-800 text-white max-w-sm p-6 border border-slate-700 rounded-xl shadow-md max-h-65">
            <h5 className="mb-3 text-2xl font-semibold tracking-tight">
              CPIT-252 Singleton lab
            </h5>
            <p className="mb-6 text-gray-300">
              The goal of this lab is to teach students how to implement and
              apply the Singleton Design Pattern, one of the most commonly used
              creational patterns in software engineering.
            </p>

            <a
              href="#"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium"
            >
              Start lab now !
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
