import Link from "next/link";

const publicFaq = [
  {
    question: "Faut-il payer pour creer un espace TENF ?",
    answer: "Non. L'acces de base et la creation de compte via Discord sont gratuits.",
  },
  {
    question: "Dois-je deja etre streamer pour rejoindre ?",
    answer:
      "Pas obligatoirement. Tu peux decouvrir la communaute avant, puis suivre les etapes d'integration quand tu es pret.",
  },
  {
    question: "Je n'ai pas de mot de passe TENF, c'est normal ?",
    answer:
      "Oui. Sur TENF, l'authentification passe principalement par Discord, donc pas de mot de passe classique a memoriser pour le compte public.",
  },
  {
    question: "Que faire si la connexion Discord echoue ?",
    answer:
      "Reessaye une fois, puis verifie que tu es bien connecte a Discord dans ton navigateur. Si l'erreur persiste, utilise la FAQ ou contacte le support staff.",
  },
  {
    question: "Combien de temps pour activer mon espace ?",
    answer:
      "L'espace est cree automatiquement des la premiere connexion validee. Dans certains cas, un rafraichissement de la page peut etre necessaire.",
  },
  {
    question: "Ou poser une question avant de rejoindre ?",
    answer:
      "Tu peux consulter la page FAQ rejoindre, puis passer par les canaux de contact TENF si besoin d'un accompagnement.",
  },
];

export default function GuidePublicFaqPubliquePage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <section className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            FAQ publique
          </h1>
          <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Reponses aux questions les plus frequentes avant integration.
          </p>
        </section>

        <section className="mt-4 rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <div className="space-y-2">
            {publicFaq.map((item) => (
              <article key={item.question} className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                <h2 className="text-sm font-semibold sm:text-base" style={{ color: "var(--color-text)" }}>
                  {item.question}
                </h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {item.answer}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/rejoindre/faq"
              className="inline-flex rounded-lg border px-3 py-2 text-sm font-semibold"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Voir la FAQ detaillee
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex rounded-lg px-3 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Creer mon espace maintenant
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
