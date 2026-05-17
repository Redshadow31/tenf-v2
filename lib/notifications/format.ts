export function formatRelativeFr(iso: string): string {
  const d = new Date(iso);
  const t = d.getTime();
  if (Number.isNaN(t)) return "";
  const diffSec = Math.floor((Date.now() - t) / 1000);
  if (diffSec < 45) return "À l’instant";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Il y a ${diffHr} h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "Hier";
  if (diffDay < 7) return `Il y a ${diffDay} j`;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAbsoluteFr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function isInternalLink(href: string | null | undefined): boolean {
  if (!href) return false;
  if (href.startsWith("/")) return true;
  if (/^https?:\/\//i.test(href)) {
    try {
      const url = new URL(href);
      const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
      const isTenf = /(^|\.)tenf\./i.test(url.hostname) || url.hostname.endsWith("tenf.fr");
      return isLocalhost || isTenf;
    } catch {
      return false;
    }
  }
  return false;
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count > 1 ? plural : singular;
}
