/**
 * Utilitaires côté client pour la gestion des raids
 * Ces fonctions n'ont pas de dépendances Node.js (pas de fs, etc.)
 */

/**
 * Extrait tous les IDs Discord d'un message au format <@ID> ou <@!ID>
 * @param message Le contenu du message Discord
 * @returns Tableau des IDs Discord trouvés (sans les chevrons)
 */
export function extractDiscordIds(message: string): string[] {
  if (!message || typeof message !== 'string') {
    return [];
  }
  
  // Pattern pour <@ID> ou <@!ID> (mention Discord)
  const mentionPattern = /<@!?(\d+)>/g;
  const ids: string[] = [];
  let match;
  
  while ((match = mentionPattern.exec(message)) !== null) {
    const discordId = match[1];
    if (discordId && !ids.includes(discordId)) {
      ids.push(discordId);
    }
  }
  
  return ids;
}

