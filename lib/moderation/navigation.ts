/**
 * Helpers pour construire les blocs de navigation modération (sidebar admin)
 * à partir de la source unique `moderationTree`.
 *
 * Voir `lib/admin/navigation.ts` pour l'arbre global, qui appelle ces helpers
 * pour générer le bloc "Modération".
 */

import {
  MODERATION_BASE,
  MODERATION_STAFF_BASE,
  buildModerationHref,
  getGroupsForView,
  type ModerationView,
} from "@/lib/moderation/moderationTree";

export type ModerationNavItem = {
  href: string;
  label: string;
  children?: ModerationNavItem[];
};

/**
 * Construit le bloc "Modération" de la sidebar admin.
 *
 * Convention :
 * - Tête : hub canonique `/admin/moderation/staff` (vue par défaut côté modos)
 * - Sous-entrées : groupes ; pour chacun, leurs modules visibles dans la vue staff
 * - Section "Pilotage" : exposée seulement si on est en mode avancé / admin
 *
 * On exclut les modules `legacy` automatiquement (filtré par `getGroupsForView`).
 */
export function buildModerationNavSection(opts?: {
  /** Si true, inclut aussi la vue admin (pilotage) à la fin du bloc. */
  includeAdminView?: boolean;
}): ModerationNavItem {
  const staffGroups = getGroupsForView("staff");
  const adminGroups = opts?.includeAdminView ? getGroupsForView("admin") : [];

  const root: ModerationNavItem = {
    href: MODERATION_STAFF_BASE,
    label: "Modération",
    children: [
      { href: MODERATION_STAFF_BASE, label: "Centre de modération" },
      ...staffGroups.map<ModerationNavItem>((group) => ({
        href: `${MODERATION_STAFF_BASE}/${group.slug}`,
        label: group.label,
        children: group.modules.map<ModerationNavItem>((mod) => ({
          href: buildModerationHref("staff", group.slug, mod.slug),
          label: mod.label,
        })),
      })),
    ],
  };

  if (adminGroups.length) {
    root.children!.push({
      href: MODERATION_BASE,
      label: "Pilotage admin",
      children: [
        { href: MODERATION_BASE, label: "Vue admin" },
        ...adminGroups
          .filter((group) =>
            // ne pas re-dupliquer les groupes déjà présents côté staff
            !staffGroups.some((staffGroup) => staffGroup.slug === group.slug)
              ? true
              : group.modules.some((mod) => mod.persona === "admin"),
          )
          .map<ModerationNavItem>((group) => ({
            href: `${MODERATION_BASE}/${group.slug}`,
            label: group.label,
            children: group.modules
              // On garde uniquement les modules admin-only ou both qui ont du
              // sens pour le coordinateur (les "both" sont déjà listés côté staff)
              .filter((mod) => mod.persona === "admin")
              .map<ModerationNavItem>((mod) => ({
                href: buildModerationHref("admin", group.slug, mod.slug),
                label: mod.label,
              })),
          }))
          .filter((entry) => (entry.children?.length ?? 0) > 0),
      ],
    });
  }

  return root;
}
