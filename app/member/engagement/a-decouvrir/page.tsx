"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Compass,
  Copy,
  ExternalLink,
  Gift,
  Heart,
  LayoutGrid,
  LayoutList,
  PartyPopper,
  RefreshCw,
  Search,
  Shuffle,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";
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
const DISCOVER_CACHE_KEY = "member.engagement.discover.v2";

type DiscoverCachePayload = {
  savedAt: number;
  authenticated: boolean;
  linked: boolean;
  members: PublicMember[];
  notFollowedLogins: string[];
};

type RoleFilterKey = "all" | "staff" | "affilie" | "developpement" | "other";
type ViewMode = "cards" | "list";

/** Au-delà de ce seuil, on affiche des textes explicites pour éviter le choc « liste infinie ». */
const LONG_BACKLOG = 120;
const VERY_LONG_BACKLOG = 250;

const ROLE_FILTER_ITEMS: { key: RoleFilterKey; label: string; hint: string }[] = [
  { key: "all", label: "Tous", hint: "Toute la communauté" },
  { key: "staff", label: "Staff", hint: "Animation & modération" },
  { key: "affilie", label: "Affilié·e·s", hint: "Créateurs TENF" },
  { key: "developpement", label: "Développement", hint: "Progression & talents" },
  { key: "other", label: "Autres", hint: "Profils variés" },
];

export default function MemberEngagementDiscoverPage() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [linked, setLinked] = useState(false);
  const [members, setMembers] = useState<PublicMember[]>([]);
  const [notFollowedLogins, setNotFollowedLogins] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilterKey>("all");
  const [openingBatch, setOpeningBatch] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [tipsOpen, setTipsOpen] = useState(false);
  const [highlightLogin, setHighlightLogin] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const cached = readDiscoverCache() ?? tryMigrateV1Cache();
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
        const followResponse = await fetch("/api/members/follow-status", { cache: "no-store", credentials: "include" });
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

        const membersResponse = await fetch("/api/members/public", { cache: "no-store", credentials: "include" });
        const membersBody = await membersResponse.json();
        if (!active) return;
        const rawMembers = Array.isArray(membersBody?.members) ? membersBody.members : [];
        const mapped: PublicMember[] = rawMembers
          .map((item: Record<string, unknown>) => ({
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

  const roleCounts = useMemo(() => {
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
  }, [discoverMembers]);

  const totalPending = discoverMembers.length;
  const isLongBacklog = totalPending >= LONG_BACKLOG;
  const isVeryLongBacklog = totalPending >= VERY_LONG_BACKLOG;

  const pickRandom = useCallback(() => {
    if (filteredDiscoverMembers.length === 0) return;
    const i = Math.floor(Math.random() * filteredDiscoverMembers.length);
    const login = filteredDiscoverMembers[i].twitchLogin;
    setHighlightLogin(login);
    const el = cardRefs.current[login];
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => setHighlightLogin(null), 2400);
  }, [filteredDiscoverMembers]);

  async function openTopRecommendations(n: number) {
    if (filteredDiscoverMembers.length === 0 || openingBatch) return;
    setOpeningBatch(true);
    try {
      const top = filteredDiscoverMembers.slice(0, n);
      for (const member of top) {
        const url = member.twitchUrl || `https://www.twitch.tv/${member.twitchLogin}`;
        window.open(url, "_blank", "noopener,noreferrer");
        await new Promise((resolve) => setTimeout(resolve, 220));
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
          description="Nous préparons ta liste personnalisée. Pas de chronos : tu ouvres cette page quand tu en as envie."
          badge="Engagement"
        />
        <DiscoverSkeleton />
      </MemberSurface>
    );
  }

  return (
    <MemberSurface>
      <MemberPageHeader
        title="À découvrir"
        description={
          linked
            ? "Ici, tu vois des chaînes TENF que ton compte Twitch ne suit pas encore. Ce n’est ni un devoir ni un classement : tu picore ce qui t’attire, à ton rythme. Les anciens comme les nouveaux ont tout intérêt à repasser de temps en temps — la communauté bouge, et cette page se met à jour."
            : "Connecte-toi et lie Twitch pour afficher une liste sur mesure. On ne te jugera pas sur la vitesse ni sur le nombre : l’objectif, c’est que ce soit naturel."
        }
        badge="Engagement"
        extras={
          linked && discoverMembers.length > 0 ? (
            <span
              className="inline-flex max-w-[min(100%,22rem)] flex-col gap-0.5 rounded-2xl border border-violet-400/35 bg-violet-500/12 px-3 py-2 text-left text-xs font-semibold text-violet-100 sm:flex-row sm:items-center sm:gap-2"
              title="Ce nombre peut être élevé au début : c’est normal."
            >
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden />
                {discoverMembers.length} piste{discoverMembers.length > 1 ? "s" : ""}
              </span>
              {isVeryLongBacklog ? (
                <span className="font-normal text-[11px] leading-snug text-violet-200/85">
                  Liste longue ? Rien d’anormal — la communauté est grande.
                </span>
              ) : isLongBacklog ? (
                <span className="font-normal text-[11px] leading-snug text-violet-200/85">
                  À prendre comme un catalogue, pas comme une corvée.
                </span>
              ) : null}
            </span>
          ) : linked ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              <Heart className="h-3.5 w-3.5" aria-hidden />
              Radar complet
            </span>
          ) : null
        }
      />

      {!authenticated ? (
        <GateCard
          title="Connexion Discord requise"
          description="On a besoin de ta session pour croiser ta liste de follows Twitch avec les membres TENF — tout reste côté TENF, comme pour ton score d'engagement."
          actionLabel="Se connecter avec Discord"
          onAction={loginWithDiscord}
        />
      ) : !linked ? (
        <GateCard
          title="Lie ton compte Twitch"
          description="Sans liaison Twitch, on ne peut pas savoir quelles chaînes TENF tu suis déjà. Une fois lié, cette page devient ta liste personnalisée « à découvrir »."
          actionLabel="Lier mon Twitch"
          href={connectTwitchHref}
        />
      ) : (
        <>
          <nav
            className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/85 to-slate-950/95 p-3"
            aria-label="Navigation engagement"
          >
            {[
              { href: "/member/dashboard", label: "Tableau de bord" },
              { href: "/member/engagement/score", label: "Mon score", emphasize: true },
              { href: "/member/engagement/amis", label: "Mes follows TENF" },
              { href: "/member/objectifs", label: "Objectifs" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition hover:bg-white/10 ${
                  l.emphasize ? "bg-fuchsia-600/35 text-white ring-1 ring-fuchsia-400/35" : "text-slate-200"
                }`}
              >
                {l.label}
                <ArrowRight className="h-3 w-3 opacity-70" aria-hidden />
              </Link>
            ))}
          </nav>

          <section className="relative overflow-hidden rounded-3xl border border-fuchsia-500/30 bg-gradient-to-br from-[#140f1c] via-[#1a1228] to-[#0c0812] p-6 shadow-[0_28px_60px_rgba(0,0,0,0.38)] md:p-8">
            <div className="pointer-events-none absolute -left-20 top-0 h-56 w-56 rounded-full bg-violet-600/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-fuchsia-200/85">Pistes de découverte</p>
                <h2 className="text-3xl font-black leading-tight text-white md:text-4xl">
                  {isLongBacklog ? (
                    <>
                      <span className="block text-lg font-semibold tracking-tight text-violet-200/95 md:text-xl">
                        Beaucoup de chaînes possibles — sans obligation de tout voir
                      </span>
                      <span className="mt-2 block">
                        <span className="bg-gradient-to-r from-violet-200 to-fuchsia-200 bg-clip-text text-transparent">
                          {filteredDiscoverMembers.length}
                        </span>
                        <span className="text-violet-100/90">
                          {" "}
                          avec tes filtres actuels
                          {filteredDiscoverMembers.length !== totalPending ? (
                            <span className="text-base font-medium text-violet-300/80">
                              {" "}
                              ({totalPending} au total dans ton radar)
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="bg-gradient-to-r from-violet-200 to-fuchsia-200 bg-clip-text text-transparent">
                        {filteredDiscoverMembers.length}
                      </span>{" "}
                      <span className="text-violet-100">
                        chaîne{filteredDiscoverMembers.length > 1 ? "s" : ""} à explorer
                      </span>
                    </>
                  )}
                </h2>
                <p className="max-w-xl text-sm leading-relaxed text-violet-100/85">
                  {isVeryLongBacklog
                    ? "Si tu débarques ou si tu reconnectes Twitch, il est courant d’afficher 250 chaînes ou plus : la communauté active est large. Ce n’est pas un retard à rattraper ni une performance à faire vite — ni lentement d’ailleurs : ce qui compte, c’est que ça reste léger pour toi."
                    : isLongBacklog
                      ? "Une liste longue, ce n’est pas un échec et ce n’est pas une course. Tu peux en suivre une par semaine, ou seulement quand un pseudo te fait envie : les boutons ci-contre sont des raccourcis optionnels, pas des quotas."
                      : "Quand tu as un créneau, ouvre un profil qui te parle. Un follow, c’est un petit coup de pouce à la visibilité — sans pression sur la quantité."}
                </p>
                <div className="flex flex-wrap gap-2 text-[11px] text-violet-200/75">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    Staff · {roleCounts.staff}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    Affilié·e·s · {roleCounts.affilie}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    Développement · {roleCounts.developpement}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    Autres · {roleCounts.other}
                  </span>
                </div>
                <p className="text-[11px] text-violet-300/65">
                  Dernière mise à jour :{" "}
                  {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleString("fr-FR") : "à l'instant"}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:flex-col xl:flex-row">
                <button
                  type="button"
                  onClick={() => openTopRecommendations(3)}
                  disabled={filteredDiscoverMembers.length === 0 || openingBatch}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-violet-950 shadow-lg transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-55"
                  title="Ouvre quelques onglets pour jeter un œil — tu fermes ce qui ne te plaît pas."
                >
                  <Wand2 className="h-4 w-4" aria-hidden />
                  {openingBatch ? "Ouverture…" : "3 idées (onglets)"}
                </button>
                <button
                  type="button"
                  onClick={() => openTopRecommendations(5)}
                  disabled={filteredDiscoverMembers.length === 0 || openingBatch}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-55"
                  title="Optionnel : un peu plus de curiosité d’un coup, toujours sans obligation de follow."
                >
                  <Gift className="h-4 w-4 text-amber-300" aria-hidden />
                  5 idées (onglets)
                </button>
                <button
                  type="button"
                  onClick={pickRandom}
                  disabled={filteredDiscoverMembers.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-fuchsia-400/35 bg-fuchsia-500/15 px-5 py-3 text-sm font-semibold text-fuchsia-50 transition hover:bg-fuchsia-500/25 disabled:cursor-not-allowed disabled:opacity-55"
                  title="Sort un profil au hasard dans ta liste filtrée."
                >
                  <Shuffle className="h-4 w-4" aria-hidden />
                  Piocher au hasard
                </button>
                <button
                  type="button"
                  onClick={forceRefresh}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                  title="Recharge les données depuis Twitch et TENF (utile après des follows)."
                >
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  Rafraîchir la liste
                </button>
              </div>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/35 to-slate-950/80 p-5">
              <div className="flex items-start gap-3">
                <Heart className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden />
                <div>
                  <h3 className="text-sm font-bold text-white">Nouveau ou liste très longue</h3>
                  <p className="mt-2 text-sm leading-relaxed text-emerald-100/85">
                    Voir plus de 250 chaînes, c’est fréquent : ça veut dire que beaucoup de monde stream côté TENF, pas que tu « dois » tout suivre.
                    Ni vite ni lentement : une chaîne quand tu veux, zéro le mois d’après si tu préfères — aucun drama.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-950/25 to-slate-950/80 p-5">
              <div className="flex items-start gap-3">
                <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden />
                <div>
                  <h3 className="text-sm font-bold text-white">Déjà membre depuis un moment</h3>
                  <p className="mt-2 text-sm leading-relaxed text-amber-100/85">
                    Les arrivées et les chaînes évoluent : un passage ici de temps en temps suffit pour repérer qui est nouveau ou qui t’avait échappé.
                    Pense à « Rafraîchir la liste » après une série de follows — et à ton{" "}
                    <Link href="/member/engagement/score" className="font-semibold text-amber-200 underline underline-offset-2 hover:text-white">
                      score d’engagement
                    </Link>{" "}
                    pour la vue d’ensemble, sans obsession du 100 %.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTipsOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-2xl border border-sky-500/25 bg-sky-950/30 px-4 py-3 text-left text-sm font-semibold text-sky-100 transition hover:bg-sky-950/45"
            aria-expanded={tipsOpen}
          >
            <span className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-sky-300" aria-hidden />
              Conseils pratiques (zéro culpabilité)
            </span>
            <span className="text-xs text-sky-300/80">{tipsOpen ? "Masquer" : "Afficher"}</span>
          </button>
          {tipsOpen ? (
            <ul className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-relaxed text-slate-300">
              <li className="flex gap-2">
                <span className="text-fuchsia-400">•</span>
                « 3 / 5 idées » ouvre des onglets : tu regardes si ça te plaît, tu fermes le reste. Ce n’est pas un engagement moral de follow.
              </li>
              <li className="flex gap-2">
                <span className="text-fuchsia-400">•</span>
                « Piocher au hasard » et les filtres servent à casser la routine — pas à maximiser un score à tout prix.
              </li>
              <li className="flex gap-2">
                <span className="text-fuchsia-400">•</span>
                Pour les anciens : bookmarker cette page ou y revenir après les annonces Discord suffit souvent. Chaque petite mise à jour aide la visibilité collective.
              </li>
              <li className="flex gap-2">
                <span className="text-fuchsia-400">•</span>
                Curieux du bilan global ?{" "}
                <Link href="/member/engagement/score" className="font-semibold text-violet-300 underline underline-offset-2 hover:text-white">
                  Mon score
                </Link>{" "}
                résume où tu en es — sans te pousser à tout cocher en une semaine.
              </li>
            </ul>
          ) : null}

          <section className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/45 p-5 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative max-w-lg flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pseudo, @login ou rôle…"
                  className="w-full rounded-xl border border-white/15 bg-black/35 py-3 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-violet-400/45 focus:outline-none focus:ring-2 focus:ring-violet-500/25"
                />
              </div>
              <div className="flex rounded-xl border border-white/10 bg-black/30 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                    viewMode === "cards"
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" aria-hidden />
                  Grille
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                    viewMode === "list"
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <LayoutList className="h-4 w-4" aria-hidden />
                  Liste
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {ROLE_FILTER_ITEMS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setRoleFilter(item.key)}
                  title={item.hint}
                  className={`rounded-full border px-4 py-2 text-left text-xs font-semibold transition ${
                    roleFilter === item.key
                      ? "border-violet-400/55 bg-violet-600/35 text-white shadow-lg shadow-violet-900/30"
                      : "border-white/12 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:bg-white/[0.07]"
                  }`}
                >
                  <span className="block">{item.label}</span>
                  {item.key !== "all" ? (
                    <span className="block text-[10px] font-normal opacity-75">{roleCounts[item.key]} profil(s)</span>
                  ) : (
                    <span className="block text-[10px] font-normal opacity-75">{roleCounts.all} au total</span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {filteredDiscoverMembers.length === 0 ? (
            <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-violet-950/40 p-10 text-center">
              <Users className="mx-auto h-12 w-12 text-violet-300/80" aria-hidden />
              <p className="mt-4 text-lg font-semibold text-white">
                {discoverMembers.length === 0
                  ? "Tu sembles déjà suivre tout le monde dans ce radar 💜"
                  : "Aucun résultat avec ces filtres"}
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                {discoverMembers.length === 0
                  ? "Si tu es à jour aujourd’hui, tant mieux — ce n’est pas une fin en soi : de nouveaux membres arrivent, les chaînes évoluent. Repasser ici de temps en temps suffit. En attendant, tu peux consulter ton score ou le tableau de bord sans pression."
                  : "Élargis la recherche ou repasse sur « Tous » pour retrouver la liste complète."}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/member/engagement/score"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-violet-950"
                >
                  Mon score
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                {discoverMembers.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setRoleFilter("all");
                    }}
                    className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Réinitialiser les filtres
                  </button>
                ) : null}
              </div>
            </section>
          ) : viewMode === "cards" ? (
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredDiscoverMembers.map((member) => (
                <DiscoverCard
                  key={member.twitchLogin}
                  member={member}
                  highlight={highlightLogin === member.twitchLogin}
                  refCallback={(el) => {
                    cardRefs.current[member.twitchLogin] = el;
                  }}
                />
              ))}
            </section>
          ) : (
            <section className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-3">
              {filteredDiscoverMembers.map((member) => (
                <DiscoverListRow
                  key={member.twitchLogin}
                  member={member}
                  highlight={highlightLogin === member.twitchLogin}
                  refCallback={(el) => {
                    cardRefs.current[member.twitchLogin] = el;
                  }}
                />
              ))}
            </section>
          )}

          {error ? (
            <section className="rounded-2xl border border-red-500/35 bg-red-950/40 p-4 text-sm text-red-200">
              Une erreur est survenue pendant le chargement. Réessaie dans quelques instants.
            </section>
          ) : null}
        </>
      )}
    </MemberSurface>
  );
}

function DiscoverCard({
  member,
  highlight,
  refCallback,
}: {
  member: PublicMember;
  highlight: boolean;
  refCallback: (el: HTMLDivElement | null) => void;
}) {
  const group = mapRoleGroup(member.role);
  const badge = roleBadgeStyles(group);
  const twitchHref = member.twitchUrl || `https://www.twitch.tv/${member.twitchLogin}`;

  async function copyLogin() {
    try {
      await navigator.clipboard.writeText(member.twitchLogin);
    } catch {
      // noop
    }
  }

  return (
    <div
      ref={refCallback}
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-900/95 to-slate-950 p-5 shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-900/25 ${
        highlight ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950" : "border-white/10 hover:border-violet-400/35"
      }`}
    >
      <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl transition group-hover:opacity-100 ${badge.glow}`} />
      <div className="relative flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <img
            src={member.avatar || `https://placehold.co/72x72/1e1b2e/a78bfa?text=${encodeURIComponent(member.displayName.charAt(0).toUpperCase())}`}
            alt=""
            className="h-14 w-14 shrink-0 rounded-2xl border border-white/10 object-cover shadow-md"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-white">{member.displayName}</p>
            <p className="truncate font-mono text-xs text-violet-200/75">@{member.twitchLogin}</p>
            <span className={`mt-2 inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.chip}`}>
              {badge.label}
            </span>
          </div>
        </div>
        {member.role ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">{member.role}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <a
            href={twitchHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-95 sm:flex-none"
          >
            Voir sur Twitch
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
          <button
            type="button"
            onClick={copyLogin}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
            title="Copier le login"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden />
            Copier
          </button>
        </div>
      </div>
    </div>
  );
}

function DiscoverListRow({
  member,
  highlight,
  refCallback,
}: {
  member: PublicMember;
  highlight: boolean;
  refCallback: (el: HTMLDivElement | null) => void;
}) {
  const group = mapRoleGroup(member.role);
  const badge = roleBadgeStyles(group);
  const twitchHref = member.twitchUrl || `https://www.twitch.tv/${member.twitchLogin}`;

  return (
    <div
      ref={refCallback}
      className={`flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 transition hover:border-violet-500/30 hover:bg-white/[0.06] ${
        highlight ? "ring-2 ring-amber-400/90" : ""
      }`}
    >
      <img
        src={member.avatar || `https://placehold.co/48x48/1e1b2e/a78bfa?text=${encodeURIComponent(member.displayName.charAt(0).toUpperCase())}`}
        alt=""
        className="h-10 w-10 shrink-0 rounded-xl border border-white/10 object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-white">{member.displayName}</p>
        <p className="truncate font-mono text-[11px] text-violet-200/65">@{member.twitchLogin}</p>
      </div>
      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${badge.chip}`}>{badge.label}</span>
      <a
        href={twitchHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-lg border border-violet-400/35 bg-violet-600/25 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-violet-600/40"
      >
        Twitch
        <ExternalLink className="h-3 w-3" aria-hidden />
      </a>
    </div>
  );
}

function roleBadgeStyles(group: ReturnType<typeof mapRoleGroup>): { label: string; chip: string; glow: string } {
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
        glow: "bg-emerald-500/25 opacity-60",
      };
    default:
      return {
        label: "Communauté",
        chip: "border-slate-400/35 bg-slate-600/20 text-slate-200",
        glow: "bg-violet-500/20 opacity-50",
      };
  }
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
    <section className="relative overflow-hidden rounded-3xl border border-violet-500/40 bg-gradient-to-br from-[#181028] to-[#0f0a14] p-8 shadow-[0_24px_48px_rgba(0,0,0,0.35)]">
      <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-violet-600/20 blur-3xl" />
      <h2 className="relative text-2xl font-bold text-white">{title}</h2>
      <p className="relative mt-3 max-w-lg text-sm leading-relaxed text-violet-100/85">{description}</p>
      {href ? (
        <a
          href={href}
          className="relative mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-bold text-violet-950 shadow-lg transition hover:bg-violet-100"
        >
          {actionLabel}
        </a>
      ) : (
        <button
          type="button"
          onClick={onAction}
          className="relative mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-bold text-violet-950 shadow-lg transition hover:bg-violet-100"
        >
          {actionLabel}
        </button>
      )}
    </section>
  );
}

function DiscoverSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-44 rounded-3xl bg-white/5" />
      <div className="h-28 rounded-3xl bg-white/5" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-52 rounded-2xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function mapRoleGroup(role?: string): RoleFilterKey {
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

/** Migre l’ancien cache v1 si encore présent */
function tryMigrateV1Cache(): DiscoverCachePayload | null {
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

function writeDiscoverCache(payload: DiscoverCachePayload) {
  try {
    localStorage.setItem(DISCOVER_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // noop
  }
}
