"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import SpotlightModal from "@/components/admin/evaluations/SpotlightModal";
import EventModal from "@/components/admin/evaluations/EventModal";

const navLinks = [
  { href: "/admin/dashboard", label: "Dashboard Général" },
  { href: "/admin/membres", label: "Gestion des Membres" },
  { href: "/admin/evaluations", label: "Évaluations", active: true },
  { href: "/admin/spotlight", label: "Gestion Spotlight" },
  { href: "/admin/logs", label: "Logs" },
];

interface SpotlightEvaluation {
  id: string;
  date: string;
  streamerTwitchLogin: string;
  moderatorDiscordId: string;
  moderatorUsername: string;
  members: Array<{
    twitchLogin: string;
    present: boolean;
    note?: number;
    comment?: string;
  }>;
  validated: boolean;
  validatedAt?: string;
  createdAt: string;
  createdBy: string;
}

interface EventEvaluation {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  members: Array<{
    twitchLogin: string;
    present: boolean;
    comment?: string;
  }>;
  createdAt: string;
  createdBy: string;
}

interface SectionAData {
  month: string;
  spotlights: SpotlightEvaluation[];
  events: EventEvaluation[];
  raidPoints: Record<string, number>;
  spotlightBonus: Record<string, number>;
  lastUpdated: string;
}

export default function SectionAPage() {
  const params = useParams();
  const router = useRouter();
  const monthKey = params.month as string;

  const [data, setData] = useState<SectionAData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSpotlight, setSelectedSpotlight] = useState<SpotlightEvaluation | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventEvaluation | null>(null);
  const [isSpotlightModalOpen, setIsSpotlightModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [monthKey]);

  async function loadData() {
    try {
      setLoading(true);
      const response = await fetch(`/api/evaluations/section-a?month=${monthKey}`);
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      } else {
        console.error("Erreur chargement Section A");
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatMonthLabel(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  async function handleSpotlightSave(spotlight: SpotlightEvaluation) {
    try {
      const action = spotlight.id && data?.spotlights.find(s => s.id === spotlight.id) 
        ? 'update-spotlight' 
        : 'add-spotlight';
      
      const response = await fetch('/api/evaluations/section-a', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: monthKey,
          action,
          payload: spotlight,
        }),
      });

      if (response.ok) {
        await loadData();
        setIsSpotlightModalOpen(false);
        setSelectedSpotlight(null);
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde');
    }
  }

  async function handleEventSave(event: EventEvaluation) {
    try {
      const action = event.id && data?.events.find(e => e.id === event.id) 
        ? 'update-event' 
        : 'add-event';
      
      const response = await fetch('/api/evaluations/section-a', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: monthKey,
          action,
          payload: event,
        }),
      });

      if (response.ok) {
        await loadData();
        setIsEventModalOpen(false);
        setSelectedEvent(null);
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white p-6">
        <AdminHeader title={`Section A - Présence Active`} navLinks={navLinks} />
        <div className="text-center py-12">
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white p-6">
        <AdminHeader title={`Section A - Présence Active`} navLinks={navLinks} />
        <div className="text-center py-12">
          <p className="text-red-400">Erreur de chargement des données</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white p-6">
      <AdminHeader 
        title={`Section A - Présence Active - ${formatMonthLabel(monthKey)}`} 
        navLinks={navLinks} 
      />

      <div className="mb-6">
        <Link
          href={`/admin/evaluations/${monthKey}`}
          className="text-purple-400 hover:text-purple-300"
        >
          ← Retour aux sections
        </Link>
      </div>

      {/* Résumé des points */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Spotlights</h3>
          <p className="text-2xl font-bold text-white">{data.spotlights.length}</p>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Événements TENF</h3>
          <p className="text-2xl font-bold text-white">{data.events.length}</p>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Points Raids</h3>
          <p className="text-2xl font-bold text-white">
            {Object.keys(data.raidPoints).length} membres
          </p>
        </div>
      </div>

      {/* Spotlights */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Spotlights</h2>
          <button
            onClick={() => {
              setSelectedSpotlight(null);
              setIsSpotlightModalOpen(true);
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
          >
            + Ajouter un Spotlight
          </button>
        </div>

        {data.spotlights.length === 0 ? (
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 text-center text-gray-400">
            Aucun spotlight enregistré pour ce mois
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.spotlights.map((spotlight) => (
              <div
                key={spotlight.id}
                className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4 hover:border-purple-500 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedSpotlight(spotlight);
                  setIsSpotlightModalOpen(true);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-white">{spotlight.streamerTwitchLogin}</h3>
                  {spotlight.validated && (
                    <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded">
                      Validé
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mb-2">
                  {formatDate(spotlight.date)} • Modérateur: {spotlight.moderatorUsername}
                </p>
                <p className="text-sm text-gray-500">
                  {spotlight.members.filter(m => m.present).length} membres présents
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Événements TENF */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Événements TENF</h2>
          <button
            onClick={() => {
              setSelectedEvent(null);
              setIsEventModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            + Ajouter un Événement
          </button>
        </div>

        {data.events.length === 0 ? (
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 text-center text-gray-400">
            Aucun événement enregistré pour ce mois
          </div>
        ) : (
          <div className="space-y-4">
            {data.events.map((event) => (
              <div
                key={event.id}
                className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedEvent(event);
                  setIsEventModalOpen(true);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-white">{event.name}</h3>
                </div>
                <p className="text-sm text-gray-400 mb-2">
                  {formatDate(event.startDate)} → {formatDate(event.endDate)}
                </p>
                <p className="text-sm text-gray-500">
                  {event.members.filter(m => m.present).length} membres présents
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {isSpotlightModalOpen && (
        <SpotlightModal
          isOpen={isSpotlightModalOpen}
          onClose={() => {
            setIsSpotlightModalOpen(false);
            setSelectedSpotlight(null);
          }}
          spotlight={selectedSpotlight}
          monthKey={monthKey}
          onSave={handleSpotlightSave}
        />
      )}

      {isEventModalOpen && (
        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => {
            setIsEventModalOpen(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          monthKey={monthKey}
          onSave={handleEventSave}
        />
      )}
    </div>
  );
}

