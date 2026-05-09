import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DocsTOC from "./DocsTOC";

export default function DocsLanding() {
  const { t } = useTranslation();

  const toc = [
    { id: "intro", label: t("docs.landing.welcome") },
    { id: "categories", label: t("docs.landing.browseByTopic") },
    { id: "quickstart", label: t("docs.landing.quickStart") },
    { id: "support", label: t("docs.landing.needHelp") },
  ];

  const categories = [
    { to: "/docs/labs", title: t("docs.landing.cat1Title"), desc: t("docs.landing.cat1Desc") },
    { to: "/docs/tests", title: t("docs.landing.cat2Title"), desc: t("docs.landing.cat2Desc") },
    { to: "/docs/github", title: t("docs.landing.cat3Title"), desc: t("docs.landing.cat3Desc") },
  ];

  const quickLinks = [
    { to: "/docs/labs#creation", label: t("docs.landing.quick1") },
    { to: "/docs/tests#examples", label: t("docs.landing.quick2") },
    { to: "/docs/labs#checkpoints", label: t("docs.landing.quick3") },
    { to: "/docs/github#oauth", label: t("docs.landing.quick4") },
  ];

  return (
    <div className="flex">
      <article className="flex-1 min-w-0 px-6 sm:px-10 lg:px-14 py-10 max-w-4xl">
        <div className="text-xs text-gray-500 mb-6">{t("docs.breadcrumb")}</div>

        <section id="intro" className="scroll-mt-20 mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            {t("docs.landing.title")}
          </h1>
          <p className="mt-4 text-base text-gray-300 leading-relaxed max-w-3xl">
            {t("docs.landing.intro")}
          </p>
        </section>

        <section id="categories" className="scroll-mt-20 mb-12">
          <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-800 pb-2">
            {t("docs.landing.browseByTopic")}
          </h2>
          <ul className="space-y-4">
            {categories.map((c) => (
              <li key={c.to}>
                <Link to={c.to} className="text-blue-400 hover:underline text-base font-medium">
                  {c.title}
                </Link>
                <p className="text-sm text-gray-400 mt-1 leading-relaxed">{c.desc}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="quickstart" className="scroll-mt-20 mb-12">
          <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-800 pb-2">
            {t("docs.landing.quickStart")}
          </h2>
          <ul className="list-disc ms-6 space-y-2 text-sm">
            {quickLinks.map((q) => (
              <li key={q.to}>
                <Link to={q.to} className="text-blue-400 hover:underline">
                  {q.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section id="support" className="scroll-mt-20 mb-12">
          <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-800 pb-2">
            {t("docs.landing.needHelp")}
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            {t("docs.landing.newToTitle")}{" "}
            {t("docs.landing.newToBefore")}
            <Link to="/docs/labs" className="text-blue-400 hover:underline">
              {t("docs.landing.cat1Title")}
            </Link>
            {t("docs.landing.newToBetween")}
            <Link to="/docs/tests" className="text-blue-400 hover:underline">
              {t("docs.landing.cat2Title")}
            </Link>
            {t("docs.landing.newToAfter")}
          </p>
        </section>

        <div className="h-12" />
      </article>

      <DocsTOC items={toc} />
    </div>
  );
}
