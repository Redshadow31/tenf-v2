import { NextRequest, NextResponse } from 'next/server';
import { getDiscordActivityForMonth, loadDiscordActivity } from '@/lib/discordActivityStorage';
import { getAllMemberData, loadMemberDataFromStorage, initializeMemberData } from '@/lib/memberData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Récupère les données d'activité Discord pour un mois spécifique
 * Query: ?month=YYYY-MM
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7); // YYYY-MM

    // Validation du mois
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "Le mois doit être au format YYYY-MM" },
        { status: 400 }
      );
    }

    // Charger les données d'activité Discord
    const activityData = await getDiscordActivityForMonth(month);

    if (!activityData) {
      return NextResponse.json({
        success: true,
        data: {
          month,
          messagesByUser: {},
          vocalsByUser: {},
          topMessages: [],
          topVocals: [],
          totalMessages: 0,
          totalVoiceHours: 0,
        },
      });
    }

    // Charger les données des membres pour enrichir les résultats
    initializeMemberData();
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();
    const membersMap = new Map(
      allMembers
        .filter(m => m.isActive !== false)
        .map(m => [m.twitchLogin.toLowerCase(), m])
    );

    // Calculer le top 5 des messages
    const messagesArray = Object.entries(activityData.messagesByUser || {})
      .map(([login, count]) => {
        const member = membersMap.get(login);
        return {
          login,
          displayName: member?.displayName || login,
          messages: count,
        };
      })
      .sort((a, b) => b.messages - a.messages)
      .slice(0, 5)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

    // Calculer le top 5 des vocaux
    const vocalsArray = Object.entries(activityData.vocalsByUser || {})
      .map(([login, data]) => {
        const member = membersMap.get(login);
        return {
          login,
          displayName: member?.displayName || login,
          hoursDecimal: data.hoursDecimal,
          totalMinutes: data.totalMinutes,
          display: data.display,
        };
      })
      .sort((a, b) => b.totalMinutes - a.totalMinutes)
      .slice(0, 5)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

    // Calculer les totaux (inclure TOUS les membres, même non reconnus)
    // Les données peuvent contenir des pseudos Discord non reconnus comme clés
    const totalMessages = Object.values(activityData.messagesByUser || {}).reduce((sum, count) => {
      const numCount = typeof count === 'number' ? count : 0;
      return sum + numCount;
    }, 0);
    const totalVoiceHours = Object.values(activityData.vocalsByUser || {})
      .reduce((sum, data) => {
        if (typeof data === 'object' && data !== null && 'hoursDecimal' in data) {
          return sum + (data.hoursDecimal || 0);
        }
        return sum;
      }, 0);

    return NextResponse.json({
      success: true,
      data: {
        month,
        messagesByUser: activityData.messagesByUser || {},
        vocalsByUser: activityData.vocalsByUser || {},
        topMessages: messagesArray,
        topVocals: vocalsArray,
        totalMessages,
        totalVoiceHours,
      },
    });
  } catch (error) {
    console.error('[API Discord Activity Data] Erreur GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

