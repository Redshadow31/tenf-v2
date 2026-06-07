"use client";

import { ChevronDown, ExternalLink, Sparkles } from "lucide-react";
import {
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_SCROLL_MT,
} from "@/components/member/dashboard/dashboardUi";
import type { DeclaredRaidRow, DeclarationFilter } from "@/components/member/raids/declare/raidDeclareUtils";
import {
  countDeclarationsByStatus,
  formatDeclarationStatus,
  RAID_DECLARE_ACCENT,
  twitchChannelUrl,
} from "@/components/member/raids/declare/raidDeclareUtils";

type RaidDeclareDeclarationsPanelProps = {
  loading: boolean;
  filteredDeclarations: DeclaredRaidRow[];
  totalDeclarations: number;
  declarationFilter: DeclarationFilter;
  onFilterChange: (filter: DeclarationFilter) => void;
  declarationCounts: ReturnType<typeof countDeclarationsByStatus>;
  expandedDeclarationId: string | null;
  onToggleExpand: (id: string) => void;
};

export default function RaidDeclareDeclarationsPanel({
  loading,
  filteredDeclarations,
  totalDeclarations,
  declarationFilter,
  onFilterChange,
  declarationCounts,
  expandedDeclarationId,
  onToggleExpand,
}: RaidDeclareDeclarationsPanelProps) {
  const filterTabs: { id: DeclarationFilter; label: string }[] = [
    { id: "all", label: `Tous (${declarationCounts.all})` },
    { id: "processing", label: `Traitement (${declarationCounts.processing})` },
    { id: "to_study", label: `À étudier (${declarationCounts.to_study})` },
    { id: "validated", label: `Validés (${declarationCounts.validated})` },
    { id: "rejected", label: `Refusés (${declarationCounts.rejected})` },
  ];

  return (
    <DashboardPanel
      id="declare-dossiers"
      tone="accent"
      accentHex={RAID_DECLARE_ACCENT}
      intensity="soft"
      ariaLabelledBy="declare-dossiers-title"
      className={MEMBER_SCROLL_MT}
    >
      <DashboardPanelHeader
        kicker="Suivi"
        title="Mes déclarations"
        tone="accent"
        accentHex={RAID_DECLARE_ACCENT}
        titleId="declare-dossiers-title"
        badge={<span className="text-[11px] text-white/45">Statuts mis à jour par la modération</span>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onFilterChange(tab.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              declarationFilter === tab.id
                ? "border-violet-400/45 bg-violet-500/20 text-violet-100"
                : "border-white/10 bg-black/30 text-white/45 hover:border-white/18 hover:text-white/75"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.04]" />
          ))}
        </div>
      ) : filteredDeclarations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/12 px-6 py-12 text-center">
          <Sparkles className="mx-auto h-9 w-9 text-white/25" aria-hidden />
          <p className="mt-3 font-semibold text-white">
            {totalDeclarations === 0 ? "Tu n'as pas encore déclaré de raid" : "Aucune déclaration pour ce filtre"}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/45">
            {totalDeclarations === 0
              ? "Utilise le formulaire ci-dessus seulement si un raid manque vraiment dans ton historique."
              : "Change de filtre ou consulte « Tous »."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filteredDeclarations.map((raid) => {
            const status = formatDeclarationStatus(raid.status);
            const StatusIcon = status.icon;
            const expanded = expandedDeclarationId === raid.id;
            return (
              <li key={raid.id}>
                <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-violet-500/25">
                  <button
                    type="button"
                    onClick={() => onToggleExpand(raid.id)}
                    className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-white">{raid.target}</p>
                      <p className="mt-1 text-xs text-white/45">
                        {new Date(raid.date).toLocaleString("fr-FR")}
                        {raid.approximate ? " · heure approximative" : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                        style={{ borderColor: status.border, color: status.color, backgroundColor: status.bg }}
                      >
                        <StatusIcon className="h-3.5 w-3.5" aria-hidden />
                        {status.label}
                      </span>
                      <ChevronDown className={`h-5 w-5 text-white/45 transition ${expanded ? "rotate-180" : ""}`} aria-hidden />
                    </div>
                  </button>
                  {expanded ? (
                    <div className="border-t border-white/8 px-4 py-4">
                      {raid.note ? (
                        <p className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white/70">
                          <span className="font-semibold text-white/45">Note : </span>
                          {raid.note}
                        </p>
                      ) : (
                        <p className="text-sm text-white/45">Aucune note sur ce dossier.</p>
                      )}
                      <a
                        href={twitchChannelUrl(raid.target)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 rounded-xl border border-violet-500/35 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-100 hover:bg-violet-500/20"
                      >
                        Chaîne Twitch <ExternalLink className="h-4 w-4" aria-hidden />
                      </a>
                    </div>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardPanel>
  );
}
