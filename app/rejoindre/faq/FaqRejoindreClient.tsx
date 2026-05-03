"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import {
  ArrowRight,
  CalendarClock,
  ChevronDown,
  ExternalLink,
  HelpCircle,
  LifeBuoy,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";

type FaqItem = {
  question: string;
  answer: string[];
};

const rejoindreFaq: FaqItem[] = [
  {
    question: "Comment rejoindre Twitch Entraide New Family (TENF) ?",
    answer: [
      "Rejoins le serveur Discord via le lien d’invitation officiel.",
      "Lis les règles et valide ton arrivée sur le serveur.",
      "Inscris-toi à une réunion d’intégration obligatoire (créneaux sur le site).",
    ],
  },
  {
    question: "La réunion d’intégration est-elle obligatoire ?",
    answer: [
      "Oui.",
      "C’est un moment important pour comprendre l’entraide, le système de points, les règles du serveur et l’état d’esprit de la communauté.",
      "Sans cette réunion, tu restes en statut Streamer (non intégré).",
    ],
  },
  {
    question: "Que se passe-t-il après la réunion ?",
    answer: [
      "Tu obtiens ton rôle (Affilié / Développement…).",
      "Tu accèdes aux salons d’entraide structurée.",
      "Tu peux partager ta chaîne dans les espaces prévus.",
      "Tu entres dans le système de points et les dynamiques communautaires.",
    ],
  },
  {
    question: "Faut-il être affilié Twitch pour rejoindre ?",
    answer: ["Non.", "Tu peux rejoindre TENF si tu es affilié, en développement ou débutant motivé."],
  },
  {
    question: "Dois-je suivre tous les membres ?",
    answer: [
      "Ce n’est pas une obligation « mécanique », mais c’est fortement conseillé.",
      "L’objectif est une démarche naturelle et sincère : découvrir les créateurs et créer du lien, pas une liste à cocher.",
    ],
  },
  {
    question: "Dois-je être présent sur les lives ?",
    answer: [
      "Oui, avec une approche intelligente et durable.",
      "On attend une présence régulière et de l’interaction de temps en temps, sans pression excessive.",
      "Le but est de créer du lien et de soutenir réellement les autres.",
    ],
  },
  {
    question: "Et si je suis timide ou débutant ?",
    answer: [
      "Tu es au bon endroit.",
      "TENF est là pour accompagner, mettre à l’aise et aider à progresser — à ton rythme, avec le staff et les membres.",
    ],
  },
  {
    question: "Puis-je rejoindre même si je stream peu ?",
    answer: [
      "Oui.",
      "Tant que tu es présent un minimum et dans une logique d’entraide sincère, tu as ta place dans la communauté.",
    ],
  },
  {
    question: "Combien de membres y a-t-il ?",
    answer: ["TENF regroupe plusieurs centaines de membres, avec une base active engagée."],
  },
];

const generalFaq: FaqItem[] = [
  {
    question: "Qu’est-ce que TENF ?",
    answer: [
      "TENF (Twitch Entraide New Family) est une communauté d’entraide entre streamers Twitch, basée sur le soutien mutuel, l’engagement et la bienveillance.",
    ],
  },
  {
    question: "En quoi TENF est différent des autres serveurs ?",
    answer: [
      "TENF propose un système de points structuré, une intégration encadrée, un staff organisé et formé, un suivi des membres et une entraide active au quotidien.",
    ],
  },
  {
    question: "Comment fonctionne le système de points ?",
    answer: [
      "Tu gagnes des points en participant aux lives, en raidant des membres et en interagissant avec la communauté.",
      "Ces points permettent d’évoluer dans le serveur, d’obtenir des avantages et d’accéder à certaines récompenses.",
    ],
  },
  {
    question: "Y a-t-il des récompenses ?",
    answer: ["Oui. Exemples : rôle VIP temporaire, mises en avant, accès à certains événements."],
  },
  {
    question: "Quels sont les rôles principaux ?",
    answer: [
      "Créateur affilié",
      "Créateur en développement",
      "Streamer (en attente d’intégration)",
      "Communauté",
      "VIP",
      "Staff (modérateurs, admins…)",
    ],
  },
  {
    question: "Comment devenir modérateur ?",
    answer: [
      "Tu peux le devenir si tu es impliqué, que tu montres une bonne mentalité et que tu passes une formation obligatoire (environ 2 h).",
    ],
  },
  {
    question: "Y a-t-il des formations ?",
    answer: ["Oui. TENF propose des formations OBS, Wizebot, budget et modération."],
  },
  {
    question: "Que se passe-t-il si je ne suis pas actif ?",
    answer: [
      "Selon la situation, tu peux être déplacé en Communauté, mis en pause ou perdre certains accès.",
      "Toujours avec explication et bienveillance de la part du staff.",
    ],
  },
  {
    question: "Puis-je rester sans streamer ?",
    answer: ["Oui. Le rôle Communauté permet de participer, soutenir et aider les autres."],
  },
  {
    question: "Y a-t-il des événements ?",
    answer: ["Oui. Exemples : soirées communautaires, jeux en groupe, raids organisés, projets comme Aventura."],
  },
  {
    question: "TENF a-t-il un site ?",
    answer: [
      "Oui. Le site propose une présentation du serveur, les membres actifs, les lives en cours, les événements et des témoignages.",
    ],
  },
  {
    question: "Qui gère TENF ?",
    answer: ["Les fondateurs sont Red_Shadow_31, Nexou et Clara, avec une équipe staff organisée."],
  },
  {
    question: "TENF est-il gratuit ?",
    answer: ["Oui. L’accès et la participation sont totalement gratuits."],
  },
  {
    question: "Quelle est la valeur principale de TENF ?",
    answer: ["L’humain avant tout : soutien réel, relations durables et progression ensemble."],
  },
];

const topicLabels: Record<string, string> = {
  integration: "Intégration",
  roles: "Rôles et statuts",
  points: "Système de points",
  activite: "Activité et engagement",
  staff: "Staff et modération",
  autre: "Autre sujet",
};

type FilterTab = "all" | "rejoindre" | "general";

type FlatFaq = {
  id: string;
  groupKey: Exclude<FilterTab, "all">;
  groupTitle: string;
  item: FaqItem;
};

function ContactModal({
  open,
  onClose,
  form,
  setForm,
  sending,
  errorMessage,
  successMessage,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  form: { pseudo: string; contact: string; topic: string; message: string; website: string };
  setForm: Dispatch<SetStateAction<{ pseudo: string; contact: string; topic: string; message: string; website: string }>>;
  sending: boolean;
  errorMessage: string;
  successMessage: string;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const msgLen = form.message.length;
  const minLen = 20;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-black/70 p-0 backdrop-blur-md sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="faq-contact-title"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-xl max-h-[90dvh] flex-col overflow-hidden rounded-t-3xl border border-white/15 bg-[#101322] shadow-2xl sm:max-h-[min(88dvh,760px)] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative shrink-0 border-b border-white/10 bg-gradient-to-br from-[#2a1f4a]/90 via-[#12141f] to-[#1a1428] px-5 pb-4 pt-5 sm:px-6">
          <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full bg-fuchsia-500/20 blur-2xl" />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-xl border border-white/15 bg-black/30 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-violet-200/90">
            <MessageCircle className="h-4 w-4" />
            Équipe TENF
          </div>
          <h3 id="faq-contact-title" className="mt-2 pr-10 text-xl font-bold text-white sm:text-2xl">
            Contacter l&apos;équipe
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Décris ta situation : le staff lit les messages régulièrement. Pas de données sensibles (mot de passe,
            token).
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <input
            type="text"
            value={form.website}
            onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
          />

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4 sm:px-6">
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Pseudo</span>
                <input
                  required
                  value={form.pseudo}
                  onChange={(e) => setForm((prev) => ({ ...prev, pseudo: e.target.value }))}
                  placeholder="Pseudo Twitch ou Discord"
                  className="w-full rounded-xl border border-white/12 bg-[#0a0d16] px-3 py-2.5 text-sm text-white outline-none ring-violet-500/30 focus:ring-2"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Contact</span>
                <input
                  required
                  value={form.contact}
                  onChange={(e) => setForm((prev) => ({ ...prev, contact: e.target.value }))}
                  placeholder="Discord, e-mail ou autre moyen fiable"
                  className="w-full rounded-xl border border-white/12 bg-[#0a0d16] px-3 py-2.5 text-sm text-white outline-none ring-violet-500/30 focus:ring-2"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Sujet</span>
                <select
                  value={form.topic}
                  onChange={(e) => setForm((prev) => ({ ...prev, topic: e.target.value }))}
                  className="w-full rounded-xl border border-white/12 bg-[#0a0d16] px-3 py-2.5 text-sm text-white outline-none ring-violet-500/30 focus:ring-2"
                >
                  {Object.entries(topicLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <span>Message</span>
                  <span className={msgLen >= minLen ? "text-emerald-400/90" : "text-slate-500"}>
                    {msgLen}/{minLen} min.
                  </span>
                </span>
                <textarea
                  required
                  minLength={minLen}
                  value={form.message}
                  onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Explique ton besoin : contexte, ce que tu as déjà essayé, ce que tu attends du staff…"
                  rows={5}
                  className="w-full resize-none rounded-xl border border-white/12 bg-[#0a0d16] px-3 py-2.5 text-sm text-white outline-none ring-violet-500/30 focus:ring-2"
                />
              </label>

              {errorMessage ? (
                <p className="rounded-xl border border-rose-500/35 bg-rose-950/30 px-3 py-2 text-sm text-rose-100">{errorMessage}</p>
              ) : null}
              {successMessage ? (
                <p className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-100">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  {successMessage}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 border-t border-white/10 bg-black/30 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7a3cff] to-[#e12b5b] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/25 transition hover:brightness-110 disabled:opacity-55"
            >
              <Send className="h-4 w-4" />
              {sending ? "Envoi…" : "Envoyer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FaqRejoindreClient() {
  const [openId, setOpenId] = useState<string | null>("r-0");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [query, setQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [form, setForm] = useState({
    pseudo: "",
    contact: "",
    topic: "integration",
    message: "",
    website: "",
  });

  const groupedFaq = useMemo(
    () => [
      { key: "rejoindre" as const, title: "Rejoindre TENF", subtitle: "Parcours, réunion, rôles", icon: Users, items: rejoindreFaq, prefix: "r" },
      { key: "general" as const, title: "La communauté TENF", subtitle: "Points, valeurs, événements", icon: HelpCircle, items: generalFaq, prefix: "g" },
    ],
    []
  );

  const flatFaq = useMemo((): FlatFaq[] => {
    return groupedFaq.flatMap((group) =>
      group.items.map((item, index) => ({
        id: `${group.prefix}-${index}`,
        groupKey: group.key,
        groupTitle: group.title,
        item,
      }))
    );
  }, [groupedFaq]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return flatFaq.filter((row) => {
      const blob = [row.item.question, ...row.item.answer, row.groupTitle].join(" ").toLowerCase();
      return blob.includes(q);
    });
  }, [flatFaq, query]);

  const visibleGroups = useMemo(() => {
    if (searchResults) return [];
    return groupedFaq.filter((g) => filterTab === "all" || g.key === filterTab);
  }, [groupedFaq, filterTab, searchResults]);

  const totalQuestions = rejoindreFaq.length + generalFaq.length;

  const toggleAccordion = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
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
        throw new Error(data?.error || "Impossible d’envoyer ton message.");
      }
      setSuccessMessage(data?.message || "Message envoyé. Merci !");
      setForm({
        pseudo: "",
        contact: "",
        topic: "integration",
        message: "",
        website: "",
      });
      window.setTimeout(() => setIsModalOpen(false), 1400);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erreur lors de l’envoi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#0a0c12] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[100px]" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-fuchsia-600/15 blur-[110px]" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-[90px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <section className="overflow-hidden rounded-3xl border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
          <div className="relative border-b border-white/10 bg-gradient-to-br from-violet-950/50 via-[#12141f] to-fuchsia-950/30 px-6 py-8 md:px-10 md:py-10">
            <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-fuchsia-500/15 blur-3xl" />
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-100">
                    <Sparkles className="h-3.5 w-3.5" />
                    FAQ officielle
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                    Public & futurs membres
                  </span>
                </div>
                <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Questions fréquentes</h1>
                <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
                  Tout ce qu&apos;il faut savoir pour <strong className="text-white">rejoindre TENF</strong>, comprendre
                  la réunion d&apos;intégration et le fonctionnement du serveur — puis contacter le staff si ton cas
                  n&apos;est pas couvert ici.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:brightness-110"
                  >
                    <LifeBuoy className="h-4 w-4" />
                    Écrire au staff
                  </button>
                  <Link
                    href="/integration"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-black/25 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
                  >
                    <CalendarClock className="h-4 w-4 text-violet-300" />
                    Créneaux d&apos;intégration
                  </Link>
                  <Link
                    href="/rejoindre/guide-integration"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-black/25 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
                  >
                    Guide intégration
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/rejoindre"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:text-white"
                  >
                    Hub Rejoindre
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                  </Link>
                </div>
              </div>
              <div className="grid w-full max-w-sm grid-cols-2 gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                  <p className="text-2xl font-bold tabular-nums text-white">{totalQuestions}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Questions</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                  <p className="text-2xl font-bold tabular-nums text-violet-200">2</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Rubriques</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-white/10 bg-[#0e1018]/95 px-4 py-4 md:px-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher dans les questions…"
                  className="w-full rounded-xl border border-white/12 bg-[#0a0d16] py-2.5 pl-10 pr-3 text-sm text-white outline-none ring-violet-500/25 placeholder:text-slate-600 focus:ring-2"
                />
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 rounded-xl border border-white/10 bg-black/25 p-1 md:justify-end">
                {(
                  [
                    { id: "all" as const, label: "Tout" },
                    { id: "rejoindre" as const, label: "Rejoindre" },
                    { id: "general" as const, label: "Communauté" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFilterTab(t.id)}
                    disabled={Boolean(query.trim())}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition disabled:opacity-40 sm:text-sm ${
                      filterTab === t.id && !query.trim()
                        ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            {query.trim() ? (
              <p className="mt-3 text-center text-xs text-slate-500 md:text-left">
                Filtre rubrique désactivé pendant la recherche — {searchResults?.length ?? 0} résultat(s)
              </p>
            ) : null}
          </div>
        </section>

        <div className="mt-10 space-y-8">
          {searchResults ? (
            <section className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(30,31,39,0.85),rgba(12,14,22,0.92))] p-5 md:p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Search className="h-5 w-5 text-violet-300" />
                Résultats de recherche
              </h2>
              {searchResults.length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">Aucune question ne correspond. Essaie un autre mot-clé ou contacte le staff.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {searchResults.map((row) => (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setQuery("");
                          setFilterTab(row.groupKey);
                          setOpenId(row.id);
                          window.setTimeout(() => {
                            document.getElementById(`faq-${row.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }, 50);
                        }}
                        className="flex w-full flex-col rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-left transition hover:border-violet-500/40 hover:bg-white/[0.04]"
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-fuchsia-300/90">{row.groupTitle}</span>
                        <span className="mt-1 text-sm font-semibold text-white">{row.item.question}</span>
                        <span className="mt-1 text-xs text-violet-300">Ouvrir dans la rubrique →</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          {visibleGroups.map((group) => {
            const Icon = group.icon;
            return (
              <section
                key={group.key}
                id={`section-${group.key}`}
                className="scroll-mt-24 rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(28,30,40,0.88),rgba(14,16,24,0.92))] p-5 shadow-xl md:p-7"
              >
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{group.title}</h2>
                      <p className="text-xs text-slate-500">{group.subtitle}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {group.items.map((item, index) => {
                    const id = `${group.prefix}-${index}`;
                    const opened = openId === id;
                    return (
                      <article
                        key={id}
                        id={`faq-${id}`}
                        className={`overflow-hidden rounded-xl border transition ${
                          opened ? "border-violet-500/40 bg-black/35 shadow-[0_0_0_1px_rgba(139,92,246,0.25)]" : "border-white/10 bg-black/20"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleAccordion(id)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left md:px-5"
                          aria-expanded={opened}
                        >
                          <span className="text-sm font-semibold leading-snug text-white md:text-base">{item.question}</span>
                          <ChevronDown
                            className={`h-5 w-5 shrink-0 text-fuchsia-300 transition-transform duration-200 ${opened ? "rotate-180" : ""}`}
                          />
                        </button>
                        {opened ? (
                          <div className="border-t border-white/10 px-4 pb-4 pt-0 md:px-5">
                            <ul className="mt-3 space-y-2.5 border-l-2 border-violet-500/40 pl-4">
                              {item.answer.map((line, idx) => (
                                <li key={`${id}-${idx}`} className="text-sm leading-relaxed text-slate-300">
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

        <section className="mt-12 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-950/40 via-[#12141f] to-fuchsia-950/25 px-6 py-10 text-center md:px-10">
          <h2 className="text-2xl font-bold md:text-3xl">Ta question n&apos;est pas dans la liste ?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
            Le staff lit les messages envoyés depuis ce site. Plus ton message est clair (contexte, pseudo, ce que tu as
            déjà essayé), plus la réponse sera rapide.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-3 text-sm font-bold text-white shadow-xl transition hover:brightness-110"
            >
              <LifeBuoy className="h-4 w-4" />
              Contacter l&apos;équipe
            </button>
            <Link
              href="/rejoindre/guide-public/faq-publique"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-black/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              FAQ visiteurs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>

      <ContactModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setErrorMessage("");
          setSuccessMessage("");
        }}
        form={form}
        setForm={setForm}
        sending={sending}
        errorMessage={errorMessage}
        successMessage={successMessage}
        onSubmit={handleSubmit}
      />
    </main>
  );
}
