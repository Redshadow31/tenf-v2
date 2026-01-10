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
 * Normalise un handle pour l'affichage (conserve plus d'informations, incluant emojis)
 * @param handle - Le handle à normaliser
 * @returns Handle normalisé pour l'affichage (avec emojis préservés)
 */
export function normalizeHandleForDisplay(handle: string): string {
  if (!handle) return "";
  
  // Préserver les emojis et caractères spéciaux pour l'affichage
  // Seulement nettoyer les @ multiples et les guillemets
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
 * - @X raid vers @Y
 * - @X raid chez @Y
 * - Double espaces
 * - Emojis dans les pseudos (ex: @😈MiSsLyliee🦄)
 * - Texte après la cible (ignoré, ex: "hier ^^")
 * 
 * Utiliser avec matchAll pour trouver tous les raids dans une ligne
 * 
 * Pattern amélioré:
 * - Capture les pseudos avec emojis: @([^\s@]+) capture tout sauf espaces et @
 * - Supporte "a raid", "à raid", "raid", "raid vers", "raid chez"
 * - Capture la cible jusqu'au premier espace, puis ignore le reste
 */
export const RAID_PATTERN = /@([^\s@]+)\s+(?:(?:a|à|A)\s+)?raid(?:\s+(?:vers|chez))?\s+@([^\s@]+)/giu;

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

