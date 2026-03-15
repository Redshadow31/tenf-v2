"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";
import { Search, Plus, Check, X, Save, Edit2, Trash2, Calendar, ArrowUpDown } from "lucide-react";

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

function normalizeLogin(value?: string): string {
  return (value || "").trim().toLowerCase();
}

function safeTimestamp(value?: string): number {
  if (!value) return 0;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function dedupeRegistrations(registrations: EventRegistration[]): EventRegistration[] {
  const byLogin = new Map<string, EventRegistration>();
  for (const reg of registrations) {
    const key = normalizeLogin(reg.twitchLogin);
    if (!key) continue;

    const existing = byLogin.get(key);
    if (!existing) {
      byLogin.set(key, reg);
      continue;
    }

    const currentTs = safeTimestamp(reg.registeredAt);
    const existingTs = safeTimestamp(existing.registeredAt);
    if (currentTs >= existingTs) {
      byLogin.set(key, reg);
    }
  }
  return Array.from(byLogin.values());
}

function dedupePresences(presences: EventPresence[]): EventPresence[] {
  const byLogin = new Map<string, EventPresence>();
  for (const presence of presences) {
    const key = normalizeLogin(presence.twitchLogin);
    if (!key) continue;

    const existing = byLogin.get(key);
    if (!existing) {
      byLogin.set(key, presence);
      continue;
    }

    const existingTs = Math.max(safeTimestamp(existing.validatedAt), safeTimestamp(existing.createdAt));
    const currentTs = Math.max(safeTimestamp(presence.validatedAt), safeTimestamp(presence.createdAt));
    const hasClearNewer = currentTs !== existingTs;
    const newer = hasClearNewer ? (currentTs > existingTs ? presence : existing) : presence;
    const older = newer === presence ? existing : presence;
    const resolvedPresent = hasClearNewer
      ? newer.present
      : (newer.present && older.present); // En cas d'égalité, on privilégie l'absence pour éviter un faux présent.

    byLogin.set(key, {
      ...newer,
      present: resolvedPresent,
      // Préserver une note si l'une des deux en a une.
      note: newer.note || older.note,
      // Préserver l'information "ajouté manuellement" si présente dans l'une des lignes.
      addedManually: newer.addedManually || older.addedManually,
      isRegistered: newer.isRegistered || older.isRegistered,
    });
  }
  return Array.from(byLogin.values());
}

function getNormalizedEventData(event: Pick<Event, "registrations" | "presences">) {
  const registrations = dedupeRegistrations(event.registrations || []);
  const presences = dedupePresences(event.presences || []);
  return { registrations, presences };
}

function computeEventPresenceStats(event: Pick<Event, "registrations" | "presences">) {
  const { registrations, presences } = getNormalizedEventData(event);

  const registeredKeys = new Set(registrations.map((r) => normalizeLogin(r.twitchLogin)));
  const presentTotal = presences.filter((p) => p.present).length;

  const presentRegistered = registrations.filter((reg) =>
    presences.some((p) => normalizeLogin(p.twitchLogin) === normalizeLogin(reg.twitchLogin) && p.present)
  ).length;

  const absentRegistered = registrations.length - presentRegistered;

  const manualRows = presences.filter((p) => !registeredKeys.has(p.twitchLogin.toLowerCase()));
  const manualAddedTotal = manualRows.length;
  const manualPresent = manualRows.filter((p) => p.present).length;

  return {
    totalRegistrations: registrations.length,
    presentTotal,
    presentRegistered,
    absentRegistered,
    manualAddedTotal,
    manualPresent,
  };
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
  const [sortBy, setSortBy] = useState<"date" | "presences" | "inscriptions" | "absents" | "category">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

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

  function monthKeyFromDateLike(value: string | Date): string {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 7);
  }

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
            // Ne PAS filtrer par isActive : on veut pouvoir ajouter tous les membres, même inactifs
            // Car ils peuvent avoir participé à un événement même s'ils sont inactifs maintenant
            const allMembersList = (membersData.members || []).map((m: any) => ({
              twitchLogin: m.twitchLogin || '',
              displayName: m.displayName || m.nom || m.twitchLogin || '',
              discordId: m.discordId,
              discordUsername: m.discordUsername,
            })).filter((m: Member) => m.twitchLogin); // Seulement filtrer ceux sans twitchLogin
            
            console.log(`[Presence Modal] Chargé ${allMembersList.length} membres (tous, y compris inactifs)`);
            setAllMembers(allMembersList);
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

      let loadedEvents: Event[] = [];
      if (eventsResponse.ok) {
        const data = await eventsResponse.json();
        loadedEvents = data.events || [];
        
        console.log(`[Presence Page] Événements reçus pour ${selectedMonth}:`, loadedEvents.length);
        if (data.debug) {
          console.log(`[Presence Page] Debug:`, data.debug);
        }
        
        // Log détaillé pour chaque événement
        loadedEvents.forEach((event: Event) => {
          console.log(`[Presence Page] Événement ${event.id} (${event.title}):`, {
            registrations: event.registrations?.length || 0,
            presences: event.presences?.length || 0,
            presencesPresent: event.presences?.filter((p: EventPresence) => p.present).length || 0,
          });
        });
        
        if (loadedEvents.length === 0) {
          console.warn(`[Presence Page] Aucun événement trouvé pour le mois ${selectedMonth}`);
          // Vérifier si c'est un problème de mois ou si vraiment il n'y a pas d'événements
          if (data.debug) {
            console.warn(`[Presence Page] Total événements en DB: ${data.debug.totalEventsInDb}, Événements pour le mois: ${data.debug.eventsForMonth}`);
            if (data.debug.totalEventsInDb > 0 && data.debug.eventsForMonth === 0) {
              console.warn(`[Presence Page] ⚠️ Il y a ${data.debug.totalEventsInDb} événement(s) en DB mais aucun pour le mois ${selectedMonth}. Essayez de changer de mois.`);
            }
          }
        }
        
        setEvents(loadedEvents);
        
        // Si un événement est ouvert dans le modal, mettre à jour ses données
        if (selectedEvent) {
          const updatedEvent = loadedEvents.find((e: Event) => e.id === selectedEvent.id);
          if (updatedEvent) {
            setSelectedEvent(updatedEvent);
          }
        }
      } else {
        const errorData = await eventsResponse.json().catch(() => ({}));
        console.error("Erreur lors du chargement des événements:", eventsResponse.status, eventsResponse.statusText, errorData);
      }

      // Fallback de résilience: si la route mensuelle renvoie vide/erreur,
      // on charge les événements via /api/events puis on filtre le mois côté client.
      if (loadedEvents.length === 0) {
        try {
          let fallbackResponse = await fetch("/api/events?admin=true", { cache: "no-store" });
          if (!fallbackResponse.ok) {
            fallbackResponse = await fetch("/api/events", { cache: "no-store" });
          }

          if (fallbackResponse.ok) {
            const fallbackPayload = await fallbackResponse.json();
            const baseEvents: Event[] = (fallbackPayload.events || []).map((event: any) => ({
              id: event.id,
              title: event.title || "Sans titre",
              description: event.description || "",
              date: event.startAtUtc || event.date,
              category: event.category || "Non classé",
              location: event.location,
              registrations: [],
              presences: [],
            }));

            const filteredByMonth = baseEvents.filter((event) => monthKeyFromDateLike(event.date) === selectedMonth);

            const hydrated = await Promise.all(
              filteredByMonth.map(async (event) => {
                try {
                  const detailResponse = await fetch(`/api/admin/events/presence?eventId=${event.id}`, { cache: "no-store" });
                  if (!detailResponse.ok) return event;
                  const detail = await detailResponse.json();
                  return {
                    ...event,
                    registrations: detail.registrations || [],
                    presences: detail.presences || [],
                  } as Event;
                } catch {
                  return event;
                }
              })
            );

            setEvents(hydrated);

            if (selectedEvent) {
              const updatedEvent = hydrated.find((e) => e.id === selectedEvent.id);
              if (updatedEvent) {
                setSelectedEvent(updatedEvent);
              }
            }
          }
        } catch (fallbackError) {
          console.error("[Presence Page] Fallback /api/events échoué:", fallbackError);
        }
      }

      // Charger les membres seulement si le modal n'est pas encore ouvert (lazy loading)
      // Les membres seront chargés quand le modal s'ouvre si nécessaire
      if (isEventModalOpen && allMembers.length === 0) {
        const membersResponse = await fetch("/api/admin/members");

        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          // Ne PAS filtrer par isActive : on veut pouvoir ajouter tous les membres, même inactifs
          const allMembersList = (membersData.members || []).map((m: any) => ({
            twitchLogin: m.twitchLogin || '',
            displayName: m.displayName || m.nom || m.twitchLogin || '',
            discordId: m.discordId,
            discordUsername: m.discordUsername,
          })).filter((m: Member) => m.twitchLogin); // Seulement filtrer ceux sans twitchLogin
          
          console.log(`[Presence Modal] Chargé ${allMembersList.length} membres depuis loadData`);
          setAllMembers(allMembersList);
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
      const updatedEvents = events.map(e => {
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
      });
      
      setEvents(updatedEvents);
      
      // Mettre à jour selectedEvent si c'est l'événement ouvert dans le modal
      if (selectedEvent && selectedEvent.id === eventId) {
        const updatedEvent = updatedEvents.find(e => e.id === eventId);
        if (updatedEvent) {
          setSelectedEvent(updatedEvent);
        }
      }

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
      } else {
        // Même en cas de succès, recharger les données depuis le serveur pour s'assurer de la synchronisation
        // Cela évite les problèmes de désynchronisation quand plusieurs présences sont ajoutées rapidement
        // Le loadData() mettra automatiquement à jour selectedEvent si l'événement est ouvert
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
      const updatedEvents = events.map(e => {
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
      });
      
      setEvents(updatedEvents);
      
      // Mettre à jour selectedEvent si c'est l'événement ouvert dans le modal
      if (selectedEvent && selectedEvent.id === eventId) {
        const updatedEvent = updatedEvents.find(e => e.id === eventId);
        if (updatedEvent) {
          setSelectedEvent(updatedEvent);
        }
      }
      
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
      const updatedEvents = events.map(e => {
        if (e.id !== eventId) return e;
        
        const presences = (e.presences || []).filter(
          p => p.twitchLogin.toLowerCase() !== twitchLogin.toLowerCase()
        );
        return { ...e, presences };
      });
      
      setEvents(updatedEvents);
      
      // Mettre à jour selectedEvent si c'est l'événement ouvert dans le modal
      if (selectedEvent && selectedEvent.id === eventId) {
        const updatedEvent = updatedEvents.find(e => e.id === eventId);
        if (updatedEvent) {
          setSelectedEvent(updatedEvent);
        }
      }

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

  async function handleDeleteEvent(event: Event) {
    const confirmed = window.confirm(
      `Supprimer définitivement l'événement « ${event.title } » ?\n\nLes inscriptions et présences associées seront également supprimées. Cette action est irréversible.`
    );
    if (!confirmed) return;

    try {
      setDeletingEventId(event.id);
      const response = await fetch(`/api/admin/events/${event.id}`, { method: 'DELETE' });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.error || 'Erreur lors de la suppression de l\'événement');
        return;
      }

      setEvents(prev => prev.filter(e => e.id !== event.id));
      if (selectedEvent?.id === event.id) {
        setIsEventModalOpen(false);
        setSelectedEvent(null);
      }
    } catch (error) {
      console.error('Erreur suppression événement:', error);
      alert('Erreur lors de la suppression de l\'événement');
    } finally {
      setDeletingEventId(null);
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

      {/* Sélecteur de mois et tri */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
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
        
        <div className="flex items-center gap-4">
          <label className="text-sm font-semibold text-gray-300">Trier par :</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
          >
            <option value="date">Date</option>
            <option value="presences">Présents</option>
            <option value="inscriptions">Inscriptions</option>
            <option value="absents">Absents</option>
            <option value="category">Catégorie</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-4 py-2 text-white hover:bg-[#252529] transition-colors flex items-center gap-2"
            title={sortOrder === "asc" ? "Tri croissant" : "Tri décroissant"}
          >
            <ArrowUpDown className="w-4 h-4" />
            <span className="text-sm">{sortOrder === "asc" ? "↑" : "↓"}</span>
          </button>
        </div>
      </div>

      {/* Liste des événements du mois */}
      <div className="space-y-6">
        {events.length === 0 ? (
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-400">Aucun événement pour ce mois</p>
          </div>
        ) : (() => {
          // Fonction de tri générique
          const sortEvents = (eventsToSort: Event[]) => {
            return [...eventsToSort].sort((a, b) => {
              let comparison = 0;
              
              switch (sortBy) {
                case "date":
                  comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
                  break;
                case "presences":
                  const aPresences = computeEventPresenceStats(a).presentRegistered;
                  const bPresences = computeEventPresenceStats(b).presentRegistered;
                  comparison = aPresences - bPresences;
                  break;
                case "inscriptions":
                  const aRegistrations = a.registrations?.length || 0;
                  const bRegistrations = b.registrations?.length || 0;
                  comparison = aRegistrations - bRegistrations;
                  break;
                case "absents":
                  const aAbsents = computeEventPresenceStats(a).absentRegistered;
                  const bAbsents = computeEventPresenceStats(b).absentRegistered;
                  comparison = aAbsents - bAbsents;
                  break;
                case "category":
                  comparison = (a.category || "").localeCompare(b.category || "", 'fr');
                  break;
              }
              
              return sortOrder === "asc" ? comparison : -comparison;
            });
          };
          
          // Séparer les événements en deux groupes : à venir et passés
          const now = new Date();
          const upcomingEvents = sortEvents(
            events.filter(event => new Date(event.date) >= now)
          );
          
          const pastEvents = sortEvents(
            events.filter(event => new Date(event.date) < now)
          );

          return (
            <>
              {/* Section Événements à venir */}
              {upcomingEvents.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-green-400" />
                    Événements à venir ({upcomingEvents.length})
                  </h2>
                  <div className="space-y-4">
                    {upcomingEvents.map((event) => (
            (() => {
              const stats = computeEventPresenceStats(event);
              return (
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
                <div className="flex items-center gap-2">
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
                  <button
                    onClick={() => handleDeleteEvent(event)}
                    disabled={deletingEventId === event.id}
                    className="bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-1"
                    title="Supprimer l'événement (annulé)"
                  >
                    {deletingEventId === event.id ? (
                      <span className="animate-spin">...</span>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Supprimer
                  </button>
                </div>
              </div>

              {/* Aperçu des présences */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Inscrits</p>
                  <p className="text-white font-semibold">{stats.totalRegistrations}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Présents</p>
                  <p className="text-green-400 font-semibold">
                    {stats.presentTotal}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Absents</p>
                  <p className="text-red-400 font-semibold">{stats.absentRegistered}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Ajoutés manuellement</p>
                  <p className="text-yellow-400 font-semibold">
                    {stats.manualPresent}
                  </p>
                </div>
              </div>
            </div>
              );
            })()
                    ))}
                  </div>
                </div>
              )}

              {/* Section Événements passés */}
              {pastEvents.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-gray-400" />
                    Événements passés ({pastEvents.length})
                  </h2>
                  <div className="space-y-4">
                    {pastEvents.map((event) => (
                      (() => {
                        const stats = computeEventPresenceStats(event);
                        return (
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
                          <div className="flex items-center gap-2">
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
                            <button
                              onClick={() => handleDeleteEvent(event)}
                              disabled={deletingEventId === event.id}
                              className="bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-1"
                              title="Supprimer l'événement (annulé)"
                            >
                              {deletingEventId === event.id ? (
                                <span className="animate-spin">...</span>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                              Supprimer
                            </button>
                          </div>
                        </div>

                        {/* Aperçu des présences */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400 mb-1">Inscrits</p>
                            <p className="text-white font-semibold">{stats.totalRegistrations}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Présents</p>
                            <p className="text-green-400 font-semibold">
                              {stats.presentTotal}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Absents</p>
                            <p className="text-red-400 font-semibold">{stats.absentRegistered}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Ajoutés manuellement</p>
                            <p className="text-yellow-400 font-semibold">
                              {stats.manualPresent}
                            </p>
                          </div>
                        </div>
                      </div>
                        );
                      })()
                    ))}
                  </div>
                </div>
              )}

              {/* Message si aucune section n'a d'événements */}
              {upcomingEvents.length === 0 && pastEvents.length === 0 && (
                <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 text-center">
                  <p className="text-gray-400">Aucun événement pour ce mois</p>
                </div>
              )}
            </>
          );
        })()}
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
  // État local pour l'événement qui se synchronise avec les props
  const [localEvent, setLocalEvent] = useState<Event>(event);

  // Synchroniser l'événement local avec les props quand elles changent
  useEffect(() => {
    setLocalEvent(event);
  }, [event]);

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
    const lowerQuery = query.toLowerCase().trim();
    // Normaliser la requête : remplacer les espaces par des underscores pour la recherche flexible
    const normalizedQuery = lowerQuery.replace(/\s+/g, '_');
    
    return allMembers.filter(m => {
      // Exclure les membres déjà présents
      const isAlreadyPresent = localEvent.presences?.some(
        p => p.twitchLogin.toLowerCase() === m.twitchLogin.toLowerCase()
      );
      if (isAlreadyPresent) return false;
      
      // Normaliser les valeurs pour la recherche
      const normalizedTwitchLogin = m.twitchLogin.toLowerCase();
      const normalizedDisplayName = m.displayName.toLowerCase();
      const normalizedDiscordUsername = m.discordUsername?.toLowerCase() || '';
      
      // Recherche flexible : avec et sans underscores
      const queryVariations = [
        lowerQuery,
        normalizedQuery,
        lowerQuery.replace(/_/g, ''),
        normalizedQuery.replace(/_/g, ''),
      ];
      
      return queryVariations.some(variation => 
        normalizedTwitchLogin.includes(variation) ||
        normalizedDisplayName.includes(variation) ||
        normalizedDiscordUsername.includes(variation) ||
        // Recherche aussi avec remplacement des underscores par des espaces
        normalizedTwitchLogin.replace(/_/g, '').includes(variation.replace(/_/g, '')) ||
        normalizedDisplayName.replace(/_/g, '').includes(variation.replace(/_/g, '')) ||
        normalizedDiscordUsername.replace(/_/g, '').includes(variation.replace(/_/g, ''))
      );
    }).slice(0, 10);
  }, [allMembers, localEvent.presences]);

  const filteredMembers = useMemo(
    () => filterMembers(debouncedSearchQuery),
    [debouncedSearchQuery, filterMembers]
  );
  const { registrations, presences } = getNormalizedEventData(localEvent);
  const stats = computeEventPresenceStats(localEvent);

  // Créer une liste combinée : présences + inscrits non présents
  const allParticipants = new Map<string, {
    member: Member;
    isRegistered: boolean;
    presence?: EventPresence;
  }>();

  // Ajouter les inscrits
  registrations.forEach(reg => {
    allParticipants.set(normalizeLogin(reg.twitchLogin), {
      member: {
        twitchLogin: reg.twitchLogin,
        displayName: reg.displayName,
        discordId: reg.discordId,
        discordUsername: reg.discordUsername,
      },
      isRegistered: true,
      presence: presences.find(p => normalizeLogin(p.twitchLogin) === normalizeLogin(reg.twitchLogin)),
    });
  });

  // Ajouter les présences ajoutées manuellement (non inscrits)
  presences.forEach(presence => {
    if (!allParticipants.has(normalizeLogin(presence.twitchLogin))) {
      allParticipants.set(normalizeLogin(presence.twitchLogin), {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div
        className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{localEvent.title}</h2>
            <p className="text-gray-400 text-sm">{formatEventDateForModal(localEvent.date)}</p>
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
                        onTogglePresence(localEvent.id, member, false);
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
                            onClick={() => onTogglePresence(localEvent.id, member, isRegistered)}
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
                                    onSaveNote(localEvent.id, member.twitchLogin, editingNote.note);
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
                              onClick={() => onRemovePresence(localEvent.id, member.twitchLogin)}
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
            <p className="text-white font-bold text-xl">{stats.totalRegistrations}</p>
          </div>
          <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Présents</p>
            <p className="text-green-400 font-bold text-xl">
              {stats.presentTotal}
            </p>
          </div>
          <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Absents</p>
            <p className="text-red-400 font-bold text-xl">{stats.absentRegistered}</p>
          </div>
          <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Ajoutés manuellement</p>
            <p className="text-yellow-400 font-bold text-xl">
              {stats.manualPresent}
            </p>
          </div>
        </div>

        {/* Bouton de sauvegarde/validation */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Fermer
          </button>
          <button
            onClick={async () => {
              // Les modifications sont déjà sauvegardées automatiquement
              // Ce bouton sert de confirmation visuelle et ferme le modal
              // On peut aussi ajouter un message de confirmation
              alert("✅ Toutes les présences ont été sauvegardées avec succès !");
              onClose();
            }}
            disabled={saving}
            className="bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Valider et fermer
              </>
            )}
          </button>
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
      // Envoyer la date en ISO (moment correct en heure locale) pour éviter le décalage +1h côté serveur (UTC)
      const payload = {
        ...formData,
        date: new Date(formData.date).toISOString(),
      };
      const response = await fetch('/api/admin/events/presence', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
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

