/**
 * API Route pour vérifier la synchronisation des membres entre Netlify Blobs et Supabase
 * 
 * GET /api/admin/migration/check-sync-members
 * Retourne les membres dans Blobs vs Supabase
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { getBlobStore } from '@/lib/memberData';
import { memberRepository } from '@/lib/repositories';
import type { MemberData } from '@/lib/memberData';

export const dynamic = 'force-dynamic';

const ADMIN_BLOB_STORE = "tenf-admin-members";
const BOT_BLOB_STORE = "tenf-bot-members";
const ADMIN_BLOB_KEY = "admin-members-data";
const BOT_BLOB_KEY = "bot-members-data";

interface SyncCheckResult {
  adminMembers: {
    inBlobs: number;
    inSupabase: number;
    missingInSupabase: Array<{ twitchLogin: string; displayName: string }>;
    extraInSupabase: string[];
  };
  botMembers: {
    inBlobs: number;
    inSupabase: number;
    missingInSupabase: Array<{ twitchLogin: string; displayName: string }>;
    extraInSupabase: string[];
  };
  merged: {
    totalInBlobs: number;
    totalInSupabase: number;
    missingInSupabase: Array<{ twitchLogin: string; displayName: string; source: 'admin' | 'bot' | 'both' }>;
    extraInSupabase: string[];
  };
}

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

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Charger depuis Blobs
    const adminMembersBlobs = await loadAdminMembersFromBlobs();
    const botMembersBlobs = await loadBotMembersFromBlobs();
    
    // Fusionner les membres (admin a priorité sur bot)
    const mergedBlobs: Record<string, MemberData> = { ...botMembersBlobs };
    Object.entries(adminMembersBlobs).forEach(([key, member]) => {
      mergedBlobs[key] = member;
    });

    // Charger depuis Supabase
    const supabaseMembers = await memberRepository.findAll(1000, 0);
    const supabaseMap = new Map<string, MemberData>();
    supabaseMembers.forEach(m => {
      if (m.twitchLogin) {
        supabaseMap.set(m.twitchLogin.toLowerCase(), m);
      }
    });

    // Comparer admin members
    const adminBlobsArray = Object.values(adminMembersBlobs);
    const adminMissingInSupabase: Array<{ twitchLogin: string; displayName: string }> = [];
    adminBlobsArray.forEach(member => {
      if (member.twitchLogin && !supabaseMap.has(member.twitchLogin.toLowerCase())) {
        adminMissingInSupabase.push({
          twitchLogin: member.twitchLogin,
          displayName: member.displayName || member.twitchLogin,
        });
      }
    });

    const adminExtraInSupabase: string[] = [];
    supabaseMap.forEach((member, login) => {
      if (!adminMembersBlobs[login] && !botMembersBlobs[login]) {
        adminExtraInSupabase.push(member.twitchLogin || login);
      }
    });

    // Comparer bot members
    const botBlobsArray = Object.values(botMembersBlobs);
    const botMissingInSupabase: Array<{ twitchLogin: string; displayName: string }> = [];
    botBlobsArray.forEach(member => {
      if (member.twitchLogin && !supabaseMap.has(member.twitchLogin.toLowerCase())) {
        botMissingInSupabase.push({
          twitchLogin: member.twitchLogin,
          displayName: member.displayName || member.twitchLogin,
        });
      }
    });

    // Comparer merged
    const mergedBlobsArray = Object.values(mergedBlobs);
    const mergedMissingInSupabase: Array<{ twitchLogin: string; displayName: string; source: 'admin' | 'bot' | 'both' }> = [];
    mergedBlobsArray.forEach(member => {
      if (member.twitchLogin && !supabaseMap.has(member.twitchLogin.toLowerCase())) {
        const inAdmin = !!adminMembersBlobs[member.twitchLogin.toLowerCase()];
        const inBot = !!botMembersBlobs[member.twitchLogin.toLowerCase()];
        mergedMissingInSupabase.push({
          twitchLogin: member.twitchLogin,
          displayName: member.displayName || member.twitchLogin,
          source: inAdmin && inBot ? 'both' : inAdmin ? 'admin' : 'bot',
        });
      }
    });

    const mergedExtraInSupabase: string[] = [];
    supabaseMap.forEach((member, login) => {
      if (!mergedBlobs[login]) {
        mergedExtraInSupabase.push(member.twitchLogin || login);
      }
    });

    const result: SyncCheckResult = {
      adminMembers: {
        inBlobs: adminBlobsArray.length,
        inSupabase: supabaseMembers.filter(m => adminMembersBlobs[m.twitchLogin?.toLowerCase() || '']).length,
        missingInSupabase: adminMissingInSupabase,
        extraInSupabase: adminExtraInSupabase,
      },
      botMembers: {
        inBlobs: botBlobsArray.length,
        inSupabase: supabaseMembers.filter(m => botMembersBlobs[m.twitchLogin?.toLowerCase() || '']).length,
        missingInSupabase: botMissingInSupabase,
        extraInSupabase: [],
      },
      merged: {
        totalInBlobs: mergedBlobsArray.length,
        totalInSupabase: supabaseMembers.length,
        missingInSupabase: mergedMissingInSupabase,
        extraInSupabase: mergedExtraInSupabase,
      },
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Migration Members] Erreur check-sync:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la vérification de synchronisation',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
