// Utilitaires pour l'intégration Statbot API

export interface StatbotMember {
  discordId: string;
  messages: number;
  voiceMinutes: number;
  rank: number;
}

export interface StatbotApiMember {
  id: string;
  username?: string;
  messages?: number;
  voice_minutes?: number;
  rank?: number;
}

export interface StatbotApiResponse {
  members?: StatbotApiMember[];
  messages?: any[];
  voice?: any[];
}

/**
 * Récupère les données depuis l'API Statbot
 */
export async function fetchStatbotData(serverId: string, apiKey: string): Promise<StatbotApiResponse> {
  const baseUrl = 'https://api.statbot.net/v1/public';
  
  try {
    // Récupérer les membres
    const membersResponse = await fetch(`${baseUrl}/${serverId}/members`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!membersResponse.ok) {
      throw new Error(`Statbot API error (members): ${membersResponse.status} ${membersResponse.statusText}`);
    }

    const membersData = await membersResponse.json();

    // Récupérer les messages
    const messagesResponse = await fetch(`${baseUrl}/${serverId}/messages`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!messagesResponse.ok) {
      throw new Error(`Statbot API error (messages): ${messagesResponse.status} ${messagesResponse.statusText}`);
    }

    const messagesData = await messagesResponse.json();

    // Récupérer les données vocales
    const voiceResponse = await fetch(`${baseUrl}/${serverId}/voice`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!voiceResponse.ok) {
      throw new Error(`Statbot API error (voice): ${voiceResponse.status} ${voiceResponse.statusText}`);
    }

    const voiceData = await voiceResponse.json();

    return {
      members: membersData.members || membersData,
      messages: messagesData.messages || messagesData,
      voice: voiceData.voice || voiceData,
    };
  } catch (error) {
    console.error('[Statbot] Erreur lors de la récupération des données:', error);
    throw error;
  }
}

/**
 * Filtre les membres TENF à partir de leur Discord ID
 * et formate les données pour le stockage
 */
export function filterTENFMembers(
  statbotData: StatbotApiResponse,
  tenfDiscordIds: string[]
): StatbotMember[] {
  const tenfMembersMap = new Map<string, StatbotMember>();

  // Traiter les membres de l'API Statbot
  if (statbotData.members && Array.isArray(statbotData.members)) {
    statbotData.members.forEach((member: StatbotApiMember) => {
      const discordId = member.id;
      
      // Vérifier si c'est un membre TENF
      if (tenfDiscordIds.includes(discordId)) {
        tenfMembersMap.set(discordId, {
          discordId,
          messages: member.messages || 0,
          voiceMinutes: member.voice_minutes || 0,
          rank: member.rank || 0,
        });
      }
    });
  }

  // Traiter les données de messages pour calculer les totaux
  if (statbotData.messages && Array.isArray(statbotData.messages)) {
    statbotData.messages.forEach((msg: any) => {
      const discordId = msg.user_id || msg.member_id;
      if (discordId && tenfDiscordIds.includes(discordId)) {
        const existing = tenfMembersMap.get(discordId);
        if (existing) {
          existing.messages = (existing.messages || 0) + 1;
        } else {
          tenfMembersMap.set(discordId, {
            discordId,
            messages: 1,
            voiceMinutes: 0,
            rank: 0,
          });
        }
      }
    });
  }

  // Traiter les données vocales pour calculer les minutes
  if (statbotData.voice && Array.isArray(statbotData.voice)) {
    statbotData.voice.forEach((voice: any) => {
      const discordId = voice.user_id || voice.member_id;
      if (discordId && tenfDiscordIds.includes(discordId)) {
        const existing = tenfMembersMap.get(discordId);
        const minutes = voice.minutes || voice.duration_minutes || 0;
        if (existing) {
          existing.voiceMinutes = (existing.voiceMinutes || 0) + minutes;
        } else {
          tenfMembersMap.set(discordId, {
            discordId,
            messages: 0,
            voiceMinutes: minutes,
            rank: 0,
          });
        }
      }
    });
  }

  // Convertir en tableau et trier par rang
  const result = Array.from(tenfMembersMap.values());
  result.sort((a, b) => {
    // Trier par messages d'abord, puis par voiceMinutes
    if (b.messages !== a.messages) {
      return b.messages - a.messages;
    }
    return b.voiceMinutes - a.voiceMinutes;
  });

  // Assigner les rangs
  result.forEach((member, index) => {
    member.rank = index + 1;
  });

  return result;
}

/**
 * Calcule les statistiques globales à partir des membres TENF
 */
export function computeStatbotStats(members: StatbotMember[]): {
  totalMessages: number;
  totalVoiceHours: number;
  topMembers: StatbotMember[];
} {
  const totalMessages = members.reduce((sum, m) => sum + m.messages, 0);
  const totalVoiceMinutes = members.reduce((sum, m) => sum + m.voiceMinutes, 0);
  const totalVoiceHours = Math.round((totalVoiceMinutes / 60) * 100) / 100;

  // Top 5 membres les plus actifs (par messages)
  const topMembers = [...members]
    .sort((a, b) => b.messages - a.messages)
    .slice(0, 5);

  return {
    totalMessages,
    totalVoiceHours,
    topMembers,
  };
}

