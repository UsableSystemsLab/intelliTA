import { useTranslation } from "react-i18next";
export default function Sidebar (){
  const { t } = useTranslation();
    return(
        <>
         <aside className=" opacity-95 w-64 h-screen bg-black/62 text-gray-300 p-4 flex flex-col">
          <nav className="flex flex-col gap-1 mt-4">
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#1E293B] text-white"
            >
              <span className="font-medium">{t("courses")}</span>
            </a>

            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1E293B] transition"
            >
              <span>{t("leaderboard")}</span>
            </a>

            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1E293B] transition"
            >
              <span>{t("calendar")}</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1E293B] transition"
            >
              <span>{t("settings")}</span>
            </a>

            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1E293B] transition"
            >
              <span>{t("support")}</span>
            </a>

            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1E293B] transition"
            >
              <span>{t("back")}</span>
            </a>
          </nav>
        </aside>
        </>
    )
}