"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Calendar, Users, CheckCircle2, XCircle, ArrowLeft, ArrowRight } from "lucide-react";

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

interface MemberOption {
  twitchLogin: string;
  displayName: string;
}

interface ManualSpotlight {
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

const DEFAULT_CRITERIA: EvaluationCriteria[] = [
  { id: "accueil", label: "Accueil & Présentation", maxValue: 3, value: 3 },
  { id: "interaction", label: "Interaction & Dynamique", maxValue: 5, value: 4 },
  { id: "respect", label: "Respect des règles & Comportement", maxValue: 3, value: 3 },
  { id: "participation", label: "Participation Spotlight", maxValue: 3, value: 2 },
  { id: "qualite", label: "Qualité technique", maxValue: 2, value: 2 },
  { id: "tenf", label: "TENF Spirit", maxValue: 4, value: 3 },
];

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 disabled:opacity-50";
const inputClass =
  "w-full rounded-lg border border-[#353a50] bg-[#121623]/80 px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-300/45";

export default function GestionSpotlightPage() {
  const [events, setEvents] = useState<EventWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventWithData | null>(null);
  const [activeTab, setActiveTab] = useState<"presence" | "evaluation">("presence");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [evaluation, setEvaluation] = useState<EvaluationCriteria[]>(DEFAULT_CRITERIA);
  const [moderatorComments, setModeratorComments] = useState("");
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [manualSpotlights, setManualSpotlights] = useState<ManualSpotlight[]>([]);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSearch, setManualSearch] = useState("");
  const [selectedManualStreamer, setSelectedManualStreamer] = useState<MemberOption | null>(null);
  const [manualDate, setManualDate] = useState("");
  const [manualStartTime, setManualStartTime] = useState("");
  const [manualEndTime, setManualEndTime] = useState("");

  useEffect(() => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    setManualDate(dateStr);
    setManualStartTime(now.toTimeString().slice(0, 5));
    const plus2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    setManualEndTime(plus2h.toTimeString().slice(0, 5));

    loadData();
    loadManualSpotlightData();
  }, []);

  const filteredMembers = useMemo(() => {
    const query = manualSearch.trim().toLowerCase();
    if (!query) return members.slice(0, 30);
    return members
      .filter((member) => {
        return (
          member.twitchLogin.toLowerCase().includes(query) ||
          member.displayName.toLowerCase().includes(query)
        );
      })
      .slice(0, 30);
  }, [members, manualSearch]);

  const loadManualSpotlightData = async () => {
    try {
      setManualLoading(true);
      setManualError(null);
      const [membersRes, spotlightsRes] = await Promise.all([
        fetch("/api/members/public", { cache: "no-store" }),
        fetch("/api/admin/membres/spotlight", { cache: "no-store" }),
      ]);

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        const validMembers = (membersData.members || [])
          .filter((item: any) => item.twitchLogin && item.isActive !== false)
          .map((item: any) => ({
            twitchLogin: item.twitchLogin,
            displayName: item.displayName || item.twitchLogin,
          }));
        setMembers(validMembers);
      }

      if (spotlightsRes.ok) {
        const spotlightData = await spotlightsRes.json();
        const formatted = (spotlightData.spotlights || []).map((item: any) => ({
          id: item.id,
          streamerTwitchLogin: item.streamerTwitchLogin,
          streamerDisplayName: item.streamerDisplayName,
          startedAt: item.startedAt,
          endsAt: item.endsAt,
          status: item.status,
          moderatorUsername: item.moderatorUsername,
          hasStarted: !!item.hasStarted,
          hasEnded: !!item.hasEnded,
        }));
        setManualSpotlights(formatted);
      }
    } catch (error) {
      setManualError(error instanceof Error ? error.message : "Erreur de chargement");
    } finally {
      setManualLoading(false);
    }
  };

  const handleCreateManualSpotlight = async () => {
    setManualError(null);

    if (!selectedManualStreamer) {
      setManualError("Sélectionne un streamer.");
      return;
    }
    if (!manualDate || !manualStartTime || !manualEndTime) {
      setManualError("Renseigne la date, l'heure de début et l'heure de fin.");
      return;
    }

    const startsAt = new Date(`${manualDate}T${manualStartTime}`);
    const endsAt = new Date(`${manualDate}T${manualEndTime}`);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      setManualError("Date ou heure invalide.");
      return;
    }
    if (endsAt <= startsAt) {
      setManualError("L'heure de fin doit être après l'heure de début.");
      return;
    }

    try {
      setManualSaving(true);
      const response = await fetch("/api/admin/membres/spotlight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamerTwitchLogin: selectedManualStreamer.twitchLogin,
          streamerDisplayName: selectedManualStreamer.displayName,
          startedAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erreur de création");
      }

      setSelectedManualStreamer(null);
      setManualSearch("");
      await loadManualSpotlightData();
    } catch (error) {
      setManualError(error instanceof Error ? error.message : "Erreur de création");
    } finally {
      setManualSaving(false);
    }
  };

  const updateManualSpotlightStatus = async (id: string, status: ManualSpotlight["status"]) => {
    try {
      setManualSaving(true);
      setManualError(null);
      const response = await fetch("/api/admin/membres/spotlight", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Mise à jour impossible");
      }
      await loadManualSpotlightData();
    } catch (error) {
      setManualError(error instanceof Error ? error.message : "Erreur de mise à jour");
    } finally {
      setManualSaving(false);
    }
  };

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
  const totalSpotlightEvents = events.length;
  const avgPresenceRate =
    totalSpotlightEvents > 0
      ? Math.round(
          events.reduce((acc, item) => acc + (item.presenceRate || 0), 0) / totalSpotlightEvents
        )
      : 0;
  const manualActiveCount = manualSpotlights.filter((item) => item.status === "active").length;
  const eventsWithWeakPresence = events.filter((item) => (item.presenceRate || 0) < 50).length;

  if (loading) {
    return (
      <div className="space-y-6 text-white">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      <section className={`${glassCardClass} p-5 md:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Communaute - Evenements - Spotlight</p>
            <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
              Gestion Spotlight
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Cockpit opérationnel pour piloter la programmation Spotlight sur la page Lives, suivre les présences
              des événements Spotlight et centraliser l'évaluation qualitative des streamers.
            </p>
          </div>
          <Link href="/admin/spotlight" className={subtleButtonClass}>
            Retour au hub Spotlight
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Événements Spotlight</p>
          <p className="mt-2 text-3xl font-semibold">{totalSpotlightEvents}</p>
          <p className="mt-1 text-xs text-slate-400">Base d'analyse présence et qualité</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Programmations manuelles actives</p>
          <p className="mt-2 text-3xl font-semibold text-indigo-200">{manualActiveCount}</p>
          <p className="mt-1 text-xs text-slate-400">Pseudos priorisés avec badge sur Lives</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Présence moyenne</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-300">{avgPresenceRate}%</p>
          <p className="mt-1 text-xs text-slate-400">Taux de participation des sessions Spotlight</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Sessions à risque</p>
          <p className="mt-2 text-3xl font-semibold text-rose-300">{eventsWithWeakPresence}</p>
          <p className="mt-1 text-xs text-slate-400">Présence inférieure à 50%</p>
        </article>
      </section>

      <section className={`${sectionCardClass} p-5`}>
        <h2 className="text-lg font-semibold text-slate-100">Explication de la page</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-3">
            <p className="text-sm font-semibold text-indigo-100">1) Programmer la mise en avant</p>
            <p className="mt-1 text-xs text-slate-300">
              Sélectionner un pseudo et un créneau horaire pour forcer la visibilité sur la page Lives
              (badge Spotlight TENF + remontée en premier).
            </p>
          </div>
          <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-3">
            <p className="text-sm font-semibold text-cyan-100">2) Contrôler la présence</p>
            <p className="mt-1 text-xs text-slate-300">
              Ouvrir chaque session Spotlight pour vérifier les participants présents/absents et détecter les sessions à risque.
            </p>
          </div>
          <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-3">
            <p className="text-sm font-semibold text-emerald-100">3) Valider l'évaluation</p>
            <p className="mt-1 text-xs text-slate-300">
              Compléter la grille qualitative pour alimenter le suivi streamer et les décisions d'accompagnement.
            </p>
          </div>
        </div>
      </section>

      <section className={`${sectionCardClass} p-5`}>
        <Link
          href="/admin/spotlight"
          className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au hub Spotlight
        </Link>
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-white">Programmation manuelle Lives</h2>
          <p className="mt-1 text-sm text-slate-400">
            Ce bloc permet de forcer un pseudo en Spotlight TENF (badge + priorité d'affichage sur la page lives).
          </p>
        </div>

        {manualError && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            {manualError}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm text-slate-300">Streamer</label>
          {selectedManualStreamer ? (
            <div className="flex items-center justify-between rounded-lg border border-indigo-300/40 bg-indigo-300/10 p-3">
              <div>
                <div className="font-semibold">{selectedManualStreamer.displayName}</div>
                <div className="text-sm text-slate-300">@{selectedManualStreamer.twitchLogin}</div>
              </div>
              <button
                onClick={() => setSelectedManualStreamer(null)}
                className="text-sm text-slate-300 hover:text-white"
                disabled={manualSaving}
                type="button"
              >
                Changer
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={manualSearch}
                onChange={(event) => setManualSearch(event.target.value)}
                placeholder="Rechercher un streamer..."
                className={inputClass}
              />
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {filteredMembers.map((member) => (
                  <button
                    key={member.twitchLogin}
                    onClick={() => setSelectedManualStreamer(member)}
                    className="w-full rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2 text-left transition-colors hover:border-indigo-300/45"
                    type="button"
                  >
                    <div className="font-medium">{member.displayName}</div>
                    <div className="text-xs text-slate-400">@{member.twitchLogin}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Date</label>
            <input
              type="date"
              value={manualDate}
              onChange={(event) => setManualDate(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Heure de début</label>
            <input
              type="time"
              value={manualStartTime}
              onChange={(event) => setManualStartTime(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Heure de fin</label>
            <input
              type="time"
              value={manualEndTime}
              onChange={(event) => setManualEndTime(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={handleCreateManualSpotlight}
            disabled={manualSaving}
            className={subtleButtonClass}
            type="button"
          >
            {manualSaving ? "Enregistrement..." : "Programmer la mise en avant"}
          </button>
          <button
            onClick={loadManualSpotlightData}
            disabled={manualLoading || manualSaving}
            className="inline-flex items-center rounded-xl border border-[#353a50] bg-[#121623]/80 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-indigo-300/40 hover:text-white disabled:opacity-50"
            type="button"
          >
            {manualLoading ? "Actualisation..." : "Actualiser les programmations"}
          </button>
        </div>

        <div className="mt-6 space-y-3">
          <h3 className="text-lg font-semibold text-white">Programmations manuelles</h3>
          {manualSpotlights.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune programmation manuelle pour le moment.</p>
          ) : (
            <div className="space-y-2">
              {manualSpotlights.map((spotlight) => {
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
                    className="flex flex-col gap-3 rounded-xl border border-[#353a50] bg-[#121623]/80 p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-white">
                        {spotlight.streamerDisplayName || spotlight.streamerTwitchLogin}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatEventDate(spotlight.startedAt)} - {spotlight.endsAt ? formatEventDate(spotlight.endsAt) : "Sans fin"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Créé par {spotlight.moderatorUsername || "admin inconnu"} - État: {liveState}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {spotlight.status === "active" ? (
                        <button
                          onClick={() => updateManualSpotlightStatus(spotlight.id, "cancelled")}
                          className="rounded-md border border-amber-500/40 px-3 py-1 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/10"
                          disabled={manualSaving}
                          type="button"
                        >
                          Annuler
                        </button>
                      ) : (
                        <button
                          onClick={() => updateManualSpotlightStatus(spotlight.id, "active")}
                          className="rounded-md border border-emerald-500/40 px-3 py-1 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/10"
                          disabled={manualSaving}
                          type="button"
                        >
                          Réactiver
                        </button>
                      )}
                      {!spotlight.hasEnded && spotlight.status !== "completed" && (
                        <button
                          onClick={() => updateManualSpotlightStatus(spotlight.id, "completed")}
                          className="rounded-md border border-slate-500/40 px-3 py-1 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-500/10"
                          disabled={manualSaving}
                          type="button"
                        >
                          Terminer
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Sélecteur de mois */}
      {groupedEvents.length > 0 && (
        <section className={`${sectionCardClass} p-4`}>
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm font-semibold text-slate-300">Filtrer par mois :</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className={inputClass}>
              <option value="">Tous les mois</option>
              {groupedEvents.map(([monthKey]) => (
                <option key={monthKey} value={monthKey}>
                  {formatMonthKey(monthKey)}
                </option>
              ))}
            </select>
          </div>
        </section>
      )}

      {/* Liste des événements par mois */}
      {displayedEvents.length === 0 ? (
        <section className={`${sectionCardClass} p-8 text-center`}>
          <p className="text-slate-400">Aucun événement Spotlight pour le moment</p>
        </section>
      ) : (
        <div className="space-y-8">
          {displayedEvents.map(([monthKey, monthEvents]) => (
            <div key={monthKey}>
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-6 h-6 text-indigo-300" />
                <h2 className="text-2xl font-bold text-white">
                  {formatMonthKey(monthKey)}
                </h2>
                <span className="text-slate-400 text-sm">
                  ({monthEvents.length} {monthEvents.length > 1 ? "événements" : "événement"})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {monthEvents.map((item) => (
                  <div
                    key={item.event.id}
                    className="overflow-hidden rounded-xl border border-[#353a50] bg-[#121623]/80 transition-all group cursor-pointer hover:border-indigo-300/45 hover:bg-[#171d2f]"
                    onClick={() => handleOpenEvent(item)}
                  >
                    {item.event.image && (
                      <div className="relative w-full h-48 overflow-hidden bg-slate-900">
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
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar className="w-4 h-4" />
                          <span>{formatEventDate(item.event.date)}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-[#353a50] pt-2">
                          <div className="flex items-center gap-2 text-slate-400">
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
                            <span className="text-xs text-slate-400">Taux de présence</span>
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
