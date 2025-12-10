import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, isFounder } from "@/lib/admin";
import { getMemberData, updateMemberData } from "@/lib/memberData";

// Désactiver le cache pour cette route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST - Remet les membres spécifiés en "Développement" avec le flag roleManuallySet
 * Réservé aux fondateurs
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    if (!isFounder(admin.id)) {
      return NextResponse.json(
        { error: "Accès refusé. Réservé aux fondateurs." },
        { status: 403 }
      );
    }

    // Liste des logins Twitch à remettre en "Développement"
    const developmentLogins = [
      "jocrm24",
      "gabdeade",
      "latanierevertetv",
      "skarpane", // Skar
      "bear_krys",
      "flofaitdesvideo",
      "akaioh",
      "lacosteur",
      "wapitiroyale",
      "moustagaming93",
      "mechant_karma",
      "lilicia62160",
      "lesinistre33",
      "lauxi_off",
      "siryubux",
      "takumo",
      "theboss974hd",
      "valkas7",
      "hastune_mikumiku",
      "lelgamingandstreaming",
    ];

    const results = {
      updated: [] as string[],
      notFound: [] as string[],
      errors: [] as string[],
    };

    for (const login of developmentLogins) {
      try {
        const member = getMemberData(login);
        
        if (!member) {
          results.notFound.push(login);
          continue;
        }

        // Mettre à jour le rôle en "Développement" avec le flag roleManuallySet
        updateMemberData(
          login,
          {
            role: "Développement",
            roleManuallySet: true,
          },
          admin.id
        );

        results.updated.push(login);
      } catch (error) {
        results.errors.push(`${login}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Mise à jour terminée: ${results.updated.length} membres mis à jour`,
      results,
    });
  } catch (error) {
    console.error("Error fixing development roles:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des rôles" },
      { status: 500 }
    );
  }
}

