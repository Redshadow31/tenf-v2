"use client";

import { useEffect, useMemo, useState } from "react";
import { loginWithDiscord } from "@/lib/discord";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import { isExcludedFromMemberDiscover } from "@/lib/memberRoles";

type FollowState = "followed" | "not_followed" | "unknown";

type PublicMember = {
  twitchLogin: string;
  displayName: string;
  avatar?: string;
  role?: string;
  twitchUrl?: string;
};

type FollowStatusesResponse = {
  authenticated?: boolean;
  linked?: boolean;
  statuses?: Record<string, { state?: FollowState }>;
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DISCOVER_CACHE_KEY = "member.engagement.discover.v1";

type DiscoverCachePayload = {
  savedAt: number;
  authenticated: boolean;
  linked: boolean;
  members: PublicMember[];
  notFollowedLogins: string[];
};

export default function MemberEngagementDiscoverPage() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [linked, setLinked] = useState(false);
  const [members, setMembers] = useState<PublicMember[]>([]);
  const [notFollowedLogins, setNotFollowedLogins] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "staff" | "affilie" | "developpement" | "other">("all");
  const [openingBatch, setOpeningBatch] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    const cached = readDiscoverCache();
    if (cached) {
      setAuthenticated(cached.authenticated);
      setLinked(cached.linked);
      setMembers(cached.members);
      setNotFollowedLogins(new Set(cached.notFollowedLogins));
      setLastUpdatedAt(cached.savedAt);
      setLoading(false);
      return;
    }

    let active = true;
    (async () => {
      try {
        setError(null);
        const followResponse = await fetch("/api/members/follow-status", { cache: "no-store" });
        const followBody = (await followResponse.json()) as FollowStatusesResponse;
        if (!active) return;

        if (!followResponse.ok || followBody?.authenticated !== true) {
          setAuthenticated(false);
          setLinked(false);
          setMembers([]);
          setNotFollowedLogins(new Set());
          return;
        }

        setAuthenticated(true);
        const isLinked = followBody?.linked === true;
        setLinked(isLinked);
        if (!isLinked) {
          setMembers([]);
          setNotFollowedLogins(new Set());
          return;
        }

        const statuses = followBody?.statuses || {};
        const pending = new Set<string>();
        for (const [login, entry] of Object.entries(statuses)) {
          if ((entry?.state || "unknown") === "not_followed") {
            pending.add(login.toLowerCase());
          }
        }
        setNotFollowedLogins(pending);

        const membersResponse = await fetch("/api/members/public", { cache: "no-store" });
        const membersBody = await membersResponse.json();
        if (!active) return;
        const rawMembers = Array.isArray(membersBody?.members) ? membersBody.members : [];
        const mapped: PublicMember[] = rawMembers
          .map((item: any) => ({
            twitchLogin: String(item?.twitchLogin || "").toLowerCase(),
            displayName: String(item?.displayName || item?.twitchLogin || "Membre TENF"),
            avatar: typeof item?.avatar === "string" ? item.avatar : undefined,
            role: typeof item?.role === "string" ? item.role : undefined,
            twitchUrl:
              typeof item?.twitchUrl === "string"
                ? item.twitchUrl
                : `https://www.twitch.tv/${String(item?.twitchLogin || "").toLowerCase()}`,
          }))
          .filter((member: PublicMember) => Boolean(member.twitchLogin));
        setMembers(mapped);
        const savedAt = Date.now();
        setLastUpdatedAt(savedAt);
        writeDiscoverCache({
          savedAt,
          authenticated: true,
          linked: true,
          members: mapped,
          notFollowedLogins: Array.from(pending),
        });
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erreur réseau.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const discoverMembers = useMemo(() => {
    if (notFollowedLogins.size === 0 || members.length === 0) return [];
    return members
      .filter(
        (member) =>
          notFollowedLogins.has(member.twitchLogin) && !isExcludedFromMemberDiscover(member.role)
      )
      .sort((a, b) => a.displayName.localeCompare(b.displayName, "fr"));
  }, [members, notFollowedLogins]);

  const filteredDiscoverMembers = useMemo(() => {
    const normalizedSearch = normalizeText(search);
    return discoverMembers.filter((member) => {
      if (normalizedSearch) {
        const haystack = `${member.displayName} ${member.twitchLogin} ${member.role || ""}`;
        if (!normalizeText(haystack).includes(normalizedSearch)) return false;
      }

      const roleGroup = mapRoleGroup(member.role);
      if (roleFilter === "all") return true;
      return roleGroup === roleFilter;
    });
  }, [discoverMembers, roleFilter, search]);

  async function openTopRecommendations() {
    if (filteredDiscoverMembers.length === 0 || openingBatch) return;
    setOpeningBatch(true);
    try {
      const top = filteredDiscoverMembers.slice(0, 3);
      for (const member of top) {
        const url = member.twitchUrl || `https://www.twitch.tv/${member.twitchLogin}`;
        window.open(url, "_blank", "noopener,noreferrer");
        await new Promise((resolve) => setTimeout(resolve, 180));
      }
    } finally {
      setOpeningBatch(false);
    }
  }

  function forceRefresh() {
    try {
      localStorage.removeItem(DISCOVER_CACHE_KEY);
    } catch {
      // noop
    }
    window.location.reload();
  }

  const connectTwitchHref = `/api/auth/twitch/link/start?callbackUrl=${encodeURIComponent("/member/engagement/a-decouvrir")}`;

  if (loading) {
    return (
      <MemberSurface>
        <MemberPageHeader
          title="À découvrir"
          description="Chargement des chaînes TENF que tu ne suis pas encore."
          badge="Engagement"
        />
        <section className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <article
              key={`discover-skeleton-${index}`}
              className="animate-pulse rounded-2xl border p-4"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            >
              <div className="mb-3 flex items-start gap-3">
                <div className="h-12 w-12 rounded-full" style={{ backgroundColor: "rgba(148,163,184,0.25)" }} />
                <div className="w-full space-y-2">
                  <div className="h-3 w-2/3 rounded" style={{ backgroundColor: "rgba(148,163,184,0.25)" }} />
                  <div className="h-2.5 w-1/2 rounded" style={{ backgroundColor: "rgba(148,163,184,0.18)" }} />
                </div>
              </div>
              <div className="h-8 w-32 rounded-lg" style={{ backgroundColor: "rgba(145,70,255,0.28)" }} />
            </article>
          ))}
        </section>
      </MemberSurface>
    );
  }

  return (
    <MemberSurface>
      <MemberPageHeader
        title="À découvrir"
        description="Liste des membres TENF actifs que ton compte Twitch ne suit pas encore."
        badge="Engagement"
      />

      {!authenticated ? (
        <GateCard
          title="Connexion Discord requise"
          description="Connecte-toi à Discord pour accéder à la liste personnalisée des chaînes à suivre."
          actionLabel="Se connecter avec Discord"
          onAction={loginWithDiscord}
        />
      ) : !linked ? (
        <GateCard
          title="Compte Twitch non lié"
          description="Lie ton compte Twitch pour afficher uniquement les membres que tu ne suis pas encore."
          actionLabel="Lier mon Twitch"
          href={connectTwitchHref}
        />
      ) : (
        <>
          <section
            className="rounded-2xl border p-5 md:p-6"
            style={{
              borderColor: "rgba(145,70,255,0.4)",
              background:
                "linear-gradient(136deg, rgba(20,20,32,0.98) 0%, rgba(39,24,58,0.9) 100%)",
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em]" style={{ color: "rgba(224,203,255,0.9)" }}>
                  Recommandations follows
                </p>
                <h2 className="mt-1 text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                  {filteredDiscoverMembers.length} chaîne(s) à découvrir
                </h2>
                <p className="mt-1 text-xs" style={{ color: "rgba(224,203,255,0.85)" }}>
                  Dernière maj : {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleString("fr-FR") : "maintenant"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={openTopRecommendations}
                  disabled={filteredDiscoverMembers.length === 0 || openingBatch}
                  className="rounded-xl border px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ borderColor: "rgba(224,203,255,0.4)", color: "var(--color-text)" }}
                >
                  {openingBatch ? "Ouverture..." : "Ouvrir 3 chaînes"}
                </button>
                <a
                  href="/member/engagement/score"
                  className="rounded-xl border px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/5"
                  style={{ borderColor: "rgba(224,203,255,0.4)", color: "var(--color-text)" }}
                >
                  Voir mon score
                </a>
                <button
                  type="button"
                  onClick={forceRefresh}
                  className="rounded-xl border px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/5"
                  style={{ borderColor: "rgba(224,203,255,0.4)", color: "var(--color-text)" }}
                >
                  Forcer la mise à jour
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-[1fr_auto]">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un pseudo, login ou rôle..."
                className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              />
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "all", label: "Tous" },
                  { key: "staff", label: "Staff" },
                  { key: "affilie", label: "Affiliés" },
                  { key: "developpement", label: "Développement" },
                  { key: "other", label: "Autres" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setRoleFilter(item.key as typeof roleFilter)}
                    className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-all hover:-translate-y-[1px]"
                    style={{
                      borderColor: roleFilter === item.key ? "rgba(145,70,255,0.65)" : "var(--color-border)",
                      backgroundColor: roleFilter === item.key ? "rgba(145,70,255,0.14)" : "transparent",
                      color: roleFilter === item.key ? "var(--color-text)" : "var(--color-text-secondary)",
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {filteredDiscoverMembers.length === 0 ? (
            <section className="rounded-2xl border p-6 text-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text-secondary)" }}>
              {discoverMembers.length === 0
                ? "Tu sembles déjà suivre tous les membres actifs référencés ici. Bravo 💜"
                : "Aucun résultat avec ces filtres. Essaie une recherche ou un rôle différent."}
            </section>
          ) : (
            <section className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredDiscoverMembers.map((member) => (
                <article
                  key={member.twitchLogin}
                  className="rounded-2xl border p-4 transition-all hover:-translate-y-[1px]"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-card)",
                    boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
                  }}
                >
                  <div className="mb-3 flex items-start gap-3">
                    <img
                      src={member.avatar || `https://placehold.co/64x64?text=${member.displayName.charAt(0)}`}
                      alt={member.displayName}
                      className="h-12 w-12 rounded-full border object-cover"
                      style={{ borderColor: "var(--color-border)" }}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold" style={{ color: "var(--color-text)" }}>
                        {member.displayName}
                      </p>
                      <p className="truncate text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        @{member.twitchLogin}
                      </p>
                      {member.role ? (
                        <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                          {member.role}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <a
                    href={member.twitchUrl || `https://www.twitch.tv/${member.twitchLogin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-xl px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    Aller suivre la chaîne
                  </a>
                </article>
              ))}
            </section>
          )}

          {error ? (
            <section className="rounded-2xl border p-4 text-xs" style={{ borderColor: "rgba(248,113,113,0.4)", backgroundColor: "rgba(127,29,29,0.22)", color: "#fecaca" }}>
              Une erreur est survenue pendant le chargement des recommandations. Réessaie dans quelques instants.
            </section>
          ) : null}
        </>
      )}
    </MemberSurface>
  );
}

function GateCard({
  title,
  description,
  actionLabel,
  href,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  href?: string;
  onAction?: () => void;
}) {
  return (
    <section
      className="rounded-2xl border p-6"
      style={{
        borderColor: "rgba(145,70,255,0.42)",
        background:
          "linear-gradient(130deg, rgba(23,20,34,0.98) 0%, rgba(35,23,50,0.92) 100%)",
      }}
    >
      <h2 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
        {title}
      </h2>
      <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        {description}
      </p>
      {href ? (
        <a
          href={href}
          className="mt-4 inline-flex rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {actionLabel}
        </a>
      ) : (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {actionLabel}
        </button>
      )}
    </section>
  );
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function mapRoleGroup(role?: string): "staff" | "affilie" | "developpement" | "other" {
  const normalized = normalizeText(role || "");
  if (!normalized) return "other";
  if (normalized.includes("admin") || normalized.includes("moderateur") || normalized.includes("soutien")) {
    return "staff";
  }
  if (normalized.includes("affilie")) return "affilie";
  if (normalized.includes("developpement")) return "developpement";
  return "other";
}

function readDiscoverCache(): DiscoverCachePayload | null {
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

function writeDiscoverCache(payload: DiscoverCachePayload) {
  try {
    localStorage.setItem(DISCOVER_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // noop
  }
}
