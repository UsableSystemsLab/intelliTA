import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import StatusBadge from "@/components/Courses/StatusBadge";
export default function Card({ code, title, description, status }) {
  const { t } = useTranslation();
  // we need to have a second page after 6 courses cards 
  return (
    <div className="group relative bg-gray-800 border border-gray-700 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-500/50 hover:-translate-y-1 flex flex-col h-full min-h-[280px] w-full max-w-sm mx-auto break-words">
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-gray-700/50 rounded-xl group-hover:bg-blue-500/10 transition-colors duration-300">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <StatusBadge status={status} />
        </div>

        <h5 dir="ltr" className="text-xl font-bold text-white mb-2 tracking-tight group-hover:text-blue-400 transition-colors">
          {code}
        </h5>
        <h6 className="text-lg font-medium text-gray-200 mb-3 line-clamp-1">
          {title}
        </h6>
        
        <p className="text-gray-400 text-sm mb-6 line-clamp-3 flex-grow">
          {description}
        </p>

        <Link
          to={`/courses/${code}`}
          className="inline-flex items-center justify-center w-full px-4 py-3 bg-gray-700 hover:bg-blue-600 text-white rounded-xl font-medium transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-500/25"
        >
          <span>{t("goToActivities")}</span>
          <svg className="w-4 h-4 ml-2 rtl:rotate-180 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
