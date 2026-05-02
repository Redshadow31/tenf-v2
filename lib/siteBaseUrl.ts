/**
 * URL absolue pour liens partagés hors navigateur (ex. DM Discord).
 */
export function absoluteSiteUrl(pathOrUrl: string): string {
  const p = pathOrUrl.trim();
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  if (!base) return p;
  return `${base}${p.startsWith("/") ? p : `/${p}`}`;
}
