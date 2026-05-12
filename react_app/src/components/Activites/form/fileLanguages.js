// allowed languages 
export const FILE_LANGUAGES = [
  { id: "java",       label: "Java",       extension: "java", monaco: "java" },
  { id: "python",     label: "Python",     extension: "py",   monaco: "python" },
  { id: "javascript", label: "JavaScript", extension: "js",   monaco: "javascript" },
  { id: "css",        label: "CSS",        extension: "css",  monaco: "css" },
  { id: "html",       label: "HTML",       extension: "html", monaco: "html" },
];

export const OTHER_LANGUAGE = { id: "other", label: "Other", extension: null, monaco: "plaintext" };

// Languages that can run as the activity's tests_language (Piston runtimes).
export const TESTS_LANGUAGES = [
  { id: "python",     label: "Python",     runtime: "python:3.10.0" },
  { id: "javascript", label: "JavaScript", runtime: "javascript:18.15.0" },
  { id: "java",       label: "Java",       runtime: "java:15.0.2" },
];

export const TEST_TEMPLATES = {
  python: [
    {
      path: "test_main.py",
      content: `import unittest

# Import the student's module here once they've written it.
# from main import add

class MainTest(unittest.TestCase):
    def test_example(self):
        # self.assertEqual(add(2, 2), 4)
        self.assertEqual(2 + 2, 4)
`,
    },
  ],
  javascript: [
    {
      path: "main.test.js",
      content: `// Use the global test('name', fn) helper. Throw to fail.
// const { add } = require("./main");

test("example", () => {
    // if (add(2, 2) !== 4) throw new Error("expected 4");
    if (2 + 2 !== 4) throw new Error("expected 4");
});
`,
    },
  ],
  java: [
    {
      path: "MainTest.java",
      content: `// Public methods on a public class are invoked by reflection.
// Throw any exception to fail the test.
public class MainTest {
    public void test_example() {
        // if (Main.add(2, 2) != 4) throw new RuntimeException("expected 4");
        if (2 + 2 != 4) throw new RuntimeException("expected 4");
    }
}
`,
    },
  ],
};

export function detectLanguageFromFilename(name) {
  const ext = (name || "").split(".").pop()?.toLowerCase();
  const match = FILE_LANGUAGES.find((l) => l.extension === ext);
  return match ? match.id : OTHER_LANGUAGE.id;
}

export function monacoLanguageFromFilename(name) {
  const ext = (name || "").split(".").pop()?.toLowerCase();
  const match = FILE_LANGUAGES.find((l) => l.extension === ext);
  return match ? match.monaco : "plaintext";
}
