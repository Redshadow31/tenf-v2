"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Crown,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import { getDiscordUser } from "@/lib/discord";

const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function formatMonthKey(key: string): string {
  const [year, month] = key.split("-");
  return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`;
}

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function AdminVipHistoriquePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [byMonth, setByMonth] = useState<Record<string, string[]>>({});
  const [monthKeys, setMonthKeys] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [memberSearch, setMemberSearch] = useState("");
  const [newLogin, setNewLogin] = useState("");
  const [membersIndex, setMembersIndex] = useState<Record<string, string>>({});

  async function loadHistory() {
    setLoading(true);
    setMessage(null);
    try {
      const [historyRes, membersRes] = await Promise.all([
        fetch("/api/admin/vip-history", { cache: "no-store" }),
        fetch("/api/admin/members", { cache: "no-store" }),
      ]);

      if (!historyRes.ok) {
        throw new Error("Erreur chargement historique VIP");
      }

      const historyData = await historyRes.json();
      const keys: string[] = historyData.monthKeys || Object.keys(historyData.byMonth || {}).sort((a: string, b: string) => b.localeCompare(a));
      const monthMap: Record<string, string[]> = historyData.byMonth || {};

      setByMonth(monthMap);
      setMonthKeys(keys);
      setSelectedMonth((prev) => {
        if (prev && keys.includes(prev)) return prev;
        return keys[0] || getCurrentMonthKey();
      });

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        const index: Record<string, string> = {};
        for (const member of membersData.members || []) {
          const login = String(member.twitchLogin || "").toLowerCase();
          if (login) {
            index[login] = member.displayName || member.nom || login;
          }
        }
        setMembersIndex(index);
      }
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erreur de chargement",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      const user = await getDiscordUser();
      if (!user) {
        window.location.href = "/auth/login?redirect=/admin/membres/vip/historique";
        return;
      }
      const roleResponse = await fetch("/api/user/role");
      const roleData = await roleResponse.json();
      if (!roleData.hasAdminAccess) {
        window.location.href = "/unauthorized";
        return;
      }
      await loadHistory();
    }
    void init();
  }, []);

  const selectedLogins = useMemo(() => {
    const logins = byMonth[selectedMonth] || [];
    const query = memberSearch.trim().toLowerCase();
    if (!query) return logins;
    return logins.filter((login) => {
      const display = membersIndex[login] || login;
      return login.includes(query) || display.toLowerCase().includes(query);
    });
  }, [byMonth, selectedMonth, memberSearch, membersIndex]);

  async function addMemberToMonth() {
    const login = newLogin.trim().toLowerCase();
    if (!login || !selectedMonth) return;

    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/vip-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, month: selectedMonth }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Erreur lors de l'ajout");
      }
      setNewLogin("");
      setMessage({ type: "success", text: `${login} ajouté pour ${formatMonthKey(selectedMonth)}` });
      await loadHistory();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erreur lors de l'ajout",
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeMemberFromMonth(login: string) {
    if (!confirm(`Retirer ${membersIndex[login] || login} du mois ${formatMonthKey(selectedMonth)} ?`)) {
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/vip-history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, month: selectedMonth }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Erreur lors de la suppression");
      }
      setMessage({ type: "success", text: `${login} retiré de ${formatMonthKey(selectedMonth)}` });
      await loadHistory();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erreur lors de la suppression",
      });
    } finally {
      setSaving(false);
    }
  }

  const totalMonths = monthKeys.length;
  const totalEntries = monthKeys.reduce((sum, key) => sum + (byMonth[key]?.length || 0), 0);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/membres/vip"
            className="mb-2 inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour gestion VIP
          </Link>
          <h1 className="text-3xl font-bold text-white">Historique VIP</h1>
          <p className="mt-1 text-sm text-slate-400">
            Consultation et gestion des VIP enregistrés mois par mois (JSON, Supabase, snapshots).
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadHistory()}
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-100 hover:bg-indigo-500/20"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {message ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
              : "border-rose-400/30 bg-rose-500/10 text-rose-200"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-wide text-slate-400">Mois renseignés</p>
          <p className="mt-2 text-3xl font-semibold text-amber-200">{totalMonths}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-wide text-slate-400">Entrées totales</p>
          <p className="mt-2 text-3xl font-semibold text-yellow-200">{totalEntries}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-wide text-slate-400">Mois sélectionné</p>
          <p className="mt-2 text-xl font-semibold text-white">
            {selectedMonth ? formatMonthKey(selectedMonth) : "—"}
          </p>
        </article>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <aside className={`${sectionCardClass} p-4`}>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <Calendar className="h-4 w-4 text-amber-400" />
            Mois
          </div>
          <div className="max-h-[560px] space-y-1 overflow-y-auto">
            {monthKeys.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">Aucun historique</p>
            ) : (
              monthKeys.map((month) => (
                <button
                  key={month}
                  type="button"
                  onClick={() => setSelectedMonth(month)}
                  className={`w-full rounded-lg px-3 py-2.5 text-left transition ${
                    selectedMonth === month
                      ? "bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/30"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <div className="font-medium">{formatMonthKey(month)}</div>
                  <div className="text-xs text-slate-500">{byMonth[month]?.length || 0} VIP</div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className={`${sectionCardClass} p-4 md:p-5`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">
              {selectedMonth ? `VIP — ${formatMonthKey(selectedMonth)}` : "Sélectionne un mois"}
            </h2>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Filtrer un pseudo…"
                className="rounded-lg border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-amber-400/20 bg-amber-500/5 p-4">
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-amber-200/80">
                Ajouter un membre au mois
              </label>
              <input
                type="text"
                value={newLogin}
                onChange={(e) => setNewLogin(e.target.value)}
                placeholder="Pseudo Twitch"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              />
            </div>
            <button
              type="button"
              onClick={() => void addMemberToMonth()}
              disabled={saving || !newLogin.trim() || !selectedMonth}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-400/35 bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/30 disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" />
              Ajouter
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-sm">
              <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Membre</th>
                  <th className="px-4 py-3">Login</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedLogins.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                      Aucun VIP pour ce mois.
                    </td>
                  </tr>
                ) : (
                  selectedLogins.map((login) => (
                    <tr key={login} className="border-t border-white/[0.05]">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2 font-medium text-amber-100">
                          <Crown className="h-4 w-4 text-amber-400" />
                          {membersIndex[login] || login}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{login}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/membres/fiche/${encodeURIComponent(login)}?tab=vipParcours`}
                            className="inline-flex items-center gap-1 rounded-lg border border-indigo-400/30 px-2.5 py-1 text-xs text-indigo-200 hover:bg-indigo-500/10"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Parcours
                          </Link>
                          <button
                            type="button"
                            onClick={() => void removeMemberFromMonth(login)}
                            disabled={saving}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-400/30 px-2.5 py-1 text-xs text-rose-200 hover:bg-rose-500/10 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Retirer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
