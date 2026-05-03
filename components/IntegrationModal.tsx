"use client";

import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import {
  X,
  Calendar,
  MapPin,
  Copy,
  Check,
  ExternalLink,
  CalendarPlus,
  PartyPopper,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import {
  ONBOARDING_SESSION_IMAGE_HEIGHT,
  ONBOARDING_SESSION_IMAGE_WIDTH,
} from "@/lib/onboardingSessionDefaults";

function normalizeIntegrationDescriptionForMarkdown(raw: string): string {
  let s = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trimEnd();
  if (!s) return s;
  s = s.replace(/:\s*•\s*/g, ":\n\n• ");
  s = s.replace(/\s•\s/g, "\n• ");
  s = s.replace(/^•\s+/gm, "- ");
  return s;
}

function googleCalendarUrl(opts: {
  title: string;
  start: Date;
  durationMin?: number;
  details?: string;
  location?: string;
}): string {
  const durationMin = opts.durationMin ?? 90;
  const end = new Date(opts.start.getTime() + durationMin * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${fmt(opts.start)}/${fmt(end)}`,
    details: opts.details ?? "",
    location: opts.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function formatIntegrationModalDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

type IntegrationModalProps = {
  integration: {
    id: string;
    title: string;
    description: string;
    image?: string;
    date: Date;
    category: string;
    location?: string;
    locationName?: string;
    locationUrl?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onRegister: (formData?: {
    discordUsername: string;
    twitchChannelUrl: string;
    parrain: string;
    notes?: string;
  }) => Promise<void>;
  requiresProfileForm: boolean;
  isLoading?: boolean;
};

type ModalTab = "session" | "register";

export default function IntegrationModal({
  integration,
  isOpen,
  onClose,
  onRegister,
  requiresProfileForm,
  isLoading = false,
}: IntegrationModalProps) {
  const [formData, setFormData] = useState({
    discordUsername: "",
    twitchChannelUrl: "",
    parrain: "",
    notes: "",
  });
  const [tab, setTab] = useState<ModalTab>("session");
  const [formError, setFormError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        discordUsername: "",
        twitchChannelUrl: "",
        parrain: "",
        notes: "",
      });
      setTab("session");
      setFormError(null);
      setCopied(null);
    }
  }, [isOpen, integration.id]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const copyInfos = useCallback(async () => {
    const lines = [
      integration.title,
      formatIntegrationModalDate(integration.date),
      integration.category,
    ];
    if (integration.locationName) lines.push(`Lieu : ${integration.locationName}`);
    else if (integration.location) lines.push(`Lieu : ${integration.location}`);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied("infos");
      window.setTimeout(() => setCopied(null), 2200);
    } catch {
      setCopied(null);
    }
  }, [integration]);

  const handleSubmitForm = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.discordUsername || !formData.twitchChannelUrl || !formData.parrain) {
      setFormError(
        "Merci de remplir le pseudo Discord, le lien ou pseudo Twitch, et le parrain TENF."
      );
      return;
    }
    onRegister(formData);
  };

  if (!isOpen) return null;

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case "Intégration standard":
        return {
          bg: "color-mix(in srgb, #9146ff 22%, var(--color-card))",
          border: "rgba(145, 70, 255, 0.45)",
          text: "#e9d5ff",
          gradient: "from-violet-600/40 via-fuchsia-600/25 to-transparent",
        };
      case "Intégration rapide":
        return {
          bg: "color-mix(in srgb, #3b82f6 18%, var(--color-card))",
          border: "rgba(59, 130, 246, 0.45)",
          text: "#bfdbfe",
          gradient: "from-blue-600/35 via-cyan-500/20 to-transparent",
        };
      case "Intégration spéciale":
        return {
          bg: "color-mix(in srgb, #22c55e 18%, var(--color-card))",
          border: "rgba(34, 197, 94, 0.45)",
          text: "#bbf7d0",
          gradient: "from-emerald-600/35 via-teal-500/20 to-transparent",
        };
      default:
        return {
          bg: "var(--color-card-hover)",
          border: "var(--color-border)",
          text: "var(--color-text-secondary)",
          gradient: "from-neutral-600/30 to-transparent",
        };
    }
  };

  const catStyle = getCategoryStyles(integration.category);

  const isUrl = (str: string): boolean => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const bannerRatio = `${ONBOARDING_SESSION_IMAGE_WIDTH} / ${ONBOARDING_SESSION_IMAGE_HEIGHT}`;
  const calendarHref = googleCalendarUrl({
    title: `TENF — ${integration.title}`,
    start: integration.date,
    details: integration.description?.slice(0, 800) || "",
    location: integration.locationName || integration.location || "",
  });

  const locationBlock =
    integration.locationName || integration.location ? (
      <div
        className="flex items-start gap-3 rounded-2xl border p-4 text-sm shadow-inner"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "color-mix(in srgb, var(--color-bg) 45%, var(--color-card))",
          color: "var(--color-text-secondary)",
        }}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-primary) 18%, transparent)",
            color: "var(--color-primary)",
          }}
        >
          <MapPin className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text)" }}>
            Accès & lieu
          </p>
          <div className="mt-1">
            {integration.locationName && integration.locationUrl ? (
              <a
                href={integration.locationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium underline decoration-[var(--color-primary)] underline-offset-2 transition-opacity hover:opacity-90"
                style={{ color: "var(--color-primary)" }}
              >
                {integration.locationName}
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            ) : integration.location && isUrl(integration.location) ? (
              <a
                href={integration.location}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all font-medium underline decoration-[var(--color-primary)] underline-offset-2"
                style={{ color: "var(--color-primary)" }}
              >
                {integration.location}
              </a>
            ) : (
              <span>{integration.location}</span>
            )}
          </div>
        </div>
      </div>
    ) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-md sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border shadow-[0_-12px_48px_rgba(0,0,0,0.5)] sm:max-h-[92vh] sm:rounded-3xl sm:shadow-[0_28px_80px_rgba(0,0,0,0.55)]"
        style={{
          backgroundColor: "var(--color-card)",
          borderColor: "rgba(145, 70, 255, 0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="integration-modal-title"
      >
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${catStyle.gradient} opacity-90`}
          aria-hidden
        />
        <button
          type="button"
          onClick={onClose}
          className="integration-premium-modal-close absolute right-3 top-3 z-20"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>

        <div className="relative overflow-y-auto overscroll-contain">
          {integration.image ? (
            <div className="relative border-b" style={{ borderColor: "var(--color-border)" }}>
              <div
                className="relative w-full overflow-hidden"
                style={{
                  aspectRatio: bannerRatio,
                  background:
                    "linear-gradient(180deg, color-mix(in srgb, var(--color-bg) 88%, #000) 0%, var(--color-bg) 100%)",
                }}
              >
                <img
                  src={integration.image}
                  alt=""
                  className="h-full w-full object-contain object-center"
                  decoding="async"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--color-card)] to-transparent" />
              </div>
            </div>
          ) : (
            <div
              className="relative border-b px-5 pb-6 pt-8 sm:px-8 sm:pt-10"
              style={{ borderColor: "rgba(145, 70, 255, 0.2)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border shadow-lg"
                  style={{ borderColor: catStyle.border, background: catStyle.bg }}
                >
                  <PartyPopper className="h-7 w-7" style={{ color: catStyle.text }} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--color-primary)" }}>
                    Réunion d&apos;intégration TENF
                  </p>
                  <p className="mt-0.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Découvre les infos de la session puis inscris-toi en un clic si Discord est déjà connecté.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="relative px-5 pb-8 pt-5 sm:px-8 sm:pt-6">
            <div className="mb-3 flex flex-wrap items-center gap-2 pr-10">
              <span
                className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold uppercase tracking-wide"
                style={{
                  background: catStyle.bg,
                  borderColor: catStyle.border,
                  color: catStyle.text,
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {integration.category}
              </span>
            </div>

            <h2
              id="integration-modal-title"
              className="mb-3 text-2xl font-bold leading-tight sm:text-3xl"
              style={{ color: "var(--color-text)" }}
            >
              {integration.title}
            </h2>

            <div
              className="mb-5 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "color-mix(in srgb, var(--color-bg) 35%, transparent)",
              }}
            >
              <div className="flex items-start gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                <Calendar className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "var(--color-primary)" }} />
                <span className="leading-snug">{formatIntegrationModalDate(integration.date)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={calendarHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:brightness-110"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-bg)",
                    color: "var(--color-text)",
                  }}
                >
                  <CalendarPlus className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
                  Google Agenda
                </a>
                <button
                  type="button"
                  onClick={copyInfos}
                  className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:brightness-110"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-bg)",
                    color: "var(--color-text)",
                  }}
                >
                  {copied === "infos" ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
                  )}
                  {copied === "infos" ? "Copié" : "Copier le récap"}
                </button>
              </div>
            </div>

            <div
              className="mb-6 flex rounded-2xl border p-1"
              style={{ borderColor: "rgba(145, 70, 255, 0.25)", backgroundColor: "color-mix(in srgb, var(--color-bg) 50%, transparent)" }}
              role="tablist"
            >
              <button
                type="button"
                role="tab"
                aria-selected={tab === "session"}
                onClick={() => setTab("session")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  tab === "session" ? "shadow-md" : "opacity-75 hover:opacity-100"
                }`}
                style={
                  tab === "session"
                    ? {
                        backgroundColor: "color-mix(in srgb, var(--color-primary) 22%, var(--color-card))",
                        color: "var(--color-text)",
                      }
                    : { color: "var(--color-text-secondary)" }
                }
              >
                <ClipboardList className="h-4 w-4 shrink-0" />
                La session
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "register"}
                onClick={() => setTab("register")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  tab === "register" ? "shadow-md" : "opacity-75 hover:opacity-100"
                }`}
                style={
                  tab === "register"
                    ? {
                        backgroundColor: "color-mix(in srgb, var(--color-primary) 22%, var(--color-card))",
                        color: "var(--color-text)",
                      }
                    : { color: "var(--color-text-secondary)" }
                }
              >
                <PartyPopper className="h-4 w-4 shrink-0" />
                M&apos;inscrire
              </button>
            </div>

            {tab === "session" ? (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                    <span className="inline-block h-1 w-6 rounded-full bg-[var(--color-primary)]" aria-hidden />
                    Programme & consignes
                  </h3>
                  {integration.description ? (
                    <div
                      className="max-w-none rounded-2xl border p-4 text-sm leading-relaxed sm:p-5 sm:text-base [&_p]:my-2 [&_li]:my-1 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_strong]:text-[var(--color-text)] [&_a]:font-medium [&_a]:text-[var(--color-primary)] [&_a]:underline [&_h1]:text-lg [&_h2]:text-base [&_h1]:font-semibold [&_h2]:font-semibold [&_h1]:text-[var(--color-text)] [&_h2]:text-[var(--color-text)]"
                      style={{
                        color: "var(--color-text-secondary)",
                        borderColor: "var(--color-border)",
                        backgroundColor: "color-mix(in srgb, var(--color-bg) 40%, transparent)",
                      }}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                        {normalizeIntegrationDescriptionForMarkdown(integration.description)}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm italic" style={{ color: "var(--color-text-muted, var(--color-text-secondary))" }}>
                      Aucune description détaillée pour cette session — le staff complétera bientôt la fiche.
                    </p>
                  )}
                </div>
                {locationBlock}
                <button
                  type="button"
                  onClick={() => setTab("register")}
                  className="integration-premium-btn-primary w-full sm:w-auto"
                >
                  Continuer vers l&apos;inscription
                </button>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in duration-200">
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {requiresProfileForm
                    ? "Une fois le formulaire envoyé, ton profil sera pris en compte pour cette session. Vérifie bien tes infos avant validation."
                    : "Tu es connecté avec Discord : nous récupérons ton profil pour finaliser l’inscription en un clic."}
                </p>

                {requiresProfileForm ? (
                  <form onSubmit={handleSubmitForm} className="space-y-4">
                    {formError ? (
                      <div
                        className="rounded-xl border px-4 py-3 text-sm"
                        style={{
                          borderColor: "rgba(248, 113, 113, 0.45)",
                          backgroundColor: "rgba(248, 113, 113, 0.08)",
                          color: "var(--color-text)",
                        }}
                      >
                        {formError}
                      </div>
                    ) : null}
                    <div>
                      <label className="mb-2 block text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                        Pseudo Discord *{" "}
                        <span className="text-xs font-normal" style={{ color: "var(--color-text-secondary)" }}>
                          (affiché sur le site)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={formData.discordUsername}
                        onChange={(e) => setFormData({ ...formData, discordUsername: e.target.value })}
                        className="w-full rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-offset-0"
                        style={
                          {
                            backgroundColor: "var(--color-bg)",
                            borderColor: "var(--color-border)",
                            color: "var(--color-text)",
                            ["--tw-ring-color" as string]: "var(--color-primary)",
                          } as CSSProperties & { "--tw-ring-color"?: string }
                        }
                        required
                        placeholder="Ton pseudo Discord"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                        Lien de chaîne Twitch *{" "}
                        <span className="text-xs font-normal" style={{ color: "var(--color-text-secondary)" }}>
                          (obligatoire)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={formData.twitchChannelUrl}
                        onChange={(e) => setFormData({ ...formData, twitchChannelUrl: e.target.value })}
                        className="w-full rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2"
                        style={
                          {
                            backgroundColor: "var(--color-bg)",
                            borderColor: "var(--color-border)",
                            color: "var(--color-text)",
                            ["--tw-ring-color" as string]: "var(--color-primary)",
                          } as CSSProperties & { "--tw-ring-color"?: string }
                        }
                        required
                        placeholder="https://www.twitch.tv/tonpseudo ou tonpseudo"
                      />
                      <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        Lien complet ou pseudo seul.
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                        Parrain TENF *{" "}
                        <span className="text-xs font-normal" style={{ color: "var(--color-text-secondary)" }}>
                          (personne qui t&apos;a invité)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={formData.parrain}
                        onChange={(e) => setFormData({ ...formData, parrain: e.target.value })}
                        className="w-full rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2"
                        style={
                          {
                            backgroundColor: "var(--color-bg)",
                            borderColor: "var(--color-border)",
                            color: "var(--color-text)",
                            ["--tw-ring-color" as string]: "var(--color-primary)",
                          } as CSSProperties & { "--tw-ring-color"?: string }
                        }
                        required
                        placeholder="Pseudo Discord du parrain"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                        Notes{" "}
                        <span className="text-xs font-normal" style={{ color: "var(--color-text-secondary)" }}>
                          (optionnel)
                        </span>
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                        className="w-full resize-none rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2"
                        style={
                          {
                            backgroundColor: "var(--color-bg)",
                            borderColor: "var(--color-border)",
                            color: "var(--color-text)",
                            ["--tw-ring-color" as string]: "var(--color-primary)",
                          } as CSSProperties & { "--tw-ring-color"?: string }
                        }
                        placeholder="Dis-nous si tu as un créneau fragile, une question…"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !formData.discordUsername || !formData.twitchChannelUrl || !formData.parrain}
                      className="integration-premium-btn-primary integration-premium-btn-primary--lg w-full sm:w-auto"
                    >
                      {isLoading ? "Envoi en cours…" : "Créer mon profil et m’inscrire"}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div
                      className="flex items-start gap-3 rounded-2xl border p-4"
                      style={{
                        borderColor: "rgba(34, 197, 94, 0.35)",
                        backgroundColor: "rgba(34, 197, 94, 0.08)",
                      }}
                    >
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                      <p className="text-sm" style={{ color: "var(--color-text)" }}>
                        Discord détecté : pas besoin de ressaisir ton pseudo ici. Clique pour confirmer ta place sur cette
                        session.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRegister()}
                      disabled={isLoading}
                      className="integration-premium-btn-primary integration-premium-btn-primary--lg w-full sm:w-auto"
                    >
                      {isLoading ? "Inscription…" : "Confirmer mon inscription"}
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setTab("session")}
                  className="text-sm font-medium underline-offset-2 hover:underline"
                  style={{ color: "var(--color-primary)" }}
                >
                  ← Revoir les détails de la session
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
