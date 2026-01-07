// Stockage des données d'engagement Discord par mois
// Architecture: tenf-discord-engagement/{YYYY-MM}.json

import { getStore } from '@netlify/blobs';
import fs from 'fs';
import path from 'path';
import { MemberEngagement } from './discordEngagement';

// Réexporter MemberEngagement pour faciliter les imports
export type { MemberEngagement } from './discordEngagement';

const STORE_NAME = 'tenf-discord-engagement';

export interface DiscordEngagementData {
  month: string; // YYYY-MM
  generatedAt: string; // ISO timestamp
  hasMessagesImport: boolean;
  hasVocalsImport: boolean;
  messagesImportedAt?: string;
  vocalsImportedAt?: string;
  dataByMember: Record<string, MemberEngagement>; // Key = discordId
}

function isNetlify(): boolean {
  // Vérifier les variables d'environnement Netlify
  if (process.env.NETLIFY || process.env.NETLIFY_DEV) {
    return true;
  }
  
  // Vérifier si on est dans un environnement Lambda (Netlify Functions)
  if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT) {
    return true;
  }
  
  // Vérifier si on est dans un environnement serverless (Netlify)
  if (process.env.NETLIFY_FUNCTIONS_VERSION) {
    return true;
  }
  
  // Si on est dans un environnement Next.js déployé (pas Vercel), c'est probablement Netlify
  // Mais on vérifie d'abord si on peut accéder à getStore (Netlify Blobs)
  try {
    if (typeof window === "undefined") {
      // Tester si getStore est disponible (Netlify Blobs)
      const { getStore } = require("@netlify/blobs");
      if (getStore) {
        // Si getStore est disponible, on est probablement sur Netlify
        // Mais on vérifie aussi qu'on n'est pas en développement local avec fichiers
        const fs = require("fs");
        const path = require("path");
        const dataDir = path.join(process.cwd(), "data");
        // Si le dossier data existe et est accessible, on est en développement local
        try {
          if (fs.existsSync(dataDir) && fs.statSync(dataDir).isDirectory()) {
            // En développement local, on peut utiliser les fichiers
            return false;
          }
        } catch {
          // Si on ne peut pas accéder au système de fichiers, on est sur Netlify
          return true;
        }
      }
    }
  } catch {
    // Si getStore n'est pas disponible, on n'est pas sur Netlify
  }
  
  // Par défaut, si on n'est pas sur Vercel et qu'on n'a pas de fichiers locaux, on est sur Netlify
  return false;
}

/**
 * Récupère les données d'engagement Discord pour un mois
 */
export async function getDiscordEngagementData(
  month: string
): Promise<DiscordEngagementData | null> {
  try {
    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      const data = await store.get(`${month}.json`, { type: 'json' }).catch(() => null);
      return data as DiscordEngagementData | null;
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'discord-engagement');
      const filePath = path.join(dataDir, `${month}.json`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
      return null;
    }
  } catch (error) {
    console.error(`[DiscordEngagementStorage] Erreur récupération ${month}:`, error);
    return null;
  }
}

/**
 * Sauvegarde les données d'engagement Discord
 */
export async function saveDiscordEngagementData(
  data: DiscordEngagementData
): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      await store.set(
        `${data.month}.json`,
        JSON.stringify(data, null, 2)
      );
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'discord-engagement');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const filePath = path.join(dataDir, `${data.month}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error(`[DiscordEngagementStorage] Erreur sauvegarde ${data.month}:`, error);
    throw error;
  }
}

