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

    // Vérifier d'abord via lib/admin.ts (pour les fondateurs et admins)
    if (isFounder(userId)) {
      console.log('User role check - Found as Founder');
      return NextResponse.json({ 
        hasAdminAccess: true,
        role: "Admin",
      });
    }

    if (isAdmin(userId)) {
      console.log('User role check - Found as Admin');
      return NextResponse.json({ 
        hasAdminAccess: true,
        role: "Admin",
      });
    }

    if (isModerator(userId)) {
      console.log('User role check - Found as Moderator');
      return NextResponse.json({ 
        hasAdminAccess: true,
        role: "Modérateur Junior",
      });
    }

    console.log('User role check - Not found in admin list, checking memberDataStore...');

    // Sinon, chercher dans memberDataStore
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

    // Si pas trouvé dans memberDataStore, vérifier le cache Blobs (membres ajoutés via l'interface admin)
    console.log('User role check - Not in memberDataStore, checking Blobs cache...');
    try {
      const { loadAdminAccessCache, getAdminRoleFromCache } = await import('@/lib/adminAccessCache');
      await loadAdminAccessCache();
      const blobRole = getAdminRoleFromCache(userId);
      
      if (blobRole) {
        // Mapper le rôle Blobs vers le nom d'affichage
        const roleNames: Record<string, string> = {
          'FOUNDER': 'Admin',
          'ADMIN_ADJOINT': 'Admin Adjoint',
          'MODO_MENTOR': 'Mentor',
          'MODO_JUNIOR': 'Modérateur Junior',
        };
        const roleName = roleNames[blobRole] || blobRole;
        
        console.log('User role check - Found in Blobs cache:', { role: roleName, hasAdminAccess: true });
        return NextResponse.json({ 
          hasAdminAccess: true,
          role: roleName,
        });
      }
    } catch (error) {
      console.warn('User role check - Error checking Blobs cache:', error);
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

