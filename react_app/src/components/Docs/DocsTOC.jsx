import { useEffect, useState } from "react";


export default function DocsTOC({ items = [] }) {
  const [activeId, setActiveId] = useState(items[0]?.id || null);

  useEffect(() => {
    if (!items.length) return;

    const elements = items
      .map((i) => document.getElementById(i.id))
      .filter(Boolean);

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: [0, 1] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  if (!items.length) return null;

  return (
    <aside className="hidden xl:block w-56 shrink-0 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.18em] mb-3 px-3">
        On this page
      </p>
      <ul className="space-y-0.5 border-l border-gray-800">
        {items.map((item) => {
          const active = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`relative block pl-4 pr-3 py-1.5 text-xs leading-relaxed transition-colors ${
                  active
                    ? "text-blue-300 font-medium"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-400" />
                )}
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
