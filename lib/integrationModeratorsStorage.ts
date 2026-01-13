// Stockage des inscriptions modérateur dans Netlify Blobs
// Architecture: tenf-integrations/moderators/{integrationId}.json

import { getStore } from '@netlify/blobs';
import fs from 'fs';
import path from 'path';

// ============================================
// TYPES
// ============================================

export interface ModeratorRegistration {
  id: string;
  integrationId: string;
  pseudo: string;
  role: string;
  placement: "Animateur" | "Co-animateur" | "Observateur";
  registeredAt: string; // ISO timestamp
}

// ============================================
// CONSTANTES
// ============================================

const INTEGRATIONS_STORE_NAME = 'tenf-integrations';

function isNetlify(): boolean {
  return typeof getStore === 'function' || 
         !!process.env.NETLIFY || 
         !!process.env.NETLIFY_DEV;
}

// ============================================
// INSCRIPTIONS MODÉRATEUR
// ============================================

export async function loadModeratorRegistrations(integrationId: string): Promise<ModeratorRegistration[]> {
  try {
    if (isNetlify()) {
      const store = getStore(INTEGRATIONS_STORE_NAME);
      const data = await store.get(`moderators/${integrationId}.json`, { type: 'json' });
      return (data as ModeratorRegistration[]) || [];
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'integrations', 'moderators');
      const filePath = path.join(dataDir, `${integrationId}.json`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
      return [];
    }
  } catch (error) {
    console.error('[ModeratorStorage] Erreur chargement inscriptions modérateur:', error);
    return [];
  }
}

export async function saveModeratorRegistrations(
  integrationId: string, 
  registrations: ModeratorRegistration[]
): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(INTEGRATIONS_STORE_NAME);
      await store.set(`moderators/${integrationId}.json`, JSON.stringify(registrations, null, 2));
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'integrations', 'moderators');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const filePath = path.join(dataDir, `${integrationId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(registrations, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('[ModeratorStorage] Erreur sauvegarde inscriptions modérateur:', error);
    throw error;
  }
}

export async function registerModerator(
  integrationId: string, 
  registration: {
    pseudo: string;
    role: string;
    placement: "Animateur" | "Co-animateur" | "Observateur";
  }
): Promise<ModeratorRegistration> {
  const registrations = await loadModeratorRegistrations(integrationId);
  
  // Vérifier si déjà inscrit (même pseudo, case-insensitive)
  const existing = registrations.find(r => 
    r.pseudo.toLowerCase() === registration.pseudo.toLowerCase()
  );
  
  if (existing) {
    throw new Error('déjà inscrit');
  }
  
  const newRegistration: ModeratorRegistration = {
    id: `mod-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    integrationId,
    ...registration,
    registeredAt: new Date().toISOString(),
  };
  
  registrations.push(newRegistration);
  await saveModeratorRegistrations(integrationId, registrations);
  return newRegistration;
}

