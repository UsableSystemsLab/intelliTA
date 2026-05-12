// Idempotently install required Piston language runtimes.
// Reads PISTON_URL and PISTON_LANGS (space-separated lang:version pairs) from env.
// Uses Node.js stdlib only — runs inside the Piston image with no extra deps.

const http = require("http");

const PISTON_URL = (process.env.PISTON_URL || "").replace(/\/$/, "");
const RAW_LANGS = (process.env.PISTON_LANGS || "").trim();

function fail(msg) {
    console.error(`[piston-init] ERROR: ${msg}`);
    process.exit(1);
}

if (!PISTON_URL) fail("PISTON_URL env var is empty.");
if (!RAW_LANGS) {
    fail('PISTON_LANGS env var is empty. Example: "python:3.10.0 javascript:18.15.0 java:15.0.2".');
}

const targets = RAW_LANGS.split(/\s+/).filter(Boolean).map((entry) => {
    const idx = entry.indexOf(":");
    if (idx === -1) fail(`Invalid PISTON_LANGS entry '${entry}'. Expected lang:version.`);
    return { language: entry.slice(0, idx).trim(), version: entry.slice(idx + 1).trim() };
});

function request(method, urlString, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlString);
        const req = http.request(
            {
                method,
                hostname: url.hostname,
                port: url.port || 80,
                path: url.pathname + url.search,
                headers: body ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } : {},
                timeout: 600000,
            },
            (res) => {
                const chunks = [];
                res.on("data", (c) => chunks.push(c));
                res.on("end", () => {
                    const text = Buffer.concat(chunks).toString("utf8");
                    resolve({ status: res.statusCode, body: text });
                });
            }
        );
        req.on("error", reject);
        req.on("timeout", () => req.destroy(new Error("request timeout")));
        if (body) req.write(body);
        req.end();
    });
}

async function waitForApi(timeoutMs = 120000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            const res = await request("GET", `${PISTON_URL}/api/v2/runtimes`);
            if (res.status === 200) return JSON.parse(res.body);
        } catch (_) { /* keep polling */ }
        await new Promise((r) => setTimeout(r, 2000));
    }
    return null;
}

(async () => {
    console.log(`[piston-init] Target: ${PISTON_URL}`);
    console.log(`[piston-init] Languages:`, targets);
    console.log("[piston-init] Waiting for Piston API...");

    const installed = await waitForApi();
    if (!installed) fail("Timed out waiting for Piston API.");

    const have = new Set(installed.map((r) => `${r.language}:${r.version}`));

    for (const { language, version } of targets) {
        const key = `${language}:${version}`;
        if (have.has(key)) {
            console.log(`[piston-init] ${key} already installed, skipping.`);
            continue;
        }
        console.log(`[piston-init] Installing ${key}...`);
        try {
            const res = await request("POST", `${PISTON_URL}/api/v2/packages`, JSON.stringify({ language, version }));
            if (res.status >= 200 && res.status < 300) {
                console.log(`[piston-init] Installed ${key}.`);
            } else {
                console.warn(`[piston-init] WARN: ${key} returned ${res.status}: ${res.body}`);
            }
        } catch (err) {
            console.warn(`[piston-init] WARN: failed to install ${key}: ${err.message}`);
        }
    }

    console.log("[piston-init] Done.");
})();
