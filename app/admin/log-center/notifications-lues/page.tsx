"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import { Loader2, RefreshCw } from "lucide-react";

interface NotificationReadLog {
  id: string;
  readAt: string;
  memberDiscordId: string;
  memberDisplayName: string;
  memberTwitchLogin: string | null;
  notificationId: string;
  notificationType: string | null;
  notificationTitle: string;
  notificationMessage: string;
  notificationLink: string | null;
  notificationUpdatedAt: string | null;
}

export default function NotificationReadsLogPage() {
  const [logs, setLogs] = useState<NotificationReadLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const LIMIT = 50;

  const loadLogs = useCallback(
    async (nextPage: number, reset: boolean) => {
      try {
        if (reset) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }
        setError(null);

        const params = new URLSearchParams();
        params.set("limit", String(LIMIT));
        params.set("offset", String(nextPage * LIMIT));

        const response = await fetch(`/api/admin/logs/notification-reads?${params.toString()}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Impossible de charger les logs de notifications lues");
        }

        const data = await response.json();
        const newLogs = Array.isArray(data?.logs) ? data.logs : [];
        setLogs((prev) => (reset ? newLogs : [...prev, ...newLogs]));
        setHasMore(Boolean(data?.hasMore));
      } catch (err) {
        console.error("[admin/log-center/notifications-lues] load error:", err);
        setError("Erreur lors du chargement des logs");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadLogs(0, true);
  }, [loadLogs]);

  const handleRefresh = async () => {
    setPage(0);
    await loadLogs(0, true);
  };

  const handleLoadMore = async () => {
    const next = page + 1;
    setPage(next);
    await loadLogs(next, false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <AdminHeader
        title="Logs notifications lues"
        navLinks={[
          { href: "/admin/log-center", label: "Log Center" },
          { href: "/admin/log-center/notifications-lues", label: "Notifications lues", active: true },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
              Historique des notifications lues
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
              Centralisation des lectures de notifications par les membres ayant accès admin.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {refreshing || loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Actualiser
          </button>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border p-4 text-sm" style={{ borderColor: "#dc2626", color: "#fca5a5" }}>
            {error}
          </div>
        ) : null}

        <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin" style={{ color: "var(--color-primary)" }} />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-10 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Aucun log de lecture pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                      Lu le
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                      Membre
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                      Notification
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b" style={{ borderColor: "var(--color-border)" }}>
                      <td className="py-3 px-4 text-sm" style={{ color: "var(--color-text)" }}>
                        {new Date(log.readAt).toLocaleString("fr-FR")}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                          {log.memberDisplayName}
                        </p>
                        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                          {log.memberDiscordId}
                          {log.memberTwitchLogin ? ` - ${log.memberTwitchLogin}` : ""}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                          {log.notificationTitle}
                        </p>
                        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                          {log.notificationMessage}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        {log.notificationLink ? (
                          <Link
                            href={log.notificationLink}
                            className="inline-flex rounded-md px-3 py-1.5 text-xs font-medium text-white"
                            style={{ backgroundColor: "var(--color-primary)" }}
                          >
                            Ouvrir
                          </Link>
                        ) : (
                          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            -
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {hasMore ? (
          <div className="pt-4 text-center">
            <button
              onClick={handleLoadMore}
              disabled={refreshing}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {refreshing ? "Chargement..." : "Charger plus"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
