"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type EventType =
  | "Soiree jeux communautaires"
  | "Evenement special"
  | "Decouverte de createurs"
  | "Autre";

type CommunityEventSuggestion = {
  id: string;
  author: string;
  title: string;
  eventType: EventType;
  description: string;
  activity: string;
  suggestedDate?: string;
  createdAt: string;
};

const STORAGE_KEY = "tenf-community-event-suggestions";

const typeOptions: EventType[] = [
  "Soiree jeux communautaires",
  "Evenement special",
  "Decouverte de createurs",
  "Autre",
];

const staticIdeas = [
  "Tournoi Fortnite communautaire",
  "Soiree blind test musical",
  "Challenge createurs : construire la pire maison Sims",
];

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border p-5 h-full"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
    >
      <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text)" }}>
        {title}
      </h3>
      <div className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        {children}
      </div>
    </div>
  );
}

export default function EvenementsCommunautairesPage() {
  const [suggestions, setSuggestions] = useState<CommunityEventSuggestion[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({
    author: "",
    title: "",
    eventType: typeOptions[0],
    description: "",
    activity: "",
    suggestedDate: "",
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CommunityEventSuggestion[];
      if (Array.isArray(parsed)) {
        setSuggestions(parsed);
      }
    } catch (error) {
      console.error("[evenements-communautaires] Erreur chargement suggestions:", error);
    }
  }, []);

  function persistSuggestions(next: CommunityEventSuggestion[]) {
    setSuggestions(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error("[evenements-communautaires] Erreur sauvegarde suggestions:", error);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const author = form.author.trim();
    const title = form.title.trim();
    const description = form.description.trim();
    const activity = form.activity.trim();

    if (!author || !title || !description || !activity) {
      setNotice("Merci de remplir les champs obligatoires du formulaire.");
      return;
    }

    const newSuggestion: CommunityEventSuggestion = {
      id: `community-event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      author,
      title,
      eventType: form.eventType,
      description,
      activity,
      suggestedDate: form.suggestedDate || undefined,
      createdAt: new Date().toISOString(),
    };

    const next = [newSuggestion, ...suggestions].slice(0, 30);
    persistSuggestions(next);

    setForm({
      author: "",
      title: "",
      eventType: typeOptions[0],
      description: "",
      activity: "",
      suggestedDate: "",
    });

    setNotice("Proposition envoyee ! Merci pour ton idee.");
  }

  const ideas = useMemo(() => {
    const fromSuggestions = suggestions.slice(0, 6).map((s) => s.title);
    return [...fromSuggestions, ...staticIdeas].slice(0, 6);
  }, [suggestions]);

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-7xl px-4 py-10 space-y-10">
        {/* SECTION 1 — HEADER */}
        <section
          className="rounded-2xl border p-6 md:p-8"
          style={{ borderColor: "rgba(145,70,255,0.3)", background: "linear-gradient(135deg, rgba(145,70,255,0.14), rgba(145,70,255,0.05))" }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
            Evenements communautaires TENF
          </h1>
          <p className="text-base md:text-lg mb-5" style={{ color: "var(--color-text-secondary)" }}>
            Des moments pour jouer, partager et faire vivre la New Family.
          </p>
          <div className="text-sm md:text-base leading-relaxed space-y-2" style={{ color: "var(--color-text-secondary)" }}>
            <p>Chez TENF, l&apos;entraide ne se limite pas aux lives.</p>
            <p>
              Nous organisons regulierement des evenements pour rassembler les createurs et les membres
              de la communaute autour de moments conviviaux.
            </p>
            <p>Ces evenements permettent de :</p>
            <ul className="list-disc pl-5">
              <li>rencontrer d&apos;autres streamers</li>
              <li>decouvrir de nouveaux createurs</li>
              <li>partager des moments fun ensemble</li>
            </ul>
          </div>
        </section>

        {/* SECTION 2 — TYPES D'ÉVÉNEMENTS */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
            Types d&apos;evenements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <Card title="Soirees jeux communautaires">
              <p className="mb-2">Des soirees ou les membres se retrouvent pour jouer ensemble.</p>
              <p>Exemples :</p>
              <ul className="list-disc pl-5">
                <li>Fortnite</li>
                <li>Gartic Phone</li>
                <li>Among Us</li>
                <li>Petit Bac</li>
                <li>autres jeux proposes par la communaute</li>
              </ul>
            </Card>

            <Card title="Evenements speciaux">
              <p className="mb-2">Des moments uniques organises pour la communaute.</p>
              <p>Exemples :</p>
              <ul className="list-disc pl-5">
                <li>Karaoke communautaire</li>
                <li>defis entre streamers</li>
                <li>soirees a theme</li>
                <li>evenements saisonniers</li>
              </ul>
            </Card>

            <Card title="Decouverte de createurs">
              <p>
                Certains evenements permettent aussi de decouvrir de nouveaux streamers de la
                communaute et de soutenir leurs lives.
              </p>
            </Card>
          </div>
        </section>

        {/* SECTION 3 — COMMENT PARTICIPER */}
        <section
          className="rounded-xl border p-6"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <h2 className="text-2xl font-semibold mb-3" style={{ color: "var(--color-text)" }}>
            Comment participer
          </h2>
          <div className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            <p className="mb-2">Les annonces d&apos;evenements sont publiees sur :</p>
            <ul className="list-disc pl-5 mb-2">
              <li>le serveur Discord TENF</li>
              <li>le calendrier des evenements du site</li>
              <li>parfois directement pendant les lives</li>
            </ul>
            <p>Tout membre de la communaute peut participer.</p>
          </div>
        </section>

        {/* SECTION 4 — PROPOSER UN ÉVÉNEMENT (INTERACTIF) */}
        <section
          className="rounded-xl border p-6"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <h2 className="text-2xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
            Proposer un evenement
          </h2>
          <p className="text-sm mb-5" style={{ color: "var(--color-text-secondary)" }}>
            La communaute peut aussi proposer ses propres idees d&apos;evenements.
            Si vous avez une idee d&apos;activite, de soiree jeux ou de concept original, vous pouvez le suggerer ici.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
                  Nom / pseudo *
                </label>
                <input
                  value={form.author}
                  onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                  placeholder="Ton pseudo"
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
                  Titre de l&apos;evenement *
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                  placeholder="Ex: Soiree mini-jeux du vendredi"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
                  Type d&apos;evenement *
                </label>
                <select
                  value={form.eventType}
                  onChange={(e) => setForm((prev) => ({ ...prev, eventType: e.target.value as EventType }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                >
                  {typeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
                  Date suggeree (optionnel)
                </label>
                <input
                  type="date"
                  value={form.suggestedDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, suggestedDate: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
                Description *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full min-h-[110px] rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                placeholder="Decris ton idee d'evenement..."
              />
            </div>

            <div>
              <label className="block text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
                Jeu ou activite proposee *
              </label>
              <input
                value={form.activity}
                onChange={(e) => setForm((prev) => ({ ...prev, activity: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                placeholder="Ex: Gartic Phone, blind test, karaoke..."
              />
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Proposer l&apos;evenement
              </button>

              {notice ? (
                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {notice}
                </span>
              ) : null}
            </div>
          </form>

          {/* TODO : connecter ce formulaire au système d'administration pour validation par les admins TENF. */}
          {/* TODO : remplacer le stockage local par un backend (API/webhook/email) avec workflow de validation admin. */}
        </section>

        {/* SECTION 5 — IDÉES D'ÉVÉNEMENTS (DYNAMIQUE) */}
        <section
          className="rounded-xl border p-6"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <h2 className="text-2xl font-semibold mb-4" style={{ color: "var(--color-text)" }}>
            Idees proposees par la communaute
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {ideas.map((idea) => (
              <div
                key={idea}
                className="rounded-lg border p-4 text-sm font-medium"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              >
                {idea}
              </div>
            ))}
          </div>
          {/* TODO : connecter cette section aux propositions validées par l'administration. */}
        </section>

        {/* SECTION 6 — ESPRIT DE LA COMMUNAUTÉ */}
        <section
          className="rounded-xl border p-6"
          style={{ borderColor: "rgba(145,70,255,0.35)", backgroundColor: "var(--color-card)" }}
        >
          <h2 className="text-2xl font-semibold mb-3" style={{ color: "var(--color-text)" }}>
            Esprit de la communaute
          </h2>
          <div className="text-sm leading-relaxed space-y-2" style={{ color: "var(--color-text-secondary)" }}>
            <p>
              Chez TENF, les evenements ne sont pas la pour creer de la competition, mais pour
              renforcer les liens entre les membres.
            </p>
            <p>
              Chaque evenement est une occasion de partager un moment ensemble et de faire vivre la
              communaute.
            </p>
            <p className="font-medium" style={{ color: "var(--color-text)" }}>
              Parce que chez TENF, chaque live compte... mais chaque moment partage aussi.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

