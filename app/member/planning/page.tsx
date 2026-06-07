"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import MemberBentoShell, { MemberBentoCell, MemberBentoRow } from "@/components/member/layout/MemberBentoShell";
import StreamPlanningCalendar from "@/components/member/StreamPlanningCalendar";
import PlanningHero from "@/components/member/planning/PlanningHero";
import PlanningQuickList from "@/components/member/planning/PlanningQuickList";
import PlanningAddModal from "@/components/member/planning/PlanningAddModal";
import {
  buildSlotsToCreate,
  countUpcomingPlannings,
  filterQuickListItems,
  getDefaultDateTime,
  getNextPlanningLabel,
  getWeekdayFromIsoDate,
  isPastSlot,
  PLANNING_ACCENT,
  type QuickListFilterMode,
  type StreamForm,
  type StreamPlanning,
} from "@/components/member/planning/planningUtils";
import {
  DashboardPanel,
  DashboardPanelHeader,
  MemberAlert,
} from "@/components/member/dashboard/dashboardUi";

export default function MemberPlanningPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingTwitch, setSyncingTwitch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [plannings, setPlannings] = useState<StreamPlanning[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [recurrenceWeeks, setRecurrenceWeeks] = useState(1);
  const [quickListQuery, setQuickListQuery] = useState("");
  const [quickListMode, setQuickListMode] = useState<QuickListFilterMode>("upcoming7");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(() => [
    getWeekdayFromIsoDate(getDefaultDateTime().date),
  ]);
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
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlannings();
  }, []);

  useEffect(() => {
    if (!infoMessage) return;
    const timer = window.setTimeout(() => setInfoMessage(null), 14000);
    return () => window.clearTimeout(timer);
  }, [infoMessage]);

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

  function syncWeekdayFromDate(isoDate: string) {
    if (!isoDate) return;
    setSelectedWeekdays([getWeekdayFromIsoDate(isoDate)]);
  }

  function openModal() {
    const defaults = getDefaultDateTime();
    const baseDate = form.date || defaults.date;
    setForm((prev) => ({
      date: baseDate,
      time: prev.time || defaults.time,
      liveType: prev.liveType,
      title: prev.title,
    }));
    setFormError(null);
    setRecurrenceWeeks(1);
    setSelectedWeekdays([getWeekdayFromIsoDate(baseDate)]);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setFormError(null);
  }

  function toggleWeekday(dayValue: number) {
    setSelectedWeekdays((prev) =>
      prev.includes(dayValue) ? prev.filter((item) => item !== dayValue) : [...prev, dayValue].sort((a, b) => a - b),
    );
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
      setFormError("Sélectionne au moins un jour pour la duplication.");
      return;
    }

    const slotsToCreate = buildSlotsToCreate(form.date, form.time, normalizedRecurrenceWeeks, normalizedWeekdays);
    if (slotsToCreate.length === 0) {
      setFormError("Aucun créneau valide n'a été généré.");
      return;
    }
    if (slotsToCreate.some((slot) => isPastSlot(slot.date, slot.time))) {
      setFormError("Un ou plusieurs créneaux sont déjà passés. Ajuste la date ou l'horaire.");
      return;
    }

    const existingKeys = new Set(plannings.map((planning) => `${planning.date}|${planning.time}`));
    const conflictingSlots = slotsToCreate.filter((slot) => existingKeys.has(`${slot.date}|${slot.time}`));
    if (conflictingSlots.length > 0) {
      setFormError(
        conflictingSlots.length === 1
          ? "Un stream est déjà prévu sur l'un des créneaux sélectionnés."
          : `${conflictingSlots.length} créneaux sélectionnés existent déjà.`,
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
          }),
        ),
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
        }),
      );

      const successCount = payloads.filter((payload) => payload.ok).length;
      if (successCount === 0) {
        setFormError(payloads.find((payload) => !payload.ok)?.data?.error || "Erreur lors de l'ajout.");
        return;
      }
      if (successCount < slotsToCreate.length) {
        setError(`Récurrence partielle : ${successCount}/${slotsToCreate.length} streams ajoutés.`);
      }

      setForm({ ...getDefaultDateTime(), liveType: "", title: "" });
      setRecurrenceWeeks(1);
      setSelectedWeekdays([getWeekdayFromIsoDate(getDefaultDateTime().date)]);
      closeModal();
      await loadPlannings();
    } catch {
      setFormError("Erreur de connexion.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSyncTwitch(replaceAll = false) {
    if (replaceAll) {
      const confirmed = confirm(
        "Cette action va supprimer tous tes lives actuels et les remplacer par ceux du planning Twitch. Continuer ?",
      );
      if (!confirmed) return;
    }

    setError(null);
    setInfoMessage(null);
    setSyncingTwitch(true);
    try {
      const query = replaceAll ? "?replaceAll=true" : "";
      const response = await fetch(`/api/members/me/stream-plannings/sync-twitch${query}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Synchronisation impossible.");
        return;
      }

      const imported = Number(data.imported) || 0;
      const skippedDup = Number(data.skippedDuplicates) || 0;
      const skippedFiltered = Number(data.skippedCanceledOrPast) || 0;
      const fromTwitch = Number(data.segmentsFromTwitch) || 0;
      const removedCount = Number(data.removedCount) || 0;
      const mode = String(data.mode || "append");

      if (fromTwitch === 0) {
        setInfoMessage(
          "Aucun créneau dans ton planning Twitch. Configure tes prochains streams sur Twitch, puis réessaie.",
        );
      } else if (mode === "replace") {
        const bits = [`${imported} créneau(x) importé(s) depuis Twitch.`, `${removedCount} ancien(s) live(s) remplacé(s).`];
        if (skippedFiltered > 0) bits.push(`${skippedFiltered} ignoré(s) (passés / annulés).`);
        bits.push("Horaires importés en heure de Paris.");
        setInfoMessage(bits.join(" "));
      } else if (imported === 0 && skippedDup > 0) {
        setInfoMessage(
          `Aucun nouveau créneau : ${skippedDup} étaient déjà présents.` +
            (skippedFiltered > 0 ? ` ${skippedFiltered} ignorés (passés ou annulés).` : ""),
        );
      } else {
        const bits = [`${imported} créneau(x) ajouté(s).`];
        if (skippedDup > 0) bits.push(`${skippedDup} déjà présent(s).`);
        if (skippedFiltered > 0) bits.push(`${skippedFiltered} ignoré(s).`);
        bits.push("Horaires importés en heure de Paris.");
        setInfoMessage(bits.join(" "));
      }

      await loadPlannings();
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setSyncingTwitch(false);
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
    } catch {
      setError("Erreur de connexion.");
    }
  }

  async function handleGenerateDemoPlanning() {
    if (process.env.NODE_ENV === "production") return;
    if (!confirm("Générer un planning de démo local ?")) return;

    setSaving(true);
    setError(null);
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const demos = [
      { dayOffset: 1, time: "20:00", liveType: "Just Chatting", title: "Debrief de semaine" },
      { dayOffset: 2, time: "21:00", liveType: "Valorant", title: "Ranked avec la commu" },
      { dayOffset: 4, time: "19:30", liveType: "IRL", title: "FAQ de la communauté" },
      { dayOffset: 6, time: "20:30", liveType: "League of Legends", title: "Road to Diamond" },
    ];

    const slots = demos.map((demo) => {
      const date = new Date(base);
      date.setDate(base.getDate() + demo.dayOffset);
      return {
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
        time: demo.time,
        liveType: demo.liveType,
        title: demo.title,
      };
    });

    try {
      const existingKeys = new Set(plannings.map((p) => `${p.date}|${p.time}`));
      const toCreate = slots.filter((slot) => !existingKeys.has(`${slot.date}|${slot.time}`));
      if (toCreate.length === 0) {
        setError("Planning démo déjà présent.");
        return;
      }

      const responses = await Promise.all(
        toCreate.map((slot) =>
          fetch("/api/members/me/stream-plannings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(slot),
          }),
        ),
      );
      const okCount = (await Promise.all(responses.map((r) => r.ok))).filter(Boolean).length;
      if (okCount === 0) setError("Impossible de générer le planning démo.");
      await loadPlannings();
    } catch {
      setError("Erreur de connexion.");
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

  const quickListItems = useMemo(
    () => filterQuickListItems(plannings, quickListQuery, quickListMode),
    [plannings, quickListQuery, quickListMode],
  );

  const canSubmit =
    !saving &&
    !!form.date &&
    !!form.time &&
    !hasNoSelectedWeekday &&
    recurringSlots.length > 0 &&
    liveTypeLength >= 3 &&
    !slotInPast &&
    recurringConflictCount === 0;

  const upcoming7 = countUpcomingPlannings(plannings);
  const nextLiveLabel = getNextPlanningLabel(plannings);
  const hasPlannings = plannings.length > 0;

  if (loading) {
    return (
      <MemberBentoShell>
        <PlanningPageSkeleton />
      </MemberBentoShell>
    );
  }

  return (
    <MemberBentoShell accentHex={PLANNING_ACCENT}>
      {error ? <MemberAlert variant="error">{error}</MemberAlert> : null}
      {infoMessage ? <MemberAlert variant="success">{infoMessage}</MemberAlert> : null}

      <MemberBentoRow>
        <MemberBentoCell span={12}>
          <PlanningHero
            totalPlannings={plannings.length}
            upcoming7={upcoming7}
            nextLiveLabel={nextLiveLabel}
            loading={loading}
            syncingTwitch={syncingTwitch}
            onAdd={openModal}
            onSyncAppend={() => handleSyncTwitch(false)}
            onSyncReplace={() => handleSyncTwitch(true)}
            onGenerateDemo={handleGenerateDemoPlanning}
            showDemo={process.env.NODE_ENV !== "production"}
          />
        </MemberBentoCell>
      </MemberBentoRow>

      <MemberBentoRow>
        <MemberBentoCell span={hasPlannings ? 8 : 12}>
          <DashboardPanel tone="cyan" accentHex={PLANNING_ACCENT} intensity="soft" ariaLabelledBy="planning-calendar-title">
            <DashboardPanelHeader
              kicker="Calendrier"
              title="Vue mensuelle"
              icon={CalendarDays}
              tone="cyan"
              accentHex="#38bdf8"
              titleId="planning-calendar-title"
            />
            <StreamPlanningCalendar
              plannings={plannings}
              embedded
              emptyMessage="Aucun créneau — ajoute un stream ou synchronise avec Twitch."
            />
          </DashboardPanel>
        </MemberBentoCell>

        {hasPlannings ? (
          <MemberBentoCell span={4}>
            <PlanningQuickList
              items={quickListItems}
              query={quickListQuery}
              mode={quickListMode}
              onQueryChange={setQuickListQuery}
              onModeChange={setQuickListMode}
              onDelete={handleDelete}
            />
          </MemberBentoCell>
        ) : null}
      </MemberBentoRow>

      <PlanningAddModal
        open={showModal}
        onClose={closeModal}
        form={form}
        setForm={setForm}
        recurrenceWeeks={recurrenceWeeks}
        setRecurrenceWeeks={setRecurrenceWeeks}
        selectedWeekdays={selectedWeekdays}
        toggleWeekday={toggleWeekday}
        syncWeekdayFromDate={syncWeekdayFromDate}
        onSubmit={handleSubmit}
        saving={saving}
        canSubmit={canSubmit}
        formError={formError}
        recurringSlots={recurringSlots}
        hasNoSelectedWeekday={hasNoSelectedWeekday}
        slotInPast={slotInPast}
        isDuplicateSlot={isDuplicateSlot}
        recurringConflictCount={recurringConflictCount}
        liveTypeLength={liveTypeLength}
        titleLength={titleLength}
      />
    </MemberBentoShell>
  );
}

function PlanningPageSkeleton() {
  return (
    <div className="flex w-full animate-pulse flex-col gap-3">
      <div className="h-44 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04]" />
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="h-72 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04] lg:col-span-8" />
        <div className="h-72 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04] lg:col-span-4" />
      </div>
    </div>
  );
}
