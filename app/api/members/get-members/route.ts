import { NextResponse } from "next/server";
import { loadMemberDataFromStorage, getAllMemberData } from "@/lib/memberData";

// Désactiver le cache pour cette route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET - Récupère tous les membres avec leurs données fusionnées (admin + bot)
 * Cette route charge les données fusionnées depuis le stockage persistant
 * Les données admin ont toujours priorité sur les données bot
 */
export async function GET() {
  try {
    // Charger et fusionner les données depuis le stockage
    await loadMemberDataFromStorage();
    
    // Récupérer tous les membres fusionnés
    const members = getAllMemberData();
    
    const response = NextResponse.json({ 
      members,
      total: members.length,
      source: "merged" // Indique que les données sont fusionnées
    });
    
    // Désactiver le cache
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error("Error fetching merged members:", error);
    return NextResponse.json(
      { error: "Erreur serveur", members: [], total: 0 },
      { status: 500 }
    );
  }
}

