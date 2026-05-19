/** Prénom d'affichage à partir du pseudo Discord. */
export function formatModeratorDisplayName(username: string): string {
  const trimmed = username.trim();
  if (!trimmed) return "Modérateur";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
