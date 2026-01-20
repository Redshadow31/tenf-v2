"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Users, CheckCircle2, XCircle, Star, ArrowLeft } from "lucide-react";
import { getDiscordUser } from "@/lib/discord";

interface EventWithData {
  event: {
    id: string;
    title: string;
    date: string;
    category: string;
    description?: string;
    location?: string;
    image?: string;
    isPublished: boolean;
  };
  registrations: Array<{
    id: string;
    twitchLogin: string;
    displayName: string;
    registeredAt: string;
  }>;
  registrationCount: number;
  presences?: Array<{
    id: string;
    twitchLogin: string;
    displayName: string;
    present: boolean;
  }>;
  presenceCount?: number;
  absentCount?: number;
  presenceRate?: number;
}

interface EvaluationCriteria {
  id: string;
  label: string;
  maxValue: number;
  value: number;
}

const DEFAULT_CRITERIA: EvaluationCriteria[] = [
  { id: "accueil", label: "Accueil & Présentation", maxValue: 3, value: 3 },
  { id: "interaction", label: "Interaction & Dynamique", maxValue: 5, value: 4 },
  { id: "respect", label: "Respect des règles & Comportement", maxValue: 3, value: 3 },
  { id: "participation", label: "Participation Spotlight", maxValue: 3, value: 2 },
  { id: "qualite", label: "Qualité technique", maxValue: 2, value: 2 },
  { id: "tenf", label: "TENF Spirit", maxValue: 4, value: 3 },
];

export default function GestionSpotlightPage() {
  const [events, setEvents] = useState<EventWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventWithData | null>(null);
  const [activeTab, setActiveTab] = useState<"presence" | "evaluation">("presence");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [evaluation, setEvaluation] = useState<EvaluationCriteria[]>(DEFAULT_CRITERIA);
  const [moderatorComments, setModeratorComments] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/events/registrations", {
        cache: 'no-store',
      });
      if (response.ok) {
        const result = await response.json();
        // Filtrer uniquement les événements Spotlight
        const spotlightEvents = (result.eventsWithRegistrations || []).filter(
          (item: any) => item.event.category === "Spotlight"
        );

        // Charger les présences pour chaque événement
        const eventsWithPresences = await Promise.all(
          spotlightEvents.map(async (item: any) => {
            try {
              const presenceResponse = await fetch(`/api/admin/events/presence?eventId=${item.event.id}`, {
                cache: 'no-store',
              });
              if (presenceResponse.ok) {
                const presenceData = await presenceResponse.json();
                const presences = presenceData.presences || [];
                const presentCount = presences.filter((p: any) => p.present).length;
                const absentCount = presences.filter((p: any) => !p.present).length;
                const registeredWithoutPresence = item.registrations.filter((reg: any) =>
                  !presences.some((p: any) => p.twitchLogin.toLowerCase() === reg.twitchLogin.toLowerCase())
                ).length;
                const totalAbsents = absentCount + registeredWithoutPresence;
                const presenceRate = item.registrationCount > 0
                  ? Math.round((presentCount / item.registrationCount) * 100)
                  : 0;

                return {
                  ...item,
                  presences,
                  presenceCount: presentCount,
                  absentCount: totalAbsents,
                  presenceRate,
                };
              }
            } catch (error) {
              console.error(`Erreur chargement présences pour ${item.event.id}:`, error);
            }
            return {
              ...item,
              presences: [],
              presenceCount: 0,
              absentCount: item.registrationCount,
              presenceRate: 0,
            };
          })
        );

        setEvents(eventsWithPresences);
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatMonthKey = (key: string): string => {
    const [year, month] = key.split('-');
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const formatEventDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Grouper les événements par mois
  const groupEventsByMonth = () => {
    const grouped: Record<string, EventWithData[]> = {};

    events.forEach((item) => {
      const eventDate = new Date(item.event.date);
      const year = eventDate.getFullYear();
      const month = String(eventDate.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;

      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(item);
    });

    // Trier les événements dans chaque mois par date décroissante
    Object.keys(grouped).forEach(monthKey => {
      grouped[monthKey].sort((a, b) => {
        return new Date(b.event.date).getTime() - new Date(a.event.date).getTime();
      });
    });

    // Trier les mois par ordre décroissant
    return Object.entries(grouped).sort((a, b) => {
      return b[0].localeCompare(a[0]);
    });
  };

  const groupedEvents = groupEventsByMonth();
  const displayedEvents = selectedMonth
    ? groupedEvents.filter(([monthKey]) => monthKey === selectedMonth)
    : groupedEvents;

  const handleOpenEvent = (event: EventWithData) => {
    setSelectedEvent(event);
    setActiveTab("presence");
    // Charger l'évaluation si elle existe
    loadEvaluationForEvent(event);
  };

  const loadEvaluationForEvent = async (event: EventWithData) => {
    // Essayer de charger l'évaluation depuis le spotlight correspondant
    // Chercher dans le mois correspondant et les mois adjacents
    try {
      const eventDate = new Date(event.event.date);
      
      // Chercher dans le mois de l'événement et les 2 mois adjacents
      for (let i = -1; i <= 1; i++) {
        const checkDate = new Date(eventDate);
        checkDate.setMonth(checkDate.getMonth() + i);
        const monthKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}`;
        
        const response = await fetch(`/api/spotlight/presence/monthly?month=${monthKey}`, {
          cache: 'no-store',
        });
        
        if (response.ok) {
          const data = await response.json();
          // Trouver le spotlight correspondant à cet événement par date
          const matchingSpotlight = data.spotlights?.find((s: any) => {
            const spotlightDate = new Date(s.date);
            const eventTime = eventDate.getTime();
            const timeDiff = Math.abs(spotlightDate.getTime() - eventTime);
            return timeDiff < 3 * 60 * 60 * 1000; // Moins de 3h d'écart
          });

          if (matchingSpotlight) {
            // Charger l'évaluation depuis spotlightStorage
            try {
              const evalResponse = await fetch(`/api/spotlight/evaluation/${matchingSpotlight.id}`, {
                cache: 'no-store',
              });
              if (evalResponse.ok) {
                const evalData = await evalResponse.json();
                if (evalData.evaluation) {
                  setEvaluation(evalData.evaluation.criteria || DEFAULT_CRITERIA);
                  setModeratorComments(evalData.evaluation.moderatorComments || "");
                  return;
                }
              }
            } catch (error) {
              console.error("Erreur chargement évaluation:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Erreur chargement évaluation:", error);
    }
    
    // Par défaut, réinitialiser
    setEvaluation(DEFAULT_CRITERIA);
    setModeratorComments("");
  };

  const handleSavePresences = async () => {
    if (!selectedEvent) return;

    // Les présences sont déjà gérées via l'API des événements
    // On valide juste pour passer à l'onglet évaluation
    setActiveTab("evaluation");
  };

  const handleSaveEvaluation = async () => {
    if (!selectedEvent) return;

    try {
      setSaving(true);
      
      // Trouver le spotlight correspondant pour sauvegarder l'évaluation
      const eventDate = new Date(selectedEvent.event.date);
      const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
      
      const response = await fetch(`/api/spotlight/presence/monthly?month=${monthKey}`, {
        cache: 'no-store',
      });
      
      if (response.ok) {
        const data = await response.json();
        const matchingSpotlight = data.spotlights?.find((s: any) => {
          const spotlightDate = new Date(s.date);
          const eventTime = eventDate.getTime();
          const timeDiff = Math.abs(spotlightDate.getTime() - eventTime);
          return timeDiff < 3 * 60 * 60 * 1000;
        });

        if (matchingSpotlight) {
          // Essayer d'abord PUT (mise à jour), sinon POST (création)
          let evalResponse = await fetch(`/api/spotlight/evaluation/${matchingSpotlight.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              criteria: evaluation,
              moderatorComments,
            }),
          });

          // Si 404, créer avec POST
          if (evalResponse.status === 404) {
            evalResponse = await fetch('/api/spotlight/evaluation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                spotlightId: matchingSpotlight.id,
                criteria: evaluation,
                moderatorComments,
              }),
            });
          }

          if (evalResponse.ok) {
            alert("Évaluation enregistrée avec succès");
            await loadEvaluationForEvent(selectedEvent); // Recharger
          } else {
            const error = await evalResponse.json();
            alert(`Erreur: ${error.error || 'Impossible d\'enregistrer l\'évaluation'}`);
          }
        } else {
          alert("Spotlight correspondant non trouvé. Veuillez créer le spotlight dans la section A d'abord.");
        }
      }
    } catch (error) {
      console.error("Erreur sauvegarde évaluation:", error);
      alert("Erreur lors de l'enregistrement de l'évaluation");
    } finally {
      setSaving(false);
    }
  };

  const handleSliderChange = (id: string, value: number) => {
    setEvaluation((prev) =>
      prev.map((crit) => (crit.id === id ? { ...crit, value } : crit))
    );
  };

  const totalScore = evaluation.reduce((sum, crit) => sum + crit.value, 0);
  const maxScore = evaluation.reduce((sum, crit) => sum + crit.maxValue, 0);
  const scorePercentage = (totalScore / maxScore) * 100;

  if (loading) {
    return (
      <div className="text-white">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9146ff]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="mb-8">
        <Link
          href="/admin/spotlight"
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au hub Spotlight
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">Gestion Spotlight</h1>
        <p className="text-gray-400">Gérer les présences et évaluations des événements Spotlight</p>
      </div>

      {/* Sélecteur de mois */}
      {groupedEvents.length > 0 && (
        <div className="mb-6 flex items-center gap-4">
          <label className="text-sm font-semibold text-gray-300">Filtrer par mois :</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
          >
            <option value="">Tous les mois</option>
            {groupedEvents.map(([monthKey]) => (
              <option key={monthKey} value={monthKey}>
                {formatMonthKey(monthKey)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Liste des événements par mois */}
      {displayedEvents.length === 0 ? (
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-400">Aucun événement Spotlight pour le moment</p>
        </div>
      ) : (
        <div className="space-y-8">
          {displayedEvents.map(([monthKey, monthEvents]) => (
            <div key={monthKey}>
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-6 h-6 text-[#9146ff]" />
                <h2 className="text-2xl font-bold text-white">
                  {formatMonthKey(monthKey)}
                </h2>
                <span className="text-gray-400 text-sm">
                  ({monthEvents.length} {monthEvents.length > 1 ? "événements" : "événement"})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {monthEvents.map((item) => (
                  <div
                    key={item.event.id}
                    className="bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden hover:border-[#9146ff]/50 transition-all hover:shadow-lg hover:shadow-[#9146ff]/20 group cursor-pointer"
                    onClick={() => handleOpenEvent(item)}
                  >
                    {item.event.image && (
                      <div className="relative w-full h-48 overflow-hidden bg-gray-800">
                        <img
                          src={item.event.image}
                          alt={item.event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-white line-clamp-2 mb-2">
                        {item.event.title}
                      </h3>

                      <div className="space-y-2 text-sm mb-3">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>{formatEventDate(item.event.date)}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Users className="w-4 h-4" />
                            <span>{item.registrationCount} inscription{item.registrationCount > 1 ? 's' : ''}</span>
                          </div>
                          {item.presenceCount !== undefined && (
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 text-green-400">
                                <CheckCircle2 className="w-3 h-3" />
                                <span className="text-xs font-medium">{item.presenceCount}</span>
                              </div>
                              {item.absentCount !== undefined && item.absentCount > 0 && (
                                <div className="flex items-center gap-1 text-red-400">
                                  <XCircle className="w-3 h-3" />
                                  <span className="text-xs font-medium">{item.absentCount}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {item.presenceRate !== undefined && item.presenceRate > 0 && (
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs text-gray-400">Taux de présence</span>
                            <span className={`text-xs font-semibold ${item.presenceRate >= 80 ? 'text-green-400' : item.presenceRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {item.presenceRate}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal avec onglets */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-[#1a1a1d] border border-gray-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">{selectedEvent.event.title}</h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Onglets */}
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab("presence")}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    activeTab === "presence"
                      ? "bg-[#9146ff] text-white"
                      : "bg-[#0e0e10] text-gray-400 hover:text-white"
                  }`}
                >
                  Présence
                </button>
                <button
                  onClick={() => setActiveTab("evaluation")}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    activeTab === "evaluation"
                      ? "bg-[#9146ff] text-white"
                      : "bg-[#0e0e10] text-gray-400 hover:text-white"
                  }`}
                >
                  Évaluation Streamer
                </button>
              </div>
            </div>

            {/* Contenu */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "presence" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Inscriptions</p>
                      <p className="text-2xl font-bold text-white">{selectedEvent.registrationCount}</p>
                    </div>
                    <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Présents</p>
                      <p className="text-2xl font-bold text-green-400">{selectedEvent.presenceCount || 0}</p>
                    </div>
                    <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Absents</p>
                      <p className="text-2xl font-bold text-red-400">{selectedEvent.absentCount || 0}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white mb-4">Liste des participants</h3>
                    {selectedEvent.presences && selectedEvent.presences.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {selectedEvent.presences.map((presence) => (
                          <div
                            key={presence.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              presence.present
                                ? "bg-green-500/10 border-green-500/30"
                                : "bg-red-500/10 border-red-500/30"
                            }`}
                          >
                            <div>
                              <p className="text-white font-medium">{presence.displayName}</p>
                              <p className="text-sm text-gray-400">@{presence.twitchLogin}</p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                presence.present
                                  ? "bg-green-500/20 text-green-300"
                                  : "bg-red-500/20 text-red-300"
                              }`}
                            >
                              {presence.present ? "Présent" : "Absent"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-8">Aucune présence enregistrée</p>
                    )}
                  </div>

                  <div className="flex gap-4 mt-6">
                    <Link
                      href={`/admin/events/presence`}
                      className="flex-1 bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
                    >
                      Gérer les présences
                    </Link>
                    <button
                      onClick={handleSavePresences}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                      Valider et continuer →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Critères d'évaluation</h3>
                    <div className="space-y-6">
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
                            style={{
                              background: `linear-gradient(to right, #9146ff 0%, #9146ff ${
                                (crit.value / crit.maxValue) * 100
                              }%, #374151 ${
                                (crit.value / crit.maxValue) * 100
                              }%, #374151 100%)`,
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Commentaires du modérateur
                    </label>
                    <textarea
                      value={moderatorComments}
                      onChange={(e) => setModeratorComments(e.target.value)}
                      placeholder="Commentaires du modérateur"
                      className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff] min-h-[100px]"
                    />
                  </div>

                  <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">Score total</span>
                      <span className="text-2xl font-bold text-white">
                        {totalScore}/{maxScore}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Pourcentage</span>
                      <span className="text-lg font-semibold text-purple-400">
                        {Math.round(scorePercentage)}%
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveEvaluation}
                    disabled={saving}
                    className="w-full bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving ? "Enregistrement..." : "Enregistrer l'évaluation"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
