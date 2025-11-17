import { useTranslation } from "react-i18next";
import StatusBadge from "@/components/Courses/StatusBadge";
export default function Card({ title, description, status }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="relative bg-slate-800 text-white max-w-sm p-6 border border-slate-700 rounded-xl shadow-md max-h-70">
        <h5 dir="ltr" className="mb-3 text-2xl font-semibold tracking-tight">{title}</h5>
        <p className="mb-6 text-gray-300">{description}</p>

        <div className="flex justify-between items-center">
           <a
          href="#"
          className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium"
        >
          {t("startNow")}
        </a>
           <StatusBadge status={status} />
        </div>
       
      </div>
    </>
  );
}
