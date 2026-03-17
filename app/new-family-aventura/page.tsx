"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type QuickResponse = "interested" | "more_info" | "maybe" | "not_for_me";
type ProfileType = "createur" | "membre" | "autre";

type InspirationItem = {
  id: string;
  title: string;
  category: string;
  description?: string;
  image_url: string;
};

const CONDITIONS_OPTIONS = [
  "budget accessible",
  "logement compris",
  "transport facilite",
  "dates adaptees",
  "activites communaute",
  "parc inclus",
];

const quickButtons: Array<{ key: QuickResponse; label: string }> = [
  { key: "interested", label: "Je suis interesse" },
  { key: "more_info", label: "Je veux plus d'infos" },
  { key: "maybe", label: "Le projet me plait mais je ne sais pas encore" },
  { key: "not_for_me", label: "Ce n'est pas pour moi" },
];

const faqItems = [
  {
    q: "Ou se deroulera le projet ?",
    a: "Le projet est imagine autour de PortAventura et d'un cadre convivial. Le lieu exact sera confirme selon l'organisation finale.",
  },
  {
    q: "Le projet est-il deja confirme ?",
    a: "Pas encore totalement. Cette page sert justement a mesurer l'interet reel de la communaute pour avancer de maniere concrete.",
  },
  {
    q: "Qui pourra participer ?",
    a: "L'objectif est d'ouvrir le projet aux membres TENF, createurs et personnes proches de la communaute selon le cadre retenu.",
  },
  {
    q: "Faut-il etre streamer ?",
    a: "Non, pas obligatoirement. TENF souhaite garder un esprit communautaire et inclusif.",
  },
  {
    q: "Comment recevoir les prochaines informations ?",
    a: "Tu peux cliquer sur 'Recevoir les infos' et laisser un contact pour etre informe des prochaines etapes.",
  },
  {
    q: "Le programme est-il definitif ?",
    a: "Non, il est indicatif. Il evoluera selon le nombre de participants et les contraintes d'organisation.",
  },
];

function SectionTitle({ id, title, subtitle }: { id?: string; title: string; subtitle?: string }) {
  return (
    <div id={id} className="space-y-2">
      <h2 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
        {title}
      </h2>
      {subtitle ? (
        <p className="text-base" style={{ color: "var(--color-text-secondary)" }}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export default function NewFamilyAventuraPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [inspiration, setInspiration] = useState<InspirationItem[]>([]);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [quickChoice, setQuickChoice] = useState<QuickResponse>("interested");
  const [form, setForm] = useState({
    pseudo: "",
    contact: "",
    profileType: "membre" as ProfileType,
    interestReason: "",
    comment: "",
    conditions: [] as string[],
  });
  const displayedInspiration = useMemo(() => inspiration.slice(0, 6), [inspiration]);
  const heroPhoto = displayedInspiration[heroSlideIndex] ?? displayedInspiration[0];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setPrefersReducedMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (heroSlideIndex >= displayedInspiration.length) {
      setHeroSlideIndex(0);
    }
  }, [heroSlideIndex, displayedInspiration.length]);

  useEffect(() => {
    if (displayedInspiration.length <= 1 || isHeroPaused || prefersReducedMotion) return;
    const interval = window.setInterval(() => {
      setHeroSlideIndex((prev) => (prev + 1) % displayedInspiration.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [displayedInspiration.length, isHeroPaused, prefersReducedMotion]);

  useEffect(() => {
    if (displayedInspiration.length <= 1) return;
    const next = displayedInspiration[(heroSlideIndex + 1) % displayedInspiration.length];
    if (!next?.image_url) return;
    const img = new window.Image();
    img.src = next.image_url;
  }, [displayedInspiration, heroSlideIndex]);

  useEffect(() => {
    async function loadInspiration() {
      try {
        const response = await fetch("/api/new-family-aventura/inspiration", { cache: "no-store" });
        const data = await response.json();
        setInspiration((data.items || []) as InspirationItem[]);
      } catch (error) {
        console.error("[new-family-aventura] Erreur chargement galerie inspiration:", error);
      }
    }
    loadInspiration();
  }, []);

  function toggleCondition(condition: string) {
    setForm((prev) => {
      const exists = prev.conditions.includes(condition);
      return {
        ...prev,
        conditions: exists
          ? prev.conditions.filter((item) => item !== condition)
          : [...prev.conditions, condition],
      };
    });
  }

  async function submitInterest(source: string) {
    if (!form.pseudo.trim()) {
      setNotice("Merci d'indiquer au moins ton pseudo.");
      return;
    }

    setSending(true);
    setNotice(null);
    try {
      const response = await fetch("/api/new-family-aventura/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pseudo: form.pseudo,
          contact: form.contact,
          profile_type: form.profileType,
          quick_response: quickChoice,
          interest_reason: form.interestReason,
          conditions: form.conditions,
          comment: form.comment,
          source,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setNotice(data.error || "Impossible d'envoyer la reponse pour le moment.");
        return;
      }
      setNotice("Merci ! Ta reponse a bien ete enregistree.");
      setIsModalOpen(false);
      setForm({
        pseudo: "",
        contact: "",
        profileType: "membre",
        interestReason: "",
        comment: "",
        conditions: [],
      });
      setQuickChoice("interested");
    } catch (error) {
      setNotice("Erreur reseau. Reessaie dans un instant.");
    } finally {
      setSending(false);
    }
  }

  async function onFormSubmit(event: FormEvent) {
    event.preventDefault();
    await submitInterest("section_participation");
  }

  const anchorLinks = useMemo(
    () => [
      { href: "#concept", label: "Concept" },
      { href: "#experience", label: "Experience" },
      { href: "#programme", label: "Programme" },
      { href: "#galerie", label: "Galerie" },
      { href: "#participation", label: "Participation" },
      { href: "#faq", label: "FAQ" },
    ],
    []
  );

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-12">
        <nav className="sticky top-20 z-10 backdrop-blur rounded-xl border px-3 py-2 overflow-x-auto" style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(15,17,22,0.7)" }}>
          <div className="flex items-center gap-2 min-w-max">
            {anchorLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs md:text-sm px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: "var(--color-text-secondary)", backgroundColor: "var(--color-card)" }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>

        <section className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            Parcours IRL recommande
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <article className="rounded-xl border p-3" style={{ borderColor: "rgba(145,70,255,0.35)", backgroundColor: "var(--color-bg)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                Infos pratiques
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Transport, hebergement, budget et cadre securite.
              </p>
              <Link href="/new-family-aventura/infos-pratiques" className="mt-2 inline-flex text-xs underline" style={{ color: "var(--color-primary)" }}>
                Ouvrir la page
              </Link>
            </article>
            <article className="rounded-xl border p-3" style={{ borderColor: "rgba(56,189,248,0.35)", backgroundColor: "var(--color-bg)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                FAQ IRL
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Reponses rapides avant de candidater au projet.
              </p>
              <Link href="/new-family-aventura/faq" className="mt-2 inline-flex text-xs underline" style={{ color: "var(--color-primary)" }}>
                Voir la FAQ
              </Link>
            </article>
            <article className="rounded-xl border p-3" style={{ borderColor: "rgba(34,197,94,0.35)", backgroundColor: "var(--color-bg)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                Questions aux admins
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Pose une question et recois une reponse structuree.
              </p>
              <Link href="/new-family-aventura/questions" className="mt-2 inline-flex text-xs underline" style={{ color: "var(--color-primary)" }}>
                Poser une question
              </Link>
            </article>
          </div>
        </section>

        {/* SECTION 1 — HERO */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <div className="rounded-2xl border p-6 md:p-8 space-y-5 relative overflow-hidden" style={{ borderColor: "rgba(145,70,255,0.35)", background: "linear-gradient(135deg, rgba(145,70,255,0.18), rgba(145,70,255,0.06))" }}>
            <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl" style={{ backgroundColor: "rgba(236,72,153,0.2)" }} />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full blur-3xl" style={{ backgroundColor: "rgba(56,189,248,0.2)" }} />
            <p className="inline-flex text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: "rgba(145,70,255,0.22)", color: "#d8b4fe" }}>
              Experience IRL communautaire TENF
            </p>
            <h1 className="text-4xl md:text-5xl font-bold" style={{ color: "var(--color-text)" }}>
              New Family Aventura 2027 - L'experience IRL de la communaute TENF
            </h1>
            <p className="text-lg" style={{ color: "var(--color-text-secondary)" }}>
              Rencontre. Partage. Vivez TENF autrement, en vrai.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              Pendant quelques jours, la communaute Twitch Entraide New Family sort du virtuel pour se retrouver en reel.
              Entre parc, moments chill et souvenirs inoubliables, New Family Aventura est bien plus qu'un voyage:
              c'est une experience humaine.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/new-family-aventura/infos-pratiques"
                className="px-4 py-2 rounded-lg font-semibold text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Je veux participer
              </Link>
              <Link
                href="/new-family-aventura/questions"
                className="px-4 py-2 rounded-lg border font-semibold"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                Poser une question
              </Link>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 rounded-lg border font-semibold"
                style={{ borderColor: "rgba(145,70,255,0.45)", color: "#d8b4fe", backgroundColor: "rgba(145,70,255,0.12)" }}
              >
                Reponse rapide (30 sec)
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { label: "Periode", value: "Mai/Juin 2027" },
                { label: "Format", value: "IRL communaute" },
                { label: "Budget cible", value: "200-450 EUR" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.16)", backgroundColor: "rgba(15,17,22,0.45)" }}>
                  <p className="text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-2xl border overflow-hidden relative"
            style={{ borderColor: "var(--color-border)", minHeight: 320 }}
            onMouseEnter={() => setIsHeroPaused(true)}
            onMouseLeave={() => setIsHeroPaused(false)}
            onFocus={() => setIsHeroPaused(true)}
            onBlur={() => setIsHeroPaused(false)}
            onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
            onTouchEnd={(event) => {
              if (touchStartX === null || displayedInspiration.length <= 1) {
                setTouchStartX(null);
                return;
              }
              const endX = event.changedTouches[0]?.clientX ?? touchStartX;
              const diff = endX - touchStartX;
              if (Math.abs(diff) < 30) {
                setTouchStartX(null);
                return;
              }
              if (diff < 0) {
                setHeroSlideIndex((prev) => (prev + 1) % displayedInspiration.length);
              } else {
                setHeroSlideIndex(
                  (prev) => (prev - 1 + displayedInspiration.length) % displayedInspiration.length,
                );
              }
              setTouchStartX(null);
            }}
          >
            {displayedInspiration.length > 0 ? (
              displayedInspiration.map((photo, index) => (
                <div
                  key={photo.id}
                  className="absolute inset-0 transition-opacity duration-1000"
                  style={{
                    opacity: index === heroSlideIndex ? 1 : 0,
                    backgroundImage: `linear-gradient(180deg, rgba(10,12,16,0.25), rgba(10,12,16,0.75)), url(${photo.image_url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              ))
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 20% 20%, rgba(145,70,255,0.32), transparent 45%), radial-gradient(circle at 80% 30%, rgba(56,189,248,0.22), transparent 40%), linear-gradient(135deg, #1a1328, #0f1116)",
                }}
              />
            )}
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                {heroPhoto?.title || "Ambiance voyage & communaute"}
              </h3>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {heroPhoto?.description || "Une experience reelle pour prolonger l'esprit TENF."}
              </p>
              <p className="mt-2 text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>
                Cette photo se modifie depuis l&apos;admin / Galerie inspiration.
              </p>
              {displayedInspiration.length > 1 ? (
                <div className="mt-3 flex items-center gap-1.5">
                  {displayedInspiration.map((photo, index) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setHeroSlideIndex(index)}
                      aria-label={`Afficher photo ${index + 1}`}
                      aria-current={index === heroSlideIndex}
                      className="h-1.5 w-6 rounded-full transition-all"
                      style={{
                        backgroundColor:
                          index === heroSlideIndex ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.35)",
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <article className="rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
            <h2 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
              Pourquoi participer
            </h2>
            <div className="mt-3 grid gap-2">
              {[
                "🤝 Rencontrer la communaute en vrai.",
                "🔗 Creer des liens forts au-dela de Twitch.",
                "🎥 Vivre une experience unique entre streamers.",
                "🎢 Partager des moments fun (PortAventura, soirees...).",
                "✨ Repartir avec des souvenirs marquants.",
              ].map((item) => (
                <p key={item} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--color-text-secondary)" }}>
                  - {item}
                </p>
              ))}
            </div>
          </article>
          <article className="rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
            <h2 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
              Timeline projet
            </h2>
            <div className="mt-3 grid gap-2">
              {[
                "1. Annonce et ouverture des infos.",
                "2. Pre-inscriptions et organisation.",
                "3. Validation des participants.",
                "4. Voyage et experience IRL.",
              ].map((item) => (
                <p key={item} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--color-text-secondary)" }}>
                  - {item}
                </p>
              ))}
            </div>
          </article>
        </section>

        {/* SECTION 2 — CONCEPT */}
        <section id="concept" className="space-y-5">
          <SectionTitle title="Le concept" />
          <p className="text-sm md:text-base leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            New Family Aventura est un projet communautaire imagine par TENF pour permettre aux
            createurs, membres et proches de la communaute de partager un moment reel ensemble.
            L'objectif est de prolonger l'esprit de la New Family en dehors de Discord et Twitch,
            autour d'un sejour pense comme un melange de detente, de fun, de decouverte et de
            souvenirs.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {["Communaute", "Voyage", "Detente", "Parc", "Souvenirs"].map((item) => (
              <div
                key={item}
                className="rounded-xl border px-3 py-5 text-center text-sm font-semibold"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text)" }}
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3 — EXPERIENCE */}
        <section id="experience" className="space-y-5">
          <SectionTitle title="Une experience pensee pour la communaute" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              {
                title: "Parc d'attraction",
                text: "Une partie du sejour s'organise autour d'une sortie a PortAventura pour vivre un moment fort ensemble.",
              },
              {
                title: "Hebergement / vie commune",
                text: "Un cadre convivial pour partager des temps de repos, de discussion et de detente.",
              },
              {
                title: "Moments communaute",
                text: "Des temps pour se rencontrer, echanger, jouer, rire et creer des souvenirs ensemble.",
              },
              {
                title: "Ambiance New Family",
                text: "Un projet fidele a l'esprit TENF : humain, accessible, chaleureux et communautaire.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-xl border p-5"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
              >
                <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                  {card.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {card.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4 — PROGRAMME */}
        <section id="programme" className="space-y-5">
          <SectionTitle title="Un apercu du sejour" subtitle="Programme indicatif" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              "Jour 1 - arrivee et installation",
              "Jour 2 - journee parc",
              "Jour 3 - moments communaute / detente / activites",
              "Jour 4 - temps libre et depart",
            ].map((item) => (
              <div
                key={item}
                className="rounded-xl border p-4 text-sm"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text)" }}
              >
                {item}
              </div>
            ))}
          </div>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Le programme final pourra evoluer selon l'organisation et le nombre de participants.
          </p>
        </section>

        {/* SECTION 5 — GALERIE */}
        <section id="galerie" className="space-y-5">
          <SectionTitle title="L'ambiance du projet" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {inspiration.length === 0 ? (
              <div
                className="rounded-xl border p-4 text-sm"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text-secondary)" }}
              >
                Aucune photo disponible pour le moment.
              </div>
            ) : (
              inspiration.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border overflow-hidden"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
                >
                  <div
                    className="h-44 bg-cover bg-center"
                    style={{ backgroundImage: `url(${item.image_url})` }}
                  />
                  <div className="p-4 space-y-1">
                    <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
                      {item.category}
                    </p>
                    <h3 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
                      {item.title}
                    </h3>
                    {item.description ? (
                      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* SECTION 6 — PARTICIPATION */}
        <section id="participation" className="space-y-5">
          <SectionTitle title="Le projet vous interesse ?" />
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Cette page nous permet aussi de mesurer l'interet reel de la communaute pour organiser le
            projet au mieux.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickButtons.map((button) => (
              <button
                key={button.key}
                type="button"
                onClick={() => setQuickChoice(button.key)}
                className="rounded-lg border px-4 py-3 text-left text-sm transition-colors"
                style={{
                  borderColor: quickChoice === button.key ? "var(--color-primary)" : "var(--color-border)",
                  color: "var(--color-text)",
                  backgroundColor:
                    quickChoice === button.key ? "rgba(145,70,255,0.14)" : "var(--color-card)",
                }}
              >
                {button.label}
              </button>
            ))}
          </div>

          <form onSubmit={onFormSubmit} className="rounded-xl border p-5 space-y-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
                  Pseudo / nom *
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
                  Discord ou moyen de contact
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
                Je suis :
              </label>
              <select
                value={form.profileType}
                onChange={(e) => setForm((prev) => ({ ...prev, profileType: e.target.value as ProfileType }))}
                className="w-full md:w-72 rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              >
                <option value="createur">Createur</option>
                <option value="membre">Membre</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
                Ce qui m'interesse dans le projet
              </label>
              <textarea
                value={form.interestReason}
                onChange={(e) => setForm((prev) => ({ ...prev, interestReason: e.target.value }))}
                className="w-full min-h-[90px] rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              />
            </div>

            <div>
              <p className="text-sm mb-2" style={{ color: "var(--color-text-secondary)" }}>
                Je pourrais venir si...
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {CONDITIONS_OPTIONS.map((condition) => (
                  <label
                    key={condition}
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                  >
                    <input
                      type="checkbox"
                      checked={form.conditions.includes(condition)}
                      onChange={() => toggleCondition(condition)}
                    />
                    {condition}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
                Commentaire libre
              </label>
              <textarea
                value={form.comment}
                onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
                className="w-full min-h-[90px] rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {sending ? "Envoi..." : "Envoyer ma reponse"}
            </button>
          </form>
        </section>

        {/* SECTION FAQ */}
        <section id="faq" className="space-y-5">
          <SectionTitle title="FAQ" />
          <div className="space-y-3">
            {faqItems.map((item) => (
              <div key={item.q} className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
                <h3 className="font-semibold mb-1" style={{ color: "var(--color-text)" }}>
                  {item.q}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="rounded-2xl border p-6 md:p-8 space-y-4" style={{ borderColor: "rgba(145,70,255,0.35)", background: "linear-gradient(135deg, rgba(145,70,255,0.15), rgba(145,70,255,0.06))" }}>
          <h2 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
            Envie de suivre le projet ?
          </h2>
          <p className="text-sm md:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Rejoins l'aventure des maintenant et suis les prochaines etapes du projet IRL.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/new-family-aventura/infos-pratiques"
              className="px-4 py-2 rounded-lg font-semibold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Je veux participer
            </Link>
            <Link
              href="/new-family-aventura/questions"
              className="px-4 py-2 rounded-lg border font-semibold"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Poser une question
            </Link>
          </div>
        </section>

        {notice ? (
          <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text-secondary)" }}>
            {notice}
          </div>
        ) : null}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div
            className="w-full max-w-lg rounded-xl border p-5 space-y-4"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
              Partager mon interet
            </h3>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Donne une reponse rapide puis confirme avec ton pseudo.
            </p>
            <div className="grid grid-cols-1 gap-2">
              {quickButtons.map((button) => (
                <button
                  key={button.key}
                  onClick={() => setQuickChoice(button.key)}
                  className="rounded-lg border px-3 py-2 text-left text-sm"
                  style={{
                    borderColor: quickChoice === button.key ? "var(--color-primary)" : "var(--color-border)",
                    color: "var(--color-text)",
                    backgroundColor:
                      quickChoice === button.key ? "rgba(145,70,255,0.14)" : "var(--color-surface)",
                  }}
                >
                  {button.label}
                </button>
              ))}
            </div>
            <input
              value={form.pseudo}
              onChange={(e) => setForm((prev) => ({ ...prev, pseudo: e.target.value }))}
              placeholder="Ton pseudo"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
              >
                Annuler
              </button>
              <button
                onClick={() => submitInterest("hero_modal")}
                disabled={sending}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {sending ? "Envoi..." : "Valider"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

