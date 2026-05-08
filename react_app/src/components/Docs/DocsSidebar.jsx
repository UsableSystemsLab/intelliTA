import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Compass,
  PenTool,
  FlaskConical,
  Github,
  BookOpen,
  Menu,
  X,
} from "lucide-react";

export const DOCS_NAV = [
  {
    label: "Getting Started",
    icon: Compass,
    items: [
      { to: "/docs", label: "Overview" },
    ],
  },
  {
    label: "Authoring Labs",
    icon: PenTool,
    items: [
      { to: "/docs/labs", label: "Lab Guide" },
    ],
  },
  {
    label: "Reference",
    icon: FlaskConical,
    items: [
      { to: "/docs/tests", label: "Tests & Bound Tests" },
    ],
  },
  {
    label: "Integrations",
    icon: Github,
    items: [
      { to: "/docs/github", label: "GitHub & Classroom" },
    ],
  },
];

function CategoryGroup({ group, currentPath, onNavigate }) {
  const Icon = group.icon || BookOpen;
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-200 transition-colors"
      >
        <Icon className="w-3.5 h-3.5 opacity-70" />
        <span className="flex-1 text-left">{group.label}</span>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" />
        )}
      </button>

      {open && (
        <ul className="mt-1 space-y-0.5">
          {group.items.map((item) => {
            const active = currentPath === item.to;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={onNavigate}
                  className={`relative block pl-7 pr-3 py-1.5 text-sm rounded-md transition-colors ${
                    active
                      ? "text-blue-300 bg-blue-500/10 font-medium"
                      : "text-gray-400 hover:text-gray-100 hover:bg-gray-800/40"
                  }`}
                >
                  {active && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-blue-400 rounded-full" />
                  )}
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
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const tree = (
    <nav className="flex flex-col py-6 px-3">
      <div className="px-3 mb-4">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.18em]">
          Documentation
        </p>
        <p className="text-base font-semibold text-white mt-0.5">IntelliTA</p>
      </div>
      <div className="space-y-3">
        {DOCS_NAV.map((group) => (
          <CategoryGroup
            key={group.label}
            group={group}
            currentPath={location.pathname}
            onNavigate={() => setOpen(false)}
          />
        ))}
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile burger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open docs menu"
        className="lg:hidden fixed top-20 left-4 z-40 p-2 rounded-lg bg-gray-800/80 border border-gray-700 text-gray-200 backdrop-blur hover:bg-gray-700 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 w-72 h-screen bg-gray-950 border-r border-gray-800 transform transition-transform duration-300 overflow-y-auto ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-end p-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {tree}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-gray-800 bg-gray-950/40 sticky top-16 self-start max-h-[calc(100vh-4rem)] overflow-y-auto">
        {tree}
      </aside>
    </>
  );
}
