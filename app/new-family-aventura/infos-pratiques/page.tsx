import Link from "next/link";
import { ArrowLeft, BedDouble, Bus, Euro, ShieldCheck } from "lucide-react";

const infoBlocks = [
  {
    title: "Transport",
    icon: Bus,
    points: [
      "Transport a la charge des participants.",
      "Acces possible via train (Tarragone), voiture ou avion (Barcelone).",
      "Organisation de covoiturage possible via Discord.",
    ],
  },
  {
    title: "Hebergement",
    icon: BedDouble,
    points: [
      "Logement en groupe (villa / appartements).",
      "Repartition par petits groupes.",
      "Staff loge ensemble (organisation interne).",
    ],
  },
  {
    title: "Budget",
    icon: Euro,
    points: [
      "Budget estime: 200 EUR a 450 EUR (hors transport).",
      "Montant variable selon logement et activites choisies.",
      "Objectif: garder une proposition accessible et realiste.",
    ],
  },
  {
    title: "Securite",
    icon: ShieldCheck,
    points: [
      "Respect obligatoire entre participants.",
      "Comportement adapte en groupe et consommation responsable.",
      "Exclusion possible en cas de non-respect des regles.",
    ],
  },
];

const includedItems = [
  "Hebergement.",
  "Acces aux activites principales (dont PortAventura selon formule).",
];

const excludedItems = [
  "Transport.",
  "Repas et depenses personnelles.",
];

const prepTimeline = [
  {
    step: "1. Annonce et ouverture des infos",
    detail: "Publication du projet et mise en place des pages de reference.",
  },
  {
    step: "2. Pre-inscriptions et organisation",
    detail: "Recueil des intentions et cadrage logistique selon les retours.",
  },
  {
    step: "3. Validation des participants",
    detail: "Confirmation des places selon priorites et capacite.",
  },
  {
    step: "4. Voyage et experience IRL",
    detail: "Execution terrain avec staff referent et suivi communaute.",
  },
];

export default function NewFamilyAventuraInfosPratiquesPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <section
          className="rounded-3xl border p-6 sm:p-8"
          style={{
            borderColor: "rgba(145,70,255,0.35)",
            background:
              "linear-gradient(135deg, rgba(145,70,255,0.16) 0%, rgba(56,189,248,0.09) 55%, rgba(15,17,22,0.95) 100%)",
          }}
        >
          <p className="inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em]" style={{ borderColor: "rgba(255,255,255,0.2)", color: "var(--color-text)" }}>
            New Family Aventura
          </p>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>
            Infos pratiques IRL
          </h1>
          <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Region visee: Catalogne (Espagne), zone Costa Daurada / PortAventura World.
          </p>
          <p className="mt-1 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Periode cible: fin mai / debut juin 2027 (dates precises a confirmer).
          </p>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Zone", value: "Costa Daurada" },
            { label: "Periode", value: "Mai/Juin 2027" },
            { label: "Budget cible", value: "200-450 EUR" },
          ].map((item) => (
            <article key={item.label} className="rounded-xl border px-4 py-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
              <p className="text-xs uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
                {item.label}
              </p>
              <p className="mt-1 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                {item.value}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {infoBlocks.map((block) => (
            <article key={block.title} className="rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
              <div className="flex items-center gap-2">
                <block.icon size={18} style={{ color: "var(--color-primary)" }} />
                <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                  {block.title}
                </h2>
              </div>
              <div className="mt-3 grid gap-2">
                {block.points.map((point) => (
                  <p key={point} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--color-text-secondary)" }}>
                    - {point}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            Lieu et cadre
          </h2>
          <div className="mt-3 grid gap-2">
            {[
              "Region: Catalogne (Espagne).",
              "Zone: Costa Daurada / PortAventura World.",
              "Hebergement prevu autour de L'Ametlla de Mar ou equivalent.",
            ].map((item) => (
              <p key={item} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--color-text-secondary)" }}>
                - {item}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            Ce qui est inclus / non inclus (base de travail)
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Bloc provisoire que vous pourrez adapter avec vos informations finalisees.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border p-4" style={{ borderColor: "rgba(34,197,94,0.35)", backgroundColor: "var(--color-bg)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                Inclus
              </p>
              <div className="mt-2 grid gap-2">
                {includedItems.map((item) => (
                  <p key={item} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(34,197,94,0.25)", color: "var(--color-text-secondary)" }}>
                    - {item}
                  </p>
                ))}
              </div>
            </article>
            <article className="rounded-xl border p-4" style={{ borderColor: "rgba(239,68,68,0.35)", backgroundColor: "var(--color-bg)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                Non inclus
              </p>
              <div className="mt-2 grid gap-2">
                {excludedItems.map((item) => (
                  <p key={item} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(239,68,68,0.25)", color: "var(--color-text-secondary)" }}>
                    - {item}
                  </p>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            Conditions de participation
          </h2>
          <div className="mt-3 grid gap-2">
            {[
              "Etre membre de TENF.",
              "Etre actif dans la communaute.",
              "Respecter les regles du serveur.",
              "Inscription validee par l'equipe (places limitees).",
            ].map((item) => (
              <p key={item} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--color-text-secondary)" }}>
                - {item}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            Contact urgence / referent
          </h2>
          <div className="mt-3 grid gap-2">
            {[
              "Staff TENF present sur place.",
              "Referent principal: Red / equipe organisatrice.",
              "Canal Discord dedie ouvert pendant l'evenement.",
            ].map((item) => (
              <p key={item} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--color-text-secondary)" }}>
                - {item}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            Timeline projet
          </h2>
          <div className="mt-3 grid gap-2">
            {prepTimeline.map((item) => (
              <article key={item.step} className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.12)", backgroundColor: "var(--color-bg)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {item.step}
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {item.detail}
                </p>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/new-family-aventura" className="inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            <ArrowLeft size={14} /> Retour au projet
          </Link>
          <Link href="/new-family-aventura/questions" className="inline-flex rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
            Poser une question aux admins
          </Link>
        </div>
      </div>
    </main>
  );
}
