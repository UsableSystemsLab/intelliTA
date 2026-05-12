import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function CodeBlock({ code, fileName }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const lines = code.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0d1117] rounded border border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/80 border-b border-gray-700">
        <span className="font-mono text-xs text-gray-400">{fileName}</span>
        <button
          onClick={handleCopy}
          className="text-xs text-gray-400 hover:text-white border border-gray-700 px-2 py-0.5 rounded"
        >
          {copied ? t('docs.copied') : t('docs.copy')}
        </button>
      </div>
      <div className="overflow-x-auto p-4">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="leading-relaxed">
                <td className="pe-4 text-end text-xs text-gray-600 select-none w-8 align-top font-mono">{i + 1}</td>
                <td className="text-sm text-gray-300 font-mono whitespace-pre">{line}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Note({ kind = 'info', label, children }) {
  const colors = {
    info: 'border-blue-500/40 bg-blue-500/5',
    warning: 'border-amber-500/40 bg-amber-500/5',
    success: 'border-emerald-500/40 bg-emerald-500/5',
    error: 'border-red-500/40 bg-red-500/5',
  };
  return (
    <div className={`border-s-4 ${colors[kind]} ps-4 pe-4 py-3 rounded-e text-sm text-gray-300 leading-relaxed`}>
      <strong className="block uppercase tracking-wider text-xs text-gray-400 mb-1">{label}</strong>
      {children}
    </div>
  );
}

export default function Maincontent() {
  const { t } = useTranslation();
  const [activeLang, setActiveLang] = useState('python');

  const languages = [
    { id: 'python', name: 'Python' },
    { id: 'java', name: 'Java' },
    { id: 'javascript', name: 'JavaScript' },
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
      naming: {
        starter: 'Any valid Python filename (e.g. greeting.py, utils.py)',
        test: 'Must start with test_ (e.g. test_greeting.py, test_utils.py)',
        method: 'Must start with test_ (e.g. def test_make_greeting(self):)',
      },
      rules: [
        'Test file names must start with test_ — the runner uses this pattern to discover tests.',
        'You must import unittest and create a class that inherits from unittest.TestCase.',
        'Each test must be a method starting with test_ inside the TestCase class.',
        'Import your starter code at the top of the test file (e.g. from greeting import make_greeting).',
        'Use self.assertEqual(), self.assertTrue(), self.assertFalse(), self.assertRaises() for assertions.',
        'The Bound Test name is the exact method name — e.g. test_make_greeting (no class prefix).',
      ],
      mistakes: [
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
      ],
      autoDetect: ['Looks for def test_*(self): methods', 'Extracts the method name as the bound test name'],
    },
    java: {
      label: 'Java',
      framework: 'Direct (no framework needed)',
      starterFileName: 'Calculator.java',
      starterCode: `public class Calculator {\n\n    public static int add(int a, int b) {\n        // TODO: return the sum\n        return 0;\n    }\n\n    public static int subtract(int a, int b) {\n        // TODO: return the difference\n        return 0;\n    }\n}`,
      testFileName: 'CalculatorTest.java',
      testCode: `public class CalculatorTest {\n\n    public void testAdd() {\n        int result = Calculator.add(2, 3);\n        if (result != 5)\n            throw new RuntimeException("Expected 5 but got " + result);\n    }\n\n    public void testSubtract() {\n        int result = Calculator.subtract(10, 4);\n        if (result != 6)\n            throw new RuntimeException("Expected 6 but got " + result);\n    }\n}`,
      boundTestExample: 'CalculatorTest#testAdd',
      naming: {
        starter: 'Must match the public class name (e.g. Calculator.java for public class Calculator)',
        test: 'Must match the public test class name (e.g. CalculatorTest.java for public class CalculatorTest)',
        method: 'Must be public void and start with test (e.g. public void testAdd())',
      },
      rules: [
        'If a class is public, the file name MUST exactly match the class name (e.g. Calculator.java for public class Calculator).',
        'No testing framework is needed. Tests just throw a RuntimeException when the result is wrong.',
        'Test methods must be public void and start with test (e.g. public void testAdd()).',
        'The Bound Test name uses ClassName#methodName format — e.g. CalculatorTest#testAdd.',
        'The system compiles all .java files together in memory, so your test file can reference the starter class directly.',
        'Keep error messages descriptive — they are shown to the student and used by the AI hint system.',
      ],
      mistakes: [
        { wrong: 'MathTest.java with public class Mathtest', right: 'MathTest.java with public class MathTest', why: 'File name and class name must match exactly (case-sensitive).' },
        { wrong: 'Bound test: testAdd', right: 'Bound test: MathTest#testAdd', why: 'Java bound tests require ClassName#methodName format.' },
        { wrong: 'private void testAdd()', right: 'public void testAdd()', why: 'Test methods must be public — the runner invokes them via reflection.' },
      ],
      assertions: [
        { method: 'if (x != expected) throw new RuntimeException("msg")', desc: 'Basic equality check' },
        { method: 'if (x == null) throw new RuntimeException("msg")', desc: 'Null check' },
        { method: 'if (!condition) throw new RuntimeException("msg")', desc: 'Boolean condition check' },
        { method: 'try { code; throw ... } catch (Expected e) {}', desc: 'Exception expected' },
      ],
      autoDetect: ['Looks for public void test*() methods', 'Parses the enclosing class name', 'Combines as ClassName#methodName'],
    },
    javascript: {
      label: 'JavaScript',
      framework: 'Jest-style (custom test() registry)',
      starterFileName: 'filter.js',
      starterCode: `function getEvenNumbers(numbers) {\n    // TODO: return only even numbers\n    return numbers;\n}\n\nmodule.exports = { getEvenNumbers };`,
      testFileName: 'filter.test.js',
      testCode: `const assert = require('assert');\nconst { getEvenNumbers } = require('./filter.js');\n\ntest('testGetEvenNumbers', () => {\n    const input = [1, 2, 3, 4, 5];\n    assert.deepStrictEqual(getEvenNumbers(input), [2, 4]);\n});\n\ntest('testEmptyArray', () => {\n    assert.deepStrictEqual(getEvenNumbers([]), []);\n});`,
      boundTestExample: 'testGetEvenNumbers',
      naming: {
        starter: 'Any valid JS filename (e.g. filter.js, utils.js)',
        test: 'Must end with .test.js (e.g. filter.test.js, utils.test.js)',
        method: 'The string passed to test() (e.g. test(\'testGetEvenNumbers\', () => {...}))',
      },
      rules: [
        'Test files MUST end with .test.js — the runner only loads files matching this pattern.',
        'You must use the test("name", () => { ... }) syntax to register tests.',
        'Use the built-in assert module (require(\'assert\')) for assertions.',
        'Export your starter functions with module.exports and import them with require() in the test.',
        'The Bound Test name is the exact string passed to test() — e.g. testGetEvenNumbers.',
        'You can also use it("name", () => {...}) as an alias for test().',
      ],
      mistakes: [
        { wrong: 'filter.spec.js', right: 'filter.test.js', why: 'Only .test.js is recognized, not .spec.js.' },
        { wrong: 'describe("suite", () => { it(...) })', right: 'test("testName", () => { ... })', why: 'describe() blocks are not supported — use top-level test() calls.' },
        { wrong: 'expect(x).toBe(y)', right: 'assert.strictEqual(x, y)', why: 'Jest matchers are not available — use Node\'s assert module.' },
      ],
      assertions: [
        { method: 'assert.strictEqual(a, b)', desc: 'a === b' },
        { method: 'assert.deepStrictEqual(a, b)', desc: 'Deep equality (arrays, objects)' },
        { method: 'assert.ok(value)', desc: 'value is truthy' },
        { method: 'assert.throws(() => fn())', desc: 'Expects an exception' },
      ],
      autoDetect: ['Looks for test(\'name\', ...) or it(\'name\', ...) calls', 'Extracts the string argument as the bound test name'],
    },
  };

  const active = langData[activeLang];

  const LanguageTabs = () => (
    <div className="flex gap-2 mb-5 border-b border-gray-800">
      {languages.map((lang) => (
        <button
          key={lang.id}
          onClick={() => setActiveLang(lang.id)}
          className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${
            activeLang === lang.id
              ? 'border-blue-400 text-white'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          {lang.name}
        </button>
      ))}
    </div>
  );

  const nav = [
    { href: '#overview', label: t('docs.tests.navOverview') },
    { href: '#naming', label: t('docs.tests.navNaming') },
    { href: '#rules', label: t('docs.tests.navRules') },
    { href: '#examples', label: t('docs.tests.navExamples') },
    { href: '#bound-test', label: t('docs.tests.navBound') },
    { href: '#assertions', label: t('docs.tests.navAssertions') },
    { href: '#mistakes', label: t('docs.tests.navMistakes') },
  ];

  const overviewItems = [
    { t: t('docs.tests.overviewStarterT'), d: t('docs.tests.overviewStarterD') },
    { t: t('docs.tests.overviewTestT'), d: t('docs.tests.overviewTestD') },
    { t: t('docs.tests.overviewBoundT'), d: t('docs.tests.overviewBoundD') },
  ];

  const boundFormatBlurb = {
    python: t('docs.tests.boundFormatPython'),
    java: t('docs.tests.boundFormatJava'),
    javascript: t('docs.tests.boundFormatJs'),
  }[activeLang];

  const assertionsNote = {
    python: t('docs.tests.assertionsPythonNote'),
    java: t('docs.tests.assertionsJavaNote'),
    javascript: t('docs.tests.assertionsJsNote'),
  }[activeLang];

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 lg:px-12 w-full max-w-5xl mx-auto">
      <nav className="text-xs text-gray-500 mb-4" aria-label="Breadcrumb">
        <Link to="/docs" className="hover:text-gray-300 transition-colors">{t('docs.breadcrumb')}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-300">{t('docs.tests.title')}</span>
      </nav>

      <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
        {t('docs.tests.title')}
      </h1>
      <p className="mt-3 mb-8 text-base text-gray-300 leading-relaxed">
        {t('docs.tests.intro')}
      </p>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 mb-10 text-sm">
        {nav.map((n) => (
          <li key={n.href}>
            <a href={n.href} className="text-blue-400 hover:underline">{n.label}</a>
          </li>
        ))}
      </ul>

      <section id="overview" className="scroll-mt-20 mb-12">
        <h2 className="text-2xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">
          {t('docs.tests.overviewTitle')}
        </h2>
        <p className="text-gray-300 leading-relaxed mb-4">{t('docs.tests.overviewP1')}</p>
        <ul className="list-disc ms-6 space-y-2 text-sm text-gray-300 mb-5">
          {overviewItems.map((it, i) => (
            <li key={i}><strong className="text-white">{it.t}</strong> — {it.d}</li>
          ))}
        </ul>
        <Note kind="info" label="Note">{t('docs.tests.overviewLangsNote')}</Note>
      </section>

      <section id="naming" className="scroll-mt-20 mb-12">
        <h2 className="text-2xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">
          {t('docs.tests.namingTitle')}
        </h2>
        <LanguageTabs />
        <p className="text-gray-300 leading-relaxed mb-4">
          {t('docs.tests.namingIntro', { lang: active.label })}
        </p>
        <table className="w-full text-sm border border-gray-800 mb-5">
          <tbody className="divide-y divide-gray-800">
            <tr>
              <td className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-1/3 align-top">{t('docs.tests.namingStarter')}</td>
              <td className="px-4 py-3 text-gray-200">{active.naming.starter}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider align-top">{t('docs.tests.namingTest')}</td>
              <td className="px-4 py-3 text-gray-200">{active.naming.test}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider align-top">{t('docs.tests.namingMethod')}</td>
              <td className="px-4 py-3 text-gray-200">{active.naming.method}</td>
            </tr>
          </tbody>
        </table>
        {activeLang === 'java' && (
          <Note kind="warning" label="Caution">{t('docs.tests.namingJavaNote')}</Note>
        )}
      </section>

      <section id="rules" className="scroll-mt-20 mb-12">
        <h2 className="text-2xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">
          {t('docs.tests.rulesTitle')}
        </h2>
        <LanguageTabs />
        <p className="text-sm text-gray-400 mb-3">
          <strong className="text-gray-200">{active.label}</strong> — {active.framework}
        </p>
        <ul className="list-disc ms-6 space-y-2 text-sm text-gray-300">
          {active.rules.map((rule, i) => (
            <li key={i}>{rule}</li>
          ))}
        </ul>
      </section>

      <section id="examples" className="scroll-mt-20 mb-12">
        <h2 className="text-2xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">
          {t('docs.tests.examplesTitle')}
        </h2>
        <LanguageTabs />
        <p className="text-gray-300 leading-relaxed mb-4">
          {t('docs.tests.examplesIntro', { lang: active.label })}
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {t('docs.tests.examplesStarterLabel')}
            </p>
            <CodeBlock code={active.starterCode} fileName={active.starterFileName} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {t('docs.tests.examplesTestLabel')}
            </p>
            <CodeBlock code={active.testCode} fileName={active.testFileName} />
          </div>
        </div>
        <Note kind="success" label="Note">{t('docs.tests.examplesNote')}</Note>
      </section>

      <section id="bound-test" className="scroll-mt-20 mb-12">
        <h2 className="text-2xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">
          {t('docs.tests.boundTitle')}
        </h2>
        <p className="text-gray-300 leading-relaxed mb-4">{t('docs.tests.boundP1')}</p>
        <LanguageTabs />
        <h3 className="text-lg font-semibold text-white mb-2">
          {t('docs.tests.boundFormatT', { lang: active.label })}
        </h3>
        <p className="text-sm text-gray-400 mb-2">{boundFormatBlurb}</p>
        <pre className="bg-gray-900 border border-gray-700 rounded px-4 py-2 text-sm font-mono text-blue-300 mb-5 overflow-x-auto">
          {active.boundTestExample}
        </pre>

        <h3 className="text-lg font-semibold text-white mb-2">{t('docs.tests.boundAutoT')}</h3>
        <p className="text-sm text-gray-400 mb-2">{t('docs.tests.boundAutoIntro')}</p>
        <ul className="list-disc ms-6 space-y-1 text-sm text-gray-300 mb-5">
          {active.autoDetect.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>

        <Note kind="warning" label="Important">{t('docs.tests.boundNote')}</Note>
      </section>

      <section id="assertions" className="scroll-mt-20 mb-12">
        <h2 className="text-2xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">
          {t('docs.tests.assertionsTitle')}
        </h2>
        <LanguageTabs />
        <p className="text-gray-300 leading-relaxed mb-4">{t('docs.tests.assertionsIntro')}</p>
        <table className="w-full text-sm border border-gray-800 mb-5">
          <thead className="bg-gray-800/60 text-left">
            <tr>
              <th className="px-4 py-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">{t('docs.tests.assertionsColMethod')}</th>
              <th className="px-4 py-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">{t('docs.tests.assertionsColChecks')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {active.assertions.map((a, i) => (
              <tr key={i}>
                <td className="px-4 py-2"><code className="text-blue-300 text-xs font-mono">{a.method}</code></td>
                <td className="px-4 py-2 text-gray-300 text-sm">{a.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Note kind="info" label="Note">{assertionsNote}</Note>
      </section>

      <section id="mistakes" className="scroll-mt-20 mb-12">
        <h2 className="text-2xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">
          {t('docs.tests.mistakesTitle')}
        </h2>
        <LanguageTabs />
        <p className="text-gray-300 leading-relaxed mb-4">
          {t('docs.tests.mistakesIntro', { lang: active.label })}
        </p>
        <table className="w-full text-sm border border-gray-800 mb-5">
          <thead className="bg-gray-800/60 text-left">
            <tr>
              <th className="px-4 py-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">{t('docs.tests.mistakesWrong')}</th>
              <th className="px-4 py-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">{t('docs.tests.mistakesCorrect')}</th>
              <th className="px-4 py-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">Why</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {active.mistakes.map((m, i) => (
              <tr key={i}>
                <td className="px-4 py-2 font-mono text-xs text-red-300/80 align-top">{m.wrong}</td>
                <td className="px-4 py-2 font-mono text-xs text-emerald-300/80 align-top">{m.right}</td>
                <td className="px-4 py-2 text-gray-400 text-xs align-top">{m.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Note kind="error" label="Important">{t('docs.tests.mistakesNote')}</Note>
      </section>

      <div className="h-8" />
    </div>
  );
}
