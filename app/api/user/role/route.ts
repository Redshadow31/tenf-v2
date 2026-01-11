import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAllMemberData } from '@/lib/memberData';
import { isFounder, isAdmin, isModerator } from '@/lib/admin';
import { DISCORD_ROLE_IDS, GUILD_ID, mapDiscordRoleToSiteRole } from '@/lib/discordRoles';

export async function GET() {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get('discord_user_id')?.value;

    console.log('User role check - Discord ID:', userId);

    if (!userId) {
      console.log('User role check - No Discord ID found in cookies');
      return NextResponse.json({ hasAdminAccess: false, role: null });
    }

    // Vérifier d'abord les fondateurs (hardcodés)
    if (isFounder(userId)) {
      console.log('User role check - Found as Founder');
      return NextResponse.json({ 
        hasAdminAccess: true,
        role: "Admin",
      });
    }

    console.log('User role check - Checking memberDataStore...');

    // Vérifier d'abord dans memberDataStore (source de vérité)
    const memberData = getAllMemberData();
    const member = memberData.find(m => m.discordId === userId);

    if (member) {
      const role = member.role;
      // Admin, Admin Adjoint, Mentor, ou Modérateur Junior
      const allowedRoles = ["Admin", "Admin Adjoint", "Mentor", "Modérateur Junior"];
      const hasAdminAccess = allowedRoles.includes(role);

      console.log('User role check - Found in memberDataStore:', { role, hasAdminAccess });
      return NextResponse.json({ 
        hasAdminAccess,
        role,
      });
    }

    // Ensuite vérifier les rôles hardcodés (pour compatibilité)
    if (isAdmin(userId)) {
      console.log('User role check - Found as Admin (hardcoded)');
      return NextResponse.json({ 
        hasAdminAccess: true,
        role: "Admin",
      });
    }

    if (isModerator(userId)) {
      console.log('User role check - Found as Moderator (hardcoded)');
      return NextResponse.json({ 
        hasAdminAccess: true,
        role: "Modérateur Junior",
      });
    }

    // Si pas trouvé dans Blobs, vérifier directement via Discord API
    console.log('User role check - Not in Blobs cache, checking Discord API...');
    const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    
    if (DISCORD_BOT_TOKEN) {
      try {
        const memberResponse = await fetch(
          `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}`,
          {
            headers: {
              Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            },
          }
        );

        if (memberResponse.ok) {
          const discordMember = await memberResponse.json();
          const { role: siteRole } = mapDiscordRoleToSiteRole(discordMember.roles || []);
          
          // Admin, Admin Adjoint, Mentor, ou Modérateur Junior
          const allowedRoles = ["Admin", "Admin Adjoint", "Mentor", "Modérateur Junior"];
          const hasAdminAccess = allowedRoles.includes(siteRole);

          console.log('User role check - Found via Discord API:', { role: siteRole, hasAdminAccess });
          return NextResponse.json({ 
            hasAdminAccess,
            role: siteRole,
          });
        }
      } catch (error) {
        console.error('Error fetching Discord member:', error);
      }
    }

    // Si pas trouvé, retourner false
    console.log('User role check - Not found anywhere');
    return NextResponse.json({ hasAdminAccess: false, role: null });
  } catch (error) {
    console.error('Error fetching user role:', error);
    return NextResponse.json({ hasAdminAccess: false, role: null });
  }
}

