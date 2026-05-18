import CodeFrame from "@/components/Landing-page/CodeFrame";
import AnimateOnScroll from "@/components/lib/AnimateOnScroll";
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  MoveRight,
  Zap,
  Trophy,
  Brain,
  Globe,
  BookOpen,
  BarChart3,
  Upload,
  MessageSquare,
  Check,
  X,
  Sparkles,
} from "lucide-react";

export default function HomeMain({ user }) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    let cancelled = false;
    const tryScroll = (attempt = 0) => {
      if (cancelled) return;
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (attempt < 20) {
        setTimeout(() => tryScroll(attempt + 1), 100);
      }
    };
    tryScroll();
    return () => {
      cancelled = true;
    };
  }, [location.hash, location.key]);

  const features = [
    { icon: Zap, title: t("InsFeedback"), desc: t("feedbackDesc"), color: "from-blue-500 to-blue-600" },
    { icon: Trophy, title: t("gamification"), desc: t("gamificationDesc"), color: "from-blue-400 to-purple-500" },
    { icon: Brain, title: t("AI-Integration"), desc: t("AI-IntegrationDesc"), color: "from-purple-500 to-purple-600" },
    { icon: Globe, title: t("feature4Title"), desc: t("feature4Desc"), color: "from-blue-400 to-blue-600" },
    { icon: BookOpen, title: t("feature5Title"), desc: t("feature5Desc"), color: "from-blue-500 to-purple-500" },
    { icon: BarChart3, title: t("feature6Title"), desc: t("feature6Desc"), color: "from-purple-400 to-purple-600" },
  ];

  const steps = [
    { icon: BookOpen, label: t("step1Label"), title: t("step1Title"), desc: t("step1Desc"), color: "text-blue-400" },
    { icon: Upload, label: t("step2Label"), title: t("step2Title"), desc: t("step2Desc"), color: "text-blue-400" },
    { icon: MessageSquare, label: t("step3Label"), title: t("step3Title"), desc: t("step3Desc"), color: "text-purple-400" },
  ];

  const comparisonRows = [
    { feature: t("compFeature1"), intelliTA: true, traditional: false },
    { feature: t("compFeature2"), intelliTA: true, traditional: false },
    { feature: t("compFeature3"), intelliTA: true, traditional: false },
    { feature: t("compFeature4"), intelliTA: true, traditional: false },
    { feature: t("compFeature5"), intelliTA: true, traditional: false },
    { feature: t("compFeature6"), intelliTA: true, traditional: false },
  ];

  return (
    <div className="relative overflow-hidden bg-gray-900">
      {/* ══════════════ HERO SECTION ══════════════ */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#ff80b5]/15 rounded-full blur-[80px] animate-float pointer-events-none" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-[#9089fc]/15 rounded-full blur-[80px] animate-float-slow pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left column */}
            <div className="space-y-8">
              {/* Status badge */}
              <AnimateOnScroll className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-700/50 bg-gray-800/50">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-gray-300">{t("heroStatus")}</span>
              </AnimateOnScroll>

              {/* Headline */}
              <AnimateOnScroll delay={150}>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
                  {t("heroTitle")}{" "}
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {t("heroTitleGradient")}
                  </span>
                </h1>
              </AnimateOnScroll>

              {/* Subtitle */}
              <AnimateOnScroll delay={300}>
                <p className="text-lg text-gray-400 max-w-lg leading-relaxed">
                  {t("heroSubtitle")}
                </p>
              </AnimateOnScroll>

              {/* CTA buttons */}
              <AnimateOnScroll delay={400} className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to={user ? "/courses" : "/login"}
                  className="px-8 py-3.5 text-base font-semibold text-white rounded-full
                             bg-gradient-to-r from-blue-600 to-blue-500
                             hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5
                             transition-all duration-200"
                >
                  {t("getStarted")}
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-white rounded-full
                             border border-gray-600/50 hover:bg-gray-800/50 transition-all duration-200"
                >
                  {t("learnMore")}
                  <MoveRight className="w-4 h-4 rtl:rotate-180" />
                </a>
              </AnimateOnScroll>

            </div>

            {/* Right column */}
            <AnimateOnScroll delay={200} className="relative">
              <div className="relative rounded-2xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm overflow-hidden shadow-2xl shadow-blue-500/5">
      
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700/50 bg-gray-800/30">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="ml-3 text-xs text-gray-500 font-medium">{t('intelliTALabEnv')}</span>
                </div>
                <div dir="ltr">
                  <CodeFrame />
                </div>
              </div>
              {/* Decorative glow */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-2xl -z-10" />
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ══════════════ FEATURES SECTION ══════════════ */}
      <section id="features" className="relative py-32 px-6 lg:px-8">
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-blue-500/5 rounded-full blur-[80px] animate-float-slow pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <AnimateOnScroll className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              {t("coreFeatures")}
            </span>
            <h2 className="mt-4 text-4xl sm:text-5xl font-extrabold text-white">
              {t("subFeatures").split("IntelliTA")[0]}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                IntelliTA
              </span>
              {t("subFeatures").split("IntelliTA")[1]}
            </h2>
          </AnimateOnScroll>

          {/* Feature grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <AnimateOnScroll
                key={i}
                delay={i * 100}
                className="group p-6 rounded-2xl bg-gray-800/50 border border-gray-700/50
                           hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10
                           transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4
                                 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════ HOW IT WORKS section ════════ */}
      <section id="how-it-works" className="relative py-32 px-6 lg:px-8">
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-[80px] animate-float pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          <AnimateOnScroll className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              {t("howItWorks")}
            </span>
            <h2 className="mt-4 text-4xl sm:text-5xl font-extrabold text-white">
              {t("howItWorksSubtitle")}
            </h2>
          </AnimateOnScroll>

          <div className="relative grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, i) => (
              <AnimateOnScroll
                key={i}
                delay={i * 150}
                className="relative text-center"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl border border-gray-700/50 bg-gray-800/50 mb-6
                                shadow-lg shadow-blue-500/5">
                  <step.icon className={`w-7 h-7 ${step.color}`} />
                </div>
                <span className={`block text-xs font-bold uppercase tracking-widest ${step.color} mb-2`}>
                  {step.label}
                </span>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ COMPARISON TABLE ══════════════ */}
      <section id="comparison" className="relative py-32 px-6 lg:px-8">
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-[#9089fc]/5 rounded-full blur-[80px] animate-float-slow pointer-events-none" />

        <div className="max-w-4xl mx-auto">
          <AnimateOnScroll className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              {t("comparisonTitle")}
            </span>
            <h2 className="mt-4 text-4xl sm:text-5xl font-extrabold text-white">
              {t("comparisonSubtitle")}
            </h2>
          </AnimateOnScroll>

          <AnimateOnScroll delay={150} className="rounded-2xl border border-gray-700/50 overflow-hidden bg-gray-800/30">
            {/* Table header */}
            <div className="grid grid-cols-3 border-b border-gray-700/50">
              <div className="px-6 py-4 text-sm font-semibold text-gray-400">
                {t("compFeature")}
              </div>
              <div className="px-6 py-4 text-sm font-bold text-white text-center bg-blue-600/10 border-x border-gray-700/50">
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  IntelliTA
                </span>
              </div>
              <div className="px-6 py-4 text-sm font-semibold text-gray-400 text-center">
                {t("compTraditional")}
              </div>
            </div>

            {/* Table rows */}
            {comparisonRows.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-3 ${i < comparisonRows.length - 1 ? "border-b border-gray-700/50" : ""}`}
              >
                <div className="px-6 py-4 text-sm text-gray-300">{row.feature}</div>
                <div className="px-6 py-4 flex justify-center bg-blue-600/10 border-x border-gray-700/50">
                  {row.intelliTA ? (
                    <span className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-400" />
                    </span>
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-gray-700/50 flex items-center justify-center">
                      <X className="w-4 h-4 text-gray-500" />
                    </span>
                  )}
                </div>
                <div className="px-6 py-4 flex justify-center">
                  {row.traditional ? (
                    <span className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-400" />
                    </span>
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-gray-700/50 flex items-center justify-center">
                      <X className="w-4 h-4 text-gray-500" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </AnimateOnScroll>
        </div>
      </section>

      {/* ══════════════ CTA SECTION ══════════════ */}
      <section className="relative py-32 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <AnimateOnScroll className="relative rounded-3xl overflow-hidden border border-gray-700/50 bg-gray-800/50">
            {/* Radial glow from center */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-purple-500/5" />

            <div className="relative flex flex-col items-center text-center px-8 py-16 lg:px-16 lg:py-20">
              {/* Badge pills */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-blue-400 bg-blue-600/10 border border-blue-500/20 rounded-full">
                  <Brain className="w-3.5 h-3.5" />
                  {t('badgeAIPowered')}
                </span>
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-full">
                  <BookOpen className="w-3.5 h-3.5" />
                  {t('badgeInteractiveLabs')}
                </span>
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-full">
                  <Trophy className="w-3.5 h-3.5" />
                  {t('badgeGamified')}
                </span>
              </div>

              {/* Heading */}
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 max-w-2xl">
                {t("ctaTitle")}{" "}
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {t("ctaTitleGradient")}
                </span>
              </h2>

              {/* Subtitle */}
              <p className="text-gray-400 text-lg leading-relaxed max-w-xl mb-10">
                {t("ctaDesc")}
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  to={user ? "/courses" : "/login"}
                  className="px-10 py-3.5 text-base font-semibold text-white rounded-full
                             bg-gradient-to-r from-blue-600 to-blue-500
                             hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5
                             transition-all duration-200"
                >
                  {t("ctaButton")}
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 px-10 py-3.5 text-base font-semibold text-white rounded-full
                             border border-gray-600/50 hover:bg-gray-800/50 transition-all duration-200"
                >
                  {t("learnMore")}
                  <MoveRight className="w-4 h-4 rtl:rotate-180" />
                </a>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </div>
  );
}