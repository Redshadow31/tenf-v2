// Système de stockage pour TENF Academy
// Utilise Netlify Blobs pour la persistance

import { getStore } from '@netlify/blobs';
import fs from 'fs';
import path from 'path';

// ============================================
// TYPES
// ============================================

export interface AcademyPromo {
  id: string;
  name: string;
  description?: string;
  startDate: string; // ISO date
  endDate?: string; // ISO date
  password: string; // Hashé
  isActive: boolean;
  createdAt: string; // ISO timestamp
  createdBy: string; // Discord ID
}

export interface AcademyAccess {
  id: string;
  userId: string; // Discord ID ou identifiant unique
  promoId: string;
  role: 'participant' | 'mentor' | 'admin';
  accessType: 'password' | 'discord';
  accessedAt: string; // ISO timestamp
  accessedBy?: string; // Discord ID (pour les accès Discord)
}

export interface AcademyLog {
  id: string;
  userId: string;
  promoId: string;
  action: 'access' | 'promo_created' | 'promo_updated' | 'access_granted' | 'access_revoked';
  accessType: 'password' | 'discord';
  timestamp: string; // ISO timestamp
  metadata?: Record<string, any>;
}

export interface AcademySettings {
  enabled: boolean;
  allowedDiscordRoles: string[]; // IDs de rôles Discord autorisés
  lastUpdated: string; // ISO timestamp
  updatedBy: string; // Discord ID
}

// ============================================
// CONSTANTES
// ============================================

const ACADEMY_STORE_NAME = 'tenf-academy';

function isNetlify(): boolean {
  return typeof getStore === 'function' || 
         !!process.env.NETLIFY || 
         !!process.env.NETLIFY_DEV;
}

// ============================================
// PROMOS
// ============================================

export async function loadPromos(): Promise<AcademyPromo[]> {
  try {
    if (isNetlify()) {
      const store = getStore(ACADEMY_STORE_NAME);
      const promos = await store.get('promos.json', { type: 'json' });
      return promos || [];
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'academy');
      const filePath = path.join(dataDir, 'promos.json');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
      return [];
    }
  } catch (error) {
    console.error('[AcademyStorage] Erreur chargement promos:', error);
    return [];
  }
}

export async function savePromos(promos: AcademyPromo[]): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(ACADEMY_STORE_NAME);
      await store.set('promos.json', JSON.stringify(promos, null, 2));
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'academy');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const filePath = path.join(dataDir, 'promos.json');
      fs.writeFileSync(filePath, JSON.stringify(promos, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('[AcademyStorage] Erreur sauvegarde promos:', error);
    throw error;
  }
}

export async function getPromo(promoId: string): Promise<AcademyPromo | null> {
  const promos = await loadPromos();
  return promos.find(p => p.id === promoId) || null;
}

export async function createPromo(promo: Omit<AcademyPromo, 'id' | 'createdAt'>): Promise<AcademyPromo> {
  const promos = await loadPromos();
  const newPromo: AcademyPromo = {
    ...promo,
    id: `promo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  promos.push(newPromo);
  await savePromos(promos);
  return newPromo;
}

export async function updatePromo(promoId: string, updates: Partial<AcademyPromo>): Promise<AcademyPromo | null> {
  const promos = await loadPromos();
  const index = promos.findIndex(p => p.id === promoId);
  if (index === -1) return null;
  
  promos[index] = { ...promos[index], ...updates };
  await savePromos(promos);
  return promos[index];
}

// ============================================
// ACCÈS
// ============================================

export async function loadAccesses(): Promise<AcademyAccess[]> {
  try {
    if (isNetlify()) {
      const store = getStore(ACADEMY_STORE_NAME);
      const accesses = await store.get('accesses.json', { type: 'json' });
      return accesses || [];
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'academy');
      const filePath = path.join(dataDir, 'accesses.json');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
      return [];
    }
  } catch (error) {
    console.error('[AcademyStorage] Erreur chargement accès:', error);
    return [];
  }
}

export async function saveAccesses(accesses: AcademyAccess[]): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(ACADEMY_STORE_NAME);
      await store.set('accesses.json', JSON.stringify(accesses, null, 2));
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'academy');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const filePath = path.join(dataDir, 'accesses.json');
      fs.writeFileSync(filePath, JSON.stringify(accesses, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('[AcademyStorage] Erreur sauvegarde accès:', error);
    throw error;
  }
}

export async function getUserAccesses(userId: string): Promise<AcademyAccess[]> {
  const accesses = await loadAccesses();
  return accesses.filter(a => a.userId === userId);
}

export async function hasAccess(userId: string, promoId?: string): Promise<boolean> {
  const accesses = await loadAccesses();
  if (promoId) {
    return accesses.some(a => a.userId === userId && a.promoId === promoId);
  }
  return accesses.some(a => a.userId === userId);
}

export async function grantAccess(access: Omit<AcademyAccess, 'id' | 'accessedAt'>): Promise<AcademyAccess> {
  const accesses = await loadAccesses();
  
  // Vérifier si l'accès existe déjà
  const existingIndex = accesses.findIndex(
    a => a.userId === access.userId && a.promoId === access.promoId
  );
  
  const newAccess: AcademyAccess = {
    ...access,
    id: `access-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    accessedAt: new Date().toISOString(),
  };
  
  if (existingIndex !== -1) {
    // Mettre à jour l'accès existant
    accesses[existingIndex] = newAccess;
  } else {
    // Créer un nouvel accès
    accesses.push(newAccess);
  }
  
  await saveAccesses(accesses);
  return newAccess;
}

export async function revokeAccess(userId: string, promoId: string): Promise<boolean> {
  const accesses = await loadAccesses();
  const initialLength = accesses.length;
  const filtered = accesses.filter(a => !(a.userId === userId && a.promoId === promoId));
  
  if (filtered.length < initialLength) {
    await saveAccesses(filtered);
    return true;
  }
  return false;
}

// ============================================
// LOGS
// ============================================

export async function loadLogs(): Promise<AcademyLog[]> {
  try {
    if (isNetlify()) {
      const store = getStore(ACADEMY_STORE_NAME);
      const logs = await store.get('logs.json', { type: 'json' });
      return logs || [];
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'academy');
      const filePath = path.join(dataDir, 'logs.json');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
      return [];
    }
  } catch (error) {
    console.error('[AcademyStorage] Erreur chargement logs:', error);
    return [];
  }
}

export async function saveLogs(logs: AcademyLog[]): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(ACADEMY_STORE_NAME);
      await store.set('logs.json', JSON.stringify(logs, null, 2));
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'academy');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const filePath = path.join(dataDir, 'logs.json');
      fs.writeFileSync(filePath, JSON.stringify(logs, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('[AcademyStorage] Erreur sauvegarde logs:', error);
    throw error;
  }
}

export async function addLog(log: Omit<AcademyLog, 'id' | 'timestamp'>): Promise<void> {
  const logs = await loadLogs();
  const newLog: AcademyLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };
  logs.push(newLog);
  
  // Garder seulement les 1000 derniers logs
  if (logs.length > 1000) {
    logs.splice(0, logs.length - 1000);
  }
  
  await saveLogs(logs);
}

// ============================================
// SETTINGS
// ============================================

export async function loadSettings(): Promise<AcademySettings> {
  try {
    if (isNetlify()) {
      const store = getStore(ACADEMY_STORE_NAME);
      const settings = await store.get('settings.json', { type: 'json' });
      return settings || {
        enabled: false,
        allowedDiscordRoles: [],
        lastUpdated: new Date().toISOString(),
        updatedBy: '',
      };
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'academy');
      const filePath = path.join(dataDir, 'settings.json');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
      return {
        enabled: false,
        allowedDiscordRoles: [],
        lastUpdated: new Date().toISOString(),
        updatedBy: '',
      };
    }
  } catch (error) {
    console.error('[AcademyStorage] Erreur chargement settings:', error);
    return {
      enabled: false,
      allowedDiscordRoles: [],
      lastUpdated: new Date().toISOString(),
      updatedBy: '',
    };
  }
}

export async function saveSettings(settings: AcademySettings): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(ACADEMY_STORE_NAME);
      await store.set('settings.json', JSON.stringify(settings, null, 2));
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'academy');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const filePath = path.join(dataDir, 'settings.json');
      fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('[AcademyStorage] Erreur sauvegarde settings:', error);
    throw error;
  }
}
