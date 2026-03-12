"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface Member {
  twitchLogin: string;
  displayName: string;
}

interface ProgrammedSpotlight {
  id: string;
  streamerTwitchLogin: string;
  streamerDisplayName?: string;
  startedAt: string;
  endsAt?: string;
  status: "active" | "cancelled" | "completed";
  moderatorUsername: string;
  hasStarted: boolean;
  hasEnded: boolean;
}

export default function MembresSpotlightPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [spotlights, setSpotlights] = useState<ProgrammedSpotlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedStreamer, setSelectedStreamer] = useState<Member | null>(null);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    setDate(dateStr);
    setStartTime(now.toTimeString().slice(0, 5));

    const plus2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    setEndTime(plus2h.toTimeString().slice(0, 5));
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [membersRes, spotlightsRes] = await Promise.all([
        fetch("/api/members/public", { cache: "no-store" }),
        fetch("/api/admin/membres/spotlight", { cache: "no-store" }),
      ]);

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        const validMembers = (membersData.members || [])
          .filter((m: any) => m.twitchLogin && m.isActive !== false)
          .map((m: any) => ({
            twitchLogin: m.twitchLogin,
            displayName: m.displayName || m.twitchLogin,
          }));
        setMembers(validMembers);
      }

      if (!spotlightsRes.ok) {
        const err = await spotlightsRes.json().catch(() => ({}));
        throw new Error(err.error || "Impossible de charger les spotlights");
      }

      const spotlightData = await spotlightsRes.json();
      setSpotlights(spotlightData.spotlights || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return members.slice(0, 30);
    return members
      .filter((m) => {
        return (
          m.twitchLogin.toLowerCase().includes(query) ||
          m.displayName.toLowerCase().includes(query)
        );
      })
      .slice(0, 30);
  }, [members, search]);

  async function handleCreateSpotlight() {
    setError(null);

    if (!selectedStreamer) {
      setError("Sélectionne un streamer.");
      return;
    }

    if (!date || !startTime || !endTime) {
      setError("Renseigne la date, l'heure de début et l'heure de fin.");
      return;
    }

    const startsAt = new Date(`${date}T${startTime}`);
    const endsAt = new Date(`${date}T${endTime}`);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      setError("Date ou heure invalide.");
      return;
    }

    if (endsAt <= startsAt) {
      setError("L'heure de fin doit être après l'heure de début.");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/admin/membres/spotlight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamerTwitchLogin: selectedStreamer.twitchLogin,
          streamerDisplayName: selectedStreamer.displayName,
          startedAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erreur de création");
      }

      setSelectedStreamer(null);
      setSearch("");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de création");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: ProgrammedSpotlight["status"]) {
    try {
      setSaving(true);
      const response = await fetch("/api/admin/membres/spotlight", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Mise à jour impossible");
      }
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de mise à jour");
    } finally {
      setSaving(false);
    }
  }

  const formatDate = (value: string) => {
    const d = new Date(value);
    return d.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="text-white space-y-8">
      <div>
        <Link
          href="/admin/membres"
          className="text-gray-400 hover:text-white transition-colors inline-block mb-3"
        >
          ← Retour au hub Membres
        </Link>
        <h1 className="text-4xl font-bold mb-2">Spotlight</h1>
        <p className="text-gray-400">
          Programme une mise en avant (date + heure de début/fin) pour la page Lives.
        </p>
      </div>

      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Programmer un streamer</h2>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm text-gray-300">Streamer</label>
          {selectedStreamer ? (
            <div className="flex items-center justify-between rounded-lg border border-[#9146ff]/40 bg-[#9146ff]/10 p-3">
              <div>
                <div className="font-semibold">{selectedStreamer.displayName}</div>
                <div className="text-sm text-gray-300">@{selectedStreamer.twitchLogin}</div>
              </div>
              <button
                onClick={() => setSelectedStreamer(null)}
                className="text-sm text-gray-300 hover:text-white"
                disabled={saving}
              >
                Changer
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un streamer..."
                className="w-full rounded-lg border border-gray-700 bg-[#0e0e10] px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#9146ff]"
              />
              <div className="max-h-56 overflow-y-auto space-y-2">
                {filteredMembers.map((member) => (
                  <button
                    key={member.twitchLogin}
                    onClick={() => setSelectedStreamer(member)}
                    className="w-full rounded-lg border border-gray-700 bg-[#0e0e10] px-3 py-2 text-left hover:border-[#9146ff] transition-colors"
                    type="button"
                  >
                    <div className="font-medium">{member.displayName}</div>
                    <div className="text-xs text-gray-400">@{member.twitchLogin}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-300 block mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-[#0e0e10] px-4 py-2 text-white"
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 block mb-2">Heure de début</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-[#0e0e10] px-4 py-2 text-white"
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 block mb-2">Heure de fin</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-[#0e0e10] px-4 py-2 text-white"
            />
          </div>
        </div>

        <button
          onClick={handleCreateSpotlight}
          disabled={saving}
          className="rounded-lg bg-[#9146ff] hover:bg-[#7c3aed] px-5 py-2.5 font-semibold transition-colors disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : "Programmer la mise en avant"}
        </button>
      </div>

      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Spotlights programmés</h2>

        {loading ? (
          <p className="text-gray-400">Chargement...</p>
        ) : spotlights.length === 0 ? (
          <p className="text-gray-400">Aucune programmation pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {spotlights.map((spotlight) => {
              const liveState =
                spotlight.status !== "active"
                  ? "Inactif"
                  : spotlight.hasEnded
                    ? "Terminé"
                    : spotlight.hasStarted
                      ? "Démarré"
                      : "À venir";

              return (
                <div
                  key={spotlight.id}
                  className="rounded-lg border border-gray-700 bg-[#0e0e10] p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="font-semibold">
                      {spotlight.streamerDisplayName || spotlight.streamerTwitchLogin}
                      <span className="text-gray-400 font-normal ml-2">
                        @{spotlight.streamerTwitchLogin}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300">
                      {formatDate(spotlight.startedAt)} →{" "}
                      {spotlight.endsAt ? formatDate(spotlight.endsAt) : "Sans fin"}
                    </div>
                    <div className="text-xs text-gray-500">
                      Créé par {spotlight.moderatorUsername} - État: {liveState}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {spotlight.status === "active" ? (
                      <button
                        onClick={() => updateStatus(spotlight.id, "cancelled")}
                        disabled={saving}
                        className="rounded-lg border border-red-500/40 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/10"
                      >
                        Annuler
                      </button>
                    ) : (
                      <button
                        onClick={() => updateStatus(spotlight.id, "active")}
                        disabled={saving}
                        className="rounded-lg border border-green-500/40 px-3 py-1.5 text-sm text-green-300 hover:bg-green-500/10"
                      >
                        Réactiver
                      </button>
                    )}
                    {!spotlight.hasEnded && spotlight.status !== "completed" && (
                      <button
                        onClick={() => updateStatus(spotlight.id, "completed")}
                        disabled={saving}
                        className="rounded-lg border border-gray-500/40 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5"
                      >
                        Marquer terminé
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
