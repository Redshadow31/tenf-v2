"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { HelpCircle, LifeBuoy, Send, ShieldCheck, Users } from "lucide-react";

type FaqItem = {
  question: string;
  answer: string[];
};

const rejoindreFaq: FaqItem[] = [
  {
    question: "Comment rejoindre Twitch Entraide New Family (TENF) ?",
    answer: [
      "Rejoins le serveur Discord via le lien d'invitation.",
      "Lis les regles et valide ton arrivee.",
      "Participe a la reunion d'integration obligatoire.",
    ],
  },
  {
    question: "La reunion d'integration est-elle obligatoire ?",
    answer: [
      "Oui.",
      "C'est un moment important pour comprendre le fonctionnement de l'entraide, le systeme de points, les regles du serveur et l'etat d'esprit de la communaute.",
      "Sans cette reunion, tu restes en statut Streamer (non integre).",
    ],
  },
  {
    question: "Que se passe-t-il apres la reunion ?",
    answer: [
      "Tu obtiens ton role (Affilie / Developpement...).",
      "Tu accedes aux salons d'entraide.",
      "Tu peux partager ta chaine.",
      "Tu entres dans le systeme de points.",
    ],
  },
  {
    question: "Faut-il etre affilie Twitch pour rejoindre ?",
    answer: ["Non.", "Tu peux rejoindre TENF si tu es affilie, en developpement ou debutant motive."],
  },
  {
    question: "Dois-je suivre tous les membres ?",
    answer: [
      "C'est fortement conseille.",
      "L'objectif n'est pas une obligation stricte mais une demarche naturelle et sincere pour decouvrir les createurs et creer du lien.",
    ],
  },
  {
    question: "Dois-je etre present sur les lives ?",
    answer: [
      "Oui, avec une approche intelligente.",
      "On attend une presence reguliere et de l'interaction de temps en temps, sans pression excessive.",
      "Le but est de creer du lien et de soutenir reellement les autres.",
    ],
  },
  {
    question: "Et si je suis timide ou debutant ?",
    answer: ["Tu es au bon endroit.", "TENF est la pour accompagner, mettre a l'aise et aider a progresser, a ton rythme."],
  },
  {
    question: "Puis-je rejoindre meme si je stream peu ?",
    answer: ["Oui.", "Tant que tu es present un minimum et dans une logique d'entraide, tu as ta place dans la communaute."],
  },
  {
    question: "Combien de membres y a-t-il ?",
    answer: ["TENF regroupe plusieurs centaines de membres, avec une base active engagee."],
  },
];

const generalFaq: FaqItem[] = [
  {
    question: "Qu'est-ce que TENF ?",
    answer: [
      "TENF (Twitch Entraide New Family) est une communaute d'entraide entre streamers Twitch basee sur le soutien mutuel, l'engagement et la bienveillance.",
    ],
  },
  {
    question: "En quoi TENF est different des autres serveurs ?",
    answer: [
      "TENF propose un systeme de points structure, une integration encadree, un staff organise et forme, un vrai suivi des membres et une entraide active.",
    ],
  },
  {
    question: "Comment fonctionne le systeme de points ?",
    answer: [
      "Tu gagnes des points en participant aux lives, en raidant des membres et en interagissant avec la communaute.",
      "Ces points permettent d'evoluer dans le serveur, d'obtenir des avantages et d'acceder a certaines recompenses.",
    ],
  },
  {
    question: "Y a-t-il des recompenses ?",
    answer: ["Oui. Exemples: role VIP temporaire, mises en avant, acces a certains evenements."],
  },
  {
    question: "Quels sont les roles principaux ?",
    answer: [
      "Createur affilie",
      "Createur en developpement",
      "Streamer (en attente d'integration)",
      "Communaute",
      "VIP",
      "Staff (moderateurs, admins...)",
    ],
  },
  {
    question: "Comment devenir moderateur ?",
    answer: [
      "Tu peux le devenir si tu es implique, que tu montres une bonne mentalite et que tu passes une formation obligatoire (environ 2h).",
    ],
  },
  {
    question: "Y a-t-il des formations ?",
    answer: ["Oui. TENF propose des formations OBS, Wizebot, budget et moderation."],
  },
  {
    question: "Que se passe-t-il si je ne suis pas actif ?",
    answer: [
      "Selon la situation, tu peux etre deplace en Communaute, mis en pause ou perdre certains acces.",
      "Toujours avec explication et bienveillance.",
    ],
  },
  {
    question: "Puis-je rester sans streamer ?",
    answer: ["Oui. Le role Communaute permet de participer, soutenir et aider les autres."],
  },
  {
    question: "Y a-t-il des evenements ?",
    answer: ["Oui. Exemples: soirees communautaires, jeux en groupe, raids organises, projets IRL comme Aventura."],
  },
  {
    question: "TENF a-t-il un site ?",
    answer: [
      "Oui. Le site propose une presentation du serveur, les membres actifs, les lives en cours, les evenements et des temoignages.",
    ],
  },
  {
    question: "Qui gere TENF ?",
    answer: ["Les fondateurs sont Red_Shadow_31, Nexou et Clara, avec une equipe staff organisee."],
  },
  {
    question: "TENF est-il gratuit ?",
    answer: ["Oui. L'acces et la participation sont totalement gratuits."],
  },
  {
    question: "Quelle est la valeur principale de TENF ?",
    answer: ["L'humain avant tout: soutien reel, relations durables et evolution ensemble."],
  },
];

const topicLabels: Record<string, string> = {
  integration: "Integration",
  roles: "Roles et statuts",
  points: "Systeme de points",
  activite: "Activite et engagement",
  staff: "Staff et moderation",
  autre: "Autre sujet",
};

export default function RejoindreFaqPage() {
  const [openId, setOpenId] = useState<string | null>("r-0");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState({
    pseudo: "",
    contact: "",
    topic: "integration",
    message: "",
    website: "",
  });

  const groupedFaq = useMemo(
    () => [
      { key: "rejoindre", title: "FAQ — Rejoindre TENF", icon: Users, items: rejoindreFaq, prefix: "r" },
      { key: "general", title: "FAQ — Generale TENF", icon: HelpCircle, items: generalFaq, prefix: "g" },
    ],
    []
  );

  function toggleAccordion(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch("/api/rejoindre/faq-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sourcePage: "/rejoindre/faq",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Impossible d'envoyer ton message.");
      }
      setSuccessMessage(data?.message || "Message envoye.");
      setForm({
        pseudo: "",
        contact: "",
        topic: "integration",
        message: "",
        website: "",
      });
      window.setTimeout(() => setIsModalOpen(false), 1200);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erreur lors de l'envoi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0d1018] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -left-24 h-80 w-80 rounded-full bg-[#7a3cff]/20 blur-[120px]" />
        <div className="absolute top-1/4 -right-20 h-80 w-80 rounded-full bg-[#e12b5b]/18 blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10 md:px-8">
        <section
          className="rounded-3xl border p-6 md:p-8"
          style={{
            borderColor: "rgba(255,255,255,0.12)",
            background: "linear-gradient(145deg, rgba(26,27,38,0.94), rgba(15,16,24,0.95))",
            boxShadow: "0 18px 42px rgba(0,0,0,0.35)",
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.16em] text-[#d8b4ff]">FAQ officielle</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Rejoindre TENF</h1>
              <p className="mt-3 text-sm text-gray-300 md:text-base">
                Toutes les reponses essentielles pour rejoindre la communaute, comprendre le fonctionnement et contacter
                l&apos;equipe si besoin.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7a3cff] to-[#e12b5b] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-[1px]"
              >
                <LifeBuoy size={15} />
                Contacter l&apos;equipe
              </button>
              <Link
                href="/rejoindre"
                className="inline-flex items-center rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white"
              >
                Retour a Rejoindre
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-8 space-y-6">
          {groupedFaq.map((group) => {
            const Icon = group.icon;
            return (
              <section
                key={group.key}
                className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(30,31,39,0.72),rgba(17,18,24,0.78))] p-5"
              >
                <div className="mb-4 flex items-center gap-2">
                  <Icon size={17} className="text-[#d8b4ff]" />
                  <h2 className="text-xl font-semibold">{group.title}</h2>
                </div>

                <div className="space-y-2">
                  {group.items.map((item, index) => {
                    const id = `${group.prefix}-${index}`;
                    const opened = openId === id;
                    return (
                      <article key={id} className="rounded-xl border border-white/10 bg-black/20">
                        <button
                          type="button"
                          onClick={() => toggleAccordion(id)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                        >
                          <span className="text-sm font-semibold text-white md:text-base">{item.question}</span>
                          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#f09fb5]">
                            {opened ? "Masquer" : "Voir"}
                          </span>
                        </button>
                        {opened ? (
                          <div className="border-t border-white/10 px-4 py-3">
                            <ul className="space-y-2">
                              {item.answer.map((line, idx) => (
                                <li key={`${id}-${idx}`} className="text-sm leading-6 text-gray-300">
                                  {line}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-white/12 bg-[#141824] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">Contacter l&apos;equipe TENF</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-gray-200"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Honeypot anti-spam */}
              <input
                type="text"
                value={form.website}
                onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              <label className="block">
                <span className="mb-1 block text-xs uppercase tracking-[0.08em] text-gray-300">Pseudo</span>
                <input
                  required
                  value={form.pseudo}
                  onChange={(e) => setForm((prev) => ({ ...prev, pseudo: e.target.value }))}
                  placeholder="Pseudo Twitch ou Discord"
                  className="w-full rounded-lg border border-white/12 bg-[#0e1220] px-3 py-2 text-sm text-white"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs uppercase tracking-[0.08em] text-gray-300">Contact</span>
                <input
                  required
                  value={form.contact}
                  onChange={(e) => setForm((prev) => ({ ...prev, contact: e.target.value }))}
                  placeholder="Discord, email ou autre moyen de contact"
                  className="w-full rounded-lg border border-white/12 bg-[#0e1220] px-3 py-2 text-sm text-white"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs uppercase tracking-[0.08em] text-gray-300">Sujet</span>
                <select
                  value={form.topic}
                  onChange={(e) => setForm((prev) => ({ ...prev, topic: e.target.value }))}
                  className="w-full rounded-lg border border-white/12 bg-[#0e1220] px-3 py-2 text-sm text-white"
                >
                  {Object.entries(topicLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs uppercase tracking-[0.08em] text-gray-300">Message</span>
                <textarea
                  required
                  minLength={20}
                  value={form.message}
                  onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Explique ton besoin clairement pour que l'equipe puisse te repondre vite."
                  rows={6}
                  className="w-full rounded-lg border border-white/12 bg-[#0e1220] px-3 py-2 text-sm text-white"
                />
              </label>

              {errorMessage ? <p className="text-sm text-rose-300">{errorMessage}</p> : null}
              {successMessage ? (
                <p className="inline-flex items-center gap-1 text-sm text-emerald-300">
                  <ShieldCheck size={14} />
                  {successMessage}
                </p>
              ) : null}

              <div className="flex items-center justify-end pt-1">
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7a3cff] to-[#e12b5b] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <Send size={14} />
                  {sending ? "Envoi..." : "Envoyer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

