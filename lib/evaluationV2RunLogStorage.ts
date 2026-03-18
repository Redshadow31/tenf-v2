import { getStore } from "@netlify/blobs";
import fs from "fs";
import path from "path";

export type EvaluationV2System = "legacy" | "new";

export interface EvaluationV2RunLogEntry {
  id: string;
  month: string;
  system: EvaluationV2System;
  runAt: string;
  trigger: "auto_result_refresh" | "manual_action";
  triggeredBy?: string;
  triggeredByUsername?: string;
  summary: {
    rowsCount: number;
    newRows: number;
    removedRows: number;
    changedRows: number;
    avgFinalDelta: number;
    maxFinalDelta: number;
  };
  note?: string;
}

interface EvaluationV2RunLogsFile {
  month: string;
  system: EvaluationV2System;
  updatedAt: string;
  logs: EvaluationV2RunLogEntry[];
}

const STORE_NAME = "tenf-evaluation-v2-summary";
const MAX_LOGS = 200;

function isNetlify(): boolean {
  return typeof getStore === "function" || !!process.env.NETLIFY || !!process.env.NETLIFY_DEV;
}

function fileKey(month: string, system: EvaluationV2System): string {
  return `${month}/${system}/run-logs.json`;
}

export async function loadEvaluationV2RunLogs(month: string, system: EvaluationV2System): Promise<EvaluationV2RunLogEntry[]> {
  try {
    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      const data = await store.get(fileKey(month, system), { type: "json" }).catch(() => null);
      const file = data as EvaluationV2RunLogsFile | null;
      return Array.isArray(file?.logs) ? file.logs : [];
    }

    const localPath = path.join(process.cwd(), "data", "evaluation-v2", month, system, "run-logs.json");
    if (!fs.existsSync(localPath)) return [];
    const raw = fs.readFileSync(localPath, "utf-8");
    const parsed = JSON.parse(raw) as EvaluationV2RunLogsFile;
    return Array.isArray(parsed.logs) ? parsed.logs : [];
  } catch (error) {
    console.warn(`[EvaluationV2RunLogStorage] Erreur lecture ${month}/${system}:`, error);
    return [];
  }
}

export async function appendEvaluationV2RunLog(
  month: string,
  system: EvaluationV2System,
  entry: EvaluationV2RunLogEntry,
): Promise<void> {
  try {
    const current = await loadEvaluationV2RunLogs(month, system);
    const logs = [entry, ...current].slice(0, MAX_LOGS);
    const payload: EvaluationV2RunLogsFile = {
      month,
      system,
      updatedAt: new Date().toISOString(),
      logs,
    };

    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      await store.set(fileKey(month, system), JSON.stringify(payload, null, 2));
      return;
    }

    const dir = path.join(process.cwd(), "data", "evaluation-v2", month, system);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const localPath = path.join(dir, "run-logs.json");
    fs.writeFileSync(localPath, JSON.stringify(payload, null, 2), "utf-8");
  } catch (error) {
    console.error(`[EvaluationV2RunLogStorage] Erreur append ${month}/${system}:`, error);
    throw error;
  }
}
