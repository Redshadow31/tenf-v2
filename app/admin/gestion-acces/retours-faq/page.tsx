"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type FaqContactStatus = "new" | "in_progress" | "resolved" | "archived";

type FaqContactMessage = {
  id: string;
  createdAt: string;
  updatedAt: string;
  sourcePage: string;
  pseudo: string;
  contact: string;
  topic: string;
  message: string;
  status: FaqContactStatus;
  adminNote?: string;
  handledBy?: string;
  handledAt?: string;
};

type Stats = {
  total: number;
  new: number;
  inProgress: number;
  resolved: number;
  archived: number;
};

const EMPTY_STATS: Stats = { total: 0, new: 0, inProgress: 0, resolved: 0, archived: 0 };

const topicLabel: Record<string, string> = {
  integration: "Integration",
  roles: "Roles",
  points: "Points",
  activite: "Activite",
  staff: "Staff",
  autre: "Autre",
};

export default function AdminFaqFeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [messages, setMessages] = useState<FaqContactMessage[]>([]);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [statusFilter, setStatusFilter] = useState<"all" | FaqContactStatus>("all");
  const [feedback, setFeedback] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/rejoindre/faq-contact", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Erreur chargement");
      }
      setMessages(Array.isArray(data?.messages) ? data.messages : []);
      setStats(data?.stats || EMPTY_STATS);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Erreur chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return messages;
    return messages.filter((m) => m.status === statusFilter);
  }, [messages, statusFilter]);

  async function saveStatus(id: string, status: FaqContactStatus, adminNote?: string) {
    try {
      setSavingId(id);
      setFeedback("");
      const response = await fetch("/api/admin/rejoindre/faq-contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, adminNote }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Erreur mise a jour");
      }
      await load();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Erreur mise a jour");
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#141824] p-6 text-white">
        Chargement des retours FAQ...
      </div>
    );
  }

  return (
    <div className="space-y-5 text-white">
      <section className="rounded-2xl border border-white/10 bg-[#141824] p-6">
        <h1 className="text-2xl font-semibold">Retours FAQ Rejoindre</h1>
        <p className="mt-1 text-sm text-gray-300">
          Messages recus depuis le bouton de contact de la page publique `rejoindre/faq`.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Nouveaux" value={stats.new} highlight="violet" />
        <StatCard label="En cours" value={stats.inProgress} highlight="amber" />
        <StatCard label="Resolus" value={stats.resolved} highlight="green" />
        <StatCard label="Archives" value={stats.archived} />
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#141824] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs uppercase tracking-[0.09em] text-gray-300">Filtre statut</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | FaqContactStatus)}
            className="rounded-lg border border-white/10 bg-[#0f1220] px-3 py-2 text-sm text-white"
          >
            <option value="all">Tous</option>
            <option value="new">Nouveaux</option>
            <option value="in_progress">En cours</option>
            <option value="resolved">Resolus</option>
            <option value="archived">Archives</option>
          </select>
        </div>
      </section>

      {feedback ? (
        <section className="rounded-xl border border-rose-400/25 bg-rose-500/10 p-3 text-sm text-rose-200">{feedback}</section>
      ) : null}

      <section className="space-y-3">
        {filtered.length === 0 ? (
          <article className="rounded-2xl border border-white/10 bg-[#141824] p-4 text-sm text-gray-300">
            Aucun retour dans ce filtre.
          </article>
        ) : (
          filtered.map((item) => (
            <FaqMessageCard
              key={item.id}
              item={item}
              saving={savingId === item.id}
              onSave={saveStatus}
            />
          ))
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: "violet" | "amber" | "green";
}) {
  const className =
    highlight === "violet"
      ? "border-[#7a3cff]/35 bg-[#7a3cff]/10"
      : highlight === "amber"
      ? "border-amber-400/35 bg-amber-500/10"
      : highlight === "green"
      ? "border-emerald-400/35 bg-emerald-500/10"
      : "border-white/10 bg-[#141824]";

  return (
    <article className={`rounded-xl border p-4 ${className}`}>
      <p className="text-xs uppercase tracking-[0.09em] text-gray-300">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </article>
  );
}

function statusBadgeClass(status: FaqContactStatus): string {
  if (status === "new") return "border-[#7a3cff]/35 bg-[#7a3cff]/10 text-[#d8b4ff]";
  if (status === "in_progress") return "border-amber-400/35 bg-amber-500/10 text-amber-200";
  if (status === "resolved") return "border-emerald-400/35 bg-emerald-500/10 text-emerald-200";
  return "border-white/15 bg-white/[0.05] text-gray-200";
}

function statusLabel(status: FaqContactStatus): string {
  if (status === "new") return "Nouveau";
  if (status === "in_progress") return "En cours";
  if (status === "resolved") return "Resolu";
  return "Archive";
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR");
}

function FaqMessageCard({
  item,
  saving,
  onSave,
}: {
  item: FaqContactMessage;
  saving: boolean;
  onSave: (id: string, status: FaqContactStatus, adminNote?: string) => Promise<void>;
}) {
  const [note, setNote] = useState(item.adminNote || "");
  const [status, setStatus] = useState<FaqContactStatus>(item.status);

  return (
    <article className="rounded-2xl border border-white/10 bg-[#141824] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">{item.pseudo}</p>
          <p className="text-xs text-gray-300">{item.contact}</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.09em] text-gray-400">
            {topicLabel[item.topic] || item.topic} - {formatDate(item.createdAt)}
          </p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${statusBadgeClass(item.status)}`}>
          {statusLabel(item.status)}
        </span>
      </div>

      <p className="mt-3 whitespace-pre-wrap rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-gray-200">
        {item.message}
      </p>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[180px_1fr_auto]">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as FaqContactStatus)}
          className="rounded-lg border border-white/10 bg-[#0f1220] px-3 py-2 text-sm text-white"
        >
          <option value="new">Nouveau</option>
          <option value="in_progress">En cours</option>
          <option value="resolved">Resolu</option>
          <option value="archived">Archive</option>
        </select>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note admin (optionnel)"
          className="rounded-lg border border-white/10 bg-[#0f1220] px-3 py-2 text-sm text-white"
        />

        <button
          type="button"
          onClick={() => onSave(item.id, status, note)}
          disabled={saving}
          className="rounded-lg bg-gradient-to-r from-[#7a3cff] to-[#e12b5b] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>

      {item.handledBy ? (
        <p className="mt-2 text-xs text-gray-400">
          Derniere action par {item.handledBy}
          {item.handledAt ? ` - ${formatDate(item.handledAt)}` : ""}
        </p>
      ) : null}
    </article>
  );
}

