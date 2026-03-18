import { getStore } from "@netlify/blobs";
import fs from "fs";
import path from "path";

export type EvaluationV2System = "legacy" | "new";

export interface EvaluationV2ValidationMeta {
  month: string;
  system: EvaluationV2System;
  validated: boolean;
  validationStage?: "none" | "data_prevalidated" | "staff_validated";
  dataPrevalidatedAt?: string;
  dataPrevalidatedBy?: string;
  dataPrevalidatedByUsername?: string;
  staffValidatedAt?: string;
  staffValidatedBy?: string;
  staffValidatedByUsername?: string;
  frozen?: boolean;
  frozenAt?: string;
  frozenBy?: string;
  frozenByUsername?: string;
  validatedAt?: string;
  validatedBy?: string;
  validatedByUsername?: string;
  validationNote?: string;
  updatedAt: string;
}

const STORE_NAME = "tenf-evaluation-v2-summary";

function isNetlify(): boolean {
  return typeof getStore === "function" || !!process.env.NETLIFY || !!process.env.NETLIFY_DEV;
}

function fileKey(month: string, system: EvaluationV2System): string {
  return `${month}/${system}/validation-meta.json`;
}

export async function loadEvaluationV2ValidationMeta(
  month: string,
  system: EvaluationV2System,
): Promise<EvaluationV2ValidationMeta | null> {
  try {
    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      const data = await store.get(fileKey(month, system), { type: "json" }).catch(() => null);
      return data as EvaluationV2ValidationMeta | null;
    }

    const localPath = path.join(process.cwd(), "data", "evaluation-v2", month, system, "validation-meta.json");
    if (!fs.existsSync(localPath)) return null;
    const raw = fs.readFileSync(localPath, "utf-8");
    const parsed = JSON.parse(raw) as EvaluationV2ValidationMeta;
    return parsed;
  } catch (error) {
    console.warn(`[EvaluationV2ValidationStorage] Erreur lecture ${month}/${system}:`, error);
    return null;
  }
}

export async function saveEvaluationV2ValidationMeta(meta: EvaluationV2ValidationMeta): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      await store.set(fileKey(meta.month, meta.system), JSON.stringify(meta, null, 2));
      return;
    }

    const dir = path.join(process.cwd(), "data", "evaluation-v2", meta.month, meta.system);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const localPath = path.join(dir, "validation-meta.json");
    fs.writeFileSync(localPath, JSON.stringify(meta, null, 2), "utf-8");
  } catch (error) {
    console.error(`[EvaluationV2ValidationStorage] Erreur sauvegarde ${meta.month}/${meta.system}:`, error);
    throw error;
  }
}
