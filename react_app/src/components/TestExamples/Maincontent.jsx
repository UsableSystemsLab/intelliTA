import { useState } from 'react';
import {
  Code2, BookOpen, ChevronRight, Terminal, FlaskConical, CheckCircle2,
  AlertTriangle, Copy, Check, Info, ChevronDown, ChevronUp, FileCode,
  Lightbulb, ArrowRight, XCircle, Zap, Search, Link2
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

function InfoBox({ type = 'info', children }) {
  const styles = {
    info: { border: 'border-blue-500/20', bg: 'bg-blue-500/5', icon: Lightbulb, iconColor: 'text-blue-400' },
    warning: { border: 'border-amber-500/20', bg: 'bg-amber-500/5', icon: AlertTriangle, iconColor: 'text-amber-400' },
    success: { border: 'border-green-500/20', bg: 'bg-green-500/5', icon: CheckCircle2, iconColor: 'text-green-400' },
    error: { border: 'border-red-500/20', bg: 'bg-red-500/5', icon: XCircle, iconColor: 'text-red-400' },
  };
  const s = styles[type];
  return (
    <div className={`rounded-xl border ${s.border} ${s.bg} p-4 flex items-start gap-3`}>
      <s.icon className={`w-4 h-4 ${s.iconColor} shrink-0 mt-0.5`} />
      <div className="text-sm text-gray-300 leading-relaxed">{children}</div>
    </div>
  );
}

function InlineCode({ children }) {
  return (
    <code className="bg-gray-800 px-1.5 py-0.5 rounded text-blue-300 text-xs font-mono border border-gray-700/50">{children}</code>
  );
}

export default function Maincontent({ user }) {
  const [activeLang, setActiveLang] = useState('python');

  const languages = [
    { id: 'python', name: 'Python', icon: '🐍' },
    { id: 'java', name: 'Java', icon: '☕' },
    { id: 'javascript', name: 'JavaScript', icon: '🟨' }
  ];

  const langData = {
    python: {
      label: 'Python',
      framework: 'unittest (built-in)',
      starterFileName: 'greeting.py',
      starterCode: `def make_greeting(name):\n    # TODO: return "Hello, [name]!"\n    return ""`,
      testFileName: 'test_greeting.py',
      testCode: `import unittest\nfrom greeting import make_greeting\n\nclass TestGreeting(unittest.TestCase):\n    def test_make_greeting(self):\n        self.assertEqual(make_greeting("Alice"), "Hello, Alice!")\n\n    def test_empty_name(self):\n        self.assertEqual(make_greeting(""), "Hello, !")`,
      boundTestExample: 'test_make_greeting',
      boundTestFormat: 'method_name',
      naming: {
        starterRule: 'Any valid Python filename (e.g. greeting.py, utils.py)',
        testRule: 'Must start with test_ (e.g. test_greeting.py, test_utils.py)',
        methodRule: 'Must start with test_ (e.g. def test_make_greeting(self):)',
      },
      rules: [
        { text: 'Test file names must start with test_ — the runner uses this pattern to discover tests.', type: 'required' },
        { text: 'You must import unittest and create a class that inherits from unittest.TestCase.', type: 'required' },
        { text: 'Each test must be a method starting with test_ inside the TestCase class.', type: 'required' },
        { text: 'Import your starter code at the top of the test file (e.g. from greeting import make_greeting).', type: 'required' },
        { text: 'Use self.assertEqual(), self.assertTrue(), self.assertFalse(), self.assertRaises() for assertions.', type: 'info' },
        { text: 'The Bound Test name is the exact method name — e.g. test_make_greeting (no class prefix).', type: 'info' },
      ],
      commonMistakes: [
        { wrong: 'greeting_test.py', right: 'test_greeting.py', why: 'File must start with test_, not end with it.' },
        { wrong: 'def make_greeting_test(self):', right: 'def test_make_greeting(self):', why: 'Method must start with test_.' },
        { wrong: 'assert make_greeting("A") == "Hello, A!"', right: 'self.assertEqual(make_greeting("A"), "Hello, A!")', why: 'Use unittest assertion methods, not bare assert.' },
      ],
      assertions: [
        { method: 'self.assertEqual(a, b)', desc: 'a == b' },
        { method: 'self.assertTrue(x)', desc: 'x is True' },
        { method: 'self.assertFalse(x)', desc: 'x is False' },
        { method: 'self.assertRaises(Error)', desc: 'Expects an exception' },
        { method: 'self.assertIn(a, b)', desc: 'a is in b' },
      ]
    },
    java: {
      label: 'Java',
      framework: 'Direct (no framework needed)',
      starterFileName: 'Calculator.java',
      starterCode: `public class Calculator {\n\n    public static int add(int a, int b) {\n        // TODO: return the sum\n        return 0;\n    }\n\n    public static int subtract(int a, int b) {\n        // TODO: return the difference\n        return 0;\n    }\n}`,
      testFileName: 'CalculatorTest.java',
      testCode: `public class CalculatorTest {\n\n    public void testAdd() {\n        int result = Calculator.add(2, 3);\n        if (result != 5)\n            throw new RuntimeException("Expected 5 but got " + result);\n    }\n\n    public void testSubtract() {\n        int result = Calculator.subtract(10, 4);\n        if (result != 6)\n            throw new RuntimeException("Expected 6 but got " + result);\n    }\n}`,
      boundTestExample: 'CalculatorTest#testAdd',
      boundTestFormat: 'ClassName#methodName',
      naming: {
        starterRule: 'Must match the public class name (e.g. Calculator.java for public class Calculator)',
        testRule: 'Must match the public test class name (e.g. CalculatorTest.java for public class CalculatorTest)',
        methodRule: 'Must be public void and start with test (e.g. public void testAdd())',
      },
      rules: [
        { text: 'If a class is public, the file name MUST exactly match the class name (e.g. Calculator.java for public class Calculator).', type: 'required' },
        { text: 'No testing framework is needed. Tests just throw a RuntimeException when the result is wrong.', type: 'required' },
        { text: 'Test methods must be public void and start with test (e.g. public void testAdd()).', type: 'required' },
        { text: 'The Bound Test name uses ClassName#methodName format — e.g. CalculatorTest#testAdd.', type: 'required' },
        { text: 'The system compiles all .java files together in memory, so your test file can reference the starter class directly.', type: 'info' },
        { text: 'Keep error messages descriptive — they are shown to the student and used by the AI hint system.', type: 'info' },
      ],
      commonMistakes: [
        { wrong: 'MathTest.java with public class Mathtest', right: 'MathTest.java with public class MathTest', why: 'File name and class name must match exactly (case-sensitive).' },
        { wrong: 'Bound test: testAdd', right: 'Bound test: MathTest#testAdd', why: 'Java bound tests require ClassName#methodName format.' },
        { wrong: 'private void testAdd()', right: 'public void testAdd()', why: 'Test methods must be public — the runner invokes them via reflection.' },
      ],
      assertions: [
        { method: 'if (x != expected) throw new RuntimeException("msg")', desc: 'Basic equality check' },
        { method: 'if (x == null) throw new RuntimeException("msg")', desc: 'Null check' },
        { method: 'if (!condition) throw new RuntimeException("msg")', desc: 'Boolean condition check' },
        { method: 'try { code; throw ... } catch (Expected e) {}', desc: 'Exception expected' },
      ]
    },
    javascript: {
      label: 'JavaScript',
      framework: 'Jest-style (custom test() registry)',
      starterFileName: 'filter.js',
      starterCode: `function getEvenNumbers(numbers) {\n    // TODO: return only even numbers\n    return numbers;\n}\n\nmodule.exports = { getEvenNumbers };`,
      testFileName: 'filter.test.js',
      testCode: `const assert = require('assert');\nconst { getEvenNumbers } = require('./filter.js');\n\ntest('testGetEvenNumbers', () => {\n    const input = [1, 2, 3, 4, 5];\n    assert.deepStrictEqual(getEvenNumbers(input), [2, 4]);\n});\n\ntest('testEmptyArray', () => {\n    assert.deepStrictEqual(getEvenNumbers([]), []);\n});`,
      boundTestExample: 'testGetEvenNumbers',
      boundTestFormat: 'test_name_string',
      naming: {
        starterRule: 'Any valid JS filename (e.g. filter.js, utils.js)',
        testRule: 'Must end with .test.js (e.g. filter.test.js, utils.test.js)',
        methodRule: 'The string passed to test() (e.g. test(\'testGetEvenNumbers\', () => {...}))',
      },
      rules: [
        { text: 'Test files MUST end with .test.js — the runner only loads files matching this pattern.', type: 'required' },
        { text: 'You must use the test("name", () => { ... }) syntax to register tests.', type: 'required' },
        { text: 'Use the built-in assert module (require(\'assert\')) for assertions.', type: 'required' },
        { text: 'Export your starter functions with module.exports and import them with require() in the test.', type: 'required' },
        { text: 'The Bound Test name is the exact string passed to test() — e.g. testGetEvenNumbers.', type: 'info' },
        { text: 'You can also use it("name", () => {...}) as an alias for test().', type: 'info' },
      ],
      commonMistakes: [
        { wrong: 'filter.spec.js', right: 'filter.test.js', why: 'Only .test.js is recognized, not .spec.js.' },
        { wrong: 'describe("suite", () => { it(...) })', right: 'test("testName", () => { ... })', why: 'describe() blocks are not supported — use top-level test() calls.' },
        { wrong: 'expect(x).toBe(y)', right: 'assert.strictEqual(x, y)', why: 'Jest matchers are not available — use Node\'s assert module.' },
      ],
      assertions: [
        { method: 'assert.strictEqual(a, b)', desc: 'a === b' },
        { method: 'assert.deepStrictEqual(a, b)', desc: 'Deep equality (arrays, objects)' },
        { method: 'assert.ok(value)', desc: 'value is truthy' },
        { method: 'assert.throws(() => fn())', desc: 'Expects an exception' },
      ]
    }
  };

  const active = langData[activeLang];

  const LanguageTabs = () => (
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
  );

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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Test Formats & Rules</h1>
            <p className="text-gray-400 text-sm mt-1">Complete reference for writing starter code, test files, and configuring bound tests.</p>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { href: '#overview', label: 'Overview', icon: Lightbulb },
          { href: '#naming', label: 'File Naming', icon: FileCode },
          { href: '#rules', label: 'Language Rules', icon: AlertTriangle },
          { href: '#examples', label: 'Code Examples', icon: Code2 },
          { href: '#bound-test', label: 'Bound Tests', icon: Link2 },
          { href: '#assertions', label: 'Assertions', icon: CheckCircle2 },
          { href: '#mistakes', label: 'Common Mistakes', icon: XCircle },
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

        {/* --- SECTION 1: Overview --- */}
        <Section
          id="overview"
          icon={Lightbulb}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10 border border-amber-500/20"
          title="How Tests Work"
          subtitle="Understand the testing pipeline"
          defaultOpen={true}
        >
          <div className="space-y-5">
            <p className="text-gray-300 leading-relaxed">
              Every coding checkpoint in an interactive lab is <strong className="text-white">bound to a single test method</strong>.
              When a student clicks "Verify" or requests a hint, the system runs that specific test against their code in a <strong className="text-white">secure sandbox</strong> (Piston).
            </p>

            {/* Visual pipeline */}
            <div className="flex flex-wrap items-center justify-center gap-3 py-6">
              {[
                { icon: Code2, label: 'Student Code', color: 'from-green-500 to-green-700' },
                { icon: FlaskConical, label: 'Bound Test', color: 'from-purple-500 to-purple-700' },
                { icon: Zap, label: 'Sandbox Run', color: 'from-amber-500 to-amber-700' },
                { icon: CheckCircle2, label: 'Pass / Fail', color: 'from-blue-500 to-blue-700' },
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: FileCode, title: 'Starter Files', desc: 'Code files students edit. These are the "source" files — your function stubs with TODO comments.', color: 'text-green-400' },
                { icon: FlaskConical, title: 'Test Files', desc: 'Unit tests that verify correctness. Each test method checks one specific behavior.', color: 'text-purple-400' },
                { icon: Link2, title: 'Bound Test', desc: 'The link between a checkpoint and a test method. Each coding checkpoint runs exactly one bound test.', color: 'text-blue-400' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-gray-800/40 border border-gray-700/30">
                  <item.icon className={`w-5 h-5 ${item.color} shrink-0 mt-0.5`} />
                  <div>
                    <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <InfoBox type="info">
              The system supports three languages: <strong>Python</strong>, <strong>Java</strong>, and <strong>JavaScript</strong>. Each has different naming conventions and test frameworks — pick one language per activity.
            </InfoBox>
          </div>
        </Section>

        {/* --- SECTION 2: File Naming --- */}
        <Section
          id="naming"
          icon={FileCode}
          iconColor="text-green-400"
          iconBg="bg-green-500/10 border border-green-500/20"
          title="File Naming Conventions"
          subtitle="How to name your starter and test files"
        >
          <div className="space-y-5">
            <LanguageTabs />

            <p className="text-gray-300 leading-relaxed">
              Correct file naming is critical — the test runner uses file name patterns to discover and execute tests. Here are the rules for <strong className="text-white">{active.label}</strong>:
            </p>

            <div className="space-y-3">
              {[
                { label: 'Starter File', value: active.naming.starterRule, icon: Code2, color: 'text-green-400', bg: 'border-green-500/20 bg-green-500/5' },
                { label: 'Test File', value: active.naming.testRule, icon: FlaskConical, color: 'text-purple-400', bg: 'border-purple-500/20 bg-purple-500/5' },
                { label: 'Test Method', value: active.naming.methodRule, icon: Terminal, color: 'text-blue-400', bg: 'border-blue-500/20 bg-blue-500/5' },
              ].map((item, i) => (
                <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border ${item.bg}`}>
                  <item.icon className={`w-4 h-4 ${item.color} shrink-0 mt-0.5`} />
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{item.label}</span>
                    <p className="text-sm text-gray-200 mt-0.5">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {activeLang === 'java' && (
              <InfoBox type="warning">
                Java is the strictest — if your file is named <InlineCode>MathTest.java</InlineCode> but your class is <InlineCode>public class Mathtest</InlineCode> (lowercase t), compilation will fail silently.
              </InfoBox>
            )}
          </div>
        </Section>

        {/* --- SECTION 3: Language Rules --- */}
        <Section
          id="rules"
          icon={AlertTriangle}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10 border border-amber-500/20"
          title="Language-Specific Rules"
          subtitle="Must-follow rules for each language"
        >
          <div className="space-y-5">
            <LanguageTabs />

            <div className="rounded-xl border border-gray-700/40 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 bg-gray-800/60 border-b border-gray-700/40">
                <span className="text-lg">{languages.find(l => l.id === activeLang)?.icon}</span>
                <h3 className="text-sm font-bold text-white">{active.label}</h3>
                <span className="text-xs text-gray-500 ml-1">— {active.framework}</span>
              </div>
              <ul className="p-5 space-y-3">
                {active.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    {rule.type === 'required' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    )}
                    <span className="text-gray-300 leading-relaxed">{rule.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* --- SECTION 4: Code Examples --- */}
        <Section
          id="examples"
          icon={Code2}
          iconColor="text-green-400"
          iconBg="bg-green-500/10 border border-green-500/20"
          title="Code Examples"
          subtitle="Complete starter + test file pairs you can copy"
        >
          <div className="space-y-5">
            <LanguageTabs />

            <p className="text-gray-300 text-sm leading-relaxed">
              Here's a complete pair of files for <strong className="text-white">{active.label}</strong>. The starter file has the function stubs students will implement, and the test file validates their work.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-green-400" /> Starter File
                </p>
                <CodeBlock
                  code={active.starterCode}
                  fileName={active.starterFileName}
                  icon={Code2}
                  iconColor="text-green-400"
                />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-purple-400" /> Test File
                </p>
                <CodeBlock
                  code={active.testCode}
                  fileName={active.testFileName}
                  icon={FlaskConical}
                  iconColor="text-purple-400"
                />
              </div>
            </div>

            <InfoBox type="success">
              The test file imports from the starter file — make sure the import path matches the starter file name exactly.
            </InfoBox>
          </div>
        </Section>

        {/* --- SECTION 5: Bound Test Configuration --- */}
        <Section
          id="bound-test"
          icon={Link2}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10 border border-blue-500/20"
          title="Bound Test Configuration"
          subtitle="How to connect checkpoints to test methods"
        >
          <div className="space-y-5">
            <p className="text-gray-300 leading-relaxed">
              The <strong className="text-white">Bound Test</strong> is the name of the test method that runs when a student verifies their solution at a checkpoint.
              You set this in the <strong className="text-white">Quiz Editor</strong> when creating a coding checkpoint. The system auto-detects available test names from your test files.
            </p>

            <LanguageTabs />

            {/* Bound test format explanation */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Terminal className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-0.5">
                      {active.label} Bound Test Format
                    </h3>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      {activeLang === 'python' && 'Use the exact method name (no class prefix):'}
                      {activeLang === 'java' && 'Use ClassName#methodName format:'}
                      {activeLang === 'javascript' && 'Use the exact string passed to test():'}
                    </p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-500/15 to-purple-500/15 border border-blue-500/25 text-blue-300 px-5 py-2.5 rounded-lg font-mono text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/5 shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  {active.boundTestExample}
                </div>
              </div>
            </div>

            {/* How auto-detection works */}
            <div className="rounded-xl border border-gray-700/40 bg-gray-800/30 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <h4 className="text-sm font-semibold text-white">How test auto-detection works</h4>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                When you write test code in the Tests tab, the Quiz Editor automatically scans for test definitions using pattern matching:
              </p>
              <ul className="text-xs text-gray-400 space-y-1 ml-6 list-disc">
                {activeLang === 'python' && (
                  <>
                    <li>Looks for <InlineCode>def test_*(self):</InlineCode> methods</li>
                    <li>Extracts the method name as the bound test name</li>
                  </>
                )}
                {activeLang === 'java' && (
                  <>
                    <li>Looks for <InlineCode>public void test*()</InlineCode> methods</li>
                    <li>Parses the enclosing class name</li>
                    <li>Combines as <InlineCode>ClassName#methodName</InlineCode></li>
                  </>
                )}
                {activeLang === 'javascript' && (
                  <>
                    <li>Looks for <InlineCode>test('name', ...)</InlineCode> or <InlineCode>it('name', ...)</InlineCode> calls</li>
                    <li>Extracts the string argument as the bound test name</li>
                  </>
                )}
              </ul>
            </div>

            <InfoBox type="warning">
              The bound test name must <strong>exactly</strong> match what's in your test file. If you rename a test method, update the checkpoint in the Quiz Editor too.
            </InfoBox>
          </div>
        </Section>

        {/* --- SECTION 6: Assertions Reference --- */}
        <Section
          id="assertions"
          icon={CheckCircle2}
          iconColor="text-green-400"
          iconBg="bg-green-500/10 border border-green-500/20"
          title="Assertions Reference"
          subtitle="Available assertion methods per language"
        >
          <div className="space-y-5">
            <LanguageTabs />

            <p className="text-gray-300 text-sm leading-relaxed">
              Assertions are how you check if the student's code produces the right result. If an assertion fails, the test fails, and the student sees an error message.
              Use <strong className="text-white">descriptive error messages</strong> — the AI hint system reads them to generate targeted hints.
            </p>

            <div className="rounded-xl border border-gray-700/40 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-800/60 border-b border-gray-700/40">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Method</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Checks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {active.assertions.map((a, idx) => (
                    <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <code className="text-blue-300 text-xs font-mono">{a.method}</code>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-sm">{a.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <InfoBox type="info">
              {activeLang === 'python' && 'You can add a custom message to any assertion: self.assertEqual(a, b, "Expected X but got Y")'}
              {activeLang === 'java' && 'Always include a descriptive message in your RuntimeException — it helps both the student and the AI hint system.'}
              {activeLang === 'javascript' && 'Add a message parameter: assert.strictEqual(a, b, "Expected X but got Y")'}
            </InfoBox>
          </div>
        </Section>

        {/* --- SECTION 7: Common Mistakes --- */}
        <Section
          id="mistakes"
          icon={XCircle}
          iconColor="text-red-400"
          iconBg="bg-red-500/10 border border-red-500/20"
          title="Common Mistakes"
          subtitle="Avoid these frequent pitfalls"
        >
          <div className="space-y-5">
            <LanguageTabs />

            <p className="text-gray-300 text-sm leading-relaxed">
              These are the most common mistakes instructors make when writing tests for <strong className="text-white">{active.label}</strong>. Each one will cause tests to silently fail or not be discovered.
            </p>

            <div className="space-y-3">
              {active.commonMistakes.map((m, idx) => (
                <div key={idx} className="rounded-xl border border-gray-700/40 overflow-hidden">
                  <div className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Wrong</span>
                        <p className="font-mono text-sm text-red-300/80 mt-0.5">{m.wrong}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Correct</span>
                        <p className="font-mono text-sm text-green-300/80 mt-0.5">{m.right}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 pt-2 border-t border-gray-700/30">
                      <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-400 leading-relaxed">{m.why}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <InfoBox type="error">
              If a test isn't showing up in the Quiz Editor's bound test dropdown, it's almost always a naming issue. Double-check the file name and method name patterns above.
            </InfoBox>
          </div>
        </Section>

      </div>

      {/* Footer spacer */}
      <div className="h-8" />
    </div>
  );
}
