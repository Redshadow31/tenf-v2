"use client";

import { Check, Loader2, Search, UserCircle2, X } from "lucide-react";
import { useMemo } from "react";

export type EventResponsibleMember = {
  twitchLogin: string;
  displayName: string;
  discordId?: string;
  discordUsername?: string;
  isActive?: boolean;
};

type EventResponsiblePickerProps = {
  selected: {
    displayName: string;
    twitchLogin?: string;
    discordId?: string;
  } | null;
  search: string;
  onSearchChange: (value: string) => void;
  results: EventResponsibleMember[];
  loading: boolean;
  onPick: (member: EventResponsibleMember) => void;
  onClear: () => void;
  /** Spotlight : login Twitch valide saisi mais absent de la base membres */
  manualTwitchLogin?: string | null;
  onPickManual?: () => void;
  showManualButton?: boolean;
  showSpellHint?: boolean;
  hint?: string;
  required?: boolean;
};

const inputClass =
  "w-full rounded-xl border border-[#353a50] bg-[#0f1424] pl-10 pr-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-300/45 focus:ring-2 focus:ring-indigo-400/20";

export default function EventResponsiblePicker({
  selected,
  search,
  onSearchChange,
  results,
  loading,
  onPick,
  onClear,
  manualTwitchLogin,
  onPickManual,
  showManualButton,
  showSpellHint,
  hint,
  required = true,
}: EventResponsiblePickerProps) {
  const inactiveCount = useMemo(() => results.filter((m) => m.isActive === false).length, [results]);

  return (
    <section className="rounded-2xl border border-indigo-400/35 bg-gradient-to-br from-indigo-500/15 via-[#10172a]/90 to-[#0a0e18]/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-indigo-200/90">
            <UserCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            Responsable de l&apos;événement {required ? "*" : ""}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            {hint ||
              "Recherche rapide parmi les membres TENF (pseudo Twitch, display name ou Discord). Cette personne apparaît sur le calendrier staff."}
          </p>
        </div>
        {selected ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-100">
            <Check className="h-3 w-3" aria-hidden />
            Assigné
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
            À choisir
          </span>
        )}
      </div>

      {selected ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-indigo-300/30 bg-[#0f1424]/90 px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{selected.displayName}</p>
            <p className="mt-0.5 truncate text-xs text-slate-400">
              {selected.twitchLogin ? `@${selected.twitchLogin}` : null}
              {selected.twitchLogin && selected.discordId ? " · " : null}
              {selected.discordId ? `Discord ${selected.discordId}` : null}
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-600/50 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Changer
          </button>
        </div>
      ) : null}

      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={inputClass}
          placeholder="Rechercher un membre… (min. 2 caractères)"
          autoComplete="off"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-indigo-300" aria-hidden />
        ) : null}
      </div>

      {search.trim().length > 0 && search.trim().length < 2 ? (
        <p className="mt-2 text-xs text-slate-500">Saisissez au moins 2 caractères pour lancer la recherche.</p>
      ) : null}

      {loading ? <p className="mt-2 text-xs text-slate-400">Recherche en cours…</p> : null}

      {!loading && search.trim().length >= 2 && results.length === 0 && !selected ? (
        <p className="mt-2 text-xs text-slate-400">Aucun membre ne correspond à cette recherche.</p>
      ) : null}

      {results.length > 0 ? (
        <div className="mt-2 max-h-52 space-y-1.5 overflow-y-auto rounded-xl border border-[#353a50]/80 bg-[#0a0e18]/60 p-1.5">
          {inactiveCount > 0 ? (
            <p className="px-2 py-1 text-[10px] text-amber-200/90">
              {inactiveCount} membre{inactiveCount > 1 ? "s" : ""} inactif{inactiveCount > 1 ? "s" : ""} — vérifiez avant de valider.
            </p>
          ) : null}
          {results.map((member) => (
            <button
              key={`${member.twitchLogin}-${member.discordId || "na"}`}
              type="button"
              onClick={() => onPick(member)}
              className="flex w-full items-center gap-3 rounded-lg border border-transparent px-2.5 py-2 text-left transition hover:border-indigo-300/40 hover:bg-indigo-500/10"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 text-sm font-bold text-white">
                {(member.displayName || member.twitchLogin || "?").charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium text-white">{member.displayName}</span>
                  {member.isActive === false ? (
                    <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-200">
                      Inactif
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block truncate text-xs text-slate-400">
                  @{member.twitchLogin}
                  {member.discordUsername ? ` · ${member.discordUsername}` : ""}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {showManualButton && manualTwitchLogin && onPickManual ? (
        <div className="mt-2 rounded-lg border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
          <p>
            Aucun membre TENF ne correspond exactement. Pour une chaîne invitée ou hors base, vous pouvez l&apos;associer
            manuellement au login Twitch.
          </p>
          <button
            type="button"
            onClick={onPickManual}
            className="mt-2 rounded-md border border-amber-200/40 bg-amber-200/10 px-2.5 py-1 text-xs font-medium text-amber-50 hover:bg-amber-200/20"
          >
            Utiliser @{manualTwitchLogin} comme responsable
          </button>
        </div>
      ) : null}

      {showSpellHint ? (
        <div className="mt-2 rounded-lg border border-slate-600/40 bg-slate-800/50 px-3 py-2 text-xs text-slate-300">
          Vérifiez l&apos;orthographe du login Twitch (4 à 25 caractères) ou ajoutez la fiche membre dans l&apos;admin.
        </div>
      ) : null}
    </section>
  );
}

