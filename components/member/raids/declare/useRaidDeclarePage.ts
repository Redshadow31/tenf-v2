"use client";

import { useEffect, useMemo, useState } from "react";
import {
  countDeclarationsByStatus,
  getNowAsLocalInput,
  type DeclaredRaidRow,
  type DeclarationFilter,
  type LowRaidedSuggestion,
  type RaidTargetSuggestion,
} from "@/components/member/raids/declare/raidDeclareUtils";

export function useRaidDeclarePage(cibleFromUrl: string) {
  const [form, setForm] = useState({ target: "", date: getNowAsLocalInput(), note: "" });
  const [isApproximateTime, setIsApproximateTime] = useState(true);
  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loadingDeclarations, setLoadingDeclarations] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [backendSubmissionEnabled, setBackendSubmissionEnabled] = useState(true);
  const [declaredRaids, setDeclaredRaids] = useState<DeclaredRaidRow[]>([]);
  const [declarationFilter, setDeclarationFilter] = useState<DeclarationFilter>("all");
  const [expandedDeclarationId, setExpandedDeclarationId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<RaidTargetSuggestion[]>([]);
  const [lowRaidedSuggestions, setLowRaidedSuggestions] = useState<LowRaidedSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  useEffect(() => {
    if (!cibleFromUrl) return;
    setForm((prev) => (prev.target === cibleFromUrl ? prev : { ...prev, target: cibleFromUrl }));
    setShowAutocomplete(false);
    setError("");
  }, [cibleFromUrl]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function loadMyDeclarations() {
    try {
      setLoadingDeclarations(true);
      const response = await fetch("/api/members/me/raid-declarations", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) {
        setBackendSubmissionEnabled(false);
        return;
      }
      setBackendSubmissionEnabled(body.backendReady !== false);
      if (Array.isArray(body.declarations)) {
        const mapped = body.declarations.map((row: Record<string, unknown>) => ({
          id: String(row.id),
          target: String(row.target_twitch_login || ""),
          date: String(row.raid_at || new Date().toISOString()),
          note: String(row.note || ""),
          status: String(row.status || "processing") as DeclaredRaidRow["status"],
          approximate: Boolean(row.is_approximate),
        })) as DeclaredRaidRow[];
        setDeclaredRaids(mapped);
      }
    } catch {
      setBackendSubmissionEnabled(false);
    } finally {
      setLoadingDeclarations(false);
    }
  }

  useEffect(() => {
    void loadMyDeclarations();
    (async () => {
      try {
        const response = await fetch("/api/members/me/raid-suggestions/low-raided", { cache: "no-store" });
        const body = await response.json();
        if (response.ok && Array.isArray(body.suggestions)) {
          setLowRaidedSuggestions(body.suggestions as LowRaidedSuggestion[]);
        }
      } catch {
        setLowRaidedSuggestions([]);
      }
    })();
  }, []);

  useEffect(() => {
    const query = form.target.trim();
    if (!showAutocomplete) return;
    const timeout = window.setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const response = await fetch(`/api/members/me/raid-suggestions?query=${encodeURIComponent(query)}`, {
          cache: "no-store",
        });
        const body = await response.json();
        if (response.ok && Array.isArray(body.suggestions)) {
          setSuggestions(body.suggestions as RaidTargetSuggestion[]);
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 220);
    return () => window.clearTimeout(timeout);
  }, [form.target, showAutocomplete]);

  const groupedSuggestions = useMemo(() => {
    const groups = new Map<string, RaidTargetSuggestion[]>();
    for (const item of suggestions) {
      const key = item.segment || "Communaute";
      const current = groups.get(key) || [];
      current.push(item);
      groups.set(key, current);
    }
    return Array.from(groups.entries());
  }, [suggestions]);

  const formPreview = useMemo(() => {
    const date = form.date ? new Date(form.date) : null;
    const safeDate = date && !Number.isNaN(date.getTime()) ? date : null;
    return {
      target: form.target.trim() || "Non renseigné",
      date: safeDate ? safeDate.toLocaleDateString("fr-FR") : "Non renseignée",
      time: safeDate ? safeDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "--:--",
      note: form.note.trim() || "Aucune note",
      loginClean: form.target.trim().toLowerCase(),
    };
  }, [form]);

  const filteredDeclarations = useMemo(() => {
    const sorted = [...declaredRaids].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (declarationFilter === "all") return sorted;
    return sorted.filter((row) => row.status === declarationFilter);
  }, [declaredRaids, declarationFilter]);

  const declarationCounts = useMemo(() => countDeclarationsByStatus(declaredRaids), [declaredRaids]);

  function applySuggestion(login: string) {
    setForm((prev) => ({ ...prev, target: login }));
    setShowAutocomplete(false);
    setError("");
  }

  function applyNow() {
    setForm((prev) => ({ ...prev, date: getNowAsLocalInput() }));
  }

  function handleSubmit() {
    setError("");
    if (!form.target.trim()) {
      setError("Merci d'indiquer un pseudo Twitch cible.");
      setToast({ type: "error", message: "Streamer cible manquant." });
      return;
    }
    if (!form.date.trim()) {
      setError("Merci d'indiquer une date et une heure.");
      setToast({ type: "error", message: "Date et heure manquantes." });
      return;
    }
    if (!backendSubmissionEnabled) {
      setError("Le module déclarations raids n'est pas encore actif.");
      return;
    }

    void (async () => {
      setSubmitting(true);
      try {
        const response = await fetch("/api/members/me/raid-declarations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetTwitchLogin: form.target.trim(),
            raidAt: form.date,
            isApproximate: isApproximateTime,
            note: form.note.trim(),
          }),
        });
        const body = await response.json();
        if (!response.ok) {
          if (response.status === 503) {
            setBackendSubmissionEnabled(false);
            setError("Le module déclarations raids n'est pas encore actif.");
            return;
          }
          setError(body.error || "Impossible de déclarer ce raid.");
          setToast({ type: "error", message: body.error || "Erreur lors de la déclaration." });
          return;
        }
        const row = body.declaration;
        const created: DeclaredRaidRow = {
          id: String(row.id),
          target: String(row.target_twitch_login || form.target.trim()),
          date: String(row.raid_at || form.date),
          note: String(row.note || form.note.trim()),
          status: String(row.status || "processing") as DeclaredRaidRow["status"],
          approximate: Boolean(row.is_approximate),
        };
        setDeclaredRaids((prev) =>
          [created, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        );
        setShowConfirmation(true);
        setToast({ type: "success", message: "Raid enregistré — envoyé à la modération." });
        setForm((prev) => ({ ...prev, target: "", note: "" }));
        setShowAutocomplete(false);
        await loadMyDeclarations();
      } catch {
        setError("Erreur réseau pendant la déclaration.");
        setToast({ type: "error", message: "Erreur réseau pendant la déclaration." });
      } finally {
        setSubmitting(false);
      }
    })();
  }

  return {
    form,
    setForm,
    isApproximateTime,
    setIsApproximateTime,
    error,
    showConfirmation,
    setShowConfirmation,
    toast,
    loadingDeclarations,
    submitting,
    backendSubmissionEnabled,
    declaredRaids,
    declarationFilter,
    setDeclarationFilter,
    expandedDeclarationId,
    setExpandedDeclarationId,
    suggestions,
    lowRaidedSuggestions,
    loadingSuggestions,
    showAutocomplete,
    setShowAutocomplete,
    groupedSuggestions,
    formPreview,
    filteredDeclarations,
    declarationCounts,
    applySuggestion,
    applyNow,
    handleSubmit,
  };
}
