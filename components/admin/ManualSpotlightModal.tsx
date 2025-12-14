"use client";

import { useState, useEffect } from "react";

interface Member {
  twitchLogin: string;
  displayName: string;
  role?: string;
}

interface EvaluationCriteria {
  id: string;
  label: string;
  maxValue: number;
  value: number;
}

const DEFAULT_CRITERIA: EvaluationCriteria[] = [
  { id: "accueil", label: "Accueil & Présentation", maxValue: 3, value: 0 },
  { id: "interaction", label: "Interaction & Dynamique", maxValue: 5, value: 0 },
  { id: "respect", label: "Respect des règles & Comportement", maxValue: 3, value: 0 },
  { id: "participation", label: "Participation Spotlight", maxValue: 3, value: 0 },
  { id: "qualite", label: "Qualité technique", maxValue: 2, value: 0 },
  { id: "tenf", label: "TENF Spirit", maxValue: 4, value: 0 },
];

interface ManualSpotlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManualSpotlightModal({
  isOpen,
  onClose,
  onSuccess,
}: ManualSpotlightModalProps) {
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [streamerSearch, setStreamerSearch] = useState("");
  const [selectedStreamer, setSelectedStreamer] = useState<Member | null>(null);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [presenceSearch, setPresenceSearch] = useState("");
  const [selectedPresences, setSelectedPresences] = useState<Member[]>([]);
  const [evaluation, setEvaluation] = useState<EvaluationCriteria[]>(DEFAULT_CRITERIA);
  const [moderatorComments, setModeratorComments] = useState("");
  const [includeEvaluation, setIncludeEvaluation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staffMembers, setStaffMembers] = useState<Array<{ discordId: string; discordUsername: string; displayName: string; role: string }>>([]);
  const [selectedModerator, setSelectedModerator] = useState<{ discordId: string; username: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadMembers();
      loadStaffMembers();
      // Initialiser avec la date d'aujourd'hui
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().slice(0, 5);
      setStartDate(dateStr);
      setStartTime(timeStr);
      // Par défaut, fin = début + 2h
      const end = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      setEndDate(end.toISOString().split('T')[0]);
      setEndTime(end.toTimeString().slice(0, 5));
    }
  }, [isOpen]);

  async function loadStaffMembers() {
    try {
      const response = await fetch('/api/admin/staff', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setStaffMembers(data.staff || []);
        // Définir le modérateur par défaut comme l'utilisateur actuel
        const { getDiscordUser } = await import('@/lib/discord');
        const user = await getDiscordUser();
        if (user && data.staff) {
          const currentUser = data.staff.find((s: any) => s.discordId === user.id);
          if (currentUser) {
            setSelectedModerator({
              discordId: currentUser.discordId,
              username: currentUser.discordUsername || currentUser.displayName,
            });
          }
        }
      }
    } catch (error) {
      console.error("Erreur chargement staff:", error);
    }
  }

  async function loadMembers() {
    try {
      const response = await fetch('/api/members/public', {
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        const members = (data.members || [])
          .filter((m: any) => m.isActive !== false)
          .map((m: any) => ({
            twitchLogin: m.twitchLogin || '',
            displayName: m.displayName || m.twitchLogin || '',
            role: m.role,
          }))
          .filter((m: Member) => m.twitchLogin);
        setAllMembers(members);
      }
    } catch (error) {
      console.error("Erreur chargement membres:", error);
    }
  }

  function handleSelectStreamer(member: Member) {
    setSelectedStreamer(member);
    setStreamerSearch("");
  }

  function handleTogglePresence(member: Member) {
    setSelectedPresences((prev) => {
      const exists = prev.some(p => p.twitchLogin === member.twitchLogin);
      if (exists) {
        return prev.filter(p => p.twitchLogin !== member.twitchLogin);
      } else {
        return [...prev, member];
      }
    });
  }

  function handleSliderChange(id: string, value: number) {
    setEvaluation((prev) =>
      prev.map((crit) => (crit.id === id ? { ...crit, value } : crit))
    );
  }

  async function handleSubmit() {
    setError(null);

    // Validation
    if (!selectedStreamer) {
      setError("Veuillez sélectionner un streamer");
      return;
    }

    if (!startDate || !startTime) {
      setError("Veuillez renseigner la date et l'heure de début");
      return;
    }

    if (!endDate || !endTime) {
      setError("Veuillez renseigner la date et l'heure de fin");
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      setError("Dates ou heures invalides");
      return;
    }

    if (endDateTime <= startDateTime) {
      setError("L'heure de fin doit être après l'heure de début");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch('/api/spotlight/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamerTwitchLogin: selectedStreamer.twitchLogin,
          streamerDisplayName: selectedStreamer.displayName,
          startedAt: startDateTime.toISOString(),
          endsAt: endDateTime.toISOString(),
          moderatorDiscordId: selectedModerator.discordId,
          moderatorUsername: selectedModerator.username,
          presences: selectedPresences.map(p => ({
            twitchLogin: p.twitchLogin,
            displayName: p.displayName,
          })),
          evaluation: includeEvaluation ? {
            criteria: evaluation,
            moderatorComments,
          } : null,
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
        // Reset form
        setSelectedStreamer(null);
        setSelectedPresences([]);
        setEvaluation(DEFAULT_CRITERIA);
        setModeratorComments("");
        setIncludeEvaluation(false);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Erreur lors de la création du spotlight");
      }
    } catch (error) {
      console.error("Erreur création spotlight manuel:", error);
      setError("Erreur lors de la création du spotlight");
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  const filteredStreamers = allMembers.filter((member) => {
    const query = streamerSearch.toLowerCase();
    return (
      member.twitchLogin.toLowerCase().includes(query) ||
      member.displayName.toLowerCase().includes(query)
    );
  });

  const filteredPresences = allMembers.filter((member) => {
    const query = presenceSearch.toLowerCase();
    return (
      member.twitchLogin.toLowerCase().includes(query) ||
      member.displayName.toLowerCase().includes(query)
    );
  });

  const totalScore = evaluation.reduce((sum, crit) => sum + crit.value, 0);
  const maxScore = evaluation.reduce((sum, crit) => sum + crit.maxValue, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            Ajouter un spotlight manuellement
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Sélection du streamer */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Streamer Spotlight *
            </label>
            {selectedStreamer ? (
              <div className="flex items-center gap-3 p-3 bg-[#0e0e10] border border-gray-700 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9146ff] to-[#5a32b4] flex items-center justify-center text-white font-bold">
                  {selectedStreamer.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">{selectedStreamer.displayName}</p>
                  <p className="text-sm text-gray-400">@{selectedStreamer.twitchLogin}</p>
                </div>
                <button
                  onClick={() => setSelectedStreamer(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Rechercher un streamer..."
                  value={streamerSearch}
                  onChange={(e) => setStreamerSearch(e.target.value)}
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff] mb-2"
                />
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {filteredStreamers.map((member) => (
                    <button
                      key={member.twitchLogin}
                      onClick={() => handleSelectStreamer(member)}
                      className="w-full flex items-center gap-3 p-2 bg-[#0e0e10] border border-gray-700 rounded-lg hover:border-[#9146ff] transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9146ff] to-[#5a32b4] flex items-center justify-center text-white font-bold text-sm">
                        {member.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{member.displayName}</p>
                        <p className="text-xs text-gray-400">@{member.twitchLogin}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Date et heure */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Date de début *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Heure de début *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Date de fin *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Heure de fin *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
          </div>

          {/* Sélection des présences */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Membres présents ({selectedPresences.length})
            </label>
            <input
              type="text"
              placeholder="Rechercher un membre..."
              value={presenceSearch}
              onChange={(e) => setPresenceSearch(e.target.value)}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff] mb-2"
            />
            <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-700 rounded-lg p-2">
              {filteredPresences.map((member) => {
                const isSelected = selectedPresences.some(p => p.twitchLogin === member.twitchLogin);
                return (
                  <button
                    key={member.twitchLogin}
                    onClick={() => handleTogglePresence(member)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                      isSelected
                        ? "bg-purple-600/20 border border-purple-500/50"
                        : "bg-[#0e0e10] border border-gray-700 hover:border-[#9146ff]"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9146ff] to-[#5a32b4] flex items-center justify-center text-white font-bold text-sm">
                      {member.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{member.displayName}</p>
                      <p className="text-xs text-gray-400">@{member.twitchLogin}</p>
                    </div>
                    {isSelected && (
                      <svg
                        className="w-5 h-5 text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Évaluation (optionnel) */}
          <div>
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={includeEvaluation}
                onChange={(e) => setIncludeEvaluation(e.target.checked)}
                className="w-4 h-4 text-purple-600 bg-[#0e0e10] border-gray-700 rounded"
              />
              <span className="text-sm font-semibold text-gray-300">
                Inclure l'évaluation du streamer (optionnel)
              </span>
            </label>

            {includeEvaluation && (
              <div className="space-y-4 p-4 bg-[#0e0e10] border border-gray-700 rounded-lg">
                {evaluation.map((crit) => (
                  <div key={crit.id}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-300">
                        {crit.label}
                      </label>
                      <span className="text-sm text-purple-400 font-semibold">
                        {crit.value}/{crit.maxValue}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={crit.maxValue}
                      value={crit.value}
                      onChange={(e) =>
                        handleSliderChange(crit.id, parseInt(e.target.value))
                      }
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#9146ff]"
                    />
                  </div>
                ))}

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Commentaires du modérateur
                  </label>
                  <textarea
                    value={moderatorComments}
                    onChange={(e) => setModeratorComments(e.target.value)}
                    placeholder="Commentaires du modérateur"
                    className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff] min-h-[80px]"
                  />
                </div>

                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-400">
                    Score total: <span className="text-white font-bold">{totalScore}/{maxScore}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={handleSubmit}
            disabled={saving || !selectedStreamer}
            className="flex-1 bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Création..." : "Créer le spotlight"}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

