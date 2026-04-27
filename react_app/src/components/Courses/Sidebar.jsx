import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { BookOpen, TrendingUp, Calendar, Settings, LifeBuoy, ChevronsLeft, Menu, X } from "lucide-react";

export default function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path) => {
    if (path === "#") return false;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const menuItems = [
    { path: "/courses", label: "courses", icon: <BookOpen className="w-5 h-5" /> },
    { path: "#", label: "leaderboard", icon: <TrendingUp className="w-5 h-5" /> },
    { path: "#", label: "calendar", icon: <Calendar className="w-5 h-5" /> },
    { path: "/settings", label: "settings", icon: <Settings className="w-5 h-5" /> },
    { path: "#", label: "support", icon: <LifeBuoy className="w-5 h-5" /> },
  ];

  const navContent = (
    <nav className="flex flex-col gap-2">
      {menuItems.map((item) => {
        const active = isActive(item.path);
        return (
          <Link
            key={item.label}
            to={item.path}
            onClick={() => setOpen(false)}
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
  );

  return (
    <>
      {/* Mobile burger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="md:hidden fixed top-20 left-4 z-40 p-2 rounded-lg bg-gray-800/80 border border-gray-700 text-gray-200 backdrop-blur hover:bg-gray-700 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 z-50 w-64 h-screen bg-gray-900 border-r border-gray-800 py-6 px-4 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 min-h-screen bg-gray-900 border-r border-gray-800 flex-col py-6 px-4">
        {navContent}
      </aside>
    </>
  );
}
