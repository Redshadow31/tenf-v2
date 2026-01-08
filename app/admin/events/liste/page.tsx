"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Calendar, MapPin } from "lucide-react";

interface EventWithRegistrations {
  event: {
    id: string;
    title: string;
    date: string;
    category: string;
    isPublished: boolean;
  };
  registrations: Array<{
    id: string;
    twitchLogin: string;
    displayName: string;
    registeredAt: string;
  }>;
  registrationCount: number;
}

export default function ListeEventsPage() {
  const [data, setData] = useState<EventWithRegistrations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

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
        setData(result.eventsWithRegistrations || []);
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
          href="/admin/events"
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour aux événements
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">
          Liste des Événements et Inscriptions
        </h1>
        <p className="text-gray-400">
          Consultez tous les événements et leurs participants
        </p>
      </div>

      {data.length === 0 ? (
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-400">Aucun événement pour le moment</p>
        </div>
      ) : (
        <div className="space-y-6">
          {data.map((item) => (
            <div
              key={item.event.id}
              className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-semibold text-white">
                      {item.event.title}
                    </h2>
                    <span className="text-xs px-2 py-1 rounded bg-[#9146ff]/20 text-[#9146ff]">
                      {item.event.category}
                    </span>
                    {item.event.isPublished && (
                      <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                        Publié
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(item.event.date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{item.registrationCount} inscription{item.registrationCount > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setSelectedEvent(
                      selectedEvent === item.event.id ? null : item.event.id
                    )
                  }
                  className="text-[#9146ff] hover:text-[#7c3aed] text-sm font-semibold"
                >
                  {selectedEvent === item.event.id ? "Masquer" : "Voir les inscrits"}
                </button>
              </div>

              {selectedEvent === item.event.id && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  {item.registrations.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">
                      Aucune inscription pour cet événement
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {item.registrations.map((reg) => (
                        <div
                          key={reg.id}
                          className="bg-[#0e0e10] border border-gray-700 rounded-lg p-3"
                        >
                          <div className="font-semibold text-white mb-1">
                            {reg.displayName}
                          </div>
                          <div className="text-xs text-gray-400">
                            @{reg.twitchLogin}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Inscrit le {new Date(reg.registeredAt).toLocaleDateString("fr-FR")}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

