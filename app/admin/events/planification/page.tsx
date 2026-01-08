"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getCurrentAdmin } from "@/lib/admin";

const categories = [
  "Spotlight",
  "Soirées communautaires",
  "Ateliers créateurs",
  "Aventura 2025",
];

export default function PlanificationPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Spotlight",
    date: "",
    location: "",
    isPublished: false,
  });
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/events?admin=true", {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("Erreur chargement événements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date) {
      alert("Veuillez remplir le titre et la date");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("✅ Événement créé avec succès !");
        setFormData({
          title: "",
          description: "",
          category: "Spotlight",
          date: "",
          location: "",
          isPublished: false,
        });
        await loadEvents();
      } else {
        const error = await response.json();
        alert(`❌ Erreur: ${error.error || "Impossible de créer l'événement"}`);
      }
    } catch (error) {
      console.error("Erreur création événement:", error);
      alert("❌ Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

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
          Planification des Événements
        </h1>
        <p className="text-gray-400">
          Créez et gérez les événements de la communauté
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire */}
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-6">
            Créer un événement
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Titre *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff] resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Catégorie *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Date *
              </label>
              <input
                type="datetime-local"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Localisation
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="Ex: Discord TENF"
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) =>
                  setFormData({ ...formData, isPublished: e.target.checked })
                }
                className="w-4 h-4 text-[#9146ff] bg-[#0e0e10] border-gray-700 rounded focus:ring-[#9146ff]"
              />
              <label htmlFor="isPublished" className="text-sm text-gray-300">
                Publier sur /events (visible publiquement)
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? "Création..." : "Créer l'événement"}
            </button>
          </form>
        </div>

        {/* Liste des événements */}
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-6">
            Événements créés
          </h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#9146ff]"></div>
            </div>
          ) : events.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              Aucun événement créé
            </p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-400 mb-2">
                        {new Date(event.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-[#9146ff]/20 text-[#9146ff]">
                          {event.category}
                        </span>
                        {event.isPublished && (
                          <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                            Publié
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

