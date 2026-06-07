import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/requireAdmin';
import { hasAdminDashboardAccess, ROLE_PERMISSIONS } from '@/lib/adminRoles';
import { hasAdvancedAdminAccess } from '@/lib/advancedAccess';
import { getDevAdminRolePreview, isDevAdminRolePreviewActive } from '@/lib/admin/devRolePreview';

export async function GET() {
  try {
    // Utiliser NextAuth pour l'authentification (cohérent avec le reste du système)
    const admin = await getAuthenticatedAdmin();
    const realAdmin = await getAuthenticatedAdmin({ skipDevRolePreview: true });
    const previewActive = await isDevAdminRolePreviewActive();
    const previewRole = previewActive ? await getDevAdminRolePreview() : null;

    if (!admin) {
      console.log('User role check - Not authenticated via NextAuth');
      return NextResponse.json({ hasAdminAccess: false, role: null });
    }

    const userId = admin.discordId;
    console.log('User role check - Discord ID:', userId);

    const hasAdvancedAccess = await hasAdvancedAdminAccess(userId);

    // Vérifier si l'admin a accès au dashboard
    const hasAccess = hasAdminDashboardAccess(userId) || admin.role !== null || hasAdvancedAccess;

    // Mapper le rôle AdminRole vers le format attendu par le frontend
    const roleMap: Record<string, string> = {
      'FONDATEUR': 'Fondateur·rice TENF',
      'ADMIN_COORDINATEUR': 'Admin coordinateur·rice',
      'MODERATEUR': 'Modérateur·rice',
      'MODERATEUR_AUTONOMIE': 'Modérateur·rice en autonomie',
      'MODERATEUR_ACCOMPAGNEMENT': 'Modérateur·rice en accompagnement',
      'MODERATEUR_DECOUVERTE': 'Modérateur·rice en découverte',
      'MODERATEUR_EN_FORMATION': 'Modérateur·rice en accompagnement',
      'MODERATEUR_EN_PAUSE': 'Modérateur·rice en pause',
      'SOUTIEN_TENF': 'Soutien TENF',
      'CONTRIBUTEUR_INVITE': 'Contributeur·rice invité(e)',
    };

    const frontendRole = roleMap[admin.role] || admin.role || (hasAdvancedAccess ? 'Admin avancé' : null);
    const canWrite =
      previewActive
        ? (ROLE_PERMISSIONS[admin.role] || []).includes('write')
        : hasAdvancedAccess || (ROLE_PERMISSIONS[admin.role] || []).includes('write');

    console.log('User role check - Authenticated via NextAuth:', { 
      role: admin.role, 
      frontendRole, 
      hasAccess,
      canWrite,
      hasAdvancedAccess,
    });

    return NextResponse.json({ 
      hasAdminAccess: hasAccess,
      role: frontendRole,
      rawRole: admin.role,
      realRawRole: realAdmin?.role ?? admin.role,
      devRolePreview: previewActive,
      devRolePreviewRole: previewRole,
      canWrite,
      hasAdvancedAccess: previewActive ? false : hasAdvancedAccess,
    });
  } catch (error) {
    console.error('Error fetching user role:', error);
    return NextResponse.json({ hasAdminAccess: false, role: null });
  }
}

