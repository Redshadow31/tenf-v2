"use client";

import { RefreshCw } from "lucide-react";
import type { GestionCopyModel } from "@/lib/admin/members-gestion/gestionCopyModel";
import type { DiscordVerifyResult } from "@/lib/admin/members-gestion/types";
import GestionModalShell, {
  gestionModalPrimaryBtnClass,
} from "@/components/admin/members-gestion/GestionModalShell";

type Props = {
  open: boolean;
  onClose: () => void;
  copy: GestionCopyModel["modals"]["verifyDiscord"];
  accentHex?: string;
  loading: boolean;
  error: string;
  info: string;
  rows: DiscordVerifyResult[];
  updatedRows: DiscordVerifyResult[];
  onLaunch: () => void;
};

export default function VerifyDiscordNamesModal({
  open,
  onClose,
  copy,
  accentHex = "#8b5cf6",
  loading,
  error,
  info,
  rows,
  updatedRows,
  onLaunch,
}: Props) {
  return (
    <GestionModalShell
      open={open}
      onClose={onClose}
      title={copy.title}
      subtitle={copy.subtitle}
      size="full"
      accentHex={accentHex}
      disableClose={loading}
      ariaLabelledBy="verify-discord-modal-title"
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={gestionModalPrimaryBtnClass}
          >
            {copy.cancel}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-4">
          <button
            type="button"
            onClick={onLaunch}
            disabled={loading}
            className={`${gestionModalPrimaryBtnClass} inline-flex items-center gap-2`}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
            {loading ? copy.launchLoading : copy.launch}
          </button>
          <span className="text-xs text-zinc-500">{copy.batchHint}</span>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">{error}</div>
        ) : null}
        {info ? (
          <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/25 px-3 py-2 text-sm text-emerald-200">{info}</div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200">
            {copy.statsLoaded}: <strong className="tabular-nums">{rows.length}</strong>
          </div>
          <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {copy.statsUpdated}: <strong className="tabular-nums">{updatedRows.length}</strong>
          </div>
          <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            {copy.statsOther}: <strong className="tabular-nums">{Math.max(0, rows.length - updatedRows.length)}</strong>
          </div>
        </div>

        {updatedRows.length > 0 ? (
          <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-3">
            <p className="mb-2 text-sm font-semibold text-emerald-200">{copy.updatedSection}</p>
            <div className="space-y-2">
              {updatedRows.map((row) => (
                <div key={`updated-${row.twitchLogin}`} className="text-xs text-emerald-100">
                  <span className="font-semibold">{row.displayName}</span> ({row.twitchLogin}) • ID: {row.discordId} •{" "}
                  {row.storedDiscordUsername || "vide"} → {row.fetchedDiscordUsername || "introuvable"}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-3">
          <p className="mb-2 text-sm font-semibold text-zinc-200">{copy.detailSection}</p>
          {rows.length === 0 ? (
            <p className="text-xs text-zinc-500">{copy.detailEmpty}</p>
          ) : (
            <div className="max-h-[40vh] space-y-2 overflow-y-auto">
              {rows.map((row) => (
                <div
                  key={`${row.twitchLogin}-${row.discordId}`}
                  className="rounded-lg border border-white/[0.08] bg-zinc-950/60 p-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-white">
                      {row.displayName} <span className="text-zinc-500">({row.twitchLogin})</span>
                    </p>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-zinc-400">
                      {row.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    ID Discord: {row.discordId} • Base: {row.storedDiscordUsername || "vide"} • Discord:{" "}
                    {row.fetchedDiscordUsername || "introuvable"}
                    {row.error ? ` • ${row.error}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </GestionModalShell>
  );
}
