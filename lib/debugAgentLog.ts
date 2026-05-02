import fs from "fs";
import path from "path";

const DEBUG_LOG_FILENAME = "debug-aba714.log";
const INGEST_URL =
  "http://127.0.0.1:7628/ingest/6e55a477-f0d0-4f0f-86c5-aae2772a37a8";

/** NDJSON local + envoi ingest Cursor (si disponible). Pas de secrets / PII. */
export function debugAgentLog(entry: {
  location: string;
  message: string;
  data?: Record<string, unknown>;
  hypothesisId?: string;
  runId?: string;
}): void {
  const payload = {
    sessionId: "aba714",
    timestamp: Date.now(),
    ...entry,
  };
  const line = JSON.stringify(payload);
  try {
    fs.appendFileSync(
      path.join(process.cwd(), DEBUG_LOG_FILENAME),
      `${line}\n`,
      "utf8",
    );
  } catch {
    /* ignore */
  }
  fetch(INGEST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "aba714",
    },
    body: line,
  }).catch(() => {});
}
