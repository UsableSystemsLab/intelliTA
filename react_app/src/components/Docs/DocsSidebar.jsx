import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

function CategoryGroup({ label, items, currentPath, onNavigate }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-200 transition-colors"
      >
        <span>{label}</span>
        <span className="text-xs text-gray-500">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <ul className="mt-1 space-y-0.5">
          {items.map((item) => {
            const active = currentPath === item.to;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={onNavigate}
                  className={`block ps-5 pe-3 py-1.5 text-sm border-s-2 transition-colors ${
                    active
                      ? "text-blue-300 border-blue-400 bg-blue-500/5 font-medium"
                      : "text-gray-400 border-transparent hover:text-gray-100 hover:bg-gray-800/40"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function DocsSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const groups = [
    {
      label: t("docs.sidebar.gettingStarted"),
      items: [{ to: "/docs", label: t("docs.sidebar.overview") }],
    },
    {
      label: t("docs.sidebar.authoringLabs"),
      items: [{ to: "/docs/labs", label: t("docs.sidebar.labGuide") }],
    },
    {
      label: t("docs.sidebar.reference"),
      items: [{ to: "/docs/tests", label: t("docs.sidebar.testsAndBoundTests") }],
    },
    {
      label: t("docs.sidebar.integrations"),
      items: [{ to: "/docs/github", label: t("docs.sidebar.githubAndClassroom") }],
    },
  ];

  const tree = (
    <nav className="flex flex-col py-6 px-3">
      <div className="px-3 mb-5">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.18em]">
          {t("docs.sidebar.title")}
        </p>
        <p className="text-base font-semibold text-white mt-0.5">
          {t("docs.brand")}
        </p>
      </div>
      <div>
        {groups.map((group) => (
          <CategoryGroup
            key={group.label}
            label={group.label}
            items={group.items}
            currentPath={location.pathname}
            onNavigate={() => setOpen(false)}
          />
        ))}
      </div>
    </nav>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("docs.sidebar.openMenu")}
        className="lg:hidden fixed top-20 left-4 z-40 px-3 py-1.5 rounded bg-gray-800/80 border border-gray-700 text-gray-200 text-xs backdrop-blur hover:bg-gray-700 transition-colors"
      >
        {t("docs.sidebar.title")}
      </button>

      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 w-72 h-screen bg-gray-950 border-r border-gray-800 transform transition-transform duration-300 overflow-y-auto ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-end p-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t("docs.sidebar.closeMenu")}
            className="px-2 py-1 text-sm rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>
        {tree}
      </aside>

      <aside className="hidden lg:block w-64 shrink-0 border-r border-gray-800 bg-gray-950/40 sticky top-16 self-start max-h-[calc(100vh-4rem)] overflow-y-auto">
        {tree}
      </aside>
    </>
  );
}
