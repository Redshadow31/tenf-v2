"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState, type ComponentType } from "react";
import {
  ArrowRight,
  BarChart3,
  Compass,
  ExternalLink,
  Heart,
  HelpCircle,
  LayoutGrid,
  ListFilter,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { loginWithDiscord } from "@/lib/discord";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";

type FollowState = "followed" | "not_followed" | "unknown";

type FollowStatusesResponse = {
  authenticated?: boolean;
  linked?: boolean;
  reason?: string;
  statuses?: Record<
    string,
    {
      state?: FollowState;
      twitchLogin?: string;
      twitchId?: string | null;
      visual?: "coeur_plein" | "coeur_vide" | "point_interrogation";
    }
  >;
};

type FollowEntry = {
  login: string;
  state: FollowState;
  twitchId: string | null;
  visual: "coeur_plein" | "coeur_vide" | "point_interrogation";
};

type ListFilter = "all" | FollowState;

function getUserFriendlyReason(reason: string | null): string | null {
  if (!reason || reason === "ok") return null;
  if (reason === "unauthorized" || reason === "not_authenticated") {
    return "Connecte-toi pour consulter ton score d'engagement.";
  }
  if (reason === "twitch_not_linked" || reason === "not_linked") {
    return "Lie ton compte Twitch pour activer le suivi d'engagement.";
  }
  if (reason === "token_unavailable") {
    return "Token Twitch indisponible : reconnecte ou relance la liaison Twitch depuis les paramètres.";
  }
  if (reason === "twitch_api_error") {
    return "L'API Twitch a temporairement échoué. Réessaie dans quelques minutes.";
  }
  return "Certaines informations d'engagement ne sont pas disponibles pour le moment.";
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const SCORE_CACHE_KEY = "member.engagement.score.v2";

const TENF_ENGAGEMENT_VALUES = [
  {
    title: "Soutien bienveillant",
    description:
      "Le follow est un signal durable : tu aides chaque membre à gagner en visibilité sans pression ni obligation.",
    icon: Heart,
    accent: "from-fuchsia-500/25 to-purple-600/10",
    border: "border-fuchsia-400/35",
  },
  {
    title: "Ouverture communautaire",
    description:
      "On découvre des univers différents et on met en lumière des parcours variés au sein de TENF.",
    icon: Users,
    accent: "from-sky-500/20 to-indigo-600/10",
    border: "border-sky-400/35",
  },
  {
    title: "Progression collective",
    description:
      "Chaque follow renforce le réseau et crée des occasions naturelles de collaboration entre membres.",
    icon: Compass,
    accent: "from-emerald-500/20 to-teal-700/10",
    border: "border-emerald-400/35",
  },
];

const ENGAGEMENT_GUIDELINES = [
  "Suivre régulièrement les membres actifs pour maintenir un soutien concret.",
  "Découvrir les profils moins visibles et encourager leur progression.",
  "Valoriser la constance : un follow utile dans le temps vaut plus qu'un effet ponctuel.",
  "Transformer ton score en impact humain, pas en simple statistique.",
];

const COMMUNITY_GUIDELINES = [
  "Partager les chaînes TENF avec respect et sans pression.",
  "Favoriser des interactions positives quand tu passes sur un live membre.",
  "Célébrer les progrès de chacun, même les petites étapes.",
  "Construire une dynamique de soutien mutuel dans la durée.",
];

type ScoreCachePayload = {
  savedAt: number;
  authenticated: boolean;
  linked: boolean;
  reason: string | null;
  entries: FollowEntry[];
};

function normalizeStatuses(raw: FollowStatusesResponse["statuses"]): FollowEntry[] {
  const out: FollowEntry[] = [];
  const rawStatuses = raw || {};
  for (const [login, entry] of Object.entries(rawStatuses)) {
    const normalizedLogin = login.toLowerCase();
    const state = entry?.state || "unknown";
    const visual =
      entry?.visual ||
      (state === "followed" ? "coeur_plein" : state === "not_followed" ? "coeur_vide" : "point_interrogation");
    out.push({
      login: normalizedLogin,
      state,
      twitchId: entry?.twitchId ?? null,
      visual,
    });
  }
  out.sort((a, b) => a.login.localeCompare(b.login, "fr"));
  return out;
}

function getTier(score: number, perfect: boolean): { label: string; hint: string } {
  if (perfect) return { label: "Ambassadeur·rice TENF", hint: "Tu suivais déjà tout le monde suivi — merci pour l'exemple." };
  if (score >= 85) return { label: "Collecteur·rice de soutiens", hint: "Tu es très large : quelques chaînes peuvent encore rejoindre ta liste." };
  if (score >= 60) return { label: "Membre engagé·e", hint: "Belle dynamique — continue avec les profils « À découvrir »." };
  if (score >= 35) return { label: "En progression", hint: "Chaque follow compte : pars des streams qui te parlent." };
  return { label: "Exploration", hint: "C'est le bon moment pour ouvrir « À découvrir » et élargir ton radar." };
}

function encouragement(score: number, perfect: boolean, notFollowed: number): string {
  if (perfect) return "Magnifique équilibre : ta liste reflète une vraie présence communautaire.";
  if (score >= 75) return `Encore ${notFollowed} chaîne${notFollowed > 1 ? "s" : ""} à suivre pour viser le sans-faute.`;
  if (score >= 40) return "Tu es sur une bonne trajectoire — filtre « À suivre » pour avancer méthodiquement.";
  return "Pas de jugement sur un pourcentage : l'outil sert à repérer qui tu peux soutenir tranquillement.";
}

type TabKey = "overview" | "detail";

export default function MemberEngagementScorePage() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [linked, setLinked] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [entries, setEntries] = useState<FollowEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");
  const [listFilter, setListFilter] = useState<ListFilter>("all");
  const [query, setQuery] = useState("");
  const [guidelinesOpen, setGuidelinesOpen] = useState<"engagement" | "community" | null>("engagement");

  useEffect(() => {
    const cached = readScoreCache();
    if (cached) {
      setAuthenticated(cached.authenticated);
      setLinked(cached.linked);
      setReason(cached.reason);
      setEntries(cached.entries);
      setLastUpdatedAt(cached.savedAt);
      setLoading(false);
      return;
    }

    let active = true;
    (async () => {
      try {
        setError(null);
        const response = await fetch("/api/members/follow-status", { cache: "no-store", credentials: "include" });
        const body = (await response.json()) as FollowStatusesResponse;
        if (!active) return;

        if (!response.ok) {
          setAuthenticated(false);
          setLinked(false);
          setEntries([]);
          setReason(body?.reason || "unauthorized");
          return;
        }

        const list = normalizeStatuses(body?.statuses);
        setAuthenticated(body?.authenticated === true);
        setLinked(body?.linked === true);
        setReason(body?.reason || null);
        setEntries(list);
        const savedAt = Date.now();
        setLastUpdatedAt(savedAt);
        writeScoreCache({
          savedAt,
          authenticated: body?.authenticated === true,
          linked: body?.linked === true,
          reason: body?.reason || null,
          entries: list,
        });
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erreur réseau.");
        setAuthenticated(false);
        setLinked(false);
        setEntries([]);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  function forceRefresh() {
    try {
      localStorage.removeItem(SCORE_CACHE_KEY);
    } catch {
      // noop
    }
    window.location.reload();
  }

  const analytics = useMemo(() => {
    const values = entries.map((e) => e.state);
    const total = values.length;
    const followed = values.filter((state) => state === "followed").length;
    const notFollowed = values.filter((state) => state === "not_followed").length;
    const unknown = values.filter((state) => state === "unknown").length;
    const score = total > 0 ? Math.round((followed / total) * 100) : 0;
    const perfect = total > 0 && notFollowed === 0 && unknown === 0;
    return { total, followed, notFollowed, unknown, score, perfect };
  }, [entries]);

  const tier = useMemo(() => getTier(analytics.score, analytics.perfect), [analytics.score, analytics.perfect]);

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (listFilter !== "all" && e.state !== listFilter) return false;
      if (q && !e.login.includes(q)) return false;
      return true;
    });
  }, [entries, listFilter, query]);

  const followCtaHref = "/member/engagement/a-decouvrir";
  const connectTwitchHref = `/api/auth/twitch/link/start?callbackUrl=${encodeURIComponent("/member/engagement/score")}`;

  const barSegments = useMemo(
    () =>
      analytics.total > 0
        ? [
            { key: "followed" as const, count: analytics.followed, label: "Suivi·e", className: "bg-violet-500" },
            { key: "not_followed" as const, count: analytics.notFollowed, label: "À suivre", className: "bg-amber-400/90" },
            { key: "unknown" as const, count: analytics.unknown, label: "Inconnu", className: "bg-slate-500/80" },
          ]
        : [],
    [analytics]
  );

  if (loading) {
    return (
      <MemberSurface>
        <MemberPageHeader
          title="Mon score d'engagement TENF"
          description="Nous analysons tes follows Twitch par rapport aux membres actifs — pour un soutien communautaire lisible et actionnable."
          badge="Engagement"
        />
        <ScorePageSkeleton />
      </MemberSurface>
    );
  }

  return (
    <MemberSurface>
      <MemberPageHeader
        title="Mon score d'engagement TENF"
        description={
          linked
            ? "Ce tableau traduit combien de membres TENF actifs tu suis déjà sur Twitch. Ce n'est pas une compétition : c'est un radar pour découvrir qui soutenir, au rythme qui te convient."
            : "Une fois connecté·e et avec Twitch lié, tu verras la part des membres actifs que tu suis déjà — et les pistes pour élargir ton soutien sans pression."
        }
        badge={linked ? tier.label : "Engagement"}
        extras={
          linked ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-violet-100/95">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden />
              {analytics.score}% · {analytics.followed}/{analytics.total || "—"} chaînes
            </span>
          ) : null
        }
      />

      {!authenticated ? (
        <GateCard
          title="Connexion Discord requise"
          description="Connecte-toi avec Discord pour charger ton score d'engagement et synchroniser avec tes follows Twitch."
          actionLabel="Se connecter avec Discord"
          onAction={loginWithDiscord}
        />
      ) : !linked ? (
        <GateCard
          title="Lie ton compte Twitch"
          description="Sans Twitch lié, on ne peut pas comparer ta liste de follows aux membres actifs TENF. Ça prend quelques secondes."
          actionLabel="Lier mon Twitch"
          href={connectTwitchHref}
        />
      ) : (
        <>
          <nav
            className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-3"
            aria-label="Navigation engagement"
          >
            {[
              { href: "/member/dashboard", label: "Tableau de bord" },
              { href: "/member/engagement/a-decouvrir", label: "À découvrir", emphasize: true },
              { href: "/member/engagement/amis", label: "Mes follows TENF" },
              { href: "/member/objectifs", label: "Objectifs" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition hover:bg-white/10 ${
                  l.emphasize ? "bg-violet-600/35 text-white ring-1 ring-violet-400/40" : "text-slate-200"
                }`}
              >
                {l.label}
                <ArrowRight className="h-3 w-3 opacity-70" aria-hidden />
              </Link>
            ))}
          </nav>

          <section className="relative overflow-hidden rounded-3xl border border-violet-500/35 bg-gradient-to-br from-[#151018] via-[#1e1430] to-[#120c18] p-6 shadow-[0_28px_60px_rgba(0,0,0,0.35)] md:p-8">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-600/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl" />

            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                <ScoreRing score={analytics.score} perfect={analytics.perfect} />
                <div className="max-w-xl space-y-3 text-center sm:text-left">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-200/85">Radar follow TENF</p>
                  <h2 className="text-2xl font-bold text-white md:text-3xl">{tier.label}</h2>
                  <p className="text-sm leading-relaxed text-violet-100/85">{tier.hint}</p>
                  <p className="text-sm text-violet-200/75">{encouragement(analytics.score, analytics.perfect, analytics.notFollowed)}</p>
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <Link
                      href={followCtaHref}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-violet-950 shadow-lg transition hover:bg-violet-100"
                    >
                      Ouvrir « À découvrir »
                      <ExternalLink className="h-4 w-4" aria-hidden />
                    </Link>
                    <button
                      type="button"
                      onClick={forceRefresh}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      <RefreshCw className="h-4 w-4" aria-hidden />
                      Actualiser les données
                    </button>
                  </div>
                  <p className="text-[11px] text-violet-300/70">
                    Dernière mise à jour :{" "}
                    {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleString("fr-FR") : "à l'instant"}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative mt-8 space-y-2">
              <p className="text-xs font-medium text-violet-200/80">Répartition (clique pour filtrer la liste)</p>
              <div className="flex h-4 w-full overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10">
                {barSegments.map((seg) => {
                  const pct = analytics.total > 0 ? (seg.count / analytics.total) * 100 : 0;
                  const w = Math.max(pct > 0 ? pct : 0, 0);
                  const filterKey: ListFilter =
                    seg.key === "followed" ? "followed" : seg.key === "not_followed" ? "not_followed" : "unknown";
                  return (
                    <button
                      key={seg.key}
                      type="button"
                      title={`${seg.label}: ${seg.count}`}
                      className={`${seg.className} min-w-[4px] transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80`}
                      style={{ width: `${w}%` }}
                      onClick={() => {
                        setTab("detail");
                        setListFilter(filterKey);
                      }}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-3 text-[11px] text-violet-200/80">
                {barSegments.map((seg) => (
                  <span key={seg.key} className="inline-flex items-center gap-1.5">
                    <span className={`inline-block h-2 w-2 rounded-full ${seg.className}`} />
                    {seg.label}: {seg.count}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-slate-950/40 p-2">
            <TabButton active={tab === "overview"} onClick={() => setTab("overview")} icon={LayoutGrid}>
              Vue d'ensemble
            </TabButton>
            <TabButton active={tab === "detail"} onClick={() => setTab("detail")} icon={BarChart3}>
              Détail par chaîne
            </TabButton>
          </div>

          {tab === "overview" ? (
            <>
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <InteractiveStatCard
                  label="Suivi·e"
                  value={analytics.followed}
                  tone="good"
                  active={listFilter === "followed"}
                  onClick={() => {
                    setListFilter("followed");
                    setTab("detail");
                  }}
                />
                <InteractiveStatCard
                  label="À suivre"
                  value={analytics.notFollowed}
                  tone="warn"
                  active={listFilter === "not_followed"}
                  onClick={() => {
                    setListFilter("not_followed");
                    setTab("detail");
                  }}
                />
                <InteractiveStatCard
                  label="Statut inconnu"
                  value={analytics.unknown}
                  tone="neutral"
                  active={listFilter === "unknown"}
                  onClick={() => {
                    setListFilter("unknown");
                    setTab("detail");
                  }}
                />
                <InteractiveStatCard
                  label="Objectif plein score"
                  value={analytics.perfect ? "OK" : "En cours"}
                  tone={analytics.perfect ? "good" : "neutral"}
                  onClick={() => setTab("detail")}
                />
              </section>

              <section className="grid gap-4 md:grid-cols-3">
                {TENF_ENGAGEMENT_VALUES.map((item) => {
                  const Icon = item.icon;
                  return (
                    <article
                      key={item.title}
                      className={`group rounded-2xl border ${item.border} bg-gradient-to-br ${item.accent} p-5 shadow-lg transition duration-300 hover:-translate-y-0.5 hover:shadow-xl`}
                    >
                      <div className="mb-3 inline-flex rounded-xl border border-white/15 bg-black/20 p-2.5 text-violet-100 transition group-hover:border-white/25">
                        <Icon className="h-5 w-5" aria-hidden />
                      </div>
                      <h3 className="text-base font-semibold text-white">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-200/85">{item.description}</p>
                    </article>
                  );
                })}
              </section>

              <AccordionGuidelines open={guidelinesOpen} onToggle={(k) => setGuidelinesOpen((prev) => (prev === k ? null : k))} />
            </>
          ) : (
            <section className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/50 p-5 md:p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 text-white">
                  <ListFilter className="h-5 w-5 text-violet-300" aria-hidden />
                  <h3 className="text-lg font-bold">Membres actifs TENF</h3>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-violet-100">
                    {filteredMembers.length} affiché(s)
                  </span>
                </div>
                <div className="relative max-w-md flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filtrer par pseudo Twitch…"
                    className="w-full rounded-xl border border-white/15 bg-black/30 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["all", "Tous"] as const,
                    ["followed", "Suivi·e"] as const,
                    ["not_followed", "À suivre"] as const,
                    ["unknown", "Inconnu"] as const,
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setListFilter(key)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                      listFilter === key
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40"
                        : "border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <ul className="max-h-[min(520px,55vh)] space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-black/25 p-2 pr-1">
                {filteredMembers.length === 0 ? (
                  <li className="rounded-xl px-4 py-8 text-center text-sm text-slate-400">Aucune chaîne pour ce filtre.</li>
                ) : (
                  filteredMembers.map((m) => <MemberRow key={m.login} entry={m} />)
                )}
              </ul>
            </section>
          )}

          <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
            {analytics.perfect ? (
              <p className="flex items-start gap-2 text-sm text-emerald-300">
                <TrendingUp className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                Excellent : tu suivais déjà l’ensemble des membres actifs pris en compte dans ce radar.
              </p>
            ) : (
              <p className="text-sm text-slate-300">
                Tu peux encore faire progresser ton score en explorant{" "}
                <Link href={followCtaHref} className="font-semibold text-violet-300 underline decoration-violet-500/50 underline-offset-2 hover:text-white">
                  À découvrir
                </Link>
                {" "}— des suggestions pensées pour élargir ton soutien sans liste administrative.
              </p>
            )}
            {getUserFriendlyReason(reason) ? (
              <p className="mt-3 text-xs text-amber-200/90">{getUserFriendlyReason(reason)}</p>
            ) : null}
            {error ? <p className="mt-3 text-xs text-red-300">Erreur réseau : réessaie dans quelques instants.</p> : null}
          </section>
        </>
      )}
    </MemberSurface>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition sm:flex-none sm:justify-start ${
        active
          ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {children}
    </button>
  );
}

function ScoreRing({ score, perfect }: { score: number; perfect: boolean }) {
  const gid = useId();
  const size = 132;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, score)) / 100) * c;

  return (
    <div className="relative flex h-[140px] w-[140px] shrink-0 items-center justify-center">
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={`${gid}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="55%" stopColor="#e879f9" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid}-grad)`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-black text-white">{score}%</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-200/80">{perfect ? "Complet" : "Score"}</span>
      </div>
    </div>
  );
}

function MemberRow({ entry }: { entry: FollowEntry }) {
  const href = `https://www.twitch.tv/${encodeURIComponent(entry.login)}`;
  const label =
    entry.state === "followed"
      ? "Suivi·e"
      : entry.state === "not_followed"
        ? "Pas encore suivi·e"
        : "Inconnu";

  const badgeClass =
    entry.state === "followed"
      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
      : entry.state === "not_followed"
        ? "border-amber-400/40 bg-amber-500/15 text-amber-100"
        : "border-slate-400/40 bg-slate-500/15 text-slate-200";

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 transition hover:border-violet-500/25 hover:bg-white/[0.06]">
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-lg leading-none" aria-hidden title={entry.visual}>
          {entry.visual === "coeur_plein" ? "❤️" : entry.visual === "coeur_vide" ? "🤍" : "❔"}
        </span>
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-semibold text-white">{entry.login}</p>
          <p className="text-[11px] text-slate-500">Membre actif TENF</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badgeClass}`}>{label}</span>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-violet-200 hover:bg-white/10"
        >
          Twitch
          <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
      </div>
    </li>
  );
}

function InteractiveStatCard({
  label,
  value,
  tone,
  onClick,
  active,
}: {
  label: string;
  value: string | number;
  tone: "good" | "warn" | "neutral";
  onClick?: () => void;
  active?: boolean;
}) {
  const palette =
    tone === "good"
      ? { border: "border-emerald-400/35", bg: "from-emerald-950/40 to-slate-950/80", color: "#86efac" }
      : tone === "warn"
        ? { border: "border-amber-400/35", bg: "from-amber-950/35 to-slate-950/80", color: "#fcd34d" }
        : { border: "border-white/15", bg: "from-slate-900/60 to-slate-950/90", color: "var(--color-text)" };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border bg-gradient-to-br p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${palette.border} ${palette.bg} ${
        active ? "ring-2 ring-violet-400/60" : ""
      }`}
    >
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color: palette.color }}>
        {value}
      </p>
      <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">Voir le détail →</p>
    </button>
  );
}

function AccordionGuidelines({
  open,
  onToggle,
}: {
  open: "engagement" | "community" | null;
  onToggle: (key: "engagement" | "community") => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-br from-slate-900/90 to-slate-950">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-white hover:bg-white/5"
          onClick={() => onToggle("engagement")}
          aria-expanded={open === "engagement"}
        >
          <span className="flex items-center gap-2">
            <Target className="h-4 w-4 text-sky-300" aria-hidden />
            Intention engagement
          </span>
          <HelpCircle className="h-4 w-4 text-sky-300/80" aria-hidden />
        </button>
        {open === "engagement" ? (
          <ul className="space-y-2 border-t border-white/10 px-4 py-3 text-sm text-slate-300">
            {ENGAGEMENT_GUIDELINES.map((tip) => (
              <li key={tip} className="flex gap-2 rounded-lg bg-black/20 px-3 py-2">
                <span className="text-sky-400">•</span>
                {tip}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900/90 to-slate-950">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-white hover:bg-white/5"
          onClick={() => onToggle("community")}
          aria-expanded={open === "community"}
        >
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-300" aria-hidden />
            Intention communauté
          </span>
          <HelpCircle className="h-4 w-4 text-emerald-300/80" aria-hidden />
        </button>
        {open === "community" ? (
          <ul className="space-y-2 border-t border-white/10 px-4 py-3 text-sm text-slate-300">
            {COMMUNITY_GUIDELINES.map((tip) => (
              <li key={tip} className="flex gap-2 rounded-lg bg-black/20 px-3 py-2">
                <span className="text-emerald-400">•</span>
                {tip}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function ScorePageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-48 rounded-3xl bg-white/5" />
      <div className="grid gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-white/5" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-36 rounded-2xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}

function readScoreCache(): ScoreCachePayload | null {
  try {
    const raw = localStorage.getItem(SCORE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ScoreCachePayload & { statuses?: Record<string, FollowState> };
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > CACHE_TTL_MS) return null;
    if (parsed.entries && Array.isArray(parsed.entries)) return parsed as ScoreCachePayload;
    if (parsed.statuses && typeof parsed.statuses === "object") {
      const entries = normalizeStatuses(parsed.statuses as FollowStatusesResponse["statuses"]);
      return {
        savedAt: parsed.savedAt,
        authenticated: parsed.authenticated,
        linked: parsed.linked,
        reason: parsed.reason,
        entries,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function writeScoreCache(payload: ScoreCachePayload) {
  try {
    localStorage.setItem(SCORE_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // noop
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
