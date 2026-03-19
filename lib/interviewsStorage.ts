import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type InterviewGroupType = "staff" | "member";

export interface InterviewItem {
  id: string;
  title: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  groupType: InterviewGroupType;
  memberTwitchLogin: string;
  memberDisplayName: string;
  memberRole?: string;
  isPublished: boolean;
  publishedAt?: string;
  sortOrder: number;
  featured: boolean;
  thumbnailOverride?: string;
  interviewDate?: string;
  durationText?: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const INTERVIEWS_FILE = path.join(DATA_DIR, "interviews-tenf.json");

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function normalizeText(value: string | undefined, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

function toSafeSortOrder(value: unknown, fallback = 100): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

export function extractYoutubeVideoId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  // Accepte un ID direct
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) {
    return value;
  }

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    if (host === "youtu.be") {
      const id = url.pathname.replace("/", "").trim();
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (host.includes("youtube.com")) {
      const fromQuery = url.searchParams.get("v");
      if (fromQuery && /^[a-zA-Z0-9_-]{11}$/.test(fromQuery)) {
        return fromQuery;
      }

      const parts = url.pathname.split("/").filter(Boolean);
      const knownPrefixes = new Set(["embed", "shorts", "live"]);
      if (parts.length >= 2 && knownPrefixes.has(parts[0]) && /^[a-zA-Z0-9_-]{11}$/.test(parts[1])) {
        return parts[1];
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function listInterviews(): InterviewItem[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(INTERVIEWS_FILE)) return [];
    const raw = fs.readFileSync(INTERVIEWS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as InterviewItem[];
  } catch (error) {
    console.error("[InterviewsStorage] listInterviews error:", error);
    return [];
  }
}

function saveInterviews(items: InterviewItem[]): void {
  ensureDataDir();
  fs.writeFileSync(INTERVIEWS_FILE, JSON.stringify(items, null, 2), "utf-8");
}

export function createInterview(input: {
  title: string;
  youtubeUrl: string;
  groupType: InterviewGroupType;
  memberTwitchLogin: string;
  memberDisplayName: string;
  memberRole?: string;
  isPublished?: boolean;
  sortOrder?: number;
  featured?: boolean;
  thumbnailOverride?: string;
  interviewDate?: string;
  durationText?: string;
  updatedBy?: string;
}): InterviewItem {
  const videoId = extractYoutubeVideoId(input.youtubeUrl);
  if (!videoId) {
    throw new Error("INVALID_YOUTUBE_URL");
  }

  const now = new Date().toISOString();
  const item: InterviewItem = {
    id: randomUUID(),
    title: normalizeText(input.title, 180) || "Interview TENF",
    youtubeUrl: input.youtubeUrl.trim(),
    youtubeVideoId: videoId,
    groupType: input.groupType,
    memberTwitchLogin: input.memberTwitchLogin.trim().toLowerCase(),
    memberDisplayName: normalizeText(input.memberDisplayName, 120) || input.memberTwitchLogin,
    memberRole: normalizeText(input.memberRole, 80),
    isPublished: input.isPublished === true,
    publishedAt: input.isPublished === true ? now : undefined,
    sortOrder: toSafeSortOrder(input.sortOrder, 100),
    featured: input.featured === true,
    thumbnailOverride: normalizeText(input.thumbnailOverride, 2000),
    interviewDate: normalizeText(input.interviewDate, 40),
    durationText: normalizeText(input.durationText, 30),
    createdAt: now,
    updatedAt: now,
    updatedBy: normalizeText(input.updatedBy, 120),
  };

  const current = listInterviews();
  current.unshift(item);
  saveInterviews(current);
  return item;
}

export function updateInterview(
  id: string,
  updates: Partial<{
    title: string;
    youtubeUrl: string;
    groupType: InterviewGroupType;
    memberTwitchLogin: string;
    memberDisplayName: string;
    memberRole?: string;
    isPublished: boolean;
    sortOrder: number;
    featured: boolean;
    thumbnailOverride?: string;
    interviewDate?: string;
    durationText?: string;
    updatedBy?: string;
  }>
): InterviewItem | null {
  const current = listInterviews();
  const index = current.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const prev = current[index];
  let youtubeVideoId = prev.youtubeVideoId;
  let youtubeUrl = prev.youtubeUrl;

  if (typeof updates.youtubeUrl === "string") {
    const nextVideoId = extractYoutubeVideoId(updates.youtubeUrl);
    if (!nextVideoId) {
      throw new Error("INVALID_YOUTUBE_URL");
    }
    youtubeVideoId = nextVideoId;
    youtubeUrl = updates.youtubeUrl.trim();
  }

  const nowIso = new Date().toISOString();
  const nextPublished = typeof updates.isPublished === "boolean" ? updates.isPublished : prev.isPublished;

  const next: InterviewItem = {
    ...prev,
    title: updates.title !== undefined ? normalizeText(updates.title, 180) || prev.title : prev.title,
    youtubeUrl,
    youtubeVideoId,
    groupType: updates.groupType || prev.groupType,
    memberTwitchLogin:
      updates.memberTwitchLogin !== undefined
        ? updates.memberTwitchLogin.trim().toLowerCase()
        : prev.memberTwitchLogin,
    memberDisplayName:
      updates.memberDisplayName !== undefined
        ? normalizeText(updates.memberDisplayName, 120) || prev.memberDisplayName
        : prev.memberDisplayName,
    memberRole: updates.memberRole !== undefined ? normalizeText(updates.memberRole, 80) : prev.memberRole,
    isPublished: nextPublished,
    publishedAt: nextPublished ? prev.publishedAt || nowIso : undefined,
    sortOrder: updates.sortOrder !== undefined ? toSafeSortOrder(updates.sortOrder, prev.sortOrder) : prev.sortOrder,
    featured: updates.featured !== undefined ? updates.featured : prev.featured,
    thumbnailOverride:
      updates.thumbnailOverride !== undefined
        ? normalizeText(updates.thumbnailOverride, 2000)
        : prev.thumbnailOverride,
    interviewDate:
      updates.interviewDate !== undefined ? normalizeText(updates.interviewDate, 40) : prev.interviewDate,
    durationText:
      updates.durationText !== undefined ? normalizeText(updates.durationText, 30) : prev.durationText,
    updatedAt: nowIso,
    updatedBy: updates.updatedBy !== undefined ? normalizeText(updates.updatedBy, 120) : prev.updatedBy,
  };

  current[index] = next;
  saveInterviews(current);
  return next;
}

export function deleteInterview(id: string): boolean {
  const current = listInterviews();
  const next = current.filter((item) => item.id !== id);
  if (next.length === current.length) return false;
  saveInterviews(next);
  return true;
}
