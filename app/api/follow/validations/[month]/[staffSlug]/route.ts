import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';
import { 
  getStaffFollowValidation, 
  saveStaffFollowValidation,
  type StaffFollowValidation,
  type MemberFollowValidation,
  type FollowStatus 
} from '@/lib/followStorage';
import { getAllMemberData } from '@/lib/memberData';

const STAFF_MEMBERS: Record<string, string> = {
  red: "Red",
  clara: "Clara",
  nexou: "Nexou",
  tabs: "Tabs",
  nangel: "Nangel",
  jenny: "Jenny",
  selena: "Selena",
  dark: "Dark",
  yaya: "Yaya",
  rubby: "Rubby",
  livio: "Livio",
  rebelle: "Rebelle",
  sigurdson: "Sigurdson",
  nico: "Nico",
  willy: "Willy",
  b1nx: "B1nx",
  spydy: "Spydy",
  simon: "Simon",
  zylkao: "Zylkao",
};

/**
 * GET - Récupère la validation de follow pour un membre du staff et un mois
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { month: string; staffSlug: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { month, staffSlug } = params;

    // Vérifier le format du mois
    if (!month.match(/^\d{4}-\d{2}$/)) {
      return NextResponse.json(
        { error: 'Format de mois invalide (attendu: YYYY-MM)' },
        { status: 400 }
      );
    }

    // Vérifier que le staff slug est valide
    if (!STAFF_MEMBERS[staffSlug]) {
      return NextResponse.json(
        { error: 'Membre du staff invalide' },
        { status: 400 }
      );
    }

    const validation = await getStaffFollowValidation(staffSlug, month);

    return NextResponse.json({
      validation,
      staffName: STAFF_MEMBERS[staffSlug],
    });
  } catch (error) {
    console.error('[Follow Validations API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST - Sauvegarde une validation de follow
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { month: string; staffSlug: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { month, staffSlug } = params;

    // Vérifier le format du mois
    if (!month.match(/^\d{4}-\d{2}$/)) {
      return NextResponse.json(
        { error: 'Format de mois invalide (attendu: YYYY-MM)' },
        { status: 400 }
      );
    }

    // Vérifier que le staff slug est valide
    if (!STAFF_MEMBERS[staffSlug]) {
      return NextResponse.json(
        { error: 'Membre du staff invalide' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { members, moderatorComments } = body;

    if (!Array.isArray(members)) {
      return NextResponse.json(
        { error: 'members doit être un tableau' },
        { status: 400 }
      );
    }

    // Récupérer tous les membres TENF pour validation
    const allMembers = getAllMemberData();
    const memberMap = new Map(
      allMembers.map(m => [m.twitchLogin.toLowerCase(), m])
    );

    // Valider et formater les membres
    const validatedMembers: MemberFollowValidation[] = [];
    for (const m of members) {
      const member = memberMap.get(m.twitchLogin.toLowerCase());
      if (member) {
        validatedMembers.push({
          twitchLogin: member.twitchLogin,
          displayName: member.displayName || member.twitchLogin,
          role: member.role,
          status: (m.status || (m.jeSuis ? 'followed' : 'not_followed')) as FollowStatus, // Compatibilité
          validatedAt: new Date().toISOString(),
          jeSuis: m.jeSuis ?? false,
          meSuit: m.meSuit ?? null,
        });
      }
    }

    // Calculer les stats
    const totalJeSuis = validatedMembers.filter(m => m.jeSuis === true).length;
    const totalRetour = validatedMembers.filter(m => m.jeSuis === true && m.meSuit === true).length;
    const tauxRetour = totalJeSuis > 0
      ? Math.round((totalRetour / totalJeSuis) * 100 * 10) / 10
      : 0;

    // Récupérer les IDs Twitch et Discord du staff si disponible (pour Red)
    let staffTwitchId: string | undefined;
    let staffDiscordId: string | undefined;
    
    if (staffSlug === 'red') {
      const { getMemberData } = await import('@/lib/memberData');
      const redLogins = ['red', 'redshadow31', 'redshadow'];
      for (const login of redLogins) {
        const redMember = getMemberData(login);
        if (redMember) {
          staffTwitchId = redMember.twitchId;
          staffDiscordId = redMember.discordId;
          break;
        }
      }
    }

    // Créer ou mettre à jour la validation
    const validation: StaffFollowValidation = {
      staffSlug,
      staffName: STAFF_MEMBERS[staffSlug],
      month,
      members: validatedMembers,
      moderatorComments: moderatorComments || '',
      validatedAt: new Date().toISOString(),
      validatedBy: admin.id,
      staffTwitchId,
      staffDiscordId,
      stats: {
        totalMembers: validatedMembers.length,
        totalJeSuis,
        totalRetour,
        tauxRetour,
      },
    };

    await saveStaffFollowValidation(validation);

    return NextResponse.json({
      success: true,
      validation,
      message: 'Validation enregistrée avec succès',
    });
  } catch (error) {
    console.error('[Follow Validations API] Erreur POST:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

