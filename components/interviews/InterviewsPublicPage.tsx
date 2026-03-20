"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";

type InterviewGroupType = "staff" | "member";

type InterviewItem = {
  id: string;
  title: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  groupType: InterviewGroupType;
  memberTwitchLogin: string;
  memberDisplayName: string;
  memberRole?: string;
  isPublished: boolean;
  sortOrder: number;
  featured: boolean;
  thumbnailOverride?: string;
  interviewDate?: string;
  durationText?: string;
};

type PublicInterviewsResponse = {
  interviews?: InterviewItem[];
};

type GroupFilter = "all" | InterviewGroupType;
type PublicTab = "all" | "staff-presentation" | "members";

function youtubeThumbnail(item: InterviewItem): string {
  if (item.thumbnailOverride && /^https?:\/\//i.test(item.thumbnailOverride)) {
    return item.thumbnailOverride;
  }
  return `https://i.ytimg.com/vi/${item.youtubeVideoId}/hqdefault.jpg`;
}

function groupLabel(value: InterviewGroupType): string {
  return value === "staff" ? "Staff" : "Membres";
}

function InterviewCard({
  item,
  onOpen,
  variant = "default",
}: {
  item: InterviewItem;
  onOpen: (item: InterviewItem) => void;
  variant?: "default" | "member";
}) {
  if (variant === "member") {
    return (
      <article
        className="group overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-1"
        style={{
          borderColor: "color-mix(in srgb, var(--color-primary) 42%, var(--color-border))",
          background:
            "linear-gradient(160deg, color-mix(in srgb, var(--color-primary) 12%, var(--color-card)) 0%, var(--color-card) 100%)",
          boxShadow: "0 14px 28px rgba(0,0,0,0.18)",
        }}
      >
        <button type="button" className="w-full text-left" onClick={() => onOpen(item)}>
          <div className="relative aspect-video overflow-hidden bg-black/30">
            <img
              src={youtubeThumbnail(item)}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute left-3 top-3 flex gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                style={{ backgroundColor: "rgba(16,185,129,0.88)" }}
              >
                Membre
              </span>
              {item.featured ? (
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  Coup de cœur
                </span>
              ) : null}
            </div>
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="line-clamp-2 text-sm font-semibold text-white drop-shadow">
                {item.title}
              </p>
            </div>
          </div>
        </button>

        <div className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <img
              src={`https://unavatar.io/twitch/${item.memberTwitchLogin}`}
              alt={item.memberDisplayName}
              className="h-12 w-12 rounded-full border object-cover"
              style={{ borderColor: "color-mix(in srgb, var(--color-primary) 45%, var(--color-border))" }}
              loading="lazy"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{item.memberDisplayName}</p>
              <p className="truncate text-xs" style={{ color: "var(--color-text-secondary)" }}>
                @{item.memberTwitchLogin}
                {item.memberRole ? ` · ${item.memberRole}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {item.interviewDate ? (
              <span
                className="rounded-full border px-2 py-0.5"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
              >
                {item.interviewDate}
              </span>
            ) : null}
            {item.durationText ? (
              <span
                className="rounded-full border px-2 py-0.5"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
              >
                {item.durationText}
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onOpen(item)}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Voir l&apos;interview
            </button>
            <a
              href={`https://www.twitch.tv/${item.memberTwitchLogin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:bg-white/5"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Chaîne Twitch
            </a>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className="group overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-1"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
    >
      <button type="button" className="w-full text-left" onClick={() => onOpen(item)}>
        <div className="relative aspect-video overflow-hidden bg-black/25">
          <img
            src={youtubeThumbnail(item)}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span
              className="inline-flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-200 group-hover:scale-110"
              style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
            >
              ▶
            </span>
          </div>
          <div className="absolute left-2 top-2 flex gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
              style={{ backgroundColor: item.groupType === "staff" ? "rgba(59,130,246,0.85)" : "rgba(16,185,129,0.85)" }}
            >
              {groupLabel(item.groupType)}
            </span>
            {item.featured ? (
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Mise en avant
              </span>
            ) : null}
          </div>
        </div>
      </button>

      <div className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          <img
            src={`https://unavatar.io/twitch/${item.memberTwitchLogin}`}
            alt={item.memberDisplayName}
            className="h-10 w-10 rounded-full object-cover"
            loading="lazy"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{item.memberDisplayName}</p>
            <p className="truncate text-xs" style={{ color: "var(--color-text-secondary)" }}>
              @{item.memberTwitchLogin}
              {item.memberRole ? ` · ${item.memberRole}` : ""}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpen(item)}
          className="line-clamp-2 text-left text-sm font-medium hover:underline"
        >
          {item.title}
        </button>

        <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
          {item.interviewDate ? <span>{item.interviewDate}</span> : null}
          {item.interviewDate && item.durationText ? <span>•</span> : null}
          {item.durationText ? <span>{item.durationText}</span> : null}
        </div>
      </div>
    </article>
  );
}

export default function InterviewsPublicPage({ backHref = "/vip" }: { backHref?: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<InterviewItem | null>(null);
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<PublicTab>("all");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    if (tabParam === "staff" || tabParam === "staff-presentation") {
      setActiveTab("staff-presentation");
      return;
    }
    if (tabParam === "members" || tabParam === "member") {
      setActiveTab("members");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (activeTab === "all") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", activeTab);
    }
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [activeTab]);

  const effectiveGroupFilter: GroupFilter = useMemo(() => {
    if (activeTab === "staff-presentation") return "staff";
    if (activeTab === "members") return "member";
    return groupFilter;
  }, [activeTab, groupFilter]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/public/interviews", { cache: "no-store" });
        const payload = (await response.json()) as PublicInterviewsResponse;
        if (!response.ok) {
          throw new Error("Impossible de charger les interviews.");
        }
        const items = Array.isArray(payload.interviews) ? payload.interviews : [];
        setInterviews(items.filter((item) => item.isPublished));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur réseau.");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelected(null);
      }
    }
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return interviews.filter((item) => {
      if (effectiveGroupFilter !== "all" && item.groupType !== effectiveGroupFilter) return false;
      if (featuredOnly && !item.featured) return false;
      if (!normalized) return true;
      const haystack = `${item.title} ${item.memberDisplayName} ${item.memberTwitchLogin}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [effectiveGroupFilter, featuredOnly, interviews, query]);

  const staff = filtered.filter((item) => item.groupType === "staff");
  const members = filtered.filter((item) => item.groupType === "member");
  const total = filtered.length;
  const tabbedItems = useMemo(() => {
    if (activeTab === "staff-presentation") return staff;
    if (activeTab === "members") return members;
    return filtered;
  }, [activeTab, filtered, staff, members]);

  return (
    <main className="min-h-screen py-10 sm:py-12" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <section
          className="relative overflow-hidden rounded-3xl border p-6 sm:p-8"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full blur-3xl"
            style={{ background: "color-mix(in srgb, var(--color-primary) 22%, transparent)" }}
          />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                Interviews TENF
              </p>
              <h1 className="text-3xl font-bold sm:text-4xl">Interviews vidéo</h1>
              <p className="max-w-3xl text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                Une page vitrine pour explorer les interviews Staff et Membres, avec un accès rapide aux contenus marquants.
              </p>
            </div>
            <Link
              href={backHref}
              className="rounded-xl border px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/5"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Retour
            </Link>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher titre ou membre..."
              className="w-full rounded-xl border px-3 py-2 outline-none"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            />
            <select
              value={groupFilter}
              onChange={(event) => setGroupFilter(event.target.value as GroupFilter)}
              disabled={activeTab !== "all"}
              className="rounded-xl border px-3 py-2 text-sm outline-none"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            >
              <option value="all">Tous les groupes</option>
              <option value="staff">Staff</option>
              <option value="member">Membres</option>
            </select>
            <label
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            >
              <input
                type="checkbox"
                checked={featuredOnly}
                onChange={(event) => setFeaturedOnly(event.target.checked)}
              />
              Mise en avant uniquement
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span
              className="rounded-full border px-2.5 py-1"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              {total} vidéo{total > 1 ? "s" : ""} visible{total > 1 ? "s" : ""}
            </span>
            <span
              className="rounded-full border px-2.5 py-1"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              Staff: {staff.length}
            </span>
            <span
              className="rounded-full border px-2.5 py-1"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              Membres: {members.length}
            </span>
          </div>

          <div className="mt-4 inline-flex flex-wrap gap-2 rounded-xl border p-1" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
            {[
              { id: "all", label: "Toutes les interviews" },
              { id: "staff-presentation", label: `Présentation du staff (${staff.length})` },
              { id: "members", label: `Interviews membres (${members.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as PublicTab)}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  borderColor: activeTab === tab.id ? "var(--color-primary)" : "var(--color-border)",
                  backgroundColor: activeTab === tab.id ? "var(--color-primary)" : "var(--color-surface)",
                  color: activeTab === tab.id ? "#fff" : "var(--color-text)",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <section
            className="rounded-2xl border p-6 text-sm"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text-secondary)" }}
          >
            Chargement des interviews...
          </section>
        ) : error ? (
          <section
            className="rounded-2xl border p-6 text-sm"
            style={{ borderColor: "rgba(248,113,113,0.35)", backgroundColor: "rgba(127,29,29,0.2)", color: "#fecaca" }}
          >
            {error}
          </section>
        ) : (
          <div className="space-y-5">
            {activeTab === "staff-presentation" ? (
              <section
                className="rounded-2xl border p-4 text-sm"
                style={{ borderColor: "color-mix(in srgb, var(--color-primary) 42%, var(--color-border))", backgroundColor: "var(--color-card)" }}
              >
                <p className="font-semibold">Présentation du staff TENF</p>
                <p className="mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  Cette section met en avant les interviews staff: rôle, vision, parcours et responsabilités dans la communauté.
                  Les contenus affichés ici sont gérés depuis le back-office admin interviews.
                </p>
                <p className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  L’onglet applique automatiquement le filtre groupe <strong>Staff</strong> pour rester synchronisé avec la catégorisation
                  définie dans l’admin.
                </p>
                <div className="mt-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/admin/interviews"
                      className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/5"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                    >
                      Ouvrir la gestion admin interviews
                    </Link>
                    <Link
                      href="/interviews?tab=staff-presentation"
                      className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/5"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                    >
                      Lien direct présentation staff
                    </Link>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-2xl font-bold sm:text-3xl">
                  {activeTab === "staff-presentation"
                    ? "Interviews de présentation staff"
                    : activeTab === "members"
                      ? "Interviews Membres"
                      : "Toutes les interviews"}
                </h2>
                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {tabbedItems.length} vidéo{tabbedItems.length > 1 ? "s" : ""}
                </span>
              </div>
              {tabbedItems.length === 0 ? (
                <div
                  className="rounded-2xl border p-5 text-sm"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text-secondary)" }}
                >
                  Aucune interview disponible pour cet onglet avec les filtres actuels.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tabbedItems.map((item) => (
                    <InterviewCard
                      key={item.id}
                      item={item}
                      onOpen={setSelected}
                      variant={item.groupType === "member" ? "member" : "default"}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-4xl rounded-2xl border p-4"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold sm:text-lg">{selected.title}</h3>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {selected.memberDisplayName} · {groupLabel(selected.groupType)}
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={selected.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border px-2 py-1 text-xs transition-colors hover:bg-white/5"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  Ouvrir YouTube
                </a>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-lg border px-2 py-1 text-xs"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  Fermer
                </button>
              </div>
            </div>
            <div className="aspect-video overflow-hidden rounded-xl bg-black">
              {/* Lazy: iframe créée uniquement quand le modal est ouvert */}
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${selected.youtubeVideoId}?autoplay=1&rel=0`}
                title={selected.title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
