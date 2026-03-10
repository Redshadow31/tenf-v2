"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ViewMode = "all" | "month";

interface SpotlightEventAnalytics {
  id: string;
  title: string;
  date: string;
  registrations: number;
  presents: number;
  monthKey: string;
}

export default function SpotlightAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<SpotlightEventAnalytics[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  useEffect(() => {
    void loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      setLoading(true);
      const registrationsRes = await fetch("/api/admin/events/registrations", { cache: "no-store" });
      if (!registrationsRes.ok) {
        setEvents([]);
        return;
      }
      const registrationsPayload = await registrationsRes.json();
      const spotlightEvents = (registrationsPayload.eventsWithRegistrations || []).filter((item: any) =>
        (item.event?.category || "").toLowerCase().includes("spotlight")
      );

      const enriched = await Promise.all(
        spotlightEvents.map(async (item: any) => {
          const presenceRes = await fetch(`/api/admin/events/presence?eventId=${item.event.id}`, { cache: "no-store" });
          const presencePayload = presenceRes.ok ? await presenceRes.json() : { presences: [] };
          const presents = (presencePayload.presences || []).filter((p: any) => p.present).length;
          const eventDate = new Date(item.event.date);
          const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, "0")}`;
          return {
            id: item.event.id,
            title: item.event.title,
            date: item.event.date,
            registrations: item.registrationCount || 0,
            presents,
            monthKey,
          } as SpotlightEventAnalytics;
        })
      );

      setEvents(enriched);
    } catch (error) {
      console.error("Erreur analytics spotlight:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  const displayedEvents = useMemo(() => {
    if (viewMode === "all") return events;
    return events.filter((event) => {
      const d = new Date(event.date);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [events, viewMode, selectedYear, selectedMonth]);

  const totals = useMemo(() => {
    const totalSpotlights = displayedEvents.length;
    const totalRegistrations = displayedEvents.reduce((sum, event) => sum + event.registrations, 0);
    const totalPresents = displayedEvents.reduce((sum, event) => sum + event.presents, 0);
    const avgPresenceRate =
      totalRegistrations > 0 ? Math.round((totalPresents / totalRegistrations) * 100) : 0;
    return { totalSpotlights, totalRegistrations, totalPresents, avgPresenceRate };
  }, [displayedEvents]);

  const monthTrend = useMemo(() => {
    const map = new Map<string, { events: number; presents: number; regs: number }>();
    events.forEach((event) => {
      const current = map.get(event.monthKey) || { events: 0, presents: 0, regs: 0 };
      current.events += 1;
      current.presents += event.presents;
      current.regs += event.registrations;
      map.set(event.monthKey, current);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, values]) => ({
        month,
        ...values,
        rate: values.regs > 0 ? Math.round((values.presents / values.regs) * 100) : 0,
      }));
  }, [events]);

  const monthNames = ["Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"];
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div className="text-white">
      <div className="mb-8">
        <Link href="/admin/events/spotlight" className="text-gray-400 hover:text-white transition-colors mb-4 inline-block">
          ← Retour au groupe Spotlight
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">Analyse Spotlight - Mois / Tout</h1>
        <p className="text-gray-400">Vue avancée dédiée à la catégorie Spotlight, plus poussée que le récap global.</p>
      </div>

      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4 mb-6 flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-400">Afficher:</span>
        <button
          onClick={() => setViewMode("all")}
          className={`px-4 py-2 rounded-lg text-sm ${viewMode === "all" ? "bg-[#9146ff] text-white" : "bg-[#0e0e10] text-gray-300 border border-gray-700"}`}
        >
          Tout
        </button>
        <button
          onClick={() => setViewMode("month")}
          className={`px-4 py-2 rounded-lg text-sm ${viewMode === "month" ? "bg-[#9146ff] text-white" : "bg-[#0e0e10] text-gray-300 border border-gray-700"}`}
        >
          Par mois
        </button>
        {viewMode === "month" ? (
          <>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-[#0e0e10] border border-gray-700 rounded-lg px-3 py-2 text-white"
            >
              {monthNames.map((month, idx) => (
                <option key={month} value={idx}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-[#0e0e10] border border-gray-700 rounded-lg px-3 py-2 text-white"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </>
        ) : null}
      </div>

      {loading ? (
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 text-center text-gray-400">Chargement...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Spotlights" value={totals.totalSpotlights} tone="text-white" />
            <StatCard label="Inscriptions" value={totals.totalRegistrations} tone="text-blue-400" />
            <StatCard label="Présences" value={totals.totalPresents} tone="text-green-400" />
            <StatCard label="Taux moyen" value={`${totals.avgPresenceRate}%`} tone="text-[#9146ff]" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Derniers spotlights</h2>
              <div className="space-y-3">
                {[...displayedEvents]
                  .sort((a, b) => +new Date(b.date) - +new Date(a.date))
                  .slice(0, 8)
                  .map((event) => {
                    const rate = event.registrations > 0 ? Math.round((event.presents / event.registrations) * 100) : 0;
                    return (
                      <div key={event.id} className="bg-[#0e0e10] border border-gray-700 rounded-lg p-3">
                        <p className="text-white font-medium">{event.title}</p>
                        <p className="text-xs text-gray-400 mb-2">{new Date(event.date).toLocaleString("fr-FR")}</p>
                        <p className="text-sm text-gray-300">
                          Présents <span className="text-green-400 font-semibold">{event.presents}</span> / Inscrits{" "}
                          <span className="text-blue-400 font-semibold">{event.registrations}</span> -{" "}
                          <span className="text-[#9146ff] font-semibold">{rate}%</span>
                        </p>
                      </div>
                    );
                  })}
                {displayedEvents.length === 0 ? <p className="text-gray-400">Aucune donnée pour cette vue.</p> : null}
              </div>
            </div>

            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Tendance mensuelle Spotlight</h2>
              <div className="space-y-3">
                {monthTrend.map((row) => (
                  <div key={row.month} className="bg-[#0e0e10] border border-gray-700 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{row.month}</p>
                      <p className="text-xs text-gray-400">{row.events} spotlights</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-gray-300">
                        {row.presents}/{row.regs}
                      </p>
                      <p className="text-[#9146ff] font-semibold">{row.rate}%</p>
                    </div>
                  </div>
                ))}
                {monthTrend.length === 0 ? <p className="text-gray-400">Aucune tendance disponible.</p> : null}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-3xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}
