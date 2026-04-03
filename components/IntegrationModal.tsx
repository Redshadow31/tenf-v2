"use client";

import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { X, Calendar, MapPin, Info } from "lucide-react";
import {
  ONBOARDING_SESSION_IMAGE_HEIGHT,
  ONBOARDING_SESSION_IMAGE_WIDTH,
} from "@/lib/onboardingSessionDefaults";

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
    }
  }, [isOpen]);

  const handleSubmitForm = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.discordUsername || !formData.twitchChannelUrl || !formData.parrain) {
      alert(
        "Veuillez remplir tous les champs obligatoires (pseudo Discord, lien chaîne Twitch et parrain)"
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
        };
      case "Intégration rapide":
        return {
          bg: "color-mix(in srgb, #3b82f6 18%, var(--color-card))",
          border: "rgba(59, 130, 246, 0.45)",
          text: "#bfdbfe",
        };
      case "Intégration spéciale":
        return {
          bg: "color-mix(in srgb, #22c55e 18%, var(--color-card))",
          border: "rgba(34, 197, 94, 0.45)",
          text: "#bbf7d0",
        };
      default:
        return {
          bg: "var(--color-card-hover)",
          border: "var(--color-border)",
          text: "var(--color-text-secondary)",
        };
    }
  };

  const catStyle = getCategoryStyles(integration.category);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const isUrl = (str: string): boolean => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const bannerRatio = `${ONBOARDING_SESSION_IMAGE_WIDTH} / ${ONBOARDING_SESSION_IMAGE_HEIGHT}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border shadow-[0_-8px_40px_rgba(0,0,0,0.4)] sm:max-h-[92vh] sm:rounded-2xl sm:shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
        style={{
          backgroundColor: "var(--color-card)",
          borderColor: "rgba(145, 70, 255, 0.28)",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="integration-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="integration-premium-modal-close absolute right-3 top-3 z-20"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>

        <div className="overflow-y-auto overscroll-contain">
          {integration.image ? (
            <div className="border-b" style={{ borderColor: "var(--color-border)" }}>
              <div
                className="relative w-full overflow-hidden"
                style={{
                  aspectRatio: bannerRatio,
                  background:
                    "linear-gradient(180deg, color-mix(in srgb, var(--color-bg) 90%, #000) 0%, var(--color-bg) 100%)",
                }}
              >
                <img
                  src={integration.image}
                  alt=""
                  className="h-full w-full object-contain object-center"
                  decoding="async"
                />
              </div>
              <div
                className="flex gap-3 px-4 py-3.5 sm:px-5"
                style={{
                  background:
                    "linear-gradient(90deg, color-mix(in srgb, var(--color-primary) 14%, var(--color-card)) 0%, color-mix(in srgb, #06b6d4 8%, var(--color-card)) 100%)",
                  borderTop: "1px solid rgba(145, 70, 255, 0.15)",
                }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--color-primary) 25%, transparent)",
                    color: "var(--color-primary)",
                  }}
                  aria-hidden
                >
                  <Info className="h-5 w-5" strokeWidth={2} />
                </div>
                <p
                  className="text-xs leading-relaxed sm:text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <span className="font-semibold" style={{ color: "var(--color-text)" }}>
                    Consigne importante — bannière affichée en entier
                  </span>
                  <br />
                  Ce visuel est prévu au format{" "}
                  <strong style={{ color: "var(--color-text)" }}>
                    {ONBOARDING_SESSION_IMAGE_WIDTH}×{ONBOARDING_SESSION_IMAGE_HEIGHT} px
                  </strong>{" "}
                  (ratio 4∶1). Ici il est montré <strong style={{ color: "var(--color-text)" }}>sans recadrage</strong>{" "}
                  pour que tu voies exactement ce que l&apos;équipe a préparé. Fais attention aux détails en bord
                  d&apos;image sur d&apos;autres écrans : garde les éléments essentiels au centre de la bannière.
                </p>
              </div>
            </div>
          ) : null}

          <div className="px-5 pb-8 pt-6 sm:px-8 sm:pt-8">
            <div className="mb-4 pr-10">
              <span
                className="inline-block rounded-xl border px-3 py-1.5 text-xs font-bold uppercase tracking-wide"
                style={{
                  background: catStyle.bg,
                  borderColor: catStyle.border,
                  color: catStyle.text,
                }}
              >
                {integration.category}
              </span>
            </div>

            <h2
              id="integration-modal-title"
              className="mb-4 text-2xl font-bold leading-tight sm:text-3xl"
              style={{ color: "var(--color-text)" }}
            >
              {integration.title}
            </h2>

            <div
              className="mb-6 flex flex-wrap items-center gap-2 text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <Calendar className="h-4 w-4 shrink-0" style={{ color: "var(--color-primary)" }} />
              <span>{formatDate(integration.date)}</span>
            </div>

            <div className="mb-8 space-y-3">
              <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                Description
              </h3>
              {integration.description ? (
                <div
                  className="max-w-none text-sm leading-relaxed sm:text-base [&_p]:my-2 [&_li]:my-1 [&_ul]:my-2 [&_ol]:my-2 [&_strong]:font-semibold [&_strong]:text-[var(--color-text)] [&_a]:font-medium [&_a]:text-[var(--color-primary)] [&_a]:underline [&_h1]:text-lg [&_h2]:text-base [&_h1]:font-semibold [&_h2]:font-semibold [&_h1]:text-[var(--color-text)] [&_h2]:text-[var(--color-text)]"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{integration.description}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm italic" style={{ color: "var(--color-text-muted, var(--color-text-secondary))" }}>
                  Aucune description
                </p>
              )}
            </div>

            {(integration.locationName || integration.location) && (
              <div
                className="mb-8 flex items-start gap-2 rounded-xl border p-4 text-sm"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "color-mix(in srgb, var(--color-bg) 40%, var(--color-card))",
                  color: "var(--color-text-secondary)",
                }}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--color-primary)" }} />
                <div>
                  {integration.locationName && integration.locationUrl ? (
                    <a
                      href={integration.locationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline decoration-[var(--color-primary)] underline-offset-2 transition-opacity hover:opacity-90"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {integration.locationName}
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
            )}

            {requiresProfileForm ? (
              <form onSubmit={handleSubmitForm} className="space-y-4">
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
                    placeholder="Informations complémentaires…"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !formData.discordUsername || !formData.twitchChannelUrl || !formData.parrain}
                  className="integration-premium-btn-primary integration-premium-btn-primary--lg"
                >
                  {isLoading ? "Création…" : "Créer mon profil"}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Tu es connecté avec Discord : les infos profil seront utilisées automatiquement.
                </p>
                <button
                  type="button"
                  onClick={() => onRegister()}
                  disabled={isLoading}
                  className="integration-premium-btn-primary integration-premium-btn-primary--lg"
                >
                  {isLoading ? "Inscription…" : "S'inscrire à l'intégration"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
