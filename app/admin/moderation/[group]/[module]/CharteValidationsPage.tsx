 "use client";

import { useEffect, useMemo, useState } from "react";

type ValidationEntry = {
  id: string;
  validatedMemberDiscordId: string;
  validatedMemberUsername: string;
  validatedAt: string;
  charterVersion: string;
  feedback: string;
  validatedByDiscordId: string;
  validatedByUsername: string;
};

type ValidationResponse = {
  success: boolean;
  entries: ValidationEntry[];
  stats?: {
    totalValidations: number;
    uniqueValidatedMembers: number;
    feedbackCount: number;
  };
  error?: string;
};

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";
  return date.toLocaleString("fr-FR");
}

export default function CharteValidationsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<ValidationEntry[]>([]);
  const [stats, setStats] = useState<ValidationResponse["stats"]>({
    totalValidations: 0,
    uniqueValidatedMembers: 0,
    feedbackCount: 0,
  });

  useEffect(() => {
    let cancelled = false;
    const loadValidations = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/admin/moderation/staff/charte-validations", {
          cache: "no-store",
        });
        const body = (await response.json().catch(() => ({}))) as ValidationResponse;
        if (!response.ok || !body.success) {
          throw new Error(body.error || "Impossible de charger les validations.");
        }
        if (cancelled) return;
        setEntries(Array.isArray(body.entries) ? body.entries : []);
        setStats(
          body.stats || {
            totalValidations: Array.isArray(body.entries) ? body.entries.length : 0,
            uniqueValidatedMembers: new Set((body.entries || []).map((entry) => entry.validatedMemberDiscordId)).size,
            feedbackCount: (body.entries || []).filter((entry) => String(entry.feedback || "").trim().length > 0).length,
          }
        );
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Erreur inconnue.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadValidations();
    return () => {
      cancelled = true;
    };
  }, []);

  const orderedEntries = useMemo(() => {
    return [...entries].sort(
      (a, b) => new Date(b.validatedAt).getTime() - new Date(a.validatedAt).getTime()
    );
  }, [entries]);

  return (
    <div className="min-h-screen space-y-5 bg-[#0b0f1a] p-6 text-white md:p-8">
      <section className="rounded-2xl border border-[#353a50] bg-[linear-gradient(145deg,rgba(16,185,129,0.16),rgba(12,15,24,0.94)_48%,rgba(59,130,246,0.10))] p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-emerald-200">
          Admin / Modération / Info
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Charte validations</h1>
        <p className="mt-2 text-sm text-slate-200">
          Suivi des validations de charte en respectant la confidentialité des modérateurs.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-slate-700 bg-[#101523]/85 p-4">
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Modérateurs validés</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-200">{stats?.uniqueValidatedMembers || 0}</p>
        </article>
        <article className="rounded-xl border border-slate-700 bg-[#101523]/85 p-4">
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Validations totales</p>
          <p className="mt-2 text-3xl font-semibold text-sky-200">{stats?.totalValidations || 0}</p>
        </article>
        <article className="rounded-xl border border-slate-700 bg-[#101523]/85 p-4">
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Retours laissés</p>
          <p className="mt-2 text-3xl font-semibold text-indigo-200">{stats?.feedbackCount || 0}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-700 bg-[#101523]/85 p-5">
        <h2 className="text-lg font-semibold text-white">Modérateurs ayant validé la charte</h2>
        <div className="mt-4 space-y-3">
          {loading ? <p className="text-sm text-slate-300">Chargement des validations...</p> : null}
          {error ? (
            <p className="rounded-lg border border-rose-300/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {error}
            </p>
          ) : null}
          {!loading && !error && orderedEntries.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune validation enregistrée pour le moment.</p>
          ) : null}
          {!loading && !error
            ? orderedEntries.map((item) => (
                <article key={item.id} className="rounded-xl border border-slate-700 bg-[#0f1422] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-emerald-100">{item.validatedMemberUsername}</p>
                      <p className="text-xs text-slate-400">{item.charterVersion}</p>
                    </div>
                    <p className="text-xs text-slate-400">{formatDateTime(item.validatedAt)}</p>
                  </div>
                  <p className="mt-2 text-xs text-slate-300">
                    Validé par admin: {item.validatedByUsername} ({item.validatedByDiscordId})
                  </p>
                  {item.feedback.trim() ? (
                    <p className="mt-2 text-sm text-slate-200">{item.feedback}</p>
                  ) : (
                    <p className="mt-2 text-sm text-slate-400">Aucun retour écrit.</p>
                  )}
                </article>
              ))
            : null}
        </div>
      </section>
    </div>
  );
}
