import { NextResponse } from 'next/server';
import { getAllVipMemberData, initializeMemberData } from '@/lib/memberData';
import { getTwitchUsers } from '@/lib/twitch';

interface VipMember {
  discordId: string;
  username: string;
  avatar: string;
  displayName: string;
  twitchLogin?: string;
  twitchUrl?: string;
  twitchAvatar?: string;
}

// Initialiser les données au démarrage du serveur
let initialized = false;
if (!initialized) {
  initializeMemberData();
  initialized = true;
}

/**
 * Récupère les membres VIP Elite depuis le dashboard (memberData)
 * Beaucoup plus simple et rapide que de passer par l'API Discord
 */
export async function GET() {
  try {
    // Récupérer tous les membres VIP depuis le dashboard
    const vipMemberData = getAllVipMemberData();
    
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

      return {
        discordId: member.discordId || '',
        username: member.discordUsername || member.displayName,
        avatar: avatar,
        displayName: member.displayName || member.siteUsername || member.twitchLogin,
        twitchLogin: member.twitchLogin,
        twitchUrl: member.twitchUrl,
        twitchAvatar: twitchAvatar,
      };
    });

    console.log(`Found ${vipMembers.length} VIP Elite members from dashboard`);

    return NextResponse.json({ members: vipMembers });
  } catch (error) {
    console.error('Error fetching VIP members:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

