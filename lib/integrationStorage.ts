// Stockage des intégrations et inscriptions dans Netlify Blobs
// Architecture: tenf-integrations/integrations.json, registrations/{integrationId}.json

import { getStore } from '@netlify/blobs';
import fs from 'fs';
import path from 'path';

// ============================================
// TYPES
// ============================================

export interface Integration {
  id: string;
  title: string;
  description: string;
  image?: string;
  date: string; // ISO date
  category: string;
  location?: string; // DÉPRÉCIÉ: utiliser locationName et locationUrl à la place
  locationName?: string; // Nom d'affichage avec emoji (ex: "🎙・accueil-et-intégration")
  locationUrl?: string; // URL de la localisation
  invitedMembers?: string[]; // Twitch logins
  createdAt: string; // ISO timestamp
  createdBy: string; // Discord ID
  updatedAt?: string; // ISO timestamp
  isPublished: boolean; // Si l'intégration est visible sur /integration
}

export interface IntegrationRegistration {
  id: string;
  integrationId: string;
  twitchLogin: string; // Pseudo Twitch (extrait du lien)
  twitchChannelUrl: string; // Lien de chaîne Twitch (obligatoire)
  displayName: string; // Pseudo Discord (obligatoire)
  discordId?: string;
  discordUsername?: string; // Pseudo Discord (obligatoire, stocké aussi ici)
  parrain?: string; // Parrain TENF (personne qui a invité)
  registeredAt: string; // ISO timestamp
  notes?: string; // Notes optionnelles de l'utilisateur
  present?: boolean; // Présence à la réunion (true = présent, false = absent, undefined = non défini)
}

// ============================================
// CONSTANTES
// ============================================

const INTEGRATIONS_STORE_NAME = 'tenf-integrations';
const INTEGRATIONS_KEY = 'integrations.json';

function isNetlify(): boolean {
  return typeof getStore === 'function' || 
         !!process.env.NETLIFY || 
         !!process.env.NETLIFY_DEV;
}

// ============================================
// INTÉGRATIONS
// ============================================

export async function loadIntegrations(): Promise<Integration[]> {
  try {
    if (isNetlify()) {
      const store = getStore(INTEGRATIONS_STORE_NAME);
      const data = await store.get(INTEGRATIONS_KEY, { type: 'json' });
      return (data as Integration[]) || [];
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'integrations');
      const filePath = path.join(dataDir, INTEGRATIONS_KEY);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
      return [];
    }
  } catch (error) {
    console.error('[IntegrationStorage] Erreur chargement intégrations:', error);
    return [];
  }
}

export async function saveIntegrations(integrations: Integration[]): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(INTEGRATIONS_STORE_NAME);
      await store.set(INTEGRATIONS_KEY, JSON.stringify(integrations, null, 2));
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'integrations');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const filePath = path.join(dataDir, INTEGRATIONS_KEY);
      fs.writeFileSync(filePath, JSON.stringify(integrations, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('[IntegrationStorage] Erreur sauvegarde intégrations:', error);
    throw error;
  }
}

export async function getIntegration(integrationId: string): Promise<Integration | null> {
  const integrations = await loadIntegrations();
  return integrations.find(i => i.id === integrationId) || null;
}

export async function createIntegration(integration: Omit<Integration, 'id' | 'createdAt' | 'createdBy'>, createdBy?: string): Promise<Integration> {
  const integrations = await loadIntegrations();
  const newIntegration: Integration = {
    ...integration,
    id: `integration-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
    createdBy: createdBy || 'system',
  };
  integrations.push(newIntegration);
  await saveIntegrations(integrations);
  return newIntegration;
}

export async function updateIntegration(integrationId: string, updates: Partial<Integration>): Promise<Integration | null> {
  const integrations = await loadIntegrations();
  const index = integrations.findIndex(i => i.id === integrationId);
  if (index === -1) return null;
  
  integrations[index] = {
    ...integrations[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await saveIntegrations(integrations);
  return integrations[index];
}

export async function deleteIntegration(integrationId: string): Promise<boolean> {
  const integrations = await loadIntegrations();
  const initialLength = integrations.length;
  const filtered = integrations.filter(i => i.id !== integrationId);
  
  if (filtered.length === initialLength) return false;
  
  await saveIntegrations(filtered);
  
  // Supprimer aussi les inscriptions associées
  try {
    if (isNetlify()) {
      const store = getStore(INTEGRATIONS_STORE_NAME);
      await store.delete(`registrations/${integrationId}.json`);
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'integrations', 'registrations');
      const filePath = path.join(dataDir, `${integrationId}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    console.error('[IntegrationStorage] Erreur suppression inscriptions:', error);
  }
  
  return true;
}

// ============================================
// INSCRIPTIONS
// ============================================

export async function loadRegistrations(integrationId: string): Promise<IntegrationRegistration[]> {
  try {
    if (isNetlify()) {
      const store = getStore(INTEGRATIONS_STORE_NAME);
      const data = await store.get(`registrations/${integrationId}.json`, { type: 'json' });
      return (data as IntegrationRegistration[]) || [];
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'integrations', 'registrations');
      const filePath = path.join(dataDir, `${integrationId}.json`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
      return [];
    }
  } catch (error) {
    console.error('[IntegrationStorage] Erreur chargement inscriptions:', error);
    return [];
  }
}

export async function saveRegistrations(integrationId: string, registrations: IntegrationRegistration[]): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(INTEGRATIONS_STORE_NAME);
      await store.set(`registrations/${integrationId}.json`, JSON.stringify(registrations, null, 2));
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'integrations', 'registrations');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const filePath = path.join(dataDir, `${integrationId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(registrations, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('[IntegrationStorage] Erreur sauvegarde inscriptions:', error);
    throw error;
  }
}

export async function registerForIntegration(integrationId: string, registration: {
  twitchLogin: string;
  twitchChannelUrl: string;
  displayName: string; // Pseudo Discord
  discordId?: string;
  discordUsername?: string;
  parrain?: string;
  notes?: string;
}): Promise<IntegrationRegistration> {
  const registrations = await loadRegistrations(integrationId);
  
  // Vérifier si déjà inscrit (par twitchChannelUrl, twitchLogin, ou discordId)
  const existing = registrations.find(r => {
    // Vérifier par lien de chaîne Twitch
    if (r.twitchChannelUrl && registration.twitchChannelUrl && 
        r.twitchChannelUrl.toLowerCase() === registration.twitchChannelUrl.toLowerCase()) {
      return true;
    }
    // Vérifier par twitchLogin
    if (r.twitchLogin.toLowerCase() === registration.twitchLogin.toLowerCase()) {
      return true;
    }
    // Vérifier par discordId si fourni
    if (registration.discordId && r.discordId && r.discordId === registration.discordId) {
      return true;
    }
    // Vérifier par pseudo Discord
    if (registration.displayName && r.displayName && 
        r.displayName.toLowerCase() === registration.displayName.toLowerCase()) {
      return true;
    }
    return false;
  });
  
  if (existing) {
    throw new Error('Vous êtes déjà inscrit à cette intégration');
  }
  
  const newRegistration: IntegrationRegistration = {
    id: `reg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    integrationId,
    ...registration,
    registeredAt: new Date().toISOString(),
  };
  
  registrations.push(newRegistration);
  await saveRegistrations(integrationId, registrations);
  return newRegistration;
}

export async function unregisterFromIntegration(integrationId: string, twitchLogin: string): Promise<boolean> {
  const registrations = await loadRegistrations(integrationId);
  const initialLength = registrations.length;
  const filtered = registrations.filter(r => r.twitchLogin.toLowerCase() !== twitchLogin.toLowerCase());
  
  if (filtered.length === initialLength) return false;
  
  await saveRegistrations(integrationId, filtered);
  return true;
}

export async function getAllRegistrations(): Promise<Record<string, IntegrationRegistration[]>> {
  const integrations = await loadIntegrations();
  const allRegistrations: Record<string, IntegrationRegistration[]> = {};
  
  for (const integration of integrations) {
    allRegistrations[integration.id] = await loadRegistrations(integration.id);
  }
  
  return allRegistrations;
}

