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

  const fullExamples = {
    python: {
      starterFileName: 'calculator.py',
      starterCode: `def add(a, b):\n    # TODO: return the sum\n    return 0\n\ndef subtract(a, b):\n    # TODO: return the difference\n    return 0`,
      testFileName: 'test_calculator.py',
      testCode: `import unittest\nfrom calculator import add, subtract\n\nclass TestCalculator(unittest.TestCase):\n    def test_add(self):\n        self.assertEqual(add(2, 3), 5)\n        self.assertEqual(add(-1, 1), 0)\n\n    def test_subtract(self):\n        self.assertEqual(subtract(10, 4), 6)\n        self.assertEqual(subtract(0, 5), -5)`,
      checkpoints: [
        { time: '01:30', boundTest: 'test_add', prompt: 'Implement the add function to return a + b.' },
        { time: '03:00', boundTest: 'test_subtract', prompt: 'Implement the subtract function to return a - b.' },
      ],
      rules: [
        'Test files must start with test_ (e.g. test_calculator.py)',
        'Use import unittest and extend unittest.TestCase',
        'Bound test name = method name (e.g. test_add)',
      ],
    },
    java: {
      starterFileName: 'Calculator.java',
      starterCode: `public class Calculator {\n\n    public static int add(int a, int b) {\n        // TODO: return the sum\n        return 0;\n    }\n\n    public static int subtract(int a, int b) {\n        // TODO: return the difference\n        return 0;\n    }\n}`,
      testFileName: 'CalculatorTest.java',
      testCode: `public class CalculatorTest {\n\n    public void testAdd() {\n        int result = Calculator.add(2, 3);\n        if (result != 5)\n            throw new RuntimeException("Expected 5 but got " + result);\n    }\n\n    public void testSubtract() {\n        int result = Calculator.subtract(10, 4);\n        if (result != 6)\n            throw new RuntimeException("Expected 6 but got " + result);\n    }\n}`,
      checkpoints: [
        { time: '01:30', boundTest: 'CalculatorTest#testAdd', prompt: 'Implement the add method to return a + b.' },
        { time: '03:00', boundTest: 'CalculatorTest#testSubtract', prompt: 'Implement the subtract method to return a - b.' },
      ],
      rules: [
        'File name must match class name (Calculator.java for public class Calculator)',
        'No testing framework needed — throw RuntimeException on failure',
        'Bound test name = ClassName#methodName (e.g. CalculatorTest#testAdd)',
      ],
    },
    javascript: {
      starterFileName: 'calculator.js',
      starterCode: `function add(a, b) {\n    // TODO: return the sum\n    return 0;\n}\n\nfunction subtract(a, b) {\n    // TODO: return the difference\n    return 0;\n}\n\nmodule.exports = { add, subtract };`,
      testFileName: 'calculator.test.js',
      testCode: `const assert = require('assert');\nconst { add, subtract } = require('./calculator.js');\n\ntest('testAdd', () => {\n    assert.strictEqual(add(2, 3), 5);\n    assert.strictEqual(add(-1, 1), 0);\n});\n\ntest('testSubtract', () => {\n    assert.strictEqual(subtract(10, 4), 6);\n    assert.strictEqual(subtract(0, 5), -5);\n});`,
      checkpoints: [
        { time: '01:30', boundTest: 'testAdd', prompt: 'Implement the add function to return a + b.' },
        { time: '03:00', boundTest: 'testSubtract', prompt: 'Implement the subtract function to return a - b.' },
      ],
      rules: [
        'Test files must end with .test.js (e.g. calculator.test.js)',
        'Use test("name", () => { ... }) syntax with assert module',
        'Bound test name = the string in test() (e.g. testAdd)',
      ],
    },
  };

  const activeExample = fullExamples[activeLang];
  const langLabel = languages.find((l) => l.id === activeLang)?.name;

  const nav = [
    { href: '#concept', label: t('docs.labs.navConcept') },
    { href: '#flow', label: t('docs.labs.navFlow') },
    { href: '#creation', label: t('docs.labs.navCreation') },
    { href: '#checkpoints', label: t('docs.labs.navCheckpoints') },
    { href: '#tests', label: t('docs.labs.navTests') },
    { href: '#hints', label: t('docs.labs.navHints') },
    { href: '#example', label: t('docs.labs.navExample') },
  ];

  const conceptItems = [
    { t: t('docs.labs.conceptVideo'), d: t('docs.labs.conceptVideoD') },
    { t: t('docs.labs.conceptStarter'), d: t('docs.labs.conceptStarterD') },
    { t: t('docs.labs.conceptTests'), d: t('docs.labs.conceptTestsD') },
    { t: t('docs.labs.conceptCheckpoints'), d: t('docs.labs.conceptCheckpointsD') },
  ];

  const flowSteps = [
    { t: t('docs.labs.flowS1T'), d: t('docs.labs.flowS1D') },
    { t: t('docs.labs.flowS2T'), d: t('docs.labs.flowS2D') },
    { t: t('docs.labs.flowS3T'), d: t('docs.labs.flowS3D') },
    { t: t('docs.labs.flowS4T'), d: t('docs.labs.flowS4D') },
    { t: t('docs.labs.flowS5T'), d: t('docs.labs.flowS5D') },
    { t: t('docs.labs.flowS6T'), d: t('docs.labs.flowS6D') },
  ];

  const checkpointTypes = [
    { t: t('docs.labs.cpMcqT'), d: t('docs.labs.cpMcqD'), e: t('docs.labs.cpMcqE') },
    { t: t('docs.labs.cpTfT'), d: t('docs.labs.cpTfD'), e: t('docs.labs.cpTfE') },
    { t: t('docs.labs.cpFillT'), d: t('docs.labs.cpFillD'), e: t('docs.labs.cpFillE') },
    { t: t('docs.labs.cpCodingT'), d: t('docs.labs.cpCodingD'), e: t('docs.labs.cpCodingE') },
  ];

  const hintsSteps = [
    { t: t('docs.labs.hintsS1T'), d: t('docs.labs.hintsS1D') },
    { t: t('docs.labs.hintsS2T'), d: t('docs.labs.hintsS2D') },
    { t: t('docs.labs.hintsS3T'), d: t('docs.labs.hintsS3D') },
    { t: t('docs.labs.hintsS4T'), d: t('docs.labs.hintsS4D') },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 lg:px-12 w-full max-w-5xl mx-auto">
      <nav className="text-xs text-gray-500 mb-4" aria-label="Breadcrumb">
        <Link to="/docs" className="hover:text-gray-300 transition-colors">{t('docs.breadcrumb')}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-300">{t('docs.labs.title')}</span>
      </nav>

      <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
        {t('docs.labs.title')}
      </h1>
      <p className="mt-3 mb-8 text-base text-gray-300 leading-relaxed">
        {t('docs.labs.intro')}
      </p>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 mb-10 text-sm">
        {nav.map((n) => (
          <li key={n.href}>
            <a href={n.href} className="text-blue-400 hover:underline">{n.label}</a>
          </li>
        ))}
      </ul>

      <section id="concept" className="scroll-mt-20 mb-12">
        <h2 className="text-2xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">
          {t('docs.labs.conceptTitle')}
        </h2>
        <p className="text-gray-300 leading-relaxed mb-3">{t('docs.labs.conceptP1')}</p>
        <p className="text-gray-300 leading-relaxed mb-3">{t('docs.labs.conceptP2')}</p>
        <ul className="list-disc ms-6 space-y-2 text-sm text-gray-300">
          {conceptItems.map((c, i) => (
            <li key={i}><strong className="text-white">{c.t}</strong> — {c.d}</li>
          ))}
        </ul>
      </section>

      <section id="flow" className="scroll-mt-20 mb-12">
        <h2 className="text-2xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">
          {t('docs.labs.flowTitle')}
        </h2>
        <p className="text-gray-300 leading-relaxed mb-4">{t('docs.labs.flowIntro')}</p>
        <ol className="list-decimal ms-6 space-y-3 text-sm text-gray-300">
          {flowSteps.map((s, i) => (
            <li key={i}>
              <p className="font-semibold text-white">{s.t}</p>
              <p className="text-gray-400 mt-1 leading-relaxed">{s.d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-5">
          <Note kind="info" label="Note">{t('docs.labs.flowSkipNote')}</Note>
        </div>
      </section>

      <section id="creation" className="scroll-mt-20 mb-12">
        <h2 className="text-2xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">
          {t('docs.labs.creationTitle')}
        </h2>
        <p className="text-gray-300 leading-relaxed mb-5">{t('docs.labs.creationIntro')}</p>

        <h3 className="text-lg font-semibold text-white mt-6 mb-2">1. {t('docs.labs.creationS1T')}</h3>
        <p className="text-sm text-gray-300 leading-relaxed mb-3">{t('docs.labs.creationS1P')}</p>
        <Note kind="info" label="Note">{t('docs.labs.creationS1Note')}</Note>

        <h3 className="text-lg font-semibold text-white mt-6 mb-2">2. {t('docs.labs.creationS2T')}</h3>
        <p className="text-sm text-gray-300 leading-relaxed">{t('docs.labs.creationS2P')}</p>

        <h3 className="text-lg font-semibold text-white mt-6 mb-2">3. {t('docs.labs.creationS3T')}</h3>
        <p className="text-sm text-gray-300 leading-relaxed mb-3">{t('docs.labs.creationS3P')}</p>
        <Note kind="warning" label="Important">{t('docs.labs.creationS3Note')}</Note>

        <h3 className="text-lg font-semibold text-white mt-6 mb-2">4. {t('docs.labs.creationS4T')}</h3>
        <p className="text-sm text-gray-300 leading-relaxed mb-2">{t('docs.labs.creationS4P')}</p>
        <ul className="list-disc ms-6 space-y-1 text-sm text-gray-300">
          <li>{t('docs.labs.creationS4L1')}</li>
          <li>{t('docs.labs.creationS4L2')}</li>
          <li>{t('docs.labs.creationS4L3')}</li>
          <li>{t('docs.labs.creationS4L4')}</li>
        </ul>

        <h3 className="text-lg font-semibold text-white mt-6 mb-2">5. {t('docs.labs.creationS5T')}</h3>
        <p className="text-sm text-gray-300 leading-relaxed">{t('docs.labs.creationS5P')}</p>
      </section>

      <section id="checkpoints" className="scroll-mt-20 mb-12">
        <h2 className="text-2xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">
          {t('docs.labs.checkpointsTitle')}
        </h2>
        <table className="w-full text-sm border border-gray-800">
          <thead className="bg-gray-800/60 text-left">
            <tr>
              <th className="px-4 py-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">Type</th>
              <th className="px-4 py-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">Description</th>
              <th className="px-4 py-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">Example</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {checkpointTypes.map((c, i) => (
              <tr key={i}>
                <td className="px-4 py-3 font-semibold text-white align-top">{c.t}</td>
                <td className="px-4 py-3 text-gray-300 align-top">{c.d}</td>
                <td className="px-4 py-3 text-gray-400 italic align-top">{c.e}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-5">
          <Note kind="success" label="Tip">{t('docs.labs.cpMixNote')}</Note>
        </div>
      </section>

      <section id="tests" className="scroll-mt-20 mb-12">
        <h2 className="text-2xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">
          {t('docs.labs.testsTitle')}
        </h2>
        <p className="text-gray-300 leading-relaxed mb-4">{t('docs.labs.testsIntro')}</p>

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

        <h3 className="text-lg font-semibold text-white mb-2">
          {t('docs.labs.testsRulesLabel', { lang: langLabel })}
        </h3>
        <ul className="list-disc ms-6 space-y-1 text-sm text-gray-300 mb-5">
          {activeExample.rules.map((rule, i) => (
            <li key={i}>{rule}</li>
          ))}
        </ul>

        <CodeBlock code={activeExample.testCode} fileName={activeExample.testFileName} />

        <div className="mt-5">
          <Note kind="warning" label="Important">{t('docs.labs.testsBoundNote')}</Note>
        </div>
      </section>

      <section id="hints" className="scroll-mt-20 mb-12">
        <h2 className="text-2xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">
          {t('docs.labs.hintsTitle')}
        </h2>
        <p className="text-gray-300 leading-relaxed mb-4">{t('docs.labs.hintsIntro')}</p>
        <ol className="list-decimal ms-6 space-y-3 text-sm text-gray-300">
          {hintsSteps.map((s, i) => (
            <li key={i}>
              <p className="font-semibold text-white">{s.t}</p>
              <p className="text-gray-400 mt-1 leading-relaxed">{s.d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-5">
          <Note kind="success" label="Tip">{t('docs.labs.hintsNote')}</Note>
        </div>
      </section>

      <section id="example" className="scroll-mt-20 mb-12">
        <h2 className="text-2xl font-semibold text-white mb-3 border-b border-gray-800 pb-2">
          {t('docs.labs.exampleTitle')}
        </h2>
        <p className="text-gray-300 leading-relaxed mb-4">{t('docs.labs.exampleIntro')}</p>

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          <CodeBlock code={activeExample.starterCode} fileName={activeExample.starterFileName} />
          <CodeBlock code={activeExample.testCode} fileName={activeExample.testFileName} />
        </div>

        <h3 className="text-lg font-semibold text-white mb-3">{t('docs.labs.exampleCheckpoints')}</h3>
        <table className="w-full text-sm border border-gray-800 mb-5">
          <thead className="bg-gray-800/60 text-left">
            <tr>
              <th className="px-4 py-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">#</th>
              <th className="px-4 py-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">Time</th>
              <th className="px-4 py-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">Bound Test</th>
              <th className="px-4 py-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">Prompt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {activeExample.checkpoints.map((cp, i) => (
              <tr key={i}>
                <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                <td className="px-4 py-2 font-mono text-xs text-gray-300">{cp.time}</td>
                <td className="px-4 py-2 font-mono text-xs text-blue-300">{cp.boundTest}</td>
                <td className="px-4 py-2 text-gray-300">{cp.prompt}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <Note kind="info" label="Note">{t('docs.labs.exampleNote')}</Note>
      </section>

      <div className="h-8" />
    </div>
  );
}
