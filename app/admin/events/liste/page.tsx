"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Calendar, MapPin, ArrowLeft } from "lucide-react";

interface EventWithRegistrations {
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
}

interface CategoryConfig {
  value: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const categories: CategoryConfig[] = [
  {
    value: "Spotlight",
    label: "Spotlight",
    color: "text-[#9146ff]",
    bgColor: "bg-[#9146ff]/20",
    borderColor: "border-[#9146ff]/30",
  },
  {
    value: "Soirée Film",
    label: "Soirée Film",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/30",
  },
  {
    value: "Formation",
    label: "Formation",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/30",
  },
  {
    value: "Jeux communautaire",
    label: "Jeux communautaire",
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/30",
  },
  {
    value: "Apéro",
    label: "Apéro",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
  },
  {
    value: "Organisation Aventura 2026",
    label: "Organisation Aventura 2026",
    color: "text-pink-400",
    bgColor: "bg-pink-500/20",
    borderColor: "border-pink-500/30",
  },
];

const getCategoryConfig = (categoryValue: string): CategoryConfig => {
  return categories.find(cat => cat.value === categoryValue) || categories[0];
};

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

  // Grouper les événements par catégorie et trier
  const groupEventsByCategory = () => {
    const grouped: Record<string, EventWithRegistrations[]> = {};
    
    data.forEach((item) => {
      const category = item.event.category || "Autre";
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    // Trier les événements dans chaque catégorie : du plus récent au plus vieux
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => {
        // Trier par date décroissante (plus récent en premier)
        return new Date(b.event.date).getTime() - new Date(a.event.date).getTime();
      });
    });

    // Trier les catégories par ordre alphabétique
    return Object.entries(grouped).sort((a, b) => {
      return a[0].localeCompare(b[0], 'fr');
    });
  };

  const groupedEvents = groupEventsByCategory();

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
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux événements
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">
          Liste des Événements et Inscriptions
        </h1>
        <p className="text-gray-400">
          Consultez tous les événements et leurs participants
        </p>
      </div>


      {groupedEvents.length === 0 ? (
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-400">Aucun événement pour le moment</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedEvents.map(([category, categoryEvents]) => {
            const catConfig = getCategoryConfig(category);
            return (
              <div key={category}>
                {/* Titre de catégorie avec ligne */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-2xl font-bold text-white">
                      Type d'événement: <span className={catConfig.color}>{category}</span>
                    </h2>
                    <span className="text-gray-400 text-sm">
                      ({categoryEvents.length} {categoryEvents.length > 1 ? "événements" : "événement"})
                    </span>
                  </div>
                  <div className={`h-px ${catConfig.borderColor} border-t`}></div>
                </div>

                {/* Grille de vignettes */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryEvents.map((item) => {
                    const itemCatConfig = getCategoryConfig(item.event.category);
                    return (
                      <div
                        key={item.event.id}
                        className="bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden hover:border-[#9146ff]/50 transition-all hover:shadow-lg hover:shadow-[#9146ff]/20 group"
                      >
                        {/* Image de l'événement */}
                        {item.event.image && (
                          <div className="relative w-full h-48 overflow-hidden bg-gray-800">
                            <img
                              src={item.event.image}
                              alt={item.event.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        
                        {/* Contenu de la vignette */}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-white line-clamp-2 flex-1">
                              {item.event.title}
                            </h3>
                          </div>

                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className={`text-xs px-2 py-1 rounded border ${itemCatConfig.bgColor} ${itemCatConfig.color} ${itemCatConfig.borderColor}`}>
                              {item.event.category}
                            </span>
                            {item.event.isPublished && (
                              <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                                Publié
                              </span>
                            )}
                          </div>

                          <div className="space-y-2 text-sm mb-3">
                            <div className="flex items-center gap-2 text-gray-400">
                              <Calendar className="w-4 h-4" />
                              <span>{formatEventDate(item.event.date)}</span>
                            </div>
                            {item.event.location && (
                              <div className="flex items-center gap-2 text-gray-400">
                                <MapPin className="w-4 h-4" />
                                <span>{item.event.location}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-400">
                              <Users className="w-4 h-4" />
                              <span>{item.registrationCount} inscription{item.registrationCount > 1 ? 's' : ''}</span>
                            </div>
                          </div>

                          {item.event.description && (
                            <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                              {item.event.description}
                            </p>
                          )}

                          {/* Bouton pour voir les inscrits */}
                          <button
                            onClick={() =>
                              setSelectedEvent(
                                selectedEvent === item.event.id ? null : item.event.id
                              )
                            }
                            className="w-full mt-3 bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                          >
                            {selectedEvent === item.event.id ? "Masquer les inscrits" : "Voir les inscrits"}
                          </button>

                          {/* Liste des inscrits */}
                          {selectedEvent === item.event.id && (
                            <div className="mt-4 pt-4 border-t border-gray-700">
                              {item.registrations.length === 0 ? (
                                <p className="text-gray-400 text-center py-2 text-sm">
                                  Aucune inscription
                                </p>
                              ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                  {item.registrations.map((reg) => (
                                    <div
                                      key={reg.id}
                                      className="bg-[#0e0e10] border border-gray-700 rounded-lg p-2"
                                    >
                                      <div className="font-semibold text-white text-sm">
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
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

