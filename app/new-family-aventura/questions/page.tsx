"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, MessageSquare } from "lucide-react";

type QuestionCategory =
  | "participation"
  | "logement"
  | "transport"
  | "budget"
  | "autre";

const categoryOptions: Array<{ value: QuestionCategory; label: string }> = [
  { value: "participation", label: "Participation" },
  { value: "logement", label: "Logement" },
  { value: "transport", label: "Transport" },
  { value: "budget", label: "Budget" },
  { value: "autre", label: "Autre" },
];

export default function NewFamilyAventuraQuestionsPage() {
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    pseudo: "",
    contact: "",
    category: "participation" as QuestionCategory,
    question: "",
    allowFaqPublication: true,
  });

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.pseudo.trim() || !form.question.trim()) {
      setNotice("Pseudo et question sont obligatoires.");
      return;
    }
    setSending(true);
    setNotice(null);
    try {
      const response = await fetch("/api/new-family-aventura/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pseudo: form.pseudo,
          contact: form.contact,
          category: form.category,
          question: form.question,
          allow_faq_publication: form.allowFaqPublication,
          source: "page_questions",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setNotice(data.error || "Impossible d'envoyer ta question.");
        return;
      }
      setNotice("Question envoyee. L'equipe admin te repondra des que possible.");
      setForm({
        pseudo: "",
        contact: "",
        category: "participation",
        question: "",
        allowFaqPublication: true,
      });
    } catch {
      setNotice("Erreur reseau. Reessaie dans un instant.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-12">
        <section
          className="rounded-3xl border p-6 sm:p-8"
          style={{
            borderColor: "rgba(145,70,255,0.35)",
            background:
              "linear-gradient(135deg, rgba(145,70,255,0.16) 0%, rgba(34,197,94,0.09) 55%, rgba(15,17,22,0.95) 100%)",
          }}
        >
          <h1 className="flex items-center gap-2 text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>
            <MessageSquare size={26} style={{ color: "var(--color-primary)" }} />
            Questions aux admins
          </h1>
          <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Une question ? Un doute ? L'equipe TENF est la pour t'aider a preparer ton experience New Family Aventura dans les meilleures conditions.
          </p>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2">
          <article className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              Ce que l'equipe attend pour t'aider vite
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Une question claire, ton contexte et la categorie la plus proche.
            </p>
          </article>
          <article className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              Canal de reponse
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Discord prioritaire, email si necessaire (selon les informations fournies).
            </p>
          </article>
        </section>

        <form onSubmit={onSubmit} className="mt-6 rounded-2xl border p-5 space-y-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(145,70,255,0.35)", color: "var(--color-text-secondary)" }}>
            Delai cible de reponse: <span style={{ color: "var(--color-text)" }}>24 a 72h</span> selon le volume de demandes.
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
                Pseudo *
              </label>
              <input
                value={form.pseudo}
                onChange={(e) => setForm((prev) => ({ ...prev, pseudo: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
                Contact (Discord / email)
              </label>
              <input
                value={form.contact}
                onChange={(e) => setForm((prev) => ({ ...prev, contact: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
              Categorie
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as QuestionCategory }))}
              className="w-full md:w-72 rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
              Ta question *
            </label>
            <textarea
              value={form.question}
              onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
              className="w-full min-h-[120px] rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <input
              type="checkbox"
              checked={form.allowFaqPublication}
              onChange={(e) => setForm((prev) => ({ ...prev, allowFaqPublication: e.target.checked }))}
            />
            J'autorise la publication anonyme de ma question dans la FAQ si cela peut aider la communaute.
          </label>

          <div className="rounded-lg border px-3 py-2 text-xs sm:text-sm" style={{ borderColor: "rgba(255,255,255,0.14)", color: "var(--color-text-secondary)" }}>
            Donnees utilisees uniquement pour repondre. Possibilite d'anonymisation FAQ. Aucune utilisation commerciale.
            Canal de reponse privilegie: Discord (email si necessaire).
          </div>

          <button
            type="submit"
            disabled={sending}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {sending ? "Envoi..." : "Envoyer ma question"}
          </button>
        </form>

        {notice ? (
          <div className="mt-4 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text-secondary)" }}>
            {notice}
          </div>
        ) : null}

        <section className="mt-4 rounded-2xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            Pour une reponse plus rapide
          </p>
          <div className="mt-2 grid gap-2">
            {[
              "Precise ton besoin concret (transport, budget, hebergement, etc.).",
              "Ajoute les contraintes importantes (dates, disponibilites, options).",
              "Indique ce que tu as deja lu (FAQ, infos pratiques) pour eviter les doublons.",
            ].map((item) => (
              <p key={item} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--color-text-secondary)" }}>
                - {item}
              </p>
            ))}
          </div>
        </section>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/new-family-aventura" className="inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            <ArrowLeft size={14} /> Retour au projet
          </Link>
          <Link href="/new-family-aventura/faq" className="inline-flex rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            Consulter la FAQ
          </Link>
        </div>
      </div>
    </main>
  );
}
