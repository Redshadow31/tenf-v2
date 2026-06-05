"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AdminConfirmModal from "@/components/admin/AdminConfirmModal";
import type { RgpdDataSection, RgpdExportBundle, RgpdSearchHit } from "@/lib/admin/rgpd/memberRgpdService";

const CONFIRM_PHRASE = "SUPPRIMER RGPD";

type Props = {
  canErase: boolean;
};

export default function RgpdMemberWorkspace({ canErase }: Props) {
  const { data: session } = useSession();
  const isFounder = session?.user?.role === "FONDATEUR" || canErase;

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<RgpdSearchHit[]>([]);
  const [selected, setSelected] = useState<RgpdSearchHit | null>(null);
  const [bundle, setBundle] = useState<RgpdExportBundle | null>(null);
  const [loadingBundle, setLoadingBundle] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "error" | "success" | "info"; text: string } | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const [eraseOpen, setEraseOpen] = useState(false);
  const [eraseReason, setEraseReason] = useState("");
  const [erasePhrase, setErasePhrase] = useState("");
  const [erasing, setErasing] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    try {
      setSearching(true);
      setFeedback(null);
      const res = await fetch(`/api/admin/rgpd/search?q=${encodeURIComponent(trimmed)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Recherche impossible");
      setResults(Array.isArray(data?.results) ? data.results : []);
    } catch (err) {
      setResults([]);
      setFeedback({ tone: "error", text: err instanceof Error ? err.message : "Erreur recherche" });
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => void runSearch(query), 280);
    return () => window.clearTimeout(id);
  }, [query, runSearch]);

  const loadBundle = useCallback(async (hit: RgpdSearchHit) => {
    try {
      setLoadingBundle(true);
      setFeedback(null);
      setSelected(hit);
      setExpandedSection(null);
      const res = await fetch(
        `/api/admin/rgpd/export?twitchLogin=${encodeURIComponent(hit.twitchLogin)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Export impossible");
      setBundle(data?.bundle || null);
    } catch (err) {
      setBundle(null);
      setFeedback({ tone: "error", text: err instanceof Error ? err.message : "Erreur export" });
    } finally {
      setLoadingBundle(false);
    }
  }, []);

  const downloadJson = useCallback(() => {
    if (!selected) return;
    window.open(
      `/api/admin/rgpd/export?twitchLogin=${encodeURIComponent(selected.twitchLogin)}&download=1`,
      "_blank"
    );
  }, [selected]);

  async function confirmErase() {
    if (!selected || !isFounder) return;
    if (eraseReason.trim().length < 10) {
      setFeedback({ tone: "error", text: "Motif obligatoire (10 caractères minimum)." });
      return;
    }
    if (erasePhrase.trim() !== CONFIRM_PHRASE) {
      setFeedback({ tone: "error", text: `Saisissez exactement « ${CONFIRM_PHRASE} ».` });
      return;
    }

    try {
      setErasing(true);
      setFeedback(null);
      const res = await fetch("/api/admin/rgpd/erase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twitchLogin: selected.twitchLogin,
          reason: eraseReason.trim(),
          confirmPhrase: erasePhrase.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Suppression impossible");

      const deletedCount = (data?.result?.deleted || []).reduce(
        (acc: number, row: { count?: number }) => acc + (row.count || 0),
        0
      );
      setEraseOpen(false);
      setEraseReason("");
      setErasePhrase("");
      setBundle(null);
      setSelected(null);
      setResults((prev) => prev.filter((r) => r.twitchLogin !== data?.result?.twitchLogin));
      setFeedback({
        tone: "success",
        text: `Données effacées pour ${data?.result?.twitchLogin} (${deletedCount} enregistrement(s)). Action journalisée.`,
      });
    } catch (err) {
      setFeedback({ tone: "error", text: err instanceof Error ? err.message : "Erreur suppression" });
    } finally {
      setErasing(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/10 bg-[#141824] p-6">
        <h2 className="text-lg font-semibold text-white">Droit d&apos;accès & effacement (RGPD)</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-300">
          Recherchez un membre par pseudo Twitch, login, ID Discord ou e-mail staff. Exportez l&apos;ensemble des
          données personnelles détenues par TENF, ou procédez à l&apos;effacement sur demande explicite du titulaire.
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-gray-400">
          <li>Export JSON : droit d&apos;accès (portabilité).</li>
          <li>Suppression irréversible : réservée aux fondateurs, avec motif et phrase de confirmation.</li>
          <li>Chaque action est tracée dans l&apos;audit admin.</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#141824] p-4">
        <label className="text-xs font-semibold uppercase tracking-[0.09em] text-gray-300">
          Rechercher un utilisateur
        </label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pseudo, login Twitch, ID Discord, e-mail staff…"
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1220] px-4 py-3 text-sm text-white placeholder:text-gray-500"
        />
        {searching ? <p className="mt-2 text-xs text-gray-400">Recherche…</p> : null}
      </section>

      {feedback ? (
        <section
          className={`rounded-xl border p-3 text-sm ${
            feedback.tone === "error"
              ? "border-rose-400/25 bg-rose-500/10 text-rose-200"
              : feedback.tone === "success"
              ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
              : "border-violet-400/25 bg-violet-500/10 text-violet-200"
          }`}
        >
          {feedback.text}
        </section>
      ) : null}

      {results.length > 0 ? (
        <section className="space-y-2">
          <p className="text-xs uppercase tracking-[0.09em] text-gray-400">{results.length} résultat(s)</p>
          {results.map((hit) => (
            <button
              key={hit.twitchLogin}
              type="button"
              onClick={() => void loadBundle(hit)}
              className={`w-full rounded-xl border p-4 text-left transition hover:border-violet-400/40 ${
                selected?.twitchLogin === hit.twitchLogin
                  ? "border-violet-400/50 bg-violet-500/10"
                  : "border-white/10 bg-[#141824]"
              }`}
            >
              <p className="font-semibold text-white">{hit.displayName}</p>
              <p className="mt-1 text-xs text-gray-300">
                @{hit.twitchLogin}
                {hit.discordId ? ` · Discord ${hit.discordId}` : ""}
                {hit.role ? ` · ${hit.role}` : ""}
                {hit.isActive === false ? " · Inactif" : ""}
              </p>
            </button>
          ))}
        </section>
      ) : query.trim().length >= 2 && !searching ? (
        <p className="text-sm text-gray-400">Aucun membre trouvé.</p>
      ) : null}

      {selected ? (
        <section className="rounded-2xl border border-white/10 bg-[#141824] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-white">{selected.displayName}</h3>
              <p className="text-sm text-gray-300">@{selected.twitchLogin}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadJson}
                disabled={loadingBundle || !bundle}
                className="rounded-lg border border-violet-400/40 bg-violet-500/15 px-4 py-2 text-sm font-semibold text-violet-100 disabled:opacity-50"
              >
                Télécharger JSON
              </button>
              {isFounder ? (
                <button
                  type="button"
                  onClick={() => {
                    setEraseOpen(true);
                    setEraseReason("");
                    setErasePhrase("");
                  }}
                  disabled={loadingBundle}
                  className="rounded-lg border border-rose-400/40 bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-100 disabled:opacity-50"
                >
                  Effacer les données
                </button>
              ) : (
                <span className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-400">
                  Effacement : fondateurs uniquement
                </span>
              )}
            </div>
          </div>

          {loadingBundle ? (
            <p className="mt-4 text-sm text-gray-400">Chargement des données…</p>
          ) : bundle ? (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Sections avec données" value={bundle.summary.tablesWithData} />
                <Stat label="Enregistrements" value={bundle.summary.totalRecords} />
                <Stat label="Export" value={new Date(bundle.exportedAt).toLocaleString("fr-FR")} small />
                <Stat label="ID membre" value={bundle.subject.memberId || "—"} small />
              </div>

              <div className="space-y-2">
                {bundle.sections.map((section) => (
                  <SectionRow
                    key={section.id}
                    section={section}
                    expanded={expandedSection === section.id}
                    onToggle={() =>
                      setExpandedSection((prev) => (prev === section.id ? null : section.id))
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <AdminConfirmModal
        open={eraseOpen}
        tone="danger"
        title="Effacer toutes les données personnelles"
        description={
          <>
            <p>
              Action <strong className="text-rose-200">irréversible</strong> pour{" "}
              <strong className="text-white">{selected?.displayName}</strong> (@{selected?.twitchLogin}).
            </p>
            <p className="mt-2 text-zinc-400">
              Un export est sauvegardé dans l&apos;audit avant suppression. Utilisez uniquement sur demande RGPD
              documentée du membre.
            </p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-rose-200">
              Confirmation — saisir « {CONFIRM_PHRASE} »
            </label>
            <input
              value={erasePhrase}
              onChange={(e) => setErasePhrase(e.target.value)}
              disabled={erasing}
              className="mt-1.5 w-full rounded-xl border border-rose-400/30 bg-black/30 px-3 py-2 text-sm text-white"
            />
          </>
        }
        confirmLabel="Effacer définitivement"
        loading={erasing}
        disableConfirm={eraseReason.trim().length < 10 || erasePhrase.trim() !== CONFIRM_PHRASE}
        onCancel={() => !erasing && setEraseOpen(false)}
        onConfirm={() => void confirmErase()}
        input={{
          label: "Motif de la demande (obligatoire)",
          value: eraseReason,
          onChange: setEraseReason,
          multiline: true,
          required: true,
          placeholder: "Ex. : demande d'effacement reçue par ticket Discord le 04/06/2026…",
          helperText: "Minimum 10 caractères — conservé dans l'audit.",
        }}
      />
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: string | number; small?: boolean }) {
  return (
    <article className="rounded-lg border border-white/10 bg-black/20 p-3">
      <p className="text-[10px] uppercase tracking-[0.09em] text-gray-400">{label}</p>
      <p className={`mt-1 font-semibold text-white ${small ? "text-xs break-all" : "text-lg"}`}>{value}</p>
    </article>
  );
}

function SectionRow({
  section,
  expanded,
  onToggle,
}: {
  section: RgpdDataSection;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="rounded-xl border border-white/10 bg-[#0f1220]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-medium text-white">{section.label}</p>
          {section.note ? <p className="text-xs text-gray-500">{section.note}</p> : null}
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
            section.count > 0
              ? "border-violet-400/35 bg-violet-500/10 text-violet-200"
              : "border-white/10 text-gray-500"
          }`}
        >
          {section.count}
        </span>
      </button>
      {expanded && section.count > 0 ? (
        <pre className="max-h-72 overflow-auto border-t border-white/10 p-3 text-xs text-gray-300">
          {JSON.stringify(section.data, null, 2)}
        </pre>
      ) : null}
    </article>
  );
}
