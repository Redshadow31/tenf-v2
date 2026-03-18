import { getStore } from "@netlify/blobs";
import fs from "fs";
import path from "path";

export type EvaluationEvidenceType =
  | "raid"
  | "spotlight"
  | "event"
  | "discord_text"
  | "discord_voice"
  | "follow"
  | "network_participation"
  | "mod_action";

export type EvaluationEvidenceStatus = "pending" | "validated" | "rejected" | "auto_validated";

export interface EvaluationEvidence {
  memberId: string;
  monthKey: string;
  type: EvaluationEvidenceType;
  source: string;
  timestamp: string;
  value: number;
  metadata?: Record<string, unknown>;
  validatedBy?: string;
  status: EvaluationEvidenceStatus;
}

interface EvaluationEvidenceData {
  month: string;
  evidences: EvaluationEvidence[];
  lastUpdated: string;
}

const STORE_NAME = "tenf-evaluation-v2-evidence";

function isNetlify(): boolean {
  return typeof getStore === "function" || !!process.env.NETLIFY || !!process.env.NETLIFY_DEV;
}

function fileKey(month: string): string {
  return `${month}/evaluation-evidence.json`;
}

export async function loadEvaluationEvidence(month: string): Promise<EvaluationEvidence[]> {
  try {
    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      const raw = (await store.get(fileKey(month), { type: "json" })) as EvaluationEvidenceData | null;
      return raw?.evidences || [];
    }

    const localPath = path.join(process.cwd(), "data", "evaluation-v2", month, "evaluation-evidence.json");
    if (!fs.existsSync(localPath)) return [];
    const content = fs.readFileSync(localPath, "utf-8");
    const parsed = JSON.parse(content) as EvaluationEvidenceData;
    return parsed.evidences || [];
  } catch (error) {
    console.error(`[EvaluationV2EvidenceStorage] Erreur chargement ${month}:`, error);
    return [];
  }
}

export async function saveEvaluationEvidence(month: string, evidences: EvaluationEvidence[]): Promise<void> {
  const payload: EvaluationEvidenceData = {
    month,
    evidences,
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
    const localPath = path.join(dir, "evaluation-evidence.json");
    fs.writeFileSync(localPath, JSON.stringify(payload, null, 2), "utf-8");
  } catch (error) {
    console.error(`[EvaluationV2EvidenceStorage] Erreur sauvegarde ${month}:`, error);
    throw error;
  }
}

