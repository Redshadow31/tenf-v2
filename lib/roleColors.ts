/**
 * Utilitaires pour les couleurs de badges de rôles
 */

import { MemberRole } from "./memberRoles";

/**
 * Styles pour les badges de rôles (pour pages publiques - styles inline)
 * Utilise des couleurs spécifiques selon les rôles
 */
export function getRoleBadgeStyles(role: string): { bg: string; text: string; border?: string } {
  switch (role) {
    case "Nouveau":
      return { bg: '#581c87', text: 'white', border: '#a855f7' };

    case "Admin":
    case "Fondateur":
      // Rouge/violet pour Admin/Fondateur
      return { bg: '#991b1b', text: 'white', border: '#dc2626' }; // red-900 avec bordure red-600
    
    case "Admin Coordinateur":
    case "Admin Adjoint":
      // Ambre/vert pour Admin Coordinateur
      return { bg: '#854d0e', text: 'white', border: '#a16207' }; // amber-900 avec bordure amber-700
    
    case "Modérateur":
    case "Mentor":
      // Orange pour Modérateur
      return { bg: '#c2410c', text: 'white', border: '#ea580c' }; // orange-700 avec bordure orange-600
    
    case "Modérateur en activité réduite":
      return { bg: '#9a3412', text: 'white', border: '#fb923c' };

    case "Modérateur en pause":
      return { bg: '#374151', text: 'white', border: '#6b7280' };

    case "Modérateur en formation":
    case "Modérateur Junior":
      // Bleu pour Modérateur en formation
      return { bg: '#1e3a8a', text: 'white', border: '#2563eb' }; // blue-900 avec bordure blue-600
    
    case "Affilié":
      // Argenté pour Affilié
      return { bg: '#6b7280', text: 'white', border: '#9ca3af' }; // gray-500 avec bordure gray-400
    
    case "Développement":
      // Bronze pour Développement
      return { bg: '#78350f', text: 'white', border: '#92400e' }; // amber-900 avec bordure amber-800

    case "Soutien TENF":
      return { bg: '#14532d', text: 'white', border: '#22c55e' };

    case "Contributeur TENF du Mois":
      return { bg: '#0f766e', text: 'white', border: '#14b8a6' };
    
    case "Communauté":
      // Cyan pour Communauté
      return { bg: '#155e75', text: 'white', border: '#06b6d4' }; // cyan-900 avec bordure cyan-500
    
    case "Créateur Junior":
      // Rose pour Créateur Junior
      return { bg: '#be185d', text: 'white', border: '#ec4899' }; // pink-700 avec bordure pink-500
    
    case "Les P'tits Jeunes":
    case "Communauté (mineur)":
      // Violet pâle pour Les P'tits Jeunes / Communauté (mineur)
      return { bg: '#7c3aed', text: 'white', border: '#a78bfa' }; // violet-600 avec bordure violet-400
    
    default:
      // Fallback neutre
      return { bg: 'var(--color-text-secondary)', text: 'white' };
  }
}

/**
 * Classes Tailwind CSS pour les badges de rôles (pour pages admin)
 * Utilise des couleurs spécifiques selon les rôles
 */
export function getRoleBadgeClasses(role: MemberRole | string): string {
  switch (role) {
    case "Nouveau":
      return "bg-purple-900 text-white border border-purple-500";

    case "Admin":
    case "Fondateur":
      // Rouge/violet pour Admin/Fondateur
      return "bg-red-900 text-white border border-red-600";
    
    case "Admin Coordinateur":
    case "Admin Adjoint":
      // Ambre/vert pour Admin Coordinateur
      return "bg-amber-900 text-white border border-amber-700";
    
    case "Modérateur":
    case "Mentor":
      // Orange pour Modérateur
      return "bg-orange-700 text-white border border-orange-600";
    
    case "Modérateur en activité réduite":
      return "bg-orange-900 text-white border border-orange-400";

    case "Modérateur en pause":
      return "bg-gray-700 text-white border border-gray-500";

    case "Modérateur en formation":
    case "Modérateur Junior":
      // Bleu pour Modérateur en formation
      return "bg-blue-900 text-white border border-blue-600";
    
    case "Affilié":
      // Argenté pour Affilié
      return "bg-gray-500 text-white border border-gray-400";
    
    case "Développement":
      // Bronze pour Développement
      return "bg-amber-900 text-white border border-amber-800";

    case "Soutien TENF":
      return "bg-green-900 text-white border border-green-500";

    case "Contributeur TENF du Mois":
      return "bg-teal-900 text-white border border-teal-500";
    
    case "Communauté":
      // Cyan pour Communauté
      return "bg-cyan-900 text-white border border-cyan-500";
    
    case "Créateur Junior":
      // Rose pour Créateur Junior
      return "bg-pink-700 text-white border border-pink-500";
    
    case "Les P'tits Jeunes":
    case "Communauté (mineur)":
      // Violet pâle pour Les P'tits Jeunes / Communauté (mineur)
      return "bg-violet-600 text-white border border-violet-400";
    
    default:
      // Fallback neutre
      return "bg-gray-700 text-white";
  }
}

