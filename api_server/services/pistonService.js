const PISTON_URL = process.env.PISTON_URL;
if (!PISTON_URL) {
  throw new Error("PISTON_URL env var is not set. Configure it in .env / .env.prod.");
}

const DEFAULT_VERSIONS = {
  python: "3.10.0",
  javascript: "18.15.0",
  java: "15.0.2",
};

const ALLOWED_LANGUAGES = new Set(Object.keys(DEFAULT_VERSIONS));

const COMPILE_TIMEOUT_MS = 3000;
const RUN_TIMEOUT_MS = 3000;
const OUTPUT_TRUNCATE_BYTES = 50 * 1024;

function truncate(str) {
  if (typeof str !== "string") return "";
  if (str.length <= OUTPUT_TRUNCATE_BYTES) return str;
  return str.slice(0, OUTPUT_TRUNCATE_BYTES) + "\n…[truncated]";
}

async function executeCode({ language, version, files, stdin = "" }) {
  const resp = await fetch(`${PISTON_URL}/api/v2/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language,
      version,
      files,
      stdin,
      compile_timeout: COMPILE_TIMEOUT_MS,
      run_timeout: RUN_TIMEOUT_MS,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    const err = new Error(`Piston returned ${resp.status}: ${body}`);
    err.status = resp.status >= 400 && resp.status < 500 ? 400 : 503;
    throw err;
  }

  const data = await resp.json();
  const run = data.run || {};
  const compile = data.compile || {};

  return {
    stdout: truncate(run.stdout || ""),
    stderr: truncate(run.stderr || ""),
    exitCode: typeof run.code === "number" ? run.code : null,
    signal: run.signal || null,
    compileStdout: truncate(compile.stdout || ""),
    compileStderr: truncate(compile.stderr || ""),
    language: data.language,
    version: data.version,
  };
}

export {
  executeCode,
  DEFAULT_VERSIONS,
  ALLOWED_LANGUAGES,
};
