"use client";

import { useMemo, useState } from "react";
import type { OrgChartEntry, OrgChartPoleKey } from "@/lib/staff/orgChartTypes";
import { ORG_CHART_POLE_OPTIONS } from "@/lib/staff/orgChartTypes";

type FilterKey = "all" | "direction" | "mod_active" | "mod_training" | "mod_pause" | "support";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Tous" },
  { key: "direction", label: "Direction" },
  { key: "mod_active", label: "Moderation active" },
  { key: "mod_training", label: "Moderation en formation" },
  { key: "mod_pause", label: "Moderation en pause" },
  { key: "support", label: "Soutien TENF" },
];

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
        .filter((entry) => (poleFilter === "all" ? true : entry.poleKey === poleFilter))
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [entries, activeFilter, poleFilter]
  );

  const grouped = useMemo(
    () => ({
      direction: visibleEntries.filter((entry) => entry.roleKey === "FONDATEUR" || entry.roleKey === "ADMIN_COORDINATEUR"),
      moderationActive: visibleEntries.filter((entry) => entry.roleKey === "MODERATEUR"),
      moderationTraining: visibleEntries.filter((entry) => entry.roleKey === "MODERATEUR_EN_FORMATION"),
      moderationPause: visibleEntries.filter((entry) => entry.roleKey === "MODERATEUR_EN_PAUSE"),
      support: visibleEntries.filter((entry) => entry.roleKey === "SOUTIEN_TENF" || entry.statusKey === "SUPPORT"),
    }),
    [visibleEntries]
  );

  const sections: Array<{ key: string; title: string; items: OrgChartEntry[] }> = [
    { key: "direction", title: "Direction", items: grouped.direction },
    { key: "moderationActive", title: "Moderateurs actifs", items: grouped.moderationActive },
    { key: "moderationTraining", title: "Moderateurs en formation", items: grouped.moderationTraining },
    { key: "moderationPause", title: "Moderateurs en pause", items: grouped.moderationPause },
    { key: "support", title: "Soutien TENF", items: grouped.support },
  ].filter((section) => section.items.length > 0);

  return (
    <main className="min-h-screen py-12" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <section
          className="relative overflow-hidden rounded-3xl border p-8 sm:p-10"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-primary)" }}>
            Organisation humaine
          </p>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl" style={{ color: "var(--color-text)" }}>
            Organigramme interactif TENF
          </h1>
          <p className="mt-4 max-w-4xl leading-7" style={{ color: "var(--color-text-secondary)" }}>
            Decouvre la structure humaine de la communaute TENF, ses roles, ses poles et son fonctionnement collectif.
          </p>
        </section>

        <section className="rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
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
          <section className="rounded-2xl border p-6" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
            <p style={{ color: "var(--color-text-secondary)" }}>
              Aucun profil visible pour le filtre actuel.
            </p>
          </section>
        ) : (
          sections.map((section) => (
            <section key={section.key} className="space-y-4">
              <h2 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
                {section.title}
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {section.items.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setSelectedEntry(entry)}
                    className="group rounded-2xl border p-5 text-left transition hover:-translate-y-0.5"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
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
                      <span className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                        {entry.roleLabel}
                      </span>
                      <span className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                        {entry.statusLabel}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      {entry.bioShort || "Membre actif de l'organisation TENF."}
                    </p>
                    <p className="mt-3 text-xs font-semibold" style={{ color: "var(--color-primary)" }}>
                      {entry.poleLabel}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {selectedEntry ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedEntry(null)}>
          <div
            className="w-full max-w-xl rounded-2xl border p-6"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
              {selectedEntry.member.displayName}
            </h3>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              @{selectedEntry.member.twitchLogin}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                {selectedEntry.roleLabel}
              </span>
              <span className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                {selectedEntry.statusLabel}
              </span>
              <span className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                {selectedEntry.poleLabel}
              </span>
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
    </main>
  );
}
