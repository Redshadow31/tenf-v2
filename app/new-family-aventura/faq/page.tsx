import Link from "next/link";
import { ArrowLeft, HelpCircle } from "lucide-react";

const faqItems: Array<{ category: string; q: string; a: string }> = [
  {
    category: "Organisation",
    q: "Est-ce que je peux venir si je ne connais personne ?",
    a: "Oui, totalement. L'objectif est justement de creer des liens. Tout est pense pour integrer facilement chacun.",
  },
  {
    category: "Budget",
    q: "Combien ca va vraiment couter ?",
    a: "Le budget estime est entre 200 EUR et 450 EUR hors transport. Cela dependra des choix finaux (logement, activites).",
  },
  {
    category: "Planning",
    q: "Puis-je venir seulement une partie du sejour ?",
    a: "Oui, c'est possible, mais certaines activites principales peuvent etre manquees.",
  },
  {
    category: "Budget",
    q: "Le budget est-il definitif ?",
    a: "Non. C'est une estimation transparente a ce stade, avec ajustements possibles selon le cadrage final.",
  },
  {
    category: "Annulation",
    q: "Que se passe-t-il en cas d'annulation ?",
    a: "Chaque participant reste responsable de ses reservations. Les conditions dependent des prestataires et aucun remboursement n'est garanti par TENF.",
  },
  {
    category: "Mineurs",
    q: "Les mineurs sont-ils acceptes ?",
    a: "Oui, uniquement avec accompagnant majeur responsable et autorisation parentale obligatoire.",
  },
  {
    category: "Assurance",
    q: "Y a-t-il une assurance incluse ?",
    a: "Une assurance personnelle est fortement recommandee. TENF ne couvre pas les incidents individuels.",
  },
  {
    category: "Accompagnants",
    q: "Puis-je venir avec un accompagnant ?",
    a: "Possible selon disponibilite. Priorite aux membres actifs TENF et respect obligatoire des regles par les accompagnants.",
  },
];

export default function NewFamilyAventuraFaqPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
        <section
          className="rounded-3xl border p-6 sm:p-8"
          style={{
            borderColor: "rgba(145,70,255,0.35)",
            background:
              "linear-gradient(135deg, rgba(145,70,255,0.16) 0%, rgba(236,72,153,0.1) 55%, rgba(15,17,22,0.95) 100%)",
          }}
        >
          <h1 className="flex items-center gap-2 text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>
            <HelpCircle size={26} style={{ color: "var(--color-primary)" }} />
            FAQ IRL - New Family Aventura
          </h1>
          <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Questions frequentes pour clarifier rapidement le projet avant inscription.
          </p>
        </section>

        <section className="mt-6 space-y-3">
          {faqItems.map((item) => (
            <article key={item.q} className="rounded-2xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
              <p className="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ borderColor: "rgba(145,70,255,0.35)", color: "var(--color-primary)" }}>
                {item.category}
              </p>
              <h2 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
                {item.q}
              </h2>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {item.a}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-2xl border p-5" style={{ borderColor: "rgba(239,68,68,0.35)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            Points importants a retenir
          </h2>
          <div className="mt-3 grid gap-2">
            {[
              "Aucun remboursement garanti par TENF.",
              "Mineur accepte uniquement avec accompagnant majeur responsable.",
              "Assurance personnelle fortement recommandee.",
              "Accompagnants acceptes selon disponibilite (priorite membres actifs).",
            ].map((item) => (
              <p key={item} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(239,68,68,0.25)", color: "var(--color-text-secondary)" }}>
                - {item}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            Tu ne trouves pas ta reponse ?
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Envoie ta question en indiquant ton contexte. L'equipe admin pourra te repondre directement et enrichir la FAQ.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/new-family-aventura/questions" className="inline-flex rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
              Poser une question aux admins
            </Link>
            <Link href="/new-family-aventura/infos-pratiques" className="inline-flex rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
              Relire les infos pratiques
            </Link>
          </div>
        </section>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/new-family-aventura" className="inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            <ArrowLeft size={14} /> Retour au projet
          </Link>
          <Link href="/new-family-aventura/questions" className="inline-flex rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
            Poser une question
          </Link>
        </div>
      </div>
    </main>
  );
}
