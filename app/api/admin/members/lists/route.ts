import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, isFounder } from '@/lib/admin';
import { getAllActiveMemberData, getMemberData, updateMemberData } from '@/lib/memberData';

/**
 * GET - Récupère les membres organisés par liste (1, 2, 3)
 */
export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    if (!isFounder(admin.id)) {
      return NextResponse.json(
        { error: "Accès refusé. Réservé aux fondateurs." },
        { status: 403 }
      );
    }

    const allMembers = getAllActiveMemberData();
    
    // Organiser par liste
    const list1 = allMembers.filter(m => m.listId === 1);
    const list2 = allMembers.filter(m => m.listId === 2);
    const list3 = allMembers.filter(m => m.listId === 3);
    const unassigned = allMembers.filter(m => !m.listId || (m.listId !== 1 && m.listId !== 2 && m.listId !== 3));

    return NextResponse.json({
      list1: list1.map(m => ({
        twitchLogin: m.twitchLogin,
        displayName: m.displayName,
        role: m.role,
      })),
      list2: list2.map(m => ({
        twitchLogin: m.twitchLogin,
        displayName: m.displayName,
        role: m.role,
      })),
      list3: list3.map(m => ({
        twitchLogin: m.twitchLogin,
        displayName: m.displayName,
        role: m.role,
      })),
      unassigned: unassigned.map(m => ({
        twitchLogin: m.twitchLogin,
        displayName: m.displayName,
        role: m.role,
      })),
    });
  } catch (error) {
    console.error('Error fetching member lists:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Met à jour le listId d'un membre
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    if (!isFounder(admin.id)) {
      return NextResponse.json(
        { error: "Accès refusé. Réservé aux fondateurs." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { twitchLogin, listId } = body;

    if (!twitchLogin) {
      return NextResponse.json(
        { error: "twitchLogin requis" },
        { status: 400 }
      );
    }

    if (listId !== undefined && listId !== null && listId !== 1 && listId !== 2 && listId !== 3) {
      return NextResponse.json(
        { error: "listId doit être 1, 2, 3 ou null" },
        { status: 400 }
      );
    }

    const member = getMemberData(twitchLogin);
    if (!member) {
      return NextResponse.json(
        { error: "Membre non trouvé" },
        { status: 404 }
      );
    }

    // Mettre à jour le listId
    updateMemberData(twitchLogin, {
      listId: listId || undefined,
    }, admin.id);

    return NextResponse.json({
      success: true,
      message: `Membre ${twitchLogin} assigné à la liste ${listId || 'aucune'}`,
    });
  } catch (error) {
    console.error('Error updating member list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

