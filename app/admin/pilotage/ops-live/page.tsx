"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ActivityPayload = {
  activities?: Array<{
    id?: string;
    type?: string;
    action?: string;
    target?: string;
    timestamp?: string;
    rawTimestamp?: string;
  }>;
};

type TopPagesPayload = {
  rows?: Array<{
    pathname?: string;
    viewCount?: number;
    uniqueVisitorCount?: number;
    avgDurationSeconds?: number;
    lastSeenAt?: string;
  }>;
};

type LoginRealtimePayload = {
  rows?: Array<{
    id?: string;
    createdAt?: string;
    username?: string;
    eventType?: string;
    status?: string;
    ipAddress?: string;
  }>;
};

export default function PilotageOpsLivePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityPayload["activities"]>([]);
  const [topPages, setTopPages] = useState<TopPagesPayload["rows"]>([]);
  const [logins, setLogins] = useState<LoginRealtimePayload["rows"]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [activitiesRes, topPagesRes, realtimeRes] = await Promise.allSettled([
          fetch("/api/admin/control-center/activities", { cache: "no-store" }),
          fetch("/api/admin/page-activity/top?window=24h&limit=8", { cache: "no-store" }),
          fetch("/api/admin/login-logs/realtime?limit=10", { cache: "no-store" }),
        ]);

        if (!mounted) return;

        if (activitiesRes.status === "fulfilled" && activitiesRes.value.ok) {
          const payload = (await activitiesRes.value.json()) as ActivityPayload;
          setActivities(Array.isArray(payload.activities) ? payload.activities : []);
        }
        if (topPagesRes.status === "fulfilled" && topPagesRes.value.ok) {
          const payload = (await topPagesRes.value.json()) as TopPagesPayload;
          setTopPages(Array.isArray(payload.rows) ? payload.rows : []);
        }
        if (realtimeRes.status === "fulfilled" && realtimeRes.value.ok) {
          const payload = (await realtimeRes.value.json()) as LoginRealtimePayload;
          setLogins(Array.isArray(payload.rows) ? payload.rows : []);
        }
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : "Erreur de chargement");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 30000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const stats = useMemo(() => {
    const failedLogins = (logins || []).filter((row) => String(row?.status || "").toLowerCase().includes("fail")).length;
    return {
      activities: activities?.length || 0,
      topPages: topPages?.length || 0,
      logins: logins?.length || 0,
      failedLogins,
    };
  }, [activities, logins, topPages]);

  return (
    <div className="text-white space-y-6">
      <div className="rounded-2xl border border-[#2b2b36] bg-gradient-to-br from-[#191923] via-[#15151d] to-[#121218] p-6 shadow-[0_14px_34px_rgba(0,0,0,0.28)]">
        <Link href="/admin/pilotage" className="text-gray-300 hover:text-white transition-colors mb-4 inline-block">
          ← Retour au cockpit pilotage
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Exploitation temps réel</h1>
        <p className="text-gray-300">Surveillance opérationnelle live des activités, pages consultées et connexions admin.</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          Chargement partiel: {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Activités récentes</p>
          <p className="mt-2 text-3xl font-bold">{stats.activities}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Pages top 24h</p>
          <p className="mt-2 text-3xl font-bold">{stats.topPages}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Connexions récentes</p>
          <p className="mt-2 text-3xl font-bold">{stats.logins}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Échecs connexion</p>
          <p className={`mt-2 text-3xl font-bold ${stats.failedLogins > 0 ? "text-rose-300" : "text-emerald-300"}`}>{stats.failedLogins}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">Chargement du flux live...</div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="rounded-2xl border border-[#2b2b36] bg-[#14141b] p-5 xl:col-span-1">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300 mb-3">Dernières activités</h3>
          <div className="space-y-2">
            {(activities || []).slice(0, 8).map((item, index) => (
              <div key={item?.id || `activity-${index}`} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-sm font-medium">{item?.action || "Action"}</p>
                <p className="text-xs text-gray-400">{item?.target || "Cible non précisée"}</p>
                <p className="text-xs text-gray-500 mt-1">{item?.timestamp || item?.rawTimestamp || "Date inconnue"}</p>
              </div>
            ))}
            {(activities || []).length === 0 && !loading ? (
              <p className="text-sm text-gray-400">Aucune activité récente.</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-[#2b2b36] bg-[#14141b] p-5 xl:col-span-1">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300 mb-3">Pages les plus consultées</h3>
          <div className="space-y-2">
            {(topPages || []).slice(0, 8).map((row, index) => (
              <div key={`${row?.pathname || "page"}-${index}`} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-sm font-medium">{row?.pathname || "Page inconnue"}</p>
                <p className="text-xs text-gray-400">
                  Vues: {Number(row?.viewCount || 0)} · Visiteurs: {Number(row?.uniqueVisitorCount || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Dernier passage: {row?.lastSeenAt ? new Date(row.lastSeenAt).toLocaleString("fr-FR") : "N/A"}</p>
              </div>
            ))}
            {(topPages || []).length === 0 && !loading ? (
              <p className="text-sm text-gray-400">Aucune donnée de pages disponible.</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-[#2b2b36] bg-[#14141b] p-5 xl:col-span-1">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300 mb-3">Connexions admin live</h3>
          <div className="space-y-2">
            {(logins || []).slice(0, 10).map((row, index) => (
              <div key={row?.id || `login-${index}`} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-sm font-medium">{row?.username || "Admin"}</p>
                <p className="text-xs text-gray-400">
                  {row?.eventType || "event"} · {row?.status || "status"}
                </p>
                <p className="text-xs text-gray-500 mt-1">{row?.createdAt ? new Date(row.createdAt).toLocaleString("fr-FR") : "Date inconnue"}</p>
              </div>
            ))}
            {(logins || []).length === 0 && !loading ? (
              <p className="text-sm text-gray-400">Aucune connexion récente.</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

