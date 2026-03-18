import fs from "fs/promises";
import path from "path";
import { getBlobStore } from "@/lib/memberData";

const STORE_NAME = "tenf-public-contacts";
const STORE_KEY = "faq-contacts-v1";
const LOCAL_DATA_DIR = path.join(process.cwd(), "data");
const LOCAL_FILE = path.join(LOCAL_DATA_DIR, "faq-contacts.json");

export type FaqContactStatus = "new" | "in_progress" | "resolved" | "archived";

export interface FaqContactMessage {
  id: string;
  createdAt: string;
  updatedAt: string;
  sourcePage: string;
  pseudo: string;
  contact: string;
  topic: string;
  message: string;
  status: FaqContactStatus;
  adminNote?: string;
  handledBy?: string;
  handledAt?: string;
}

type PersistedShape = {
  messages: FaqContactMessage[];
};

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(): string {
  return `faq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeText(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

function isNetlifyEnv(): boolean {
  return Boolean(
    process.env.NETLIFY ||
      process.env.NETLIFY_DEV ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.NETLIFY_FUNCTIONS_VERSION
  );
}

async function readLocal(): Promise<FaqContactMessage[]> {
  try {
    const raw = await fs.readFile(LOCAL_FILE, "utf-8");
    const parsed = JSON.parse(raw) as PersistedShape | FaqContactMessage[];
    const list = Array.isArray(parsed) ? parsed : parsed.messages;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function writeLocal(messages: FaqContactMessage[]): Promise<void> {
  await fs.mkdir(LOCAL_DATA_DIR, { recursive: true });
  const payload: PersistedShape = { messages };
  await fs.writeFile(LOCAL_FILE, JSON.stringify(payload, null, 2), "utf-8");
}

async function readBlob(): Promise<FaqContactMessage[]> {
  const store = getBlobStore(STORE_NAME);
  const raw = await store.get(STORE_KEY, { type: "text" });
  if (!raw) return [];
  const parsed = JSON.parse(raw) as PersistedShape | FaqContactMessage[];
  const list = Array.isArray(parsed) ? parsed : parsed.messages;
  return Array.isArray(list) ? list : [];
}

async function writeBlob(messages: FaqContactMessage[]): Promise<void> {
  const store = getBlobStore(STORE_NAME);
  const payload: PersistedShape = { messages };
  await store.set(STORE_KEY, JSON.stringify(payload, null, 2));
}

async function readAll(): Promise<FaqContactMessage[]> {
  if (isNetlifyEnv()) {
    try {
      return await readBlob();
    } catch {
      // fallback local si blobs indisponible (sécurité opérationnelle)
      return await readLocal();
    }
  }
  return await readLocal();
}

async function writeAll(messages: FaqContactMessage[]): Promise<void> {
  if (isNetlifyEnv()) {
    try {
      await writeBlob(messages);
      return;
    } catch {
      // fallback local si blobs indisponible
      await writeLocal(messages);
      return;
    }
  }
  await writeLocal(messages);
}

export async function listFaqContacts(): Promise<FaqContactMessage[]> {
  const messages = await readAll();
  return [...messages].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
}

export async function createFaqContact(input: {
  sourcePage?: string;
  pseudo: string;
  contact: string;
  topic: string;
  message: string;
}): Promise<FaqContactMessage> {
  const pseudo = sanitizeText(input.pseudo, 60);
  const contact = sanitizeText(input.contact, 120);
  const topic = sanitizeText(input.topic, 120);
  const message = sanitizeText(input.message, 2400);

  if (!pseudo || !contact || !topic || !message) {
    throw new Error("Données incomplètes.");
  }

  const now = nowIso();
  const item: FaqContactMessage = {
    id: makeId(),
    createdAt: now,
    updatedAt: now,
    sourcePage: sanitizeText(input.sourcePage || "/rejoindre/faq", 120) || "/rejoindre/faq",
    pseudo,
    contact,
    topic,
    message,
    status: "new",
  };

  const messages = await readAll();
  messages.unshift(item);
  await writeAll(messages);
  return item;
}

export async function updateFaqContact(
  id: string,
  patch: {
    status?: FaqContactStatus;
    adminNote?: string;
    handledBy?: string;
  }
): Promise<FaqContactMessage | null> {
  const messages = await readAll();
  const index = messages.findIndex((m) => m.id === id);
  if (index === -1) return null;

  const current = messages[index];
  const next: FaqContactMessage = {
    ...current,
    updatedAt: nowIso(),
    status: patch.status ?? current.status,
    adminNote: patch.adminNote !== undefined ? sanitizeText(patch.adminNote, 2400) : current.adminNote,
    handledBy: patch.handledBy ?? current.handledBy,
    handledAt: patch.status && patch.status !== "new" ? nowIso() : current.handledAt,
  };

  messages[index] = next;
  await writeAll(messages);
  return next;
}

