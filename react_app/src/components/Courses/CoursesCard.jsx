import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import StatusBadge from "@/components/Courses/StatusBadge";
export default function Card({ code, title, description, status }) {
  const { t } = useTranslation();
  return (
    <>
      <div
        className="relative bg-slate-800 text-white max-w-sm w-full p-6 border border-slate-700 rounded-xl shadow-md 
     min-h-[260px] flex flex-col justify-between"
      >
        <h5 dir="ltr" className="mb-3 text-2xl font-semibold tracking-tight">
          {code}&nbsp;{title}
        </h5>
        <p className="mb-6 text-gray-300">{description}</p>

        <div className="flex justify-between items-center mt-auto">
          <Link
            to={`/courses/${code}`}
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium"
          >
            {t("goToActivities")}
          </Link>
          <StatusBadge status={status} />
        </div>
      </div>
    </>
  );
}
