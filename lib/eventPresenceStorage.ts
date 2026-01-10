// Stockage des présences aux événements dans Netlify Blobs
// Architecture: tenf-event-presences/{eventId}/presence.json

import { getStore } from '@netlify/blobs';
import fs from 'fs';
import path from 'path';

// ============================================
// TYPES
// ============================================

export interface EventPresence {
  id: string;
  twitchLogin: string;
  displayName: string;
  discordId?: string;
  discordUsername?: string;
  isRegistered: boolean; // Si le membre était inscrit à l'événement
  present: boolean; // Si le membre était présent (validé)
  note?: string; // Note écrite pour ce participant
  validatedAt?: string; // ISO timestamp de validation
  validatedBy?: string; // Discord ID de l'admin qui a validé
  addedManually: boolean; // Si le membre a été ajouté manuellement (non inscrit)
  createdAt: string; // ISO timestamp
}

export interface EventPresenceData {
  eventId: string;
  presences: EventPresence[];
  lastUpdated: string; // ISO timestamp
}

// ============================================
// CONSTANTES
// ============================================

const EVENT_PRESENCE_STORE_NAME = 'tenf-event-presences';

// ============================================
// UTILITAIRES
// ============================================

function isNetlify(): boolean {
  return typeof getStore === 'function' || 
         !!process.env.NETLIFY || 
         !!process.env.NETLIFY_DEV;
}

function getEventPresenceFilePath(eventId: string): string {
  return `${eventId}/presence.json`;
}

// ============================================
// CHARGEMENT ET SAUVEGARDE
// ============================================

export async function loadEventPresenceData(eventId: string): Promise<EventPresenceData | null> {
  try {
    if (isNetlify()) {
      const store = getStore(EVENT_PRESENCE_STORE_NAME);
      const key = getEventPresenceFilePath(eventId);
      const data = await store.get(key, { type: 'json' });
      return data as EventPresenceData | null;
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'event-presences');
      const filePath = path.join(dataDir, getEventPresenceFilePath(eventId));
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
      return null;
    }
  } catch (error) {
    console.error(`[EventPresenceStorage] Erreur chargement pour ${eventId}:`, error);
    return null;
  }
}

export async function saveEventPresenceData(data: EventPresenceData): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(EVENT_PRESENCE_STORE_NAME);
      const key = getEventPresenceFilePath(data.eventId);
      await store.set(key, JSON.stringify(data, null, 2));
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'event-presences');
      const eventDir = path.join(dataDir, data.eventId);
      if (!fs.existsSync(eventDir)) {
        fs.mkdirSync(eventDir, { recursive: true });
      }
      const filePath = path.join(eventDir, 'presence.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error(`[EventPresenceStorage] Erreur sauvegarde pour ${data.eventId}:`, error);
    throw error;
  }
}

/**
 * Ajoute ou met à jour une présence pour un membre
 */
export async function addOrUpdatePresence(
  eventId: string,
  member: {
    twitchLogin: string;
    displayName: string;
    discordId?: string;
    discordUsername?: string;
    isRegistered: boolean;
  },
  present: boolean,
  note?: string,
  validatedBy?: string
): Promise<EventPresence> {
  let data = await loadEventPresenceData(eventId);
  
  if (!data) {
    data = {
      eventId,
      presences: [],
      lastUpdated: new Date().toISOString(),
    };
  }
  
  // Chercher si la présence existe déjà
  const existingIndex = data.presences.findIndex(
    p => p.twitchLogin.toLowerCase() === member.twitchLogin.toLowerCase()
  );
  
  const presence: EventPresence = {
    id: existingIndex !== -1 ? data.presences[existingIndex].id : `presence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    twitchLogin: member.twitchLogin.toLowerCase(),
    displayName: member.displayName,
    discordId: member.discordId,
    discordUsername: member.discordUsername,
    isRegistered: member.isRegistered,
    present,
    note: note?.trim() || undefined,
    validatedAt: present ? new Date().toISOString() : undefined,
    validatedBy: validatedBy || (present ? data.presences[existingIndex]?.validatedBy : undefined),
    addedManually: !member.isRegistered,
    createdAt: existingIndex !== -1 ? data.presences[existingIndex].createdAt : new Date().toISOString(),
  };
  
  if (existingIndex !== -1) {
    data.presences[existingIndex] = presence;
  } else {
    data.presences.push(presence);
  }
  
  data.lastUpdated = new Date().toISOString();
  await saveEventPresenceData(data);
  
  return presence;
}

/**
 * Supprime une présence
 */
export async function removePresence(eventId: string, twitchLogin: string): Promise<boolean> {
  const data = await loadEventPresenceData(eventId);
  if (!data) return false;
  
  const initialLength = data.presences.length;
  data.presences = data.presences.filter(
    p => p.twitchLogin.toLowerCase() !== twitchLogin.toLowerCase()
  );
  
  if (data.presences.length === initialLength) return false;
  
  data.lastUpdated = new Date().toISOString();
  await saveEventPresenceData(data);
  return true;
}

/**
 * Met à jour la note d'une présence
 */
export async function updatePresenceNote(
  eventId: string,
  twitchLogin: string,
  note: string | undefined,
  updatedBy: string
): Promise<boolean> {
  const data = await loadEventPresenceData(eventId);
  if (!data) return false;
  
  const presence = data.presences.find(
    p => p.twitchLogin.toLowerCase() === twitchLogin.toLowerCase()
  );
  
  if (!presence) return false;
  
  presence.note = note?.trim() || undefined;
  data.lastUpdated = new Date().toISOString();
  await saveEventPresenceData(data);
  
  return true;
}

/**
 * Récupère toutes les présences pour un mois donné
 */
export async function loadPresencesByMonth(monthKey: string): Promise<Record<string, EventPresence[]>> {
  try {
    // Cette fonction devra être appelée avec la liste des événements du mois
    // On ne peut pas lister tous les événements depuis Blobs sans connaître leurs IDs
    // Cette fonction sera utilisée dans l'API qui a déjà la liste des événements
    return {};
  } catch (error) {
    console.error(`[EventPresenceStorage] Erreur chargement présences pour ${monthKey}:`, error);
    return {};
  }
}

