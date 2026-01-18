/**
 * Options prédéfinies pour les localisations des intégrations
 * Format: { value: string, label: string }
 * Le label contient l'emoji et le nom (ex: "🎙・accueil-et-intégration")
 */

export interface LocationOption {
  value: string;
  label: string;
}

export const LOCATION_OPTIONS: LocationOption[] = [
  { value: "🎙・accueil-et-intégration", label: "🎙・accueil-et-intégration" },
  { value: "🎮・gaming", label: "🎮・gaming" },
  { value: "💬・discussion-générale", label: "💬・discussion-générale" },
  { value: "📢・annonces", label: "📢・annonces" },
  { value: "🤝・entraide", label: "🤝・entraide" },
  { value: "⭐・spotlight", label: "⭐・spotlight" },
  { value: "🎯・événements", label: "🎯・événements" },
  { value: "📚・ressources", label: "📚・ressources" },
  { value: "🎨・créatif", label: "🎨・créatif" },
  { value: "🎵・musique", label: "🎵・musique" },
  { value: "🍕・vocal-général", label: "🍕・vocal-général" },
  { value: "🎪・lounge", label: "🎪・lounge" },
  { value: "🏆・compétitions", label: "🏆・compétitions" },
  { value: "🔊・annonces-importantes", label: "🔊・annonces-importantes" },
  { value: "🌍・international", label: "🌍・international" },
];

/**
 * Récupère une option de localisation par sa valeur
 */
export function getLocationOption(value: string): LocationOption | undefined {
  return LOCATION_OPTIONS.find(opt => opt.value === value);
}

/**
 * Récupère le label d'une localisation par sa valeur
 */
export function getLocationLabel(value: string): string {
  const option = getLocationOption(value);
  return option ? option.label : value;
}
