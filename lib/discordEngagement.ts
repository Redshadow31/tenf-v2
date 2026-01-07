// Utilitaires pour le parsing et le scoring de l'engagement Discord

export interface EngagementRow {
  rank: number;
  pseudo: string;
  discordId?: string;
  value: number; // nbMessages ou nbMinutes
  matchedMemberId?: string; // discordId du membre TENF matché
}

export interface EngagementParseResult {
  rows: EngagementRow[];
  errors: Array<{ line: number; reason: string }>;
  ignoredNotMember: string[]; // Pseudos ignorés car non-membres
  matched: number; // Nombre de lignes matchées avec des membres TENF
  totalLines: number;
}

export interface MemberEngagement {
  discordId: string;
  displayName: string;
  twitchLogin: string;
  role?: string;
  nbMessages?: number;
  nbVocalMinutes?: number;
  noteEcrit?: number;
  noteVocal?: number;
  noteFinale?: number;
  appreciation?: string;
  memberSince?: string;
}

// Seuils pour les notes (paramétrables)
export const ENGAGEMENT_SEUILS = {
  messages: {
    min: 10, // Minimum pour avoir une note > 0
    seuils: [10, 50, 150, 300, 500], // Seuils pour notes 1, 2, 3, 4, 5
  },
  vocaux: {
    minMinutes: 10, // Minimum en minutes pour avoir une note > 0
    seuils: [10, 30, 60, 120, 200], // Seuils en minutes pour notes 1, 2, 3, 4, 5
  },
};

export const APPRECIATIONS: Record<number, string> = {
  0: "Absent ce mois-ci",
  1: "Présence légère",
  2: "Participation correcte",
  3: "Bon engagement",
  4: "Très bon engagement",
  5: "Excellent engagement",
};

/**
 * Normalise un pseudo Discord pour le matching (lowercase, underscores)
 */
export function normalizeDiscordUsername(username: string): string {
  return (username || "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .trim();
}

/**
 * Valide un Discord ID (17-20 chiffres)
 */
export function isValidDiscordId(id: string | undefined | null): boolean {
  if (!id) return false;
  const numStr = String(id).trim();
  return /^\d{17,20}$/.test(numStr);
}

/**
 * Nettoie une valeur numérique (supprime virgules, espaces, convertit notation scientifique)
 */
export function cleanNumericValue(value: string): number | null {
  if (!value) return null;
  
  // Ignorer les valeurs en notation scientifique trop grandes (probablement des IDs mal parsés)
  if (value.includes('E+') || value.includes('e+')) {
    const expMatch = value.match(/[Ee]\+(\d+)/);
    if (expMatch && parseInt(expMatch[1]) > 10) {
      return null; // Probablement un Discord ID mal parsé
    }
  }
  
  // Nettoyer : virgules, espaces, notation scientifique
  let cleaned = value
    .replace(/,/g, '.')
    .replace(/\s+/g, '')
    .replace(/[Ee][+-]?\d+/g, ''); // Supprimer notation scientifique si pas trop grande
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Parse un texte TSV contenant des stats d'engagement Discord
 * Format attendu: RANG<TAB>pseudo<TAB>discordId<TAB>valeur
 */
export function parseDiscordEngagementTSV(
  text: string,
  membersMap: Map<string, { discordId: string; displayName: string; twitchLogin: string }>
): EngagementParseResult {
  const lines = text.split('\n');
  const rows: EngagementRow[] = [];
  const errors: Array<{ line: number; reason: string }> = [];
  const ignoredNotMember: string[] = [];
  let matched = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Séparer par tab ou multiples espaces
    const parts = line.split(/\t|\s{2,}/).filter(p => p.trim());
    
    if (parts.length < 2) {
      errors.push({ line: i + 1, reason: "Format invalide (moins de 2 colonnes)" });
      continue;
    }

    const rank = parseInt(parts[0]);
    if (isNaN(rank)) {
      errors.push({ line: i + 1, reason: "Rang invalide" });
      continue;
    }

    const pseudo = parts[1].trim();
    if (!pseudo) {
      errors.push({ line: i + 1, reason: "Pseudo manquant" });
      continue;
    }

    // Discord ID (optionnel, peut être en 3e ou 4e position)
    let discordId: string | undefined;
    let valueStr: string | undefined;

    if (parts.length >= 3) {
      // Si la 3e colonne ressemble à un ID (17-20 chiffres), c'est l'ID
      if (isValidDiscordId(parts[2])) {
        discordId = parts[2].trim();
        valueStr = parts[3] || "0";
      } else {
        // Sinon la 3e colonne est probablement la valeur
        valueStr = parts[2];
      }
    } else {
      valueStr = parts[2] || "0";
    }

    if (parts.length >= 4 && !discordId) {
      valueStr = parts[3];
    }

    const value = cleanNumericValue(valueStr || "0");
    if (value === null) {
      errors.push({ line: i + 1, reason: "Valeur numérique invalide" });
      continue;
    }

    // Matching avec les membres TENF
    let matchedMemberId: string | undefined;
    
    // Priorité 1: matching par discordId si disponible et valide
    if (discordId && isValidDiscordId(discordId)) {
      const member = membersMap.get(discordId);
      if (member) {
        matchedMemberId = member.discordId;
      }
    }

    // Priorité 2: matching par pseudo normalisé
    if (!matchedMemberId) {
      const normalizedPseudo = normalizeDiscordUsername(pseudo);
      for (const [id, member] of membersMap.entries()) {
        const normalizedMember = normalizeDiscordUsername(member.displayName);
        if (normalizedMember === normalizedPseudo) {
          matchedMemberId = id;
          break;
        }
      }
    }

    // Si pas de match, ignorer
    if (!matchedMemberId) {
      ignoredNotMember.push(pseudo);
      continue;
    }

    rows.push({
      rank,
      pseudo,
      discordId,
      value,
      matchedMemberId,
    });
    matched++;
  }

  return {
    rows,
    errors,
    ignoredNotMember,
    matched,
    totalLines: lines.length,
  };
}

/**
 * Calcule la note écrite (sur 5) basée sur le nombre de messages
 */
export function calculateNoteEcrit(nbMessages: number | undefined): number {
  if (!nbMessages || nbMessages < ENGAGEMENT_SEUILS.messages.min) {
    return 0;
  }

  const seuils = ENGAGEMENT_SEUILS.messages.seuils;
  for (let i = seuils.length - 1; i >= 0; i--) {
    if (nbMessages >= seuils[i]) {
      return i + 1;
    }
  }

  return 0;
}

/**
 * Calcule la note vocale (sur 5) basée sur le nombre de minutes
 */
export function calculateNoteVocal(nbMinutes: number | undefined): number {
  if (!nbMinutes || nbMinutes < ENGAGEMENT_SEUILS.vocaux.minMinutes) {
    return 0;
  }

  const seuils = ENGAGEMENT_SEUILS.vocaux.seuils;
  for (let i = seuils.length - 1; i >= 0; i--) {
    if (nbMinutes >= seuils[i]) {
      return i + 1;
    }
  }

  return 0;
}

/**
 * Calcule la note finale = max(noteEcrit, noteVocal)
 */
export function calculateNoteFinale(noteEcrit: number, noteVocal: number): number {
  return Math.max(noteEcrit, noteVocal);
}

/**
 * Obtient l'appréciation textuelle pour une note
 */
export function getAppreciation(note: number): string {
  return APPRECIATIONS[note] || APPRECIATIONS[0];
}

