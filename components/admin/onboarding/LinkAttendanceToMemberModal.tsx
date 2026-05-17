"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Search, UserRound, X } from "lucide-react";
import type { ActivationCandidateRow } from "@/components/admin/OnboardingActivationHubView";

type SearchMember = {
  twitchLogin: string;
  displayName?: string;
  discordUsername?: string;
  role?: string;
  isActive?: boolean;
  avatar?: string;
};

type Props = {
  candidate: ActivationCandidateRow | null;
  open: boolean;
  onClose: () => void;
  onLinked: () => void;
};

const panelClass =
  "rounded-2xl border border-white/[0.08] bg-zinc-950 shadow-xl shadow-black/40 ring-1 ring-inset ring-white/[0.06]";
const inputClass =
  "w-full rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-violet-400/40 focus:outline-none focus:ring-2 focus:ring-violet-400/30";

export function LinkAttendanceToMemberModal({ candidate, open, onClose, onLinked }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchMember[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SearchMember | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setResults([]);
    setSelected(null);
    setError(null);
    setSubmitting(false);
  }, [open, candidate?.twitchLogin]);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const params = new URLSearchParams({
        q: trimmed,
        includeInactive: "true",
        includeCommunity: "true",
      });
      const response = await fetch(`/api/admin/members/search?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Recherche impossible (HTTP ${response.status})`);
      const payload = await response.json();
      setResults(Array.isArray(payload.members) ? payload.members : []);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Erreur de recherche");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(() => {
      void runSearch(query);
    }, 280);
    return () => window.clearTimeout(handle);
  }, [open, query, runSearch]);

  async function handleConfirm() {
    if (!candidate || !selected?.twitchLogin) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/integrations/attendance-correlation/link-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceTwitchLogin: candidate.twitchLogin,
          targetMemberTwitchLogin: selected.twitchLogin,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Rattachement échoué");
      }
      onLinked();
      onClose();
    } catch (linkError) {
      setError(linkError instanceof Error ? linkError.message : "Erreur de rattachement");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open || !candidate) return null;

  const label =
    candidate.displayName || candidate.discordUsername || `@${candidate.twitchLogin}`;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="link-attendance-modal-title"
      onClick={onClose}
    >
      <div className={`${panelClass} w-full max-w-lg p-5`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="link-attendance-modal-title" className="text-lg font-semibold text-white">
              Rattacher à un membre
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Présences enregistrées sous{" "}
              <span className="font-medium text-rose-200">@{candidate.twitchLogin}</span>
              {label !== `@${candidate.twitchLogin}` && label !== candidate.twitchLogin ? (
                <>
                  {" "}
                  (<span className="text-zinc-300">{label}</span>)
                </>
              ) : null}
              .
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="relative mt-4">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom, pseudo Twitch ou Discord…"
            className={`${inputClass} pl-9`}
            autoFocus
          />
        </div>

        {error ? (
          <p
            className="mt-3 rounded-lg border border-rose-400/30 bg-rose-950/25 px-3 py-2 text-sm text-rose-100"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <ul className="mt-3 max-h-56 space-y-1 overflow-y-auto">
          {searching ? (
            <li className="flex items-center gap-2 px-2 py-3 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Recherche…
            </li>
          ) : query.trim().length < 2 ? (
            <li className="px-2 py-3 text-sm text-zinc-500">Saisissez au moins 2 caractères.</li>
          ) : results.length === 0 ? (
            <li className="px-2 py-3 text-sm text-zinc-500">Aucun membre trouvé.</li>
          ) : (
            results.map((member) => {
              const login = member.twitchLogin;
              const isSelected = selected?.twitchLogin === login;
              return (
                <li key={login}>
                  <button
                    type="button"
                    onClick={() => setSelected(member)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition ${
                      isSelected
                        ? "border-violet-400/40 bg-violet-500/15 text-violet-50"
                        : "border-transparent bg-zinc-900/50 text-zinc-200 hover:border-white/10 hover:bg-zinc-800/80"
                    }`}
                  >
                    {member.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.avatar}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
                        <UserRound className="h-4 w-4" aria-hidden />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {member.displayName || member.discordUsername || login}
                      </span>
                      <span className="block truncate text-xs text-zinc-500">
                        @{login}
                        {member.role ? ` · ${member.role}` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!selected || submitting}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-400/35 bg-violet-600/25 px-4 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-600/35 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Rattacher
          </button>
        </div>
      </div>
    </div>
  );
}
