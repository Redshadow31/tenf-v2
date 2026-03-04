/**
 * Gestion des descriptions des membres
 * Génère des descriptions génériques si aucune description personnalisée n'est définie
 */

import { MemberRole } from "./memberRoles";

/**
 * Génère une description générique selon le rôle du membre
 */
export function getDefaultMemberDescription(
  displayName: string,
  role: MemberRole
): string {
  const roleText = getRoleText(role);
  
  return `Membre de la New Family, ${displayName} fait partie de notre communauté en tant que ${roleText}. N'hésitez pas à le suivre et découvrir sa chaîne ! Même si ce n'est pas tout de suite, un follow vous permettra de le retrouver facilement plus tard et de ne rien manquer de son contenu.`;
}

/**
 * Retourne le texte du rôle pour la description
 */
function getRoleText(role: MemberRole): string {
  switch (role) {
    case "Développement":
      return "Créateur en Développement";
    case "Affilié":
      return "Créateur Affilié";
    case "Modérateur Junior":
      return "Modérateur en formation";
    case "Modérateur en formation":
      return "Modérateur en formation";
    case "Mentor":
      return "Modérateur";
    case "Modérateur":
      return "Modérateur";
    case "Modérateur en activité réduite":
      return "Modérateur en activité réduite";
    case "Modérateur en pause":
      return "Modérateur en pause";
    case "Admin":
      return "Administrateur";
    case "Admin Adjoint":
      return "Administrateur Coordinateur";
    case "Admin Coordinateur":
      return "Administrateur Coordinateur";
    case "Créateur Junior":
      return "Créateur Junior";
    case "Soutien TENF":
      return "Soutien TENF";
    case "Contributeur TENF du Mois":
      return "Contributeur TENF du Mois";
    default:
      return "membre";
  }
}

/**
 * Retourne la description à afficher pour un membre
 * Utilise la description personnalisée si disponible, sinon génère un message générique
 */
export function getMemberDescription(
  member: {
    description?: string;
    displayName: string;
    role: MemberRole;
  }
): string {
  // Si une description personnalisée existe, l'utiliser
  if (member.description && member.description.trim()) {
    return member.description.trim();
  }
  
  // Sinon, générer une description générique
  return getDefaultMemberDescription(member.displayName, member.role);
}

