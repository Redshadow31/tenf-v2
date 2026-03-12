import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/db/supabase";

export type AventuraQuickResponse =
  | "interested"
  | "more_info"
  | "maybe"
  | "not_for_me";

export type AventuraProfileType = "createur" | "membre" | "autre";

export interface AventuraInterestResponse {
  id: string;
  created_at: string;
  pseudo: string;
  contact?: string;
  profile_type: AventuraProfileType;
  quick_response: AventuraQuickResponse;
  interest_reason?: string;
  conditions: string[];
  comment?: string;
  source: string;
  is_reviewed: boolean;
  admin_note?: string;
}

export interface AventuraGalleryItem {
  id: string;
  title: string;
  category: string;
  description?: string;
  image_url: string;
  is_published: boolean;
  is_archived: boolean;
  created_at: string;
}

export interface AventuraPageSettings {
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  final_cta_text: string;
  interest_form_enabled: boolean;
  interest_counter_enabled: boolean;
  inspiration_gallery_enabled: boolean;
  updated_at: string;
}

const INTEREST_TABLE = "new_family_aventura_interest";
const LOCAL_DIR = path.join(process.cwd(), "data", "new-family-aventura");
const LOCAL_INTEREST_FILE = path.join(LOCAL_DIR, "interest.json");
const LOCAL_INSPIRATION_FILE = path.join(LOCAL_DIR, "gallery-inspiration.json");
const LOCAL_SOUVENIRS_FILE = path.join(LOCAL_DIR, "gallery-souvenirs.json");
const LOCAL_SETTINGS_FILE = path.join(LOCAL_DIR, "settings.json");

const DEFAULT_SETTINGS: AventuraPageSettings = {
  hero_title: "New Family Aventura",
  hero_subtitle: "Le projet de voyage communautaire de la New Family.",
  hero_description:
    "Un projet pensé pour permettre aux membres de TENF de se rencontrer, partager des moments ensemble et vivre une expérience communautaire unique, au-delà des écrans et des lives.",
  final_cta_text:
    "Aidez-nous à savoir si New Family Aventura peut devenir une vraie aventure communautaire.",
  interest_form_enabled: true,
  interest_counter_enabled: false,
  inspiration_gallery_enabled: true,
  updated_at: new Date().toISOString(),
};

function ensureLocalDir(): void {
  if (!fs.existsSync(LOCAL_DIR)) {
    fs.mkdirSync(LOCAL_DIR, { recursive: true });
  }
}

function readLocalJson<T>(filePath: string, fallback: T): T {
  try {
    ensureLocalDir();
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error("[AventuraStorage] Erreur lecture locale:", error);
    return fallback;
  }
}

function writeLocalJson<T>(filePath: string, data: T): void {
  ensureLocalDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function normalizeConditions(conditions?: string[]): string[] {
  if (!Array.isArray(conditions)) return [];
  const cleaned = conditions
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 20);
  return Array.from(new Set(cleaned));
}

function toSafeString(value: string | undefined, max = 3000): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

export async function listAventuraInterestResponses(): Promise<AventuraInterestResponse[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from(INTEREST_TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      return data as AventuraInterestResponse[];
    }
  } catch (error) {
    console.warn("[AventuraStorage] Supabase indisponible, fallback local:", error);
  }

  const local = readLocalJson<AventuraInterestResponse[]>(LOCAL_INTEREST_FILE, []);
  return local.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export async function addAventuraInterestResponse(input: {
  pseudo: string;
  contact?: string;
  profile_type: AventuraProfileType;
  quick_response: AventuraQuickResponse;
  interest_reason?: string;
  conditions?: string[];
  comment?: string;
  source: string;
}): Promise<AventuraInterestResponse> {
  const payload: AventuraInterestResponse = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    pseudo: input.pseudo.trim().slice(0, 120),
    contact: toSafeString(input.contact, 220),
    profile_type: input.profile_type,
    quick_response: input.quick_response,
    interest_reason: toSafeString(input.interest_reason, 1200),
    conditions: normalizeConditions(input.conditions),
    comment: toSafeString(input.comment, 2000),
    source: input.source.trim().slice(0, 120),
    is_reviewed: false,
    admin_note: undefined,
  };

  try {
    const { data, error } = await supabaseAdmin
      .from(INTEREST_TABLE)
      .insert({
        pseudo: payload.pseudo,
        contact: payload.contact || null,
        profile_type: payload.profile_type,
        quick_response: payload.quick_response,
        interest_reason: payload.interest_reason || null,
        conditions_json: payload.conditions,
        comment: payload.comment || null,
        source: payload.source,
        is_reviewed: false,
        admin_note: null,
      })
      .select("*")
      .single();

    if (!error && data) {
      const row = data as any;
      return {
        id: row.id,
        created_at: row.created_at,
        pseudo: row.pseudo,
        contact: row.contact || undefined,
        profile_type: row.profile_type,
        quick_response: row.quick_response,
        interest_reason: row.interest_reason || undefined,
        conditions: Array.isArray(row.conditions_json) ? row.conditions_json : [],
        comment: row.comment || undefined,
        source: row.source,
        is_reviewed: !!row.is_reviewed,
        admin_note: row.admin_note || undefined,
      };
    }
  } catch (error) {
    console.warn("[AventuraStorage] Insert Supabase impossible, fallback local:", error);
  }

  const current = readLocalJson<AventuraInterestResponse[]>(LOCAL_INTEREST_FILE, []);
  current.unshift(payload);
  writeLocalJson(LOCAL_INTEREST_FILE, current.slice(0, 5000));
  return payload;
}

export async function updateAventuraInterestReview(
  id: string,
  updates: { is_reviewed?: boolean; admin_note?: string }
): Promise<boolean> {
  const note = toSafeString(updates.admin_note, 2000);

  try {
    const { error } = await supabaseAdmin
      .from(INTEREST_TABLE)
      .update({
        is_reviewed: updates.is_reviewed,
        admin_note: note || null,
      })
      .eq("id", id);

    if (!error) return true;
  } catch (error) {
    console.warn("[AventuraStorage] Update Supabase impossible, fallback local:", error);
  }

  const current = readLocalJson<AventuraInterestResponse[]>(LOCAL_INTEREST_FILE, []);
  const index = current.findIndex((item) => item.id === id);
  if (index === -1) return false;

  current[index] = {
    ...current[index],
    is_reviewed: updates.is_reviewed ?? current[index].is_reviewed,
    admin_note: note ?? current[index].admin_note,
  };
  writeLocalJson(LOCAL_INTEREST_FILE, current);
  return true;
}

export async function getAventuraSummary() {
  const responses = await listAventuraInterestResponses();
  return {
    total: responses.length,
    interested: responses.filter((r) => r.quick_response === "interested").length,
    moreInfo: responses.filter((r) => r.quick_response === "more_info").length,
    maybe: responses.filter((r) => r.quick_response === "maybe").length,
    notForMe: responses.filter((r) => r.quick_response === "not_for_me").length,
    reviewed: responses.filter((r) => r.is_reviewed).length,
    byProfile: {
      createur: responses.filter((r) => r.profile_type === "createur").length,
      membre: responses.filter((r) => r.profile_type === "membre").length,
      autre: responses.filter((r) => r.profile_type === "autre").length,
    },
    latest: responses.slice(0, 8),
  };
}

export async function getAventuraPreferencesBreakdown() {
  const responses = await listAventuraInterestResponses();
  const keys = [
    "budget accessible",
    "logement compris",
    "transport facilite",
    "dates adaptees",
    "activites communaute",
    "parc inclus",
  ];

  const counts: Record<string, number> = Object.fromEntries(keys.map((k) => [k, 0]));
  const comments = responses
    .filter((r) => r.comment && r.comment.trim().length > 0)
    .slice(0, 60)
    .map((r) => ({ id: r.id, pseudo: r.pseudo, comment: r.comment! }));

  for (const response of responses) {
    for (const condition of response.conditions) {
      if (counts[condition] !== undefined) {
        counts[condition] += 1;
      }
    }
  }

  return { counts, comments };
}

export async function listAventuraInspirationGallery(): Promise<AventuraGalleryItem[]> {
  return readLocalJson<AventuraGalleryItem[]>(LOCAL_INSPIRATION_FILE, []);
}

export async function listAventuraSouvenirsGallery(): Promise<AventuraGalleryItem[]> {
  return readLocalJson<AventuraGalleryItem[]>(LOCAL_SOUVENIRS_FILE, []);
}

export async function loadAventuraSettings(): Promise<AventuraPageSettings> {
  return readLocalJson<AventuraPageSettings>(LOCAL_SETTINGS_FILE, DEFAULT_SETTINGS);
}

export async function saveAventuraSettings(settings: AventuraPageSettings): Promise<void> {
  writeLocalJson(LOCAL_SETTINGS_FILE, {
    ...settings,
    updated_at: new Date().toISOString(),
  });
}

