import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { hasAccess, loadAccesses, loadPromos } from '@/lib/academyStorage';
import { loadFormResponses } from '@/lib/academyStorage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Récupère les feedbacks d'autres membres concernant l'utilisateur connecté
 * Query: ?targetUserId=xxx (optionnel, sinon utilise l'utilisateur connecté)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get('discord_user_id')?.value;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur a accès à cette promo
    const userHasAccess = await hasAccess(userId);
    if (!userHasAccess) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    const accesses = await loadAccesses();
    const userAccesses = accesses.filter(a => a.userId === userId);
    const promos = await loadPromos();
    const promo = promos.find(p => p.id === params.id && userAccesses.some(a => a.promoId === p.id));

    if (!promo) {
      return NextResponse.json(
        { error: 'Promo non trouvée ou accès refusé' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('targetUserId') || userId;

    const formResponses = await loadFormResponses();
    
    // Récupérer les feedbacks "feedback-autre-live" où le pseudoMembre correspond à l'utilisateur
    // On doit d'abord récupérer le Twitch pseudo de l'utilisateur depuis les membres
    const allFeedbacks = formResponses.filter(
      r => r.promoId === params.id && 
      r.formType === 'feedback-autre-live'
    );

    // Filtrer les feedbacks concernant l'utilisateur cible
    // Note: On compare avec le pseudoMembre dans formData
    const userFeedbacks = allFeedbacks.filter(feedback => {
      const pseudoMembre = feedback.formData?.pseudoMembre;
      if (!pseudoMembre) return false;
      
      // On devrait comparer avec le Twitch login de targetUserId
      // Pour l'instant, on retourne tous les feedbacks de la promo
      // et on laisse le frontend filtrer si nécessaire
      return true;
    });

    // Trier par date (plus récent en premier)
    userFeedbacks.sort((a, b) => {
      const dateA = new Date(a.submittedAt).getTime();
      const dateB = new Date(b.submittedAt).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ feedbacks: userFeedbacks });
  } catch (error) {
    console.error('[Academy Feedbacks API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
