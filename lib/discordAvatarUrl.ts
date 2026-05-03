/**
 * Normalise une valeur d’avatar Discord : URL complète (session / CDN déjà résolu)
 * ou hash brut stocké en base → URL cdn.discordapp.com.
 */
export function discordAvatarUrl(
  discordUserId: string | null | undefined,
  avatar: string | null | undefined
): string | null {
  if (!avatar || typeof avatar !== "string") return null;
  const trimmed = avatar.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const id = typeof discordUserId === "string" ? discordUserId.trim() : "";
  if (!id) return null;
  const ext = trimmed.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${id}/${trimmed}.${ext}`;
}
