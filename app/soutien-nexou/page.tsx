"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Send } from "lucide-react";

const MAX_MESSAGE = 500;
const MIN_MESSAGE = 10;

interface Review {
  id: string;
  type: string;
  pseudo: string;
  message: string;
  hearts: number | null;
  created_at: string;
}

export default function SoutienNexouPage() {
  const [pseudo, setPseudo] = useState("");
  const [message, setMessage] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    try {
      setLoading(true);
      const res = await fetch("/api/reviews?type=nexou", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setReviews(data.reviews || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "nexou",
          pseudo: pseudo.trim(),
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de l'envoi");
        return;
      }
      setSuccess(true);
      setPseudo("");
      setMessage("");
      loadReviews();
    } catch (e) {
      setError("Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  }

  const remaining = MAX_MESSAGE - message.length;
  const canSubmit =
    pseudo.trim().length >= 2 &&
    message.trim().length >= MIN_MESSAGE &&
    message.length <= MAX_MESSAGE;

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-block text-sm mb-6 transition-colors"
          style={{ color: "var(--color-text-secondary)" }}
        >
          ← Retour à l&apos;accueil
        </Link>

        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
          Soutien à Nexou
        </h1>
        <p className="mb-8" style={{ color: "var(--color-text-secondary)" }}>
          Envoie un message de soutien à Nexou. Pas de notation, juste des mots bienveillants.
        </p>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl p-6 mb-12 space-y-6"
          style={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
              Ton pseudo *
            </label>
            <input
              type="text"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder="Ex: Red_Shadow_31"
              maxLength={50}
              required
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: "var(--color-bg)",
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
              }}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium" style={{ color: "var(--color-text)" }}>
                Ton message *
              </label>
              <span
                className="text-sm"
                style={{
                  color: remaining < 50 ? "#e11d48" : "var(--color-text-secondary)",
                }}
              >
                {remaining} caractère{remaining !== 1 ? "s" : ""} restant{remaining !== 1 ? "s" : ""}
              </span>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Écris ton message de soutien..."
              maxLength={MAX_MESSAGE}
              rows={5}
              required
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 resize-none"
              style={{
                backgroundColor: "var(--color-bg)",
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
              }}
            />
            <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
              Min. {MIN_MESSAGE} caractères, max. {MAX_MESSAGE}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>
          )}
          {success && (
            <div className="p-3 rounded-lg bg-green-500/10 text-green-400 text-sm">
              Merci ! Ton message a bien été publié.
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "white",
            }}
          >
            <Send className="w-5 h-5" />
            {submitting ? "Envoi en cours..." : "Publier mon soutien"}
          </button>
        </form>

        <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--color-text)" }}>
          Messages de soutien
        </h2>
        {loading ? (
          <div className="text-center py-12" style={{ color: "var(--color-text-secondary)" }}>
            Chargement...
          </div>
        ) : reviews.length === 0 ? (
          <div
            className="rounded-xl p-8 text-center"
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            Aucun message pour le moment. Sois le premier à en envoyer un !
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="rounded-xl p-4"
                style={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div className="font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                  {r.pseudo}
                </div>
                <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--color-text-secondary)" }}>
                  {r.message}
                </p>
                <p className="text-xs mt-2" style={{ color: "var(--color-text-secondary)", opacity: 0.7 }}>
                  {new Date(r.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
