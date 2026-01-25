/**
 * Configuration centralisée des membres du staff pour le système de follow
 * Cette liste définit tous les membres du staff qui ont une page de suivi individuelle
 * et garantit la cohérence entre le hub (/admin/follow) et les pages individuelles (/admin/follow/[slug])
 */

export const STAFF_MEMBERS: Record<string, string> = {
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
 * Vérifie si un slug correspond à un membre du staff valide
 */
export function isValidStaffSlug(slug: string): boolean {
  return slug in STAFF_MEMBERS;
}

/**
 * Obtient le nom d'affichage d'un membre du staff à partir de son slug
 */
export function getStaffName(slug: string): string {
  return STAFF_MEMBERS[slug] || slug;
}

/**
 * Obtient tous les slugs des membres du staff
 */
export function getAllStaffSlugs(): string[] {
  return Object.keys(STAFF_MEMBERS);
}
