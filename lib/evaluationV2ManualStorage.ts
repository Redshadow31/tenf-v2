import { getStore } from "@netlify/blobs";
import fs from "fs";
import path from "path";

export interface EvaluationV2ManualOverride {
  twitchLogin: string;
  bloc1?: number; // /5
  bloc2?: number; // /5
  bloc3?: number; // /5
  bloc4?: number; // /5
  bonus?: number; // /5 capé
  reason?: string;
  updatedAt: string; // ISO
  updatedBy: string; // Discord ID
}

export interface EvaluationV2ManualData {
  month: string; // YYYY-MM
  overrides: Record<string, EvaluationV2ManualOverride>;
  lastUpdated: string; // ISO
}

const STORE_NAME = "tenf-evaluation-v2-manual";
export type EvaluationV2System = "legacy" | "new";

function isNetlify(): boolean {
  return typeof getStore === "function" || !!process.env.NETLIFY || !!process.env.NETLIFY_DEV;
}

function normalizeSystem(system?: string): EvaluationV2System {
  return system === "new" ? "new" : "legacy";
}

function getFileKey(month: string, system?: string): string {
  const systemKey = normalizeSystem(system);
  return `${month}/${systemKey}/manual-overrides.json`;
}

export async function loadEvaluationV2ManualData(month: string, system?: string): Promise<EvaluationV2ManualData | null> {
  try {
    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      const raw = await store.get(getFileKey(month, system), { type: "json" });
      return (raw as EvaluationV2ManualData | null) || null;
    }

    const filePath = path.join(process.cwd(), "data", "evaluation-v2", month, normalizeSystem(system), "manual-overrides.json");
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as EvaluationV2ManualData;
  } catch (error) {
    console.error(`[EvaluationV2ManualStorage] Erreur chargement ${month}:`, error);
    return null;
  }
}

export async function saveEvaluationV2ManualData(data: EvaluationV2ManualData): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      await store.set(getFileKey(data.month, "legacy"), JSON.stringify(data, null, 2));
      return;
    }

    const dir = path.join(process.cwd(), "data", "evaluation-v2", data.month, "legacy");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, "manual-overrides.json");
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error(`[EvaluationV2ManualStorage] Erreur sauvegarde ${data.month}:`, error);
    throw error;
  }
}

export async function getEvaluationV2Overrides(month: string): Promise<Record<string, EvaluationV2ManualOverride>> {
  const data = await loadEvaluationV2ManualData(month, "legacy");
  return data?.overrides || {};
}

export async function getEvaluationV2OverridesBySystem(
  month: string,
  system?: string
): Promise<Record<string, EvaluationV2ManualOverride>> {
  const data = await loadEvaluationV2ManualData(month, system);
  return data?.overrides || {};
}

export async function upsertEvaluationV2Override(
  month: string,
  override: Omit<EvaluationV2ManualOverride, "updatedAt">
): Promise<EvaluationV2ManualOverride> {
  const login = override.twitchLogin.toLowerCase().trim();
  if (!login) {
    throw new Error("twitchLogin requis");
  }

  const data =
    (await loadEvaluationV2ManualData(month, "legacy")) ||
    ({
      month,
      overrides: {},
      lastUpdated: new Date().toISOString(),
    } as EvaluationV2ManualData);

  const nextOverride: EvaluationV2ManualOverride = {
    twitchLogin: login,
    bloc1: override.bloc1,
    bloc2: override.bloc2,
    bloc3: override.bloc3,
    bloc4: override.bloc4,
    bonus: override.bonus,
    reason: override.reason?.trim() || undefined,
    updatedAt: new Date().toISOString(),
    updatedBy: override.updatedBy,
  };

  data.overrides[login] = nextOverride;
  data.lastUpdated = new Date().toISOString();
  await saveEvaluationV2ManualData(data);

  return nextOverride;
}

export async function upsertEvaluationV2OverrideBySystem(
  month: string,
  override: Omit<EvaluationV2ManualOverride, "updatedAt">,
  system?: string
): Promise<EvaluationV2ManualOverride> {
  const login = override.twitchLogin.toLowerCase().trim();
  if (!login) {
    throw new Error("twitchLogin requis");
  }

  const data =
    (await loadEvaluationV2ManualData(month, system)) ||
    ({
      month,
      overrides: {},
      lastUpdated: new Date().toISOString(),
    } as EvaluationV2ManualData);

  const nextOverride: EvaluationV2ManualOverride = {
    twitchLogin: login,
    bloc1: override.bloc1,
    bloc2: override.bloc2,
    bloc3: override.bloc3,
    bloc4: override.bloc4,
    bonus: override.bonus,
    reason: override.reason?.trim() || undefined,
    updatedAt: new Date().toISOString(),
    updatedBy: override.updatedBy,
  };

  data.overrides[login] = nextOverride;
  data.lastUpdated = new Date().toISOString();

  try {
    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      await store.set(getFileKey(month, system), JSON.stringify(data, null, 2));
    } else {
      const dir = path.join(process.cwd(), "data", "evaluation-v2", month, normalizeSystem(system));
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const filePath = path.join(dir, "manual-overrides.json");
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    }
  } catch (error) {
    console.error(`[EvaluationV2ManualStorage] Erreur sauvegarde ${month}/${normalizeSystem(system)}:`, error);
    throw error;
  }

  return nextOverride;
}

