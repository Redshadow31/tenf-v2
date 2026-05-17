"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, Inbox, RefreshCw, Search } from "lucide-react";
import {
  STATUS_LABELS,
  TYPE_LABELS,
  PARTNERSHIP_STATUSES,
  PARTNERSHIP_TYPES,
  type PartnershipRequest,
  type PartnershipRequestStatus,
  type PartnershipType,
} from "@/lib/partnershipRequestsStorage";
import RequestDetailDrawer from "./RequestDetailDrawer";

type FilterStatus = PartnershipRequestStatus | "all";
type FilterType = PartnershipType | "all";

const STATUS_BADGE_STYLES: Record<PartnershipRequestStatus, { bg: string; color: string }> = {
  new: { bg: "color-mix(in srgb, #2563eb 16%, transparent)", color: "#1d4ed8" },
  in_review: { bg: "color-mix(in srgb, #d97706 16%, transparent)", color: "#b45309" },
  in_meeting: { bg: "color-mix(in srgb, #7c3aed 16%, transparent)", color: "#6d28d9" },
  accepted: { bg: "color-mix(in srgb, #16a34a 16%, transparent)", color: "#15803d" },
  refused: { bg: "color-mix(in srgb, #dc2626 16%, transparent)", color: "#b91c1c" },
  archived: { bg: "color-mix(in srgb, var(--color-muted) 22%, transparent)", color: "var(--color-muted)" },
};

function formatRelativeDate(iso: string): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "à l'instant";
    if (diffMin < 60) return `il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `il y a ${diffH} h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `il y a ${diffD} j`;
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function formatFullDate(iso: string): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AdminPartnershipsClient() {
  const [items, setItems] = useState<PartnershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Debounce de la recherche pour éviter de spammer l'API
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (debouncedSearch.length > 0) params.set("search", debouncedSearch);
      const res = await fetch(`/api/admin/partnerships?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (res.status === 401) {
        setError("Accès refusé. Connecte-toi avec un compte admin ayant accès à cette section.");
        setItems([]);
        return;
      }
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        items?: PartnershipRequest[];
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || "Erreur lors du chargement des demandes.");
        setItems([]);
        return;
      }
      setItems(data.items || []);
    } catch (err) {
      console.error("[admin/partenariats] fetch error:", err);
      setError("Erreur réseau. Réessaie dans quelques instants.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, debouncedSearch]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const counts = useMemo(() => {
    const map: Record<PartnershipRequestStatus, number> = {
      new: 0,
      in_review: 0,
      in_meeting: 0,
      accepted: 0,
      refused: 0,
      archived: 0,
    };
    for (const item of items) {
      map[item.status] += 1;
    }
    return map;
  }, [items]);

  function handleStatusChanged(updated: PartnershipRequest) {
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
            Espace admin · Communauté
          </p>
          <h1 className="mt-1 text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
            Demandes de partenariat
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
            Réception, étude et suivi des demandes envoyées depuis la page publique{" "}
            <span className="font-mono">/partenariats</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchItems}
          className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors hover:opacity-80"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
        >
          <RefreshCw size={14} aria-hidden /> Rafraîchir
        </button>
      </header>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {PARTNERSHIP_STATUSES.map((status) => {
          const style = STATUS_BADGE_STYLES[status];
          return (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter((prev) => (prev === status ? "all" : status))}
              className="rounded-2xl border p-3 text-left transition-colors hover:opacity-90"
              style={{
                borderColor: statusFilter === status ? style.color : "var(--color-border)",
                backgroundColor:
                  statusFilter === status ? style.bg : "color-mix(in srgb, var(--color-card) 90%, transparent)",
              }}
            >
              <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                {STATUS_LABELS[status]}
              </p>
              <p className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
                {counts[status]}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filtres */}
      <div
        className="flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <div className="flex flex-1 items-center gap-2 rounded-xl border px-3"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
        >
          <Search size={16} aria-hidden style={{ color: "var(--color-muted)" }} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom de projet, e-mail ou Discord…"
            className="w-full bg-transparent py-2 text-sm outline-none"
            style={{ color: "var(--color-text)" }}
            aria-label="Rechercher une demande"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--color-muted)" }}>
            <Filter size={14} aria-hidden /> Statut
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className="rounded-xl border px-3 py-1.5 text-sm"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
            >
              <option value="all">Tous</option>
              {PARTNERSHIP_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--color-muted)" }}>
            Type
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as FilterType)}
              className="rounded-xl border px-3 py-1.5 text-sm"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
            >
              <option value="all">Tous</option>
              {PARTNERSHIP_TYPES.map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Tableau / cartes des demandes */}
      {error ? (
        <div
          className="rounded-2xl border p-4 text-sm"
          role="alert"
          style={{
            borderColor: "#dc2626",
            backgroundColor: "color-mix(in srgb, #dc2626 8%, transparent)",
            color: "#b91c1c",
          }}
        >
          {error}
        </div>
      ) : loading ? (
        <div
          className="rounded-2xl border p-8 text-center text-sm"
          style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
        >
          Chargement des demandes…
        </div>
      ) : items.length === 0 ? (
        <div
          className="rounded-2xl border p-10 text-center"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <Inbox className="mx-auto h-10 w-10" aria-hidden style={{ color: "var(--color-muted)" }} />
          <p className="mt-3 text-sm font-medium" style={{ color: "var(--color-text)" }}>
            Aucune demande pour le moment.
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
            Les nouvelles demandes envoyées depuis /partenariats apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="hidden overflow-hidden rounded-2xl border md:block"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "color-mix(in srgb, var(--color-card) 70%, var(--color-bg))" }}>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--color-muted)" }}>Projet</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--color-muted)" }}>Type</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--color-muted)" }}>Contact</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--color-muted)" }}>Reçue</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--color-muted)" }}>Statut</th>
                <th className="px-4 py-3 text-right font-semibold" style={{ color: "var(--color-muted)" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: "var(--color-text)" }}>{item.projectName}</p>
                    <p className="text-xs" style={{ color: "var(--color-muted)" }} title={item.projectDescription}>
                      {item.projectDescription.slice(0, 80)}{item.projectDescription.length > 80 ? "…" : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--color-text)" }}>
                    {TYPE_LABELS[item.partnershipType]}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--color-text)" }}>
                    <p>{item.contactName}</p>
                    <p style={{ color: "var(--color-muted)" }}>{item.contactEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--color-muted)" }} title={formatFullDate(item.createdAt)}>
                    {formatRelativeDate(item.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className="rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                    >
                      Voir le détail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Vue mobile en cartes */}
      {!error && !loading && items.length > 0 ? (
        <div className="grid gap-3 md:hidden">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className="rounded-2xl border p-4 text-left"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-card)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium" style={{ color: "var(--color-text)" }}>{item.projectName}</p>
                  <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                    {TYPE_LABELS[item.partnershipType]} · {formatRelativeDate(item.createdAt)}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <p className="mt-2 text-xs" style={{ color: "var(--color-text)" }}>
                {item.contactName} — {item.contactEmail}
              </p>
            </button>
          ))}
        </div>
      ) : null}

      <RequestDetailDrawer
        requestId={selectedId}
        onClose={() => setSelectedId(null)}
        onStatusChanged={handleStatusChanged}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: PartnershipRequestStatus }) {
  const style = STATUS_BADGE_STYLES[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
