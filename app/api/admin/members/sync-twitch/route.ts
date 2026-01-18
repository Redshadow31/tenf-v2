import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/requireAdmin";
import { getAllActiveMemberData, updateTwitchStatus } from "@/lib/memberData";
import { getTwitchUser } from "@/lib/twitch";

/**
 * POST - Synchronise les statuts Twitch de tous les membres actifs
 * Réservé aux fondateurs
 */
export async function POST(request: NextRequest) {
  try {
    // Authentification NextAuth + rôle FOUNDER requis
    const admin = await requireRole("FOUNDER");
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou accès refusé. Réservé aux fondateurs." },
        { status: 403 }
      );
    }

    const activeMembers = getAllActiveMemberData();
    const twitchLogins = activeMembers.map((m) => m.twitchLogin);

    if (twitchLogins.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "Aucun membre actif à synchroniser",
        synced: 0 
      });
    }

    // Récupérer les streams en cours depuis l'API Twitch
    const userLoginsParam = twitchLogins.join(',');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'https://teamnewfamily.netlify.app';
    const streamsResponse = await fetch(
      `${baseUrl}/api/twitch/streams?user_logins=${encodeURIComponent(userLoginsParam)}`
    );

    let liveStreams: any[] = [];
    if (streamsResponse.ok) {
      const streamsData = await streamsResponse.json();
      liveStreams = streamsData.streams || [];
    }

    // Mettre à jour les statuts Twitch
    let synced = 0;
    for (const member of activeMembers) {
      const stream = liveStreams.find(
        (s) => s.userLogin.toLowerCase() === member.twitchLogin.toLowerCase()
      );

      if (stream && stream.type === "live") {
        updateTwitchStatus(member.twitchLogin, {
          isLive: true,
          gameName: stream.gameName,
          viewerCount: stream.viewerCount,
          title: stream.title,
          thumbnailUrl: stream.thumbnailUrl,
        });
        synced++;
      } else {
        // Mettre à jour pour indiquer qu'il n'est pas en live
        updateTwitchStatus(member.twitchLogin, {
          isLive: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synchronisation terminée`,
      synced,
      total: activeMembers.length,
    });
  } catch (error) {
    console.error("Error syncing Twitch status:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}


