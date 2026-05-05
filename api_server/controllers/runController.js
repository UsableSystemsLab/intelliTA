import crypto from "crypto";
import { sequelize } from "../configs/postgresDB.js";
import { QueryTypes } from "sequelize";
import {
  executeCode,
  DEFAULT_VERSIONS,
  ALLOWED_LANGUAGES,
} from "../services/pistonService.js";

const MAX_PAYLOAD_BYTES = 256 * 1024;
const FILE_NAME_RE = /^[\w\-./]+$/;

function hashFiles(files) {
  const h = crypto.createHash("sha256");
  for (const f of files) {
    h.update(f.name || "");
    h.update("\u0000");
    h.update(f.content || "");
    h.update("\u0001");
  }
  return h.digest("hex");
}

const RunController = {
  async runCode(req, res) {
    try {
      const { courseId, activityId } = req.params;
      const { files, language, version, stdin } = req.body || {};

      if (!Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: "files must be a non-empty array" });
      }

      let totalBytes = 0;
      for (const f of files) {
        if (!f || typeof f.name !== "string" || typeof f.content !== "string") {
          return res.status(400).json({ error: "Each file must have name and content strings" });
        }
        if (!FILE_NAME_RE.test(f.name)) {
          return res.status(400).json({ error: `Invalid file name: ${f.name}` });
        }
        totalBytes += Buffer.byteLength(f.content, "utf8");
      }
      if (totalBytes > MAX_PAYLOAD_BYTES) {
        return res.status(413).json({ error: "Code payload too large (max 256KB)" });
      }

      if (typeof language !== "string" || !ALLOWED_LANGUAGES.has(language)) {
        return res.status(400).json({
          error: `Unsupported language. Allowed: ${[...ALLOWED_LANGUAGES].join(", ")}`,
        });
      }

      if (stdin != null && typeof stdin !== "string") {
        return res.status(400).json({ error: "stdin must be a string" });
      }

      const resolvedVersion = typeof version === "string" && version
        ? version
        : DEFAULT_VERSIONS[language];

      const startedAt = Date.now();
      let result;
      try {
        result = await executeCode({
          language,
          version: resolvedVersion,
          files,
          stdin: stdin || "",
        });
      } catch (err) {
        const status = err.status || 503;
        const message = status === 503
          ? "Code runner unavailable — try again shortly"
          : err.message || "Code execution failed";
        return res.status(status).json({ error: message });
      }
      const durationMs = Date.now() - startedAt;

      const codeHash = hashFiles(files);
      const uid = req.firebaseUser?.uid;

      sequelize
        .query(
          `INSERT INTO code_runs
            (firebase_uid, course_id, activity_id, language, version,
             exit_code, signal, duration_ms, stdout_bytes, stderr_bytes, code_hash)
           VALUES (:uid, :courseId, :activityId, :language, :version,
             :exitCode, :signal, :durationMs, :stdoutBytes, :stderrBytes, :codeHash)`,
          {
            type: QueryTypes.INSERT,
            replacements: {
              uid,
              courseId: Number.isFinite(Number(courseId)) ? Number(courseId) : null,
              activityId: Number.isFinite(Number(activityId)) ? Number(activityId) : null,
              language,
              version: resolvedVersion,
              exitCode: result.exitCode,
              signal: result.signal,
              durationMs,
              stdoutBytes: Buffer.byteLength(result.stdout, "utf8"),
              stderrBytes: Buffer.byteLength(result.stderr, "utf8"),
              codeHash,
            },
          }
        )
        .catch((e) => console.error("[runController] audit insert failed:", e.message));

      return res.status(200).json({
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        signal: result.signal,
        compileStdout: result.compileStdout,
        compileStderr: result.compileStderr,
        language: result.language,
        version: result.version,
        durationMs,
      });
    } catch (err) {
      console.error("[runController] error:", err);
      return res.status(500).json({ error: "Internal error" });
    }
  },
};

export default RunController;
