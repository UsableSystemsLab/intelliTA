import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { BookOpen, TrendingUp, Calendar, Settings, LifeBuoy, ChevronsLeft } from "lucide-react";

export default function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();

  const isActive = (path) => {
    if (path === "#") return false;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const menuItems = [
    { 
      path: "/courses", 
      label: "courses", 
      icon: <BookOpen className="w-5 h-5" />
    },
    { 
      path: "#", 
      label: "leaderboard", 
      icon: <TrendingUp className="w-5 h-5" />
    },
    { 
      path: "#", 
      label: "calendar", 
      icon: <Calendar className="w-5 h-5" />
    },
    { 
      path: "/settings", 
      label: "settings", 
      icon: <Settings className="w-5 h-5" />
    },
    { 
      path: "#", 
      label: "support", 
      icon: <LifeBuoy className="w-5 h-5" />
    },
  ];

  return (
    <aside className="w-64 min-h-screen bg-gray-900 border-r border-gray-800 flex flex-col py-6 px-4">
      <nav className="flex flex-col gap-2">
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                active
                  ? "bg-blue-600/10 text-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.1)]"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
              }`}
            >
              <span className={`transition-colors duration-200 ${active ? "text-blue-500" : "text-gray-500 group-hover:text-gray-300"}`}>
                {item.icon}
              </span>
              <span className="font-medium">{t(item.label)}</span>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
              )}
            </Link>
          );
        })}

        <div className="my-4 border-t border-gray-800/50" />

        <a
          href="#"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-all duration-200 group"
        >
          <span className="text-gray-500 group-hover:text-gray-300">
            <ChevronsLeft className="w-5 h-5" />
          </span>
          <span className="font-medium">{t("back")}</span>
        </a>
      </nav>
    </aside>
  );
}