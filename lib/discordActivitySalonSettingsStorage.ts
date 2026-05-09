import fs from "fs";
import path from "path";
import { getStore } from "@netlify/blobs";

export interface DiscordActivitySalonSettings {
  /** Si le nom normalisé du salon contient une de ces sous-chaînes, il est agrégé dans le bucket staff (sans afficher le nom). */
  staffNameSubstrings: string[];
  /** Libellé unique pour la somme des salons staff. */
  staffBucketLabel: string;
}

export const DEFAULT_DISCORD_ACTIVITY_SALON_SETTINGS: DiscordActivitySalonSettings = {
  staffNameSubstrings: [
    "staff",
    "équipe",
    "equipe",
    "modération",
    "moderation",
    "modo",
    "admin",
    "direction",
    "interne",
    "privé",
    "prive",
    "coordination",
  ],
  staffBucketLabel: "Espace staff (hors capture publique)",
};

const STORE_NAME = "tenf-discord-activity-salon-settings";
const STORAGE_KEY = "salon-settings.json";
const DATA_DIR = path.join(process.cwd(), "data", "discord-activity-salon-settings");

function isNetlify(): boolean {
  if (process.env.NETLIFY || process.env.NETLIFY_DEV) return true;
  if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT) return true;
  if (process.env.NETLIFY_FUNCTIONS_VERSION) return true;
  return false;
}

function normalizeLoaded(raw: unknown): DiscordActivitySalonSettings {
  const d = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const subs = Array.isArray(d.staffNameSubstrings)
    ? (d.staffNameSubstrings as unknown[]).filter((x): x is string => typeof x === "string")
    : DEFAULT_DISCORD_ACTIVITY_SALON_SETTINGS.staffNameSubstrings;
  const label =
    typeof d.staffBucketLabel === "string" && d.staffBucketLabel.trim()
      ? d.staffBucketLabel.trim()
      : DEFAULT_DISCORD_ACTIVITY_SALON_SETTINGS.staffBucketLabel;
  return {
    staffNameSubstrings: subs.map((s) => s.trim()).filter(Boolean),
    staffBucketLabel: label,
  };
}

export async function loadDiscordActivitySalonSettings(): Promise<DiscordActivitySalonSettings> {
  if (isNetlify()) {
    try {
      const store = getStore(STORE_NAME);
      const data = await store.get(STORAGE_KEY, { type: "text" });
      if (data) {
        return normalizeLoaded(JSON.parse(data));
      }
    } catch (error) {
      console.error("[Discord Salon Settings] Erreur chargement Blobs:", error);
    }
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const filePath = path.join(DATA_DIR, STORAGE_KEY);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return normalizeLoaded(JSON.parse(content));
    }
  } catch (error) {
    console.error("[Discord Salon Settings] Erreur chargement fichier:", error);
  }

  return { ...DEFAULT_DISCORD_ACTIVITY_SALON_SETTINGS };
}

export async function saveDiscordActivitySalonSettings(
  settings: DiscordActivitySalonSettings
): Promise<void> {
  const normalized = normalizeLoaded(settings);

  if (isNetlify()) {
    const store = getStore(STORE_NAME);
    await store.set(STORAGE_KEY, JSON.stringify(normalized, null, 2));
    return;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const filePath = path.join(DATA_DIR, STORAGE_KEY);
  fs.writeFileSync(filePath, JSON.stringify(normalized, null, 2), "utf-8");
}
