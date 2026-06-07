"use client";

import { FormEvent } from "react";
import { Loader2, X } from "lucide-react";
import { MEMBER_PANEL_RADIUS, MemberAlert } from "@/components/member/dashboard/dashboardUi";
import {
  formatPresetDate,
  LIVE_TYPE_SUGGESTIONS,
  PLANNING_ACCENT,
  PLANNING_FIELD_CLASS,
  WEEKDAY_OPTIONS,
  type StreamForm,
} from "@/components/member/planning/planningUtils";
import { hexToRgba } from "@/components/member/dashboard/memberDashboardModel";

const FIELD_LABEL = "mb-1.5 block text-xs font-medium text-white/75";

type PlanningAddModalProps = {
  open: boolean;
  onClose: () => void;
  form: StreamForm;
  setForm: React.Dispatch<React.SetStateAction<StreamForm>>;
  recurrenceWeeks: number;
  setRecurrenceWeeks: (weeks: number) => void;
  selectedWeekdays: number[];
  toggleWeekday: (day: number) => void;
  syncWeekdayFromDate: (isoDate: string) => void;
  onSubmit: (event: FormEvent) => void;
  saving: boolean;
  canSubmit: boolean;
  formError: string | null;
  recurringSlots: Array<{ date: string; time: string }>;
  hasNoSelectedWeekday: boolean;
  slotInPast: boolean;
  isDuplicateSlot: boolean;
  recurringConflictCount: number;
  liveTypeLength: number;
  titleLength: number;
};

export default function PlanningAddModal({
  open,
  onClose,
  form,
  setForm,
  recurrenceWeeks,
  setRecurrenceWeeks,
  selectedWeekdays,
  toggleWeekday,
  syncWeekdayFromDate,
  onSubmit,
  saving,
  canSubmit,
  formError,
  recurringSlots,
  hasNoSelectedWeekday,
  slotInPast,
  isDuplicateSlot,
  recurringConflictCount,
  liveTypeLength,
  titleLength,
}: PlanningAddModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-3 pt-6 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`relative w-full max-w-xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto ${MEMBER_PANEL_RADIUS} border border-violet-500/25 bg-gradient-to-b from-[#12101a] to-[#0a0a10] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)] md:max-h-[calc(100dvh-2rem)] md:p-6`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="planning-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl border border-white/10 p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <div className="mb-5 pr-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300">Nouveau créneau</p>
          <h2 id="planning-modal-title" className="mt-1 text-xl font-bold text-white">
            Planifier un stream
          </h2>
          <p className="mt-1.5 text-sm text-white/60">
            Un créneau clair aide la communauté à s&apos;organiser — tu peux dupliquer sur plusieurs semaines.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={FIELD_LABEL}>Date *</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => {
                  const nextDate = e.target.value;
                  setForm((prev) => ({ ...prev, date: nextDate }));
                  syncWeekdayFromDate(nextDate);
                }}
                className={PLANNING_FIELD_CLASS}
              />
            </div>
            <div>
              <label className={FIELD_LABEL}>Horaire *</label>
              <input
                type="time"
                required
                value={form.time}
                onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
                className={PLANNING_FIELD_CLASS}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "Ce soir 20:00", dateOffset: 0, time: "20:00" },
              { label: "Demain 20:00", dateOffset: 1, time: "20:00" },
              { label: "J+2 · 21:00", dateOffset: 2, time: "21:00" },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  const nextDate = formatPresetDate(preset.dateOffset);
                  setForm((prev) => ({ ...prev, date: nextDate, time: preset.time }));
                  syncWeekdayFromDate(nextDate);
                }}
                className="rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-violet-100 transition hover:bg-violet-500/18"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_9rem] sm:items-end">
            <div>
              <label className={FIELD_LABEL}>Récurrence</label>
              <p className="text-[11px] text-white/45">Jours à dupliquer + durée en semaines.</p>
            </div>
            <div>
              <label className={FIELD_LABEL}>Semaines</label>
              <select
                value={recurrenceWeeks}
                onChange={(e) => setRecurrenceWeeks(Number(e.target.value))}
                className={`${PLANNING_FIELD_CLASS} cursor-pointer`}
              >
                {[1, 2, 3, 4, 6, 8, 12].map((w) => (
                  <option key={w} value={w}>
                    {w} sem.
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={FIELD_LABEL}>Jours de diffusion</label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {WEEKDAY_OPTIONS.map((day) => {
                const selected = selectedWeekdays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWeekday(day.value)}
                    className={`min-w-[2.4rem] rounded-lg border px-2 py-1.5 text-xs font-semibold transition ${
                      selected
                        ? "border-violet-400/50 text-white"
                        : "border-white/12 text-white/50 hover:border-white/20"
                    }`}
                    style={
                      selected
                        ? {
                            background: `linear-gradient(160deg, ${PLANNING_ACCENT}, #5b21b6)`,
                            boxShadow: `0 4px 14px ${hexToRgba(PLANNING_ACCENT, 0.28)}`,
                          }
                        : undefined
                    }
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
            <label className={FIELD_LABEL}>Jeu / type de live *</label>
            <input
              type="text"
              required
              maxLength={80}
              value={form.liveType}
              onChange={(e) => setForm((prev) => ({ ...prev, liveType: e.target.value }))}
              placeholder="Ex: Just Chatting, Valorant…"
              className={PLANNING_FIELD_CLASS}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {LIVE_TYPE_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, liveType: suggestion }))}
                  className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-white/55 transition hover:border-violet-400/35 hover:text-white/80"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <p className={`mt-1.5 text-[11px] ${liveTypeLength < 3 ? "text-amber-300" : "text-white/40"}`}>
              {liveTypeLength}/80 — minimum 3 caractères
            </p>
          </div>

          <div>
            <label className={FIELD_LABEL}>Titre (optionnel)</label>
            <input
              type="text"
              maxLength={120}
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Road to Master avec la commu"
              className={PLANNING_FIELD_CLASS}
            />
            <p className="mt-1 text-[11px] text-white/40">{titleLength}/120</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-xs text-white/55">
            <p>
              Aperçu :{" "}
              <span className="font-semibold text-white">
                {form.date || "Date"} {form.time || "Heure"}
              </span>
              {" · "}
              <span className="text-white/85">{form.liveType.trim() || "Type"}</span>
              {form.title.trim() ? ` · ${form.title.trim()}` : ""}
            </p>
            <p className="mt-1">
              {recurringSlots.length > 1
                ? `${recurringSlots.length} streams seront créés.`
                : recurringSlots.length === 1
                  ? "1 stream sera créé."
                  : "Aucun stream avec ces réglages."}
            </p>
          </div>

          {hasNoSelectedWeekday ? (
            <MemberAlert variant="info">Sélectionne au moins un jour de diffusion.</MemberAlert>
          ) : null}
          {slotInPast ? (
            <MemberAlert variant="info">Un ou plusieurs créneaux générés sont déjà passés.</MemberAlert>
          ) : null}
          {isDuplicateSlot ? (
            <MemberAlert variant="info">Un stream existe déjà à cette date et cet horaire.</MemberAlert>
          ) : null}
          {recurringConflictCount > 0 ? (
            <MemberAlert variant="info">{recurringConflictCount} conflit(s) sur les créneaux sélectionnés.</MemberAlert>
          ) : null}
          {formError ? <MemberAlert variant="error">{formError}</MemberAlert> : null}

          <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-white/10 bg-[#0a0a10]/95 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/5"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-[#1f1a12] transition hover:-translate-y-0.5 disabled:opacity-50"
              style={{ backgroundColor: PLANNING_ACCENT }}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Ajout…
                </>
              ) : recurringSlots.length > 1 ? (
                `Programmer ${recurringSlots.length} streams`
              ) : (
                "Programmer le stream"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
