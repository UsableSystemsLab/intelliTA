import { Link } from "react-router-dom";
import {
  PenTool,
  FlaskConical,
  Github,
  ArrowRight,
  BookOpen,
  Sparkles,
  Lightbulb,
  Compass,
} from "lucide-react";
import DocsTOC from "./DocsTOC";

const TOC = [
  { id: "intro", label: "Welcome" },
  { id: "categories", label: "Browse by topic" },
  { id: "quickstart", label: "Quick start" },
  { id: "support", label: "Need help?" },
];

const CATEGORIES = [
  {
    to: "/docs/labs",
    icon: PenTool,
    iconColor: "text-emerald-400",
    iconBg: "from-emerald-500/15 to-emerald-700/15",
    border: "border-emerald-500/20 hover:border-emerald-500/40",
    title: "Lab Guide",
    description:
      "Build video-driven coding labs with checkpoints, starter files, tests, and AI hints.",
    tag: "Authoring",
  },
  {
    to: "/docs/tests",
    icon: FlaskConical,
    iconColor: "text-purple-400",
    iconBg: "from-purple-500/15 to-purple-700/15",
    border: "border-purple-500/20 hover:border-purple-500/40",
    title: "Tests & Bound Tests",
    description:
      "File naming, test method conventions, and bound-test format for Python, Java, and JavaScript.",
    tag: "Reference",
  },
  {
    to: "/docs/github",
    icon: Github,
    iconColor: "text-gray-200",
    iconBg: "from-gray-500/15 to-gray-700/15",
    border: "border-gray-500/20 hover:border-gray-400/40",
    title: "GitHub & Classroom",
    description:
      "Connect a course to a GitHub Organization and Classroom: OAuth credentials, classroom linking, per-activity assignments.",
    tag: "Integrations",
  },
];

const QUICK_LINKS = [
  { to: "/docs/labs#creation", label: "How to create a lab" },
  { to: "/docs/tests#examples", label: "Test file examples by language" },
  { to: "/docs/labs#checkpoints", label: "Checkpoint types" },
  { to: "/docs/github#oauth", label: "Setting up GitHub OAuth" },
];

export default function DocsLanding() {
  return (
    <div className="flex">
      <article className="flex-1 min-w-0 px-6 sm:px-10 lg:px-14 py-10 max-w-4xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Docs</span>
        </div>

        {/* Header */}
        <section id="intro" className="scroll-mt-20 mb-14">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-[0.16em]">
              Documentation
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight tracking-tight">
            IntelliTA Docs
          </h1>
          <p className="mt-4 text-lg text-gray-400 leading-relaxed max-w-2xl">
            Reference and guides for building interactive labs, configuring
            tests, and connecting GitHub Classroom. Pick a topic below to get
            started.
          </p>
        </section>

        {/* Categories */}
        <section id="categories" className="scroll-mt-20 mb-14">
          <div className="flex items-center gap-2 mb-6">
            <Compass className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
              Browse by topic
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CATEGORIES.map((c) => (
              <Link
                key={c.to}
                to={c.to}
                className={`group relative rounded-2xl border ${c.border} bg-gradient-to-br ${c.iconBg} p-5 transition-all hover:-translate-y-0.5`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-900/60 border border-gray-700/40 flex items-center justify-center shrink-0">
                    <c.icon className={`w-5 h-5 ${c.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                        {c.tag}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-white">
                      {c.title}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
                      {c.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick start */}
        <section id="quickstart" className="scroll-mt-20 mb-14">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
              Quick start
            </h2>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900/40 divide-y divide-gray-800">
            {QUICK_LINKS.map((q) => (
              <Link
                key={q.to}
                to={q.to}
                className="flex items-center justify-between px-5 py-3.5 group hover:bg-gray-800/40 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
              >
                <span className="text-sm text-gray-300 group-hover:text-white">
                  {q.label}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </section>

        {/* Support */}
        <section id="support" className="scroll-mt-20">
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                New to IntelliTA?
              </h3>
              <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
                Start with the <Link to="/docs/labs" className="text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline">Lab Guide</Link>{" "}
                to understand the lab anatomy, then read the{" "}
                <Link to="/docs/tests" className="text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline">Tests reference</Link>{" "}
                before writing your first checkpoint.
              </p>
            </div>
          </div>
        </section>

        <div className="h-12" />
      </article>

      <DocsTOC items={TOC} />
    </div>
  );
}
