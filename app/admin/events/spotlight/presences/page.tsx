"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface EventPresence {
  twitchLogin: string;
  present: boolean;
}

interface SpotlightEvent {
  id: string;
  title: string;
  date: string;
  category: string;
  presences?: EventPresence[];
  registrations?: Array<{ id: string }>;
}

export default function SpotlightPresencesPage() {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [events, setEvents] = useState<SpotlightEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;
    void loadMonthData(selectedMonth);
  }, [selectedMonth]);

  async function loadMonthData(month: string) {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/events/presence?month=${month}`, { cache: "no-store" });
      if (!response.ok) {
        setEvents([]);
        return;
      }
      const payload = await response.json();
      const spotlightEvents: SpotlightEvent[] = (payload.events || []).filter((event: SpotlightEvent) =>
        (event.category || "").toLowerCase().includes("spotlight")
      );
      setEvents(spotlightEvents);
    } catch (error) {
      console.error("Erreur chargement spotlight presences:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  const validatedSpotlights = useMemo(
    () => events.filter((event) => (event.presences || []).length > 0),
    [events]
  );

  const totalPresent = useMemo(
    () => validatedSpotlights.reduce((sum, event) => sum + (event.presences || []).filter((p) => p.present).length, 0),
    [validatedSpotlights]
  );

  const latestSpotlight = useMemo(() => {
    if (!validatedSpotlights.length) return null;
    return [...validatedSpotlights].sort((a, b) => +new Date(b.date) - +new Date(a.date))[0];
  }, [validatedSpotlights]);

  const monthOptions = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
  }, []);

  return (
    <div className="text-white">
      <div className="mb-8">
        <Link href="/admin/events/spotlight" className="text-gray-400 hover:text-white transition-colors mb-4 inline-block">
          ← Retour au groupe Spotlight
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">Présences validées - Spotlights</h1>
        <p className="text-gray-400">
          Source: validation des présences d&apos;événements via <code>/admin/events/presence</code>, filtré sur la catégorie Spotlight.
        </p>
      </div>

      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4 mb-6 flex flex-wrap items-center gap-3">
        <label className="text-sm text-gray-300 font-semibold">Mois:</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-[#0e0e10] border border-gray-700 rounded-lg px-3 py-2 text-white"
        >
          {monthOptions.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
        <Link href="/admin/events/spotlight/analytics" className="ml-auto text-sm text-[#9146ff] hover:text-[#7c3aed]">
          Ouvrir l&apos;analyse avancée →
        </Link>
      </div>

      {loading ? (
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 text-center text-gray-400">Chargement...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-400">Spotlights du mois</p>
              <p className="text-3xl font-bold text-white">{events.length}</p>
            </div>
            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-400">Spotlights validés</p>
              <p className="text-3xl font-bold text-[#9146ff]">{validatedSpotlights.length}</p>
            </div>
            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-400">Total présents</p>
              <p className="text-3xl font-bold text-green-400">{totalPresent}</p>
            </div>
          </div>

          {latestSpotlight ? (
            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-5 mb-6">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Dernier spotlight du mois</p>
              <p className="text-lg font-semibold text-white">{latestSpotlight.title}</p>
              <p className="text-sm text-gray-400">
                {new Date(latestSpotlight.date).toLocaleString("fr-FR")} -{" "}
                {(latestSpotlight.presences || []).filter((p) => p.present).length} présents
              </p>
            </div>
          ) : null}

          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Détail des spotlights validés</h2>
            {validatedSpotlights.length === 0 ? (
              <p className="text-gray-400">Aucune présence validée sur les événements Spotlight pour ce mois.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400">
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Événement</th>
                      <th className="text-center py-2">Inscrits</th>
                      <th className="text-center py-2">Présents</th>
                      <th className="text-center py-2">Taux</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validatedSpotlights
                      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
                      .map((event) => {
                        const registrationsCount = (event.registrations || []).length;
                        const presentCount = (event.presences || []).filter((p) => p.present).length;
                        const ratio = registrationsCount > 0 ? Math.round((presentCount / registrationsCount) * 100) : 0;
                        return (
                          <tr key={event.id} className="border-b border-gray-800">
                            <td className="py-3">{new Date(event.date).toLocaleDateString("fr-FR")}</td>
                            <td className="py-3">{event.title}</td>
                            <td className="py-3 text-center">{registrationsCount}</td>
                            <td className="py-3 text-center text-green-400 font-semibold">{presentCount}</td>
                            <td className="py-3 text-center text-[#9146ff] font-semibold">{ratio}%</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
