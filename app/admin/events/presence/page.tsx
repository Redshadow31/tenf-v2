"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";
import { Search, Plus, Check, X, Save, Edit2, Trash2, Calendar } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  category: string;
  location?: string;
  presences?: EventPresence[];
  registrations?: EventRegistration[];
}

interface EventPresence {
  id: string;
  twitchLogin: string;
  displayName: string;
  discordId?: string;
  discordUsername?: string;
  isRegistered: boolean;
  present: boolean;
  note?: string;
  validatedAt?: string;
  validatedBy?: string;
  addedManually: boolean;
  createdAt: string;
}

interface EventRegistration {
  id: string;
  twitchLogin: string;
  displayName: string;
  discordId?: string;
  discordUsername?: string;
  registeredAt: string;
  notes?: string;
}

interface Member {
  twitchLogin: string;
  displayName: string;
  discordId?: string;
  discordUsername?: string;
}

export default function EventPresencePage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingNote, setEditingNote] = useState<{ eventId: string; twitchLogin: string; note: string } | null>(null);

  useEffect(() => {
    async function checkAccess() {
      try {
        // Utiliser l'API pour vérifier l'accès (supporte le cache Blobs et les rôles dans données membres)
        const response = await fetch('/api/user/role');
        if (response.ok) {
          const data = await response.json();
          setHasAccess(data.hasAdminAccess === true);
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error("Erreur vérification accès:", error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }
    checkAccess();

    // Initialiser avec le mois en cours
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${year}-${month}`);
  }, []);

  useEffect(() => {
    if (hasAccess && selectedMonth) {
      loadData();
    }
  }, [hasAccess, selectedMonth]);

  // Charger les membres quand le modal s'ouvre (lazy loading)
  useEffect(() => {
    if (isEventModalOpen && allMembers.length === 0) {
      async function loadMembers() {
        try {
          const membersResponse = await fetch("/api/admin/members", {
            next: { revalidate: 60 },
          });

          if (membersResponse.ok) {
            const membersData = await membersResponse.json();
            const activeMembers = (membersData.members || []).filter((m: any) => m.isActive !== false);
            setAllMembers(activeMembers.map((m: any) => ({
              twitchLogin: m.twitchLogin || '',
              displayName: m.displayName || m.nom || m.twitchLogin || '',
              discordId: m.discordId,
              discordUsername: m.discordUsername,
            })).filter((m: Member) => m.twitchLogin));
          }
        } catch (error) {
          console.error("Erreur lors du chargement des membres:", error);
        }
      }
      loadMembers();
    }
  }, [isEventModalOpen, allMembers.length]);

  async function loadData() {
    if (!selectedMonth) return;
    
    try {
      setLoading(true);

      // Charger les événements du mois avec leurs présences
      // Le cache est géré côté serveur (revalidate: 30)
      const eventsResponse = await fetch(`/api/admin/events/presence?month=${selectedMonth}`);

      if (eventsResponse.ok) {
        const data = await eventsResponse.json();
        setEvents(data.events || []);
      } else {
        console.error("Erreur lors du chargement des événements:", eventsResponse.status, eventsResponse.statusText);
      }

      // Charger les membres seulement si le modal n'est pas encore ouvert (lazy loading)
      // Les membres seront chargés quand le modal s'ouvre si nécessaire
      if (isEventModalOpen && allMembers.length === 0) {
        const membersResponse = await fetch("/api/admin/members");

        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          const activeMembers = (membersData.members || []).filter((m: any) => m.isActive !== false);
          setAllMembers(activeMembers.map((m: any) => ({
            twitchLogin: m.twitchLogin || '',
            displayName: m.displayName || m.nom || m.twitchLogin || '',
            discordId: m.discordId,
            discordUsername: m.discordUsername,
          })).filter((m: Member) => m.twitchLogin));
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  }

  function getMonthOptions(): string[] {
    const options: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      options.push(`${year}-${month}`);
    }
    return options;
  }

  function formatMonthKey(key: string): string {
    const [year, month] = key.split('-');
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  function formatEventDate(dateStr: string): string {
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
  }

  async function handleTogglePresence(eventId: string, member: Member, isRegistered: boolean) {
    try {
      setSaving(true);
      
      // Vérifier si la présence existe déjà
      const event = events.find(e => e.id === eventId);
      const existingPresence = event?.presences?.find(
        p => p.twitchLogin.toLowerCase() === member.twitchLogin.toLowerCase()
      );
      
      const isPresent = existingPresence ? !existingPresence.present : true;

      // Mise à jour optimiste : mettre à jour l'UI immédiatement
      setEvents(prevEvents => prevEvents.map(e => {
        if (e.id !== eventId) return e;
        
        const presences = e.presences || [];
        const presenceIndex = presences.findIndex(
          p => p.twitchLogin.toLowerCase() === member.twitchLogin.toLowerCase()
        );
        
        if (presenceIndex >= 0) {
          // Mettre à jour la présence existante
          const updatedPresences = [...presences];
          updatedPresences[presenceIndex] = {
            ...updatedPresences[presenceIndex],
            present: isPresent,
          };
          return { ...e, presences: updatedPresences };
        } else {
          // Ajouter une nouvelle présence
          const newPresence: EventPresence = {
            id: `${Date.now()}-${member.twitchLogin}`,
            twitchLogin: member.twitchLogin,
            displayName: member.displayName,
            discordId: member.discordId,
            discordUsername: member.discordUsername,
            isRegistered,
            present: isPresent,
            addedManually: !isRegistered,
            createdAt: new Date().toISOString(),
          };
          return { ...e, presences: [...presences, newPresence] };
        }
      }));

      const response = await fetch('/api/admin/events/presence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          member,
          present: isPresent,
          isRegistered,
        }),
      });

      if (!response.ok) {
        // En cas d'erreur, recharger les données pour restaurer l'état correct
        const error = await response.json();
        alert(`Erreur : ${error.error || 'Erreur inconnue'}`);
        await loadData();
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la présence:", error);
      alert("Erreur lors de la mise à jour de la présence");
      // Recharger les données en cas d'erreur
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNote(eventId: string, twitchLogin: string, note: string) {
    try {
      setSaving(true);
      
      const trimmedNote = note.trim() || undefined;
      
      // Mise à jour optimiste
      setEvents(prevEvents => prevEvents.map(e => {
        if (e.id !== eventId) return e;
        
        const presences = e.presences || [];
        const presenceIndex = presences.findIndex(
          p => p.twitchLogin.toLowerCase() === twitchLogin.toLowerCase()
        );
        
        if (presenceIndex >= 0) {
          const updatedPresences = [...presences];
          updatedPresences[presenceIndex] = {
            ...updatedPresences[presenceIndex],
            note: trimmedNote,
          };
          return { ...e, presences: updatedPresences };
        }
        return e;
      }));
      
      setEditingNote(null);

      const response = await fetch('/api/admin/events/presence', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          twitchLogin,
          note: trimmedNote,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Erreur : ${error.error || 'Erreur inconnue'}`);
        await loadData();
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la note:", error);
      alert("Erreur lors de la sauvegarde de la note");
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  async function handleRemovePresence(eventId: string, twitchLogin: string) {
    if (!confirm(`Voulez-vous supprimer la présence de ${twitchLogin} ?`)) {
      return;
    }

    try {
      setSaving(true);
      
      // Mise à jour optimiste
      setEvents(prevEvents => prevEvents.map(e => {
        if (e.id !== eventId) return e;
        
        const presences = (e.presences || []).filter(
          p => p.twitchLogin.toLowerCase() !== twitchLogin.toLowerCase()
        );
        return { ...e, presences };
      }));

      const response = await fetch(`/api/admin/events/presence?eventId=${eventId}&twitchLogin=${twitchLogin}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Erreur : ${error.error || 'Erreur inconnue'}`);
        await loadData();
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la présence:", error);
      alert("Erreur lors de la suppression de la présence");
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  if (loading && !events.length) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff] mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white p-8">
        <div className="bg-[#1a1a1d] border border-red-500 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Accès refusé</h1>
          <p className="text-gray-400">Vous n'avez pas les permissions nécessaires.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white p-8">
      <div className="mb-8">
        <Link
          href="/admin/events"
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour au hub Événements
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Gestion des Présences</h1>
            <p className="text-gray-400">Gérer les présences aux événements par mois</p>
          </div>
          <button
            onClick={() => setIsCreateEventModalOpen(true)}
            className="bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Ajouter un événement passé
          </button>
        </div>
      </div>

      {/* Sélecteur de mois */}
      <div className="mb-6 flex items-center gap-4">
        <label className="text-sm font-semibold text-gray-300">Mois :</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
        >
          {getMonthOptions().map(option => (
            <option key={option} value={option}>
              {formatMonthKey(option)}
            </option>
          ))}
        </select>
      </div>

      {/* Liste des événements du mois */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-400">Aucun événement pour ce mois</p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-2">{event.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatEventDate(event.date)}</span>
                    </div>
                    {event.category && (
                      <span className="px-2 py-1 bg-gray-700 rounded text-xs">{event.category}</span>
                    )}
                    {event.location && (
                      <span className="text-gray-500">📍 {event.location}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedEvent(event);
                    setIsEventModalOpen(true);
                    setSearchQuery("");
                  }}
                  className="bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  Gérer les présences
                </button>
              </div>

              {/* Aperçu des présences */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Inscrits</p>
                  <p className="text-white font-semibold">{event.registrations?.length || 0}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Présents</p>
                  <p className="text-green-400 font-semibold">
                    {event.presences?.filter(p => p.present).length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Absents</p>
                  <p className="text-red-400 font-semibold">
                    {event.presences?.filter(p => !p.present).length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Ajoutés manuellement</p>
                  <p className="text-yellow-400 font-semibold">
                    {event.presences?.filter(p => p.addedManually).length || 0}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de gestion des présences pour un événement */}
      {isEventModalOpen && selectedEvent && (
        <EventPresenceModal
          event={selectedEvent}
          allMembers={allMembers}
          onClose={() => {
            setIsEventModalOpen(false);
            setSelectedEvent(null);
            setSearchQuery("");
            setEditingNote(null);
          }}
          onTogglePresence={handleTogglePresence}
          onSaveNote={handleSaveNote}
          onRemovePresence={handleRemovePresence}
          saving={saving}
        />
      )}

      {/* Modal de création d'événement passé */}
      {isCreateEventModalOpen && (
        <CreateEventModal
          onClose={() => setIsCreateEventModalOpen(false)}
          onSuccess={async () => {
            setIsCreateEventModalOpen(false);
            await loadData();
          }}
        />
      )}
    </div>
  );
}

// Modal de gestion des présences
function EventPresenceModal({
  event,
  allMembers,
  onClose,
  onTogglePresence,
  onSaveNote,
  onRemovePresence,
  saving,
}: {
  event: Event;
  allMembers: Member[];
  onClose: () => void;
  onTogglePresence: (eventId: string, member: Member, isRegistered: boolean) => Promise<void>;
  onSaveNote: (eventId: string, twitchLogin: string, note: string) => Promise<void>;
  onRemovePresence: (eventId: string, twitchLogin: string) => Promise<void>;
  saving: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingNote, setEditingNote] = useState<{ twitchLogin: string; note: string } | null>(null);

  // Debounce de la recherche (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  function formatEventDateForModal(dateStr: string): string {
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
  }

  const filterMembers = useCallback((query: string): Member[] => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return allMembers.filter(m => {
      // Exclure les membres déjà présents
      const isAlreadyPresent = event.presences?.some(
        p => p.twitchLogin.toLowerCase() === m.twitchLogin.toLowerCase()
      );
      if (isAlreadyPresent) return false;
      
      return (
        m.displayName.toLowerCase().includes(lowerQuery) ||
        m.twitchLogin.toLowerCase().includes(lowerQuery) ||
        m.discordUsername?.toLowerCase().includes(lowerQuery)
      );
    }).slice(0, 10);
  }, [allMembers, event.presences]);

  const filteredMembers = useMemo(
    () => filterMembers(debouncedSearchQuery),
    [debouncedSearchQuery, filterMembers]
  );
  const registrations = event.registrations || [];
  const presences = event.presences || [];

  // Créer une liste combinée : présences + inscrits non présents
  const allParticipants = new Map<string, {
    member: Member;
    isRegistered: boolean;
    presence?: EventPresence;
  }>();

  // Ajouter les inscrits
  registrations.forEach(reg => {
    allParticipants.set(reg.twitchLogin.toLowerCase(), {
      member: {
        twitchLogin: reg.twitchLogin,
        displayName: reg.displayName,
        discordId: reg.discordId,
        discordUsername: reg.discordUsername,
      },
      isRegistered: true,
      presence: presences.find(p => p.twitchLogin.toLowerCase() === reg.twitchLogin.toLowerCase()),
    });
  });

  // Ajouter les présences ajoutées manuellement (non inscrits)
  presences.forEach(presence => {
    if (!allParticipants.has(presence.twitchLogin.toLowerCase())) {
      allParticipants.set(presence.twitchLogin.toLowerCase(), {
        member: {
          twitchLogin: presence.twitchLogin,
          displayName: presence.displayName,
          discordId: presence.discordId,
          discordUsername: presence.discordUsername,
        },
        isRegistered: false,
        presence,
      });
    }
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{event.title}</h2>
            <p className="text-gray-400 text-sm">{formatEventDateForModal(event.date)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Recherche et ajout de membre */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowAddMember(e.target.value.trim().length > 0);
                }}
                onFocus={() => setShowAddMember(searchQuery.trim().length > 0)}
                placeholder="Rechercher un membre à ajouter..."
                className="w-full bg-[#0e0e10] border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff]"
              />
              {showAddMember && filteredMembers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-[#0e0e10] border border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {filteredMembers.map((member) => (
                    <button
                      key={member.twitchLogin}
                      type="button"
                      onClick={() => {
                        onTogglePresence(event.id, member, false);
                        setSearchQuery("");
                        setShowAddMember(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors border-b border-gray-700 last:border-b-0"
                    >
                      <div className="font-semibold text-white">{member.displayName}</div>
                      <div className="text-gray-400 text-sm">
                        {member.twitchLogin} {member.discordUsername && `• ${member.discordUsername}`}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tableau des participants */}
        <div className="bg-[#0e0e10] border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Membre</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">Inscrit</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">Présent</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Note</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(allParticipants.values()).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      Aucun participant pour cet événement
                    </td>
                  </tr>
                ) : (
                  Array.from(allParticipants.values())
                    .sort((a, b) => a.member.displayName.localeCompare(b.member.displayName, 'fr', { sensitivity: 'base' }))
                    .map(({ member, isRegistered, presence }) => (
                      <tr
                        key={member.twitchLogin}
                        className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-semibold text-white">{member.displayName}</div>
                            <div className="text-gray-500 text-xs">{member.twitchLogin}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isRegistered ? (
                            <span className="inline-block px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                              ✓
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 bg-gray-700 text-gray-400 rounded text-xs">
                              —
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => onTogglePresence(event.id, member, isRegistered)}
                            disabled={saving}
                            className={`inline-flex items-center justify-center w-8 h-8 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              presence?.present
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-gray-700 hover:bg-gray-600 text-gray-400'
                            }`}
                          >
                            {presence?.present ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="max-w-md">
                            {editingNote?.twitchLogin === member.twitchLogin ? (
                              <div className="flex items-center gap-2">
                                <textarea
                                  value={editingNote.note}
                                  onChange={(e) => setEditingNote({ ...editingNote, note: e.target.value })}
                                  className="flex-1 bg-[#0e0e10] border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-[#9146ff] resize-none"
                                  rows={2}
                                  placeholder="Ajouter une note..."
                                />
                                <button
                                  onClick={() => {
                                    onSaveNote(event.id, member.twitchLogin, editingNote.note);
                                  }}
                                  disabled={saving}
                                  className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {saving ? '...' : '✓'}
                                </button>
                                <button
                                  onClick={() => setEditingNote(null)}
                                  disabled={saving}
                                  className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 text-gray-300 text-sm">
                                  {presence?.note ? (
                                    <div className="whitespace-pre-wrap">{presence.note}</div>
                                  ) : (
                                    <span className="text-gray-500 italic">Aucune note</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => setEditingNote({ twitchLogin: member.twitchLogin, note: presence?.note || '' })}
                                  className="text-[#9146ff] hover:text-[#7c3aed] transition-colors"
                                  title="Modifier la note"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {presence && (
                            <button
                              onClick={() => onRemovePresence(event.id, member.twitchLogin)}
                              disabled={saving}
                              className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Supprimer la présence"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Statistiques */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Total Inscrits</p>
            <p className="text-white font-bold text-xl">{registrations.length}</p>
          </div>
          <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Présents</p>
            <p className="text-green-400 font-bold text-xl">
              {presences.filter(p => p.present).length}
            </p>
          </div>
          <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Absents</p>
            <p className="text-red-400 font-bold text-xl">
              {presences.filter(p => !p.present).length}
            </p>
          </div>
          <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Ajoutés manuellement</p>
            <p className="text-yellow-400 font-bold text-xl">
              {presences.filter(p => p.addedManually).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal de création d'événement passé
function CreateEventModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    category: 'Spotlight',
    description: '',
    location: '',
  });
  const [saving, setSaving] = useState(false);

  const categories = [
    'Spotlight',
    'Soirée Film',
    'Formation',
    'Jeux communautaire',
    'Apéro',
    'Organisation Aventura 2026',
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.title || !formData.date || !formData.category) {
      alert('Le titre, la date et la catégorie sont requis');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/events/presence', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Événement créé avec succès !');
        await onSuccess();
      } else {
        const error = await response.json();
        alert(`Erreur : ${error.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error);
      alert('Erreur lors de la création de l\'événement');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Créer un événement passé</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Titre *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full bg-[#0e0e10] border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Date et heure *
              </label>
              <input
                type="datetime-local"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full bg-[#0e0e10] border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Catégorie *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="w-full bg-[#0e0e10] border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Lieu
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full bg-[#0e0e10] border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full bg-[#0e0e10] border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff] resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? 'Création...' : (
                <>
                  <Plus className="w-5 h-5" />
                  Créer l'événement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

