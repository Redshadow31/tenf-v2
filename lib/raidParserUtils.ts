/**
 * Utilitaires pour le parsing des raids Discord
 */

/**
 * Normalise un handle Discord/Twitch pour le matching
 * @param handle - Le handle à normaliser (peut contenir @, emojis, etc.)
 * @returns Handle normalisé pour le matching
 */
export function normalizeHandle(handle: string): string {
  if (!handle) return "";
  
  let normalized = handle
    .trim()
    // Supprimer le @ au début
    .replace(/^@+/, '')
    // Supprimer les guillemets et backticks
    .replace(/^["'`]|["'`]$/g, '')
    // Mettre en minuscule
    .toLowerCase()
    // Supprimer les emojis et caractères non-word sauf [a-z0-9._-]
    .replace(/[^\w._-]/g, '')
    // Supprimer la ponctuation finale
    .replace(/[.,;:!?)\]}]$/, '')
    .trim();
  
  return normalized;
}

/**
 * Normalise un handle pour l'affichage (conserve plus d'informations)
 * @param handle - Le handle à normaliser
 * @returns Handle normalisé pour l'affichage
 */
export function normalizeHandleForDisplay(handle: string): string {
  if (!handle) return "";
  
  return handle
    .trim()
    .replace(/^@+/, '')
    .replace(/^["'`]|["'`]$/g, '')
    .trim();
}

/**
 * Regex améliorée pour détecter les dates dans les messages Discord
 * Format: DD/MM/YYYY HH:mm ou DD/MM/YYYY HH:mm:ss
 */
export const DATE_PATTERN = /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?/;

/**
 * Regex tolérante pour détecter les raids
 * Supporte:
 * - @X a raid @Y
 * - @X à raid @Y
 * - @X A raid @Y
 * - @X raid @Y (sans "a/à")
 * - @X vers @Y
 * - @X chez @Y
 * - Double espaces
 * - Texte après la cible (ignoré)
 * 
 * Utiliser avec matchAll pour trouver tous les raids dans une ligne
 */
export const RAID_PATTERN = /@([^\s]+)\s*(?:a|à|A)?\s*(?:raid|vers|chez)\s*@([^\s]+)/gi;

/**
 * Parse une date depuis un string au format DD/MM/YYYY HH:mm
 */
export function parseDate(dateStr: string): Date | null {
  const match = dateStr.match(DATE_PATTERN);
  if (!match) return null;
  
  const [, day, month, year, hour, minute] = match;
  const date = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute)
  );
  
  // Vérifier que la date est valide
  if (isNaN(date.getTime())) return null;
  
  return date;
}

