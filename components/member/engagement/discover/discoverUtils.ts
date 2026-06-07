import { isExcludedFromMemberDiscover } from "@/lib/memberRoles";

export type FollowState = "followed" | "not_followed" | "unknown";

export type PublicMember = {
  twitchLogin: string;
  displayName: string;
  avatar?: string;
  role?: string;
  twitchUrl?: string;
};

export type FollowStatusesResponse = {
  authenticated?: boolean;
  linked?: boolean;
  statuses?: Record<string, { state?: FollowState }>;
};

export type RoleFilterKey = "all" | "staff" | "affilie" | "developpement" | "other";
export type ViewMode = "cards" | "list";

export const DISCOVER_ACCENT = "#c084fc";
export const DISCOVER_CACHE_KEY = "member.engagement.discover.v2";
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const LONG_BACKLOG = 120;
export const VERY_LONG_BACKLOG = 250;

export const ROLE_FILTER_ITEMS: { key: RoleFilterKey; label: string; hint: string }[] = [
  { key: "all", label: "Tous", hint: "Toute la communauté" },
  { key: "staff", label: "Staff", hint: "Animation & modération" },
  { key: "affilie", label: "Affilié·e·s", hint: "Créateurs TENF" },
  { key: "developpement", label: "Développement", hint: "Progression & talents" },
  { key: "other", label: "Autres", hint: "Profils variés" },
];

export const DISCOVER_FIELD_CLASS =
  "w-full rounded-xl border border-white/12 bg-black/30 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 backdrop-blur-sm transition focus:border-violet-400/45 focus:outline-none focus:ring-2 focus:ring-violet-500/15";

export type DiscoverCachePayload = {
  savedAt: number;
  authenticated: boolean;
  linked: boolean;
  members: PublicMember[];
  notFollowedLogins: string[];
};

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function mapRoleGroup(role?: string): RoleFilterKey {
  const normalized = normalizeText(role || "");
  if (!normalized) return "other";
  if (normalized.includes("admin") || normalized.includes("moderateur") || normalized.includes("soutien")) {
    return "staff";
  }
  if (normalized.includes("affilie")) return "affilie";
  if (normalized.includes("developpement")) return "developpement";
  return "other";
}

export function roleBadgeStyles(group: RoleFilterKey): { label: string; chip: string; glow: string } {
  switch (group) {
    case "staff":
      return {
        label: "Staff",
        chip: "border-sky-400/40 bg-sky-500/15 text-sky-100",
        glow: "bg-sky-500/25 opacity-60",
      };
    case "affilie":
      return {
        label: "Affilié·e",
        chip: "border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-100",
        glow: "bg-fuchsia-500/25 opacity-60",
      };
    case "developpement":
      return {
        label: "Développement",
        chip: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
        glow: "bg-emerald-500/20 opacity-60",
      };
    default:
      return {
        label: "Communauté",
        chip: "border-slate-400/35 bg-slate-600/20 text-slate-200",
        glow: "bg-violet-500/20 opacity-50",
      };
  }
}

export function filterDiscoverMembers(
  members: PublicMember[],
  notFollowedLogins: Set<string>,
): PublicMember[] {
  if (notFollowedLogins.size === 0 || members.length === 0) return [];
  return members
    .filter(
      (member) =>
        notFollowedLogins.has(member.twitchLogin) && !isExcludedFromMemberDiscover(member.role),
    )
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "fr"));
}

export function filterBySearchAndRole(
  discoverMembers: PublicMember[],
  search: string,
  roleFilter: RoleFilterKey,
): PublicMember[] {
  const normalizedSearch = normalizeText(search);
  return discoverMembers.filter((member) => {
    if (normalizedSearch) {
      const haystack = `${member.displayName} ${member.twitchLogin} ${member.role || ""}`;
      if (!normalizeText(haystack).includes(normalizedSearch)) return false;
    }
    if (roleFilter === "all") return true;
    return mapRoleGroup(member.role) === roleFilter;
  });
}

export function countByRole(discoverMembers: PublicMember[]): Record<RoleFilterKey, number> {
  const counts: Record<RoleFilterKey, number> = {
    all: discoverMembers.length,
    staff: 0,
    affilie: 0,
    developpement: 0,
    other: 0,
  };
  for (const m of discoverMembers) {
    counts[mapRoleGroup(m.role)]++;
  }
  return counts;
}

export function readDiscoverCache(): DiscoverCachePayload | null {
  try {
    const raw = localStorage.getItem(DISCOVER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DiscoverCachePayload;
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function tryMigrateV1Cache(): DiscoverCachePayload | null {
  try {
    const raw = localStorage.getItem("member.engagement.discover.v1");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DiscoverCachePayload;
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > CACHE_TTL_MS) return null;
    writeDiscoverCache(parsed);
    localStorage.removeItem("member.engagement.discover.v1");
    return parsed;
  } catch {
    return null;
  }
}

export function writeDiscoverCache(payload: DiscoverCachePayload) {
  try {
    localStorage.setItem(DISCOVER_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // noop
  }
}

export function clearDiscoverCache() {
  try {
    localStorage.removeItem(DISCOVER_CACHE_KEY);
  } catch {
    // noop
  }
}

export function mapPublicMembers(rawMembers: unknown[]): PublicMember[] {
  return rawMembers
    .map((item) => {
      const row = item as Record<string, unknown>;
      return {
        twitchLogin: String(row?.twitchLogin || "").toLowerCase(),
        displayName: String(row?.displayName || row?.twitchLogin || "Membre TENF"),
        avatar: typeof row?.avatar === "string" ? row.avatar : undefined,
        role: typeof row?.role === "string" ? row.role : undefined,
        twitchUrl:
          typeof row?.twitchUrl === "string"
            ? row.twitchUrl
            : `https://www.twitch.tv/${String(row?.twitchLogin || "").toLowerCase()}`,
      };
    })
    .filter((member) => Boolean(member.twitchLogin));
}
