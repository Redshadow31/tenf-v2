"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ClipboardCheck,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  ShieldAlert,
  StickyNote,
  X,
} from "lucide-react";
import {
  DURATION_LABELS,
  RISK_LABELS,
  RISK_LEVELS,
  STATUS_LABELS,
  TYPE_LABELS,
  PARTNERSHIP_STATUSES,
  STATUSES_REQUIRING_DECISION_REASON,
  type PartnershipRequest,
  type PartnershipRequestNote,
  type PartnershipRequestReview,
  type PartnershipRequestStatus,
  type RiskLevel,
} from "@/lib/partnershipRequestsStorage";

type StatusActionKey = Exclude<PartnershipRequestStatus, "new">;

const STATUS_REASON_SET = new Set<PartnershipRequestStatus>(STATUSES_REQUIRING_DECISION_REASON);

const STATUS_ACTIONS: { key: StatusActionKey; label: string; tone: string }[] = [
  { key: "in_review", label: "Marquer en étude", tone: "#d97706" },
  { key: "in_meeting", label: "À discuter en réunion", tone: "#2563eb" },
  { key: "accepted", label: "Accepter", tone: "#16a34a" },
  { key: "refused", label: "Refuser", tone: "#dc2626" },
  { key: "archived", label: "Archiver", tone: "var(--color-muted)" },
];

const STATUS_TONES: Record<PartnershipRequestStatus, { bg: string; fg: string }> = {
  new: {
    bg: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
    fg: "var(--color-primary)",
  },
  in_review: { bg: "color-mix(in srgb, #d97706 14%, transparent)", fg: "#b45309" },
  in_meeting: { bg: "color-mix(in srgb, #2563eb 14%, transparent)", fg: "#1d4ed8" },
  accepted: { bg: "color-mix(in srgb, #16a34a 14%, transparent)", fg: "#15803d" },
  refused: { bg: "color-mix(in srgb, #dc2626 14%, transparent)", fg: "#b91c1c" },
  archived: { bg: "color-mix(in srgb, #64748b 14%, transparent)", fg: "#475569" },
};

interface ReviewState {
  valuesAlignment: number | null;
  membersInterest: number | null;
  partnerSeriousness: number | null;
  recruitmentRisk: RiskLevel | null;
  confusionRisk: RiskLevel | null;
  observationNeeded: boolean | null;
  comment: string;
}

const EMPTY_REVIEW: ReviewState = {
  valuesAlignment: null,
  membersInterest: null,
  partnerSeriousness: null,
  recruitmentRisk: null,
  confusionRisk: null,
  observationNeeded: null,
  comment: "",
};

function formatFullDate(iso: string): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatShortDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function reviewFrom(review: PartnershipRequestReview | null): ReviewState {
  if (!review) return { ...EMPTY_REVIEW };
  return {
    valuesAlignment: review.valuesAlignment,
    membersInterest: review.membersInterest,
    partnerSeriousness: review.partnerSeriousness,
    recruitmentRisk: review.recruitmentRisk,
    confusionRisk: review.confusionRisk,
    observationNeeded: review.observationNeeded,
    comment: review.comment ?? "",
  };
}

function buildPartnershipSummary(
  request: PartnershipRequest,
  review: PartnershipRequestReview | null,
  notes: PartnershipRequestNote[]
): string {
  const lines: string[] = [];
  lines.push("=== FICHE PARTENARIAT TENF ===");
  lines.push("");
  lines.push(`Projet           : ${request.projectName}`);
  lines.push(`Type             : ${TYPE_LABELS[request.partnershipType]}`);
  lines.push(`Statut           : ${STATUS_LABELS[request.status]}`);
  lines.push(`Reçue le         : ${formatFullDate(request.createdAt)}`);
  lines.push(`Mise à jour      : ${formatFullDate(request.updatedAt)}`);
  if (request.reviewDueDate) {
    lines.push(`Bilan prévu le   : ${formatShortDate(request.reviewDueDate) ?? request.reviewDueDate}`);
  }
  if (request.decisionReason) {
    lines.push("");
    lines.push("— Motif de décision interne —");
    lines.push(request.decisionReason);
  }

  lines.push("");
  lines.push("— Responsable —");
  lines.push(`Nom        : ${request.contactName}`);
  if (request.contactRole) lines.push(`Rôle       : ${request.contactRole}`);
  lines.push(`E-mail     : ${request.contactEmail}`);
  if (request.contactDiscord) lines.push(`Discord    : ${request.contactDiscord}`);
  if (request.otherContact) lines.push(`Autre      : ${request.otherContact}`);

  lines.push("");
  lines.push("— Présentation —");
  lines.push(`Description : ${request.projectDescription}`);
  if (request.discordLink) lines.push(`Discord     : ${request.discordLink}`);
  if (request.twitchLink) lines.push(`Twitch      : ${request.twitchLink}`);
  if (request.websiteLink) lines.push(`Site web    : ${request.websiteLink}`);
  if (request.socialLinks) lines.push(`Réseaux     : ${request.socialLinks}`);

  lines.push("");
  lines.push("— Détails partenariat —");
  lines.push(`Objectif         : ${request.partnershipGoal}`);
  lines.push(`Offre partenaire : ${request.partnerOffers}`);
  lines.push(`Attentes envers TENF : ${request.partnerExpectations}`);
  if (request.desiredDuration) {
    lines.push(`Durée souhaitée  : ${DURATION_LABELS[request.desiredDuration]}`);
  }
  if (request.desiredDate) lines.push(`Date / période   : ${request.desiredDate}`);
  if (request.targetAudience) lines.push(`Public concerné  : ${request.targetAudience}`);
  if (request.estimatedMembers) lines.push(`Membres estimés  : ${request.estimatedMembers}`);

  if (review) {
    lines.push("");
    lines.push("— Évaluation staff (interne) —");
    lines.push(`Compatibilité valeurs TENF   : ${formatRating(review.valuesAlignment)}`);
    lines.push(`Intérêt pour les membres    : ${formatRating(review.membersInterest)}`);
    lines.push(`Sérieux du partenaire       : ${formatRating(review.partnerSeriousness)}`);
    lines.push(`Risque recrutement sauvage  : ${formatRisk(review.recruitmentRisk)}`);
    lines.push(`Risque confusion communautés: ${formatRisk(review.confusionRisk)}`);
    lines.push(
      `Période d'observation requise: ${
        review.observationNeeded == null ? "—" : review.observationNeeded ? "Oui" : "Non"
      }`
    );
    if (review.comment) {
      lines.push("");
      lines.push("Commentaire interne :");
      lines.push(review.comment);
    }
  }

  if (notes.length > 0) {
    lines.push("");
    lines.push("— Notes internes —");
    for (const note of notes) {
      lines.push(`• ${formatFullDate(note.createdAt)} (${note.author})`);
      lines.push(`  ${note.note.replace(/\n/g, "\n  ")}`);
    }
  }

  lines.push("");
  lines.push("=== Document interne TENF — ne pas diffuser publiquement ===");
  return lines.join("\n");
}

function formatRating(value: number | null): string {
  if (value == null) return "—";
  return `${value} / 5`;
}

function formatRisk(value: RiskLevel | null): string {
  if (value == null) return "—";
  return RISK_LABELS[value];
}

export default function RequestDetailDrawer({
  requestId,
  onClose,
  onStatusChanged,
}: {
  requestId: string | null;
  onClose: () => void;
  onStatusChanged: (updated: PartnershipRequest) => void;
}) {
  const [request, setRequest] = useState<PartnershipRequest | null>(null);
  const [notes, setNotes] = useState<PartnershipRequestNote[]>([]);
  const [review, setReview] = useState<PartnershipRequestReview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [noteValue, setNoteValue] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Workflow de changement de statut
  const [pendingStatus, setPendingStatus] = useState<StatusActionKey | null>(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [reviewDueDate, setReviewDueDate] = useState("");
  const [statusError, setStatusError] = useState<string | null>(null);

  // Évaluation staff
  const [reviewDraft, setReviewDraft] = useState<ReviewState>(EMPTY_REVIEW);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSavedAt, setReviewSavedAt] = useState<string | null>(null);

  // Copie fiche
  const [copyState, setCopyState] = useState<"idle" | "ok" | "error">("idle");

  const open = !!requestId;

  const fetchDetail = useCallback(async () => {
    if (!requestId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/partnerships/${requestId}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (res.status === 401) {
        setError("Accès refusé.");
        setRequest(null);
        setNotes([]);
        setReview(null);
        return;
      }
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        request?: PartnershipRequest;
        notes?: PartnershipRequestNote[];
        review?: PartnershipRequestReview | null;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.request) {
        setError(data.error || "Demande introuvable.");
        return;
      }
      setRequest(data.request);
      setNotes(data.notes || []);
      setReview(data.review ?? null);
      setReviewDraft(reviewFrom(data.review ?? null));
    } catch (err) {
      console.error("[admin/partenariats] detail fetch error:", err);
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    if (!open) {
      setRequest(null);
      setNotes([]);
      setReview(null);
      setReviewDraft(EMPTY_REVIEW);
      setError(null);
      setNoteValue("");
      setNoteError(null);
      setPendingStatus(null);
      setDecisionReason("");
      setReviewDueDate("");
      setStatusError(null);
      setReviewError(null);
      setReviewSavedAt(null);
      setCopyState("idle");
      return;
    }
    fetchDetail();
  }, [open, fetchDetail]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function beginStatusChange(next: StatusActionKey) {
    if (!request) return;
    setStatusError(null);
    setPendingStatus(next);
    // Préremplir motif/date avec valeurs existantes si on revient sur le même statut
    setDecisionReason(STATUS_REASON_SET.has(next) ? request.decisionReason ?? "" : "");
    setReviewDueDate(next === "accepted" ? request.reviewDueDate ?? "" : "");

    // Pour un statut qui ne demande rien (in_review / in_meeting / archived), on confirme tout de suite.
    if (!STATUS_REASON_SET.has(next) && next !== "accepted") {
      void confirmStatusChange(next, "", "");
    }
  }

  async function confirmStatusChange(
    next: StatusActionKey,
    reason: string,
    dueDate: string
  ) {
    if (!request) return;
    setStatusBusy(true);
    setStatusError(null);
    try {
      const payload: Record<string, unknown> = { status: next };
      if (STATUS_REASON_SET.has(next)) {
        payload.decisionReason = reason.trim();
      }
      if (next === "accepted") {
        payload.reviewDueDate = dueDate.trim() || null;
      }

      const res = await fetch(`/api/admin/partnerships/${request.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        request?: PartnershipRequest;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.request) {
        setStatusError(data.error || "Mise à jour impossible.");
        return;
      }
      setRequest(data.request);
      onStatusChanged(data.request);
      setPendingStatus(null);
      setDecisionReason("");
      setReviewDueDate("");
    } catch (err) {
      console.error("[admin/partenariats] status update error:", err);
      setStatusError("Erreur réseau lors de la mise à jour du statut.");
    } finally {
      setStatusBusy(false);
    }
  }

  async function handleSubmitStatusForm() {
    if (!pendingStatus) return;
    if (STATUS_REASON_SET.has(pendingStatus) && decisionReason.trim().length < 5) {
      setStatusError("Le motif de décision interne doit faire au moins 5 caractères.");
      return;
    }
    await confirmStatusChange(pendingStatus, decisionReason, reviewDueDate);
  }

  async function handleAddNote() {
    if (!request) return;
    const note = noteValue.trim();
    if (note.length < 2) {
      setNoteError("La note doit contenir au moins 2 caractères.");
      return;
    }
    setNoteBusy(true);
    setNoteError(null);
    try {
      const res = await fetch(`/api/admin/partnerships/${request.id}/notes`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        note?: PartnershipRequestNote;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.note) {
        setNoteError(data.error || "Ajout impossible.");
        return;
      }
      setNotes((prev) => [data.note!, ...prev]);
      setNoteValue("");
    } catch (err) {
      console.error("[admin/partenariats] add note error:", err);
      setNoteError("Erreur réseau lors de l'ajout.");
    } finally {
      setNoteBusy(false);
    }
  }

  async function handleSaveReview() {
    if (!request) return;
    setReviewBusy(true);
    setReviewError(null);
    try {
      const res = await fetch(`/api/admin/partnerships/${request.id}/review`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valuesAlignment: reviewDraft.valuesAlignment,
          membersInterest: reviewDraft.membersInterest,
          partnerSeriousness: reviewDraft.partnerSeriousness,
          recruitmentRisk: reviewDraft.recruitmentRisk,
          confusionRisk: reviewDraft.confusionRisk,
          observationNeeded: reviewDraft.observationNeeded,
          comment: reviewDraft.comment,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        review?: PartnershipRequestReview;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.review) {
        setReviewError(data.error || "Enregistrement impossible.");
        return;
      }
      setReview(data.review);
      setReviewDraft(reviewFrom(data.review));
      setReviewSavedAt(new Date().toISOString());
    } catch (err) {
      console.error("[admin/partenariats] review save error:", err);
      setReviewError("Erreur réseau lors de l'enregistrement.");
    } finally {
      setReviewBusy(false);
    }
  }

  async function handleCopySummary() {
    if (!request) return;
    try {
      const text = buildPartnershipSummary(request, review, notes);
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopyState("ok");
        setTimeout(() => setCopyState("idle"), 2200);
      } else {
        setCopyState("error");
      }
    } catch (err) {
      console.error("[admin/partenariats] copy summary error:", err);
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 2200);
    }
  }

  const reviewDirty = useMemo(() => {
    const base = reviewFrom(review);
    return (
      base.valuesAlignment !== reviewDraft.valuesAlignment ||
      base.membersInterest !== reviewDraft.membersInterest ||
      base.partnerSeriousness !== reviewDraft.partnerSeriousness ||
      base.recruitmentRisk !== reviewDraft.recruitmentRisk ||
      base.confusionRisk !== reviewDraft.confusionRisk ||
      base.observationNeeded !== reviewDraft.observationNeeded ||
      (base.comment || "") !== (reviewDraft.comment || "")
    );
  }, [review, reviewDraft]);

  if (!open) return null;

  const showStatusForm = pendingStatus !== null;
  const acceptedHasReview = request?.status === "accepted" ? request.reviewDueDate : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-pship-detail-title"
      className="fixed inset-0 z-[80] flex"
      style={{ backgroundColor: "color-mix(in srgb, var(--color-bg) 40%, rgba(0,0,0,0.6))" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        className="ml-auto flex h-full w-full max-w-3xl flex-col overflow-y-auto border-l"
        style={{
          backgroundColor: "var(--color-bg)",
          borderColor: "var(--color-border)",
          color: "var(--color-text)",
        }}
      >
        <header
          className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b px-5 py-3"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-bg) 92%, transparent)",
            backdropFilter: "blur(8px)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
              Demande de partenariat
            </p>
            <h2 id="admin-pship-detail-title" className="truncate text-lg font-semibold">
              {request?.projectName || "Chargement…"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {request ? (
              <button
                type="button"
                onClick={handleCopySummary}
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                  backgroundColor:
                    copyState === "ok"
                      ? "color-mix(in srgb, #16a34a 14%, transparent)"
                      : "transparent",
                }}
                title="Copier une fiche partenariat propre dans le presse-papier"
              >
                {copyState === "ok" ? (
                  <>
                    <Check size={14} aria-hidden /> Fiche copiée
                  </>
                ) : copyState === "error" ? (
                  <>
                    <ShieldAlert size={14} aria-hidden /> Copie impossible
                  </>
                ) : (
                  <>
                    <Copy size={14} aria-hidden /> Générer une fiche partenariat
                  </>
                )}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer le détail"
              className="flex h-9 w-9 items-center justify-center rounded-xl border transition-colors hover:opacity-80"
              style={{ borderColor: "var(--color-border)" }}
            >
              <X size={18} aria-hidden />
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-5 px-5 py-5">
          {error ? (
            <div
              className="rounded-2xl border p-3 text-sm"
              role="alert"
              style={{
                borderColor: "#dc2626",
                backgroundColor: "color-mix(in srgb, #dc2626 8%, transparent)",
                color: "#b91c1c",
              }}
            >
              {error}
            </div>
          ) : null}

          {loading || !request ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-muted)" }}>
              <Loader2 size={16} className="animate-spin" aria-hidden /> Chargement de la demande…
            </div>
          ) : (
            <>
              {/* Bandeau statut + actions */}
              <section
                className="rounded-2xl border p-4"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
                    Statut actuel
                  </p>
                  <span
                    className="rounded-full px-3 py-0.5 text-xs font-semibold"
                    style={{
                      backgroundColor: STATUS_TONES[request.status].bg,
                      color: STATUS_TONES[request.status].fg,
                    }}
                  >
                    {STATUS_LABELS[request.status]}
                  </span>
                  <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                    Reçue le {formatFullDate(request.createdAt)} · mise à jour le {formatFullDate(request.updatedAt)}
                  </p>
                </div>

                {/* Si accepté → date de bilan & motif */}
                {request.status === "accepted" && acceptedHasReview ? (
                  <p
                    className="mt-2 inline-flex items-center gap-2 rounded-xl border px-3 py-1 text-xs font-medium"
                    style={{
                      borderColor: "color-mix(in srgb, #16a34a 40%, var(--color-border))",
                      color: "#15803d",
                      backgroundColor: "color-mix(in srgb, #16a34a 8%, transparent)",
                    }}
                  >
                    Bilan prévu : {formatShortDate(request.reviewDueDate) ?? request.reviewDueDate}
                  </p>
                ) : null}

                {request.decisionReason ? (
                  <div
                    className="mt-3 rounded-xl border p-3 text-sm"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: "var(--color-bg)",
                    }}
                  >
                    <p
                      className="mb-1 text-[11px] uppercase tracking-wide"
                      style={{ color: "var(--color-muted)" }}
                    >
                      Motif de décision interne
                    </p>
                    <p className="whitespace-pre-wrap">{request.decisionReason}</p>
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  {STATUS_ACTIONS.filter((action) => action.key !== request.status).map((action) => (
                    <button
                      key={action.key}
                      type="button"
                      onClick={() => beginStatusChange(action.key)}
                      disabled={statusBusy}
                      className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ borderColor: "var(--color-border)", color: action.tone }}
                    >
                      <Check size={12} aria-hidden /> {action.label}
                    </button>
                  ))}
                </div>

                {/* Mini-formulaire de confirmation (motif / date) */}
                {showStatusForm && pendingStatus ? (
                  <div
                    className="mt-4 rounded-xl border p-3"
                    style={{
                      borderColor: STATUS_REASON_SET.has(pendingStatus)
                        ? "color-mix(in srgb, #dc2626 35%, var(--color-border))"
                        : "var(--color-border)",
                      backgroundColor: "var(--color-bg)",
                    }}
                  >
                    <p className="mb-2 text-xs font-semibold" style={{ color: "var(--color-text)" }}>
                      Confirmer le passage à « {STATUS_LABELS[pendingStatus]} »
                    </p>

                    {STATUS_REASON_SET.has(pendingStatus) ? (
                      <div className="mb-3">
                        <label
                          htmlFor="decision-reason"
                          className="mb-1 block text-xs font-medium"
                          style={{ color: "var(--color-text)" }}
                        >
                          Motif de décision interne <span style={{ color: "#dc2626" }}>*</span>
                        </label>
                        <textarea
                          id="decision-reason"
                          value={decisionReason}
                          onChange={(e) => setDecisionReason(e.target.value)}
                          rows={3}
                          maxLength={2000}
                          placeholder="Expliquer pourquoi ce partenariat est accepté / refusé (visible uniquement côté admin)."
                          className="w-full rounded-xl border px-3 py-2 text-sm"
                          style={{
                            borderColor: "var(--color-border)",
                            backgroundColor: "var(--color-card)",
                            color: "var(--color-text)",
                          }}
                        />
                      </div>
                    ) : null}

                    {pendingStatus === "accepted" ? (
                      <div className="mb-3">
                        <label
                          htmlFor="review-due-date"
                          className="mb-1 block text-xs font-medium"
                          style={{ color: "var(--color-text)" }}
                        >
                          Date de bilan prévue (optionnelle)
                        </label>
                        <input
                          id="review-due-date"
                          type="date"
                          value={reviewDueDate}
                          onChange={(e) => setReviewDueDate(e.target.value)}
                          className="rounded-xl border px-3 py-2 text-sm"
                          style={{
                            borderColor: "var(--color-border)",
                            backgroundColor: "var(--color-card)",
                            color: "var(--color-text)",
                          }}
                        />
                        <p className="mt-1 text-[11px]" style={{ color: "var(--color-muted)" }}>
                          Permet de revoir le partenariat à une échéance définie.
                        </p>
                      </div>
                    ) : null}

                    {statusError ? (
                      <p className="mb-2 text-xs font-medium" style={{ color: "#dc2626" }}>
                        {statusError}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPendingStatus(null);
                          setStatusError(null);
                        }}
                        className="rounded-xl border px-3 py-1.5 text-xs font-medium hover:opacity-80"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmitStatusForm}
                        disabled={statusBusy}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ backgroundColor: "var(--color-primary)" }}
                      >
                        {statusBusy ? (
                          <>
                            <Loader2 size={12} className="animate-spin" aria-hidden /> Mise à jour…
                          </>
                        ) : (
                          <>
                            <Check size={12} aria-hidden /> Confirmer le statut
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>

              <DetailGroup title="Informations générales">
                <Row label="Type" value={TYPE_LABELS[request.partnershipType]} />
                <Row label="Description" value={request.projectDescription} multiline />
                <Row label="Discord" value={request.discordLink} url />
                <Row label="Twitch" value={request.twitchLink} url />
                <Row label="Site web" value={request.websiteLink} url />
                <Row label="Réseaux sociaux" value={request.socialLinks} />
              </DetailGroup>

              <DetailGroup title="Responsable">
                <Row label="Nom / pseudo" value={request.contactName} />
                <Row label="Rôle" value={request.contactRole} />
                <Row label="E-mail" value={request.contactEmail} />
                <Row label="Discord" value={request.contactDiscord} />
                <Row label="Autre contact" value={request.otherContact} />
              </DetailGroup>

              <DetailGroup title="Détails du partenariat">
                <Row label="Objectif" value={request.partnershipGoal} multiline />
                <Row label="Ce que le partenaire propose" value={request.partnerOffers} multiline />
                <Row label="Ce qu'il attend de TENF" value={request.partnerExpectations} multiline />
                <Row
                  label="Durée souhaitée"
                  value={request.desiredDuration ? DURATION_LABELS[request.desiredDuration] : null}
                />
                <Row label="Date / période" value={request.desiredDate} />
                <Row label="Public concerné" value={request.targetAudience} />
                <Row label="Membres estimés" value={request.estimatedMembers} />
              </DetailGroup>

              <DetailGroup title="Cadre et sécurité">
                <YesRow label="Indépendance acceptée" value={request.independenceAccepted} />
                <YesRow label="Interdiction du recrutement sauvage acceptée" value={request.noRecruitmentAccepted} />
                <YesRow label="Confidentialité acceptée" value={request.confidentialityAccepted} />
                <YesRow label="Période d'observation acceptée" value={request.observationAccepted} />
                <YesRow label="Refus / interruption possibles acceptés" value={request.interruptionAccepted} />
              </DetailGroup>

              {request.additionalMessage ? (
                <DetailGroup title="Informations complémentaires">
                  <Row label="Message" value={request.additionalMessage} multiline />
                </DetailGroup>
              ) : null}

              <DetailGroup title="Consentement final">
                <YesRow label="Représentant autorisé certifié" value={request.representativeConfirmed} />
                <YesRow label="Usage des données accepté" value={request.dataUsageAccepted} />
              </DetailGroup>

              {/* === Évaluation staff === */}
              <section
                className="rounded-2xl border p-4"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
              >
                <header className="mb-3 flex items-center gap-2">
                  <FileText size={16} aria-hidden style={{ color: "var(--color-primary)" }} />
                  <h3 className="text-sm font-semibold">Évaluation staff</h3>
                  <span
                    className="ml-auto rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
                  >
                    Admin only
                  </span>
                </header>
                <p className="mb-4 text-xs" style={{ color: "var(--color-muted)" }}>
                  Sert d'aide à la décision lors d'une réunion staff. Tout reste invisible pour le visiteur et n'est
                  jamais renvoyé par l'API publique.
                </p>

                <div className="grid gap-4 sm:grid-cols-3">
                  <RatingField
                    label="Compatibilité avec les valeurs TENF"
                    value={reviewDraft.valuesAlignment}
                    onChange={(v) => setReviewDraft((prev) => ({ ...prev, valuesAlignment: v }))}
                  />
                  <RatingField
                    label="Intérêt réel pour les membres TENF"
                    value={reviewDraft.membersInterest}
                    onChange={(v) => setReviewDraft((prev) => ({ ...prev, membersInterest: v }))}
                  />
                  <RatingField
                    label="Sérieux du partenaire"
                    value={reviewDraft.partnerSeriousness}
                    onChange={(v) => setReviewDraft((prev) => ({ ...prev, partnerSeriousness: v }))}
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <RiskField
                    label="Risque de recrutement sauvage"
                    value={reviewDraft.recruitmentRisk}
                    onChange={(v) => setReviewDraft((prev) => ({ ...prev, recruitmentRisk: v }))}
                  />
                  <RiskField
                    label="Risque de confusion entre communautés"
                    value={reviewDraft.confusionRisk}
                    onChange={(v) => setReviewDraft((prev) => ({ ...prev, confusionRisk: v }))}
                  />
                </div>

                <div className="mt-4">
                  <YesNoField
                    label="Besoin d'une période d'observation"
                    value={reviewDraft.observationNeeded}
                    onChange={(v) => setReviewDraft((prev) => ({ ...prev, observationNeeded: v }))}
                  />
                </div>

                <div className="mt-4">
                  <label
                    htmlFor="review-comment"
                    className="mb-1 block text-xs font-medium"
                    style={{ color: "var(--color-text)" }}
                  >
                    Commentaire d'évaluation interne
                  </label>
                  <textarea
                    id="review-comment"
                    value={reviewDraft.comment}
                    onChange={(e) => setReviewDraft((prev) => ({ ...prev, comment: e.target.value }))}
                    rows={4}
                    maxLength={4000}
                    placeholder="Forces, faiblesses, points d'attention, conditions à négocier…"
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: "var(--color-bg)",
                      color: "var(--color-text)",
                    }}
                  />
                </div>

                {reviewError ? (
                  <p className="mt-2 text-xs font-medium" style={{ color: "#dc2626" }}>
                    {reviewError}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px]" style={{ color: "var(--color-muted)" }}>
                    {review?.updatedAt ? (
                      <>
                        Dernière mise à jour : {formatFullDate(review.updatedAt)}
                        {review.updatedBy ? ` par ${review.updatedBy}` : ""}
                      </>
                    ) : (
                      "Aucune évaluation enregistrée pour le moment."
                    )}
                    {reviewSavedAt ? <span style={{ color: "#15803d" }}> · Enregistré.</span> : null}
                  </p>
                  <button
                    type="button"
                    onClick={handleSaveReview}
                    disabled={reviewBusy || !reviewDirty}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    {reviewBusy ? (
                      <>
                        <Loader2 size={12} className="animate-spin" aria-hidden /> Enregistrement…
                      </>
                    ) : (
                      <>
                        <Check size={12} aria-hidden /> Enregistrer l'évaluation
                      </>
                    )}
                  </button>
                </div>
              </section>

              {/* Notes internes */}
              <section
                className="rounded-2xl border p-4"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
              >
                <header className="mb-3 flex items-center gap-2">
                  <StickyNote size={16} aria-hidden style={{ color: "var(--color-primary)" }} />
                  <h3 className="text-sm font-semibold">Notes internes</h3>
                  <span
                    className="ml-auto rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
                  >
                    Admin only
                  </span>
                </header>
                <p className="mb-3 text-xs" style={{ color: "var(--color-muted)" }}>
                  Visibles uniquement par les admins. Aucune note n'est exposée côté visiteur.
                </p>
                <div className="space-y-3">
                  <div>
                    <textarea
                      value={noteValue}
                      onChange={(e) => {
                        setNoteValue(e.target.value);
                        if (noteError) setNoteError(null);
                      }}
                      rows={3}
                      maxLength={4000}
                      placeholder="Ajouter une note de suivi (décision, RDV planifié, contact…)"
                      className="w-full rounded-xl border px-3 py-2 text-sm"
                      style={{
                        borderColor: "var(--color-border)",
                        backgroundColor: "var(--color-bg)",
                        color: "var(--color-text)",
                      }}
                    />
                    {noteError ? (
                      <p className="mt-1 text-xs font-medium" style={{ color: "#dc2626" }}>
                        {noteError}
                      </p>
                    ) : null}
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddNote}
                        disabled={noteBusy || noteValue.trim().length < 2}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ backgroundColor: "var(--color-primary)" }}
                      >
                        <ClipboardCheck size={12} aria-hidden /> Ajouter la note
                      </button>
                    </div>
                  </div>
                  {notes.length === 0 ? (
                    <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                      Aucune note pour le moment.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {notes.map((note) => (
                        <li
                          key={note.id}
                          className="rounded-xl border p-3"
                          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
                        >
                          <div
                            className="mb-1 flex items-center justify-between gap-2 text-[11px]"
                            style={{ color: "var(--color-muted)" }}
                          >
                            <span>{note.author}</span>
                            <span>{formatFullDate(note.createdAt)}</span>
                          </div>
                          <p className="whitespace-pre-wrap text-sm" style={{ color: "var(--color-text)" }}>
                            {note.note}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </>
          )}
        </div>

        <footer
          className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-bg) 92%, transparent)",
            backdropFilter: "blur(8px)",
            borderColor: "var(--color-border)",
          }}
        >
          <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-muted)" }}>
            Données internes — non publiques
          </p>
          <div className="flex flex-wrap gap-2">
            {PARTNERSHIP_STATUSES.map((status) => (
              <span
                key={`legend-${status}`}
                className="text-[10px] uppercase tracking-wider"
                style={{ color: "var(--color-muted)" }}
              >
                {STATUS_LABELS[status]}
              </span>
            ))}
          </div>
        </footer>
      </aside>
    </div>
  );
}

function DetailGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl border p-4"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
    >
      <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
        {title}
      </h3>
      <dl className="space-y-2">{children}</dl>
    </section>
  );
}

function Row({
  label,
  value,
  multiline,
  url,
}: {
  label: string;
  value: string | null | undefined;
  multiline?: boolean;
  url?: boolean;
}) {
  const text = value && value.trim().length > 0 ? value : null;
  return (
    <div className="grid gap-1 sm:grid-cols-[180px_1fr] sm:gap-3">
      <dt className="text-xs uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
        {label}
      </dt>
      <dd className="text-sm" style={{ color: "var(--color-text)" }}>
        {text == null ? (
          <span className="italic" style={{ color: "var(--color-muted)" }}>—</span>
        ) : url ? (
          <a
            href={text}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline decoration-dotted"
            style={{ color: "var(--color-primary)" }}
          >
            {text} <ExternalLink size={12} aria-hidden />
          </a>
        ) : multiline ? (
          <p className="whitespace-pre-wrap">{text}</p>
        ) : (
          <span>{text}</span>
        )}
      </dd>
    </div>
  );
}

function YesRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="grid items-center gap-1 sm:grid-cols-[1fr_auto] sm:gap-3">
      <dt className="text-sm" style={{ color: "var(--color-text)" }}>
        {label}
      </dt>
      <dd>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{
            backgroundColor: value
              ? "color-mix(in srgb, #16a34a 14%, transparent)"
              : "color-mix(in srgb, #dc2626 14%, transparent)",
            color: value ? "#15803d" : "#b91c1c",
          }}
        >
          {value ? "Oui" : "Non"}
        </span>
      </dd>
    </div>
  );
}

function RatingField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium" style={{ color: "var(--color-text)" }}>
        {label}
      </p>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(active ? null : n)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold transition-colors"
              style={{
                borderColor: active
                  ? "var(--color-primary)"
                  : "var(--color-border)",
                color: active ? "white" : "var(--color-text)",
                backgroundColor: active ? "var(--color-primary)" : "var(--color-bg)",
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-[10px]" style={{ color: "var(--color-muted)" }}>
        1 = faible · 5 = excellent
      </p>
    </div>
  );
}

function RiskField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: RiskLevel | null;
  onChange: (v: RiskLevel | null) => void;
}) {
  const COLORS: Record<RiskLevel, string> = {
    low: "#16a34a",
    medium: "#d97706",
    high: "#dc2626",
  };
  return (
    <div>
      <p className="mb-1 text-xs font-medium" style={{ color: "var(--color-text)" }}>
        {label}
      </p>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-1.5">
        {RISK_LEVELS.map((level) => {
          const active = value === level;
          return (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(active ? null : level)}
              className="inline-flex items-center justify-center rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors"
              style={{
                borderColor: active ? COLORS[level] : "var(--color-border)",
                color: active ? "white" : "var(--color-text)",
                backgroundColor: active ? COLORS[level] : "var(--color-bg)",
              }}
            >
              {RISK_LABELS[level]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function YesNoField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium" style={{ color: "var(--color-text)" }}>
        {label}
      </p>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {[
          { v: true, label: "Oui", color: "#d97706" },
          { v: false, label: "Non", color: "#16a34a" },
        ].map((opt) => {
          const active = value === opt.v;
          return (
            <button
              key={String(opt.v)}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(active ? null : opt.v)}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{
                borderColor: active ? opt.color : "var(--color-border)",
                color: active ? "white" : "var(--color-text)",
                backgroundColor: active ? opt.color : "var(--color-bg)",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
