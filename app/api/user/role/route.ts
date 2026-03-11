import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/requireAdmin';
import { hasAdminDashboardAccess, ROLE_PERMISSIONS } from '@/lib/adminRoles';

export async function GET() {
  try {
    // Utiliser NextAuth pour l'authentification (cohérent avec le reste du système)
    const admin = await getAuthenticatedAdmin();

    if (!admin) {
      console.log('User role check - Not authenticated via NextAuth');
      return NextResponse.json({ hasAdminAccess: false, role: null });
    }

    const userId = admin.discordId;
    console.log('User role check - Discord ID:', userId);

    // Vérifier si l'admin a accès au dashboard
    const hasAccess = hasAdminDashboardAccess(userId) || admin.role !== null;

    // Mapper le rôle AdminRole vers le format attendu par le frontend
    const roleMap: Record<string, string> = {
      'FONDATEUR': 'Admin',
      'ADMIN_COORDINATEUR': 'Admin Coordinateur',
      'MODERATEUR': 'Modérateur',
      'MODERATEUR_EN_FORMATION': 'Modérateur en formation',
      'MODERATEUR_EN_PAUSE': 'Modérateur en pause',
      'SOUTIEN_TENF': 'Soutien TENF',
    };

    const frontendRole = roleMap[admin.role] || admin.role || null;
    const canWrite = (ROLE_PERMISSIONS[admin.role] || []).includes('write');

    console.log('User role check - Authenticated via NextAuth:', { 
      role: admin.role, 
      frontendRole, 
      hasAccess,
      canWrite,
    });

    return NextResponse.json({ 
      hasAdminAccess: hasAccess,
      role: frontendRole,
      canWrite,
    });
  } catch (error) {
    console.error('Error fetching user role:', error);
    return NextResponse.json({ hasAdminAccess: false, role: null });
  }
}

