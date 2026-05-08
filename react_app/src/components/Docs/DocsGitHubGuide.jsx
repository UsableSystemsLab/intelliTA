import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Github,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  Building2,
  School,
  KeyRound,
  Plug,
  ListChecks,
  Users,
  Send,
  AlertTriangle,
  ShieldCheck,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import DocsTOC from "./DocsTOC";

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "before-you-start", label: "Before you start" },
  { id: "org", label: "1. Create an Organization" },
  { id: "classroom", label: "2. Create a Classroom" },
  { id: "oauth", label: "3. Register an OAuth App" },
  { id: "connect", label: "4. Connect to your course" },
  { id: "link-classroom", label: "5. Link the classroom" },
  { id: "per-activity", label: "6. Link assignments" },
  { id: "students", label: "Student verification" },
  { id: "submit-flow", label: "How submission works" },
  { id: "troubleshooting", label: "Troubleshooting" },
];

function CopyableCode({ value }) {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="flex items-center gap-2 bg-gray-900/80 border border-gray-700 rounded-lg px-3 py-2 font-mono text-xs text-gray-200">
      <code className="flex-1 break-all">{value}</code>
      <button
        type="button"
        onClick={onCopy}
        className="text-gray-500 hover:text-white transition-colors"
        aria-label="Copy"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-400" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}

function ExternalLinkRow({ href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
    >
      <ExternalLink className="w-3.5 h-3.5" />
      {label}
    </a>
  );
}

function StepCard({ number, icon: Icon, title, children }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-700/20 border border-blue-500/30 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-blue-300" />
        </div>
        <div>
          <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-[0.16em]">
            Step {number}
          </span>
          <h3 className="text-lg font-semibold text-white mt-0.5">{title}</h3>
        </div>
      </div>
      <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function Note({ kind = "info", children }) {
  const styles = {
    info: { bg: "bg-blue-500/5", border: "border-blue-500/20", icon: Lightbulb, color: "text-blue-400" },
    warning: { bg: "bg-amber-500/5", border: "border-amber-500/20", icon: AlertTriangle, color: "text-amber-400" },
    success: { bg: "bg-emerald-500/5", border: "border-emerald-500/20", icon: ShieldCheck, color: "text-emerald-400" },
  };
  const s = styles[kind];
  return (
    <div className={`rounded-xl border ${s.border} ${s.bg} p-4 flex items-start gap-3`}>
      <s.icon className={`w-4 h-4 ${s.color} shrink-0 mt-0.5`} />
      <div className="text-sm text-gray-300 leading-relaxed">{children}</div>
    </div>
  );
}

export default function DocsGitHubGuide() {
  const callbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin.replace(/:\d+$/, "")}:3000/api/github/callback`
      : "https://your-intellita-host/api/github/callback";

  return (
    <div className="flex">
      <article className="flex-1 min-w-0 px-6 sm:px-10 lg:px-14 py-10 max-w-4xl">
        {/* Breadcrumbs */}
        <nav
          className="flex items-center gap-1.5 text-xs text-gray-500 mb-6"
          aria-label="Breadcrumb"
        >
          <Link to="/docs" className="hover:text-gray-300 transition-colors">
            Docs
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span>Integrations</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-300">GitHub & Classroom</span>
        </nav>

        {/* Header */}
        <section id="overview" className="scroll-mt-20 mb-12">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.16em]">
              Integrations
            </span>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-700 flex items-center justify-center shadow-lg">
              <Github className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                GitHub & Classroom
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Connect a course to GitHub Classroom so student submissions
                push to per-student repos automatically.
              </p>
            </div>
          </div>

          <Note kind="info">
            This is a <strong>per-course</strong> setup. Each course you teach
            in IntelliTA can have its own GitHub Classroom — or you can reuse
            one Classroom across courses if your org is structured that way.
            You'll need <strong>instructor access</strong> to a GitHub
            Organization.
          </Note>
        </section>

        {/* Before you start */}
        <section id="before-you-start" className="scroll-mt-20 mb-12">
          <h2 className="text-xl font-bold text-white mb-4">Before you start</h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            You'll need three things, all free:
          </p>
          <ul className="space-y-2.5 text-sm text-gray-300">
            {[
              "A GitHub Organization you administer (or permission to create one).",
              "GitHub Classroom enabled for that organization.",
              "An OAuth App registered in the org — IntelliTA uses this to act on your behalf.",
            ].map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[11px] font-semibold flex items-center justify-center mt-0.5 shrink-0">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <Note kind="warning">
              The <strong>Client Secret</strong> is shown only once when you
              create the OAuth App. Save it before you leave the page —
              IntelliTA encrypts it server-side, but if you lose it you'll
              need to regenerate.
            </Note>
          </div>
        </section>

        {/* Step 1 — Org */}
        <section id="org" className="scroll-mt-20 mb-8">
          <StepCard number={1} icon={Building2} title="Create a GitHub Organization">
            <p>
              An Organization is the umbrella that owns your classroom and
              all student repositories. If you already have one for your
              department, skip this step.
            </p>
            <ExternalLinkRow
              href="https://github.com/account/organizations/new"
              label="github.com/account/organizations/new"
            />
            <p className="text-gray-400 text-xs">
              The free plan is enough — Classroom only needs unlimited
              private repos for education, which GitHub grants automatically
              for verified educators.
            </p>
          </StepCard>
        </section>

        {/* Step 2 — Classroom */}
        <section id="classroom" className="scroll-mt-20 mb-8">
          <StepCard number={2} icon={School} title="Create a GitHub Classroom">
            <p>
              Pick the organization from step 1, give the classroom a name
              (it'll appear in IntelliTA's classroom picker), and skip the
              roster step — IntelliTA handles enrollment.
            </p>
            <ExternalLinkRow
              href="https://classroom.github.com/classrooms/new"
              label="classroom.github.com/classrooms/new"
            />
          </StepCard>
        </section>

        {/* Step 3 — OAuth App */}
        <section id="oauth" className="scroll-mt-20 mb-8">
          <StepCard number={3} icon={KeyRound} title="Register an OAuth App in your Organization">
            <p>
              In your org's settings, open{" "}
              <strong className="text-white">
                Developer settings → OAuth Apps → New OAuth App
              </strong>
              . Fill in:
            </p>

            <div className="rounded-xl border border-gray-700/60 bg-gray-900/40 divide-y divide-gray-800 mt-2">
              {[
                { label: "Application name", value: "IntelliTA (or anything)" },
                {
                  label: "Homepage URL",
                  value:
                    typeof window !== "undefined"
                      ? window.location.origin
                      : "https://your-intellita-host",
                },
                { label: "Authorization callback URL", value: callbackUrl, copy: true },
              ].map((row) => (
                <div
                  key={row.label}
                  className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider shrink-0">
                    {row.label}
                  </span>
                  {row.copy ? (
                    <div className="flex-1 sm:max-w-md">
                      <CopyableCode value={row.value} />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-200 font-mono">
                      {row.value}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <p className="mt-3">
              After saving, GitHub shows a{" "}
              <strong className="text-white">Client ID</strong>. Click{" "}
              <strong className="text-white">Generate a new client secret</strong>{" "}
              to get the matching{" "}
              <strong className="text-white">Client Secret</strong>. You'll
              paste both into IntelliTA next.
            </p>
          </StepCard>
        </section>

        {/* Step 4 — Connect */}
        <section id="connect" className="scroll-mt-20 mb-8">
          <StepCard number={4} icon={Plug} title="Connect IntelliTA to the Organization">
            <p>
              Open the course in IntelliTA, click the{" "}
              <strong className="text-white">GitHub</strong> button on the
              course header, paste the Client ID and Client Secret, and save.
            </p>
            <p>
              Then click{" "}
              <strong className="text-white">Sign in with GitHub</strong>.
              You'll be redirected to GitHub, asked to authorize the OAuth
              App, and bounced back. The course now holds an encrypted
              instructor token tied to the organization.
            </p>
            <Note kind="success">
              The token is stored encrypted in IntelliTA's database (AES-GCM).
              It's only used server-side for repo creation and student
              submissions — never sent to the browser.
            </Note>
          </StepCard>
        </section>

        {/* Step 5 — Link classroom */}
        <section id="link-classroom" className="scroll-mt-20 mb-8">
          <StepCard number={5} icon={School} title="Link a Classroom to the course">
            <p>
              After connecting, IntelliTA fetches the list of classrooms your
              account can administer. Pick the one that matches this course.
              The classroom name and organization are stored on the course's
              GitHub connection.
            </p>
            <Note kind="info">
              You can change the linked classroom later, but existing
              activities keep their previously-linked assignments — re-link
              them in the activity editor if you point to a new classroom.
            </Note>
          </StepCard>
        </section>

        {/* Step 6 — Per-activity */}
        <section id="per-activity" className="scroll-mt-20 mb-8">
          <StepCard number={6} icon={ListChecks} title="Link a Classroom assignment to each activity">
            <p>
              In the activity editor, open the{" "}
              <strong className="text-white">GitHub</strong> tab and pick the
              Classroom assignment that backs this activity. The assignment's{" "}
              <strong className="text-white">starter code repository</strong>{" "}
              should already contain the activity's starter files (IntelliTA
              creates a starter repo when you publish, or you can point at an
              existing one).
            </p>
            <p>
              Once linked, the activity stores the assignment ID and an
              invite link. Students see an{" "}
              <strong className="text-white">Open assignment on GitHub</strong>{" "}
              button on the activity page.
            </p>
            <Note kind="info">
              IntelliTA also tries to auto-detect the matching assignment by
              comparing the activity's starter repo URL against the
              classroom's assignments — so manual linking is only needed when
              the auto-match misses.
            </Note>
          </StepCard>
        </section>

        {/* Student verification */}
        <section id="students" className="scroll-mt-20 mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-gray-400" />
            <h2 className="text-xl font-bold text-white">
              Student verification
            </h2>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed mb-4">
            Before a student can submit, they need to verify their GitHub
            username so IntelliTA knows which Classroom repo belongs to them.
            On the activity page, the student clicks{" "}
            <strong className="text-white">Verify GitHub</strong>, completes
            a short OAuth flow against the same OAuth App, and returns with
            their username saved. The student token is{" "}
            <strong className="text-white">not stored</strong> — IntelliTA
            only needs it long enough to read{" "}
            <code className="bg-gray-800 px-1.5 py-0.5 rounded text-blue-300 text-xs font-mono border border-gray-700/50">
              user.login
            </code>
            .
          </p>
          <Note kind="warning">
            Each student must accept the Classroom assignment on GitHub
            (clicking the invite link creates their personal repo). If they
            haven't accepted yet, submission fails with a clear error message.
          </Note>
        </section>

        {/* Submit flow */}
        <section id="submit-flow" className="scroll-mt-20 mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Send className="w-4 h-4 text-gray-400" />
            <h2 className="text-xl font-bold text-white">
              How submission works
            </h2>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-6 space-y-4">
            {[
              {
                title: "Student writes code in the IntelliTA editor",
                body: "Their work lives in the web editor while they progress through checkpoints — nothing pushes to GitHub yet.",
              },
              {
                title: "Student clicks Submit",
                body: "IntelliTA sends the editor's file contents to the API server.",
              },
              {
                title: "Server pushes to the student's accepted assignment repo",
                body: "Using the instructor's encrypted token, IntelliTA looks up the student's accepted assignment by their verified GitHub username, then commits the files via the Git Trees API.",
              },
              {
                title: "(Optional) Grade section appended to README",
                body: "If the activity is configured to publish grades, IntelliTA splices a managed section between intellita-grade markers in README.md — the existing assignment text is preserved.",
              },
            ].map((s, i) => (
              <div key={i} className="flex gap-4">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-700 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{s.title}</p>
                  <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                    {s.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Troubleshooting */}
        <section id="troubleshooting" className="scroll-mt-20 mb-12">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Troubleshooting</h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "“GitHub not configured for this course”",
                a: "The course doesn't have a saved Client ID / Secret yet. Open the GitHub modal on the course header and complete step 4.",
              },
              {
                q: "“No accepted assignment found for GitHub user X”",
                a: "The student verified their GitHub username, but never opened the Classroom invite link. Send them the assignment URL and have them click Accept.",
              },
              {
                q: "“State parameter expired” after OAuth callback",
                a: "OAuth state is HMAC-signed and lives for 10 minutes. If you opened the consent screen and walked away, restart the connect flow.",
              },
              {
                q: "Classroom dropdown is empty",
                a: "The connected GitHub user isn't an instructor on any GitHub Classroom. Add yourself as an admin to the classroom in step 2, or pick a different OAuth account.",
              },
              {
                q: "Submissions silently land in the wrong repo",
                a: "GitHub usernames are matched case-insensitively. If two students share a similar login, double-check each student's verified github_username on the course roster.",
              },
            ].map((item, i) => (
              <details
                key={i}
                className="group rounded-xl border border-gray-800 bg-gray-900/40 open:bg-gray-900/60"
              >
                <summary className="cursor-pointer list-none flex items-center justify-between px-5 py-3.5 hover:bg-gray-800/30 transition-colors rounded-xl">
                  <span className="text-sm font-medium text-gray-200">
                    {item.q}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="px-5 pb-4 text-sm text-gray-400 leading-relaxed border-t border-gray-800/50 pt-3">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-5 h-5 text-blue-400" />
            <p className="text-sm text-gray-300">
              Done with GitHub? Continue to the{" "}
              <Link
                to="/docs/labs"
                className="text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline"
              >
                Lab Guide
              </Link>{" "}
              to author your first activity.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-500 shrink-0" />
        </div>

        <div className="h-12" />
      </article>

      <DocsTOC items={TOC} />
    </div>
  );
}
