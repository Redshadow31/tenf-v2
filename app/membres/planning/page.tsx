"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import StreamPlanningCalendar, { type StreamPlanningCalendarItem } from "@/components/member/StreamPlanningCalendar";

type StreamPlanning = StreamPlanningCalendarItem;
type QuickListFilterMode = "all" | "upcoming7" | "past";
type StreamForm = {
  date: string;
  time: string;
  liveType: string;
  title: string;
};

const LIVE_TYPE_SUGGESTIONS = [
  "Just Chatting",
  "Valorant",
  "League of Legends",
  "IRL",
  "Review VOD",
  "Session communauté",
];
const WEEKDAY_OPTIONS = [
  { value: 1, shortLabel: "Lun", longLabel: "Lundi" },
  { value: 2, shortLabel: "Mar", longLabel: "Mardi" },
  { value: 3, shortLabel: "Mer", longLabel: "Mercredi" },
  { value: 4, shortLabel: "Jeu", longLabel: "Jeudi" },
  { value: 5, shortLabel: "Ven", longLabel: "Vendredi" },
  { value: 6, shortLabel: "Sam", longLabel: "Samedi" },
  { value: 0, shortLabel: "Dim", longLabel: "Dimanche" },
];

function getDefaultDateTime(): Pick<StreamForm, "date" | "time"> {
  const now = new Date();
  const rounded = new Date(now.getTime() + 30 * 60 * 1000);
  rounded.setMinutes(rounded.getMinutes() >= 30 ? 30 : 0, 0, 0);
  const date = rounded.toISOString().slice(0, 10);
  const time = `${String(rounded.getHours()).padStart(2, "0")}:${String(rounded.getMinutes()).padStart(2, "0")}`;
  return { date, time };
}

function formatPresetDate(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function addDaysToIsoDate(isoDate: string, daysToAdd: number): string {
  const [year, month, day] = isoDate.split("-").map((value) => Number(value));
  const localDate = new Date(year, (month || 1) - 1, day || 1);
  localDate.setDate(localDate.getDate() + daysToAdd);
  const nextYear = localDate.getFullYear();
  const nextMonth = String(localDate.getMonth() + 1).padStart(2, "0");
  const nextDay = String(localDate.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function getWeekdayFromIsoDate(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map((value) => Number(value));
  const localDate = new Date(year, (month || 1) - 1, day || 1);
  return localDate.getDay();
}

function buildSlotsToCreate(date: string, time: string, weeks: number, selectedWeekdays: number[]): Array<{ date: string; time: string }> {
  if (!date || !time) return [];
  const normalizedWeeks = Math.max(1, Math.min(12, weeks));
  const normalizedWeekdays = Array.from(new Set(selectedWeekdays)).filter((day) => day >= 0 && day <= 6);
  if (normalizedWeekdays.length === 0) return [];

  const maxDays = normalizedWeeks * 7;
  const slots: Array<{ date: string; time: string }> = [];
  for (let offset = 0; offset < maxDays; offset += 1) {
    const candidateDate = addDaysToIsoDate(date, offset);
    const weekday = getWeekdayFromIsoDate(candidateDate);
    if (!normalizedWeekdays.includes(weekday)) continue;
    slots.push({ date: candidateDate, time });
  }
  return slots;
}

function isPastSlot(date: string, time: string): boolean {
  if (!date || !time) return false;
  const candidate = new Date(`${date}T${time}:00`);
  if (Number.isNaN(candidate.getTime())) return false;
  return candidate.getTime() < Date.now();
}

function formatDateTimeFr(isoDateTime?: string): string {
  if (!isoDateTime) return "Date d'ajout inconnue";
  const value = new Date(isoDateTime);
  if (Number.isNaN(value.getTime())) return "Date d'ajout inconnue";
  return value.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeLiveType(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getLiveTypeTheme(liveType: string): { badgeBg: string; badgeBorder: string; badgeText: string; accent: string } {
  const normalized = normalizeLiveType(liveType);
  if (normalized.includes("valorant") || normalized.includes("fps")) {
    return {
      badgeBg: "rgba(239, 68, 68, 0.14)",
      badgeBorder: "rgba(248, 113, 113, 0.42)",
      badgeText: "#fecaca",
      accent: "#ef4444",
    };
  }
  if (normalized.includes("league") || normalized.includes("lol")) {
    return {
      badgeBg: "rgba(59, 130, 246, 0.14)",
      badgeBorder: "rgba(96, 165, 250, 0.42)",
      badgeText: "#bfdbfe",
      accent: "#3b82f6",
    };
  }
  if (normalized.includes("irl")) {
    return {
      badgeBg: "rgba(16, 185, 129, 0.14)",
      badgeBorder: "rgba(52, 211, 153, 0.42)",
      badgeText: "#a7f3d0",
      accent: "#10b981",
    };
  }
  if (normalized.includes("just chatting") || normalized.includes("chat")) {
    return {
      badgeBg: "rgba(168, 85, 247, 0.14)",
      badgeBorder: "rgba(192, 132, 252, 0.42)",
      badgeText: "#e9d5ff",
      accent: "#a855f7",
    };
  }
  if (normalized.includes("vod") || normalized.includes("review") || normalized.includes("analyse")) {
    return {
      badgeBg: "rgba(245, 158, 11, 0.14)",
      badgeBorder: "rgba(251, 191, 36, 0.42)",
      badgeText: "#fde68a",
      accent: "#f59e0b",
    };
  }
  return {
    badgeBg: "rgba(145, 70, 255, 0.14)",
    badgeBorder: "rgba(167, 139, 250, 0.42)",
    badgeText: "#ddd6fe",
    accent: "#9146ff",
  };
}

function getRelativeDateLabel(isoDate: string): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const [year, month, day] = isoDate.split("-").map((value) => Number(value));
  const date = new Date(year, (month || 1) - 1, day || 1);
  date.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Demain";
  if (diffDays === -1) return "Hier";
  if (diffDays > 1) return `Dans ${diffDays} jours`;
  return `Il y a ${Math.abs(diffDays)} jours`;
}

export default function MemberPlanningPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plannings, setPlannings] = useState<StreamPlanning[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [recurrenceWeeks, setRecurrenceWeeks] = useState(1);
  const [quickListQuery, setQuickListQuery] = useState("");
  const [quickListMode, setQuickListMode] = useState<QuickListFilterMode>("all");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(() => [getDefaultDateTime().date ? getWeekdayFromIsoDate(getDefaultDateTime().date) : new Date().getDay()]);
  const [form, setForm] = useState<StreamForm>(() => ({
    ...getDefaultDateTime(),
    liveType: "",
    title: "",
  }));

  async function loadPlannings() {
    try {
      setError(null);
      const response = await fetch("/api/members/me/stream-plannings", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Impossible de charger le planning.");
        return;
      }
      setPlannings(data.plannings || []);
    } catch (e) {
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlannings();
  }, []);

  useEffect(() => {
    if (!showModal) return;
    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowModal(false);
        setFormError(null);
      }
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showModal]);

  function openModal() {
    const defaults = getDefaultDateTime();
    setForm((prev) => ({
      date: prev.date || defaults.date,
      time: prev.time || defaults.time,
      liveType: prev.liveType,
      title: prev.title,
    }));
    setFormError(null);
    setRecurrenceWeeks(1);
    setSelectedWeekdays([getWeekdayFromIsoDate(form.date || defaults.date)]);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setFormError(null);
  }

  function toggleWeekday(dayValue: number) {
    setSelectedWeekdays((prev) => {
      if (prev.includes(dayValue)) {
        return prev.filter((item) => item !== dayValue);
      }
      return [...prev, dayValue].sort((a, b) => a - b);
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    const normalizedLiveType = form.liveType.trim();
    const normalizedTitle = form.title.trim();
    const normalizedRecurrenceWeeks = Math.max(1, Math.min(12, recurrenceWeeks));
    const normalizedWeekdays = Array.from(new Set(selectedWeekdays)).filter((day) => day >= 0 && day <= 6);

    if (!form.date || !form.time || !normalizedLiveType) {
      setFormError("Date, horaire et type de live sont obligatoires.");
      return;
    }
    if (normalizedLiveType.length < 3) {
      setFormError("Le type de live doit contenir au moins 3 caractères.");
      return;
    }
    if (normalizedWeekdays.length === 0) {
      setFormError("Selectionne au moins un jour pour la duplication.");
      return;
    }
    const slotsToCreate = buildSlotsToCreate(form.date, form.time, normalizedRecurrenceWeeks, normalizedWeekdays);
    if (slotsToCreate.length === 0) {
      setFormError("Aucun créneau valide n'a été généré.");
      return;
    }
    const pastSlotsCount = slotsToCreate.filter((slot) => isPastSlot(slot.date, slot.time)).length;
    if (pastSlotsCount > 0) {
      setFormError("Un ou plusieurs créneaux sont déjà passés. Ajuste la date de départ ou l'horaire.");
      return;
    }

    const existingKeys = new Set(plannings.map((planning) => `${planning.date}|${planning.time}`));
    const conflictingSlots = slotsToCreate.filter((slot) => existingKeys.has(`${slot.date}|${slot.time}`));
    if (conflictingSlots.length > 0) {
      setFormError(
        conflictingSlots.length === 1
          ? "Un stream est deja prevu sur l'un des creneaux selectionnes."
          : `${conflictingSlots.length} creneaux selectionnes existent deja.`
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const responses = await Promise.all(
        slotsToCreate.map((slot) =>
          fetch("/api/members/me/stream-plannings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: slot.date,
              time: slot.time,
              liveType: normalizedLiveType,
              title: normalizedTitle,
            }),
          })
        )
      );
      const payloads = await Promise.all(
        responses.map(async (response) => {
          let data: { error?: string } | null = null;
          try {
            data = await response.json();
          } catch {
            data = null;
          }
          return { ok: response.ok, data };
        })
      );

      const successCount = payloads.filter((payload) => payload.ok).length;
      if (successCount === 0) {
        const firstError = payloads.find((payload) => !payload.ok)?.data?.error;
        setFormError(firstError || "Erreur lors de l'ajout.");
        return;
      }
      if (successCount < slotsToCreate.length) {
        setError(`Récurrence partielle: ${successCount}/${slotsToCreate.length} streams ajoutés.`);
      }

      setForm({
        ...getDefaultDateTime(),
        liveType: "",
        title: "",
      });
      setRecurrenceWeeks(1);
      setSelectedWeekdays([getWeekdayFromIsoDate(getDefaultDateTime().date)]);
      closeModal();
      await loadPlannings();
    } catch (e) {
      setFormError("Erreur de connexion.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(planningId: string) {
    if (!confirm("Supprimer ce stream du planning ?")) return;

    try {
      const response = await fetch(`/api/members/me/stream-plannings?planningId=${planningId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Erreur lors de la suppression.");
        return;
      }
      await loadPlannings();
    } catch (e) {
      setError("Erreur de connexion.");
    }
  }

  async function handleGenerateDemoPlanning() {
    if (process.env.NODE_ENV === "production") return;
    if (!confirm("Generer un planning de demo local ?")) return;

    setSaving(true);
    setError(null);
    setFormError(null);

    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const demos = [
      { dayOffset: 1, time: "20:00", liveType: "Just Chatting", title: "Debrief de semaine" },
      { dayOffset: 2, time: "21:00", liveType: "Valorant", title: "Ranked avec la commu" },
      { dayOffset: 4, time: "19:30", liveType: "IRL", title: "FAQ de la communaute" },
      { dayOffset: 6, time: "20:30", liveType: "League of Legends", title: "Road to Diamond" },
      { dayOffset: 8, time: "20:00", liveType: "Review VOD", title: "Analyse des matchs" },
      { dayOffset: 10, time: "21:00", liveType: "Session communaute", title: "Custom games" },
    ];

    const slots = demos.map((demo) => {
      const date = new Date(base);
      date.setDate(base.getDate() + demo.dayOffset);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return {
        date: `${y}-${m}-${d}`,
        time: demo.time,
        liveType: demo.liveType,
        title: demo.title,
      };
    });

    try {
      const existingKeys = new Set(plannings.map((planning) => `${planning.date}|${planning.time}`));
      const toCreate = slots.filter((slot) => !existingKeys.has(`${slot.date}|${slot.time}`));
      if (toCreate.length === 0) {
        setError("Planning demo deja present (aucun nouveau creneau ajoute).");
        return;
      }

      const responses = await Promise.all(
        toCreate.map((slot) =>
          fetch("/api/members/me/stream-plannings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(slot),
          })
        )
      );

      const payloads = await Promise.all(
        responses.map(async (response) => {
          let data: { error?: string } | null = null;
          try {
            data = await response.json();
          } catch {
            data = null;
          }
          return { ok: response.ok, data };
        })
      );
      const successCount = payloads.filter((payload) => payload.ok).length;
      if (successCount === 0) {
        const firstError = payloads.find((payload) => !payload.ok)?.data?.error;
        setError(firstError || "Impossible de generer le planning demo.");
        return;
      }
      if (successCount < toCreate.length) {
        setError(`Generation partielle: ${successCount}/${toCreate.length} lives ajoutes.`);
      }
      await loadPlannings();
    } catch {
      setError("Erreur de connexion pendant la generation demo.");
    } finally {
      setSaving(false);
    }
  }

  const normalizedWeekdays = Array.from(new Set(selectedWeekdays)).filter((day) => day >= 0 && day <= 6);
  const recurringSlots = buildSlotsToCreate(form.date, form.time, recurrenceWeeks, normalizedWeekdays);
  const existingKeys = new Set(plannings.map((planning) => `${planning.date}|${planning.time}`));
  const recurringConflictCount = recurringSlots.filter((slot) => existingKeys.has(`${slot.date}|${slot.time}`)).length;
  const pastSlotsCount = recurringSlots.filter((slot) => isPastSlot(slot.date, slot.time)).length;
  const slotInPast = recurringSlots.length > 0 && pastSlotsCount > 0;
  const isDuplicateSlot = recurringSlots.length === 1 && recurringConflictCount > 0;
  const hasNoSelectedWeekday = normalizedWeekdays.length === 0;
  const liveTypeLength = form.liveType.trim().length;
  const titleLength = form.title.trim().length;
  const quickListItems = useMemo(() => {
    const query = quickListQuery.trim().toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inSevenDays = new Date(today);
    inSevenDays.setDate(today.getDate() + 7);

    return plannings.filter((planning) => {
      const date = new Date(`${planning.date}T00:00:00`);
      const byMode =
        quickListMode === "all"
          ? true
          : quickListMode === "upcoming7"
          ? date >= today && date <= inSevenDays
          : date < today;

      if (!byMode) return false;
      if (!query) return true;

      const haystack = `${planning.date} ${planning.time} ${planning.liveType} ${planning.title || ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [plannings, quickListQuery, quickListMode]);

  const canSubmit =
    !saving &&
    !!form.date &&
    !!form.time &&
    !hasNoSelectedWeekday &&
    recurringSlots.length > 0 &&
    liveTypeLength >= 3 &&
    !slotInPast &&
    recurringConflictCount === 0;

  return (
    <div className="space-y-6">
      <div
        className="rounded-xl border p-6"
        style={{ borderColor: "rgba(145, 70, 255, 0.35)", background: "linear-gradient(135deg, rgba(145, 70, 255, 0.12), rgba(145, 70, 255, 0.04))" }}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--color-text)" }}>
            <span>🗓️</span>
            <span>Planning de mes streams</span>
          </h1>
          <button
            type="button"
            onClick={openModal}
            className="px-4 py-2 rounded-lg font-semibold text-white transition-colors"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            + Ajouter un stream
          </button>
          {process.env.NODE_ENV !== "production" ? (
            <button
              type="button"
              onClick={handleGenerateDemoPlanning}
              disabled={saving}
              className="px-4 py-2 rounded-lg border text-sm font-semibold disabled:opacity-60"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              Generer un planning demo (local)
            </button>
          ) : null}
        </div>
        <p className="mt-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Ajoute manuellement tes prochains lives. Si ton planning est rempli, il sera visible dans ton modal sur la page Membres.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "#ef4444", color: "#ef4444" }}>
          {error}
        </div>
      ) : null}

      <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        {loading ? (
          <div className="py-10 text-center" style={{ color: "var(--color-text-secondary)" }}>
            Chargement du planning...
          </div>
        ) : (
          <StreamPlanningCalendar plannings={plannings} />
        )}
      </div>

      {plannings.length > 0 ? (
        <div
          className="rounded-xl border p-4 space-y-4"
          style={{
            borderColor: "rgba(145, 70, 255, 0.24)",
            background:
              "radial-gradient(circle at 10% 0%, rgba(145, 70, 255, 0.10), transparent 38%), linear-gradient(180deg, rgba(2, 6, 23, 0.24), rgba(2, 6, 23, 0.08))",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                Liste rapide
              </h2>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                Retrouve rapidement tes lives avec recherche et filtres.
              </p>
            </div>
            <div className="text-xs rounded-full border px-2.5 py-1" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
              {quickListItems.length} resultat{quickListItems.length > 1 ? "s" : ""}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
            <input
              type="text"
              value={quickListQuery}
              onChange={(e) => setQuickListQuery(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Rechercher (date, heure, jeu, titre...)"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            />
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "Tous" },
                { id: "upcoming7", label: "7 jours" },
                { id: "past", label: "Passes" },
              ].map((mode) => {
                const active = quickListMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setQuickListMode(mode.id as QuickListFilterMode)}
                    className="px-3 py-2 rounded-lg border text-xs font-semibold transition-colors"
                    style={{
                      borderColor: active ? "rgba(145, 70, 255, 0.70)" : "var(--color-border)",
                      color: active ? "#ede9fe" : "var(--color-text-secondary)",
                      backgroundColor: active ? "rgba(145, 70, 255, 0.20)" : "transparent",
                    }}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>

          {quickListItems.length === 0 ? (
            <div className="rounded-lg border px-4 py-6 text-sm text-center" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
              Aucun live ne correspond a ta recherche.
            </div>
          ) : (
            <div className="space-y-2">
              {quickListItems.map((planning) => {
                const theme = getLiveTypeTheme(planning.liveType);
                return (
                  <div
                    key={planning.id}
                    className="flex items-center justify-between gap-4 rounded-xl border p-3"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span
                          className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                          style={{
                            borderColor: theme.badgeBorder,
                            backgroundColor: theme.badgeBg,
                            color: theme.badgeText,
                          }}
                        >
                          {planning.liveType}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>
                          {new Date(planning.date).toLocaleDateString("fr-FR")} - {planning.time}
                        </span>
                        <span className="text-[11px]" style={{ color: theme.accent }}>
                          {getRelativeDateLabel(planning.date)}
                        </span>
                      </div>

                      {planning.title ? (
                        <div className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>
                          {planning.title}
                        </div>
                      ) : null}

                      <div className="text-xs mt-1" style={{ color: "var(--color-text-secondary)", opacity: 0.9 }}>
                        Ajoute le {formatDateTimeFr(planning.createdAt)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(planning.id)}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold text-white"
                      style={{ backgroundColor: "#dc2626" }}
                    >
                      Supprimer
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {showModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.72)", backdropFilter: "blur(2px)" }}
          onClick={closeModal}
        >
          <div
            className="w-full max-w-xl rounded-2xl border overflow-hidden"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="px-6 py-5 border-b"
              style={{
                borderColor: "rgba(145, 70, 255, 0.26)",
                background:
                  "linear-gradient(140deg, rgba(145, 70, 255, 0.20), rgba(145, 70, 255, 0.06) 55%, rgba(2, 132, 199, 0.10))",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
                    Planifier un stream
                  </h3>
                  <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Renseigne un créneau clair pour aider la communauté a s'organiser.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-8 w-8 rounded-full border text-sm transition-colors"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                  aria-label="Fermer la fenetre"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1 font-medium" style={{ color: "var(--color-text-secondary)" }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 font-medium" style={{ color: "var(--color-text-secondary)" }}>
                    Horaire *
                  </label>
                  <input
                    type="time"
                    required
                    value={form.time}
                    onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, date: formatPresetDate(0), time: "20:00" }))}
                  className="px-2.5 py-1 rounded-md border text-xs font-semibold"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                >
                  Ce soir 20:00
                </button>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, date: formatPresetDate(1), time: "20:00" }))}
                  className="px-2.5 py-1 rounded-md border text-xs font-semibold"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                >
                  Demain 20:00
                </button>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, date: formatPresetDate(2), time: "21:00" }))}
                  className="px-2.5 py-1 rounded-md border text-xs font-semibold"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                >
                  Dans 2 jours 21:00
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_180px] gap-3 items-end">
                <div>
                  <label className="block text-sm mb-1 font-medium" style={{ color: "var(--color-text-secondary)" }}>
                    Duplication / recurrence
                  </label>
                  <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    Choisis les jours a dupliquer et la duree.
                  </p>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: "var(--color-text-secondary)" }}>
                    Nombre de semaines
                  </label>
                  <select
                    value={recurrenceWeeks}
                    onChange={(e) => setRecurrenceWeeks(Number(e.target.value))}
                    className="w-full rounded-lg border px-3 py-2"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                  >
                    <option value={1}>1 semaine</option>
                    <option value={2}>2 semaines</option>
                    <option value={3}>3 semaines</option>
                    <option value={4}>4 semaines</option>
                    <option value={6}>6 semaines</option>
                    <option value={8}>8 semaines</option>
                    <option value={12}>12 semaines</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs mb-2" style={{ color: "var(--color-text-secondary)" }}>
                  Jours de diffusion
                </label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAY_OPTIONS.map((day) => {
                    const selected = selectedWeekdays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleWeekday(day.value)}
                        className="px-2.5 py-1 rounded-md border text-xs font-semibold transition-colors"
                        style={{
                          borderColor: selected ? "var(--color-primary)" : "var(--color-border)",
                          color: selected ? "white" : "var(--color-text-secondary)",
                          backgroundColor: selected ? "var(--color-primary)" : "transparent",
                        }}
                        aria-label={day.longLabel}
                        title={day.longLabel}
                      >
                        {day.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1 font-medium" style={{ color: "var(--color-text-secondary)" }}>
                  Jeu / type de live *
                </label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={form.liveType}
                  onChange={(e) => setForm((prev) => ({ ...prev, liveType: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="Ex: Just Chatting, Valorant, Ranking..."
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {LIVE_TYPE_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, liveType: suggestion }))}
                      className="px-2.5 py-1 rounded-full border text-xs"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs" style={{ color: liveTypeLength < 3 ? "#f59e0b" : "var(--color-text-secondary)" }}>
                  {liveTypeLength}/80 - minimum 3 caracteres
                </p>
              </div>

              <div>
                <label className="block text-sm mb-1 font-medium" style={{ color: "var(--color-text-secondary)" }}>
                  Titre du live (optionnel)
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="Ex: Road to Master avec la commu"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                />
                <p className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {titleLength}/120
                </p>
              </div>

              <div
                className="rounded-lg border px-3 py-2 text-xs"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "rgba(148, 163, 184, 0.08)",
                  color: "var(--color-text-secondary)",
                }}
              >
                <p>
                  Apercu:{" "}
                  <span style={{ color: "var(--color-text)", fontWeight: 600 }}>
                    {form.date || "Date"} {form.time || "Heure"}
                  </span>
                  {" · "}
                  <span style={{ color: "var(--color-text)" }}>{form.liveType.trim() || "Type de live"}</span>
                  {form.title.trim() ? ` · ${form.title.trim()}` : ""}
                </p>
                <p className="mt-1">
                  {recurringSlots.length > 1
                    ? `${recurringSlots.length} streams seront crees.`
                    : recurringSlots.length === 1
                    ? "1 stream sera cree."
                    : "Aucun stream ne sera cree avec ces reglages."}
                </p>
              </div>

              {hasNoSelectedWeekday ? (
                <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#f59e0b", color: "#f59e0b" }}>
                  Selectionne au moins un jour de diffusion.
                </div>
              ) : null}
              {slotInPast ? (
                <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#f59e0b", color: "#f59e0b" }}>
                  Un ou plusieurs creneaux generes sont deja passes.
                </div>
              ) : null}
              {isDuplicateSlot ? (
                <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#f59e0b", color: "#f59e0b" }}>
                  Un stream existe deja a cette date et cet horaire.
                </div>
              ) : null}
              {recurringConflictCount > 0 ? (
                <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#f59e0b", color: "#f59e0b" }}>
                  {recurringConflictCount} conflit(s) detecte(s) sur les creneaux selectionnes.
                </div>
              ) : null}
              {formError ? (
                <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#ef4444", color: "#ef4444" }}>
                  {formError}
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {saving
                    ? "Ajout..."
                    : recurringSlots.length > 1
                    ? `Programmer ${recurringSlots.length} streams`
                    : "Programmer le stream"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

