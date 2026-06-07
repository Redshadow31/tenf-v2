"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildPastCatalogUnique,
  catalogFirstBucket,
  type CatalogSortMode,
  type CatalogViewMode,
  type FormationEventItem,
  type PastFormationCatalogItem,
} from "@/components/member/formations/catalog/formationsCatalogUtils";

type TwitchLinkState = {
  loading: boolean;
  connected: boolean;
};

export function useFormationsCatalogPage() {
  const [formations, setFormations] = useState<FormationEventItem[]>([]);
  const [pendingTitles, setPendingTitles] = useState<Set<string>>(new Set());
  const [submittingTitle, setSubmittingTitle] = useState("");
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());
  const [registeringEventId, setRegisteringEventId] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<FormationEventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [twitchLinkState, setTwitchLinkState] = useState<TwitchLinkState>({
    loading: true,
    connected: false,
  });
  const [catalogQuery, setCatalogQuery] = useState("");
  const [showInterestedOnly, setShowInterestedOnly] = useState(false);
  const [catalogViewMode, setCatalogViewMode] = useState<CatalogViewMode>("grid");
  const [catalogSort, setCatalogSort] = useState<CatalogSortMode>("alpha");
  const [catalogLetter, setCatalogLetter] = useState<string | null>(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [eventsResponse, requestsResponse] = await Promise.all([
          fetch("/api/events", { cache: "no-store" }),
          fetch("/api/members/me/formation-requests", { cache: "no-store" }),
        ]);

        const eventsBody = await eventsResponse.json();
        const requestsBody = requestsResponse.ok ? await requestsResponse.json() : { pendingTitles: [] };

        const rows = (eventsBody.events || []).filter((event: FormationEventItem) =>
          (event.category || "").toLowerCase().includes("formation"),
        );
        setFormations(rows);
        setPendingTitles(new Set<string>((requestsBody.pendingTitles || []).map((title: string) => String(title))));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/auth/twitch/link/status", { cache: "no-store" });
        const body = await response.json().catch(() => ({}));
        setTwitchLinkState({
          loading: false,
          connected: response.ok && body?.connected === true,
        });
      } catch {
        setTwitchLinkState({ loading: false, connected: false });
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/events/registrations/me", {
          cache: "no-store",
          credentials: "include",
        });
        if (!response.ok) {
          if (response.status === 401) setRegisteredEventIds(new Set());
          return;
        }
        const data = await response.json();
        const ids = Array.isArray(data?.registeredEventIds)
          ? data.registeredEventIds.filter((id: unknown): id is string => typeof id === "string")
          : [];
        setRegisteredEventIds(new Set(ids));
      } catch {
        setRegisteredEventIds(new Set());
      }
    })();
  }, []);

  const nowTs = Date.now();
  const sortedFormations = useMemo(
    () => formations.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [formations],
  );
  const upcomingFormations = useMemo(
    () => sortedFormations.filter((formation) => new Date(formation.date).getTime() >= nowTs),
    [sortedFormations, nowTs],
  );
  const pastFormationsUnique = useMemo(
    () => buildPastCatalogUnique(sortedFormations, nowTs),
    [sortedFormations, nowTs],
  );

  const filteredPastFormations = useMemo(() => {
    const query = catalogQuery.trim().toLowerCase();
    return pastFormationsUnique.filter((formation) => {
      const matchesQuery = !query || formation.title.toLowerCase().includes(query);
      const matchesInterested = !showInterestedOnly || pendingTitles.has(formation.title);
      return matchesQuery && matchesInterested;
    });
  }, [catalogQuery, pastFormationsUnique, pendingTitles, showInterestedOnly]);

  const interestedCount = useMemo(
    () => pastFormationsUnique.filter((formation) => pendingTitles.has(formation.title)).length,
    [pastFormationsUnique, pendingTitles],
  );

  const registeredUpcoming = useMemo(
    () => upcomingFormations.filter((f) => registeredEventIds.has(f.id)).length,
    [upcomingFormations, registeredEventIds],
  );

  const catalogLetterChips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of filteredPastFormations) {
      const bucket = catalogFirstBucket(f.title);
      counts.set(bucket, (counts.get(bucket) || 0) + 1);
    }
    return Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  }, [filteredPastFormations]);

  const catalogSuggestionsForModal = useMemo(
    () => pastFormationsUnique.map(({ title, sourceEventId }) => ({ title, sourceEventId })),
    [pastFormationsUnique],
  );

  const displayedPastCatalog = useMemo(() => {
    let list: PastFormationCatalogItem[] = catalogLetter
      ? filteredPastFormations.filter((f) => catalogFirstBucket(f.title) === catalogLetter)
      : filteredPastFormations;
    list = [...list].sort((a, b) =>
      catalogSort === "alpha" ? a.title.localeCompare(b.title, "fr") : b.title.localeCompare(a.title, "fr"),
    );
    return list;
  }, [filteredPastFormations, catalogLetter, catalogSort]);

  const refreshPendingFormationRequests = useCallback(async () => {
    try {
      const requestsResponse = await fetch("/api/members/me/formation-requests", { cache: "no-store" });
      if (!requestsResponse.ok) return;
      const requestsBody = await requestsResponse.json();
      setPendingTitles(new Set<string>((requestsBody.pendingTitles || []).map((title: string) => String(title))));
    } catch {
      /* ignore */
    }
  }, []);

  const submitInterest = useCallback(
    async (formationTitle: string, sourceEventId?: string | null, memberMessage?: string | null) => {
      setFeedback("");
      setSubmittingTitle(formationTitle);
      try {
        const payload: Record<string, unknown> = {
          formationTitle,
          sourceEventId: sourceEventId || null,
        };
        if (memberMessage?.trim()) {
          payload.message = memberMessage.trim().slice(0, 2000);
        }
        const response = await fetch("/api/members/me/formation-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = await response.json();
        if (!response.ok) {
          setFeedback(body.error || "Impossible d'enregistrer ta demande.");
          return;
        }
        setPendingTitles((previous) => new Set([...Array.from(previous), formationTitle]));
        setFeedback(
          body.created
            ? "Demande enregistrée. Merci, on remonte ça à l'équipe formation."
            : "Demande déjà enregistrée pour cette formation.",
        );
        void refreshPendingFormationRequests();
      } catch {
        setFeedback("Erreur réseau. Réessaie dans quelques instants.");
      } finally {
        setSubmittingTitle("");
      }
    },
    [refreshPendingFormationRequests],
  );

  const toggleRegistration = useCallback(async (eventId: string) => {
    const isRegistered = registeredEventIds.has(eventId);
    setRegisteringEventId(eventId);
    setFeedback("");
    try {
      const response = await fetch(`/api/events/${eventId}/${isRegistered ? "unregister" : "register"}`, {
        method: isRegistered ? "DELETE" : "POST",
        credentials: "include",
        headers: isRegistered ? undefined : { "Content-Type": "application/json" },
        body: isRegistered ? undefined : JSON.stringify({}),
      });
      const body = await response.json();
      if (response.ok || (!isRegistered && response.status === 409)) {
        setRegisteredEventIds((previous) => {
          const next = new Set(previous);
          if (isRegistered) next.delete(eventId);
          else next.add(eventId);
          return next;
        });
        setFeedback(
          isRegistered
            ? body.message || "Désinscription enregistrée."
            : response.status === 409
              ? "Tu es déjà inscrit à cette formation."
              : body.message || "Inscription enregistrée.",
        );
        return;
      }
      setFeedback(body.error || "Impossible de mettre à jour ton inscription.");
    } catch {
      setFeedback("Erreur réseau. Réessaie dans quelques instants.");
    } finally {
      setRegisteringEventId("");
    }
  }, [registeredEventIds]);

  return {
    loading,
    feedback,
    setFeedback,
    twitchLinkState,
    upcomingFormations,
    pastFormationsUnique,
    filteredPastFormations,
    displayedPastCatalog,
    interestedCount,
    registeredUpcoming,
    pendingTitles,
    submittingTitle,
    registeredEventIds,
    registeringEventId,
    selectedEvent,
    setSelectedEvent,
    catalogQuery,
    setCatalogQuery,
    showInterestedOnly,
    setShowInterestedOnly,
    catalogViewMode,
    setCatalogViewMode,
    catalogSort,
    setCatalogSort,
    catalogLetter,
    setCatalogLetter,
    catalogLetterChips,
    catalogSuggestionsForModal,
    requestModalOpen,
    setRequestModalOpen,
    submitInterest,
    toggleRegistration,
    refreshPendingFormationRequests,
  };
}
