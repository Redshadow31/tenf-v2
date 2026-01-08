"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3, Users, Calendar, TrendingUp } from "lucide-react";

interface RecapData {
  totalEvents: number;
  totalRegistrations: number;
  eventsWithRegistrations: Array<{
    event: {
      id: string;
      title: string;
      date: string;
      category: string;
      isPublished: boolean;
    };
    registrations: Array<any>;
    registrationCount: number;
  }>;
}

export default function RecapPage() {
  const [data, setData] = useState<RecapData | null>(null);
  const [loading, setLoading] = useState(true);

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
        setData({
          totalEvents: result.totalEvents || 0,
          totalRegistrations: result.totalRegistrations || 0,
          eventsWithRegistrations: result.eventsWithRegistrations || [],
        });
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryStats = () => {
    if (!data) return {};
    const stats: Record<string, { count: number; registrations: number }> = {};
    data.eventsWithRegistrations.forEach((item) => {
      const cat = item.event.category;
      if (!stats[cat]) {
        stats[cat] = { count: 0, registrations: 0 };
      }
      stats[cat].count++;
      stats[cat].registrations += item.registrationCount;
    });
    return stats;
  };

  const getAverageRegistrations = () => {
    if (!data || data.totalEvents === 0) return 0;
    return Math.round((data.totalRegistrations / data.totalEvents) * 10) / 10;
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

  const categoryStats = getCategoryStats();

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
          Récapitulatif des Événements
        </h1>
        <p className="text-gray-400">
          Statistiques et analyse des événements TENF
        </p>
      </div>

      {!data || data.totalEvents === 0 ? (
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-400">Aucune donnée disponible</p>
        </div>
      ) : (
        <>
          {/* Statistiques globales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-6 h-6 text-[#9146ff]" />
                <h3 className="text-sm font-semibold text-gray-400">
                  Total Événements
                </h3>
              </div>
              <p className="text-3xl font-bold text-white">
                {data.totalEvents}
              </p>
            </div>

            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-6 h-6 text-blue-400" />
                <h3 className="text-sm font-semibold text-gray-400">
                  Total Inscriptions
                </h3>
              </div>
              <p className="text-3xl font-bold text-white">
                {data.totalRegistrations}
              </p>
            </div>

            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-green-400" />
                <h3 className="text-sm font-semibold text-gray-400">
                  Moyenne par événement
                </h3>
              </div>
              <p className="text-3xl font-bold text-white">
                {getAverageRegistrations()}
              </p>
            </div>

            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-6 h-6 text-purple-400" />
                <h3 className="text-sm font-semibold text-gray-400">
                  Catégories
                </h3>
              </div>
              <p className="text-3xl font-bold text-white">
                {Object.keys(categoryStats).length}
              </p>
            </div>
          </div>

          {/* Statistiques par catégorie */}
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-6">
              Statistiques par catégorie
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(categoryStats).map(([category, stats]) => (
                <div
                  key={category}
                  className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4"
                >
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Événements:</span>
                      <span className="text-white font-semibold">
                        {stats.count}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Inscriptions:</span>
                      <span className="text-white font-semibold">
                        {stats.registrations}
                      </span>
                    </div>
                    {stats.count > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Moyenne:</span>
                        <span className="text-white font-semibold">
                          {Math.round((stats.registrations / stats.count) * 10) / 10}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top événements */}
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">
              Événements les plus populaires
            </h2>
            <div className="space-y-3">
              {[...data.eventsWithRegistrations]
                .sort((a, b) => b.registrationCount - a.registrationCount)
                .slice(0, 5)
                .map((item) => (
                  <div
                    key={item.event.id}
                    className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <h3 className="text-white font-semibold mb-1">
                        {item.event.title}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {item.event.category} •{" "}
                        {new Date(item.event.date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#9146ff]">
                        {item.registrationCount}
                      </p>
                      <p className="text-xs text-gray-400">inscriptions</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

