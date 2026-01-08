// Stockage des événements et inscriptions dans Netlify Blobs
// Architecture: tenf-events/events.json, registrations/{eventId}.json

import { getStore } from '@netlify/blobs';
import fs from 'fs';
import path from 'path';

// ============================================
// TYPES
// ============================================

export interface Event {
  id: string;
  title: string;
  description: string;
  image?: string;
  date: string; // ISO date
  category: "Spotlight" | "Soirées communautaires" | "Ateliers créateurs" | "Aventura 2025" | string;
  location?: string;
  invitedMembers?: string[]; // Twitch logins
  createdAt: string; // ISO timestamp
  createdBy: string; // Discord ID
  updatedAt?: string; // ISO timestamp
  isPublished: boolean; // Si l'événement est visible sur /events
}

export interface EventRegistration {
  id: string;
  eventId: string;
  twitchLogin: string;
  displayName: string;
  discordId?: string;
  discordUsername?: string;
  registeredAt: string; // ISO timestamp
  notes?: string; // Notes optionnelles de l'utilisateur
}

// ============================================
// CONSTANTES
// ============================================

const EVENTS_STORE_NAME = 'tenf-events';
const EVENTS_KEY = 'events.json';

function isNetlify(): boolean {
  return typeof getStore === 'function' || 
         !!process.env.NETLIFY || 
         !!process.env.NETLIFY_DEV;
}

// ============================================
// ÉVÉNEMENTS
// ============================================

export async function loadEvents(): Promise<Event[]> {
  try {
    if (isNetlify()) {
      const store = getStore(EVENTS_STORE_NAME);
      const data = await store.get(EVENTS_KEY, { type: 'json' });
      return (data as Event[]) || [];
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'events');
      const filePath = path.join(dataDir, EVENTS_KEY);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
      return [];
    }
  } catch (error) {
    console.error('[EventStorage] Erreur chargement événements:', error);
    return [];
  }
}

export async function saveEvents(events: Event[]): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(EVENTS_STORE_NAME);
      await store.set(EVENTS_KEY, JSON.stringify(events, null, 2));
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'events');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const filePath = path.join(dataDir, EVENTS_KEY);
      fs.writeFileSync(filePath, JSON.stringify(events, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('[EventStorage] Erreur sauvegarde événements:', error);
    throw error;
  }
}

export async function getEvent(eventId: string): Promise<Event | null> {
  const events = await loadEvents();
  return events.find(e => e.id === eventId) || null;
}

export async function createEvent(event: Omit<Event, 'id' | 'createdAt' | 'createdBy'> & { createdBy?: string }): Promise<Event> {
  const events = await loadEvents();
  const newEvent: Event = {
    ...event,
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    createdBy: event.createdBy || '', // Utiliser le createdBy fourni ou une chaîne vide
    isPublished: event.isPublished ?? false,
  };
  events.push(newEvent);
  await saveEvents(events);
  return newEvent;
}

export async function updateEvent(eventId: string, updates: Partial<Event>): Promise<Event | null> {
  const events = await loadEvents();
  const index = events.findIndex(e => e.id === eventId);
  if (index === -1) return null;
  
  events[index] = {
    ...events[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await saveEvents(events);
  return events[index];
}

export async function deleteEvent(eventId: string): Promise<boolean> {
  const events = await loadEvents();
  const filtered = events.filter(e => e.id !== eventId);
  if (filtered.length === events.length) return false;
  
  await saveEvents(filtered);
  // Supprimer aussi les inscriptions associées
  await deleteEventRegistrations(eventId);
  return true;
}

// ============================================
// INSCRIPTIONS
// ============================================

export async function loadEventRegistrations(eventId: string): Promise<EventRegistration[]> {
  try {
    if (isNetlify()) {
      const store = getStore(EVENTS_STORE_NAME);
      const key = `registrations/${eventId}.json`;
      const data = await store.get(key, { type: 'json' });
      return (data as EventRegistration[]) || [];
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'events', 'registrations');
      const filePath = path.join(dataDir, `${eventId}.json`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
      return [];
    }
  } catch (error) {
    console.error(`[EventStorage] Erreur chargement inscriptions pour ${eventId}:`, error);
    return [];
  }
}

export async function saveEventRegistrations(eventId: string, registrations: EventRegistration[]): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(EVENTS_STORE_NAME);
      const key = `registrations/${eventId}.json`;
      await store.set(key, JSON.stringify(registrations, null, 2));
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'events', 'registrations');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const filePath = path.join(dataDir, `${eventId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(registrations, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error(`[EventStorage] Erreur sauvegarde inscriptions pour ${eventId}:`, error);
    throw error;
  }
}

export async function registerForEvent(
  eventId: string,
  registration: Omit<EventRegistration, 'id' | 'eventId' | 'registeredAt'>
): Promise<EventRegistration> {
  const registrations = await loadEventRegistrations(eventId);
  
  // Vérifier si l'utilisateur n'est pas déjà inscrit
  const existing = registrations.find(
    r => r.twitchLogin.toLowerCase() === registration.twitchLogin.toLowerCase() ||
        (registration.discordId && r.discordId === registration.discordId)
  );
  
  if (existing) {
    throw new Error('Vous êtes déjà inscrit à cet événement');
  }
  
  const newRegistration: EventRegistration = {
    ...registration,
    id: `reg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    eventId,
    registeredAt: new Date().toISOString(),
  };
  
  registrations.push(newRegistration);
  await saveEventRegistrations(eventId, registrations);
  return newRegistration;
}

export async function unregisterFromEvent(eventId: string, twitchLogin: string): Promise<boolean> {
  const registrations = await loadEventRegistrations(eventId);
  const filtered = registrations.filter(
    r => r.twitchLogin.toLowerCase() !== twitchLogin.toLowerCase()
  );
  
  if (filtered.length === registrations.length) return false;
  
  await saveEventRegistrations(eventId, filtered);
  return true;
}

export async function deleteEventRegistrations(eventId: string): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(EVENTS_STORE_NAME);
      const key = `registrations/${eventId}.json`;
      await store.delete(key);
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'events', 'registrations');
      const filePath = path.join(dataDir, `${eventId}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    console.error(`[EventStorage] Erreur suppression inscriptions pour ${eventId}:`, error);
  }
}

// Récupérer toutes les inscriptions pour tous les événements (pour le dashboard admin)
export async function loadAllRegistrations(): Promise<Record<string, EventRegistration[]>> {
  try {
    if (isNetlify()) {
      const store = getStore(EVENTS_STORE_NAME);
      const events = await loadEvents();
      const allRegistrations: Record<string, EventRegistration[]> = {};
      
      for (const event of events) {
        const key = `registrations/${event.id}.json`;
        const data = await store.get(key, { type: 'json' });
        if (data) {
          allRegistrations[event.id] = data as EventRegistration[];
        }
      }
      
      return allRegistrations;
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'events', 'registrations');
      if (!fs.existsSync(dataDir)) {
        return {};
      }
      
      const events = await loadEvents();
      const allRegistrations: Record<string, EventRegistration[]> = {};
      
      for (const event of events) {
        const filePath = path.join(dataDir, `${event.id}.json`);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          allRegistrations[event.id] = JSON.parse(content);
        }
      }
      
      return allRegistrations;
    }
  } catch (error) {
    console.error('[EventStorage] Erreur chargement toutes les inscriptions:', error);
    return {};
  }
}

