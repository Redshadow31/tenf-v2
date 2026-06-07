/**
 * Descriptions narratives affichées dans la carte hub (sidebar admin).
 *
 * Objectif : expliquer en 1-2 phrases ce que l'utilisateur peut faire dans
 * cette catégorie, plutôt que d'énumérer la liste des sous-pages.
 *
 * - Clé = `NavItem.href` du hub (route racine).
 * - Le mapping est tolérant aux variantes : on matche par "starts with" si
 *   l'URL exacte n'est pas trouvée, pour absorber les hubs migrés.
 */
export const ADMIN_HUB_DESCRIPTIONS: Record<string, string> = {
  "/admin/pilotage":
    "Pilote le quotidien du serveur. Suis les incidents, le monitoring et la qualité des données pour garder TENF en bonne santé.",
  "/admin/mon-compte":
    "Ton espace personnel staff : identité membre, charte, alertes e-mail et raccourcis adaptés à ton rôle.",
  "/admin/membres":
    "Gère la communauté : annuaire, validation des profils, badges et recrutement de nouveaux membres du staff.",
  "/admin/onboarding":
    "Accompagne les nouveaux arrivants à travers leurs sessions d'accueil, leur inscription et leur activation sur le serveur.",
  "/admin/communaute":
    "Anime la vie de la communauté : événements, anniversaires, raids, Spotlight et engagement Discord au quotidien.",
  "/admin/partenariats":
    "Suis les demandes de partenariat reçues et pilote l'ensemble du dispositif UPA pour les partenaires TENF.",
  "/admin/new-family-aventura":
    "Organise les aventures New Family : inscriptions des membres, préférences récoltées et galerie d'inspiration.",
  "/admin/interviews":
    "Pilote la publication et le suivi des interviews TENF diffusées sur YouTube.",
  "/admin/evaluation":
    "Suis l'évaluation mensuelle des membres : définis les critères, consulte les résultats et accompagne la progression de chacun.",
  "/admin/boutique":
    "Gère le catalogue des récompenses et des avantages distribués aux membres méritants de la communauté.",
  "/admin/academy":
    "Pilote la TENF Academy : accès, promotions, participants et suivi des formations associées.",
  "/admin/moderation":
    "Encadre l'équipe de modération : charte, exercices, validations et suivi du travail réalisé sur le terrain.",
  "/admin/moderation/staff":
    "Encadre l'équipe de modération : charte, exercices, validations et suivi du travail réalisé sur le terrain.",
  "/admin/gestion-acces":
    "Accès, sécurité, configuration du site, équipe staff, données Discord et conformité (audit, logs, retours FAQ).",
  "/admin/gestion-acces/accueil":
    "Accès, sécurité, configuration du site, équipe staff, données Discord et conformité (audit, logs, retours FAQ).",
  "/admin/search":
    "Recherche rapidement un membre du serveur à travers l'ensemble des données disponibles.",
};

/**
 * Renvoie une description courte pour le hub actif, ou null.
 * Fait du best-effort sur le href en cas d'URL imbriquée.
 */
export function getAdminHubDescription(href: string | null | undefined): string | null {
  if (!href) return null;
  if (ADMIN_HUB_DESCRIPTIONS[href]) return ADMIN_HUB_DESCRIPTIONS[href];
  // best-effort : on prend le mapping le plus spécifique qui matche par préfixe
  let best: { href: string; description: string } | null = null;
  for (const [candidate, description] of Object.entries(ADMIN_HUB_DESCRIPTIONS)) {
    if (href === candidate || href.startsWith(`${candidate}/`)) {
      if (!best || candidate.length > best.href.length) {
        best = { href: candidate, description };
      }
    }
  }
  return best?.description ?? null;
}
