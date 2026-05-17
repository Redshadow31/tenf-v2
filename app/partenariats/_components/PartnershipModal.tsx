"use client";

/**
 * Modale plein écran "Demande de partenariat" branchée sur le bouton
 * Contact de la page /partenariats.
 *
 * Découpage en 3 étapes :
 *   1/3 — Règlement de partenariat à accepter (checkbox obligatoire)
 *   2/3 — Formulaire complet (sections : projet, responsable, demande, cadre, message, consentement)
 *   3/3 — Confirmation "Demande envoyée"
 *
 * UX :
 *  - Fermable via la croix en haut à droite.
 *  - Si l'utilisateur tente de fermer alors qu'il a commencé à remplir le
 *    formulaire (step 2 et au moins un champ non vide), une confirmation
 *    apparaît : "Voulez-vous vraiment fermer ? Les informations saisies
 *    seront perdues."
 *  - Le clic sur le fond ne ferme pas la modale (évite les pertes accidentelles).
 *  - L'échappe ferme la modale (avec confirmation si nécessaire).
 *  - Verrouille le scroll du body pendant l'ouverture.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ClipboardList,
  FileText,
  Globe2,
  HeartHandshake,
  MessageCircle,
  Send,
  Shield,
  Sparkles,
  UserCheck,
  X,
} from "lucide-react";

export type PartnershipModalProps = {
  open: boolean;
  onClose: () => void;
};

type Step = 1 | 2 | 3;

type FormState = {
  // Informations générales
  projectName: string;
  partnershipType: PartnershipType | "";
  projectDescription: string;
  discordLink: string;
  twitchLink: string;
  websiteLink: string;
  socialLinks: string;
  // Responsables
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactDiscord: string;
  otherContact: string;
  // Détails de la demande
  partnershipGoal: string;
  partnerOffers: string;
  partnerExpectations: string;
  desiredDuration: DesiredDuration | "";
  desiredDate: string;
  targetAudience: string;
  estimatedMembers: string;
  // Cadre & sécurité (5 Oui/Non)
  independenceAccepted: YesNo;
  noRecruitmentAccepted: YesNo;
  confidentialityAccepted: YesNo;
  observationAccepted: YesNo;
  interruptionAccepted: YesNo;
  // Message complémentaire
  additionalMessage: string;
  // Consentement final
  representativeConfirmed: boolean;
  dataUsageAccepted: boolean;
  // Honeypot
  website: string;
};

type PartnershipType =
  | "inter_serveurs"
  | "evenementiel"
  | "caritatif"
  | "visibilite"
  | "autre";

type DesiredDuration =
  | "ponctuel"
  | "30_jours"
  | "3_mois"
  | "long_terme"
  | "a_definir";

type YesNo = "" | "yes" | "no";

const TYPE_OPTIONS: { value: PartnershipType; label: string }[] = [
  { value: "inter_serveurs", label: "Partenariat inter-serveurs d'entraide" },
  { value: "evenementiel", label: "Partenariat événementiel" },
  { value: "caritatif", label: "Partenariat caritatif / associatif" },
  { value: "visibilite", label: "Partenariat visibilité / promotion croisée" },
  { value: "autre", label: "Autre" },
];

const DURATION_OPTIONS: { value: DesiredDuration; label: string }[] = [
  { value: "ponctuel", label: "Ponctuel" },
  { value: "30_jours", label: "30 jours" },
  { value: "3_mois", label: "3 mois" },
  { value: "long_terme", label: "Long terme" },
  { value: "a_definir", label: "À définir ensemble" },
];

const RULES_PARAGRAPHS = [
  "TENF peut collaborer avec d'autres projets, serveurs Discord, communautés Twitch, associations ou événements, à condition que le partenariat respecte les valeurs de la communauté : entraide réelle, respect, bienveillance, transparence, équilibre et protection des membres.",
  "Un partenariat ne doit jamais mettre TENF en difficulté, créer de la confusion pour les membres, affaiblir son fonctionnement interne ou servir uniquement de vitrine promotionnelle à un autre projet.",
  "Tout partenariat officiel impliquant TENF doit être validé par les fondateurs ou par les admins coordinateurs mandatés. Aucun membre, modérateur, soutien ou partenaire ne peut engager le nom de TENF sans accord préalable.",
  "Un partenariat ne signifie pas fusion, rattachement ou contrôle mutuel. Chaque serveur, projet ou communauté conserve son indépendance totale concernant ses règles, sa modération, ses sanctions, ses rôles, ses événements, son système d'intégration et ses décisions internes.",
  "Un partenariat ne donne aucun droit automatique aux membres du partenaire. Toute personne souhaitant rejoindre TENF doit suivre le parcours normal d'intégration, au même titre que les autres membres.",
  "Il est interdit d'utiliser un partenariat pour recruter directement des membres, streamers, modérateurs ou responsables de TENF sans accord explicite des fondateurs. Les messages privés de recrutement massif, les invitations insistantes ou le démarchage sont interdits.",
  "Les informations internes de TENF ne doivent jamais être transmises à un partenaire sans validation explicite des fondateurs. Cela concerne notamment les discussions staff, signalements, sanctions, évaluations de membres, conflits internes, données personnelles ou informations sensibles.",
  "Chaque partenariat doit avoir au minimum un référent côté TENF et un référent côté partenaire. Les événements communs doivent être cadrés avant leur annonce publique.",
  "Toute communication publique autour d'un partenariat doit être validée avant publication. Le nom, le logo ou l'image de TENF ne doivent pas être utilisés sans accord.",
  "TENF se réserve le droit de suspendre ou mettre fin à un partenariat à tout moment si celui-ci ne respecte plus les règles, les valeurs ou l'équilibre attendu.",
] as const;

function initialForm(): FormState {
  return {
    projectName: "",
    partnershipType: "",
    projectDescription: "",
    discordLink: "",
    twitchLink: "",
    websiteLink: "",
    socialLinks: "",
    contactName: "",
    contactRole: "",
    contactEmail: "",
    contactDiscord: "",
    otherContact: "",
    partnershipGoal: "",
    partnerOffers: "",
    partnerExpectations: "",
    desiredDuration: "",
    desiredDate: "",
    targetAudience: "",
    estimatedMembers: "",
    independenceAccepted: "",
    noRecruitmentAccepted: "",
    confidentialityAccepted: "",
    observationAccepted: "",
    interruptionAccepted: "",
    additionalMessage: "",
    representativeConfirmed: false,
    dataUsageAccepted: false,
    website: "",
  };
}

function isFormDirty(state: FormState): boolean {
  return (
    state.projectName.trim().length > 0 ||
    state.partnershipType !== "" ||
    state.projectDescription.trim().length > 0 ||
    state.discordLink.trim().length > 0 ||
    state.twitchLink.trim().length > 0 ||
    state.websiteLink.trim().length > 0 ||
    state.socialLinks.trim().length > 0 ||
    state.contactName.trim().length > 0 ||
    state.contactRole.trim().length > 0 ||
    state.contactEmail.trim().length > 0 ||
    state.contactDiscord.trim().length > 0 ||
    state.otherContact.trim().length > 0 ||
    state.partnershipGoal.trim().length > 0 ||
    state.partnerOffers.trim().length > 0 ||
    state.partnerExpectations.trim().length > 0 ||
    state.desiredDuration !== "" ||
    state.desiredDate.trim().length > 0 ||
    state.targetAudience.trim().length > 0 ||
    state.estimatedMembers.trim().length > 0 ||
    state.independenceAccepted !== "" ||
    state.noRecruitmentAccepted !== "" ||
    state.confidentialityAccepted !== "" ||
    state.observationAccepted !== "" ||
    state.interruptionAccepted !== "" ||
    state.additionalMessage.trim().length > 0 ||
    state.representativeConfirmed ||
    state.dataUsageAccepted
  );
}

type Errors = Partial<Record<keyof FormState, string>> & { _global?: string };

function validateClient(state: FormState): Errors {
  const errors: Errors = {};
  if (state.projectName.trim().length < 2) {
    errors.projectName = "Indique le nom du projet (au moins 2 caractères).";
  }
  if (!state.partnershipType) {
    errors.partnershipType = "Choisis un type de partenariat.";
  }
  if (state.projectDescription.trim().length < 40) {
    errors.projectDescription = "Décris ton projet en 40 caractères minimum.";
  }
  if (state.contactName.trim().length < 2) {
    errors.contactName = "Indique le nom ou pseudo du responsable.";
  }
  const email = state.contactEmail.trim();
  if (!email) {
    errors.contactEmail = "Adresse e-mail obligatoire.";
  } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    errors.contactEmail = "Adresse e-mail invalide.";
  }
  if (state.partnershipGoal.trim().length < 20) {
    errors.partnershipGoal = "Décris l'objectif (20 caractères min.).";
  }
  if (state.partnerOffers.trim().length < 20) {
    errors.partnerOffers = "Décris ce que tu proposes à TENF (20 caractères min.).";
  }
  if (state.partnerExpectations.trim().length < 20) {
    errors.partnerExpectations = "Décris ce que tu attends de TENF (20 caractères min.).";
  }
  if (state.independenceAccepted !== "yes") {
    errors.independenceAccepted = "Cet engagement doit être accepté (Oui).";
  }
  if (state.noRecruitmentAccepted !== "yes") {
    errors.noRecruitmentAccepted = "Cet engagement doit être accepté (Oui).";
  }
  if (state.confidentialityAccepted !== "yes") {
    errors.confidentialityAccepted = "Cet engagement doit être accepté (Oui).";
  }
  if (state.observationAccepted !== "yes") {
    errors.observationAccepted = "Cet engagement doit être accepté (Oui).";
  }
  if (state.interruptionAccepted !== "yes") {
    errors.interruptionAccepted = "Cet engagement doit être accepté (Oui).";
  }
  if (!state.representativeConfirmed) {
    errors.representativeConfirmed = "Cette case est obligatoire.";
  }
  if (!state.dataUsageAccepted) {
    errors.dataUsageAccepted = "Cette case est obligatoire.";
  }
  return errors;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs font-medium" style={{ color: "#dc2626" }}>
      {message}
    </p>
  );
}

function FormSection({
  number,
  title,
  description,
  icon: Icon,
  complete,
  children,
}: {
  number: string;
  title: string;
  description?: string;
  icon?: typeof Building2;
  complete?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className="rounded-2xl border p-4 transition-colors sm:p-5"
      style={{
        borderColor: complete
          ? "color-mix(in srgb, #16a34a 35%, var(--color-border))"
          : "var(--color-border)",
        backgroundColor: "color-mix(in srgb, var(--color-card) 92%, transparent)",
      }}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {Icon ? (
            <span
              className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
                color: "var(--color-primary)",
              }}
              aria-hidden
            >
              <Icon size={18} aria-hidden />
            </span>
          ) : null}
          <div>
            <span
              className="text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: "var(--color-primary)" }}
            >
              {number}
            </span>
            <h3
              className="mt-0.5 text-base font-semibold sm:text-lg"
              style={{ color: "var(--color-text)" }}
            >
              {title}
            </h3>
            {description ? (
              <p className="mt-1 text-xs sm:text-sm" style={{ color: "var(--color-muted)" }}>
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {complete ? (
          <span
            className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{
              backgroundColor: "color-mix(in srgb, #16a34a 16%, transparent)",
              color: "#15803d",
            }}
          >
            <Check size={10} strokeWidth={3} aria-hidden /> Complète
          </span>
        ) : null}
      </header>
      <div className="space-y-3 sm:space-y-4">{children}</div>
    </section>
  );
}

function Label({ htmlFor, children, required }: { htmlFor: string; children: ReactNode; required?: boolean }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium"
      style={{ color: "var(--color-text)" }}
    >
      {children}
      {required ? (
        <span aria-hidden style={{ color: "var(--color-primary)" }}>
          {" *"}
        </span>
      ) : null}
    </label>
  );
}

const inputBaseClass = "pmodal-field-input mt-1 w-full rounded-xl border px-3 py-2 text-sm";

function inputClass(hasError?: boolean): string {
  return `${inputBaseClass}${hasError ? " pmodal-field-input--error" : ""}`;
}

function inputStyle(hasError?: boolean): React.CSSProperties {
  return {
    borderColor: hasError ? "#dc2626" : "var(--color-border)",
  };
}

/** Indique si une section du formulaire est entièrement remplie (côté visuel) */
function sectionStatus(form: FormState): {
  general: boolean;
  contact: boolean;
  details: boolean;
  framework: boolean;
  consent: boolean;
} {
  return {
    general:
      form.projectName.trim().length >= 2 &&
      form.partnershipType !== "" &&
      form.projectDescription.trim().length >= 40,
    contact:
      form.contactName.trim().length >= 2 &&
      /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.contactEmail.trim()),
    details:
      form.partnershipGoal.trim().length >= 20 &&
      form.partnerOffers.trim().length >= 20 &&
      form.partnerExpectations.trim().length >= 20,
    framework:
      form.independenceAccepted === "yes" &&
      form.noRecruitmentAccepted === "yes" &&
      form.confidentialityAccepted === "yes" &&
      form.observationAccepted === "yes" &&
      form.interruptionAccepted === "yes",
    consent: form.representativeConfirmed && form.dataUsageAccepted,
  };
}

export default function PartnershipModal({ open, onClose }: PartnershipModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [acceptRules, setAcceptRules] = useState(false);
  const [form, setForm] = useState<FormState>(() => initialForm());
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Marque le composant comme monté côté client (pour activer le portal).
  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloque le scroll body
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const reset = useCallback(() => {
    setStep(1);
    setAcceptRules(false);
    setForm(initialForm());
    setErrors({});
    setServerError(null);
    setSubmitting(false);
  }, []);

  const dirty = useMemo(() => isFormDirty(form), [form]);

  const handleClose = useCallback(() => {
    if (step === 2 && dirty) {
      const confirmed = window.confirm(
        "Voulez-vous vraiment fermer ? Les informations saisies seront perdues."
      );
      if (!confirmed) return;
    }
    reset();
    onClose();
  }, [step, dirty, onClose, reset]);

  // Échappe = fermer (avec confirmation si formulaire entamé)
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  // Reset si la modale est rouverte
  useEffect(() => {
    if (open) {
      // Pas de reset si on rouvre après confirmation (step 3)
      if (step === 3) return;
    } else {
      // À la fermeture, on remet à zéro pour la prochaine ouverture
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const { [key]: _omit, ...rest } = prev;
      return rest;
    });
  }

  function handleTextChange(key: keyof FormState) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      updateField(key, e.target.value as FormState[typeof key]);
    };
  }

  async function handleSubmit() {
    setServerError(null);
    const clientErrors = validateClient(form);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      // Scroll vers le premier champ en erreur
      requestAnimationFrame(() => {
        const firstKey = Object.keys(clientErrors)[0];
        const el = document.querySelector<HTMLElement>(`[data-pmodal-field="${firstKey}"]`);
        if (el && panelRef.current) {
          panelRef.current.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
        }
      });
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const payload = {
        projectName: form.projectName.trim(),
        partnershipType: form.partnershipType,
        projectDescription: form.projectDescription.trim(),
        discordLink: form.discordLink.trim() || null,
        twitchLink: form.twitchLink.trim() || null,
        websiteLink: form.websiteLink.trim() || null,
        socialLinks: form.socialLinks.trim() || null,
        contactName: form.contactName.trim(),
        contactRole: form.contactRole.trim() || null,
        contactEmail: form.contactEmail.trim(),
        contactDiscord: form.contactDiscord.trim() || null,
        otherContact: form.otherContact.trim() || null,
        partnershipGoal: form.partnershipGoal.trim(),
        partnerOffers: form.partnerOffers.trim(),
        partnerExpectations: form.partnerExpectations.trim(),
        desiredDuration: form.desiredDuration || null,
        desiredDate: form.desiredDate.trim() || null,
        targetAudience: form.targetAudience.trim() || null,
        estimatedMembers: form.estimatedMembers.trim() || null,
        independenceAccepted: form.independenceAccepted === "yes",
        noRecruitmentAccepted: form.noRecruitmentAccepted === "yes",
        confidentialityAccepted: form.confidentialityAccepted === "yes",
        observationAccepted: form.observationAccepted === "yes",
        interruptionAccepted: form.interruptionAccepted === "yes",
        additionalMessage: form.additionalMessage.trim() || null,
        representativeConfirmed: form.representativeConfirmed,
        dataUsageAccepted: form.dataUsageAccepted,
        website: form.website, // honeypot
      };
      const res = await fetch("/api/partnerships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; field?: string; ok?: boolean };
      if (!res.ok) {
        if (data.field) {
          setErrors({ [data.field]: data.error || "Champ invalide." } as Errors);
        }
        setServerError(data.error || "Erreur lors de l'envoi.");
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
      setStep(3);
    } catch (error) {
      console.error("[PartnershipModal] submit error:", error);
      setServerError("Erreur réseau. Vérifie ta connexion et réessaie.");
      setSubmitting(false);
    }
  }

  if (!open || !mounted) return null;

  // Portail : on rend la modale directement dans <body> pour échapper aux
  // ancêtres ayant une `transform`/`filter`/`will-change` (notamment
  // `.about-fade-up` sur la section parente), qui cassent `position: fixed`.
  const modalNode = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="partnership-modal-title"
      className="pmodal-overlay fixed inset-0 z-[100] flex items-stretch justify-center"
      style={{
        backgroundColor: "color-mix(in srgb, var(--color-bg) 55%, rgba(8,8,16,0.75))",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        ref={panelRef}
        className="pmodal-panel relative flex h-full w-full flex-col overflow-y-auto"
        style={{
          backgroundColor: "var(--color-bg)",
          color: "var(--color-text)",
        }}
      >
        {/* Aurora décorative en arrière-plan */}
        <div className={`pmodal-aurora${step === 3 ? " pmodal-aurora--success" : ""}`} aria-hidden />

        {/* Header sticky : branding + stepper + close */}
        <header
          className="sticky top-0 z-10 border-b px-4 pb-3 pt-3 sm:px-6"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-bg) 90%, transparent)",
            backdropFilter: "blur(12px)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--color-primary) 18%, transparent)",
                  color: "var(--color-primary)",
                }}
                aria-hidden
              >
                <HeartHandshake size={18} aria-hidden />
              </span>
              <div className="min-w-0">
                <p
                  id="partnership-modal-title"
                  className="truncate text-sm font-semibold sm:text-base"
                >
                  Demande de partenariat TENF
                </p>
                <p
                  className="hidden truncate text-xs sm:block"
                  style={{ color: "var(--color-muted)" }}
                >
                  {step === 1
                    ? "Étape 1/3 — Lis et accepte le règlement"
                    : step === 2
                    ? "Étape 2/3 — Présente ton projet"
                    : "Étape 3/3 — Demande envoyée"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              aria-label="Fermer la fenêtre de partenariat"
              className="flex h-9 w-9 items-center justify-center rounded-xl border transition-all hover:scale-105 hover:opacity-90"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
              }}
            >
              <X size={18} aria-hidden />
            </button>
          </div>

          <Stepper step={step} />
        </header>

        {/* Contenu */}
        <div className="relative z-[1] mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {step === 1 ? (
            <div key="step-rules" className="pmodal-step">
              <StepRules
                accepted={acceptRules}
                onChange={setAcceptRules}
                onContinue={() => setStep(2)}
                onCancel={handleClose}
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div key="step-form" className="pmodal-step">
              <StepForm
                form={form}
                errors={errors}
                submitting={submitting}
                serverError={serverError}
                onChange={handleTextChange}
                onBoolChange={(key, value) => updateField(key, value as FormState[typeof key])}
                onBack={() => {
                  setServerError(null);
                  setErrors({});
                  setStep(1);
                }}
                onSubmit={handleSubmit}
              />
            </div>
          ) : null}

          {step === 3 ? (
            <div key="step-confirm" className="pmodal-step">
              <StepConfirmation onClose={handleClose} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}

const STEPPER_LABELS: { num: 1 | 2 | 3; short: string; full: string }[] = [
  { num: 1, short: "Règlement", full: "Règlement de partenariat" },
  { num: 2, short: "Formulaire", full: "Formulaire complet" },
  { num: 3, short: "Envoyée", full: "Confirmation" },
];

function Stepper({ step }: { step: Step }) {
  return (
    <nav
      className="mt-3 flex items-center gap-2 sm:gap-3"
      aria-label="Progression de la demande"
    >
      {STEPPER_LABELS.map((item, index) => {
        const isDone = item.num < step;
        const isActive = item.num === step;
        const dotClassName = `pmodal-stepper-dot${
          isDone ? " pmodal-stepper-dot--done" : isActive ? " pmodal-stepper-dot--active" : ""
        }`;
        return (
          <div key={item.num} className="flex flex-1 items-center gap-2 sm:gap-3">
            <div className="flex flex-col items-center gap-1">
              <div
                className={dotClassName}
                aria-current={isActive ? "step" : undefined}
                aria-label={`Étape ${item.num} : ${item.full}${isDone ? " (terminée)" : isActive ? " (en cours)" : ""}`}
              >
                {isDone ? <Check size={14} aria-hidden strokeWidth={3} /> : item.num}
              </div>
              <span
                className="hidden text-[10px] font-semibold uppercase tracking-wider sm:block"
                style={{
                  color: isActive
                    ? "var(--color-primary)"
                    : isDone
                    ? "#15803d"
                    : "var(--color-muted)",
                }}
              >
                {item.short}
              </span>
            </div>
            {index < STEPPER_LABELS.length - 1 ? (
              <div
                className="pmodal-stepper-line"
                style={
                  {
                    "--progress": isDone ? 1 : isActive ? 0.5 : 0,
                  } as React.CSSProperties
                }
              />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

/* ───────── Étape 1 ───────── */

function StepRules({
  accepted,
  onChange,
  onContinue,
  onCancel,
}: {
  accepted: boolean;
  onChange: (next: boolean) => void;
  onContinue: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="text-center sm:text-left">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
            color: "var(--color-primary)",
          }}
        >
          <Shield size={12} aria-hidden /> Cadre de partenariat
        </span>
        <h2
          className="mt-3 font-extrabold leading-tight tracking-tight"
          style={{ fontSize: "clamp(1.5rem, 1rem + 1.8vw, 2.5rem)" }}
        >
          Règlement des partenariats TENF
        </h2>
        <p
          className="mt-2 leading-relaxed"
          style={{
            color: "var(--color-muted)",
            fontSize: "clamp(0.875rem, 0.82rem + 0.15vw, 1rem)",
            maxWidth: "60ch",
          }}
        >
          Lis attentivement ces dix engagements avant d&apos;accéder au formulaire. Ils sont
          la base de toute collaboration sérieuse avec TENF.
        </p>
      </div>

      {/* Grille 2 colonnes desktop : règles à gauche, citation + acceptation à droite */}
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* Colonne règles */}
        <article
          className="max-h-[60vh] overflow-y-auto rounded-2xl border p-3 sm:p-4 lg:max-h-[62vh]"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "color-mix(in srgb, var(--color-card) 90%, transparent)",
          }}
        >
          <ul className="space-y-2">
            {RULES_PARAGRAPHS.map((paragraph, index) => (
              <li
                key={index}
                data-num={String(index + 1).padStart(2, "0")}
                className="pmodal-rule-card rounded-xl border p-3 text-sm leading-relaxed transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)] sm:p-4"
                style={{
                  borderColor: "color-mix(in srgb, var(--color-border) 90%, transparent)",
                  backgroundColor: "color-mix(in srgb, var(--color-bg) 60%, transparent)",
                  color: "var(--color-text)",
                }}
              >
                {paragraph}
              </li>
            ))}
          </ul>
        </article>

        {/* Colonne citation + acceptation (sticky desktop) */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-[170px] lg:self-start">
          <aside
            className="relative overflow-hidden rounded-2xl border p-5"
            style={{
              borderColor: "color-mix(in srgb, var(--color-primary) 40%, var(--color-border))",
              backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, var(--color-card))",
            }}
          >
            <Sparkles
              size={20}
              aria-hidden
              className="mb-3"
              style={{ color: "var(--color-primary)" }}
            />
            <p
              className="text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ color: "var(--color-primary)" }}
            >
              Phrase de référence
            </p>
            <blockquote
              className="mt-2 font-semibold leading-relaxed"
              style={{
                color: "var(--color-text)",
                fontSize: "clamp(1rem, 0.85rem + 0.4vw, 1.25rem)",
              }}
            >
              Un partenaire peut <span style={{ color: "var(--color-primary)" }}>collaborer avec TENF</span>,
              mais il ne fait pas partie de TENF.
            </blockquote>
          </aside>

          <label
            className="group flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all"
            style={{
              borderColor: accepted
                ? "color-mix(in srgb, #16a34a 60%, var(--color-border))"
                : "var(--color-border)",
              backgroundColor: accepted
                ? "color-mix(in srgb, #16a34a 8%, transparent)"
                : "color-mix(in srgb, var(--color-card) 80%, transparent)",
              boxShadow: accepted
                ? "0 0 0 3px color-mix(in srgb, #16a34a 12%, transparent)"
                : "none",
            }}
          >
            <span
              className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all"
              style={{
                borderColor: accepted ? "#16a34a" : "var(--color-border)",
                backgroundColor: accepted ? "#16a34a" : "transparent",
              }}
              aria-hidden
            >
              {accepted ? <Check size={12} strokeWidth={3} style={{ color: "white" }} aria-hidden /> : null}
            </span>
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => onChange(e.target.checked)}
              className="sr-only"
              aria-describedby="accept-rules-helper"
            />
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                J&apos;ai lu et j&apos;accepte le règlement des partenariats TENF.
              </p>
              <p
                id="accept-rules-helper"
                className="mt-1 text-xs leading-snug"
                style={{ color: "var(--color-muted)" }}
              >
                Cette acceptation conditionne l&apos;accès au formulaire — elle ne crée encore
                aucun engagement.
              </p>
            </div>
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onCancel}
              className="home-btn-secondary inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02]"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={!accepted}
              onClick={onContinue}
              className="home-btn-primary inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              aria-disabled={!accepted}
            >
              Continuer <ArrowRight size={16} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── Étape 2 ───────── */

function YesNoRow({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: YesNo;
  onChange: (next: YesNo) => void;
  error?: string;
}) {
  return (
    <div
      data-pmodal-field={id}
      className="flex flex-col gap-2 rounded-xl border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-3"
      style={{
        borderColor:
          value === "yes"
            ? "color-mix(in srgb, #16a34a 30%, var(--color-border))"
            : "var(--color-border)",
        backgroundColor: "color-mix(in srgb, var(--color-bg) 70%, transparent)",
      }}
    >
      <fieldset className="min-w-0 flex-1">
        <legend className="text-sm font-medium leading-snug" style={{ color: "var(--color-text)" }}>
          {label} <span aria-hidden style={{ color: "var(--color-primary)" }}>*</span>
        </legend>
        {error ? (
          <p className="mt-1 text-xs font-medium" style={{ color: "#dc2626" }}>
            {error}
          </p>
        ) : null}
      </fieldset>
      <div className="flex flex-shrink-0 gap-2" role="radiogroup" aria-label={label}>
        {(["yes", "no"] as const).map((option) => {
          const active = value === option;
          const Icon = option === "yes" ? Check : X;
          return (
            <button
              type="button"
              key={option}
              onClick={() => onChange(option)}
              className="inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-sm font-semibold transition-all hover:scale-105"
              style={{
                borderColor: active
                  ? option === "yes"
                    ? "#16a34a"
                    : "#dc2626"
                  : "var(--color-border)",
                backgroundColor: active
                  ? option === "yes"
                    ? "color-mix(in srgb, #16a34a 16%, transparent)"
                    : "color-mix(in srgb, #dc2626 14%, transparent)"
                  : "var(--color-bg)",
                color: active
                  ? option === "yes"
                    ? "#15803d"
                    : "#b91c1c"
                  : "var(--color-text)",
              }}
              role="radio"
              aria-checked={active}
            >
              <Icon size={14} strokeWidth={3} aria-hidden /> {option === "yes" ? "Oui" : "Non"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepForm({
  form,
  errors,
  submitting,
  serverError,
  onChange,
  onBoolChange,
  onBack,
  onSubmit,
}: {
  form: FormState;
  errors: Errors;
  submitting: boolean;
  serverError: string | null;
  onChange: (
    key: keyof FormState
  ) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBoolChange: (key: keyof FormState, value: boolean | YesNo) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const status = sectionStatus(form);
  const completedCount =
    (status.general ? 1 : 0) +
    (status.contact ? 1 : 0) +
    (status.details ? 1 : 0) +
    (status.framework ? 1 : 0) +
    (status.consent ? 1 : 0);
  const totalRequired = 5;
  const progressPct = Math.round((completedCount / totalRequired) * 100);

  return (
    <div className="space-y-6">
      <header className="text-center sm:text-left">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
            color: "var(--color-primary)",
          }}
        >
          <ClipboardList size={12} aria-hidden /> Présente ton projet
        </span>
        <h2
          className="mt-3 font-extrabold leading-tight tracking-tight"
          style={{ fontSize: "clamp(1.5rem, 1rem + 1.8vw, 2.5rem)" }}
        >
          Demande de partenariat
        </h2>
        <p
          className="mt-2 leading-relaxed"
          style={{
            color: "var(--color-muted)",
            fontSize: "clamp(0.875rem, 0.82rem + 0.15vw, 1rem)",
            maxWidth: "62ch",
          }}
        >
          Les informations envoyées seront utilisées uniquement pour étudier ta demande
          de partenariat avec TENF. Plus tu es concret, plus on peut te répondre vite et juste.
        </p>
      </header>

      {/* Barre de progression du formulaire */}
      <div
        className="flex flex-wrap items-center gap-3 rounded-xl border px-4 py-2.5"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "color-mix(in srgb, var(--color-card) 80%, transparent)",
        }}
      >
        <span className="text-xs font-medium" style={{ color: "var(--color-muted)" }}>
          {completedCount}/{totalRequired} sections requises complètes
        </span>
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-border) 70%, transparent)",
          }}
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progressPct}%`,
              background:
                "linear-gradient(90deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 70%, #6366f1))",
            }}
          />
        </div>
        <span
          className="text-xs font-semibold"
          style={{
            color: progressPct === 100 ? "#15803d" : "var(--color-primary)",
          }}
        >
          {progressPct}%
        </span>
      </div>

      {serverError ? (
        <div
          className="rounded-2xl border px-4 py-3 text-sm"
          role="alert"
          style={{
            borderColor: "#dc2626",
            backgroundColor: "color-mix(in srgb, #dc2626 8%, transparent)",
            color: "#b91c1c",
          }}
        >
          {serverError}
        </div>
      ) : null}

      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        noValidate
      >
        {/* Honeypot */}
        <input
          type="text"
          name="website"
          value={form.website}
          onChange={onChange("website")}
          autoComplete="off"
          tabIndex={-1}
          className="hidden"
          aria-hidden
        />

        {/* Section 1 : Informations générales */}
        <FormSection
          number="Section 1 / 6"
          title="Informations générales"
          icon={Building2}
          complete={status.general}
        >
          <div data-pmodal-field="projectName">
            <Label htmlFor="pm-projectName" required>
              Nom du projet / serveur / association / communauté
            </Label>
            <input
              id="pm-projectName"
              type="text"
              value={form.projectName}
              onChange={onChange("projectName")}
              className={inputBaseClass}
              style={inputStyle(!!errors.projectName)}
              maxLength={160}
              autoComplete="off"
            />
            <FieldError message={errors.projectName} />
          </div>

          <div data-pmodal-field="partnershipType">
            <Label htmlFor="pm-type" required>
              Type de partenariat souhaité
            </Label>
            <select
              id="pm-type"
              value={form.partnershipType}
              onChange={onChange("partnershipType")}
              className={inputBaseClass}
              style={inputStyle(!!errors.partnershipType)}
            >
              <option value="">— Choisis un type —</option>
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError message={errors.partnershipType} />
          </div>

          <div data-pmodal-field="projectDescription">
            <Label htmlFor="pm-description" required>
              Description courte du projet
            </Label>
            <textarea
              id="pm-description"
              value={form.projectDescription}
              onChange={onChange("projectDescription")}
              className={inputBaseClass}
              style={inputStyle(!!errors.projectDescription)}
              rows={4}
              maxLength={2000}
            />
            <FieldError message={errors.projectDescription} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="pm-discord">Lien Discord</Label>
              <input
                id="pm-discord"
                type="url"
                value={form.discordLink}
                onChange={onChange("discordLink")}
                className={inputBaseClass}
                style={inputStyle()}
                maxLength={300}
                placeholder="https://discord.gg/..."
              />
            </div>
            <div>
              <Label htmlFor="pm-twitch">Lien Twitch</Label>
              <input
                id="pm-twitch"
                type="url"
                value={form.twitchLink}
                onChange={onChange("twitchLink")}
                className={inputBaseClass}
                style={inputStyle()}
                maxLength={300}
                placeholder="https://twitch.tv/..."
              />
            </div>
            <div>
              <Label htmlFor="pm-website">Site web</Label>
              <input
                id="pm-website"
                type="url"
                value={form.websiteLink}
                onChange={onChange("websiteLink")}
                className={inputBaseClass}
                style={inputStyle()}
                maxLength={300}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="pm-socials">Réseaux sociaux</Label>
              <input
                id="pm-socials"
                type="text"
                value={form.socialLinks}
                onChange={onChange("socialLinks")}
                className={inputBaseClass}
                style={inputStyle()}
                maxLength={500}
                placeholder="Instagram, X, TikTok, YouTube…"
              />
            </div>
          </div>
        </FormSection>

        {/* Section 2 : Responsables */}
        <FormSection
          number="Section 2 / 6"
          title="Responsable du projet"
          icon={UserCheck}
          complete={status.contact}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div data-pmodal-field="contactName">
              <Label htmlFor="pm-contactName" required>
                Nom / pseudo du responsable principal
              </Label>
              <input
                id="pm-contactName"
                type="text"
                value={form.contactName}
                onChange={onChange("contactName")}
                className={inputBaseClass}
                style={inputStyle(!!errors.contactName)}
                maxLength={120}
                autoComplete="off"
              />
              <FieldError message={errors.contactName} />
            </div>
            <div>
              <Label htmlFor="pm-contactRole">Rôle dans le projet</Label>
              <input
                id="pm-contactRole"
                type="text"
                value={form.contactRole}
                onChange={onChange("contactRole")}
                className={inputBaseClass}
                style={inputStyle()}
                maxLength={200}
                placeholder="Fondateur, président, community manager…"
              />
            </div>
            <div data-pmodal-field="contactEmail">
              <Label htmlFor="pm-contactEmail" required>
                Adresse e-mail de contact
              </Label>
              <input
                id="pm-contactEmail"
                type="email"
                value={form.contactEmail}
                onChange={onChange("contactEmail")}
                className={inputBaseClass}
                style={inputStyle(!!errors.contactEmail)}
                maxLength={200}
                autoComplete="email"
              />
              <FieldError message={errors.contactEmail} />
            </div>
            <div>
              <Label htmlFor="pm-contactDiscord">Discord du responsable</Label>
              <input
                id="pm-contactDiscord"
                type="text"
                value={form.contactDiscord}
                onChange={onChange("contactDiscord")}
                className={inputBaseClass}
                style={inputStyle()}
                maxLength={200}
                placeholder="pseudo#0000 ou pseudo"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="pm-otherContact">Autre moyen de contact</Label>
              <input
                id="pm-otherContact"
                type="text"
                value={form.otherContact}
                onChange={onChange("otherContact")}
                className={inputBaseClass}
                style={inputStyle()}
                maxLength={200}
                placeholder="Téléphone, WhatsApp, autre…"
              />
            </div>
          </div>
        </FormSection>

        {/* Section 3 : Détails de la demande */}
        <FormSection
          number="Section 3 / 6"
          title="Détails du partenariat"
          icon={FileText}
          complete={status.details}
        >
          <div data-pmodal-field="partnershipGoal">
            <Label htmlFor="pm-goal" required>
              Objectif du partenariat
            </Label>
            <textarea
              id="pm-goal"
              value={form.partnershipGoal}
              onChange={onChange("partnershipGoal")}
              className={inputBaseClass}
              style={inputStyle(!!errors.partnershipGoal)}
              rows={3}
              maxLength={2000}
            />
            <FieldError message={errors.partnershipGoal} />
          </div>
          <div data-pmodal-field="partnerOffers">
            <Label htmlFor="pm-offers" required>
              Ce que tu souhaites proposer à TENF
            </Label>
            <textarea
              id="pm-offers"
              value={form.partnerOffers}
              onChange={onChange("partnerOffers")}
              className={inputBaseClass}
              style={inputStyle(!!errors.partnerOffers)}
              rows={3}
              maxLength={2000}
            />
            <FieldError message={errors.partnerOffers} />
          </div>
          <div data-pmodal-field="partnerExpectations">
            <Label htmlFor="pm-expectations" required>
              Ce que tu attends de TENF
            </Label>
            <textarea
              id="pm-expectations"
              value={form.partnerExpectations}
              onChange={onChange("partnerExpectations")}
              className={inputBaseClass}
              style={inputStyle(!!errors.partnerExpectations)}
              rows={3}
              maxLength={2000}
            />
            <FieldError message={errors.partnerExpectations} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="pm-duration">Durée souhaitée</Label>
              <select
                id="pm-duration"
                value={form.desiredDuration}
                onChange={onChange("desiredDuration")}
                className={inputBaseClass}
                style={inputStyle()}
              >
                <option value="">— Optionnel —</option>
                {DURATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="pm-date">Date ou période souhaitée (si événement)</Label>
              <input
                id="pm-date"
                type="text"
                value={form.desiredDate}
                onChange={onChange("desiredDate")}
                className={inputBaseClass}
                style={inputStyle()}
                maxLength={200}
                placeholder="Ex. 15-20 juin 2026"
              />
            </div>
            <div>
              <Label htmlFor="pm-audience">Public concerné</Label>
              <input
                id="pm-audience"
                type="text"
                value={form.targetAudience}
                onChange={onChange("targetAudience")}
                className={inputBaseClass}
                style={inputStyle()}
                maxLength={200}
                placeholder="Streamers FR, public caritatif, etc."
              />
            </div>
            <div>
              <Label htmlFor="pm-members">Nombre approximatif de participants</Label>
              <input
                id="pm-members"
                type="text"
                value={form.estimatedMembers}
                onChange={onChange("estimatedMembers")}
                className={inputBaseClass}
                style={inputStyle()}
                maxLength={200}
                placeholder="Ex. 200 membres / 20 streamers"
              />
            </div>
          </div>
        </FormSection>

        {/* Section 4 : Cadre et sécurité */}
        <FormSection
          number="Section 4 / 6"
          title="Cadre et sécurité"
          description="5 engagements obligatoires pour valider toute demande de partenariat TENF."
          icon={Shield}
          complete={status.framework}
        >
          <YesNoRow
            id="independenceAccepted"
            label="Acceptes-tu que chaque communauté garde son indépendance ?"
            value={form.independenceAccepted}
            onChange={(v) => onBoolChange("independenceAccepted", v)}
            error={errors.independenceAccepted}
          />
          <YesNoRow
            id="noRecruitmentAccepted"
            label="Acceptes-tu l'interdiction du recrutement sauvage de membres TENF ?"
            value={form.noRecruitmentAccepted}
            onChange={(v) => onBoolChange("noRecruitmentAccepted", v)}
            error={errors.noRecruitmentAccepted}
          />
          <YesNoRow
            id="confidentialityAccepted"
            label="Acceptes-tu la confidentialité des informations internes TENF ?"
            value={form.confidentialityAccepted}
            onChange={(v) => onBoolChange("confidentialityAccepted", v)}
            error={errors.confidentialityAccepted}
          />
          <YesNoRow
            id="observationAccepted"
            label="Acceptes-tu qu'une période d'observation puisse être demandée ?"
            value={form.observationAccepted}
            onChange={(v) => onBoolChange("observationAccepted", v)}
            error={errors.observationAccepted}
          />
          <YesNoRow
            id="interruptionAccepted"
            label="Acceptes-tu que TENF puisse refuser ou interrompre le partenariat si le cadre n'est pas respecté ?"
            value={form.interruptionAccepted}
            onChange={(v) => onBoolChange("interruptionAccepted", v)}
            error={errors.interruptionAccepted}
          />
        </FormSection>

        {/* Section 5 : Message complémentaire */}
        <FormSection
          number="Section 5 / 6"
          title="Informations complémentaires"
          description="Optionnel — précisions, contexte, contraintes."
          icon={MessageCircle}
        >
          <div>
            <Label htmlFor="pm-additional">Informations complémentaires</Label>
            <textarea
              id="pm-additional"
              value={form.additionalMessage}
              onChange={onChange("additionalMessage")}
              className={inputBaseClass}
              style={inputStyle()}
              rows={4}
              maxLength={3000}
              placeholder="Tout élément utile pour étudier la demande."
            />
          </div>
        </FormSection>

        {/* Section 6 : Consentement final */}
        <FormSection
          number="Section 6 / 6"
          title="Consentement final"
          icon={Globe2}
          complete={status.consent}
        >
          <div data-pmodal-field="representativeConfirmed">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.representativeConfirmed}
                onChange={(e) => onBoolChange("representativeConfirmed", e.target.checked)}
                className="mt-1 h-4 w-4 cursor-pointer"
              />
              <span className="text-sm" style={{ color: "var(--color-text)" }}>
                Je certifie que les informations envoyées sont exactes et que je suis autorisé
                à représenter ce projet.
              </span>
            </label>
            <FieldError message={errors.representativeConfirmed} />
          </div>
          <div data-pmodal-field="dataUsageAccepted">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.dataUsageAccepted}
                onChange={(e) => onBoolChange("dataUsageAccepted", e.target.checked)}
                className="mt-1 h-4 w-4 cursor-pointer"
              />
              <span className="text-sm" style={{ color: "var(--color-text)" }}>
                J'accepte que TENF utilise ces informations uniquement pour étudier cette
                demande de partenariat.
              </span>
            </label>
            <FieldError message={errors.dataUsageAccepted} />
          </div>
        </FormSection>

        {/* Sticky footer d'action */}
        <div
          className="sticky bottom-0 z-[1] -mx-4 mt-2 flex flex-col-reverse gap-3 border-t px-4 py-3 sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-bg) 88%, transparent)",
            backdropFilter: "blur(10px)",
            borderColor: "var(--color-border)",
          }}
        >
          <button
            type="button"
            onClick={onBack}
            className="home-btn-secondary inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02]"
          >
            <ArrowLeft size={14} aria-hidden /> Retour au règlement
          </button>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-muted)" }}>
                Progression
              </p>
              <p
                className="text-xs font-semibold"
                style={{
                  color: completedCount === totalRequired ? "#15803d" : "var(--color-primary)",
                }}
              >
                {completedCount}/{totalRequired} sections complètes
              </p>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="home-btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              {submitting ? (
                <>
                  <span
                    className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"
                    aria-hidden
                  />
                  Envoi en cours…
                </>
              ) : (
                <>
                  <Send size={14} aria-hidden /> Envoyer la demande
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ───────── Étape 3 ───────── */

function StepConfirmation({ onClose }: { onClose: () => void }) {
  return (
    <div className="mx-auto max-w-3xl py-6 text-center sm:py-10">
      {/* Animation du check SVG */}
      <div className="mx-auto mb-6 flex justify-center" aria-hidden>
        <svg className="pmodal-check-svg" viewBox="0 0 64 64" aria-hidden focusable="false">
          <circle className="pmodal-check-circle" cx="32" cy="32" r="28" />
          <path className="pmodal-check-tick" d="M20 33 L29 42 L46 24" />
        </svg>
      </div>

      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
        style={{
          backgroundColor: "color-mix(in srgb, #16a34a 16%, transparent)",
          color: "#15803d",
        }}
      >
        <CheckCircle2 size={12} aria-hidden /> Demande reçue
      </span>

      <h2
        className="mt-3 font-extrabold leading-tight tracking-tight"
        style={{ fontSize: "clamp(1.75rem, 1.2rem + 2vw, 3rem)" }}
      >
        Merci, on s&apos;en occupe.
      </h2>
      <p
        className="mx-auto mt-3 leading-relaxed"
        style={{
          color: "var(--color-muted)",
          fontSize: "clamp(0.95rem, 0.85rem + 0.3vw, 1.125rem)",
          maxWidth: "55ch",
        }}
      >
        L&apos;équipe TENF va étudier ta proposition et reviendra vers toi si le projet
        correspond aux valeurs et au cadre de la communauté.
      </p>

      {/* Récap "la suite" */}
      <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
        {[
          {
            num: "01",
            title: "Étude par les fondateurs",
            body: "Ta demande est lue par les fondateurs ou les admins coordinateurs mandatés.",
          },
          {
            num: "02",
            title: "Retour sous 48-96 h",
            body: "On répond honnêtement — oui, non, ou « pas maintenant », sans détour.",
          },
          {
            num: "03",
            title: "Si oui : mise en place",
            body: "Un référent TENF est nommé, on cadre l'événement et la communication.",
          },
        ].map((step) => (
          <div
            key={step.num}
            className="rounded-2xl border p-4 text-left transition-transform hover:scale-[1.02]"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "color-mix(in srgb, var(--color-card) 90%, transparent)",
            }}
          >
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-primary) 16%, transparent)",
                color: "var(--color-primary)",
              }}
            >
              {step.num}
            </span>
            <h3 className="mt-2 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              {step.title}
            </h3>
            <p className="mt-1 text-xs leading-snug" style={{ color: "var(--color-muted)" }}>
              {step.body}
            </p>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a
          href="/a-propos"
          className="home-btn-secondary inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02]"
        >
          Découvrir TENF
        </a>
        <a
          href="/charte"
          className="home-btn-secondary inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02]"
        >
          Lire la charte
        </a>
        <button
          type="button"
          onClick={onClose}
          className="home-btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
