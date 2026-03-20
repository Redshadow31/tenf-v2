import { randomUUID } from "crypto";
import { getStore } from "@netlify/blobs";

export const CHARTER_VERSION = "Charte v2";

export type ModerationCharterValidationEntry = {
  id: string;
  validatedMemberDiscordId: string;
  validatedMemberUsername: string;
  validatedAt: string;
  charterVersion: string;
  feedback: string;
  validatedByDiscordId: string;
  validatedByUsername: string;
};

type ModerationCharterValidationStoreShape = {
  entries: ModerationCharterValidationEntry[];
};

const STORE_NAME = "tenf-moderation-charter";
const STORE_KEY = "charter-validations";

async function readStore(): Promise<ModerationCharterValidationStoreShape> {
  const store = getStore(STORE_NAME);
  const raw = (await store.get(STORE_KEY, { type: "json" })) as ModerationCharterValidationStoreShape | null;
  if (!raw || !Array.isArray(raw.entries)) {
    return { entries: [] };
  }
  return { entries: raw.entries };
}

async function writeStore(next: ModerationCharterValidationStoreShape): Promise<void> {
  const store = getStore(STORE_NAME);
  await store.setJSON(STORE_KEY, next);
}

export async function listModerationCharterValidations(): Promise<ModerationCharterValidationEntry[]> {
  const data = await readStore();
  return [...data.entries].sort(
    (a, b) => new Date(b.validatedAt).getTime() - new Date(a.validatedAt).getTime()
  );
}

export async function getLatestModerationCharterValidationForMember(
  validatedMemberDiscordId: string
): Promise<ModerationCharterValidationEntry | null> {
  const all = await listModerationCharterValidations();
  return (
    all.find((entry) => String(entry.validatedMemberDiscordId || "") === String(validatedMemberDiscordId || "")) ||
    null
  );
}

export async function recordModerationCharterValidation(input: {
  validatedMemberDiscordId: string;
  validatedMemberUsername: string;
  charterVersion?: string;
  feedback?: string;
  validatedByDiscordId: string;
  validatedByUsername: string;
}): Promise<ModerationCharterValidationEntry> {
  const validatedMemberDiscordId = String(input.validatedMemberDiscordId || "").trim();
  const validatedMemberUsername = String(input.validatedMemberUsername || "").trim();
  const validatedByDiscordId = String(input.validatedByDiscordId || "").trim();
  const validatedByUsername = String(input.validatedByUsername || "").trim();
  const charterVersion = String(input.charterVersion || CHARTER_VERSION).trim() || CHARTER_VERSION;
  const feedback = String(input.feedback || "").trim().slice(0, 4000);

  if (!validatedMemberDiscordId || !validatedByDiscordId) {
    throw new Error("INVALID_VALIDATION_PAYLOAD");
  }

  const now = new Date().toISOString();
  const data = await readStore();
  const existingIndex = data.entries.findIndex(
    (entry) =>
      entry.validatedMemberDiscordId === validatedMemberDiscordId &&
      entry.charterVersion === charterVersion
  );

  const nextEntry: ModerationCharterValidationEntry = {
    id: existingIndex >= 0 ? data.entries[existingIndex].id : randomUUID(),
    validatedMemberDiscordId,
    validatedMemberUsername: validatedMemberUsername || validatedMemberDiscordId,
    validatedAt: now,
    charterVersion,
    feedback,
    validatedByDiscordId,
    validatedByUsername: validatedByUsername || validatedByDiscordId,
  };

  if (existingIndex >= 0) {
    data.entries[existingIndex] = nextEntry;
  } else {
    data.entries.push(nextEntry);
  }

  await writeStore(data);
  return nextEntry;
}
