"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, HeartHandshake, Loader2, Send, Sparkles } from "lucide-react";
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

const EDITABLE_STATUSES: AdminStatus[] = ["nouveau", "a_contacter", "entretien_prevu"];

function statusLabel(status: AdminStatus): string {
  const map: Record<AdminStatus, string> = {
    nouveau: "Envoyee - en attente de revue",
    a_contacter: "En cours d examen",
    entretien_prevu: "Entretien planifie",
    accepte: "Acceptee",
    refuse: "Refusee",
    archive: "Annulee / archivee",
  };
  return map[status];
}

function roleLabel(role: RolePostule): string {
  if (role === "moderateur") return "Moderateur";
  if (role === "soutien") return "Soutien TENF";
  return "Moderateur + Soutien";
}

function finalDecisionLabel(value: "soutien_tenf" | "moderateur_formation" | "candidature_refusee"): string {
  if (value === "soutien_tenf") return "Soutien TENF";
  if (value === "moderateur_formation") return "Moderateur en formation";
  return "Candidature refusee";
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

  useEffect(() => {
    (async () => {
      const discordUser = await getDiscordUser();
      setUser(discordUser);
      if (discordUser) {
        setForm((prev) => ({ ...prev, pseudo_discord: discordUser.username }));
        await loadMyApplications();
        if (searchParams.get("submitted") === "1") {
          setSuccess("Candidature envoyee avec succes. Merci pour ton implication, le staff TENF revient vers toi.");
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
    if (step === "Choix du role" && !form.role_postule) return "Choisis un role pour continuer.";
    if (step === "Informations communes") {
      if (!form.pseudo_discord.trim()) return "Pseudo Discord requis.";
      if (!form.age || Number(form.age) < 13) return "Age minimum 13 ans.";
      if (!form.pays_fuseau.trim()) return "Pays/fuseau requis.";
      if (!form.disponibilites.trim()) return "Disponibilites requises.";
      if (!form.pourquoi_tenf.trim()) return "Explique pourquoi TENF.";
      if (!form.pourquoi_role.trim()) return "Explique pourquoi ce role.";
      if (!form.motivation_560.trim()) return "Motivation requise.";
    }
    if (step === "Questionnaire soutien") {
      if (!form.style_communication) return "Choisis un style de communication.";
      if (!form.engagement_hebdo) return "Choisis ton engagement hebdo.";
      if (form.engagement_hebdo === "variable" && !form.engagement_hebdo_variable.trim()) return "Precise ton engagement variable.";
      if (form.poles_interet.length === 0) return "Choisis au moins un pole d interet.";
      if (!form.objectif_apprentissage.trim()) return "Objectif d apprentissage requis.";
    }
    if (step === "Questionnaire moderateur 1" && isModerator) {
      if (!form.micro_ok || !form.vocal_reunion) return "Micro et disponibilite vocal requis.";
      if (!form.experience_modo) return "Indique ton experience moderation.";
      if (form.experience_modo === "oui" && !form.experience_details.trim()) return "Details d experience requis.";
      if (form.experience_modo === "non" && !form.experience_similaire.trim()) return "Experience similaire requise.";
      if (!form.niveau_discord || !form.energie_mentale) return "Niveau Discord et energie mentale requis.";
      if (!form.principes_proportionnalite || !form.principes_proportionnalite_explication.trim()) return "Question proportionalite incomplete.";
      if (!form.difference_sanctions || !form.difference_sanctions_exemple.trim()) return "Question sanctions incomplete.";
      if (!form.redaction_cr) return "Indique si tu peux rediger un CR.";
      if (!form.style_communication) return "Choisis un style de communication.";
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
      if (required.some((v) => !v.trim())) return "Complete toutes les reponses scenarios/posture.";
      if (!form.periode_impact) return "Indique la periode impactante.";
      if (form.periode_impact !== "non" && !form.periode_gestion.trim()) return "Precise la gestion de periode impactante.";
      if (!form.passer_relais || !form.accepte_pause_retrait || !form.accepte_documenter) return "Complete les questions de responsabilite.";
      if (!form.engagement_hebdo) return "Engagement hebdo requis.";
      if (form.engagement_hebdo === "variable" && !form.engagement_hebdo_variable.trim()) return "Precise ton engagement variable.";
      if (form.poles_interet.length === 0) return "Choisis au moins un pole d interet.";
    }
    if (step === "Recapitulatif") {
      if (!form.consentement_traitement || !form.comprend_entretien || !form.accepte_confidentialite) {
        return "Tous les consentements doivent etre acceptes.";
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
          ? "Candidature mise a jour. Merci pour ta reactivite."
          : "Candidature envoyee. Merci pour ta confiance, le staff TENF traite ta demande."
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
    if (!window.confirm("Confirmer l annulation de cette candidature ?")) return;
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
    setSuccess("Candidature annulee.");
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
      <div className="min-h-screen bg-[#090b12] text-white p-6 md:p-10">
        <div className="mx-auto max-w-3xl rounded-3xl border p-8" style={{ borderColor: "rgba(139,92,246,0.35)", backgroundColor: "#161822" }}>
          <h1 className="text-3xl font-bold">Postuler chez TENF</h1>
          <p className="mt-3 text-sm text-gray-300">
            Connecte-toi avec Discord pour candidater en moderateur ou en soutien TENF.
          </p>
          <button
            onClick={() => loginWithDiscord()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#5865F2] px-5 py-2.5 font-semibold hover:opacity-90"
          >
            Se connecter avec Discord
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  const openApplications = applications.filter((a) => EDITABLE_STATUSES.includes(a.admin_status));

  return (
    <div className="min-h-screen bg-[#090b12] text-white p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-5">
        <Link href="/member/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white">
          <ArrowLeft size={14} /> Retour dashboard
        </Link>

        <section
          className="rounded-3xl border p-6 md:p-8"
          style={{
            borderColor: "rgba(139,92,246,0.32)",
            background: "radial-gradient(circle at 12% 10%, rgba(124,58,237,0.22), rgba(24,26,36,0.96) 45%)",
          }}
        >
          <p className="text-xs uppercase tracking-[0.16em] text-violet-300">Espace candidature TENF</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">Postuler en plusieurs etapes</h1>
          <p className="mt-3 max-w-3xl text-sm text-gray-300">
            Choisis ton role, complete le questionnaire adapte, puis envoie ta candidature. Tu peux modifier ou annuler tant que la demande est en cours d examen staff.
          </p>
        </section>

        {success ? (
          <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <div className="inline-flex items-center gap-2">
              <CheckCircle2 size={16} />
              {success}
            </div>
          </div>
        ) : null}
        {error ? (
          <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
        ) : null}

        {mode === "status" ? (
          <section className="rounded-2xl border border-white/10 bg-[#171923] p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Mes candidatures</h2>
              <button
                type="button"
                onClick={startNew}
                className="inline-flex items-center gap-2 rounded-full border border-violet-400/40 bg-violet-500/15 px-4 py-2 text-sm font-semibold text-violet-200 hover:opacity-90"
              >
                <ClipboardList size={15} />
                Nouvelle candidature
              </button>
            </div>

            {applications.length === 0 ? (
              <p className="text-sm text-gray-300">Aucune candidature envoyee pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {applications.map((item) => {
                  const editable = EDITABLE_STATUSES.includes(item.admin_status);
                  const role = roleLabel((item.answers?.role_postule || "moderateur") as RolePostule);
                  const finalDecision = item.member_final_decision || null;
                  return (
                    <article key={item.id} className="rounded-xl border border-white/10 bg-[#11131c] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{role}</p>
                          <p className="mt-1 text-xs text-gray-400">
                            Envoyee le {new Date(item.created_at).toLocaleString("fr-FR")}
                          </p>
                          <p className="mt-2 text-sm text-violet-200">{statusLabel(item.admin_status)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {editable ? (
                            <>
                              <button
                                type="button"
                                onClick={() => editApplication(item)}
                                className="rounded-full border border-cyan-400/40 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:opacity-90"
                              >
                                Modifier
                              </button>
                              <button
                                type="button"
                                onClick={() => cancelApplication(item.id)}
                                className="rounded-full border border-red-400/45 px-3 py-1.5 text-xs font-semibold text-red-200 hover:opacity-90"
                              >
                                Annuler
                              </button>
                            </>
                          ) : (
                            <span className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-gray-300">
                              Candidature verouillee
                            </span>
                          )}
                        </div>
                      </div>
                      {finalDecision ? (
                        <div className="mt-3 rounded-lg border border-amber-500/35 bg-amber-500/10 p-3">
                          <p className="text-xs uppercase tracking-[0.08em] text-amber-200">Decision finale staff</p>
                          <p className="mt-1 text-sm font-semibold text-amber-100">
                            {finalDecisionLabel(finalDecision.outcome)}
                          </p>
                          <p className="mt-1 text-sm text-amber-50 whitespace-pre-wrap">
                            {finalDecision.memberMessage}
                          </p>
                          <p className="mt-1 text-xs text-amber-200/80">
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
              <div className="mt-4 rounded-xl border border-violet-400/25 bg-violet-500/10 p-4 text-sm text-violet-100">
                <p className="font-semibold">Merci pour ton implication.</p>
                <p className="mt-1 text-violet-200">
                  Le staff TENF etudie actuellement ta candidature. Tu peux la modifier ou l annuler tant qu elle reste en cours d examen.
                </p>
              </div>
            ) : null}
          </section>
        ) : (
          <section className="rounded-2xl border border-white/10 bg-[#171923] p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">{editingId ? "Modifier ma candidature" : "Nouvelle candidature"}</h2>
              <p className="text-sm text-gray-300">
                Etape {stepIndex + 1}/{steps.length} - {steps[stepIndex]}
              </p>
            </div>

            <div className="mb-6 h-2 w-full rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all"
                style={{ width: `${Math.round(((stepIndex + 1) / steps.length) * 100)}%` }}
              />
            </div>

            {steps[stepIndex] === "Choix du role" ? (
              <div className="grid gap-3 md:grid-cols-2">
                {(["moderateur", "soutien"] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setField("role_postule", role)}
                    className={`rounded-2xl border p-4 text-left transition-all ${form.role_postule === role ? "border-violet-400 bg-violet-500/10" : "border-white/15 bg-[#11131c] hover:border-violet-300/45"}`}
                  >
                    <p className="inline-flex items-center gap-2 text-lg font-semibold">
                      {role === "moderateur" ? <ClipboardList size={18} /> : <HeartHandshake size={18} />}
                      {role === "moderateur" ? "Moderateur" : "Soutien TENF"}
                    </p>
                    <p className="mt-2 text-sm text-gray-300">
                      {role === "moderateur"
                        ? "Parcours complet: moderation, scenarios et posture staff."
                        : "Parcours allege: motivation, disponibilite et engagement communautaire."}
                    </p>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setField("role_postule", "les_deux")}
                  className={`rounded-2xl border p-4 text-left transition-all md:col-span-2 ${form.role_postule === "les_deux" ? "border-violet-400 bg-violet-500/10" : "border-white/15 bg-[#11131c] hover:border-violet-300/45"}`}
                >
                  <p className="inline-flex items-center gap-2 text-lg font-semibold">
                    <Sparkles size={18} />
                    Moderateur + Soutien
                  </p>
                  <p className="mt-2 text-sm text-gray-300">Parcours complet moderateur avec ouverture soutien.</p>
                </button>
              </div>
            ) : null}

            {steps[stepIndex] === "Informations communes" ? (
              <div className="grid gap-3 md:grid-cols-2">
                <input value={form.pseudo_discord} onChange={(e) => setField("pseudo_discord", e.target.value)} placeholder="Pseudo Discord *" className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5" />
                <input value={form.pseudo_twitch} onChange={(e) => setField("pseudo_twitch", e.target.value)} placeholder="Pseudo Twitch (optionnel)" className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5" />
                <input type="number" min={13} value={form.age} onChange={(e) => setField("age", e.target.value)} placeholder="Age *" className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5" />
                <input value={form.pays_fuseau} onChange={(e) => setField("pays_fuseau", e.target.value)} placeholder="Pays / fuseau *" className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5" />
                <textarea value={form.disponibilites} onChange={(e) => setField("disponibilites", e.target.value)} rows={3} placeholder="Disponibilites *" className="md:col-span-2 rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5" />
                <textarea value={form.pourquoi_tenf} onChange={(e) => setField("pourquoi_tenf", e.target.value)} rows={3} placeholder="Pourquoi TENF ? *" className="md:col-span-2 rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5" />
                <textarea value={form.pourquoi_role} onChange={(e) => setField("pourquoi_role", e.target.value)} rows={3} placeholder="Pourquoi ce role ? *" className="md:col-span-2 rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5" />
                <textarea value={form.motivation_560} onChange={(e) => setField("motivation_560", e.target.value)} rows={4} placeholder="Motivation detaillee *" className="md:col-span-2 rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5" />
              </div>
            ) : null}

            {steps[stepIndex] === "Questionnaire soutien" ? (
              <div className="grid gap-3 md:grid-cols-2">
                <select value={form.style_communication} onChange={(e) => setField("style_communication", e.target.value as FormState["style_communication"])} className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5">
                  <option value="">Style de communication *</option>
                  <option value="direct">Direct</option>
                  <option value="empathique">Empathique</option>
                  <option value="structure">Structure</option>
                  <option value="mixte">Mixte</option>
                  <option value="autre">Autre</option>
                </select>
                <select value={form.engagement_hebdo} onChange={(e) => setField("engagement_hebdo", e.target.value as FormState["engagement_hebdo"])} className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5">
                  <option value="">Engagement hebdo *</option>
                  <option value="2h">2h</option>
                  <option value="4h">4h</option>
                  <option value="6h">6h</option>
                  <option value="variable">Variable</option>
                </select>
                {form.engagement_hebdo === "variable" ? (
                  <input value={form.engagement_hebdo_variable} onChange={(e) => setField("engagement_hebdo_variable", e.target.value)} placeholder="Precise ton engagement variable *" className="md:col-span-2 rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5" />
                ) : null}
                <div className="md:col-span-2">
                  <p className="mb-2 text-sm text-gray-300">Pôles d interet *</p>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggleInterest(option)}
                        className={`rounded-full border px-3 py-1.5 text-sm ${form.poles_interet.includes(option) ? "border-violet-400 bg-violet-500/15 text-violet-100" : "border-white/20 text-gray-300"}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea value={form.objectif_apprentissage} onChange={(e) => setField("objectif_apprentissage", e.target.value)} rows={3} placeholder="Objectif d apprentissage *" className="md:col-span-2 rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5" />
                <textarea value={form.commentaire_libre} onChange={(e) => setField("commentaire_libre", e.target.value)} rows={3} placeholder="Commentaire libre (optionnel)" className="md:col-span-2 rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5" />
              </div>
            ) : null}

            {steps[stepIndex] === "Questionnaire moderateur 1" ? (
              <div className="grid gap-3 md:grid-cols-2">
                <select value={form.micro_ok} onChange={(e) => setField("micro_ok", e.target.value as FormState["micro_ok"])} className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5">
                  <option value="">Micro OK ? *</option>
                  <option value="oui">Oui</option>
                  <option value="non">Non</option>
                </select>
                <select value={form.vocal_reunion} onChange={(e) => setField("vocal_reunion", e.target.value as FormState["vocal_reunion"])} className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5">
                  <option value="">Presence vocal reunion *</option>
                  <option value="oui">Oui</option>
                  <option value="non">Non</option>
                  <option value="parfois">Parfois</option>
                </select>
                <select value={form.experience_modo} onChange={(e) => setField("experience_modo", e.target.value as FormState["experience_modo"])} className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5">
                  <option value="">Experience moderation ? *</option>
                  <option value="oui">Oui</option>
                  <option value="non">Non</option>
                </select>
                <select value={form.niveau_discord} onChange={(e) => setField("niveau_discord", e.target.value as FormState["niveau_discord"])} className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5">
                  <option value="">Niveau Discord (1-5) *</option>
                  <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option>
                </select>
                <textarea value={form.experience_modo === "oui" ? form.experience_details : form.experience_similaire} onChange={(e) => form.experience_modo === "oui" ? setField("experience_details", e.target.value) : setField("experience_similaire", e.target.value)} rows={3} placeholder={form.experience_modo === "oui" ? "Details de ton experience *" : "Experience similaire *"} className="md:col-span-2 rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5" />
                <select value={form.principes_proportionnalite} onChange={(e) => setField("principes_proportionnalite", e.target.value as FormState["principes_proportionnalite"])} className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5">
                  <option value="">Sanction proportionnee ? *</option>
                  <option value="oui">Oui</option><option value="non">Non</option>
                </select>
                <select value={form.difference_sanctions} onChange={(e) => setField("difference_sanctions", e.target.value as FormState["difference_sanctions"])} className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5">
                  <option value="">Difference sanctions ? *</option>
                  <option value="oui">Oui</option><option value="non">Non</option>
                </select>
                <textarea value={form.principes_proportionnalite_explication} onChange={(e) => setField("principes_proportionnalite_explication", e.target.value)} rows={2} placeholder="Explique la proportionnalite *" className="md:col-span-2 rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5" />
                <textarea value={form.difference_sanctions_exemple} onChange={(e) => setField("difference_sanctions_exemple", e.target.value)} rows={2} placeholder="Exemple de sanctions *" className="md:col-span-2 rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5" />
                <select value={form.redaction_cr} onChange={(e) => setField("redaction_cr", e.target.value as FormState["redaction_cr"])} className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5">
                  <option value="">Redaction CR *</option>
                  <option value="oui">Oui</option><option value="non">Non</option>
                </select>
                <select value={form.style_communication} onChange={(e) => setField("style_communication", e.target.value as FormState["style_communication"])} className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5">
                  <option value="">Style de communication *</option>
                  <option value="direct">Direct</option><option value="empathique">Empathique</option><option value="structure">Structure</option><option value="mixte">Mixte</option><option value="autre">Autre</option>
                </select>
                <select value={form.preference_cadre} onChange={(e) => setField("preference_cadre", e.target.value as FormState["preference_cadre"])} className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5">
                  <option value="mix">Posture staff: equilibre cadre + humain</option>
                  <option value="cadre">Plutot cadre / regles claires</option>
                  <option value="humain">Plutot humain / ecoute</option>
                </select>
                <select value={form.energie_mentale} onChange={(e) => setField("energie_mentale", e.target.value as FormState["energie_mentale"])} className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5">
                  <option value="">Energie mentale (1-5) *</option>
                  <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option>
                </select>
              </div>
            ) : null}

            {steps[stepIndex] === "Questionnaire moderateur 2" ? (
              <div className="grid gap-3 md:grid-cols-2">
                {([
                  ["scenario_critique_staff", "Scenario critique staff *"],
                  ["scenario_clash_vocal", "Scenario clash vocal *"],
                  ["scenario_dm_grave", "Scenario DM grave *"],
                  ["scenario_spam_promo", "Scenario spam promo *"],
                  ["scenario_modo_sec", "Scenario moderation seul *"],
                  ["scenario_manipulation", "Scenario manipulation *"],
                  ["scenario_intrusif_vocal", "Scenario intrusif vocal *"],
                ] as const).map(([k, label]) => (
                  <textarea
                    key={k}
                    value={form[k]}
                    onChange={(e) => setField(k, e.target.value)}
                    rows={3}
                    placeholder={label}
                    className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5"
                  />
                ))}
                <textarea value={form.contradiction} onChange={(e) => setField("contradiction", e.target.value)} rows={3} placeholder="Quand on te contredit, que fais-tu ? *" className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5" />
                <textarea value={form.quand_jai_tort} onChange={(e) => setField("quand_jai_tort", e.target.value)} rows={3} placeholder="Quand tu as tort, reaction ? *" className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5" />
                <textarea value={form.limites_declencheurs} onChange={(e) => setField("limites_declencheurs", e.target.value)} rows={3} placeholder="Limites / declencheurs *" className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5" />
                <textarea value={form.prise_de_recul} onChange={(e) => setField("prise_de_recul", e.target.value)} rows={3} placeholder="Prise de recul *" className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5" />
                <select value={form.periode_impact} onChange={(e) => setField("periode_impact", e.target.value as FormState["periode_impact"])} className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5">
                  <option value="">Periode impactante ? *</option>
                  <option value="non">Non</option><option value="oui_legere">Oui legere</option><option value="oui_importante">Oui importante</option>
                </select>
                <select value={form.passer_relais} onChange={(e) => setField("passer_relais", e.target.value as FormState["passer_relais"])} className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5">
                  <option value="">Sais-tu passer le relais ? *</option>
                  <option value="oui">Oui</option><option value="non">Non</option>
                </select>
                {form.periode_impact !== "non" ? (
                  <textarea value={form.periode_gestion} onChange={(e) => setField("periode_gestion", e.target.value)} rows={3} placeholder="Comment geres-tu cette periode ? *" className="md:col-span-2 rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5" />
                ) : null}
                <textarea value={form.passer_relais_exemple} onChange={(e) => setField("passer_relais_exemple", e.target.value)} rows={3} placeholder="Exemple passer relais *" className="md:col-span-2 rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5" />
                <textarea value={form.desaccord_staff} onChange={(e) => setField("desaccord_staff", e.target.value)} rows={3} placeholder="Gestion desaccord staff *" className="md:col-span-2 rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5" />
                <select value={form.accepte_pause_retrait} onChange={(e) => setField("accepte_pause_retrait", e.target.value as FormState["accepte_pause_retrait"])} className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5">
                  <option value="">Accepte pause/retrait ? *</option>
                  <option value="oui">Oui</option><option value="non">Non</option>
                </select>
                <select value={form.accepte_documenter} onChange={(e) => setField("accepte_documenter", e.target.value as FormState["accepte_documenter"])} className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5">
                  <option value="">Accepte de documenter ? *</option>
                  <option value="oui">Oui</option><option value="non">Non</option>
                </select>
                <textarea value={form.accepte_pause_retrait_pourquoi} onChange={(e) => setField("accepte_pause_retrait_pourquoi", e.target.value)} rows={2} placeholder="Pourquoi pause/retrait *" className="md:col-span-2 rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5" />
                <textarea value={form.ami_demande_infos} onChange={(e) => setField("ami_demande_infos", e.target.value)} rows={2} placeholder="Ami demande infos staff: tu reponds quoi ? *" className="md:col-span-2 rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5" />
                <select value={form.engagement_hebdo} onChange={(e) => setField("engagement_hebdo", e.target.value as FormState["engagement_hebdo"])} className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5">
                  <option value="">Engagement hebdo *</option>
                  <option value="2h">2h</option><option value="4h">4h</option><option value="6h">6h</option><option value="variable">Variable</option>
                </select>
                {form.engagement_hebdo === "variable" ? (
                  <input value={form.engagement_hebdo_variable} onChange={(e) => setField("engagement_hebdo_variable", e.target.value)} placeholder="Precise engagement variable *" className="rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5" />
                ) : null}
                <div className="md:col-span-2">
                  <p className="mb-2 text-sm text-gray-300">Pôles d interet *</p>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggleInterest(option)}
                        className={`rounded-full border px-3 py-1.5 text-sm ${form.poles_interet.includes(option) ? "border-violet-400 bg-violet-500/15 text-violet-100" : "border-white/20 text-gray-300"}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea value={form.objectif_apprentissage} onChange={(e) => setField("objectif_apprentissage", e.target.value)} rows={2} placeholder="Objectif d apprentissage *" className="md:col-span-2 rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5" />
                <textarea value={form.commentaire_libre} onChange={(e) => setField("commentaire_libre", e.target.value)} rows={2} placeholder="Commentaire libre (optionnel)" className="md:col-span-2 rounded-lg border border-white/15 bg-[#0f1118] px-3 py-2.5" />
              </div>
            ) : null}

            {steps[stepIndex] === "Recapitulatif" ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-[#0f1118] p-4 text-sm">
                  <p><strong>Role:</strong> {form.role_postule ? roleLabel(form.role_postule) : "-"}</p>
                  <p><strong>Pseudo:</strong> {form.pseudo_discord || "-"}</p>
                  <p><strong>Disponibilites:</strong> {form.disponibilites || "-"}</p>
                  <p><strong>Engagement:</strong> {form.engagement_hebdo || "-"}</p>
                  {form.role_postule === "moderateur" || form.role_postule === "les_deux" ? (
                    <p>
                      <strong>Posture (cadre / humain):</strong>{" "}
                      {form.preference_cadre === "cadre" ? "Cadre / regles" : form.preference_cadre === "humain" ? "Humain / ecoute" : "Mix equilibre"}
                    </p>
                  ) : null}
                </div>
                <label className="flex items-start gap-2 text-sm text-gray-300">
                  <input type="checkbox" checked={form.accepte_confidentialite} onChange={(e) => setField("accepte_confidentialite", e.target.checked)} className="mt-1" />
                  J accepte la confidentialite des echanges staff.
                </label>
                <label className="flex items-start gap-2 text-sm text-gray-300">
                  <input type="checkbox" checked={form.consentement_traitement} onChange={(e) => setField("consentement_traitement", e.target.checked)} className="mt-1" />
                  J accepte le traitement de cette candidature.
                </label>
                <label className="flex items-start gap-2 text-sm text-gray-300">
                  <input type="checkbox" checked={form.comprend_entretien} onChange={(e) => setField("comprend_entretien", e.target.checked)} className="mt-1" />
                  Je comprends qu un entretien peut etre propose.
                </label>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={() => (stepIndex === 0 ? setMode("status") : goPrev())} className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/5">
                <span className="inline-flex items-center gap-2"><ArrowLeft size={14} /> {stepIndex === 0 ? "Retour statut" : "Precedent"}</span>
              </button>
              {stepIndex < steps.length - 1 ? (
                <button type="button" onClick={goNext} className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500">
                  <span className="inline-flex items-center gap-2">Suivant <ArrowRight size={14} /></span>
                </button>
              ) : (
                <button type="button" disabled={saving} onClick={submitApplication} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500 disabled:opacity-60">
                  <span className="inline-flex items-center gap-2">{saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} {editingId ? "Mettre a jour ma candidature" : "Envoyer ma candidature"}</span>
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
