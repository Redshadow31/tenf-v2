"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Send, AlertTriangle } from "lucide-react";
import { CONTACT_TOPICS, resolveContactTopic } from "./topics";
import { DISCORD_INVITE_URL } from "@/lib/socialLinks";

type Status = "idle" | "submitting" | "success" | "error";

const MAX_MESSAGE = 2400;
const MIN_MESSAGE = 20;

type ContactFormProps = {
  /** Sans bordure carte — pour la modale plein écran */
  embedded?: boolean;
  /** Motif présélectionné (modale ou lien direct) */
  initialTopic?: string;
};

export default function ContactForm({ embedded = false, initialTopic: initialTopicProp }: ContactFormProps) {
  const searchParams = useSearchParams();
  const [pseudo, setPseudo] = useState("");
  const [contact, setContact] = useState("");
  const [topic, setTopic] = useState<string>(CONTACT_TOPICS[0]?.id ?? "question_generale");
  const [message, setMessage] = useState("");
  /** Honeypot anti-bot : doit rester vide. */
  const [website, setWebsite] = useState("");
  const [consent, setConsent] = useState(false);

  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Lecture du paramètre `?topic=` à l'arrivée (depuis /partenariats?topic=partenariat,
  // /signalement, etc.). Comportement par défaut conservé si le paramètre est
  // absent ou inconnu.
  useEffect(() => {
    const fromUrl = resolveContactTopic(searchParams?.get("topic"));
    const fromProp = resolveContactTopic(initialTopicProp);
    const incoming = fromProp ?? fromUrl;
    if (incoming) setTopic(incoming);
  }, [searchParams, initialTopicProp]);

  const remaining = MAX_MESSAGE - message.length;
  const tooShort = message.trim().length > 0 && message.trim().length < MIN_MESSAGE;

  const isValid = useMemo(() => {
    return (
      pseudo.trim().length > 0 &&
      contact.trim().length > 0 &&
      topic.trim().length > 0 &&
      message.trim().length >= MIN_MESSAGE &&
      consent
    );
  }, [pseudo, contact, topic, message, consent]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid || status === "submitting") return;

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pseudo,
          contact,
          topic,
          message,
          website,
          sourcePage: "/contact",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detail =
          typeof data?.error === "string"
            ? data.error
            : res.status === 429
            ? "Trop de tentatives. Réessaie dans quelques minutes."
            : "Impossible d'envoyer le message. Réessaie plus tard.";
        setErrorMessage(detail);
        setStatus("error");
        return;
      }

      setStatus("success");
      setPseudo("");
      setContact("");
      setMessage("");
      setConsent(false);
    } catch (error) {
      console.error("[ContactForm] submit error:", error);
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
              Message envoyé. Merci !
            </h3>
            <p className="home-muted mt-2 text-sm leading-relaxed sm:text-base">
              Le staff TENF a bien reçu ta demande. Tu recevras une réponse sous 48 à 96 heures sur le contact que tu as indiqué.
            </p>
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="home-link-accent mt-4 inline-flex text-sm font-semibold"
            >
              Envoyer un autre message
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={embedded ? "space-y-0" : "rounded-2xl border p-5 sm:p-7"}
      style={
        embedded
          ? undefined
          : { borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="pseudo"
          label="Ton pseudo / nom"
          required
          placeholder="Pseudo Discord ou nom court"
          value={pseudo}
          onChange={setPseudo}
          maxLength={60}
        />
        <Field
          id="contact"
          label="Comment te joindre"
          required
          placeholder="Discord, e-mail ou Twitter — au choix"
          value={contact}
          onChange={setContact}
          maxLength={120}
        />
      </div>

      <div className="mt-4">
        <label
          htmlFor="topic"
          className="text-xs font-bold uppercase tracking-[0.08em]"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Motif <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <select
          id="topic"
          name="topic"
          required
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm transition focus:outline-none focus:ring-2"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "color-mix(in srgb, var(--color-bg) 60%, var(--color-card))",
            color: "var(--color-text)",
          }}
        >
          {CONTACT_TOPICS.map((option) => (
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
          Message <span style={{ color: "#ef4444" }}>*</span>{" "}
          <span className="font-normal lowercase tracking-normal">(min {MIN_MESSAGE} caractères)</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={7}
          maxLength={MAX_MESSAGE}
          placeholder="Décris ta situation, ta question ou ton contexte. Plus c'est clair, plus on peut t'aider."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="mt-1.5 w-full resize-y rounded-xl border px-3 py-2.5 text-sm transition focus:outline-none focus:ring-2"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "color-mix(in srgb, var(--color-bg) 60%, var(--color-card))",
            color: "var(--color-text)",
            minHeight: "11rem",
          }}
        />
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
          <span>
            {tooShort ? (
              <span style={{ color: "#f59e0b" }}>
                Encore {MIN_MESSAGE - message.trim().length} caractère(s) pour valider
              </span>
            ) : (
              "Évite tout mot de passe, code, donnée sensible."
            )}
          </span>
          <span className={remaining < 200 ? "font-semibold" : ""}>{remaining} restants</span>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3">
        <input
          id="consent"
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border"
          style={{ accentColor: "var(--color-primary)", borderColor: "var(--color-border)" }}
          required
        />
        <label htmlFor="consent" className="text-xs leading-relaxed sm:text-sm" style={{ color: "var(--color-text-secondary)" }}>
          J&apos;accepte que mon message soit lu par le staff TENF pour traiter ma demande. Les données ne sont ni revendues ni publiées.
        </label>
      </div>

      {/* Honeypot — caché pour les humains, rempli par les bots */}
      <div className="hidden" aria-hidden>
        <label htmlFor="website">Ne pas remplir</label>
        <input
          type="text"
          id="website"
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
          Tu peux aussi écrire à un staff en MP sur{" "}
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="home-link-accent font-semibold underline-offset-2 hover:underline"
          >
            Discord
          </a>
          .
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
              <Send size={16} aria-hidden /> Envoyer le message
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
        type="text"
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
