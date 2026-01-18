import { NextRequest, NextResponse } from 'next/server';
import { getAllVipMemberData, initializeMemberData, loadMemberDataFromStorage, getAllMemberData } from '@/lib/memberData';
import { getTwitchUsers } from '@/lib/twitch';
import { getVipBadgeText, getConsecutiveVipMonths } from '@/lib/vipHistory';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
// Cache ISR de 30 secondes pour les membres VIP
export const revalidate = 30;

const VIP_MONTH_STORE_NAME = 'tenf-vip-month';

interface VipMember {
  discordId: string;
  username: string;
  avatar: string;
  displayName: string;
  twitchLogin?: string;
  twitchUrl?: string;
  twitchAvatar?: string;
  vipBadge?: string;
  consecutiveMonths?: number;
}

// Initialiser les données au démarrage du serveur
let initialized = false;
if (!initialized) {
  initializeMemberData();
  initialized = true;
}

function isNetlify(): boolean {
  try {
    return !!process.env.NETLIFY || !!process.env.NETLIFY_DEV || typeof window === 'undefined';
  } catch {
    return false;
  }
}

async function getCurrentMonthVipLogins(): Promise<string[] | null> {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const monthKey = `${year}-${month}`;

    try {
      if (isNetlify()) {
        const { getStore } = await import('@netlify/blobs');
        const store = getStore(VIP_MONTH_STORE_NAME);
        const data = await store.get(`${monthKey}.json`, { type: 'json' }).catch(() => null);
        if (data && typeof data === 'object' && 'vipLogins' in data) {
          return (data as any).vipLogins || [];
        }
      }
    } catch (blobError) {
      console.warn('[VIP Members API] Blobs non disponible, utilisation du système de fichiers:', blobError);
    }

    // Fallback: système de fichiers local
    const dataDir = path.join(process.cwd(), 'data', 'vip-month');
    const filePath = path.join(dataDir, `${monthKey}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      return data.vipLogins || [];
    }
  } catch (error) {
    console.error('[VIP Members API] Erreur récupération VIP du mois:', error);
  }
  return null;
}

/**
 * Récupère les membres VIP Elite depuis le dashboard (memberData)
 * Priorité : VIP du mois actuel (blob) > Membres avec isVip=true
 */
export async function GET(request: NextRequest) {
  try {
    // Charger les données depuis le stockage persistant (Blobs ou fichier)
    await loadMemberDataFromStorage();
    
    // Essayer de récupérer les VIP du mois actuel depuis le blob
    const currentMonthVipLogins = await getCurrentMonthVipLogins();
    
    let vipMemberData;
    
    if (currentMonthVipLogins && currentMonthVipLogins.length > 0) {
      // Utiliser les VIP du mois actuel depuis le blob
      const allMembers = getAllMemberData();
      vipMemberData = allMembers.filter((member: any) => 
        member.isActive !== false && 
        currentMonthVipLogins.includes(member.twitchLogin?.toLowerCase() || '')
      );
      console.log(`[VIP Members API] Utilisation des VIP du mois actuel (${currentMonthVipLogins.length} membres)`);
    } else {
      // Fallback : utiliser tous les membres VIP depuis le dashboard
      vipMemberData = getAllVipMemberData();
      console.log(`[VIP Members API] Utilisation des membres avec isVip=true (${vipMemberData.length} membres)`);
    }
    
    if (vipMemberData.length === 0) {
      return NextResponse.json({ 
        members: [],
        message: 'Aucun membre VIP Elite trouvé dans le dashboard'
      });
    }

    // Récupérer tous les logins Twitch uniques
    const twitchLogins = vipMemberData
      .map(member => member.twitchLogin)
      .filter(Boolean) as string[];
    
    // Récupérer tous les avatars Twitch en batch
    const twitchUsers = await getTwitchUsers(twitchLogins);
    
    // Créer un map pour un accès rapide par login
    const avatarMap = new Map(
      twitchUsers.map(user => [user.login.toLowerCase(), user.profile_image_url])
    );
    
    // Mapper vers le format attendu par la page VIP
    const vipMembers: VipMember[] = vipMemberData.map((member) => {
      const twitchAvatar = avatarMap.get(member.twitchLogin.toLowerCase());
      
      // Avatar Discord en fallback si pas d'avatar Twitch
      let avatar = twitchAvatar;
      if (!avatar && member.discordId) {
        avatar = `https://cdn.discordapp.com/embed/avatars/${parseInt(member.discordId) % 5}.png`;
      }
      if (!avatar) {
        avatar = `https://placehold.co/128x128?text=${member.displayName.charAt(0)}`;
      }

      // Calculer le badge VIP+N
      const vipBadge = getVipBadgeText(member.twitchLogin);
      const consecutiveMonths = getConsecutiveVipMonths(member.twitchLogin);

      return {
        discordId: member.discordId || '',
        username: member.discordUsername || member.displayName,
        avatar: avatar,
        displayName: member.displayName || member.siteUsername || member.twitchLogin,
        twitchLogin: member.twitchLogin,
        twitchUrl: member.twitchUrl,
        twitchAvatar: twitchAvatar,
        vipBadge: vipBadge,
        consecutiveMonths: consecutiveMonths,
      };
    });

    console.log(`Found ${vipMembers.length} VIP Elite members from dashboard`);

    const response = NextResponse.json({ members: vipMembers });

    // Headers de cache pour Next.js ISR (30 secondes)
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=30, stale-while-revalidate=60'
    );

    return response;
  } catch (error) {
    console.error('Error fetching VIP members:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

