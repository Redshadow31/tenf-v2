"use client";

import React, { useState, useEffect } from "react";
import IntegrationModal from "@/components/IntegrationModal";

type Integration = {
  id: string;
  title: string;
  description: string;
  image?: string;
  date: string; // ISO date string
  category: string;
  location?: string;
};

// Catégories d'intégration (seront gérées par /admin/evaluations/planification)
const categories: string[] = [
  "Intégration standard",
  "Intégration rapide",
  "Intégration spéciale",
];

export default function Page() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Charger les intégrations depuis l'API
  useEffect(() => {
    async function loadIntegrations() {
      try {
        setLoading(true);
        // TODO: Créer l'API /api/integrations
        const response = await fetch('/api/integrations', {
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          setIntegrations(data.integrations || []);
        }
      } catch (error) {
        console.error('Erreur chargement intégrations:', error);
      } finally {
        setLoading(false);
      }
    }
    loadIntegrations();
  }, []);

  const getFilteredIntegrations = () => {
    if (!activeFilter) return integrations;
    return integrations.filter((integration) => integration.category === activeFilter);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Intégration standard":
        return "bg-[#9146ff]";
      case "Intégration rapide":
        return "bg-blue-500";
      case "Intégration spéciale":
        return "bg-green-500";
      default:
        return "bg-gray-700";
    }
  };

  const handleIntegrationClick = (integration: Integration) => {
    setSelectedIntegration(integration);
    setIsModalOpen(true);
  };

  const handleRegister = async () => {
    if (!selectedIntegration) return;
    
    try {
      // TODO: Créer l'API /api/integrations/[id]/register
      const response = await fetch(`/api/integrations/${selectedIntegration.id}/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message || 'Inscription réussie !'}`);
        setIsModalOpen(false);
      } else {
        const error = await response.json();
        if (response.status === 409) {
          alert(`ℹ️ ${error.error || 'Vous êtes déjà inscrit à cette intégration'}`);
        } else {
          alert(`❌ ${error.error || 'Erreur lors de l\'inscription'}`);
        }
      }
    } catch (error) {
      console.error('Erreur inscription:', error);
      alert('❌ Erreur lors de l\'inscription');
    }
  };

  // Fonction pour générer le calendrier
  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Lundi = 0

    const days: (Date | null)[] = [];
    
    // Ajouter les jours vides du début
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Ajouter les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getIntegrationForDate = (date: Date | null) => {
    if (!date) return null;
    return getFilteredIntegrations().find((integration) => {
      const integrationDate = new Date(integration.date);
      return (
        integrationDate.getDate() === date.getDate() &&
        integrationDate.getMonth() === date.getMonth() &&
        integrationDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Mettre à jour le mois actuel en fonction des intégrations
  useEffect(() => {
    if (integrations.length > 0) {
      const firstIntegrationDate = new Date(integrations[0].date);
      setCurrentMonth(new Date(firstIntegrationDate.getFullYear(), firstIntegrationDate.getMonth(), 1));
    }
  }, [integrations]);

  const calendarDays = generateCalendar();
  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  return (
    <div className="space-y-8">
      {/* Titre */}
      <h1 className="text-3xl font-bold text-white">Intégration</h1>

      {/* Filtres */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveFilter(activeFilter === category ? null : category)}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-all ${
                activeFilter === category
                  ? getCategoryColor(category)
                  : "bg-[#1a1a1d] border border-gray-700 hover:border-[#9146ff]/50"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Calendrier */}
      <div className="card bg-[#1a1a1d] border border-gray-700 p-6">
        {/* En-tête du calendrier */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="rounded-lg bg-[#0e0e10] p-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="rounded-lg bg-[#0e0e10] p-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <span className="text-lg font-semibold text-white">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
          </div>
        </div>

        {/* Jours de la semaine */}
        <div className="mb-4 grid grid-cols-7 gap-2">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((date, index) => {
            const integration = getIntegrationForDate(date);
            return (
              <div
                key={index}
                className={`min-h-[80px] rounded-lg border p-2 transition-colors ${
                  date
                    ? integration
                      ? "cursor-pointer border-gray-600 bg-[#0e0e10] hover:bg-[#1a1a1d]"
                      : "border-gray-800 bg-[#0e0e10]"
                    : "border-transparent"
                }`}
                onClick={() => integration && handleIntegrationClick(integration)}
              >
                {date && (
                  <>
                    <div className="mb-1 text-sm text-gray-400">{date.getDate()}</div>
                    {integration && (
                      <div
                        className={`rounded px-2 py-1 text-xs font-bold text-white ${getCategoryColor(
                          integration.category
                        )}`}
                      >
                        {integration.title}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal intégration */}
      {selectedIntegration && (
        <IntegrationModal
          integration={{
            ...selectedIntegration,
            date: new Date(selectedIntegration.date),
          }}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedIntegration(null);
          }}
          onRegister={handleRegister}
        />
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#9146ff]"></div>
          <p className="text-gray-400 mt-4">Chargement des intégrations...</p>
        </div>
      )}

      {!loading && integrations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">Aucune intégration disponible pour le moment.</p>
        </div>
      )}
    </div>
  );
}

