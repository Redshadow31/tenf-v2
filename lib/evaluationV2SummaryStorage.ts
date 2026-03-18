import { getStore } from "@netlify/blobs";
import fs from "fs";
import path from "path";

export interface MonthlyEvaluationSummaryRow {
  twitchLogin: string;
  monthKey: string;
  spotlightPoints: number;
  raidsPoints: number;
  discordPoints: number;
  eventsPoints: number;
  networkPoints: number;
  reliabilityPoints: number;
  equityBonus: number;
  staffBonus: number;
  totalBase: number;
  totalBonus: number;
  finalTotal: number;
  status: "ok" | "warning" | "error";
  sourceHealth: {
    hasEvents: boolean;
    hasFollowData: boolean;
    hasDiscordSignals: boolean;
    hasManualOverride: boolean;
    discordSourceUsed?: "primary" | "fallback" | "none";
    discordPrimaryAvailable?: boolean;
    discordFallbackAvailable?: boolean;
    followSourceUsed?: "sheet" | "snapshot" | "none";
    followSheetAvailable?: boolean;
    followSnapshotAvailable?: boolean;
  };
  overriddenFields: string[];
  finalizedAt?: string;
  alerts: string[];
}

interface MonthlySummaryData {
  month: string;
  rows: MonthlyEvaluationSummaryRow[];
  lastUpdated: string;
}

const STORE_NAME = "tenf-evaluation-v2-summary";

function isNetlify(): boolean {
  return typeof getStore === "function" || !!process.env.NETLIFY || !!process.env.NETLIFY_DEV;
}

function fileKey(month: string): string {
  return `${month}/monthly-evaluation-summary.json`;
}

export async function saveMonthlyEvaluationSummary(month: string, rows: MonthlyEvaluationSummaryRow[]): Promise<void> {
  const payload: MonthlySummaryData = {
    month,
    rows,
    lastUpdated: new Date().toISOString(),
  };

  try {
    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      await store.set(fileKey(month), JSON.stringify(payload, null, 2));
      return;
    }

    const dir = path.join(process.cwd(), "data", "evaluation-v2", month);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const localPath = path.join(dir, "monthly-evaluation-summary.json");
    fs.writeFileSync(localPath, JSON.stringify(payload, null, 2), "utf-8");
  } catch (error) {
    console.error(`[EvaluationV2SummaryStorage] Erreur sauvegarde ${month}:`, error);
    throw error;
  }
}

export async function loadMonthlyEvaluationSummary(month: string): Promise<MonthlySummaryData | null> {
  try {
    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      const data = await store.get(fileKey(month), { type: "json" }).catch(() => null);
      return data as MonthlySummaryData | null;
    }

    const localPath = path.join(process.cwd(), "data", "evaluation-v2", month, "monthly-evaluation-summary.json");
    if (!fs.existsSync(localPath)) return null;
    const raw = fs.readFileSync(localPath, "utf-8");
    return JSON.parse(raw) as MonthlySummaryData;
  } catch (error) {
    console.warn(`[EvaluationV2SummaryStorage] Erreur lecture ${month}:`, error);
    return null;
  }
}

