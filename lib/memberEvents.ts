// Système d'historique d'événements pour les membres TENF

import fs from "fs";
import path from "path";
import { getStore } from "@netlify/blobs";

export interface MemberEvent {
  id: string; // UUID ou timestamp-based ID
  memberId: string; // twitchLogin (identifiant unique du membre)
  type: string; // Type d'événement (role_changed, integration_validated, etc.)
  createdAt: string; // ISO date string
  source?: 'twitch_eventsub' | 'twitch_poll' | 'manual' | 'discord' | 'system';
  actor?: string; // ID Discord ou nom de l'admin/staff qui a fait l'action
  payload?: Record<string, any>; // Données supplémentaires de l'événement
}

// Détecte si on est sur Netlify
function isNetlify(): boolean {
  if (process.env.NETLIFY || process.env.NETLIFY_DEV) {
    return true;
  }
  if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT) {
    return true;
  }
  if (process.env.NETLIFY_FUNCTIONS_VERSION) {
    return true;
  }
  return false;
}

// Chemins des fichiers de persistance (pour développement local)
const DATA_DIR = path.join(process.cwd(), "data");
const EVENTS_FILE = path.join(DATA_DIR, "member-events.json");

// Store Netlify Blobs
const EVENTS_BLOB_STORE = "tenf-member-events";
const EVENTS_BLOB_KEY = "member-events-data";

/**
 * Génère un ID unique pour un événement
 */
function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Charge les événements depuis Netlify Blobs
 */
async function loadEventsFromBlob(): Promise<MemberEvent[]> {
  try {
    const store = getStore(EVENTS_BLOB_STORE);
    const data = await store.get(EVENTS_BLOB_KEY, { type: "text" });
    
    if (!data) {
      return [];
    }
    
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Erreur lors du chargement des événements depuis Netlify Blobs:", error);
    return [];
  }
}

/**
 * Charge les événements depuis le fichier JSON (développement local)
 */
function loadEventsFromFile(): MemberEvent[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(EVENTS_FILE)) {
      const fileContent = fs.readFileSync(EVENTS_FILE, "utf-8");
      const parsed = JSON.parse(fileContent);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    console.error("Erreur lors du chargement des événements depuis le fichier:", error);
  }
  return [];
}

/**
 * Sauvegarde les événements dans Netlify Blobs
 */
async function saveEventsToBlob(events: MemberEvent[]): Promise<void> {
  try {
    const store = getStore(EVENTS_BLOB_STORE);
    // Garder seulement les 10000 derniers événements pour éviter un fichier trop volumineux
    const eventsToSave = events.slice(-10000);
    await store.set(EVENTS_BLOB_KEY, JSON.stringify(eventsToSave, null, 2));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des événements dans Netlify Blobs:", error);
    throw error;
  }
}

/**
 * Sauvegarde les événements dans le fichier JSON (développement local)
 */
function saveEventsToFile(events: MemberEvent[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    // Garder seulement les 10000 derniers événements pour éviter un fichier trop volumineux
    const eventsToSave = events.slice(-10000);
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(eventsToSave, null, 2), "utf-8");
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des événements:", error);
  }
}

/**
 * Charge les événements depuis le stockage persistant
 */
export async function loadMemberEvents(): Promise<MemberEvent[]> {
  if (isNetlify()) {
    return await loadEventsFromBlob();
  } else {
    return loadEventsFromFile();
  }
}

/**
 * Sauvegarde les événements dans le stockage persistant
 */
export async function saveMemberEvents(events: MemberEvent[]): Promise<void> {
  if (isNetlify()) {
    await saveEventsToBlob(events);
  } else {
    saveEventsToFile(events);
  }
}

/**
 * Enregistre un nouvel événement
 */
export async function recordMemberEvent(
  memberId: string,
  type: string,
  options: {
    source?: MemberEvent['source'];
    actor?: string;
    payload?: Record<string, any>;
  } = {}
): Promise<MemberEvent> {
  const event: MemberEvent = {
    id: generateEventId(),
    memberId: memberId.toLowerCase(), // Normaliser en lowercase
    type,
    createdAt: new Date().toISOString(),
    source: options.source || 'system',
    actor: options.actor,
    payload: options.payload,
  };

  const events = await loadMemberEvents();
  events.push(event);
  await saveMemberEvents(events);

  console.log(`[MemberEvent] Enregistré: ${type} pour ${memberId}`);
  return event;
}

/**
 * Récupère les événements d'un membre spécifique
 */
export async function getMemberEvents(memberId: string, limit?: number): Promise<MemberEvent[]> {
  const events = await loadMemberEvents();
  const memberEvents = events
    .filter(e => e.memberId.toLowerCase() === memberId.toLowerCase())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return limit ? memberEvents.slice(0, limit) : memberEvents;
}

/**
 * Récupère tous les événements avec filtres optionnels
 */
export async function getAllEvents(filters?: {
  memberId?: string;
  type?: string;
  source?: MemberEvent['source'];
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<MemberEvent[]> {
  let events = await loadMemberEvents();
  
  // Trier par date décroissante (plus récent en premier)
  events = events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  if (filters) {
    if (filters.memberId) {
      events = events.filter(e => e.memberId.toLowerCase() === filters.memberId!.toLowerCase());
    }
    if (filters.type) {
      events = events.filter(e => e.type === filters.type);
    }
    if (filters.source) {
      events = events.filter(e => e.source === filters.source);
    }
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      events = events.filter(e => new Date(e.createdAt) >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      events = events.filter(e => new Date(e.createdAt) <= end);
    }
    if (filters.limit) {
      events = events.slice(0, filters.limit);
    }
  }
  
  return events;
}

/**
 * Formate un événement pour l'affichage
 */
export function formatEventSummary(event: MemberEvent): string {
  switch (event.type) {
    case 'role_changed':
      return `Rôle changé: ${event.payload?.fromRole || 'N/A'} → ${event.payload?.toRole || 'N/A'}`;
    case 'integration_validated':
      return `Intégration validée le ${new Date(event.payload?.date || event.createdAt).toLocaleDateString('fr-FR')}`;
    case 'manual_note_updated':
      return `Notes internes mises à jour`;
    case 'raid':
      return `Raid: ${event.payload?.raider || 'N/A'} → ${event.payload?.target || 'N/A'}`;
    default:
      return event.type;
  }
}

