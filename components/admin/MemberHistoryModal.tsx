"use client";

import { useState, useEffect } from "react";

interface MemberEvent {
  id: string;
  memberId: string;
  type: string;
  createdAt: string;
  source?: 'twitch_eventsub' | 'twitch_poll' | 'manual' | 'discord' | 'system';
  actor?: string;
  payload?: Record<string, any>;
}

interface MemberHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  memberName: string;
}

export default function MemberHistoryModal({
  isOpen,
  onClose,
  memberId,
  memberName,
}: MemberHistoryModalProps) {
  const [events, setEvents] = useState<MemberEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && memberId) {
      loadEvents();
    }
  }, [isOpen, memberId]);

  async function loadEvents() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/members/events?memberId=${encodeURIComponent(memberId)}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique:", error);
      alert(`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    } finally {
      setLoading(false);
    }
  }

  const formatEventSummary = (event: MemberEvent): string => {
    switch (event.type) {
      case 'role_changed':
        return `Rôle changé: ${event.payload?.fromRole || 'N/A'} → ${event.payload?.toRole || 'N/A'}`;
      case 'integration_validated':
        return `Intégration validée le ${new Date(event.payload?.date || event.createdAt).toLocaleDateString('fr-FR')}`;
      case 'manual_note_updated':
        return `Notes internes mises à jour`;
      case 'raid':
        return `Raid: ${event.payload?.raider || 'N/A'} → ${event.payload?.target || 'N/A'}`;
      case 'follow_import_wizebot':
        return `Import Wizebot: Follow détecté${event.payload?.followedAt ? ` le ${new Date(event.payload.followedAt).toLocaleDateString('fr-FR')}` : ''}`;
      default:
        return event.type;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'role_changed':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'integration_validated':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'manual_note_updated':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'raid':
        return 'bg-[#9146ff]/20 text-[#9146ff] border-[#9146ff]/30';
      case 'follow_import_wizebot':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'twitch_eventsub':
        return '🎮';
      case 'twitch_poll':
        return '📊';
      case 'manual':
        return '✋';
      case 'discord':
        return '💬';
      case 'system':
        return '⚙️';
      default:
        return '❓';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1d] border border-gray-700 rounded-lg max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white">Historique de {memberName}</h2>
            <p className="text-sm text-gray-400 mt-1">Twitch: {memberId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9146ff]"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Aucun événement enregistré pour ce membre.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getEventTypeColor(event.type)}`}>
                        {event.type}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {getSourceIcon(event.source)} {event.source || 'N/A'}
                      </span>
                    </div>
                    <span className="text-gray-400 text-sm">
                      {new Date(event.createdAt).toLocaleString('fr-FR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  <p className="text-white mb-2">{formatEventSummary(event)}</p>
                  {event.actor && (
                    <p className="text-gray-400 text-sm">
                      Par: {event.actor}
                    </p>
                  )}
                  {event.payload && Object.keys(event.payload).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-gray-400 text-sm cursor-pointer hover:text-gray-300">
                        Détails
                      </summary>
                      <pre className="mt-2 text-xs text-gray-500 bg-[#1a1a1d] p-2 rounded overflow-x-auto">
                        {JSON.stringify(event.payload, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

