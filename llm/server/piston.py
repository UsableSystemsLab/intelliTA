"""Piston adapter — runs a single named test against student code in the sandbox.

Each supported language has a runtime, a runner template, and an output parser.
The runner is a small entry-point file that locates the named test inside the
provided test files and exits 0 on pass, 1 on fail, 2 on "test not found".

Piston does not ship pytest/jest/JUnit, so the runners use stdlib only:
- Python: unittest discovery + filter by method name
- JavaScript: a minimal test('name', fn) global registered before requiring tests
- Java:    reflection-based runner that invokes a public void method by name
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

import httpx

from config import PISTON_URL

logger = logging.getLogger("uvicorn")


PYTHON_RUNNER = r'''
import sys, unittest

target_name = sys.argv[1] if len(sys.argv) > 1 else ""
loader = unittest.TestLoader()
discovered = loader.discover(".", pattern="test_*.py")

def find(node, name):
    if isinstance(node, unittest.TestSuite):
        for child in node:
            hit = find(child, name)
            if hit is not None:
                return hit
        return None
    if getattr(node, "_testMethodName", None) == name:
        return node
    return None

target = find(discovered, target_name)
if target is None:
    print(f"ERROR: test '{target_name}' not found", file=sys.stderr)
    sys.exit(2)

suite = unittest.TestSuite([target])
result = unittest.TextTestRunner(verbosity=2).run(suite)
sys.exit(0 if result.wasSuccessful() else 1)
'''.lstrip()


JS_RUNNER = r'''
const fs = require("fs");
const path = require("path");

const _registry = {};
global.test = (name, fn) => { _registry[name] = fn; };
global.it = global.test;

const target = process.argv[2] || "";

for (const entry of fs.readdirSync(".")) {
    if (entry.endsWith(".test.js")) {
        require(path.resolve(entry));
    }
}

const fn = _registry[target];
if (!fn) {
    console.error(`ERROR: test '${target}' not found`);
    process.exit(2);
}

(async () => {
    try {
        await fn();
        console.log(`PASS: ${target}`);
        process.exit(0);
    } catch (err) {
        console.error(err && err.stack ? err.stack : String(err));
        process.exit(1);
    }
})();
'''.lstrip()


def _make_java_runner(test_class: str, test_name: str) -> str:
    """Generate a Java entry point that compiles other files in-memory and calls the test.

    Piston's nsjail environment blocks subprocess creation (SIGKILL), so we use the
    ToolProvider.getSystemJavaCompiler() API to compile the student and test files
    within the same JVM process, then use reflection to run the test.
    """
    return f"""import javax.tools.JavaCompiler;
import javax.tools.ToolProvider;
import java.io.File;
import java.lang.reflect.Method;

public class TestRunner {{
    public static void main(String[] args) throws Exception {{
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) {{
            System.err.println("No JavaCompiler found!");
            System.exit(1);
        }}
        
        File dir = new File(".");
        File[] files = dir.listFiles((d, name) -> name.endsWith(".java") && !name.equals("TestRunner.java"));
        if (files != null && files.length > 0) {{
            String[] filePaths = new String[files.length];
            for (int i = 0; i < files.length; i++) {{
                filePaths[i] = files[i].getAbsolutePath();
            }}
            int res = compiler.run(null, null, null, filePaths);
            if (res != 0) {{
                System.err.println("Compilation failed");
                System.exit(1);
            }}
        }}
        
        Class<?> cls = Class.forName("{test_class}");
        Object instance = cls.getDeclaredConstructor().newInstance();
        Method m = cls.getMethod("{test_name}");
        m.invoke(instance);
        System.out.println("PASS: {test_class}#{test_name}");
    }}
}}
"""


@dataclass(frozen=True)
class LanguageSpec:
    runtime: str
    version: str
    runner_filename: str
    runner_source: str
    # args passed to Piston's run; {test_name} is substituted, plus optional {class_name}
    args_template: list[str]


LANGUAGES: dict[str, LanguageSpec] = {
    "python": LanguageSpec(
        runtime="python",
        version="3.10.0",
        runner_filename="runner.py",
        runner_source=PYTHON_RUNNER,
        args_template=["{test_name}"],
    ),
    "javascript": LanguageSpec(
        runtime="javascript",
        version="18.15.0",
        runner_filename="runner.js",
        runner_source=JS_RUNNER,
        args_template=["{test_name}"],
    ),
    "java": LanguageSpec(
        runtime="java",
        version="15.0.2",
        runner_filename="TestRunner",  # Piston's Java compile script appends .java
        runner_source="",  # generated dynamically by _make_java_runner()
        args_template=[],
    ),
}


@dataclass
class TestRunResult:
    passed: bool
    output: str  # combined stdout+stderr, truncated upstream
    not_found: bool = False


def _flatten_filename(path: str) -> str:
    """Piston puts every file in one working dir, so deep paths get flattened.

    'tests/test_main.py' -> 'test_main.py'. Test discovery in the runners
    walks the working dir, so the original directory structure isn't needed.
    """
    return path.replace("\\", "/").rsplit("/", 1)[-1]


def _build_files(
    spec: LanguageSpec,
    test_files: list[dict],
    student_files: list[dict],
    test_class: Optional[str] = None,
    test_name: Optional[str] = None,
) -> list[dict]:
    """Build the files array for Piston. Runner first so Piston runs it."""
    seen: set[str] = set()

    if spec.runtime == "java" and test_class and test_name:
        runner_content = _make_java_runner(test_class, test_name)
    else:
        runner_content = spec.runner_source

    out: list[dict] = [{"name": spec.runner_filename, "content": runner_content}]
    seen.add(spec.runner_filename)

    for source in (test_files, student_files):
        for f in source:
            name = _flatten_filename(f.get("path") or f.get("name") or "")
            if not name or name in seen:
                continue
            out.append({"name": name, "content": f.get("content", "")})
            seen.add(name)

    return out


async def run_bound_test(
    language: str,
    test_files: list[dict],
    student_files: list[dict],
    test_name: str,
    test_class: Optional[str] = None,
    run_timeout_ms: int = 10000,
) -> TestRunResult:
    """Execute the named test in Piston. Returns pass/fail + captured output."""
    spec = LANGUAGES.get(language)
    if spec is None:
        return TestRunResult(passed=False, output=f"Unsupported language: {language}")

    args = []
    for tmpl in spec.args_template:
        args.append(tmpl.format(test_name=test_name, class_name=test_class or ""))

    payload = {
        "language": spec.runtime,
        "version": spec.version,
        "files": _build_files(spec, test_files, student_files, test_class, test_name),
        "args": args,
        "stdin": "",
        "compile_timeout": 10000,
        "run_timeout": run_timeout_ms,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(f"{PISTON_URL}/api/v2/execute", json=payload)
            if resp.status_code >= 400:
                body = resp.text
                logger.error(f"Piston {resp.status_code}: {body}")
                return TestRunResult(passed=False, output=f"[piston {resp.status_code}] {body}")
            data = resp.json()
    except Exception as e:
        logger.error(f"Piston call failed: {e}")
        return TestRunResult(passed=False, output=f"[piston unavailable] {e}")

    # Compilation stage (Java, compiled languages). If compile failed, run is
    # empty/null and we'd get "(no output)" — capture the compiler error instead.
    compile_info = data.get("compile") or {}
    compile_code = compile_info.get("code")
    if compile_code is not None and compile_code != 0:
        c_out = compile_info.get("stdout", "") or ""
        c_err = compile_info.get("stderr", "") or ""
        compile_combined = (c_out + ("\n" if c_out and c_err else "") + c_err).strip()
        return TestRunResult(
            passed=False,
            output=f"[compile error]\n{compile_combined}".strip(),
        )

    run = data.get("run") or {}
    code = run.get("code")
    signal = run.get("signal")
    stdout = run.get("stdout", "") or ""
    stderr = run.get("stderr", "") or ""
    combined = (stdout + ("\n" if stdout and stderr else "") + stderr).strip()

    if signal:
        combined = f"[killed by signal {signal}]\n{combined}".strip()
        return TestRunResult(passed=False, output=combined)

    if code == 2:
        return TestRunResult(passed=False, output=combined or "test not found", not_found=True)

    return TestRunResult(passed=(code == 0), output=combined)
