import { getStore } from "@netlify/blobs";
import fs from "fs";
import path from "path";

export type DiscoursPartKey = "partie-1" | "partie-2" | "partie-3" | "partie-4";

export interface DiscoursPartContent {
  points: string;
  discours: string;
  conseils: string;
  updatedAt: string;
  updatedBy: string;
}

export interface DiscoursContentStore {
  "partie-1": DiscoursPartContent;
  "partie-2": DiscoursPartContent;
  "partie-3": DiscoursPartContent;
  "partie-4": DiscoursPartContent;
}

const DISCOURS_STORE_NAME = "tenf-evaluations-discours";
const FILE_NAME = "discours-content.json";

const EMPTY_PART = (): DiscoursPartContent => ({
  points: "",
  discours: "",
  conseils: "",
  updatedAt: new Date().toISOString(),
  updatedBy: "",
});

function defaultStore(): DiscoursContentStore {
  return {
    "partie-1": EMPTY_PART(),
    "partie-2": EMPTY_PART(),
    "partie-3": EMPTY_PART(),
    "partie-4": EMPTY_PART(),
  };
}

function isNetlify(): boolean {
  return typeof getStore === "function" || !!process.env.NETLIFY || !!process.env.NETLIFY_DEV;
}

function normalizeStore(raw: unknown): DiscoursContentStore {
  const fallback = defaultStore();
  if (!raw || typeof raw !== "object") return fallback;

  const source = raw as Partial<Record<DiscoursPartKey, Partial<DiscoursPartContent>>>;
  const parts: DiscoursPartKey[] = ["partie-1", "partie-2", "partie-3", "partie-4"];

  for (const part of parts) {
    const partValue = source[part];
    if (!partValue || typeof partValue !== "object") continue;

    fallback[part] = {
      points: typeof partValue.points === "string" ? partValue.points : "",
      discours: typeof partValue.discours === "string" ? partValue.discours : "",
      conseils: typeof partValue.conseils === "string" ? partValue.conseils : "",
      updatedAt: typeof partValue.updatedAt === "string" ? partValue.updatedAt : new Date().toISOString(),
      updatedBy: typeof partValue.updatedBy === "string" ? partValue.updatedBy : "",
    };
  }

  return fallback;
}

export async function loadDiscoursContent(): Promise<DiscoursContentStore> {
  try {
    if (isNetlify()) {
      const store = getStore(DISCOURS_STORE_NAME);
      const content = await store.get(FILE_NAME, { type: "json" });
      return normalizeStore(content);
    }

    const dataDir = path.join(process.cwd(), "data", "evaluations");
    const filePath = path.join(dataDir, FILE_NAME);
    if (!fs.existsSync(filePath)) return defaultStore();

    const raw = fs.readFileSync(filePath, "utf-8");
    return normalizeStore(JSON.parse(raw));
  } catch (error) {
    console.error("[DiscoursStorage] Erreur chargement:", error);
    return defaultStore();
  }
}

export async function saveDiscoursContent(content: DiscoursContentStore): Promise<void> {
  try {
    const payload = JSON.stringify(content, null, 2);

    if (isNetlify()) {
      const store = getStore(DISCOURS_STORE_NAME);
      await store.set(FILE_NAME, payload);
      return;
    }

    const dataDir = path.join(process.cwd(), "data", "evaluations");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, FILE_NAME);
    fs.writeFileSync(filePath, payload, "utf-8");
  } catch (error) {
    console.error("[DiscoursStorage] Erreur sauvegarde:", error);
    throw error;
  }
}

export async function updateDiscoursPartContent(
  part: DiscoursPartKey,
  values: Pick<DiscoursPartContent, "points" | "discours" | "conseils">,
  updatedBy: string,
): Promise<DiscoursContentStore> {
  const store = await loadDiscoursContent();
  store[part] = {
    points: values.points,
    discours: values.discours,
    conseils: values.conseils,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  await saveDiscoursContent(store);
  return store;
}
