"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getDiscordUser, loginWithDiscord, type DiscordUser } from "@/lib/discord";

type RolePostule = "moderateur" | "soutien" | "les_deux";

interface FormState {
  pseudo_discord: string;
  pseudo_twitch: string;
  age: string;
  pays_fuseau: string;
  disponibilites: string;
  micro_ok: "oui" | "non" | "";
  vocal_reunion: "oui" | "non" | "parfois" | "";
  role_postule: RolePostule | "";
  experience_modo: "oui" | "non" | "";
  experience_details: string;
  experience_similaire: string;
  pourquoi_tenf: string;
  pourquoi_role: string;
  motivation_560: string;
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
  style_communication: "direct" | "empathique" | "structure" | "mixte" | "autre" | "";
  style_communication_autre: string;
  contradiction: string;
  quand_jai_tort: string;
  limites_declencheurs: string;
  prise_de_recul: string;
  energie_mentale: "1" | "2" | "3" | "4" | "5" | "";
  periode_impact: "non" | "oui_legere" | "oui_importante" | "";
  periode_gestion: string;
  reaction_stress: string[];
  reaction_stress_autre: string;
  preference_cadre: "cadre" | "humain" | "mix" | "";
  preference_cadre_detail: string;
  passer_relais: "oui" | "non" | "";
  passer_relais_exemple: string;
  desaccord_staff: string;
  accepte_pause_retrait: "oui" | "non" | "";
  accepte_pause_retrait_pourquoi: string;
  accepte_confidentialite: boolean;
  ami_demande_infos: string;
  accepte_documenter: "oui" | "non" | "";
  engagement_hebdo: "2h" | "4h" | "6h" | "variable" | "";
  engagement_hebdo_variable: string;
  poles_interet: string[];
  objectif_apprentissage: string;
  consentement_traitement: boolean;
  comprend_entretien: boolean;
  commentaire_libre: string;
}

const STRESS_OPTIONS = ["renfermer", "enerver", "trop_parler", "controle", "pleurer", "autre"] as const;
const INTEREST_OPTIONS = [
  "modération chat",
  "modération vocal",
  "accueil nouveaux",
  "gestion conflits",
  "rédaction CR",
  "organisation événements",
  "soutien communauté",
  "autre",
] as const;

const SCENARIO_FIELDS: Array<{
  key:
    | "scenario_critique_staff"
    | "scenario_clash_vocal"
    | "scenario_dm_grave"
    | "scenario_spam_promo"
    | "scenario_modo_sec"
    | "scenario_manipulation"
    | "scenario_intrusif_vocal";
  label: string;
  help: string;
}> = [
  {
    key: "scenario_critique_staff",
    label: "Scénario: un membre du staff perd son calme en public *",
    help: "Explique les étapes: apaiser, sécuriser, puis remonter au staff.",
  },
  {
    key: "scenario_clash_vocal",
    label: "Scénario: gros clash en vocal entre 2 membres *",
    help: "Décris comment tu sépares le conflit et rétablis le cadre.",
  },
  {
    key: "scenario_dm_grave",
    label: "Scénario: DM grave reçu (harcèlement/menace) *",
    help: "Indique comment tu protèges la victime, gardes des preuves, et escalades.",
  },
  {
    key: "scenario_spam_promo",
    label: "Scénario: spam/promo agressive en boucle *",
    help: "Précise la sanction graduée et le message envoyé.",
  },
  {
    key: "scenario_modo_sec",
    label: "Scénario: tu es seul en modération pendant une période tendue *",
    help: "Explique comment tu priorises et quand tu demandes du renfort.",
  },
  {
    key: "scenario_manipulation",
    label: "Scénario: un membre tente de manipuler l'équipe *",
    help: "Décris les signaux observés et ta réponse factuelle.",
  },
  {
    key: "scenario_intrusif_vocal",
    label: "Scénario: comportement intrusif en vocal (insistance, malaise) *",
    help: "Explique comment tu poses la limite et protèges le groupe.",
  },
];

const POSTURE_FIELDS: Array<{
  key: "contradiction" | "quand_jai_tort" | "limites_declencheurs" | "prise_de_recul";
  label: string;
  help: string;
}> = [
  {
    key: "contradiction",
    label: "Quand un collègue te contredit devant les autres, que fais-tu ? *",
    help: "Décris une posture pro: écouter, clarifier, et recadrer calmement.",
  },
  {
    key: "quand_jai_tort",
    label: "Si tu réalises que tu as eu tort, comment réagis-tu ? *",
    help: "On attend une réponse responsable: reconnaître, corriger, documenter.",
  },
  {
    key: "limites_declencheurs",
    label: "Quelles situations te mettent le plus en difficulté en modération ? *",
    help: "Reste général (pas intime): ex. provocations répétées, agressivité, surcharge.",
  },
  {
    key: "prise_de_recul",
    label: "Que fais-tu pour garder du recul quand c'est tendu ? *",
    help: "Ex: pause courte, relais, reformulation factuelle, respiration.",
  },
];

const INITIAL_FORM: FormState = {
  pseudo_discord: "",
  pseudo_twitch: "",
  age: "",
  pays_fuseau: "",
  disponibilites: "",
  micro_ok: "",
  vocal_reunion: "",
  role_postule: "",
  experience_modo: "",
  experience_details: "",
  experience_similaire: "",
  pourquoi_tenf: "",
  pourquoi_role: "",
  motivation_560: "",
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
  style_communication: "",
  style_communication_autre: "",
  contradiction: "",
  quand_jai_tort: "",
  limites_declencheurs: "",
  prise_de_recul: "",
  energie_mentale: "",
  periode_impact: "",
  periode_gestion: "",
  reaction_stress: [],
  reaction_stress_autre: "",
  preference_cadre: "",
  preference_cadre_detail: "",
  passer_relais: "",
  passer_relais_exemple: "",
  desaccord_staff: "",
  accepte_pause_retrait: "",
  accepte_pause_retrait_pourquoi: "",
  accepte_confidentialite: false,
  ami_demande_infos: "",
  accepte_documenter: "",
  engagement_hebdo: "",
  engagement_hebdo_variable: "",
  poles_interet: [],
  objectif_apprentissage: "",
  consentement_traitement: false,
  comprend_entretien: false,
  commentaire_libre: "",
};

export default function PostulerPage() {
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [recap, setRecap] = useState<{ pseudo: string; role: string } | null>(null);

  useEffect(() => {
    async function loadUser() {
      const discordUser = await getDiscordUser();
      setUser(discordUser);
      if (discordUser) {
        setForm((prev) => ({ ...prev, pseudo_discord: discordUser.username }));
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleArray(field: "reaction_stress" | "poles_interet", value: string) {
    setForm((prev) => {
      const current = prev[field];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [field]: next };
    });
  }

  const roleLabel = useMemo(() => {
    if (form.role_postule === "moderateur") return "Modérateur";
    if (form.role_postule === "soutien") return "Soutien TENF";
    if (form.role_postule === "les_deux") return "Les deux";
    return "";
  }, [form.role_postule]);

  function validateForm(): Record<string, string> {
    const next: Record<string, string> = {};
    const req = (value: string, key: string, label: string, min = 2) => {
      if ((value || "").trim().length < min) next[key] = `${label} est requis.`;
    };

    req(form.pseudo_discord, "pseudo_discord", "Pseudo Discord");
    req(form.pays_fuseau, "pays_fuseau", "Pays/fuseau");
    req(form.disponibilites, "disponibilites", "Disponibilités", 8);
    if (!form.micro_ok) next.micro_ok = "Indique si le micro est OK.";
    if (!form.vocal_reunion) next.vocal_reunion = "Indique ta présence en vocal.";
    if (!form.role_postule) next.role_postule = "Choisis un rôle.";
    if (!form.experience_modo) next.experience_modo = "Réponds à la question expérience modération.";
    req(form.pourquoi_tenf, "pourquoi_tenf", "Pourquoi TENF", 20);
    req(form.pourquoi_role, "pourquoi_role", "Pourquoi ce rôle", 20);
    req(form.motivation_560, "motivation_560", "Motivation détaillée", 80);
    if (!form.niveau_discord) next.niveau_discord = "Niveau Discord requis.";
    if (!form.principes_proportionnalite) next.principes_proportionnalite = "Question proportionnalité requise.";
    req(
      form.principes_proportionnalite_explication,
      "principes_proportionnalite_explication",
      "Explication proportionnalité",
      20
    );
    if (!form.difference_sanctions) next.difference_sanctions = "Question sanctions requise.";
    req(form.difference_sanctions_exemple, "difference_sanctions_exemple", "Exemple sanctions", 20);
    if (!form.redaction_cr) next.redaction_cr = "Question rédaction CR requise.";
    req(form.scenario_critique_staff, "scenario_critique_staff", "Scénario critique staff", 20);
    req(form.scenario_clash_vocal, "scenario_clash_vocal", "Scénario clash vocal", 20);
    req(form.scenario_dm_grave, "scenario_dm_grave", "Scénario DM grave", 20);
    req(form.scenario_spam_promo, "scenario_spam_promo", "Scénario spam promo", 20);
    req(form.scenario_modo_sec, "scenario_modo_sec", "Scénario modération absente", 20);
    req(form.scenario_manipulation, "scenario_manipulation", "Scénario manipulation", 20);
    req(form.scenario_intrusif_vocal, "scenario_intrusif_vocal", "Scénario intrusif vocal", 20);
    if (!form.style_communication) next.style_communication = "Style de communication requis.";
    req(form.contradiction, "contradiction", "Contradiction", 20);
    req(form.quand_jai_tort, "quand_jai_tort", "Quand j'ai tort", 20);
    req(form.limites_declencheurs, "limites_declencheurs", "Limites/déclencheurs", 10);
    req(form.prise_de_recul, "prise_de_recul", "Prise de recul", 10);
    if (!form.energie_mentale) next.energie_mentale = "Énergie mentale requise.";
    if (!form.periode_impact) next.periode_impact = "Période impactante: réponse requise.";
    if (!form.preference_cadre) next.preference_cadre = "Préférence de cadre requise.";
    if (!form.passer_relais) next.passer_relais = "Question passer relais requise.";
    req(form.passer_relais_exemple, "passer_relais_exemple", "Exemple passer relais", 15);
    req(form.desaccord_staff, "desaccord_staff", "Désaccord staff", 15);
    if (!form.accepte_pause_retrait) next.accepte_pause_retrait = "Question pause/retrait requise.";
    req(form.accepte_pause_retrait_pourquoi, "accepte_pause_retrait_pourquoi", "Pourquoi pause/retrait", 10);
    req(form.ami_demande_infos, "ami_demande_infos", "Confidentialité: réaction ami", 20);
    if (!form.accepte_documenter) next.accepte_documenter = "Question documentation requise.";
    if (!form.engagement_hebdo) next.engagement_hebdo = "Engagement hebdo requis.";
    if (form.poles_interet.length === 0) next.poles_interet = "Sélectionne au moins un pôle d'intérêt.";
    req(form.objectif_apprentissage, "objectif_apprentissage", "Objectif d'apprentissage", 15);
    if (!form.accepte_confidentialite) next.accepte_confidentialite = "Consentement confidentialité requis.";
    if (!form.consentement_traitement) next.consentement_traitement = "Consentement traitement requis.";
    if (!form.comprend_entretien) next.comprend_entretien = "Confirmation entretien requise.";

    const age = Number(form.age);
    if (!Number.isFinite(age) || age < 13) next.age = "Âge minimum 13 ans.";
    if (form.experience_modo === "oui" && !form.experience_details.trim()) {
      next.experience_details = "Détails d'expérience requis.";
    }
    if (form.experience_modo === "non" && !form.experience_similaire.trim()) {
      next.experience_similaire = "Expérience similaire requise.";
    }
    if (form.periode_impact !== "non" && !form.periode_gestion.trim()) {
      next.periode_gestion = "Explique la gestion de cette période.";
    }
    if (form.reaction_stress.length === 0) {
      next.reaction_stress = "Sélectionne au moins une réaction au stress.";
    }
    if (form.reaction_stress.includes("autre") && !form.reaction_stress_autre.trim()) {
      next.reaction_stress_autre = "Précise la réaction 'autre'.";
    }
    if (form.style_communication === "autre" && !form.style_communication_autre.trim()) {
      next.style_communication_autre = "Précise ton style.";
    }
    if (form.engagement_hebdo === "variable" && !form.engagement_hebdo_variable.trim()) {
      next.engagement_hebdo_variable = "Précise l'engagement variable.";
    }
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const nextErrors = validateForm();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setMessage({ type: "error", text: "Le formulaire contient des erreurs. Corrige les champs indiqués." });
      return;
    }
    setSaving(true);

    try {
      const payload = {
        ...form,
        age: Number(form.age),
        micro_ok: form.micro_ok === "oui",
        experience_modo: form.experience_modo === "oui",
        niveau_discord: Number(form.niveau_discord),
        principes_proportionnalite: form.principes_proportionnalite === "oui",
        difference_sanctions: form.difference_sanctions === "oui",
        redaction_cr: form.redaction_cr === "oui",
        energie_mentale: Number(form.energie_mentale),
        passer_relais: form.passer_relais === "oui",
        accepte_pause_retrait: form.accepte_pause_retrait === "oui",
        accepte_documenter: form.accepte_documenter === "oui",
      };

      const response = await fetch("/api/staff-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi de la candidature.");
      }

      setRecap({ pseudo: form.pseudo_discord, role: roleLabel });
      setMessage({ type: "success", text: "Candidature envoyée avec succès. Redirection..." });
      window.setTimeout(() => {
        window.location.href = `/postuler/merci?id=${encodeURIComponent(data.application?.id || "")}`;
      }, 1200);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center">
        <p className="text-gray-300">Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white p-8">
        <div className="max-w-2xl mx-auto bg-[#1a1a1d] border border-gray-700 rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-4">Postuler chez TENF</h1>
          <p className="text-gray-300 mb-6">
            Connecte-toi avec Discord pour postuler en tant que modérateur ou soutien TENF.
          </p>
          <button
            onClick={loginWithDiscord}
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold px-5 py-3 rounded-lg"
          >
            Se connecter avec Discord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors inline-block mb-4">
          ← Retour
        </Link>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Formulaire de candidature staff</h1>
          <p className="text-gray-400 mb-6">
            Candidature connectée pour <strong>{user.username}</strong> · tous les champs marqués * sont requis.
          </p>

          <div className="mb-6 p-4 rounded border border-gray-700 bg-[#0e0e10] text-sm text-gray-300">
            <p className="font-semibold text-white mb-2">Consentement & confidentialité</p>
            <p>
              Les réponses sont réservées au staff TENF. N'ajoute pas de détails médicaux ou intimes.
              Les questions émotionnelles servent uniquement à évaluer la posture, la stabilité et la capacité à passer le relais.
            </p>
          </div>

          {message && (
            <div
              className={`mb-4 p-3 rounded border ${
                message.type === "success"
                  ? "bg-green-900/30 border-green-600 text-green-300"
                  : "bg-red-900/30 border-red-600 text-red-300"
              }`}
            >
              {message.text}
            </div>
          )}

          {recap && (
            <div className="mb-4 p-3 rounded border bg-blue-900/20 border-blue-700 text-blue-200">
              Récapitulatif: <strong>{recap.pseudo}</strong> · rôle visé: <strong>{recap.role}</strong>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">A) Infos de base</h2>
              <input
                value={form.pseudo_discord}
                onChange={(e) => setField("pseudo_discord", e.target.value)}
                placeholder="Pseudo Discord *"
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
              />
              <input
                value={form.pseudo_twitch}
                onChange={(e) => setField("pseudo_twitch", e.target.value)}
                placeholder="Pseudo Twitch (optionnel)"
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="number"
                  min={13}
                  value={form.age}
                  onChange={(e) => setField("age", e.target.value)}
                  placeholder="Âge *"
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
                />
                <input
                  value={form.pays_fuseau}
                  onChange={(e) => setField("pays_fuseau", e.target.value)}
                  placeholder="Pays + fuseau *"
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
                />
              </div>
              <textarea
                rows={3}
                value={form.disponibilites}
                onChange={(e) => setField("disponibilites", e.target.value)}
                placeholder="Disponibilités *"
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={form.micro_ok}
                  onChange={(e) => setField("micro_ok", e.target.value as FormState["micro_ok"])}
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
                >
                  <option value="">Micro OK ? *</option>
                  <option value="oui">Oui</option>
                  <option value="non">Non</option>
                </select>
                <select
                  value={form.vocal_reunion}
                  onChange={(e) => setField("vocal_reunion", e.target.value as FormState["vocal_reunion"])}
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
                >
                  <option value="">Vocal réunion *</option>
                  <option value="oui">Oui</option>
                  <option value="non">Non</option>
                  <option value="parfois">Parfois</option>
                </select>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">B) Rôle demandé</h2>
              <select
                value={form.role_postule}
                onChange={(e) => setField("role_postule", e.target.value as FormState["role_postule"])}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
              >
                <option value="">Rôle postulé *</option>
                <option value="moderateur">Modérateur</option>
                <option value="soutien">Soutien TENF</option>
                <option value="les_deux">Les deux</option>
              </select>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">C) Expérience</h2>
              <select
                value={form.experience_modo}
                onChange={(e) => setField("experience_modo", e.target.value as FormState["experience_modo"])}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
              >
                <option value="">As-tu déjà modéré ? *</option>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
              </select>
              {form.experience_modo === "oui" ? (
                <textarea
                  rows={3}
                  value={form.experience_details}
                  onChange={(e) => setField("experience_details", e.target.value)}
                  placeholder="Détails de ton expérience modération *"
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
                />
              ) : (
                <textarea
                  rows={3}
                  value={form.experience_similaire}
                  onChange={(e) => setField("experience_similaire", e.target.value)}
                  placeholder="Expérience similaire (gestion communauté, support...) *"
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
                />
              )}
              <textarea
                rows={3}
                value={form.pourquoi_tenf}
                onChange={(e) => setField("pourquoi_tenf", e.target.value)}
                placeholder="Pourquoi TENF ? *"
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
              />
              <textarea
                rows={3}
                value={form.pourquoi_role}
                onChange={(e) => setField("pourquoi_role", e.target.value)}
                placeholder="Pourquoi ce rôle ? *"
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
              />
              <textarea
                rows={4}
                value={form.motivation_560}
                onChange={(e) => setField("motivation_560", e.target.value)}
                placeholder="Motivation (détaillée) *"
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
              />
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">D à J) Compétences, scénarios, posture, stabilité, confidentialité, engagement</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={form.niveau_discord}
                  onChange={(e) => setField("niveau_discord", e.target.value as FormState["niveau_discord"])}
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
                >
                  <option value="">Niveau Discord (1-5) *</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
                <select
                  value={form.energie_mentale}
                  onChange={(e) => setField("energie_mentale", e.target.value as FormState["energie_mentale"])}
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
                >
                  <option value="">Énergie mentale (1-5) *</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={form.principes_proportionnalite}
                  onChange={(e) =>
                    setField("principes_proportionnalite", e.target.value as FormState["principes_proportionnalite"])
                  }
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
                >
                  <option value="">Sais-tu appliquer une sanction proportionnée ? *</option>
                  <option value="oui">Oui</option>
                  <option value="non">Non</option>
                </select>
                <select
                  value={form.difference_sanctions}
                  onChange={(e) =>
                    setField("difference_sanctions", e.target.value as FormState["difference_sanctions"])
                  }
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
                >
                  <option value="">Sais-tu distinguer avertissement / mute / exclusion ? *</option>
                  <option value="oui">Oui</option>
                  <option value="non">Non</option>
                </select>
              </div>

              <textarea
                rows={3}
                value={form.principes_proportionnalite_explication}
                onChange={(e) => setField("principes_proportionnalite_explication", e.target.value)}
                placeholder="Explique comment tu choisis une sanction selon la gravité, le contexte et l'historique *"
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
              />
              <textarea
                rows={3}
                value={form.difference_sanctions_exemple}
                onChange={(e) => setField("difference_sanctions_exemple", e.target.value)}
                placeholder="Donne un exemple concret pour chaque niveau de sanction *"
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
              />

              <select
                value={form.redaction_cr}
                onChange={(e) => setField("redaction_cr", e.target.value as FormState["redaction_cr"])}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
              >
                <option value="">Rédaction CR *</option>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
              </select>

              {SCENARIO_FIELDS.map((scenario) => (
                <div key={scenario.key}>
                  <label className="block text-sm text-gray-300 mb-1">{scenario.label}</label>
                  <p className="text-xs text-gray-500 mb-2">{scenario.help}</p>
                  <textarea
                    rows={3}
                    value={form[scenario.key]}
                    onChange={(e) => setField(scenario.key, e.target.value)}
                    placeholder="Réponse attendue: actions concrètes + justification (3 à 6 lignes)"
                    className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
                  />
                </div>
              ))}

              <select
                value={form.style_communication}
                onChange={(e) => setField("style_communication", e.target.value as FormState["style_communication"])}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
              >
                <option value="">Ton style de communication principal *</option>
                <option value="direct">Direct</option>
                <option value="empathique">Empathique</option>
                <option value="structure">Structuré</option>
                <option value="mixte">Mixte</option>
                <option value="autre">Autre</option>
              </select>
              {form.style_communication === "autre" && (
                <input
                  value={form.style_communication_autre}
                  onChange={(e) => setField("style_communication_autre", e.target.value)}
                  placeholder="Précise ton style"
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
                />
              )}

              {POSTURE_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm text-gray-300 mb-1">{field.label}</label>
                  <p className="text-xs text-gray-500 mb-2">{field.help}</p>
                  <textarea
                    rows={3}
                    value={form[field.key]}
                    onChange={(e) => setField(field.key, e.target.value)}
                    placeholder="Réponse courte et concrète"
                    className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
                  />
                </div>
              ))}

              <select
                value={form.periode_impact}
                onChange={(e) => setField("periode_impact", e.target.value as FormState["periode_impact"])}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
              >
                <option value="">Période impactante ? *</option>
                <option value="non">Non</option>
                <option value="oui_legere">Oui, légère</option>
                <option value="oui_importante">Oui, importante</option>
              </select>
              {form.periode_impact !== "non" && (
                <textarea
                  rows={3}
                  value={form.periode_gestion}
                  onChange={(e) => setField("periode_gestion", e.target.value)}
                  placeholder="Comment tu t'organises pour rester fiable dans ce contexte ? (sans détail intime) *"
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
                />
              )}

              <div>
                <p className="text-sm text-gray-300 mb-2">Réaction au stress *</p>
                <div className="flex flex-wrap gap-2">
                  {STRESS_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleArray("reaction_stress", option)}
                      className={`px-3 py-1 rounded border text-sm ${
                        form.reaction_stress.includes(option)
                          ? "bg-[#9146ff] border-[#9146ff] text-white"
                          : "bg-[#0e0e10] border-gray-700 text-gray-300"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {form.reaction_stress.includes("autre") && (
                  <input
                    value={form.reaction_stress_autre}
                    onChange={(e) => setField("reaction_stress_autre", e.target.value)}
                    placeholder="Précise la réaction 'autre'"
                    className="mt-2 w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
                  />
                )}
              </div>

              <select
                value={form.preference_cadre}
                onChange={(e) => setField("preference_cadre", e.target.value as FormState["preference_cadre"])}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
              >
                <option value="">Préférence cadre *</option>
                <option value="cadre">Cadre</option>
                <option value="humain">Humain</option>
                <option value="mix">Mix</option>
              </select>
              <input
                value={form.preference_cadre_detail}
                onChange={(e) => setField("preference_cadre_detail", e.target.value)}
                placeholder="Détail préférence cadre (optionnel)"
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
              />

              <select
                value={form.passer_relais}
                onChange={(e) => setField("passer_relais", e.target.value as FormState["passer_relais"])}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
              >
                <option value="">Passer le relais ? *</option>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
              </select>
              <textarea
                rows={2}
                value={form.passer_relais_exemple}
                onChange={(e) => setField("passer_relais_exemple", e.target.value)}
                placeholder="Décris un cas où tu passes le relais (à qui, quand, pourquoi) *"
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
              />
              <textarea
                rows={2}
                value={form.desaccord_staff}
                onChange={(e) => setField("desaccord_staff", e.target.value)}
                placeholder="Comment gères-tu un désaccord avec un autre staff sans créer de tension publique ? *"
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
              />
              <select
                value={form.accepte_pause_retrait}
                onChange={(e) =>
                  setField("accepte_pause_retrait", e.target.value as FormState["accepte_pause_retrait"])
                }
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
              >
                <option value="">Accepte pause/retrait *</option>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
              </select>
              <textarea
                rows={2}
                value={form.accepte_pause_retrait_pourquoi}
                onChange={(e) => setField("accepte_pause_retrait_pourquoi", e.target.value)}
                placeholder="Explique en quelques mots ta position *"
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
              />
              <textarea
                rows={3}
                value={form.ami_demande_infos}
                onChange={(e) => setField("ami_demande_infos", e.target.value)}
                placeholder="Un ami te demande des infos internes staff: que réponds-tu exactement ? *"
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
              />
              <select
                value={form.accepte_documenter}
                onChange={(e) => setField("accepte_documenter", e.target.value as FormState["accepte_documenter"])}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
              >
                <option value="">Accepte de documenter les cas sensibles ? *</option>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
              </select>
              <select
                value={form.engagement_hebdo}
                onChange={(e) => setField("engagement_hebdo", e.target.value as FormState["engagement_hebdo"])}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
              >
                <option value="">Engagement hebdo *</option>
                <option value="2h">2h</option>
                <option value="4h">4h</option>
                <option value="6h">6h</option>
                <option value="variable">Variable</option>
              </select>
              {form.engagement_hebdo === "variable" && (
                <input
                  value={form.engagement_hebdo_variable}
                  onChange={(e) => setField("engagement_hebdo_variable", e.target.value)}
                  placeholder="Précise ton rythme (ex: 2 à 6h selon semaines) *"
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
                />
              )}
              <div>
                <p className="text-sm text-gray-300 mb-2">Pôles d'intérêt *</p>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleArray("poles_interet", option)}
                      className={`px-3 py-1 rounded border text-sm ${
                        form.poles_interet.includes(option)
                          ? "bg-[#9146ff] border-[#9146ff] text-white"
                          : "bg-[#0e0e10] border-gray-700 text-gray-300"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                rows={2}
                value={form.objectif_apprentissage}
                onChange={(e) => setField("objectif_apprentissage", e.target.value)}
                placeholder="Quel point veux-tu progresser en priorité chez TENF ? *"
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
              />
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold">J) Consentements</h2>
              <label className="flex items-start gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={form.accepte_confidentialite}
                  onChange={(e) => setField("accepte_confidentialite", e.target.checked)}
                  className="mt-1"
                />
                J'accepte la confidentialité des échanges staff.
              </label>
              <label className="flex items-start gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={form.consentement_traitement}
                  onChange={(e) => setField("consentement_traitement", e.target.checked)}
                  className="mt-1"
                />
                J'accepte le traitement de cette candidature.
              </label>
              <label className="flex items-start gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={form.comprend_entretien}
                  onChange={(e) => setField("comprend_entretien", e.target.checked)}
                  className="mt-1"
                />
                Je comprends qu'un entretien peut être proposé.
              </label>
              <textarea
                rows={2}
                value={form.commentaire_libre}
                onChange={(e) => setField("commentaire_libre", e.target.value)}
                placeholder="Commentaire libre (optionnel)"
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white"
              />
            </section>

            {Object.keys(errors).length > 0 && (
              <p className="text-sm text-red-400">{Object.values(errors)[0]}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="bg-[#9146ff] hover:bg-[#5a32b4] disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-lg"
            >
              {saving ? "Envoi..." : "Envoyer ma candidature"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
