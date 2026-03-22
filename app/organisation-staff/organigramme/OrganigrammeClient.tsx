"use client";

import { useMemo, useState } from "react";
import type { OrgChartEntry, OrgChartPoleKey } from "@/lib/staff/orgChartTypes";
import { ORG_CHART_POLE_OPTIONS, poleTagFromKey } from "@/lib/staff/orgChartTypes";

type FilterKey = "all" | "direction" | "mod_active" | "mod_training" | "mod_pause" | "support";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Tous" },
  { key: "direction", label: "Direction" },
  { key: "mod_active", label: "Moderation active" },
  { key: "mod_training", label: "Moderation en formation" },
  { key: "mod_pause", label: "Moderation en pause" },
  { key: "support", label: "Soutien TENF" },
];

const SECTION_META: Record<string, { subtitle: string; accent: string }> = {
  founders: {
    subtitle: "Vision et cap communautaire",
    accent: "rgba(59,130,246,0.35)",
  },
  adminCoordinators: {
    subtitle: "Coordination des projets et des equipes",
    accent: "rgba(99,102,241,0.35)",
  },
  moderators: {
    subtitle: "Encadrement, securite et accompagnement",
    accent: "rgba(168,85,247,0.35)",
  },
  support: {
    subtitle: "Soutien transversal et dynamique communautaire",
    accent: "rgba(34,197,94,0.35)",
  },
};

function matchesFilter(entry: OrgChartEntry, filter: FilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "direction") {
    return entry.roleKey === "FONDATEUR" || entry.roleKey === "ADMIN_COORDINATEUR";
  }
  if (filter === "mod_active") return entry.roleKey === "MODERATEUR";
  if (filter === "mod_training") return entry.roleKey === "MODERATEUR_EN_FORMATION";
  if (filter === "mod_pause") return entry.roleKey === "MODERATEUR_EN_PAUSE";
  return entry.roleKey === "SOUTIEN_TENF" || entry.statusKey === "SUPPORT";
}

export default function OrganigrammeClient({ entries }: { entries: OrgChartEntry[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [poleFilter, setPoleFilter] = useState<OrgChartPoleKey | "all">("all");
  const [selectedEntry, setSelectedEntry] = useState<OrgChartEntry | null>(null);

  const visibleEntries = useMemo(
    () =>
      [...entries]
        .filter((entry) => entry.isVisible && !entry.isArchived)
        .filter((entry) => matchesFilter(entry, activeFilter))
        .filter((entry) =>
          poleFilter === "all"
            ? true
            : (entry.poleKey ? entry.poleKey === poleFilter : false) || entry.secondaryPoleKeys.includes(poleFilter)
        ),
    [entries, activeFilter, poleFilter]
  );

  const sortByMemberName = (items: OrgChartEntry[]) =>
    [...items].sort((a, b) =>
      (a.member.displayName || a.member.twitchLogin || "").localeCompare(b.member.displayName || b.member.twitchLogin || "", "fr", {
        sensitivity: "base",
      })
    );

  const grouped = useMemo(
    () => ({
      founders: sortByMemberName(visibleEntries.filter((entry) => entry.roleKey === "FONDATEUR")),
      adminCoordinators: sortByMemberName(visibleEntries.filter((entry) => entry.roleKey === "ADMIN_COORDINATEUR")),
      moderators: sortByMemberName(visibleEntries.filter(
        (entry) =>
          entry.roleKey === "MODERATEUR" ||
          entry.roleKey === "MODERATEUR_EN_FORMATION" ||
          entry.roleKey === "MODERATEUR_EN_PAUSE"
      )),
      support: sortByMemberName(visibleEntries.filter((entry) => entry.roleKey === "SOUTIEN_TENF" || entry.statusKey === "SUPPORT")),
    }),
    [visibleEntries]
  );

  const sections: Array<{ key: string; title: string; items: OrgChartEntry[] }> = [
    { key: "founders", title: "Fondateurs", items: grouped.founders },
    { key: "adminCoordinators", title: "Admin coordinateurs", items: grouped.adminCoordinators },
    { key: "moderators", title: "Moderateurs TENF", items: grouped.moderators },
    { key: "support", title: "Soutien TENF", items: grouped.support },
  ].filter((section) => section.items.length > 0);

  const totalVisible = visibleEntries.length;

  return (
    <main className="relative min-h-screen overflow-hidden py-12" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="org-bg-mesh" aria-hidden="true" />
      <div className="org-bg-glow org-bg-glow-left" aria-hidden="true" />
      <div className="org-bg-glow org-bg-glow-right" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <section
          className="relative overflow-hidden rounded-3xl border p-8 sm:p-10 lg:p-14 org-fade-up"
          style={{
            borderColor: "var(--color-border)",
            background:
              "radial-gradient(120% 130% at 10% 0%, rgba(59,130,246,0.2), rgba(15,23,42,0.15) 40%, rgba(2,6,23,0.75) 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 35%, transparent), transparent 70%)" }}
          />
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-primary)" }}>
            Structure communautaire TENF
          </p>
          <h1 className="mt-3 text-3xl font-bold md:text-5xl" style={{ color: "var(--color-text)" }}>
            Organigramme interactif TENF
          </h1>
          <p className="mt-4 max-w-4xl leading-7" style={{ color: "var(--color-text-secondary)" }}>
            Decouvre la structure humaine de la communaute TENF, ses roles, ses poles et son fonctionnement collectif.
            Cette vue est alimentee depuis l'administration, a partir des membres existants.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="org-stat-card">
              <span className="org-stat-label">Profils visibles</span>
              <strong className="org-stat-value">{totalVisible}</strong>
            </div>
            <div className="org-stat-card">
              <span className="org-stat-label">Direction</span>
              <strong className="org-stat-value">{grouped.founders.length + grouped.adminCoordinators.length}</strong>
            </div>
            <div className="org-stat-card">
              <span className="org-stat-label">Moderation TENF</span>
              <strong className="org-stat-value">{grouped.moderators.length}</strong>
            </div>
            <div className="org-stat-card">
              <span className="org-stat-label">Soutien TENF</span>
              <strong className="org-stat-value">{grouped.support.length}</strong>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border p-5 org-fade-up org-filters" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
              Filtres intelligents
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveFilter("all");
                setPoleFilter("all");
              }}
              className="rounded-full border px-3 py-1 text-xs font-semibold transition"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              Reinitialiser
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => {
              const active = activeFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveFilter(filter.key)}
                  className="rounded-full border px-4 py-2 text-sm transition"
                  style={{
                    borderColor: active ? "var(--color-primary)" : "var(--color-border)",
                    backgroundColor: active ? "var(--color-primary)" : "transparent",
                    color: active ? "white" : "var(--color-text)",
                  }}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
          <div className="mt-3 max-w-sm">
            <label className="text-xs uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
              Filtrer par pole
            </label>
            <select
              value={poleFilter}
              onChange={(e) => setPoleFilter(e.target.value as OrgChartPoleKey | "all")}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
            >
              <option value="all">Tous les poles</option>
              {ORG_CHART_POLE_OPTIONS.map((pole) => (
                <option key={pole.key} value={pole.key}>
                  {pole.emoji} {pole.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        {sections.length === 0 ? (
          <section className="rounded-2xl border p-6 org-fade-up" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
            <p style={{ color: "var(--color-text-secondary)" }}>
              Aucun profil visible pour le filtre actuel.
            </p>
          </section>
        ) : (
          sections.map((section) => (
            <section key={section.key} className="space-y-4 org-fade-up">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
                    {section.title}
                  </h2>
                  <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {SECTION_META[section.key]?.subtitle}
                  </p>
                </div>
                <span
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{
                    borderColor: SECTION_META[section.key]?.accent || "var(--color-border)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {section.items.length} profil{section.items.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {section.items.map((entry, index) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setSelectedEntry(entry)}
                    className="group rounded-2xl border p-5 text-left transition-all duration-300 hover:-translate-y-1 org-card"
                    style={{
                      borderColor:
                        section.key === "support"
                          ? "rgba(34,197,94,0.35)"
                          : "var(--color-border)",
                      background:
                        section.key === "support"
                          ? "linear-gradient(135deg, rgba(22,163,74,0.14), rgba(15,23,42,0.85) 35%, rgba(2,6,23,0.95) 100%)"
                          : "var(--color-card)",
                      animationDelay: `${Math.min(index * 45, 300)}ms`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {entry.member.avatarUrl ? (
                        <img
                          src={entry.member.avatarUrl}
                          alt={entry.member.displayName}
                          className="h-14 w-14 rounded-full border object-cover"
                          style={{ borderColor: "var(--color-border)" }}
                        />
                      ) : (
                        <div
                          className="flex h-14 w-14 items-center justify-center rounded-full border text-lg font-semibold"
                          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        >
                          {entry.member.displayName.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold" style={{ color: "var(--color-text)" }}>
                          {entry.member.displayName}
                        </h3>
                        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                          @{entry.member.twitchLogin}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className="rounded-full border px-2 py-1 text-xs"
                        style={{
                          borderColor: "var(--color-border)",
                          color: "var(--color-text-secondary)",
                          backgroundColor: "rgba(148,163,184,0.08)",
                        }}
                      >
                        {entry.roleLabel}
                      </span>
                      <span
                        className="rounded-full border px-2 py-1 text-xs"
                        style={{
                          borderColor: "var(--color-border)",
                          color: "var(--color-text-secondary)",
                          backgroundColor: "rgba(148,163,184,0.08)",
                        }}
                      >
                        {entry.statusLabel}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      {entry.bioShort || "Membre actif de l'organisation TENF."}
                    </p>
                    {entry.poleLabel ? (
                      <p
                        className="mt-3 text-xs font-semibold"
                        style={{ color: section.key === "support" ? "#86efac" : "var(--color-primary)" }}
                      >
                        {entry.poleLabel}
                      </p>
                    ) : null}
                    {entry.secondaryPoleKeys.length > 0 ? (
                      <p className="mt-1 text-xs org-secondary-poles" style={{ color: "var(--color-text-secondary)" }}>
                        Multi-pole: {entry.secondaryPoleKeys.map((pole) => poleTagFromKey(pole).label).join(" • ")}
                      </p>
                    ) : null}
                  </button>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {selectedEntry ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 org-modal-backdrop" onClick={() => setSelectedEntry(null)}>
          <div
            className="w-full max-w-xl rounded-2xl border p-6 org-modal"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-4">
              {selectedEntry.member.avatarUrl ? (
                <img
                  src={selectedEntry.member.avatarUrl}
                  alt={selectedEntry.member.displayName}
                  className="h-16 w-16 rounded-full border object-cover"
                  style={{ borderColor: "var(--color-border)" }}
                />
              ) : (
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full border text-xl font-semibold"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  {selectedEntry.member.displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
                  {selectedEntry.member.displayName}
                </h3>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  @{selectedEntry.member.twitchLogin}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                {selectedEntry.roleLabel}
              </span>
              <span className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                {selectedEntry.statusLabel}
              </span>
              {selectedEntry.poleLabel ? (
                <span className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                  {selectedEntry.poleLabel}
                </span>
              ) : null}
              {selectedEntry.secondaryPoleKeys.map((pole) => {
                const tag = poleTagFromKey(pole);
                return (
                  <span key={pole} className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                    {tag.emoji} {tag.label}
                  </span>
                );
              })}
            </div>
            <p className="mt-4 leading-7" style={{ color: "var(--color-text-secondary)" }}>
              {selectedEntry.bioShort || "Aucune bio courte renseignee pour ce profil."}
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium"
                style={{ backgroundColor: "var(--color-primary)", color: "white" }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .org-bg-mesh {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.3;
          background-image:
            radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.12), transparent 35%),
            radial-gradient(circle at 80% 10%, rgba(99, 102, 241, 0.1), transparent 30%),
            radial-gradient(circle at 70% 70%, rgba(168, 85, 247, 0.08), transparent 35%);
        }

        .org-bg-glow {
          position: absolute;
          width: 300px;
          height: 300px;
          filter: blur(80px);
          pointer-events: none;
          opacity: 0.2;
          animation: orgFloat 8s ease-in-out infinite;
        }

        .org-bg-glow-left {
          left: -120px;
          top: 160px;
          background: rgba(59, 130, 246, 0.35);
        }

        .org-bg-glow-right {
          right: -120px;
          bottom: 120px;
          background: rgba(124, 58, 237, 0.35);
          animation-delay: 1.2s;
        }

        .org-fade-up {
          opacity: 0;
          transform: translateY(10px);
          animation: orgFadeUp 0.55s ease forwards;
        }

        .org-filters {
          position: sticky;
          top: 16px;
          z-index: 20;
          backdrop-filter: blur(8px);
        }

        .org-card {
          opacity: 0;
          transform: translateY(8px);
          animation: orgCardIn 0.45s ease forwards;
          box-shadow: 0 14px 30px rgba(2, 6, 23, 0.25);
        }

        .org-card:hover {
          box-shadow: 0 18px 38px rgba(2, 6, 23, 0.38);
        }

        .org-stat-card {
          border: 1px solid var(--color-border);
          border-radius: 14px;
          padding: 10px 12px;
          background: rgba(2, 6, 23, 0.22);
        }

        .org-stat-label {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--color-text-secondary);
        }

        .org-stat-value {
          display: block;
          margin-top: 4px;
          font-size: 20px;
          line-height: 1;
          color: var(--color-text);
        }

        .org-secondary-poles {
          opacity: 0.85;
        }

        .org-modal-backdrop {
          backdrop-filter: blur(6px);
        }

        .org-modal {
          box-shadow: 0 25px 60px rgba(2, 6, 23, 0.55);
        }

        @keyframes orgFadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes orgCardIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes orgFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-14px);
          }
        }
      `}</style>
    </main>
  );
}
