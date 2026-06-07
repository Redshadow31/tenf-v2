"use client";

import type { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarClock,
  ChevronRight,
  Heart,
  Info,
  Loader2,
  Search,
  Twitch,
  UserCircle,
  X,
} from "lucide-react";
import {
  DashboardInnerCard,
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_SCROLL_MT,
} from "@/components/member/dashboard/dashboardUi";
import { RAID_DECLARE_QUICK_NOTES } from "@/components/member/raids/declare/raidDeclareContent";
import type { LowRaidedSuggestion, RaidTargetSuggestion } from "@/components/member/raids/declare/raidDeclareUtils";
import {
  RAID_DECLARE_ACCENT,
  RAID_DECLARE_FIELD_CLASS,
  RAID_DECLARE_FIELD_LABEL,
  segmentBadgeClass,
} from "@/components/member/raids/declare/raidDeclareUtils";

type RaidDeclareFormPanelProps = {
  form: { target: string; date: string; note: string };
  setForm: Dispatch<SetStateAction<{ target: string; date: string; note: string }>>;
  isApproximateTime: boolean;
  setIsApproximateTime: (value: boolean) => void;
  error: string;
  submitting: boolean;
  backendSubmissionEnabled: boolean;
  showAutocomplete: boolean;
  setShowAutocomplete: (value: boolean) => void;
  loadingSuggestions: boolean;
  groupedSuggestions: [string, RaidTargetSuggestion[]][];
  lowRaidedSuggestions: LowRaidedSuggestion[];
  applySuggestion: (login: string) => void;
  applyNow: () => void;
  onSubmit: () => void;
};

export default function RaidDeclareFormPanel(props: RaidDeclareFormPanelProps) {
  const {
    form,
    setForm,
    isApproximateTime,
    setIsApproximateTime,
    error,
    submitting,
    backendSubmissionEnabled,
    showAutocomplete,
    setShowAutocomplete,
    loadingSuggestions,
    groupedSuggestions,
    lowRaidedSuggestions,
    applySuggestion,
    applyNow,
    onSubmit,
  } = props;

  return (
    <DashboardPanel
      id="declare-form"
      tone="accent"
      accentHex={RAID_DECLARE_ACCENT}
      intensity="soft"
      ariaLabelledBy="declare-form-title"
      className={MEMBER_SCROLL_MT}
    >
      <DashboardPanelHeader
        kicker="Secours"
        title="Signaler un raid absent"
        icon={Twitch}
        tone="accent"
        accentHex={RAID_DECLARE_ACCENT}
        titleId="declare-form-title"
      />

      <DashboardInnerCard hover={false} className="mb-4 !border-amber-500/25 !bg-amber-950/15 !p-3">
        <div className="flex gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden />
          <p className="text-xs leading-relaxed text-amber-100/90">
            Avant d&apos;envoyer, vérifie{" "}
            <Link href="/member/raids/historique" className="font-semibold text-violet-300 underline-offset-2 hover:underline">
              Mes raids
            </Link>{" "}
            : un doublon ralentit la modération pour tout le monde.
          </p>
        </div>
      </DashboardInnerCard>

      <div className="space-y-5">
        <div>
          <label htmlFor="raid-target" className={RAID_DECLARE_FIELD_LABEL}>
            Pseudo Twitch de la cible *
          </label>
          <div className="relative">
            <Twitch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-400" aria-hidden />
            <input
              id="raid-target"
              value={form.target}
              onChange={(event) => setForm((prev) => ({ ...prev, target: event.target.value }))}
              onFocus={() => setShowAutocomplete(true)}
              className={`${RAID_DECLARE_FIELD_CLASS} pl-10 pr-10`}
              placeholder="ex. pseudo_twitch"
              autoComplete="off"
            />
            <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" aria-hidden />
          </div>

          {showAutocomplete ? (
            <div className="mt-2 overflow-hidden rounded-2xl border border-white/12 bg-black/50 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/8 px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/45">Membres TENF</span>
                <button
                  type="button"
                  onClick={() => setShowAutocomplete(false)}
                  className="rounded-lg p-1 text-white/45 hover:bg-white/10 hover:text-white"
                  aria-label="Fermer les suggestions"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-[260px] overflow-y-auto p-2">
                {loadingSuggestions ? (
                  <div className="flex items-center gap-2 px-2 py-4 text-sm text-white/45">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Recherche…
                  </div>
                ) : groupedSuggestions.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-white/45">
                    Aucun membre trouvé — pseudo libre possible, mais hors TENF = refus probable.
                  </p>
                ) : (
                  groupedSuggestions.map(([groupName, items]) => (
                    <div key={groupName} className="mb-3 last:mb-0">
                      <p className="sticky top-0 z-[1] bg-black/90 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-300">
                        {groupName}
                      </p>
                      <div className="mt-1 space-y-1">
                        {items.map((item) => (
                          <button
                            key={`${groupName}-${item.login}`}
                            type="button"
                            onClick={() => applySuggestion(item.login)}
                            className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-left text-sm transition hover:border-violet-500/35 hover:bg-violet-500/10"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <UserCircle className="h-4 w-4 shrink-0 text-violet-400" aria-hidden />
                              <span className="truncate font-medium text-white/90">{item.label}</span>
                              <span className="truncate text-xs text-white/45">@{item.login}</span>
                            </span>
                            <span
                              className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${segmentBadgeClass(groupName)}`}
                            >
                              {item.role || "Membre"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}

          <p className="mt-2 text-xs leading-relaxed text-white/45">
            Privilégie un membre TENF — l&apos;entraide du collectif passe avant les chaînes extérieures.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label htmlFor="raid-datetime" className={RAID_DECLARE_FIELD_LABEL}>
              Date et heure du raid *
            </label>
            <input
              id="raid-datetime"
              type="datetime-local"
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              className={RAID_DECLARE_FIELD_CLASS}
            />
          </div>
          <button
            type="button"
            onClick={applyNow}
            className="inline-flex h-[46px] shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 text-sm font-bold text-amber-100 transition hover:bg-amber-500/25"
          >
            <CalendarClock className="h-4 w-4" aria-hidden />
            Maintenant
          </button>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/25 px-4 py-3">
          <input
            type="checkbox"
            checked={isApproximateTime}
            onChange={(event) => setIsApproximateTime(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-black/50 text-violet-600 focus:ring-violet-500/30"
          />
          <span>
            <span className="font-semibold text-white/85">Heure approximative</span>
            <span className="mt-0.5 block text-xs text-white/45">
              Coche si tu n&apos;as pas l&apos;heure exacte — la modération en tiendra compte.
            </span>
          </span>
        </label>

        <DashboardInnerCard hover={false} className="!border-emerald-500/25 !bg-emerald-950/20 !p-4">
          <div className="mb-2 flex items-center gap-2">
            <Heart className="h-4 w-4 text-emerald-400" aria-hidden />
            <p className="text-sm font-bold text-emerald-100">Membres peu raidés ce mois-ci</p>
          </div>
          <p className="mb-3 text-xs text-white/45">
            Un clic remplit la cible. Pour les retours en attente, voir{" "}
            <Link href="/member/raids/historique" className="font-semibold text-cyan-300 underline-offset-2 hover:underline">
              Mes raids — qui rendre la pareille ?
            </Link>
            .
          </p>
          <div className="flex flex-wrap gap-2">
            {lowRaidedSuggestions.length === 0 ? (
              <span className="text-sm text-white/45">Aucune suggestion pour le moment.</span>
            ) : (
              lowRaidedSuggestions.map((item) => (
                <button
                  key={item.login}
                  type="button"
                  onClick={() => applySuggestion(item.login)}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:border-emerald-400/50 hover:bg-emerald-500/20"
                >
                  {item.label}
                  <span className="rounded-md bg-black/40 px-1.5 py-0.5 tabular-nums text-[10px] text-emerald-300/90">
                    {item.receivedCount} reçus
                  </span>
                </button>
              ))
            )}
          </div>
        </DashboardInnerCard>

        <div>
          <label htmlFor="raid-note" className={RAID_DECLARE_FIELD_LABEL}>
            Contexte (optionnel)
          </label>
          <div className="mb-2 flex flex-wrap gap-2">
            {RAID_DECLARE_QUICK_NOTES.map((note) => {
              const active = form.note === note;
              return (
                <button
                  key={note}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, note }))}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "border-violet-400/50 bg-violet-500/25 text-violet-50"
                      : "border-white/12 bg-black/30 text-white/45 hover:border-violet-500/30 hover:text-white/75"
                  }`}
                >
                  {note}
                </button>
              );
            })}
          </div>
          <textarea
            id="raid-note"
            rows={3}
            value={form.note}
            onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
            className={RAID_DECLARE_FIELD_CLASS}
            placeholder="Ex. : Raid de fin de soirée, ambiance chill…"
          />
        </div>

        {error ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/35 bg-red-950/25 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting || !backendSubmissionEnabled}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-900/25 transition hover:brightness-110 disabled:pointer-events-none disabled:opacity-45"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Envoi…
              </>
            ) : (
              <>
                Envoyer la déclaration
                <ChevronRight className="h-4 w-4" aria-hidden />
              </>
            )}
          </button>
          {!backendSubmissionEnabled ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-950/30 px-3 py-1.5 text-xs font-semibold text-amber-200">
              <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Module non actif
            </span>
          ) : null}
        </div>
      </div>
    </DashboardPanel>
  );
}
