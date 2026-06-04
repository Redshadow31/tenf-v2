"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Send, AlertTriangle } from "lucide-react";
import RgpdConsentCheckbox from "@/components/legal/RgpdConsentCheckbox";
import { PRIVACY_CONSENT_ERROR_FORM } from "@/lib/legal/privacyConsent";

type Status = "idle" | "submitting" | "success" | "error";

const PARTNERSHIP_TYPES = [
  { id: "association", label: "Association" },
  { id: "serveur", label: "Serveur d'entraide / communauté" },
  { id: "evenement", label: "Événement caritatif" },
  { id: "createur", label: "Projet de créateur" },
  { id: "outil", label: "Outil / service pour streamers" },
  { id: "autre", label: "Autre (à préciser dans le message)" },
] as const;

const MAX_MESSAGE = 3000;
const MIN_MESSAGE = 60;

export default function PartnershipForm() {
  const [orgName, setOrgName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [partnerType, setPartnerType] = useState<string>(PARTNERSHIP_TYPES[0].id);
  const [projectUrl, setProjectUrl] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const remaining = MAX_MESSAGE - message.length;
  const tooShort = message.trim().length > 0 && message.trim().length < MIN_MESSAGE;

  const isValid = useMemo(() => {
    return (
      orgName.trim().length > 0 &&
      contactName.trim().length > 0 &&
      email.trim().length > 0 &&
      partnerType.trim().length > 0 &&
      message.trim().length >= MIN_MESSAGE &&
      privacyConsent
    );
  }, [orgName, contactName, email, partnerType, message, privacyConsent]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!privacyConsent) {
      setConsentError(PRIVACY_CONSENT_ERROR_FORM);
      return;
    }
    if (!isValid || status === "submitting") return;

    setStatus("submitting");
    setErrorMessage("");
    setConsentError(null);

    try {
      const res = await fetch("/api/partnerships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName,
          contactName,
          email,
          partnerType,
          projectUrl,
          message,
          website,
          privacyConsent: true,
          sourcePage: "/partenariats",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detail =
          typeof data?.error === "string"
            ? data.error
            : res.status === 429
            ? "Trop de tentatives. Réessaie dans quelques minutes."
            : "Impossible d'envoyer la demande. Réessaie plus tard.";
        setErrorMessage(detail);
        setStatus("error");
        return;
      }

      setStatus("success");
      setOrgName("");
      setContactName("");
      setEmail("");
      setProjectUrl("");
      setMessage("");
      setPrivacyConsent(false);
    } catch (error) {
      console.error("[PartnershipForm] submit error:", error);
      setErrorMessage("Erreur réseau. Vérifie ta connexion et réessaie.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        className="rounded-2xl border p-6 sm:p-8"
        style={{
          borderColor: "color-mix(in srgb, #22c55e 35%, var(--color-border))",
          backgroundColor: "color-mix(in srgb, #22c55e 8%, var(--color-card))",
        }}
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0" style={{ color: "#22c55e" }} aria-hidden />
          <div>
            <h3 className="text-base font-bold sm:text-lg" style={{ color: "var(--color-text)" }}>
              Demande envoyée. Merci !
            </h3>
            <p className="home-muted mt-2 text-sm leading-relaxed sm:text-base">
              Le staff TENF étudie chaque proposition. Tu auras une réponse — positive ou négative — sous 7 à 14 jours sur l&apos;adresse fournie.
            </p>
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="home-link-accent mt-4 inline-flex text-sm font-semibold"
            >
              Soumettre une autre demande
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border p-5 sm:p-7"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="orgName"
          label="Nom de la structure / projet"
          required
          placeholder="Association, communauté, marque, projet…"
          value={orgName}
          onChange={setOrgName}
          maxLength={120}
        />
        <Field
          id="contactName"
          label="Ton nom / pseudo"
          required
          placeholder="Personne référente"
          value={contactName}
          onChange={setContactName}
          maxLength={80}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="email"
          label="E-mail (ou Discord)"
          required
          type="text"
          placeholder="prenom@exemple.fr · ou pseudo Discord"
          value={email}
          onChange={setEmail}
          maxLength={160}
        />
        <Field
          id="projectUrl"
          label="Lien projet / site"
          placeholder="https://…"
          value={projectUrl}
          onChange={setProjectUrl}
          maxLength={300}
        />
      </div>

      <div className="mt-4">
        <label
          htmlFor="partnerType"
          className="text-xs font-bold uppercase tracking-[0.08em]"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Type de partenariat <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <select
          id="partnerType"
          name="partnerType"
          required
          value={partnerType}
          onChange={(event) => setPartnerType(event.target.value)}
          className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm transition focus:outline-none focus:ring-2"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "color-mix(in srgb, var(--color-bg) 60%, var(--color-card))",
            color: "var(--color-text)",
          }}
        >
          {PARTNERSHIP_TYPES.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label
          htmlFor="message"
          className="text-xs font-bold uppercase tracking-[0.08em]"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Présentation et demande <span style={{ color: "#ef4444" }}>*</span>{" "}
          <span className="font-normal lowercase tracking-normal">(min {MIN_MESSAGE} caractères)</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={8}
          maxLength={MAX_MESSAGE}
          placeholder="Présente ton projet : but, public cible, ce que tu proposes, ce que tu attends de TENF, dates si pertinentes."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="mt-1.5 w-full resize-y rounded-xl border px-3 py-2.5 text-sm transition focus:outline-none focus:ring-2"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "color-mix(in srgb, var(--color-bg) 60%, var(--color-card))",
            color: "var(--color-text)",
            minHeight: "12rem",
          }}
        />
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
          <span>
            {tooShort ? (
              <span style={{ color: "#f59e0b" }}>
                Encore {MIN_MESSAGE - message.trim().length} caractère(s) pour valider
              </span>
            ) : (
              "Soyez concret : projet, dates, public visé, ce que vous proposez."
            )}
          </span>
          <span className={remaining < 200 ? "font-semibold" : ""}>{remaining} restants</span>
        </div>
      </div>

      <RgpdConsentCheckbox
        id="partnership-privacy-consent"
        checked={privacyConsent}
        onChange={(checked) => {
          setPrivacyConsent(checked);
          if (checked) setConsentError(null);
        }}
        disabled={status === "submitting"}
        error={consentError}
        className="mt-4"
      />

      {/* Honeypot */}
      <div className="hidden" aria-hidden>
        <label htmlFor="website-partner">Ne pas remplir</label>
        <input
          type="text"
          id="website-partner"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      {status === "error" && errorMessage && (
        <div
          className="mt-4 flex items-start gap-3 rounded-xl border p-3 sm:p-4"
          style={{
            borderColor: "color-mix(in srgb, #ef4444 35%, var(--color-border))",
            backgroundColor: "color-mix(in srgb, #ef4444 6%, var(--color-card))",
          }}
          role="alert"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "#ef4444" }} aria-hidden />
          <p className="text-sm" style={{ color: "var(--color-text)" }}>
            {errorMessage}
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="home-muted text-xs leading-relaxed sm:text-sm">
          Délai indicatif : <strong>7 à 14 jours</strong>. On répond à toutes les propositions sérieuses, oui comme non.
        </p>
        <button
          type="submit"
          disabled={!isValid || status === "submitting"}
          className="home-btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "submitting" ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden /> Envoi…
            </>
          ) : (
            <>
              <Send size={16} aria-hidden /> Envoyer la proposition
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function Field(props: {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  maxLength?: number;
  type?: string;
}) {
  return (
    <div>
      <label
        htmlFor={props.id}
        className="text-xs font-bold uppercase tracking-[0.08em]"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {props.label}
        {props.required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      <input
        id={props.id}
        name={props.id}
        type={props.type ?? "text"}
        required={props.required}
        placeholder={props.placeholder}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        maxLength={props.maxLength}
        className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm transition focus:outline-none focus:ring-2"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "color-mix(in srgb, var(--color-bg) 60%, var(--color-card))",
          color: "var(--color-text)",
        }}
      />
    </div>
  );
}
