/**
 * API Route pour migrer les membres depuis Netlify Blobs vers Supabase
 * 
 * POST /api/admin/migration/migrate-members
 * Body: { source?: 'admin' | 'bot' | 'merged', selectedLogins?: string[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { getBlobStore } from '@/lib/memberData';
import { memberRepository } from '@/lib/repositories';
import type { MemberData } from '@/lib/memberData';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

const ADMIN_BLOB_STORE = "tenf-admin-members";
const BOT_BLOB_STORE = "tenf-bot-members";
const ADMIN_BLOB_KEY = "admin-members-data";
const BOT_BLOB_KEY = "bot-members-data";

async function loadAdminMembersFromBlobs(): Promise<Record<string, MemberData>> {
  try {
    const store = getBlobStore(ADMIN_BLOB_STORE);
    const data = await store.get(ADMIN_BLOB_KEY, { type: "text" });
    
    if (!data) {
      return {};
    }
    
    const parsed = JSON.parse(data);
    return parsed as Record<string, MemberData>;
  } catch (error) {
    console.error('Erreur chargement membres admin depuis Blobs:', error);
    return {};
  }
}

async function loadBotMembersFromBlobs(): Promise<Record<string, MemberData>> {
  try {
    const store = getBlobStore(BOT_BLOB_STORE);
    const data = await store.get(BOT_BLOB_KEY, { type: "text" });
    
    if (!data) {
      return {};
    }
    
    const parsed = JSON.parse(data);
    return parsed as Record<string, MemberData>;
  } catch (error) {
    console.error('Erreur chargement membres bot depuis Blobs:', error);
    return {};
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { source = 'merged', selectedLogins } = body;

    // Charger depuis Blobs
    const adminMembersBlobs = await loadAdminMembersFromBlobs();
    const botMembersBlobs = await loadBotMembersFromBlobs();
    
    // Fusionner les membres (admin a priorité sur bot)
    const mergedBlobs: Record<string, MemberData> = { ...botMembersBlobs };
    Object.entries(adminMembersBlobs).forEach(([key, member]) => {
      mergedBlobs[key] = member;
    });

    // Sélectionner les membres à migrer
    let membersToMigrate: MemberData[] = [];
    
    if (source === 'admin') {
      membersToMigrate = Object.values(adminMembersBlobs);
    } else if (source === 'bot') {
      membersToMigrate = Object.values(botMembersBlobs);
    } else {
      membersToMigrate = Object.values(mergedBlobs);
    }

    // Filtrer par sélection si fournie
    if (selectedLogins && selectedLogins.length > 0) {
      const selectedSet = new Set(selectedLogins.map((l: string) => l.toLowerCase()));
      membersToMigrate = membersToMigrate.filter(m => 
        m.twitchLogin && selectedSet.has(m.twitchLogin.toLowerCase())
      );
    }

    let migrated = 0;
    let skipped = 0;
    let errors: string[] = [];

    // Migrer chaque membre
    for (const member of membersToMigrate) {
      if (!member.twitchLogin) {
        skipped++;
        continue;
      }

      try {
        // Vérifier si le membre existe déjà
        const existing = await memberRepository.findByTwitchLogin(member.twitchLogin);
        
        if (existing) {
          // Mettre à jour si nécessaire (on peut décider de ne pas écraser)
          // Pour l'instant, on skip les membres existants
          skipped++;
          continue;
        }

        // Créer le membre dans Supabase
        await memberRepository.create({
          twitchLogin: member.twitchLogin.toLowerCase(),
          twitchId: member.twitchId,
          twitchUrl: member.twitchUrl,
          discordId: member.discordId,
          displayName: member.displayName,
          siteUsername: member.siteUsername,
          role: member.role,
          isVip: member.isVip ?? false,
          isActive: member.isActive !== false,
          badges: member.badges || [],
          listId: member.listId,
          roleManuallySet: member.roleManuallySet,
          description: member.description,
          customBio: member.customBio,
          integrationDate: member.integrationDate,
          roleHistory: member.roleHistory || [],
          parrain: member.parrain,
        });

        migrated++;
      } catch (error) {
        const errorMsg = `Erreur migration ${member.twitchLogin}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
        errors.push(errorMsg);
        console.error(errorMsg, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration terminée: ${migrated} migré(s), ${skipped} ignoré(s)`,
      summary: {
        totalInBlobs: membersToMigrate.length,
        migrated,
        skipped,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[Migration Members] Erreur migration:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la migration',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
