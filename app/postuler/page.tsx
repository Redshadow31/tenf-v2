"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  HeartHandshake,
  Info,
  LayoutDashboard,
  Loader2,
  MessageCircle,
  Mic,
  Send,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { getDiscordUser, loginWithDiscord, type DiscordUser } from "@/lib/discord";

type RolePostule = "moderateur" | "soutien" | "les_deux";
type AdminStatus = "nouveau" | "a_contacter" | "entretien_prevu" | "accepte" | "refuse" | "archive";

type StaffApplication = {
  id: string;
  created_at: string;
  updated_at: string;
  applicant_discord_id: string;
  applicant_username: string;
  answers: Record<string, any>;
  admin_status: AdminStatus;
  member_final_decision?: {
    at: string;
    author: string;
    outcome: "soutien_tenf" | "moderateur_formation" | "candidature_refusee";
    memberMessage: string;
  } | null;
};

type FormState = {
  role_postule: RolePostule | "";
  pseudo_discord: string;
  pseudo_twitch: string;
  age: string;
  pays_fuseau: string;
  disponibilites: string;
  pourquoi_tenf: string;
  pourquoi_role: string;
  motivation_560: string;
  style_communication: "direct" | "empathique" | "structure" | "mixte" | "autre" | "";
  style_communication_autre: string;
  /** Preférence d'animation staff (parcours modérateur uniquement, requis par l'API). */
  preference_cadre: "cadre" | "humain" | "mix";
  engagement_hebdo: "2h" | "4h" | "6h" | "variable" | "";
  engagement_hebdo_variable: string;
  poles_interet: string[];
  objectif_apprentissage: string;
  commentaire_libre: string;
  consentement_traitement: boolean;
  comprend_entretien: boolean;
  accepte_confidentialite: boolean;
  // Moderateur
  micro_ok: "oui" | "non" | "";
  vocal_reunion: "oui" | "non" | "parfois" | "";
  experience_modo: "oui" | "non" | "";
  experience_details: string;
  experience_similaire: string;
  niveau_discord: "1" | "2" | "3" | "4" | "5" | "";
  principes_proportionnalite: "oui" | "non" | "";
  principes_proportionnalite_explication: string;
  difference_sanctions: "oui" | "non" | "";
  difference_sanctions_exemple: string;
  redaction_cr: "oui" | "non" | "";
  scenario_critique_staff: string;
  scenario_clash_vocal: string;
  scenario_dm_grave: string;
  scenario_spam_promo: string;
  scenario_modo_sec: string;
  scenario_manipulation: string;
  scenario_intrusif_vocal: string;
  contradiction: string;
  quand_jai_tort: string;
  limites_declencheurs: string;
  prise_de_recul: string;
  energie_mentale: "1" | "2" | "3" | "4" | "5" | "";
  periode_impact: "non" | "oui_legere" | "oui_importante" | "";
  periode_gestion: string;
  passer_relais: "oui" | "non" | "";
  passer_relais_exemple: string;
  desaccord_staff: string;
  accepte_pause_retrait: "oui" | "non" | "";
  accepte_pause_retrait_pourquoi: string;
  ami_demande_infos: string;
  accepte_documenter: "oui" | "non" | "";
};

const INITIAL_FORM: FormState = {
  role_postule: "",
  pseudo_discord: "",
  pseudo_twitch: "",
  age: "",
  pays_fuseau: "",
  disponibilites: "",
  pourquoi_tenf: "",
  pourquoi_role: "",
  motivation_560: "",
  style_communication: "",
  style_communication_autre: "",
  preference_cadre: "mix",
  engagement_hebdo: "",
  engagement_hebdo_variable: "",
  poles_interet: [],
  objectif_apprentissage: "",
  commentaire_libre: "",
  consentement_traitement: false,
  comprend_entretien: false,
  accepte_confidentialite: false,
  micro_ok: "",
  vocal_reunion: "",
  experience_modo: "",
  experience_details: "",
  experience_similaire: "",
  niveau_discord: "",
  principes_proportionnalite: "",
  principes_proportionnalite_explication: "",
  difference_sanctions: "",
  difference_sanctions_exemple: "",
  redaction_cr: "",
  scenario_critique_staff: "",
  scenario_clash_vocal: "",
  scenario_dm_grave: "",
  scenario_spam_promo: "",
  scenario_modo_sec: "",
  scenario_manipulation: "",
  scenario_intrusif_vocal: "",
  contradiction: "",
  quand_jai_tort: "",
  limites_declencheurs: "",
  prise_de_recul: "",
  energie_mentale: "",
  periode_impact: "",
  periode_gestion: "",
  passer_relais: "",
  passer_relais_exemple: "",
  desaccord_staff: "",
  accepte_pause_retrait: "",
  accepte_pause_retrait_pourquoi: "",
  ami_demande_infos: "",
  accepte_documenter: "",
};

const INTEREST_OPTIONS = [
  "modération chat",
  "modération vocal",
  "accueil nouveaux",
  "gestion conflits",
  "rédaction CR",
  "organisation événements",
  "soutien communauté",
  "accompagnement nouveaux",
  "autre",
] as const;

/** Champs texte / select : focus visible, confort lecture. */
const FIELD_CLASS =
  "w-full rounded-xl border border-white/12 bg-[#0a0c12]/90 px-3.5 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 transition focus:border-violet-500/45 focus:outline-none focus:ring-2 focus:ring-violet-500/15";
const SELECT_CLASS = `${FIELD_CLASS} cursor-pointer`;
const INTEREST_PILL_ON =
  "min-h-[40px] rounded-xl border border-violet-400/55 bg-violet-500/15 px-3.5 py-2 text-sm font-medium text-violet-100 shadow-sm transition hover:border-violet-300/60";
const INTEREST_PILL_OFF =
  "min-h-[40px] rounded-xl border border-white/12 bg-black/20 px-3.5 py-2 text-sm text-zinc-400 transition hover:border-white/20 hover:text-zinc-200";

const MOD_SCENARIO_BLOCKS: {
  key: keyof FormState;
  title: string;
  hint: string;
  placeholder: string;
}[] = [
  {
    key: "scenario_critique_staff",
    title: "Critique envers le staff, en public",
    hint: "Décris comment tu accueillerais la remarque, ce que tu ferais tout de suite et ce que tu éviterais. Aucun scénario « idéal » : on veut comprendre ta réflexion.",
    placeholder: "Ex. : je prends le temps de… je propose de… je ne ferais pas…",
  },
  {
    key: "scenario_clash_vocal",
    title: "Tension entre deux personnes en vocal",
    hint: "Même approximatif, ça suffit. L’important, c’est ton calme, tes mots, et quand tu ferais appel à d’autres staff.",
    placeholder: "Comment tu coupes / recadres / relies au règlement, étape par étape…",
  },
  {
    key: "scenario_dm_grave",
    title: "Message privé avec un contenu grave",
    hint: "Pense protection des personnes, preuves, escalade. Il n’y a pas une seule bonne formule : raconte ce que tu ferais concrètement.",
    placeholder: "Accueil de la personne, signalement, qui contacter, ce que tu ne ferais pas seul·e…",
  },
  {
    key: "scenario_spam_promo",
    title: "Spam ou auto-promo répétée",
    hint: "Proportionnalité, clarté, ton. Tu peux dire si tu préfères l’avertissement, le mute, etc. et pourquoi.",
    placeholder: "Premier message, deuxième action, si ça continue…",
  },
  {
    key: "scenario_modo_sec",
    title: "Tu es seul·e en modération, situation floue",
    hint: "C’est normal d’hésiter : dis comment tu gagnes du recul, qui tu chercherais, et comment tu rassures le salon.",
    placeholder: "Ralentir, poser des questions, couper le son si besoin, appeler du renfort…",
  },
  {
    key: "scenario_manipulation",
    title: "Comportement manipulatoire ou culpabilisant",
    hint: "On cherche ta lucidité et ta bienveillance, pas un cours magistral. Écris comme tu expliquerais à un pair.",
    placeholder: "Signaux, ce que tu dis au groupe, suivi en privé ou pas…",
  },
  {
    key: "scenario_intrusif_vocal",
    title: "Comportement intrusif en vocal (pression, monologue…)",
    hint: "Pense confort du groupe et respect des limites. Toute réponse honnête est utile.",
    placeholder: "Rappel des rappels, coupure, message staff, etc.",
  },
];

function ReassuranceBanner({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      className="mb-6 flex gap-3 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-[#0f1520] to-violet-950/25 p-4 sm:gap-4 sm:p-5"
      role="note"
    >
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-500/10 text-emerald-200">
        <Info className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="font-bold text-emerald-100">{title}</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{children}</p>
      </div>
    </div>
  );
}

function FormField({
  label,
  hint,
  required,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-zinc-200">
        {label}
        {required ? <span className="text-violet-300/90"> *</span> : null}
      </label>
      {hint ? <p className="mb-2 text-xs leading-relaxed text-zinc-500">{hint}</p> : null}
      {children}
    </div>
  );
}

const EDITABLE_STATUSES: AdminStatus[] = ["nouveau", "a_contacter", "entretien_prevu"];

function statusLabel(status: AdminStatus): string {
  const map: Record<AdminStatus, string> = {
    nouveau: "Envoyée — en attente de relecture",
    a_contacter: "En cours d’examen",
    entretien_prevu: "Entretien planifié",
    accepte: "Acceptée",
    refuse: "Refusée",
    archive: "Annulée / archivée",
  };
  return map[status];
}

function statusBadgeStyles(status: AdminStatus): { bg: string; border: string; text: string } {
  switch (status) {
    case "nouveau":
      return { bg: "rgba(139,92,246,0.15)", border: "rgba(167,139,250,0.45)", text: "#e9d5ff" };
    case "a_contacter":
      return { bg: "rgba(245,158,11,0.12)", border: "rgba(251,191,36,0.4)", text: "#fde68a" };
    case "entretien_prevu":
      return { bg: "rgba(34,211,238,0.12)", border: "rgba(103,232,249,0.4)", text: "#a5f3fc" };
    case "accepte":
      return { bg: "rgba(52,211,153,0.12)", border: "rgba(110,231,183,0.45)", text: "#bbf7d0" };
    case "refuse":
      return { bg: "rgba(244,63,94,0.12)", border: "rgba(251,113,133,0.4)", text: "#fecdd3" };
    default:
      return { bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.35)", text: "#e2e8f0" };
  }
}

const LANDING_JOURNEY = [
  { step: 1, title: "Connexion Discord", text: "On vérifie ton identité pour traiter ta candidature en toute sécurité." },
  { step: 2, title: "Ton rôle", text: "Modération, soutien communautaire, ou les deux — tu choisis ce qui te correspond." },
  { step: 3, title: "Questionnaire", text: "Des questions concrètes sur ta disponibilité, ton vécu et ta posture." },
  { step: 4, title: "Échanges staff", text: "Si ta candidature est retenue, un membre du staff peut te proposer un entretien." },
] as const;

const LANDING_VALUES = [
  {
    icon: Shield,
    title: "Cadre bienveillant",
    text: "Des règles claires et une équipe qui assume ses décisions, avec transparence et respect.",
  },
  {
    icon: Users,
    title: "Humain avant tout",
    text: "On cherche des personnes stables, à l’écoute, capables de désamorcer sans humilier.",
  },
  {
    icon: MessageCircle,
    title: "Communication fluide",
    text: "Discord, vocal, écrit : une bonne dose de tact et de clarté pour accompagner la communauté.",
  },
] as const;

const LANDING_FAQ = [
  {
    q: "Il faut être membre TENF pour postuler ?",
    a: "Oui : la candidature passe par ton compte Discord lié à la communauté. Si tu découvres TENF, commence par rejoindre le serveur et participer avant de te porter volontaire.",
  },
  {
    q: "Quelle différence entre « modérateur » et « soutien TENF » ?",
    a: "Le parcours modérateur inclut des scénarios et une réflexion approfondie sur la posture staff. Le soutien TENF est un parcours plus léger, axé sur l’engagement et la présence au service des membres.",
  },
  {
    q: "Combien de temps ça prend ?",
    a: "Le questionnaire prend généralement 20 à 45 minutes selon le rôle. Ensuite, le staff lit les candidatures à son rythme : merci d’être patient·e.",
  },
  {
    q: "Je peux modifier ma candidature ?",
    a: "Tant qu’elle est « en attente » ou « en cours d’examen », oui — tu peux la mettre à jour ou l’annuler depuis cette même page.",
  },
] as const;

function roleLabel(role: RolePostule): string {
  if (role === "moderateur") return "Modérateur·rice";
  if (role === "soutien") return "Soutien TENF";
  return "Modération + soutien";
}

function finalDecisionLabel(value: "soutien_tenf" | "moderateur_formation" | "candidature_refusee"): string {
  if (value === "soutien_tenf") return "Soutien TENF";
  if (value === "moderateur_formation") return "Modérateur·rice en formation";
  return "Candidature refusée";
}

function toFormFromAnswers(answers: Record<string, any>, username: string): FormState {
  return {
    ...INITIAL_FORM,
    role_postule: answers.role_postule || "",
    pseudo_discord: answers.pseudo_discord || username || "",
    pseudo_twitch: answers.pseudo_twitch || "",
    age: answers.age ? String(answers.age) : "",
    pays_fuseau: answers.pays_fuseau || "",
    disponibilites: answers.disponibilites || "",
    pourquoi_tenf: answers.pourquoi_tenf || "",
    pourquoi_role: answers.pourquoi_role || "",
    motivation_560: answers.motivation_560 || "",
    style_communication: answers.style_communication || "",
    style_communication_autre: answers.style_communication_autre || "",
    preference_cadre: ["cadre", "humain", "mix"].includes(answers.preference_cadre)
      ? answers.preference_cadre
      : "mix",
    engagement_hebdo: answers.engagement_hebdo || "",
    engagement_hebdo_variable: answers.engagement_hebdo_variable || "",
    poles_interet: Array.isArray(answers.poles_interet) ? answers.poles_interet : [],
    objectif_apprentissage: answers.objectif_apprentissage || "",
    commentaire_libre: answers.commentaire_libre || "",
    consentement_traitement: !!answers.consentement_traitement,
    comprend_entretien: !!answers.comprend_entretien,
    accepte_confidentialite: !!answers.accepte_confidentialite,
    micro_ok: answers.micro_ok === true ? "oui" : answers.micro_ok === false ? "non" : "",
    vocal_reunion: answers.vocal_reunion || "",
    experience_modo: answers.experience_modo === true ? "oui" : answers.experience_modo === false ? "non" : "",
    experience_details: answers.experience_details || "",
    experience_similaire: answers.experience_similaire || "",
    niveau_discord: answers.niveau_discord ? String(answers.niveau_discord) as FormState["niveau_discord"] : "",
    principes_proportionnalite:
      answers.principes_proportionnalite === true ? "oui" : answers.principes_proportionnalite === false ? "non" : "",
    principes_proportionnalite_explication: answers.principes_proportionnalite_explication || "",
    difference_sanctions:
      answers.difference_sanctions === true ? "oui" : answers.difference_sanctions === false ? "non" : "",
    difference_sanctions_exemple: answers.difference_sanctions_exemple || "",
    redaction_cr: answers.redaction_cr === true ? "oui" : answers.redaction_cr === false ? "non" : "",
    scenario_critique_staff: answers.scenario_critique_staff || "",
    scenario_clash_vocal: answers.scenario_clash_vocal || "",
    scenario_dm_grave: answers.scenario_dm_grave || "",
    scenario_spam_promo: answers.scenario_spam_promo || "",
    scenario_modo_sec: answers.scenario_modo_sec || "",
    scenario_manipulation: answers.scenario_manipulation || "",
    scenario_intrusif_vocal: answers.scenario_intrusif_vocal || "",
    contradiction: answers.contradiction || "",
    quand_jai_tort: answers.quand_jai_tort || "",
    limites_declencheurs: answers.limites_declencheurs || "",
    prise_de_recul: answers.prise_de_recul || "",
    energie_mentale: answers.energie_mentale ? String(answers.energie_mentale) as FormState["energie_mentale"] : "",
    periode_impact: answers.periode_impact || "",
    periode_gestion: answers.periode_gestion || "",
    passer_relais: answers.passer_relais === true ? "oui" : answers.passer_relais === false ? "non" : "",
    passer_relais_exemple: answers.passer_relais_exemple || "",
    desaccord_staff: answers.desaccord_staff || "",
    accepte_pause_retrait:
      answers.accepte_pause_retrait === true ? "oui" : answers.accepte_pause_retrait === false ? "non" : "",
    accepte_pause_retrait_pourquoi: answers.accepte_pause_retrait_pourquoi || "",
    ami_demande_infos: answers.ami_demande_infos || "",
    accepte_documenter: answers.accepte_documenter === true ? "oui" : answers.accepte_documenter === false ? "non" : "",
  };
}

function buildPayload(form: FormState) {
  return {
    ...form,
    age: Number(form.age),
    micro_ok: form.micro_ok === "oui",
    experience_modo: form.experience_modo === "oui",
    niveau_discord: form.niveau_discord ? Number(form.niveau_discord) : undefined,
    principes_proportionnalite: form.principes_proportionnalite === "oui",
    difference_sanctions: form.difference_sanctions === "oui",
    redaction_cr: form.redaction_cr === "oui",
    energie_mentale: form.energie_mentale ? Number(form.energie_mentale) : undefined,
    passer_relais: form.passer_relais === "oui",
    accepte_pause_retrait: form.accepte_pause_retrait === "oui",
    accepte_documenter: form.accepte_documenter === "oui",
  };
}

export default function PostulerPage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applications, setApplications] = useState<StaffApplication[]>([]);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [mode, setMode] = useState<"status" | "form">("status");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const skipScrollRef = useRef(true);

  useEffect(() => {
    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stepIndex, mode]);

  useEffect(() => {
    (async () => {
      const discordUser = await getDiscordUser();
      setUser(discordUser);
      if (discordUser) {
        setForm((prev) => ({ ...prev, pseudo_discord: discordUser.username }));
        await loadMyApplications();
        if (searchParams?.get("submitted") === "1") {
          setSuccess("Candidature envoyée avec succès. Merci pour ton implication — le staff TENF revient vers toi.");
        }
      }
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMyApplications() {
    const response = await fetch("/api/staff-applications/me", { cache: "no-store" });
    const body = await response.json();
    if (response.ok) {
      setApplications(body.applications || []);
    }
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleInterest(value: string) {
    setForm((prev) => {
      const next = prev.poles_interet.includes(value)
        ? prev.poles_interet.filter((v) => v !== value)
        : [...prev.poles_interet, value];
      return { ...prev, poles_interet: next };
    });
  }

  const steps = useMemo(() => {
    if (form.role_postule === "moderateur" || form.role_postule === "les_deux") {
      return ["Choix du role", "Informations communes", "Questionnaire moderateur 1", "Questionnaire moderateur 2", "Recapitulatif"];
    }
    if (form.role_postule === "soutien") {
      return ["Choix du role", "Informations communes", "Questionnaire soutien", "Recapitulatif"];
    }
    return ["Choix du role", "Informations communes", "Recapitulatif"];
  }, [form.role_postule]);

  function validateCurrentStep(): string | null {
    const isModerator = form.role_postule === "moderateur" || form.role_postule === "les_deux";
    const step = steps[stepIndex];
    if (step === "Choix du role" && !form.role_postule)
      return "Choisis un rôle ci-dessus pour débloquer la suite — tu pourras encore changer d’avis avant l’envoi.";
    if (step === "Informations communes") {
      if (!form.pseudo_discord.trim()) return "Ajoute ton pseudo Discord tel qu’on te reconnaît sur le serveur.";
      if (!form.age || Number(form.age) < 13) return "Indique un âge (minimum 13 ans) — c’est une obligation légale pour nous.";
      if (!form.pays_fuseau.trim()) return "Indique ton pays ou fuseau horaire : ça aide pour les créneaux vocaux.";
      if (!form.disponibilites.trim()) return "Parle-nous un peu de tes disponibilités (même à la louche : ça compte).";
      if (!form.pourquoi_tenf.trim()) return "Qu’est-ce qui te fait vibrer chez TENF ? Quelques phrases honnêtes suffisent.";
      if (!form.pourquoi_role.trim()) return "Pourquoi ce rôle plutôt qu’un autre ? Il n’y a pas de réponse « attendue ».";
      if (!form.motivation_560.trim()) return "Ta motivation détaillée nous manque encore — raconte-toi comme tu le ferais à un humain.";
    }
    if (step === "Questionnaire soutien") {
      if (!form.style_communication) return "Choisis le style de communication qui te ressemble le plus (tu peux être nuancé·e dans les champs libres).";
      if (!form.engagement_hebdo) return "Indique un ordre de grandeur d’engagement par semaine — une estimation honnête suffit.";
      if (form.engagement_hebdo === "variable" && !form.engagement_hebdo_variable.trim())
        return "Précise ce que « variable » veut dire pour toi (ex. selon les semaines).";
      if (form.poles_interet.length === 0) return "Coche au moins un pôle d’intérêt — c’est pour mieux te situer, pas pour te classer.";
      if (!form.objectif_apprentissage.trim()) return "Dis-nous ce que tu aimerais apprendre ou renforcer avec nous.";
    }
    if (step === "Questionnaire moderateur 1" && isModerator) {
      if (!form.micro_ok || !form.vocal_reunion)
        return "Merci de répondre sur le micro et ta présence en vocal staff — même si la réponse est « non », elle nous aide.";
      if (!form.experience_modo) return "Indique si tu as déjà modéré (oui/non) : les deux sont ok.";
      if (form.experience_modo === "oui" && !form.experience_details.trim())
        return "Raconte brièvement ton expérience de modération — pas besoin d’être exhaustif·ve.";
      if (form.experience_modo === "non" && !form.experience_similaire.trim())
        return "Sans expérience modération, parle-nous d’un contexte proche (jeu, asso, boulot…) où tu as tenu un cadre.";
      if (!form.niveau_discord || !form.energie_mentale)
        return "Complète ton niveau Discord et ton ressenti énergétique — ce sont des repères, pas un jugement.";
      if (!form.principes_proportionnalite || !form.principes_proportionnalite_explication.trim())
        return "La partie « proportionnalité » est incomplète : écris comme tu le ressens, sans chercher la définition parfaite.";
      if (!form.difference_sanctions || !form.difference_sanctions_exemple.trim())
        return "La partie « sanctions » est incomplète — un exemple personnel ou hypothétique va très bien.";
      if (!form.redaction_cr) return "Dis-nous si tu es à l’aise pour rédiger un petit compte-rendu (oui/non).";
      if (!form.style_communication) return "Choisis le style de communication qui te ressemble le plus.";
    }
    if (step === "Questionnaire moderateur 2" && isModerator) {
      const required = [
        form.scenario_critique_staff,
        form.scenario_clash_vocal,
        form.scenario_dm_grave,
        form.scenario_spam_promo,
        form.scenario_modo_sec,
        form.scenario_manipulation,
        form.scenario_intrusif_vocal,
        form.contradiction,
        form.quand_jai_tort,
        form.limites_declencheurs,
        form.prise_de_recul,
        form.passer_relais_exemple,
        form.desaccord_staff,
        form.accepte_pause_retrait_pourquoi,
        form.ami_demande_infos,
        form.objectif_apprentissage,
      ];
      if (required.some((v) => !v.trim()))
        return "Il manque encore du texte dans cette page — reprends les champs vides : des phrases courtes suffisent, on lit tout avec bienveillance.";
      if (!form.periode_impact) return "Indique si tu traverses parfois des périodes plus sensibles — « non » est une réponse tout à fait valable.";
      if (form.periode_impact !== "non" && !form.periode_gestion.trim())
        return "Explique comment tu prends soin de toi pendant ces périodes — pas de détails intimes obligatoires.";
      if (!form.passer_relais || !form.accepte_pause_retrait || !form.accepte_documenter)
        return "Réponds aux trois questions oui/non sur relais, pause et documentation — elles protègent tout le monde.";
      if (!form.engagement_hebdo) return "Choisis un engagement hebdomadaire indicatif.";
      if (form.engagement_hebdo === "variable" && !form.engagement_hebdo_variable.trim())
        return "Précise ce que « variable » veut dire pour toi.";
      if (form.poles_interet.length === 0) return "Sélectionne au moins un pôle d’intérêt.";
    }
    if (step === "Recapitulatif") {
      if (!form.consentement_traitement || !form.comprend_entretien || !form.accepte_confidentialite) {
        return "Coche les trois cases en bas : elles confirment que tu as bien lu et que tu es d’accord pour qu’on traite ta candidature.";
      }
    }
    return null;
  }

  function goNext() {
    const err = validateCurrentStep();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStepIndex((s) => Math.min(s + 1, steps.length - 1));
  }

  function goPrev() {
    setError(null);
    setStepIndex((s) => Math.max(s - 1, 0));
  }

  async function submitApplication() {
    const err = validateCurrentStep();
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = buildPayload(form);
      const response = editingId
        ? await fetch("/api/staff-applications/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editingId, answers: payload }),
          })
        : await fetch("/api/staff-applications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Impossible d envoyer la candidature.");
      }
      await loadMyApplications();
      setMode("status");
      setEditingId(null);
      setForm((prev) => ({ ...INITIAL_FORM, pseudo_discord: prev.pseudo_discord }));
      setStepIndex(0);
      setSuccess(
        editingId
          ? "Candidature mise à jour. Merci pour ta réactivité."
          : "Candidature envoyée. Merci pour ta confiance — le staff TENF traite ta demande.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  }

  function startNew() {
    setEditingId(null);
    setForm((prev) => ({ ...INITIAL_FORM, pseudo_discord: prev.pseudo_discord }));
    setStepIndex(0);
    setMode("form");
    setError(null);
  }

  function editApplication(item: StaffApplication) {
    if (!user) return;
    setEditingId(item.id);
    setForm(toFormFromAnswers(item.answers || {}, user.username));
    setStepIndex(0);
    setMode("form");
    setError(null);
    setSuccess(null);
  }

  async function cancelApplication(id: string) {
    if (!window.confirm("Confirmer l’annulation de cette candidature ?")) return;
    const response = await fetch("/api/staff-applications/me", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error || "Impossible d annuler la candidature.");
      return;
    }
    await loadMyApplications();
    setSuccess("Candidature annulée.");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090b12] text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-300" />
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="min-h-screen text-white"
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(124,58,237,0.35), transparent 55%), radial-gradient(ellipse 90% 60% at 100% 40%, rgba(206,25,70,0.12), transparent 45%), #07080f",
        }}
      >
        <div className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6 md:pb-24 md:pt-12">
          <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
            >
              <ArrowLeft size={16} aria-hidden />
              Accueil TENF
            </Link>
            <Link
              href="/rejoindre"
              className="text-sm font-medium text-violet-300 underline-offset-4 hover:text-violet-200 hover:underline"
            >
              Découvrir la communauté
            </Link>
          </header>

          <section className="relative overflow-hidden rounded-3xl border px-6 py-12 sm:px-10 sm:py-16 md:py-20">
            <div
              className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full opacity-50 blur-3xl"
              style={{ background: "rgba(139,92,246,0.35)" }}
            />
            <div
              className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full opacity-40 blur-3xl"
              style={{ background: "rgba(59,130,246,0.2)" }}
            />
            <div className="relative text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-violet-400/45 bg-violet-950/40 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-violet-200">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Bénévolat & équipe
              </p>
              <h1 className="mt-6 text-balance text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
                Rejoins le staff <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-200 to-violet-400">TENF</span>
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-zinc-300 sm:text-xl">
                Que tu sois déjà membre de la New Family ou que tu nous découvres : cette page explique le parcours pour{" "}
                <strong className="font-semibold text-white">modérer</strong> ou{" "}
                <strong className="font-semibold text-white">soutenir</strong> la communauté — avec sérieux, bienveillance et
                transparence.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() => loginWithDiscord()}
                  className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#5865F2] px-8 py-3.5 text-base font-bold shadow-lg shadow-indigo-950/50 transition hover:brightness-110 sm:w-auto"
                >
                  Continuer avec Discord
                  <ArrowRight size={18} aria-hidden />
                </button>
                <p className="max-w-xs text-center text-xs leading-relaxed text-zinc-500 sm:text-left">
                  Connexion obligatoire pour envoyer ta candidature — on associe ta réponse à ton identité Discord TENF.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-12 grid gap-5 md:grid-cols-3">
            {LANDING_VALUES.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="group rounded-2xl border border-white/[0.08] bg-[#0f111a]/90 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] transition duration-300 hover:border-violet-500/35 hover:-translate-y-0.5"
              >
                <div className="mb-4 inline-flex rounded-xl border border-violet-500/30 bg-violet-500/10 p-3 text-violet-200 transition group-hover:bg-violet-500/18">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <h2 className="text-lg font-bold text-white">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{text}</p>
              </article>
            ))}
          </section>

          <section className="mt-14 rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#12141f]/95 to-[#0a0c14]/98 p-6 sm:p-10">
            <div className="mb-10 max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-300/90">Parcours</p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Comment ça se passe, concrètement ?</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
                Pas de surprise : tu avances étape par étape, tu peux sauvegarder ta progression mentalement (les questions sont sur une
                seule session), et tu retrouves tes dossiers une fois connecté·e.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {LANDING_JOURNEY.map(({ step, title, text }) => (
                <div
                  key={step}
                  className="relative rounded-2xl border border-white/10 bg-black/25 p-5 transition hover:border-violet-400/30"
                >
                  <span className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-sm font-black tabular-nums shadow-md">
                    {step}
                  </span>
                  <h3 className="mt-4 font-bold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-14 grid gap-8 lg:grid-cols-2 lg:items-start">
            <div className="rounded-3xl border border-cyan-500/20 bg-[#0d111c]/90 p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <Mic className="h-8 w-8 text-cyan-300" aria-hidden />
                <div>
                  <h2 className="text-xl font-bold">Modérateur·rice</h2>
                  <p className="text-sm text-cyan-100/70">Posture staff complète</p>
                </div>
              </div>
              <ul className="mt-5 space-y-3 text-sm leading-relaxed text-zinc-300">
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" aria-hidden />
                  Scénarios (chat, vocal, tensions) et gestion du stress.
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" aria-hidden />
                  Micro correct, disponibilité pour les échanges d’équipe.
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" aria-hidden />
                  Formation et montée en compétences si tu es retenu·e.
                </li>
              </ul>
            </div>
            <div className="rounded-3xl border border-rose-500/20 bg-[#0d111c]/90 p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <HeartHandshake className="h-8 w-8 text-rose-300" aria-hidden />
                <div>
                  <h2 className="text-xl font-bold">Soutien TENF</h2>
                  <p className="text-sm text-rose-100/70">Engagement communautaire</p>
                </div>
              </div>
              <ul className="mt-5 space-y-3 text-sm leading-relaxed text-zinc-300">
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden />
                  Questionnaire plus court, axé motivation et disponibilités.
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden />
                  Idéal si tu veux aider sans passer par tout le volet modération.
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden />
                  Tu peux aussi viser « les deux » pour montrer ta polyvalence.
                </li>
              </ul>
            </div>
          </section>

          <section className="mt-14 rounded-3xl border border-white/[0.08] bg-[#0c0e16]/95 p-6 sm:p-10">
            <h2 className="text-2xl font-bold">Questions fréquentes</h2>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Clique sur une question pour afficher la réponse — tout ce qu’il faut savoir avant de te lancer.
            </p>
            <div className="mt-8 divide-y divide-white/10 rounded-2xl border border-white/10 bg-black/20">
              {LANDING_FAQ.map((item, i) => {
                const open = openFaqIndex === i;
                return (
                  <div key={item.q}>
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(open ? null : i)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/[0.04]"
                      aria-expanded={open}
                    >
                      <span className="font-semibold text-white sm:text-[17px]">{item.q}</span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-violet-300 transition-transform ${open ? "rotate-180" : ""}`}
                        aria-hidden
                      />
                    </button>
                    {open ? (
                      <div className="border-t border-white/5 px-5 pb-5 pt-0">
                        <p className="pt-3 text-sm leading-relaxed text-zinc-400">{item.a}</p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-14 overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-950/80 via-[#14101f] to-[#0a0812] p-8 text-center sm:p-12">
            <h2 className="text-2xl font-bold sm:text-3xl">Prêt·e à passer à l’action ?</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-400">
              Les membres TENF comme les curieux·ses passent par la même porte : Discord pour candidater, puis formulaire guidé.
            </p>
            <button
              type="button"
              onClick={() => loginWithDiscord()}
              className="mt-8 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-base font-bold text-violet-950 shadow-xl transition hover:bg-zinc-100"
            >
              Me connecter et candidater
              <ArrowRight size={18} aria-hidden />
            </button>
          </section>
        </div>
      </div>
    );
  }

  const openApplications = applications.filter((a) => EDITABLE_STATUSES.includes(a.admin_status));

  function goToStep(i: number) {
    if (i >= stepIndex) return;
    setError(null);
    setStepIndex(i);
  }

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background:
          "radial-gradient(ellipse 100% 70% at 50% -15%, rgba(124,58,237,0.22), transparent 50%), radial-gradient(ellipse 70% 50% at 100% 20%, rgba(206,25,70,0.08), transparent 45%), #07080f",
      }}
    >
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 md:space-y-8 md:py-10">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/member/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-300 transition hover:border-violet-400/35 hover:text-white"
          >
            <LayoutDashboard size={16} aria-hidden />
            Dashboard
          </Link>
          <Link href="/" className="text-sm text-zinc-500 transition hover:text-zinc-300">
            Site public
          </Link>
        </div>

        <section className="relative overflow-hidden rounded-3xl border border-violet-500/25 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8 md:p-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 0% 0%, rgba(139,92,246,0.25), transparent 55%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(236,72,153,0.12), transparent 50%)",
            }}
          />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300/90">Espace candidature</p>
            <h1 className="mt-3 text-balance text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
              Staff TENF : ton parcours guidé
            </h1>
            <p className="mt-4 max-w-3xl text-pretty text-sm leading-relaxed text-zinc-300 sm:text-[15px]">
              Tu choisis ton rôle (modération, soutien ou les deux), tu réponds au questionnaire adapté, puis tu envoies. Tant que le staff
              n’a pas clos le dossier, tu peux corriger ou annuler — on préfère une candidature honnête à une réponse parfaite recopiée.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-medium text-zinc-300">
                <Shield className="h-3.5 w-3.5 text-violet-400" aria-hidden />
                Traitement confidentiel
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-medium text-zinc-300">
                <Users className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
                Équipe bénévole
              </span>
            </div>
          </div>
        </section>

        {success ? (
          <div className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200 shadow-lg shadow-emerald-950/20">
            <div className="inline-flex items-start gap-3">
              <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden />
              <span>{success}</span>
            </div>
          </div>
        ) : null}
        {error ? (
          <div
            className="rounded-2xl border border-red-500/40 bg-red-950/40 px-5 py-4 text-sm text-red-200"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {mode === "status" ? (
          <section className="rounded-3xl border border-white/[0.08] bg-[#0f111a]/95 p-5 shadow-xl sm:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">Mes candidatures</h2>
                <p className="mt-1 text-sm text-zinc-400">Historique et statut côté staff — mets à jour tant que c’est possible.</p>
              </div>
              <button
                type="button"
                onClick={startNew}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-violet-400/45 bg-gradient-to-r from-violet-600/90 to-fuchsia-600/80 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-950/40 transition hover:brightness-110"
              >
                <ClipboardList size={18} aria-hidden />
                Nouvelle candidature
              </button>
            </div>

            {applications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-violet-500/25 bg-violet-950/10 px-6 py-14 text-center">
                <Sparkles className="mx-auto h-12 w-12 text-violet-400/80" aria-hidden />
                <p className="mt-4 text-lg font-semibold text-white">Aucune candidature pour l’instant</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
                  Quand tu es prêt·e, lance un dossier : les questions sont pensées pour connaître ta motivation et ta posture, pas pour te
                  piéger.
                </p>
                <button
                  type="button"
                  onClick={startNew}
                  className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-violet-950 transition hover:bg-zinc-100"
                >
                  Commencer ma candidature
                  <ArrowRight size={16} aria-hidden />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((item) => {
                  const editable = EDITABLE_STATUSES.includes(item.admin_status);
                  const role = roleLabel((item.answers?.role_postule || "moderateur") as RolePostule);
                  const finalDecision = item.member_final_decision || null;
                  const badge = statusBadgeStyles(item.admin_status);
                  return (
                    <article
                      key={item.id}
                      className="overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-[#141622]/98 to-[#0c0e14]/98 shadow-lg transition hover:border-violet-500/20"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-bold text-white">{role}</p>
                            <span
                              className="rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                              style={{
                                backgroundColor: badge.bg,
                                borderColor: badge.border,
                                color: badge.text,
                              }}
                            >
                              {statusLabel(item.admin_status)}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-zinc-500">
                            Envoyée le {new Date(item.created_at).toLocaleString("fr-FR")}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {editable ? (
                            <>
                              <button
                                type="button"
                                onClick={() => editApplication(item)}
                                className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-100 transition hover:bg-cyan-500/20"
                              >
                                Modifier
                              </button>
                              <button
                                type="button"
                                onClick={() => cancelApplication(item.id)}
                                className="rounded-xl border border-red-400/45 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-100 transition hover:bg-red-500/18"
                              >
                                Annuler
                              </button>
                            </>
                          ) : (
                            <span className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-medium text-zinc-400">
                              Candidature verrouillée
                            </span>
                          )}
                        </div>
                      </div>
                      {finalDecision ? (
                        <div className="border-t border-amber-500/20 bg-amber-950/25 px-5 py-4 sm:px-6">
                          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-amber-200/90">
                            Décision finale staff
                          </p>
                          <p className="mt-2 text-base font-bold text-amber-50">
                            {finalDecisionLabel(finalDecision.outcome)}
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-amber-100/95">
                            {finalDecision.memberMessage}
                          </p>
                          <p className="mt-3 text-xs text-amber-200/75">
                            {new Date(finalDecision.at).toLocaleString("fr-FR")} · {finalDecision.author}
                          </p>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}

            {openApplications.length > 0 ? (
              <div className="mt-6 rounded-2xl border border-violet-400/30 bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10 p-5 text-sm">
                <p className="font-bold text-violet-100">Merci pour ton implication</p>
                <p className="mt-2 leading-relaxed text-violet-200/90">
                  Le staff TENF étudie ta candidature. Tu peux la modifier ou l’annuler tant qu’elle reste en cours d’examen — n’hésite pas
                  si tu veux préciser un point.
                </p>
              </div>
            ) : null}
          </section>
        ) : (
          <section className="rounded-3xl border border-white/[0.08] bg-[#0f111a]/95 p-5 shadow-xl sm:p-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">
                  {editingId ? "Modifier ma candidature" : "Nouvelle candidature"}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Étape {stepIndex + 1} sur {steps.length} — {steps[stepIndex]}
                </p>
              </div>
              <p className="text-xs text-zinc-500">
                Astuce : clique sur une étape déjà passée pour revenir en arrière.
              </p>
            </div>

            <div className="mb-8 overflow-x-auto pb-2">
              <div className="flex min-w-max gap-2 sm:flex-wrap sm:min-w-0">
                {steps.map((label, i) => {
                  const done = i < stepIndex;
                  const current = i === stepIndex;
                  const clickable = i < stepIndex;
                  return (
                    <button
                      key={`${label}-${i}`}
                      type="button"
                      disabled={!clickable}
                      onClick={() => goToStep(i)}
                      className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-left text-xs font-semibold transition sm:text-sm ${
                        current
                          ? "border-violet-400/55 bg-violet-500/20 text-white shadow-md shadow-violet-950/30"
                          : done
                            ? "cursor-pointer border-emerald-500/30 bg-emerald-500/10 text-emerald-100 hover:border-emerald-400/50"
                            : "cursor-default border-white/10 bg-black/20 text-zinc-500"
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black tabular-nums ${
                          current ? "bg-violet-600 text-white" : done ? "bg-emerald-600 text-white" : "bg-zinc-700 text-zinc-400"
                        }`}
                      >
                        {done ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : i + 1}
                      </span>
                      <span className="max-w-[10rem] truncate sm:max-w-[14rem]">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-8 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-400 transition-all duration-500"
                style={{ width: `${Math.round(((stepIndex + 1) / steps.length) * 100)}%` }}
              />
            </div>

            {steps[stepIndex] !== "Choix du role" ? (
              <ReassuranceBanner title="Il n’y a pas de « bonne » réponse toute faite">
                On lit ta candidature pour te <strong className="font-semibold text-zinc-200">comprendre</strong>, pas pour te classer.
                Réponds avec tes mots : une réponse courte mais honnête vaut mieux qu’un texte « parfait » recopié. Tu peux revenir en arrière
                avec les étapes ou « Précédent » — aucune question piège.
              </ReassuranceBanner>
            ) : null}

            {steps[stepIndex] === "Choix du role" ? (
              <div className="grid gap-4 md:grid-cols-2">
                {(["moderateur", "soutien"] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setField("role_postule", role)}
                    className={`rounded-2xl border p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${form.role_postule === role ? "border-violet-400/70 bg-gradient-to-br from-violet-500/20 to-fuchsia-600/10 shadow-[0_0_0_1px_rgba(167,139,250,0.35)] ring-2 ring-violet-400/30" : "border-white/12 bg-[#11131c]/90 hover:border-violet-400/35"}`}
                  >
                    <p className="inline-flex items-center gap-3 text-lg font-bold">
                      <span
                        className={`rounded-xl border p-2 ${form.role_postule === role ? "border-violet-400/50 bg-violet-500/15 text-violet-100" : "border-white/10 bg-black/30 text-zinc-400"}`}
                      >
                        {role === "moderateur" ? <ClipboardList size={20} aria-hidden /> : <HeartHandshake size={20} aria-hidden />}
                      </span>
                      {role === "moderateur" ? "Modérateur·rice" : "Soutien TENF"}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                      {role === "moderateur"
                        ? "Parcours complet : modération, scénarios et posture staff — pour celles et ceux qui veulent porter le cadre au quotidien."
                        : "Parcours allégé : motivation, disponibilités et engagement communautaire — idéal pour aider sans tout le volet modération."}
                    </p>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setField("role_postule", "les_deux")}
                  className={`rounded-2xl border p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg md:col-span-2 ${form.role_postule === "les_deux" ? "border-fuchsia-400/60 bg-gradient-to-r from-violet-500/15 via-fuchsia-500/15 to-violet-600/10 ring-2 ring-fuchsia-400/25" : "border-white/12 bg-[#11131c]/90 hover:border-fuchsia-400/35"}`}
                >
                  <p className="inline-flex items-center gap-3 text-lg font-bold">
                    <span
                      className={`rounded-xl border p-2 ${form.role_postule === "les_deux" ? "border-fuchsia-400/50 bg-fuchsia-500/15 text-fuchsia-100" : "border-white/10 bg-black/30 text-zinc-400"}`}
                    >
                      <Sparkles size={20} aria-hidden />
                    </span>
                    Les deux parcours
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                    Tu passes le questionnaire modération et tu signaleras aussi une ouverture soutien — utile si tu hésites encore entre les
                    deux.
                  </p>
                </button>
                <p className="md:col-span-2 mt-2 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-relaxed text-zinc-400">
                  <span className="font-semibold text-violet-200">Tranquille :</span> tu peux changer d’avis plus tard en fermant le formulaire
                  tant que tu n’as pas envoyé. Une fois envoyé, tu pourras encore modifier tant que le staff n’a pas verrouillé le dossier.
                </p>
              </div>
            ) : null}

            {steps[stepIndex] === "Informations communes" ? (
              <div className="space-y-8">
                <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4 sm:p-5">
                  <p className="text-sm font-semibold text-white">On commence simple</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                    Ces infos servent à te reconnaître et à anticiper les créneaux. Aucune obligation d’être « impressionnant·e » dans les
                    textes — sois juste clair·e.
                  </p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    label="Pseudo Discord"
                    required
                    hint="Comme sur le serveur TENF, pour qu’on fasse le lien tout de suite."
                  >
                    <input
                      value={form.pseudo_discord}
                      onChange={(e) => setField("pseudo_discord", e.target.value)}
                      placeholder="ex. pseudo#1234 ou @pseudo"
                      className={FIELD_CLASS}
                      autoComplete="username"
                    />
                  </FormField>
                  <FormField label="Pseudo Twitch" hint="Optionnel — utile si tu streams ou si on te connaît surtout là-bas.">
                    <input
                      value={form.pseudo_twitch}
                      onChange={(e) => setField("pseudo_twitch", e.target.value)}
                      placeholder="Laisser vide si tu n’en as pas"
                      className={FIELD_CLASS}
                    />
                  </FormField>
                  <FormField label="Âge" required hint="Minimum 13 ans — obligation légale. Ta sincérité nous suffit.">
                    <input
                      type="number"
                      min={13}
                      value={form.age}
                      onChange={(e) => setField("age", e.target.value)}
                      placeholder="ex. 22"
                      className={FIELD_CLASS}
                    />
                  </FormField>
                  <FormField label="Pays ou fuseau horaire" required hint="Ex. France (UTC+1), Québec… Pour les réunions vocales staff.">
                    <input
                      value={form.pays_fuseau}
                      onChange={(e) => setField("pays_fuseau", e.target.value)}
                      placeholder="ex. Belgique (UTC+1)"
                      className={FIELD_CLASS}
                    />
                  </FormField>
                  <FormField
                    label="Disponibilités"
                    required
                    hint="Plages horaires, jours préférés, contraintes IRL — même approximatif, ça aide déjà énormément."
                    className="md:col-span-2"
                  >
                    <textarea
                      value={form.disponibilites}
                      onChange={(e) => setField("disponibilites", e.target.value)}
                      rows={4}
                      placeholder="ex. plutôt soir en semaine, week-end variables…"
                      className={FIELD_CLASS}
                    />
                  </FormField>
                  <FormField
                    label="Pourquoi TENF ?"
                    required
                    hint="Ce qui t’attire dans la communauté, ce que tu y vis — pas besoin de formules toutes faites."
                    className="md:col-span-2"
                  >
                    <textarea
                      value={form.pourquoi_tenf}
                      onChange={(e) => setField("pourquoi_tenf", e.target.value)}
                      rows={4}
                      placeholder="Parle-nous de ton vécu / ce que tu apprécies ici…"
                      className={FIELD_CLASS}
                    />
                  </FormField>
                  <FormField
                    label="Pourquoi ce rôle ?"
                    required
                    hint="Modération, soutien ou les deux : ce qui te motive personnellement."
                    className="md:col-span-2"
                  >
                    <textarea
                      value={form.pourquoi_role}
                      onChange={(e) => setField("pourquoi_role", e.target.value)}
                      rows={4}
                      placeholder="Ton envie du moment, ce que tu aimerais apporter…"
                      className={FIELD_CLASS}
                    />
                  </FormField>
                  <FormField
                    label="Motivation détaillée"
                    required
                    hint="Prends le temps de développer : on préfère un texte authentique à une liste de qualités. Il n’y a pas de longueur « idéale »."
                    className="md:col-span-2"
                  >
                    <textarea
                      value={form.motivation_560}
                      onChange={(e) => setField("motivation_560", e.target.value)}
                      rows={6}
                      placeholder="Ta motivation, ton histoire avec la communauté, ce que tu espères…"
                      className={FIELD_CLASS}
                    />
                  </FormField>
                </div>
              </div>
            ) : null}

            {steps[stepIndex] === "Questionnaire soutien" ? (
              <div className="space-y-8">
                <div className="rounded-2xl border border-sky-500/20 bg-sky-950/15 p-4 sm:p-5">
                  <p className="text-sm font-semibold text-sky-100">Parcours soutien</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    Ici, on explore ton envie d’aider et ta manière d’être avec les gens. Les réponses du type « je ne sais pas encore » sont
                    valables si tu expliques un peu — l’équipe préfère la nuance au bluff.
                  </p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    label="Style de communication"
                    required
                    hint="Choisis ce qui te ressemble le plus aujourd’hui — pas un engagement à vie."
                  >
                    <select
                      value={form.style_communication}
                      onChange={(e) => setField("style_communication", e.target.value as FormState["style_communication"])}
                      className={SELECT_CLASS}
                    >
                      <option value="">Sélectionner…</option>
                      <option value="direct">Direct·e — je vais droit au but</option>
                      <option value="empathique">Empathique — je valide l’émotion d’abord</option>
                      <option value="structure">Structuré·e — j’aime les étapes claires</option>
                      <option value="mixte">Mixte — ça dépend du contexte</option>
                      <option value="autre">Autre — je précise dans le commentaire libre</option>
                    </select>
                  </FormField>
                  <FormField
                    label="Engagement indicatif (par semaine)"
                    required
                    hint="Une fourchette honnête ; personne ne te tiendra à une minute près sur ce chiffre."
                  >
                    <select
                      value={form.engagement_hebdo}
                      onChange={(e) => setField("engagement_hebdo", e.target.value as FormState["engagement_hebdo"])}
                      className={SELECT_CLASS}
                    >
                      <option value="">Sélectionner…</option>
                      <option value="2h">Environ 2 h</option>
                      <option value="4h">Environ 4 h</option>
                      <option value="6h">Environ 6 h</option>
                      <option value="variable">Variable selon les semaines</option>
                    </select>
                  </FormField>
                  {form.engagement_hebdo === "variable" ? (
                    <FormField
                      label="Précise ce que « variable » veut dire pour toi"
                      required
                      hint="Ex. alternance études / travail, périodes creuses…"
                      className="md:col-span-2"
                    >
                      <input
                        value={form.engagement_hebdo_variable}
                        onChange={(e) => setField("engagement_hebdo_variable", e.target.value)}
                        placeholder="ex. 2 h quand je peux, parfois plus les vacances…"
                        className={FIELD_CLASS}
                      />
                    </FormField>
                  ) : null}
                  <div className="md:col-span-2">
                    <FormField
                      label="Pôles d’intérêt"
                      required
                      hint="Coche tout ce qui t’interpelle — tu pourras affiner plus tard avec le staff. Pas de minimum « prestige »."
                    >
                      <div className="flex flex-wrap gap-2">
                        {INTEREST_OPTIONS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleInterest(option)}
                            className={form.poles_interet.includes(option) ? INTEREST_PILL_ON : INTEREST_PILL_OFF}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </FormField>
                  </div>
                  <FormField
                    label="Objectif d’apprentissage ou d’accompagnement"
                    required
                    hint="Ce que tu aimerais renforcer ou découvrir en étant soutien — technique humaine, organisation, médiation…"
                    className="md:col-span-2"
                  >
                    <textarea
                      value={form.objectif_apprentissage}
                      onChange={(e) => setField("objectif_apprentissage", e.target.value)}
                      rows={4}
                      placeholder="ex. mieux accueillir les nouveaux, tenir un cadre sans durcir le ton…"
                      className={FIELD_CLASS}
                    />
                  </FormField>
                  <FormField
                    label="Commentaire libre"
                    hint="Optionnel : tout ce que tu veux ajouter sans contrainte de forme."
                    className="md:col-span-2"
                  >
                    <textarea
                      value={form.commentaire_libre}
                      onChange={(e) => setField("commentaire_libre", e.target.value)}
                      rows={4}
                      placeholder="Liens, contexte, question pour le staff…"
                      className={FIELD_CLASS}
                    />
                  </FormField>
                </div>
              </div>
            ) : null}

            {steps[stepIndex] === "Questionnaire moderateur 1" ? (
              <div className="space-y-8">
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/15 p-4 sm:p-5">
                  <p className="text-sm font-semibold text-cyan-100">Première partie — matériel & habitude Discord</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    Réponds sans te censurer : si quelque chose te manque (micro, expérience…), dis-le. Le staff préfère savoir où tu pars pour
                    t’accompagner correctement.
                  </p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    label="As-tu un micro utilisable pour les échanges staff ?"
                    required
                    hint="« Non » n’élimine pas automatiquement ta candidature — ça nous aide à être lucides sur les prochaines étapes."
                  >
                    <select
                      value={form.micro_ok}
                      onChange={(e) => setField("micro_ok", e.target.value as FormState["micro_ok"])}
                      className={SELECT_CLASS}
                    >
                      <option value="">Sélectionner…</option>
                      <option value="oui">Oui</option>
                      <option value="non">Non / pas pour l’instant</option>
                    </select>
                  </FormField>
                  <FormField
                    label="Peux-tu être présent·e en vocal pour les réunions ou debriefs staff ?"
                    required
                    hint="« Parfois » est une réponse tout à fait ok si tu expliques tes contraintes dans les étapes suivantes."
                  >
                    <select
                      value={form.vocal_reunion}
                      onChange={(e) => setField("vocal_reunion", e.target.value as FormState["vocal_reunion"])}
                      className={SELECT_CLASS}
                    >
                      <option value="">Sélectionner…</option>
                      <option value="oui">Oui, en général</option>
                      <option value="non">Non, peu probable</option>
                      <option value="parfois">Parfois selon les semaines</option>
                    </select>
                  </FormField>
                  <FormField
                    label="As-tu déjà exercé un rôle de modération ?"
                    required
                    hint="Serveur Twitch, Discord, forum… Les deux réponses sont bienvenues."
                  >
                    <select
                      value={form.experience_modo}
                      onChange={(e) => setField("experience_modo", e.target.value as FormState["experience_modo"])}
                      className={SELECT_CLASS}
                    >
                      <option value="">Sélectionner…</option>
                      <option value="oui">Oui</option>
                      <option value="non">Non</option>
                    </select>
                  </FormField>
                  <FormField
                    label="À l’aise avec Discord (1 = découverte, 5 = très à l’aise)"
                    required
                    hint="Échelle indicative — pas un concours : on veut calibrer la formation si tu es retenu·e."
                  >
                    <select
                      value={form.niveau_discord}
                      onChange={(e) => setField("niveau_discord", e.target.value as FormState["niveau_discord"])}
                      className={SELECT_CLASS}
                    >
                      <option value="">Sélectionner…</option>
                      <option value="1">1 — je découvre encore pas mal de fonctions</option>
                      <option value="2">2</option>
                      <option value="3">3 — à l’aise sur le quotidien</option>
                      <option value="4">4</option>
                      <option value="5">5 — je peux expliquer Discord à quelqu’un</option>
                    </select>
                  </FormField>
                  <FormField
                    label={
                      form.experience_modo === "oui"
                        ? "Raconte ton expérience de modération"
                        : "Parle-nous d’une situation proche (animation, encadrement, médiation…)"
                    }
                    required
                    hint={
                      form.experience_modo === "oui"
                        ? "Contexte, durée, ce que tu aimais / ce qui était dur — quelques phrases suffisent."
                        : "Ex. bénévolat, jeu en clan, classe, famille nombreuse… Ce qui t’a appris à tenir un cadre."
                    }
                    className="md:col-span-2"
                  >
                    <textarea
                      value={form.experience_modo === "oui" ? form.experience_details : form.experience_similaire}
                      onChange={(e) =>
                        form.experience_modo === "oui"
                          ? setField("experience_details", e.target.value)
                          : setField("experience_similaire", e.target.value)
                      }
                      rows={4}
                      placeholder={
                        form.experience_modo === "oui"
                          ? "Où, combien de temps, ton ressenti…"
                          : "Une situation où tu as dû calmer, expliquer les règles, ou coordonner…"
                      }
                      className={FIELD_CLASS}
                    />
                  </FormField>
                  <FormField
                    label="Les sanctions doivent-elles être proportionnées à la situation ?"
                    required
                    hint="Oui / Non puis tu développes en dessous — on lit ta réflexion, pas un cours de droit."
                  >
                    <select
                      value={form.principes_proportionnalite}
                      onChange={(e) => setField("principes_proportionnalite", e.target.value as FormState["principes_proportionnalite"])}
                      className={SELECT_CLASS}
                    >
                      <option value="">Sélectionner…</option>
                      <option value="oui">Oui</option>
                      <option value="non">Non / pas toujours — je nuance ci-dessous</option>
                    </select>
                  </FormField>
                  <FormField
                    label="Fais-tu la différence entre un avertissement, un timeout et un ban ?"
                    required
                    hint="Si tu n’es pas sûr·e, dis-le et décris comment tu t’y prendrais pour apprendre — c’est une réponse valable."
                  >
                    <select
                      value={form.difference_sanctions}
                      onChange={(e) => setField("difference_sanctions", e.target.value as FormState["difference_sanctions"])}
                      className={SELECT_CLASS}
                    >
                      <option value="">Sélectionner…</option>
                      <option value="oui">Oui</option>
                      <option value="non">Je ne maîtrise pas encore — je précise</option>
                    </select>
                  </FormField>
                  <FormField
                    label="Explique ce que « proportionné » veut dire pour toi"
                    required
                    hint="Avec tes mots : lien avec l’intention, la répétition, le contexte…"
                    className="md:col-span-2"
                  >
                    <textarea
                      value={form.principes_proportionnalite_explication}
                      onChange={(e) => setField("principes_proportionnalite_explication", e.target.value)}
                      rows={3}
                      placeholder="Comment tu décides qu’une mesure est adaptée ou trop forte…"
                      className={FIELD_CLASS}
                    />
                  </FormField>
                  <FormField
                    label="Donne un exemple (même simple) de sanctions différentes selon la gravité"
                    required
                    hint="Ça peut être hypothétique — on veut voir si tu distingues l’incivilité légère du problème sérieux."
                    className="md:col-span-2"
                  >
                    <textarea
                      value={form.difference_sanctions_exemple}
                      onChange={(e) => setField("difference_sanctions_exemple", e.target.value)}
                      rows={3}
                      placeholder="Ex. spam léger → rappel / répétition → mute court…"
                      className={FIELD_CLASS}
                    />
                  </FormField>
                  <FormField
                    label="Es-tu à l’aise pour rédiger un court compte-rendu (CR) après une situation sensible ?"
                    required
                    hint="« Non » peut ouvrir la discussion sur la formation — pas une honte."
                  >
                    <select
                      value={form.redaction_cr}
                      onChange={(e) => setField("redaction_cr", e.target.value as FormState["redaction_cr"])}
                      className={SELECT_CLASS}
                    >
                      <option value="">Sélectionner…</option>
                      <option value="oui">Oui, ou prêt·e à apprendre avec un modèle</option>
                      <option value="non">Non pour l’instant — je préfère être accompagné·e</option>
                    </select>
                  </FormField>
                  <FormField label="Style de communication" required hint="Comme pour le parcours soutien — ce qui te ressemble.">
                    <select
                      value={form.style_communication}
                      onChange={(e) => setField("style_communication", e.target.value as FormState["style_communication"])}
                      className={SELECT_CLASS}
                    >
                      <option value="">Sélectionner…</option>
                      <option value="direct">Direct·e</option>
                      <option value="empathique">Empathique</option>
                      <option value="structure">Structuré·e</option>
                      <option value="mixte">Mixte</option>
                      <option value="autre">Autre</option>
                    </select>
                  </FormField>
                  <FormField
                    label="Animation staff : tu préfères plutôt…"
                    required={false}
                    hint="Aucun profil « meilleur » : ça nous aide à former des binômes complémentaires."
                  >
                    <select
                      value={form.preference_cadre}
                      onChange={(e) => setField("preference_cadre", e.target.value as FormState["preference_cadre"])}
                      className={SELECT_CLASS}
                    >
                      <option value="mix">Équilibre cadre clair + écoute humaine</option>
                      <option value="cadre">Cadre et règles très visibles</option>
                      <option value="humain">Humain et médiation avant tout</option>
                    </select>
                  </FormField>
                  <FormField
                    label="Énergie mentale disponible pour la modération (1 = faible marge, 5 = grande marge)"
                    required
                    hint="Si tu es à 1 ou 2, ce n’est pas disqualifiant — ça nous aide à éviter de te surcharger."
                  >
                    <select
                      value={form.energie_mentale}
                      onChange={(e) => setField("energie_mentale", e.target.value as FormState["energie_mentale"])}
                      className={SELECT_CLASS}
                    >
                      <option value="">Sélectionner…</option>
                      <option value="1">1 — petite marge en ce moment</option>
                      <option value="2">2</option>
                      <option value="3">3 — moyenne</option>
                      <option value="4">4</option>
                      <option value="5">5 — grande marge la plupart du temps</option>
                    </select>
                  </FormField>
                </div>
              </div>
            ) : null}

            {steps[stepIndex] === "Questionnaire moderateur 2" ? (
              <div className="space-y-10">
                <div className="rounded-2xl border border-fuchsia-500/20 bg-fuchsia-950/15 p-4 sm:p-5">
                  <p className="text-sm font-semibold text-fuchsia-100">Scénarios & posture — la partie la plus libre</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    Imagine des situations ou raconte des souvenirs — les deux marchent. Si tu ne sais pas, écris ce que tu{" "}
                    <strong className="font-semibold text-zinc-200">essaierais</strong> en premier. Ce n’est pas un examen : on veut voir comment tu
                    protèges les gens et le cadre en même temps.
                  </p>
                </div>

                <div className="space-y-8">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Situations fictives — réponses ouvertes</p>
                  <div className="grid gap-8 md:grid-cols-2">
                    {MOD_SCENARIO_BLOCKS.map(({ key, title, hint, placeholder }) => (
                      <FormField key={key} label={title} required hint={hint} className="md:col-span-2 lg:col-span-1">
                        <textarea
                          value={String(form[key] ?? "")}
                          onChange={(e) => setField(key, e.target.value as FormState[typeof key])}
                          rows={4}
                          placeholder={placeholder}
                          className={FIELD_CLASS}
                        />
                      </FormField>
                    ))}
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    label="Quand quelqu’un te contredit en public, tu fais quoi ?"
                    required
                    hint="Ton tempo, tes mots, si tu passes en privé… Pas de jugement sur ton premier réflexe."
                    className="md:col-span-2"
                  >
                    <textarea
                      value={form.contradiction}
                      onChange={(e) => setField("contradiction", e.target.value)}
                      rows={4}
                      placeholder="ex. je respire, je demande plus de contexte, je propose de continuer en MP…"
                      className={FIELD_CLASS}
                    />
                  </FormField>
                  <FormField
                    label="Quand tu réalises que tu as tort, comment tu le vis et que fais-tu ?"
                    required
                    hint="Montrer qu’on peut se corriger fait partie du staff TENF — ton authenticité compte."
                    className="md:col-span-2"
                  >
                    <textarea
                      value={form.quand_jai_tort}
                      onChange={(e) => setField("quand_jai_tort", e.target.value)}
                      rows={4}
                      placeholder="ex. je le dis clairement, je m’excuse si besoin, j’ajuste…"
                      className={FIELD_CLASS}
                    />
                  </FormField>
                  <FormField
                    label="Tes limites ou déclencheurs personnels (sans détails médicaux obligatoires)"
                    required
                    hint="Pour qu’on sache où te soutenir — « je préfère éviter les vocaux très chargés » suffit parfois."
                    className="md:col-span-2"
                  >
                    <textarea
                      value={form.limites_declencheurs}
                      onChange={(e) => setField("limites_declencheurs", e.target.value)}
                      rows={4}
                      placeholder="Ce qui te pompe vite l’énergie, ce qui te met mal à l’aise…"
                      className={FIELD_CLASS}
                    />
                  </FormField>
                  <FormField
                    label="Comment tu prends du recul après une situation intense ?"
                    required
                    hint="Pause, sport, discussion avec un pair staff… Il n’y a pas de méthode « officielle »."
                    className="md:col-span-2"
                  >
                    <textarea
                      value={form.prise_de_recul}
                      onChange={(e) => setField("prise_de_recul", e.target.value)}
                      rows={4}
                      placeholder="Ce qui t’aide à ne pas ruminer ou à garder la tête froide…"
                      className={FIELD_CLASS}
                    />
                  </FormField>

                  <FormField
                    label="Traverses-tu parfois des périodes où ta capacité à modérer est plus fragile ?"
                    required
                    hint="« Non » est une réponse tout à fait valable — on veut anticiper ensemble les coups durs."
                  >
                    <select
                      value={form.periode_impact}
                      onChange={(e) => setField("periode_impact", e.target.value as FormState["periode_impact"])}
                      className={SELECT_CLASS}
                    >
                      <option value="">Sélectionner…</option>
                      <option value="non">Non, ou très rarement</option>
                      <option value="oui_legere">Oui, des phases plus sensibles mais gérables</option>
                      <option value="oui_importante">Oui, parfois de façon plus forte — je veux en parler avec le staff</option>
                    </select>
                  </FormField>
                  <FormField
                    label="Sais-tu passer le relais quand tu sens que tu n’es plus la bonne personne sur un dossier ?"
                    required
                    hint="Le « oui avec nuance » peut se développer dans le champ suivant."
                  >
                    <select
                      value={form.passer_relais}
                      onChange={(e) => setField("passer_relais", e.target.value as FormState["passer_relais"])}
                      className={SELECT_CLASS}
                    >
                      <option value="">Sélectionner…</option>
                      <option value="oui">Oui</option>
                      <option value="non">Pas encore à l’aise — j’aimerais apprendre</option>
                    </select>
                  </FormField>
                  {form.periode_impact !== "non" ? (
                    <FormField
                      label="Comment tu prends soin de toi ou demandes de l’aide pendant ces périodes ?"
                      required
                      hint="Pas besoin d’exposer ta vie privée — quelques lignes suffisent pour qu’on comprenne comment t’accompagner."
                      className="md:col-span-2"
                    >
                      <textarea
                        value={form.periode_gestion}
                        onChange={(e) => setField("periode_gestion", e.target.value)}
                        rows={4}
                        placeholder="Signalement au staff, pause, répartition des tâches…"
                        className={FIELD_CLASS}
                      />
                    </FormField>
                  ) : null}
                  <FormField
                    label="Exemple concret où tu as su passer la main ou demander de l’aide"
                    required
                    hint="Même petit : ça nous montre ta maturité collective."
                    className="md:col-span-2"
                  >
                    <textarea
                      value={form.passer_relais_exemple}
                      onChange={(e) => setField("passer_relais_exemple", e.target.value)}
                      rows={4}
                      placeholder="Qui tu as prévenu·e, comment tu as formulé…"
                      className={FIELD_CLASS}
                    />
                  </FormField>
                  <FormField
                    label="Tu n’es pas d’accord avec une décision staff — comment tu le vis et qu’est-ce que tu fais ?"
                    required
                    hint="On valorise le désaccord constructif autant que l’alignement."
                    className="md:col-span-2"
                  >
                    <textarea
                      value={form.desaccord_staff}
                      onChange={(e) => setField("desaccord_staff", e.target.value)}
                      rows={4}
                      placeholder="Canal privé, reformulation, besoin de clarification…"
                      className={FIELD_CLASS}
                    />
                  </FormField>
                  <FormField
                    label="Acceptes-tu qu’on puisse te proposer une pause ou un retrait temporaire de certaines missions ?"
                    required
                    hint="Ça protège la communauté et toi — réponds franchement."
                  >
                    <select
                      value={form.accepte_pause_retrait}
                      onChange={(e) => setField("accepte_pause_retrait", e.target.value as FormState["accepte_pause_retrait"])}
                      className={SELECT_CLASS}
                    >
                      <option value="">Sélectionner…</option>
                      <option value="oui">Oui, je comprends l’intérêt</option>
                      <option value="non">Non / difficile pour moi — je précise en dessous</option>
                    </select>
                  </FormField>
                  <FormField
                    label="Acceptes-tu de documenter certaines situations (notes internes staff) pour la continuité d’équipe ?"
                    required
                    hint="Les notes restent dans le périmètre staff — dis-nous si tu as besoin d’un cadre clair."
                  >
                    <select
                      value={form.accepte_documenter}
                      onChange={(e) => setField("accepte_documenter", e.target.value as FormState["accepte_documenter"])}
                      className={SELECT_CLASS}
                    >
                      <option value="">Sélectionner…</option>
                      <option value="oui">Oui</option>
                      <option value="non">Pas à l’aise pour l’instant — à discuter</option>
                    </select>
                  </FormField>
                  <FormField
                    label="Pourquoi cette réponse sur la pause / le retrait ?"
                    required
                    hint="Même deux phrases : ce qui te rassure ou ce qui t’inquiète."
                    className="md:col-span-2"
                  >
                    <textarea
                      value={form.accepte_pause_retrait_pourquoi}
                      onChange={(e) => setField("accepte_pause_retrait_pourquoi", e.target.value)}
                      rows={3}
                      placeholder="ex. je préfère qu’on me le propose si je montre des signes de fatigue…"
                      className={FIELD_CLASS}
                    />
                  </FormField>
                  <FormField
                    label="Un ami te demande des infos « confidentielles » sur une sanction ou un dossier staff"
                    required
                    hint="On veut voir comment tu protèges la confiance du serveur sans être brusque."
                    className="md:col-span-2"
                  >
                    <textarea
                      value={form.ami_demande_infos}
                      onChange={(e) => setField("ami_demande_infos", e.target.value)}
                      rows={3}
                      placeholder="Ce que tu réponds, ce que tu refuses, ce que tu proposes à la place…"
                      className={FIELD_CLASS}
                    />
                  </FormField>
                  <FormField
                    label="Engagement indicatif (par semaine)"
                    required
                    hint="Même fourchette que pour le parcours soutien — ordre de grandeur honnête."
                  >
                    <select
                      value={form.engagement_hebdo}
                      onChange={(e) => setField("engagement_hebdo", e.target.value as FormState["engagement_hebdo"])}
                      className={SELECT_CLASS}
                    >
                      <option value="">Sélectionner…</option>
                      <option value="2h">Environ 2 h</option>
                      <option value="4h">Environ 4 h</option>
                      <option value="6h">Environ 6 h</option>
                      <option value="variable">Variable</option>
                    </select>
                  </FormField>
                  {form.engagement_hebdo === "variable" ? (
                    <FormField label="Précise ton rythme variable" required hint="Selon les semaines, le travail, les études…">
                      <input
                        value={form.engagement_hebdo_variable}
                        onChange={(e) => setField("engagement_hebdo_variable", e.target.value)}
                        placeholder="ex. plutôt dispo le week-end…"
                        className={FIELD_CLASS}
                      />
                    </FormField>
                  ) : null}
                  <div className="md:col-span-2">
                    <FormField
                      label="Pôles d’intérêt"
                      required
                      hint="Les mêmes tags que plus haut — indique où tu aimerais contribuer en priorité."
                    >
                      <div className="flex flex-wrap gap-2">
                        {INTEREST_OPTIONS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleInterest(option)}
                            className={form.poles_interet.includes(option) ? INTEREST_PILL_ON : INTEREST_PILL_OFF}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </FormField>
                  </div>
                  <FormField
                    label="Objectif d’apprentissage ou de consolidation staff"
                    required
                    hint="Ce que tu aimerais solidifier si tu es retenu·e — technique, posture, gestion des conflits…"
                    className="md:col-span-2"
                  >
                    <textarea
                      value={form.objectif_apprentissage}
                      onChange={(e) => setField("objectif_apprentissage", e.target.value)}
                      rows={3}
                      placeholder="ex. mieux verbaliser les décisions, mieux déléguer…"
                      className={FIELD_CLASS}
                    />
                  </FormField>
                  <FormField
                    label="Commentaire libre"
                    hint="Optionnel — dernier mot avant la page récap."
                    className="md:col-span-2"
                  >
                    <textarea
                      value={form.commentaire_libre}
                      onChange={(e) => setField("commentaire_libre", e.target.value)}
                      rows={3}
                      placeholder="Ce que tu veux ajouter sans case dédiée…"
                      className={FIELD_CLASS}
                    />
                  </FormField>
                </div>
              </div>
            ) : null}

            {steps[stepIndex] === "Recapitulatif" ? (
              <div className="space-y-8">
                <ReassuranceBanner title="Dernière ligne droite">
                  Relis vite fait si tu veux — tu peux encore utiliser « Précédent » ou les étapes au-dessus. Quand tu envoies, bravo : tu viens
                  de faire un geste exigeant et utile pour la communauté.
                </ReassuranceBanner>

                <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#12141f] to-[#0a0c12] p-5 sm:p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300/90">Récap express</p>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex flex-wrap gap-x-2 border-b border-white/5 pb-3">
                      <dt className="font-semibold text-zinc-400">Rôle visé</dt>
                      <dd className="text-white">{form.role_postule ? roleLabel(form.role_postule) : "—"}</dd>
                    </div>
                    <div className="flex flex-wrap gap-x-2 border-b border-white/5 pb-3">
                      <dt className="font-semibold text-zinc-400">Discord</dt>
                      <dd className="text-white">{form.pseudo_discord || "—"}</dd>
                    </div>
                    <div className="flex flex-wrap gap-x-2 border-b border-white/5 pb-3">
                      <dt className="font-semibold text-zinc-400">Disponibilités</dt>
                      <dd className="min-w-0 flex-1 text-zinc-200">{form.disponibilites || "—"}</dd>
                    </div>
                    <div className="flex flex-wrap gap-x-2 border-b border-white/5 pb-3">
                      <dt className="font-semibold text-zinc-400">Engagement (indicatif)</dt>
                      <dd className="text-white">{form.engagement_hebdo || "—"}</dd>
                    </div>
                    {form.role_postule === "moderateur" || form.role_postule === "les_deux" ? (
                      <div className="flex flex-wrap gap-x-2 pb-1">
                        <dt className="font-semibold text-zinc-400">Animation préférée</dt>
                        <dd className="text-white">
                          {form.preference_cadre === "cadre"
                            ? "Cadre et règles marquées"
                            : form.preference_cadre === "humain"
                              ? "Humain et écoute"
                              : "Équilibre cadre + humain"}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                  <p className="mt-5 text-xs leading-relaxed text-zinc-500">
                    Le détail de tes réponses reste visible pour le staff dans le dossier complet — ce bloc est seulement un rappel des grandes
                    lignes.
                  </p>
                </div>

                <div className="space-y-4 rounded-2xl border border-emerald-500/15 bg-emerald-950/10 p-5">
                  <p className="text-sm font-semibold text-emerald-100">Confirmations</p>
                  <p className="text-xs leading-relaxed text-zinc-500">
                    Trois coches pour valider que tu as bien compris le cadre — pas pour te piéger juridiquement, mais pour partir sur les mêmes
                    bases que l’équipe.
                  </p>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-relaxed text-zinc-200 transition hover:border-white/15">
                    <input
                      type="checkbox"
                      checked={form.accepte_confidentialite}
                      onChange={(e) => setField("accepte_confidentialite", e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 bg-black/40 text-violet-600 focus:ring-violet-500/40"
                    />
                    <span>J’accepte que les échanges liés à cette candidature restent confidentiels au sein du staff TENF.</span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-relaxed text-zinc-200 transition hover:border-white/15">
                    <input
                      type="checkbox"
                      checked={form.consentement_traitement}
                      onChange={(e) => setField("consentement_traitement", e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 bg-black/40 text-violet-600 focus:ring-violet-500/40"
                    />
                    <span>J’accepte que mes réponses soient conservées et traitées pour l’étude de ma candidature staff.</span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-relaxed text-zinc-200 transition hover:border-white/15">
                    <input
                      type="checkbox"
                      checked={form.comprend_entretien}
                      onChange={(e) => setField("comprend_entretien", e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 bg-black/40 text-violet-600 focus:ring-violet-500/40"
                    />
                    <span>Je comprends qu’un·e membre du staff peut me proposer un échange vocal ou écrit avant une décision.</span>
                  </label>
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-6">
              <button
                type="button"
                onClick={() => (stepIndex === 0 ? setMode("status") : goPrev())}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold transition hover:border-white/25 hover:bg-white/[0.07]"
              >
                <ArrowLeft size={16} aria-hidden /> {stepIndex === 0 ? "Retour au statut" : "Précédent"}
              </button>
              {stepIndex < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-950/40 transition hover:brightness-110"
                >
                  Suivant <ArrowRight size={16} aria-hidden />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={saving}
                  onClick={submitApplication}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/40 transition hover:brightness-110 disabled:opacity-60"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Send size={16} aria-hidden />}
                  {editingId ? "Mettre à jour ma candidature" : "Envoyer ma candidature"}
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
