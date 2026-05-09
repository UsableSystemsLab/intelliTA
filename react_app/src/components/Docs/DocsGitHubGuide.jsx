import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DocsTOC from "./DocsTOC";

function CopyableCode({ value }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="flex items-center gap-2 bg-gray-900/80 border border-gray-700 rounded px-3 py-2 font-mono text-xs text-gray-200">
      <code className="flex-1 break-all">{value}</code>
      <button
        type="button"
        onClick={onCopy}
        className="text-gray-400 hover:text-white transition-colors text-xs px-2 py-0.5 border border-gray-700 rounded"
      >
        {copied ? t("docs.copied") : t("docs.copy")}
      </button>
    </div>
  );
}

function ExtLink({ href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 hover:underline text-sm break-all"
    >
      {label}
    </a>
  );
}

function Note({ kind = "info", label, children }) {
  const colors = {
    info: "border-blue-500/40 bg-blue-500/5 text-blue-300",
    warning: "border-amber-500/40 bg-amber-500/5 text-amber-300",
    success: "border-emerald-500/40 bg-emerald-500/5 text-emerald-300",
  };
  return (
    <div
      className={`border-s-4 ${colors[kind]} ps-4 pe-4 py-3 rounded-e text-sm text-gray-300 leading-relaxed`}
    >
      <strong className="block uppercase tracking-wider text-xs mb-1">
        {label}
      </strong>
      {children}
    </div>
  );
}

export default function DocsGitHubGuide() {
  const { t } = useTranslation();

  const callbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin.replace(/:\d+$/, "")}:3000/api/github/callback`
      : "https://your-intellita-host/api/github/callback";

  const homepageUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://your-intellita-host";

  const toc = [
    { id: "overview", label: t("docs.sidebar.overview") },
    { id: "before-you-start", label: t("docs.github.beforeTitle") },
    { id: "org", label: `1. ${t("docs.github.step1Title")}` },
    { id: "classroom", label: `2. ${t("docs.github.step2Title")}` },
    { id: "oauth", label: `3. ${t("docs.github.step3Title")}` },
    { id: "connect", label: `4. ${t("docs.github.step4Title")}` },
    { id: "link-classroom", label: `5. ${t("docs.github.step5Title")}` },
    { id: "per-activity", label: `6. ${t("docs.github.step6Title")}` },
    { id: "students", label: t("docs.github.studentsTitle") },
    { id: "submit-flow", label: t("docs.github.submitTitle") },
    { id: "troubleshooting", label: t("docs.github.troubleshootingTitle") },
  ];

  const oauthFields = [
    { label: t("docs.github.step3AppName"), value: t("docs.github.step3AppNameValue"), copy: false },
    { label: t("docs.github.step3Homepage"), value: homepageUrl, copy: false },
    { label: t("docs.github.step3Callback"), value: callbackUrl, copy: true },
  ];

  const steps = [
    { id: "org", n: 1, title: t("docs.github.step1Title"), body: (
      <>
        <p>{t("docs.github.step1P1")}</p>
        <p><ExtLink href="https://github.com/account/organizations/new" label="github.com/account/organizations/new" /></p>
        <p className="text-gray-400 text-sm">{t("docs.github.step1P2")}</p>
      </>
    ) },
    { id: "classroom", n: 2, title: t("docs.github.step2Title"), body: (
      <>
        <p>{t("docs.github.step2P1")}</p>
        <p><ExtLink href="https://classroom.github.com/classrooms/new" label="classroom.github.com/classrooms/new" /></p>
      </>
    ) },
    { id: "oauth", n: 3, title: t("docs.github.step3Title"), body: (
      <>
        <p>{t("docs.github.step3P1")}</p>
        <table className="w-full text-sm border border-gray-800 mt-2">
          <tbody className="divide-y divide-gray-800">
            {oauthFields.map((f) => (
              <tr key={f.label}>
                <td className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider w-1/3 align-top">
                  {f.label}
                </td>
                <td className="px-4 py-2 text-gray-200">
                  {f.copy ? <CopyableCode value={f.value} /> : <span className="font-mono text-xs">{f.value}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3">{t("docs.github.step3P2")}</p>
      </>
    ) },
    { id: "connect", n: 4, title: t("docs.github.step4Title"), body: (
      <>
        <p>{t("docs.github.step4P1")}</p>
        <p>{t("docs.github.step4P2")}</p>
        <Note kind="success" label={t("docs.github.section")}>{t("docs.github.step4Note")}</Note>
      </>
    ) },
    { id: "link-classroom", n: 5, title: t("docs.github.step5Title"), body: (
      <>
        <p>{t("docs.github.step5P1")}</p>
        <Note kind="info" label="Note">{t("docs.github.step5Note")}</Note>
      </>
    ) },
    { id: "per-activity", n: 6, title: t("docs.github.step6Title"), body: (
      <>
        <p>{t("docs.github.step6P1")}</p>
        <p>{t("docs.github.step6P2")}</p>
        <Note kind="info" label="Note">{t("docs.github.step6Note")}</Note>
      </>
    ) },
  ];

  const submitSteps = [
    { t: t("docs.github.submitS1T"), b: t("docs.github.submitS1B") },
    { t: t("docs.github.submitS2T"), b: t("docs.github.submitS2B") },
    { t: t("docs.github.submitS3T"), b: t("docs.github.submitS3B") },
    { t: t("docs.github.submitS4T"), b: t("docs.github.submitS4B") },
  ];

  const faqs = [
    { q: t("docs.github.tQ1"), a: t("docs.github.tA1") },
    { q: t("docs.github.tQ2"), a: t("docs.github.tA2") },
    { q: t("docs.github.tQ3"), a: t("docs.github.tA3") },
    { q: t("docs.github.tQ4"), a: t("docs.github.tA4") },
    { q: t("docs.github.tQ5"), a: t("docs.github.tA5") },
  ];

  return (
    <div className="flex">
      <article className="flex-1 min-w-0 px-6 sm:px-10 lg:px-14 py-10 max-w-4xl">
        <nav className="text-xs text-gray-500 mb-6" aria-label="Breadcrumb">
          <Link to="/docs" className="hover:text-gray-300 transition-colors">
            {t("docs.breadcrumb")}
          </Link>
          <span className="mx-2">/</span>
          <span>{t("docs.github.section")}</span>
          <span className="mx-2">/</span>
          <span className="text-gray-300">{t("docs.github.title")}</span>
        </nav>

        <section id="overview" className="scroll-mt-20 mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            {t("docs.github.title")}
          </h1>
          <p className="mt-4 text-base text-gray-300 leading-relaxed max-w-3xl">
            {t("docs.github.intro")}
          </p>
          <div className="mt-5">
            <Note kind="info" label="Note">{t("docs.github.overviewBody")}</Note>
          </div>
        </section>

        <section id="before-you-start" className="scroll-mt-20 mb-10">
          <h2 className="text-2xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">
            {t("docs.github.beforeTitle")}
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed mb-3">
            {t("docs.github.beforeBody")}
          </p>
          <ol className="list-decimal ms-6 space-y-2 text-sm text-gray-300">
            <li>{t("docs.github.beforeB1")}</li>
            <li>{t("docs.github.beforeB2")}</li>
            <li>{t("docs.github.beforeB3")}</li>
          </ol>
          <div className="mt-5">
            <Note kind="warning" label="Caution">{t("docs.github.secretCaution")}</Note>
          </div>
        </section>

        {steps.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-20 mb-10">
            <h2 className="text-2xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">
              {t("docs.github.stepLabel")} {s.n}: {s.title}
            </h2>
            <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
              {s.body}
            </div>
          </section>
        ))}

        <section id="students" className="scroll-mt-20 mb-10">
          <h2 className="text-2xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">
            {t("docs.github.studentsTitle")}
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed mb-4">
            {t("docs.github.studentsP1")}
          </p>
          <Note kind="warning" label="Caution">{t("docs.github.studentsCaution")}</Note>
        </section>

        <section id="submit-flow" className="scroll-mt-20 mb-10">
          <h2 className="text-2xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">
            {t("docs.github.submitTitle")}
          </h2>
          <ol className="list-decimal ms-6 space-y-3 text-sm text-gray-300">
            {submitSteps.map((s, i) => (
              <li key={i}>
                <p className="font-semibold text-white">{s.t}</p>
                <p className="text-gray-400 mt-1 leading-relaxed">{s.b}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="troubleshooting" className="scroll-mt-20 mb-10">
          <h2 className="text-2xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">
            {t("docs.github.troubleshootingTitle")}
          </h2>
          <div className="space-y-2">
            {faqs.map((item, i) => (
              <details
                key={i}
                className="border border-gray-800 rounded open:bg-gray-900/40"
              >
                <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-200 hover:bg-gray-800/30 rounded">
                  {item.q}
                </summary>
                <p className="px-4 pb-3 text-sm text-gray-400 leading-relaxed border-t border-gray-800/60 pt-3">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <p className="text-sm text-gray-300 leading-relaxed mt-8">
          {t("docs.github.nextBefore")}
          <Link to="/docs/labs" className="text-blue-400 hover:underline">
            {t("docs.landing.cat1Title")}
          </Link>
          {t("docs.github.nextAfter")}
        </p>

        <div className="h-12" />
      </article>

      <DocsTOC items={toc} />
    </div>
  );
}
