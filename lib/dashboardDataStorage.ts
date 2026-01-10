// Stockage des données manuelles du dashboard dans Netlify Blobs
// Architecture: tenf-dashboard-data/dashboard.json

import { getStore } from '@netlify/blobs';
import fs from 'fs';
import path from 'path';

// ============================================
// TYPES
// ============================================

export interface MonthlyDataPoint {
  month: string; // Format: "Janv", "Fév", etc.
  value: number;
}

export interface RankingMember {
  id: number;
  name: string;
  avatar: string;
  value: number; // messages ou vocalHours selon le type
  progression?: string; // Pour les rankings textuels (ex: "+3", "-2")
}

export interface TopClip {
  id: number;
  name: string;
  avatar: string;
  duration: string;
  thumbnail: string;
}

export interface DashboardData {
  twitchActivity: MonthlyDataPoint[]; // Graphique activité Twitch
  spotlightProgression: MonthlyDataPoint[]; // Graphique progression Spotlight
  vocalRanking: RankingMember[]; // Top membres vocaux
  textRanking: RankingMember[]; // Top membres messages
  topClips: TopClip[]; // Top clips
  lastUpdated: string; // ISO timestamp
  updatedBy?: string; // Discord ID de l'admin qui a mis à jour
}

// ============================================
// CONSTANTES
// ============================================

const DASHBOARD_STORE_NAME = 'tenf-dashboard-data';
const DASHBOARD_KEY = 'dashboard.json';

// Données par défaut
const defaultDashboardData: DashboardData = {
  twitchActivity: [
    { month: "Janv", value: 45 },
    { month: "Fév", value: 52 },
    { month: "Mar", value: 68 },
    { month: "Avr", value: 75 },
    { month: "Mai", value: 95 },
    { month: "Juin", value: 88 },
    { month: "Juil", value: 72 },
    { month: "Août", value: 80 },
    { month: "Sept", value: 85 },
    { month: "Oct", value: 90 },
    { month: "Nov", value: 100 },
    { month: "Déc", value: 115 },
  ],
  spotlightProgression: [
    { month: "Mai", value: 45 },
    { month: "Juin", value: 52 },
    { month: "Juil", value: 60 },
    { month: "Août", value: 68 },
    { month: "Sept", value: 75 },
    { month: "Oct", value: 82 },
    { month: "Nov", value: 88 },
    { month: "Déc", value: 95 },
  ],
  vocalRanking: [
    { id: 1, name: "Jenny", avatar: "https://placehold.co/40x40?text=J", value: 58 },
    { id: 2, name: "Clara", avatar: "https://placehold.co/40x40?text=C", value: 71 },
    { id: 3, name: "NeXou", avatar: "https://placehold.co/40x40?text=N", value: 1271 },
    { id: 4, name: "Red", avatar: "https://placehold.co/40x40?text=R", value: 834 },
  ],
  textRanking: [
    { id: 1, name: "Jenny", avatar: "https://placehold.co/40x40?text=J", value: 151000, progression: "+3" },
    { id: 2, name: "Clara", avatar: "https://placehold.co/40x40?text=C", value: 1872, progression: "-2" },
    { id: 3, name: "NeXou", avatar: "https://placehold.co/40x40?text=N", value: 1763, progression: "-4" },
    { id: 4, name: "Red", avatar: "https://placehold.co/40x40?text=R", value: 1238, progression: "+1" },
  ],
  topClips: [
    { id: 1, name: "Jenny", avatar: "https://placehold.co/64x64?text=J", duration: "316 h", thumbnail: "https://placehold.co/120x68?text=Clip" },
    { id: 2, name: "Clara", avatar: "https://placehold.co/64x64?text=C", duration: "281 h", thumbnail: "https://placehold.co/120x68?text=Clip" },
    { id: 3, name: "NeXou", avatar: "https://placehold.co/64x64?text=N", duration: "245 h", thumbnail: "https://placehold.co/120x68?text=Clip" },
    { id: 4, name: "Red", avatar: "https://placehold.co/64x64?text=R", duration: "198 h", thumbnail: "https://placehold.co/120x68?text=Clip" },
  ],
  lastUpdated: new Date().toISOString(),
};

// ============================================
// UTILITAIRES
// ============================================

function isNetlify(): boolean {
  return typeof getStore === 'function' || 
         !!process.env.NETLIFY || 
         !!process.env.NETLIFY_DEV;
}

// ============================================
// CHARGEMENT ET SAUVEGARDE
// ============================================

export async function loadDashboardData(): Promise<DashboardData> {
  try {
    if (isNetlify()) {
      const store = getStore(DASHBOARD_STORE_NAME);
      const data = await store.get(DASHBOARD_KEY, { type: 'json' });
      if (data) {
        // Fusionner avec les données par défaut pour les nouvelles propriétés
        return {
          ...defaultDashboardData,
          ...(data as DashboardData),
        };
      }
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'dashboard');
      const filePath = path.join(dataDir, DASHBOARD_KEY);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(content);
        return {
          ...defaultDashboardData,
          ...parsed,
        };
      }
    }
  } catch (error) {
    console.error('[DashboardDataStorage] Erreur chargement:', error);
  }
  
  // Retourner les données par défaut si erreur ou fichier inexistant
  return defaultDashboardData;
}

export async function saveDashboardData(data: DashboardData, updatedBy?: string): Promise<void> {
  try {
    const dataToSave: DashboardData = {
      ...data,
      lastUpdated: new Date().toISOString(),
      updatedBy: updatedBy || data.updatedBy,
    };

    if (isNetlify()) {
      const store = getStore(DASHBOARD_STORE_NAME);
      await store.set(DASHBOARD_KEY, JSON.stringify(dataToSave, null, 2));
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'dashboard');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const filePath = path.join(dataDir, DASHBOARD_KEY);
      fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('[DashboardDataStorage] Erreur sauvegarde:', error);
    throw error;
  }
}

export async function updateDashboardSection(
  section: keyof Pick<DashboardData, 'twitchActivity' | 'spotlightProgression' | 'vocalRanking' | 'textRanking' | 'topClips'>,
  data: MonthlyDataPoint[] | RankingMember[] | TopClip[],
  updatedBy?: string
): Promise<void> {
  const currentData = await loadDashboardData();
  const updatedData: DashboardData = {
    ...currentData,
    [section]: data,
    lastUpdated: new Date().toISOString(),
    updatedBy: updatedBy || currentData.updatedBy,
  };
  await saveDashboardData(updatedData, updatedBy);
}

