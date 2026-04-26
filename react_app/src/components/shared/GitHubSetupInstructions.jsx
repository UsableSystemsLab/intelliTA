import { useTranslation } from "react-i18next";
import { X, HelpCircle, Info, ExternalLink } from "lucide-react";

const GitHubSetupInstructions = ({ callbackUrl, onClose }) => {
  const { t } = useTranslation();

  const steps = [
    {
      title: t("setupStep1Title"),
      body: t("setupStep1Body"),
      link: { href: "https://github.com/account/organizations/new", label: "github.com/account/organizations/new" },
    },
    {
      title: t("setupStep2Title"),
      body: t("setupStep2Body"),
      link: { href: "https://classroom.github.com/classrooms/new", label: "classroom.github.com/classrooms/new" },
    },
    {
      title: t("setupStep3Title"),
      body: t("setupStep3Body"),
    },
    {
      title: t("setupStep4Title"),
      body: t("setupStep4Body"),
      code: callbackUrl,
    },
    {
      title: t("setupStep5Title"),
      body: t("setupStep5Body"),
    },
    {
      title: t("setupStep6Title"),
      body: t("setupStep6Body"),
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="relative bg-gray-800 p-8 rounded-2xl border border-gray-700 max-w-2xl w-full shadow-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{t("setupGuideTitle")}</h2>
            <p className="text-sm text-gray-400">{t("setupGuideSubtitle")}</p>
          </div>
        </div>

        <ol className="space-y-4">
          {steps.map((step, idx) => (
            <li key={idx} className="flex gap-3 p-4 bg-gray-900/50 border border-gray-700 rounded-xl">
              <span className="shrink-0 w-7 h-7 bg-blue-500/20 border border-blue-500/40 text-blue-300 rounded-full flex items-center justify-center text-sm font-semibold">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white mb-1">{step.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{step.body}</p>
                {step.link && (
                  <a
                    href={step.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-400 hover:text-blue-300"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {step.link.label}
                  </a>
                )}
                {step.code && (
                  <div className="mt-2 flex items-center gap-2">
                    <code className="text-xs bg-gray-900 border border-gray-700 px-2 py-1 rounded break-all">
                      {step.code}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(step.code)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      {t("copy")}
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Info className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-gray-300">{t("setupSecretWarning")}</p>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all duration-300"
        >
          {t("gotIt")}
        </button>
      </div>
    </div>
  );
};

export default GitHubSetupInstructions;
