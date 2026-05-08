import { useState } from 'react';
import {
  Code2, BookOpen, ChevronRight, FlaskConical, Copy, Check, Clock,
  Play, Video, FileCode, Lightbulb, ChevronDown, ChevronUp,
  CheckCircle2, Sparkles, ArrowRight, Monitor, Layers, AlertTriangle,
  Terminal, PenTool, ListChecks, Zap, MessageSquare, Bot
} from 'lucide-react';
import { Link } from 'react-router-dom';

function CodeBlock({ code, fileName, icon: Icon, iconColor }) {
  const [copied, setCopied] = useState(false);
  const lines = code.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative">
      <div className="bg-[#0d1117] rounded-xl border border-gray-700/60 overflow-hidden shadow-lg">
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800/80 border-b border-gray-700/50">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
            <Icon className={`w-4 h-4 ${iconColor}`} />
            <span className="font-mono text-xs text-gray-400">{fileName}</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 px-2 py-1 rounded-md transition-all"
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="leading-relaxed">
                  <td className="pr-4 text-right text-xs text-gray-600 select-none w-8 align-top font-mono">{i + 1}</td>
                  <td className="text-sm text-gray-300 font-mono whitespace-pre">{line}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Section({ id, icon: Icon, iconColor, iconBg, title, subtitle, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div id={id} className="rounded-2xl border border-gray-700/60 overflow-hidden bg-gradient-to-b from-gray-800/60 to-gray-900/60 shadow-xl">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-5 sm:p-6 hover:bg-gray-800/40 transition-colors text-left"
      >
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 sm:px-6 pb-6 border-t border-gray-700/40 pt-5">
          {children}
        </div>
      )}
    </div>
  );
}

function StepCard({ number, title, description, icon: Icon, color }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-800/40 border border-gray-700/30">
      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-lg`}>
        {number}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4 text-gray-400" />
          <h4 className="font-semibold text-white text-sm">{title}</h4>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function InfoBox({ type = 'info', children }) {
  const styles = {
    info: { border: 'border-blue-500/20', bg: 'bg-blue-500/5', icon: Lightbulb, iconColor: 'text-blue-400', label: 'Tip' },
    warning: { border: 'border-amber-500/20', bg: 'bg-amber-500/5', icon: AlertTriangle, iconColor: 'text-amber-400', label: 'Important' },
    success: { border: 'border-green-500/20', bg: 'bg-green-500/5', icon: CheckCircle2, iconColor: 'text-green-400', label: 'Good to know' },
  };
  const s = styles[type];
  return (
    <div className={`rounded-xl border ${s.border} ${s.bg} p-4 flex items-start gap-3`}>
      <s.icon className={`w-4 h-4 ${s.iconColor} shrink-0 mt-0.5`} />
      <div className="text-sm text-gray-300 leading-relaxed">{children}</div>
    </div>
  );
}

export default function Maincontent({ user }) {
  const [activeLang, setActiveLang] = useState('python');

  const languages = [
    { id: 'python', name: 'Python', icon: '🐍' },
    { id: 'java', name: 'Java', icon: '☕' },
    { id: 'javascript', name: 'JavaScript', icon: '🟨' }
  ];

  const fullExamples = {
    python: {
      starterFileName: 'calculator.py',
      starterCode: `def add(a, b):\n    # TODO: return the sum\n    return 0\n\ndef subtract(a, b):\n    # TODO: return the difference\n    return 0`,
      testFileName: 'test_calculator.py',
      testCode: `import unittest\nfrom calculator import add, subtract\n\nclass TestCalculator(unittest.TestCase):\n    def test_add(self):\n        self.assertEqual(add(2, 3), 5)\n        self.assertEqual(add(-1, 1), 0)\n\n    def test_subtract(self):\n        self.assertEqual(subtract(10, 4), 6)\n        self.assertEqual(subtract(0, 5), -5)`,
      checkpoints: [
        { time: '01:30', boundTest: 'test_add', prompt: 'Implement the add function to return a + b.' },
        { time: '03:00', boundTest: 'test_subtract', prompt: 'Implement the subtract function to return a - b.' }
      ],
      rules: [
        'Test files must start with test_ (e.g. test_calculator.py)',
        'Use import unittest and extend unittest.TestCase',
        'Bound test name = method name (e.g. test_add)',
      ]
    },
    java: {
      starterFileName: 'Calculator.java',
      starterCode: `public class Calculator {\n\n    public static int add(int a, int b) {\n        // TODO: return the sum\n        return 0;\n    }\n\n    public static int subtract(int a, int b) {\n        // TODO: return the difference\n        return 0;\n    }\n}`,
      testFileName: 'CalculatorTest.java',
      testCode: `public class CalculatorTest {\n\n    public void testAdd() {\n        int result = Calculator.add(2, 3);\n        if (result != 5)\n            throw new RuntimeException("Expected 5 but got " + result);\n    }\n\n    public void testSubtract() {\n        int result = Calculator.subtract(10, 4);\n        if (result != 6)\n            throw new RuntimeException("Expected 6 but got " + result);\n    }\n}`,
      checkpoints: [
        { time: '01:30', boundTest: 'CalculatorTest#testAdd', prompt: 'Implement the add method to return a + b.' },
        { time: '03:00', boundTest: 'CalculatorTest#testSubtract', prompt: 'Implement the subtract method to return a - b.' }
      ],
      rules: [
        'File name must match class name (Calculator.java for public class Calculator)',
        'No testing framework needed — throw RuntimeException on failure',
        'Bound test name = ClassName#methodName (e.g. CalculatorTest#testAdd)',
      ]
    },
    javascript: {
      starterFileName: 'calculator.js',
      starterCode: `function add(a, b) {\n    // TODO: return the sum\n    return 0;\n}\n\nfunction subtract(a, b) {\n    // TODO: return the difference\n    return 0;\n}\n\nmodule.exports = { add, subtract };`,
      testFileName: 'calculator.test.js',
      testCode: `const assert = require('assert');\nconst { add, subtract } = require('./calculator.js');\n\ntest('testAdd', () => {\n    assert.strictEqual(add(2, 3), 5);\n    assert.strictEqual(add(-1, 1), 0);\n});\n\ntest('testSubtract', () => {\n    assert.strictEqual(subtract(10, 4), 6);\n    assert.strictEqual(subtract(0, 5), -5);\n});`,
      checkpoints: [
        { time: '01:30', boundTest: 'testAdd', prompt: 'Implement the add function to return a + b.' },
        { time: '03:00', boundTest: 'testSubtract', prompt: 'Implement the subtract function to return a - b.' }
      ],
      rules: [
        'Test files must end with .test.js (e.g. calculator.test.js)',
        'Use test("name", () => { ... }) syntax with assert module',
        'Bound test name = the string in test() (e.g. testAdd)',
      ]
    }
  };

  const activeExample = fullExamples[activeLang];

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 lg:px-12 w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link to="/courses" className="hover:text-gray-300 transition-colors">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-400">Documentation</span>
        </div>
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <FlaskConical className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Interactive Lab Guide</h1>
            <p className="text-gray-400 text-sm mt-1">Everything you need to create checkpoint-based coding labs for your students.</p>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { href: '#concept', label: 'What is a Lab?', icon: Lightbulb },
          { href: '#flow', label: 'How It Works', icon: Layers },
          { href: '#creation', label: 'Creation Steps', icon: PenTool },
          { href: '#checkpoints', label: 'Checkpoints', icon: ListChecks },
          { href: '#tests', label: 'Writing Tests', icon: FlaskConical },
          { href: '#hints', label: 'AI Hints', icon: Bot },
          { href: '#example', label: 'Full Example', icon: Code2 },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-800/50 border border-gray-700/50 rounded-lg hover:text-white hover:border-gray-600 transition-all"
          >
            <item.icon className="w-3.5 h-3.5" />
            {item.label}
          </a>
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-4">

        {/* --- SECTION 1: What is an Interactive Lab? --- */}
        <Section
          id="concept"
          icon={Lightbulb}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10 border border-amber-500/20"
          title="What is an Interactive Lab?"
          subtitle="Understand the core concept"
          defaultOpen={true}
        >
          <div className="space-y-5">
            <p className="text-gray-300 leading-relaxed">
              An interactive lab is a <strong className="text-white">video-driven coding activity</strong> where
              students watch an instructional video and are paused at key moments to solve coding challenges.
              The video acts as a guide, and <strong className="text-white">checkpoints</strong> are placed at
              specific timestamps to test understanding before the student can continue.
            </p>

            {/* Visual flow */}
            <div className="flex flex-wrap items-center justify-center gap-3 py-6">
              {[
                { icon: Video, label: 'Watch Video', color: 'from-blue-500 to-blue-700' },
                { icon: Clock, label: 'Hit Checkpoint', color: 'from-amber-500 to-amber-700' },
                { icon: Code2, label: 'Write Code', color: 'from-green-500 to-green-700' },
                { icon: FlaskConical, label: 'Test Runs', color: 'from-purple-500 to-purple-700' },
                { icon: Sparkles, label: 'Get AI Hint', color: 'from-pink-500 to-pink-700' },
                { icon: Play, label: 'Continue', color: 'from-blue-500 to-blue-700' },
              ].map((step, i, arr) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                      <step.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs text-gray-400 font-medium">{step.label}</span>
                  </div>
                  {i < arr.length - 1 && <ArrowRight className="w-4 h-4 text-gray-600 mb-5" />}
                </div>
              ))}
            </div>

            <p className="text-gray-300 leading-relaxed">
              Each lab consists of four key pieces:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: Video, title: 'Video', desc: 'The instructional video that guides students through the topic.', color: 'text-blue-400' },
                { icon: FileCode, title: 'Starter Code', desc: 'Pre-written code files students will edit to solve challenges.', color: 'text-green-400' },
                { icon: FlaskConical, title: 'Test Suite', desc: 'Unit tests that automatically verify if the student\'s code is correct.', color: 'text-purple-400' },
                { icon: ListChecks, title: 'Checkpoints', desc: 'Quiz questions or coding challenges placed at specific video timestamps.', color: 'text-amber-400' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-gray-800/40 border border-gray-700/30">
                  <item.icon className={`w-5 h-5 ${item.color} shrink-0 mt-0.5`} />
                  <div>
                    <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* --- SECTION 2: How It Works (Student POV) --- */}
        <Section
          id="flow"
          icon={Layers}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10 border border-blue-500/20"
          title="How It Works"
          subtitle="The student experience step by step"
        >
          <div className="space-y-5">
            <p className="text-gray-300 leading-relaxed">
              When a student opens a lab, they see a split-screen view: the <strong className="text-white">video player</strong> on one side and a <strong className="text-white">code editor</strong> on the other. Here's what happens:
            </p>

            <div className="space-y-3">
              <StepCard number={1} title="Student starts the video" description="The student presses play and watches the instructional video. Small markers on the progress bar show where checkpoints are located." icon={Play} color="from-blue-500 to-blue-700" />
              <StepCard number={2} title="Video pauses at a checkpoint" description="When the video reaches a checkpoint timestamp, it automatically pauses and an overlay appears with a question or coding challenge." icon={Clock} color="from-amber-500 to-amber-700" />
              <StepCard number={3} title="Student solves the challenge" description="For coding checkpoints, the student edits the starter code file specified in the checkpoint. For quiz checkpoints (MCQ, True/False, Fill-Blank), they answer directly in the overlay." icon={Code2} color="from-green-500 to-green-700" />
              <StepCard number={4} title="Solution is verified automatically" description="When the student clicks 'Verify', the bound test runs in a secure sandbox. If it passes, the checkpoint is marked complete. If it fails, the student can try again or request a hint." icon={FlaskConical} color="from-purple-500 to-purple-700" />
              <StepCard number={5} title="AI hint if stuck" description="The AI reads the student's code, the test that failed, and the error message, then generates a targeted hint — never the full answer." icon={Sparkles} color="from-pink-500 to-pink-700" />
              <StepCard number={6} title="Video resumes" description="Once the checkpoint is passed (or skipped), the video continues to the next section. Progress is saved automatically." icon={Play} color="from-blue-500 to-blue-700" />
            </div>

            <InfoBox type="info">
              Students can also skip a checkpoint if they're stuck, but skipped checkpoints count as incomplete and reduce the final score.
            </InfoBox>
          </div>
        </Section>

        {/* --- SECTION 3: Creation Steps --- */}
        <Section
          id="creation"
          icon={PenTool}
          iconColor="text-green-400"
          iconBg="bg-green-500/10 border border-green-500/20"
          title="How to Create a Lab"
          subtitle="Step-by-step creation guide for instructors"
        >
          <div className="space-y-6">
            <p className="text-gray-300 leading-relaxed">
              Creating a lab is done from the <strong className="text-white">Create Activity</strong> modal inside your course. Here's the process:
            </p>

            {/* Step 1 */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-xs font-bold">1</span>
                Upload Your Video
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed ml-9">
                Record a tutorial video where you explain the coding concepts. Plan your <strong className="text-gray-300">pause points</strong> — the moments where
                you want students to stop and code. Note down the timestamps (e.g. 01:30, 03:00) as you'll need them for checkpoints.
              </p>
              <InfoBox type="info">
                The video duration is detected automatically on upload. Checkpoint timestamps cannot exceed the video length.
              </InfoBox>
            </div>

            {/* Step 2 */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-xs font-bold">2</span>
                Create Starter Code Files
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed ml-9">
                In the <strong className="text-gray-300">Starter Files</strong> tab, create the code files students will work with. These files appear in the
                code editor when students open the lab. Include <code className="bg-gray-800 px-1.5 py-0.5 rounded text-blue-300 text-xs font-mono border border-gray-700/50">TODO</code> comments where students need to write code.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-xs font-bold">3</span>
                Write Test Cases
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed ml-9">
                Switch to the <strong className="text-gray-300">Tests</strong> tab, select your language (Python / Java / JavaScript), and write unit tests.
                Each test method validates one checkpoint. The test names will appear as options when configuring checkpoints.
              </p>
              <InfoBox type="warning">
                Each coding checkpoint is <strong>bound to exactly one test method</strong>. Write one test per challenge — if a test has multiple assertions, all must pass for the checkpoint to be verified.
              </InfoBox>
            </div>

            {/* Step 4 */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-xs font-bold">4</span>
                Configure Checkpoints in the Quiz Editor
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed ml-9">
                Open the <strong className="text-gray-300">Quiz Editor</strong>. For each checkpoint, set:
              </p>
              <div className="ml-9 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: 'Timestamp', desc: 'The video time (MM:SS) where the pause occurs' },
                  { label: 'Type', desc: 'MCQ, True/False, Fill-Blank, or Coding Challenge' },
                  { label: 'Target File', desc: '(Coding) Which starter file the student should edit' },
                  { label: 'Bound Test', desc: '(Coding) Which test method verifies the solution' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-gray-800/30 border border-gray-700/20">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold text-white">{item.label}</span>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 5 */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-xs font-bold">5</span>
                Preview & Publish
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed ml-9">
                Review everything in the preview step — video, code files, tests, and checkpoints — then publish. Students will see the lab under the course activities.
              </p>
            </div>
          </div>
        </Section>

        {/* --- SECTION 4: Checkpoint Types --- */}
        <Section
          id="checkpoints"
          icon={ListChecks}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10 border border-amber-500/20"
          title="Checkpoint Types"
          subtitle="Four types of checkpoints you can use"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  title: 'Multiple Choice (MCQ)',
                  desc: 'Present 2-6 options, student picks one. Great for conceptual questions.',
                  icon: ListChecks,
                  color: 'text-blue-400',
                  bg: 'bg-blue-500/10 border-blue-500/20',
                  example: 'Q: "What does len() return for an empty list?" → A: 0'
                },
                {
                  title: 'True / False',
                  desc: 'A statement the student marks as true or false. Quick comprehension checks.',
                  icon: CheckCircle2,
                  color: 'text-green-400',
                  bg: 'bg-green-500/10 border-green-500/20',
                  example: 'Q: "In Java, arrays are zero-indexed." → A: True'
                },
                {
                  title: 'Fill in the Blank',
                  desc: 'Student types a short answer. Case-insensitive matching.',
                  icon: PenTool,
                  color: 'text-orange-400',
                  bg: 'bg-orange-500/10 border-orange-500/20',
                  example: 'Q: "The keyword to define a function in Python is ___" → A: def'
                },
                {
                  title: 'Coding Challenge',
                  desc: 'Student writes code in the editor. Verified by running a bound unit test in a sandbox.',
                  icon: Code2,
                  color: 'text-purple-400',
                  bg: 'bg-purple-500/10 border-purple-500/20',
                  example: 'Instruction: "Implement the add function" → Bound test: test_add'
                },
              ].map((item, i) => (
                <div key={i} className={`rounded-xl border ${item.bg} p-4 space-y-2`}>
                  <div className="flex items-center gap-2">
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                  <p className="text-xs text-gray-500 italic">{item.example}</p>
                </div>
              ))}
            </div>

            <InfoBox type="success">
              You can mix checkpoint types in a single lab! For example, start with an MCQ to check understanding, then follow with a coding challenge to apply the concept.
            </InfoBox>
          </div>
        </Section>

        {/* --- SECTION 5: Writing Tests --- */}
        <Section
          id="tests"
          icon={FlaskConical}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/10 border border-purple-500/20"
          title="Writing Tests"
          subtitle="Test format rules for each language"
        >
          <div className="space-y-6">
            <p className="text-gray-300 leading-relaxed">
              Tests are how the system <strong className="text-white">automatically verifies</strong> student code. Each coding checkpoint is bound to one test method.
              When a student clicks "Verify", that specific test runs in a secure sandbox. Here are the rules for each language:
            </p>

            {/* Language selector */}
            <div className="flex gap-1 bg-gray-800/50 p-1.5 rounded-xl w-fit border border-gray-700/50">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setActiveLang(lang.id)}
                  className={`px-5 py-2.5 font-medium text-sm rounded-lg transition-all duration-200 ${
                    activeLang === lang.id
                      ? 'bg-gray-700 text-white shadow-md'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/80'
                  }`}
                >
                  <span className="mr-2">{lang.icon}</span>
                  {lang.name}
                </button>
              ))}
            </div>

            {/* Rules */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 bg-amber-500/10 border-b border-amber-500/15">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">{activeLang === 'python' ? 'Python' : activeLang === 'java' ? 'Java' : 'JavaScript'} Rules</h3>
              </div>
              <ul className="p-5 space-y-2.5">
                {activeExample.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* Test file example */}
            <CodeBlock
              code={activeExample.testCode}
              fileName={activeExample.testFileName}
              icon={FlaskConical}
              iconColor="text-purple-400"
            />

            <InfoBox type="warning">
              The <strong>Bound Test</strong> name must exactly match the test method. The system auto-detects test names from your code, but double-check them in the Quiz Editor dropdown.
            </InfoBox>
          </div>
        </Section>

        {/* --- SECTION 6: AI Hints --- */}
        <Section
          id="hints"
          icon={Bot}
          iconColor="text-pink-400"
          iconBg="bg-pink-500/10 border border-pink-500/20"
          title="AI-Powered Hints"
          subtitle="How the hint system helps students"
        >
          <div className="space-y-5">
            <p className="text-gray-300 leading-relaxed">
              When a student is stuck on a coding checkpoint, they can request an <strong className="text-white">AI-generated hint</strong>. The system doesn't just give generic advice — it's context-aware:
            </p>

            <div className="space-y-3">
              {[
                { icon: Code2, color: 'text-green-400', title: 'Reads the student\'s code', desc: 'The AI sees exactly what the student has written so far.' },
                { icon: FlaskConical, color: 'text-purple-400', title: 'Runs the bound test', desc: 'The test executes in the sandbox. If it passes, the checkpoint is auto-verified — no hint needed!' },
                { icon: Terminal, color: 'text-red-400', title: 'Analyzes the failure', desc: 'If the test fails, the AI reads the error message and the test code to understand what went wrong.' },
                { icon: MessageSquare, color: 'text-pink-400', title: 'Generates a targeted hint', desc: 'The AI gives a nudge in the right direction — never the full answer. It explains what contract was violated.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/20">
                  <item.icon className={`w-4 h-4 ${item.color} shrink-0 mt-0.5`} />
                  <div>
                    <span className="text-sm font-medium text-white">{item.title}</span>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <InfoBox type="success">
              You don't need to write hints manually. The AI generates them automatically based on the checkpoint instruction, the test, and the student's code. Just make sure your test names and error messages are descriptive!
            </InfoBox>
          </div>
        </Section>

        {/* --- SECTION 7: Full Example --- */}
        <Section
          id="example"
          icon={Code2}
          iconColor="text-green-400"
          iconBg="bg-green-500/10 border border-green-500/20"
          title="Full Working Example"
          subtitle="A complete lab you can copy and use"
        >
          <div className="space-y-6">
            <p className="text-gray-300 leading-relaxed">
              Here's a complete <strong className="text-white">Calculator Lab</strong> ready to use. It has 2 coding checkpoints.
              Select your language, then copy the starter code, test file, and checkpoint config into the activity creator.
            </p>

            {/* Language selector */}
            <div className="flex gap-1 bg-gray-800/50 p-1.5 rounded-xl w-fit border border-gray-700/50">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setActiveLang(lang.id)}
                  className={`px-5 py-2.5 font-medium text-sm rounded-lg transition-all duration-200 ${
                    activeLang === lang.id
                      ? 'bg-gray-700 text-white shadow-md'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/80'
                  }`}
                >
                  <span className="mr-2">{lang.icon}</span>
                  {lang.name}
                </button>
              ))}
            </div>

            {/* Code files side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CodeBlock
                code={activeExample.starterCode}
                fileName={activeExample.starterFileName}
                icon={Code2}
                iconColor="text-green-400"
              />
              <CodeBlock
                code={activeExample.testCode}
                fileName={activeExample.testFileName}
                icon={FlaskConical}
                iconColor="text-purple-400"
              />
            </div>

            {/* Checkpoint config */}
            <div>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-amber-400" />
                Quiz Editor Checkpoints
              </h3>
              <div className="space-y-2.5">
                {activeExample.checkpoints.map((cp, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-4 rounded-xl bg-gray-800/50 border border-gray-700/40"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-lg shadow-purple-500/20">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-900/80 px-2 py-1 rounded-md border border-gray-700/50">
                          <Clock className="w-3 h-3" />
                          {cp.time}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-400 font-mono px-2.5 py-1 rounded-md text-xs border border-purple-500/20">
                          <FlaskConical className="w-3 h-3" />
                          {cp.boundTest}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{cp.prompt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <InfoBox type="info">
              This is a minimal example with 2 checkpoints. Real labs can have as many checkpoints as needed — just add more test methods and configure them in the Quiz Editor.
            </InfoBox>
          </div>
        </Section>

      </div>

      {/* Footer spacer */}
      <div className="h-8" />
    </div>
  );
}
