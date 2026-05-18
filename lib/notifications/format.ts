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

function isInternalHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1") return true;
  if (/(^|\.)tenf\./i.test(host) || host.endsWith("tenf.fr")) return true;
  if (host.endsWith(".vercel.app") && host.includes("tenf")) return true;
  return false;
}

/**
 * Normalise un lien de notification pour la navigation in-app :
 * - chemins relatifs conservés ;
 * - URLs absolues internes (localhost, TENF, Vercel preview) → chemin seul ;
 * - anciennes routes API / anglaises → pages admin canoniques.
 */
export function normalizeMemberNotificationLink(link: string | null | undefined): string | null {
  const raw = link?.trim();
  if (!raw) return null;

  let href = raw;

  if (/^https?:\/\//i.test(href)) {
    try {
      const url = new URL(href);
      if (isInternalHostname(url.hostname)) {
        href = `${url.pathname}${url.search}${url.hash}`;
      }
    } catch {
      return raw;
    }
  }

  const apiQuestionnaire = href.match(/^\/api\/admin\/moderation\/staff-questionnaires\/([^/]+)\/?$/);
  if (apiQuestionnaire) {
    href = `/admin/moderation/staff/questionnaires/${apiQuestionnaire[1]}`;
  }

  const legacyQuestionnaire = href.match(
    /^\/admin\/moderation\/staff\/petits-travaux\/questionnaires-posture\/([^/]+)\/?$/,
  );
  if (legacyQuestionnaire) {
    href = `/admin/moderation/staff/questionnaires/${legacyQuestionnaire[1]}`;
  }

  if (/^\/admin\/members\/gestion\/?$/.test(href)) {
    href = "/admin/membres/gestion";
  }

  const legacyMember = href.match(/^\/admin\/members\/([^/]+)\/?$/);
  if (legacyMember) {
    href = `/admin/membres/fiche/${encodeURIComponent(legacyMember[1])}`;
  }

  return href.startsWith("/") ? href : `/${href}`;
}

export function isInternalLink(href: string | null | undefined): boolean {
  if (!href) return false;
  const normalized = normalizeMemberNotificationLink(href);
  if (!normalized) return false;
  if (normalized.startsWith("/")) return true;
  if (/^https?:\/\//i.test(normalized)) {
    try {
      const url = new URL(normalized);
      return isInternalHostname(url.hostname);
    } catch {
      return false;
    }
  }
  return false;
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count > 1 ? plural : singular;
}
