import { NextRequest, NextResponse } from 'next/server';
import { memberRepository, vipRepository } from '@/lib/repositories';
import { getTwitchUsers } from '@/lib/twitch';
import { getVipBadgeText, getConsecutiveVipMonths } from '@/lib/vipHistory';

export const runtime = 'nodejs';
// Cache ISR de 30 secondes pour les membres VIP
export const revalidate = 30;

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

/**
 * Récupère les membres VIP Elite depuis Supabase
 * Priorité : VIP du mois actuel (vip_history) > Membres avec isVip=true
 */
export async function GET(request: NextRequest) {
  try {
    // Essayer de récupérer les VIP du mois actuel depuis Supabase
    const currentMonthVips = await vipRepository.findCurrentMonth();
    
    let vipMemberData;
    
    if (currentMonthVips && currentMonthVips.length > 0) {
      // Utiliser les VIP du mois actuel depuis Supabase
      const vipLogins = currentMonthVips.map(vip => vip.twitchLogin.toLowerCase());
      // Récupérer tous les membres (limite élevée pour filtrage VIP)
      const allMembers = await memberRepository.findAll(1000, 0);
      vipMemberData = allMembers.filter((member) => 
        member.isActive !== false && 
        vipLogins.includes(member.twitchLogin?.toLowerCase() || '')
      );
      console.log(`[VIP Members API] Utilisation des VIP du mois actuel (${currentMonthVips.length} membres)`);
    } else {
      // Fallback : utiliser tous les membres VIP depuis Supabase
      vipMemberData = await memberRepository.findVip();
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

