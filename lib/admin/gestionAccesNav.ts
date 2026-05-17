/**
 * Liens du hub « Administration du site » pour AdminHeader et cohérence entre pages.
 * Une seule source pour limiter la dérive entre la sidebar et les nav internes.
 * Ordre aligné sur les 5 familles de la sidebar.
 */

export type AdministrationSiteNavLink = {
  href: string;
  label: string;
  active?: boolean;
};

const HUB_HOME = "/admin/gestion-acces";
const COMPTES = "/admin/gestion-acces/comptes";

const BASE_LINKS: ReadonlyArray<{ href: string; label: string }> = [
  { href: HUB_HOME, label: "Accueil administration" },
  { href: COMPTES, label: "Comptes administrateurs" },
  { href: "/admin/gestion-acces/permissions", label: "Permissions par section" },
  { href: "/admin/gestion-acces/admin-avance", label: "Accès admin avancé" },
  { href: "/admin/gestion-acces/dashboard", label: "Dashboard membre" },
  { href: "/admin/gestion-acces/images", label: "Images profils Twitch" },
  { href: "/admin/migration", label: "Migration des données" },
  { href: "/admin/gestion-acces/organigramme-staff", label: "Organigramme staff" },
  { href: "/admin/gestion-acces/missions-staff", label: "Missions staff" },
  { href: "/admin/gestion-acces/reunions-staff-mensuelles", label: "Réunions mensuelles staff" },
  { href: "/admin/follow/config", label: "Configuration follow staff" },
  { href: "/admin/gestion-acces/discord-activite", label: "Activité Discord (mois & salons)" },
  { href: "/admin/gestion-acces/discord-activite-personnelle", label: "Activité Discord personnelle" },
  { href: "/admin/audit-logs", label: "Audit & logs" },
  { href: "/admin/audit-logs/connexions", label: "Logs de connexion" },
  { href: "/admin/audit-logs/membres", label: "Logs membres" },
  { href: "/admin/audit-logs/historique-pages", label: "Historique des pages" },
  { href: "/admin/audit-logs/temps-reel", label: "Temps réel" },
  { href: "/admin/gestion-acces/retours-faq", label: "Retours FAQ rejoindre" },
];

function normalizePathForActive(pathname: string): string {
  if (pathname === "/admin/gestion-acces/accueil") return HUB_HOME;
  return pathname;
}

/**
 * @param activePath — pathname courant (ex. usePathname()) ou href exact de la page
 */
export function administrationSiteHubNav(activePath: string): AdministrationSiteNavLink[] {
  const normalized = normalizePathForActive(activePath);
  return BASE_LINKS.map((link) => ({
    ...link,
    active: link.href === normalized,
  }));
}
