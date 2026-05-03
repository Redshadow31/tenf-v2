"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MemberRole } from "@/lib/memberRoles";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ExternalLink,
  MessageCircle,
  Sparkles,
  User,
} from "lucide-react";

export interface AddChannelMemberPayload {
  nom: string;
  role: MemberRole;
  statut: "Actif" | "Inactif";
  discord: string;
  discordId?: string;
  twitch: string;
  avatar: string;
  description?: string;
  onboardingStatus?: "a_faire" | "en_cours" | "termine";
  mentorTwitchLogin?: string;
  parrain?: string;
  integrationDate?: string;
  primaryLanguage?: string;
  timezone?: string;
  countryCode?: string;
}

interface AddChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (member: AddChannelMemberPayload) => void;
}

const INITIAL_FORM = {
  nom: "",
  twitch: "",
  discord: "",
  discordId: "",
  role: "Affilié" as MemberRole,
  statut: "Actif" as "Actif" | "Inactif",
  description: "",
  onboardingStatus: "a_faire" as "a_faire" | "en_cours" | "termine",
  mentorTwitchLogin: "",
  parrain: "",
  integrationDate: "",
  primaryLanguage: "",
  timezone: "",
  countryCode: "",
};

const FORM_ID = "tenf-add-channel-form";

const shellClass =
  "relative max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-indigo-400/20 bg-[linear-gradient(165deg,rgba(99,102,241,0.14),rgba(14,15,23,0.94)_42%,rgba(11,13,20,0.98))] shadow-[0_28px_80px_rgba(2,6,23,0.65)] backdrop-blur-xl";
const panelClass =
  "rounded-2xl border border-white/10 bg-black/25 p-4 md:p-5 transition-colors focus-within:border-violet-400/35";
const inputClass =
  "w-full rounded-xl border border-white/12 bg-[#0c0e14]/90 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none ring-0 transition focus:border-violet-400/50 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.18)]";
const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-indigo-100/85";

const ROLE_SELECT_OPTIONS: MemberRole[] = [
  "Nouveau",
  "Affilié",
  "Développement",
  "Modérateur",
  "Modérateur en formation",
  "Modérateur en activité réduite",
  "Modérateur en pause",
  "Admin",
  "Admin Coordinateur",
  "Créateur Junior",
  "Les P'tits Jeunes",
  "Soutien TENF",
  "Contributeur TENF du Mois",
  "Communauté",
];

function normalizeTwitchLogin(rawValue: string): string {
  let value = rawValue.toLowerCase().trim();
  if (value.includes("twitch.tv/")) {
    const match = value.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
    if (match) {
      value = match[1];
    }
  }
  return value.replace(/[^a-zA-Z0-9_]/g, "");
}

function onboardingLabel(v: AddChannelMemberPayload["onboardingStatus"]): string {
  switch (v) {
    case "en_cours":
      return "En cours";
    case "termine":
      return "Terminé";
    default:
      return "À faire";
  }
}

export default function AddChannelModal({ isOpen, onClose, onAdd }: AddChannelModalProps) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (!isOpen) return;
    setFormData(INITIAL_FORM);
    setSubmitError(null);
    setStep(1);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const normalizedTwitch = useMemo(() => normalizeTwitchLogin(formData.twitch), [formData.twitch]);
  const normalizedMentor = useMemo(() => normalizeTwitchLogin(formData.mentorTwitchLogin), [formData.mentorTwitchLogin]);

  const step1Ok = Boolean(formData.nom.trim()) && Boolean(normalizedTwitch);
  const canSubmit = step1Ok;

  const goNext = useCallback(() => {
    setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
  }, []);
  const goPrev = useCallback(() => {
    setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!formData.nom.trim() || !normalizedTwitch) {
      setSubmitError("Le nom du créateur et le pseudo Twitch sont obligatoires.");
      setStep(1);
      return;
    }

    const finalStatus = formData.role === "Communauté" ? "Inactif" : formData.statut;

    const payload: AddChannelMemberPayload = {
      nom: formData.nom.trim(),
      twitch: normalizedTwitch,
      discord: formData.discord.trim(),
      discordId: formData.discordId.trim() || undefined,
      role: formData.role,
      statut: finalStatus,
      avatar: `https://placehold.co/96x96/1e1b4b/a5b4fc/png?text=${encodeURIComponent(formData.nom.trim().charAt(0).toUpperCase())}`,
    };

    if (formData.description.trim()) payload.description = formData.description.trim();
    payload.onboardingStatus = formData.onboardingStatus;
    if (normalizedMentor) payload.mentorTwitchLogin = normalizedMentor;
    if (formData.parrain.trim()) payload.parrain = formData.parrain.trim();
    if (formData.integrationDate) payload.integrationDate = formData.integrationDate;
    if (formData.primaryLanguage.trim()) payload.primaryLanguage = formData.primaryLanguage.trim();
    if (formData.timezone.trim()) payload.timezone = formData.timezone.trim();
    if (formData.countryCode.trim()) payload.countryCode = formData.countryCode.trim().toUpperCase().slice(0, 2);

    onAdd(payload);
  };

  if (!isOpen) return null;

  const twitchUrl = normalizedTwitch ? `https://www.twitch.tv/${normalizedTwitch}` : "";

  const steps = [
    { n: 1 as const, title: "Créateur", desc: "Nom & chaîne Twitch" },
    { n: 2 as const, title: "Discord", desc: "Lien communauté" },
    { n: 3 as const, title: "Parcours TENF", desc: "Rôle & optionnel" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-md md:p-6"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="add-channel-title"
    >
      <div className={shellClass} onClick={(e) => e.stopPropagation()}>
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-violet-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-amber-500/12 blur-3xl" />

        <div className="relative flex max-h-[92vh] flex-col border-b border-white/10 bg-black/20 px-5 py-4 md:px-8 md:py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-400/35 bg-violet-500/15 text-violet-200">
                <Sparkles className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200/90">TENF · Gestion membres</p>
                <h2 id="add-channel-title" className="mt-1 text-xl font-bold text-white md:text-2xl">
                  Accueillir un créateur
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-400">
                  Les infos essentielles suffisent pour créer la fiche ; tu peux compléter le parcours (mentor, parrain,
                  intégration) tout de suite ou plus tard dans l&apos;édition.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:border-white/25 hover:text-white"
              aria-label="Fermer"
              type="button"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 md:gap-3" aria-label="Étapes">
            {steps.map((s) => {
              const active = step === s.n;
              const done = step > s.n || (s.n === 1 && step1Ok && step > 1);
              return (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => {
                    if (s.n === 1) setStep(1);
                    if (s.n === 2 && step1Ok) setStep(2);
                    if (s.n === 3 && step1Ok) setStep(3);
                  }}
                  className={`flex min-w-[140px] flex-1 flex-col rounded-2xl border px-3 py-2.5 text-left transition md:min-w-[160px] ${
                    active
                      ? "border-violet-400/55 bg-violet-600/20 shadow-inner shadow-violet-900/30"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20"
                  }`}
                >
                  <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                    {done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
                    ) : (
                      <Circle className={`h-3.5 w-3.5 ${active ? "text-violet-300" : "text-slate-600"}`} aria-hidden />
                    )}
                    Étape {s.n}
                  </span>
                  <span className="mt-1 text-sm font-semibold text-white">{s.title}</span>
                  <span className="text-[11px] text-slate-500">{s.desc}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="relative grid flex-1 grid-cols-1 gap-0 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-0">
          <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-5 p-5 md:p-8 lg:max-h-[min(70vh,calc(92vh-200px))] lg:overflow-y-auto">
            {step === 1 && (
              <div className={panelClass}>
                <div className="mb-4 flex items-center gap-2 text-indigo-100">
                  <User className="h-4 w-4 text-violet-300" aria-hidden />
                  <h3 className="text-sm font-semibold tracking-wide">Identité & chaîne Twitch</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Nom affiché du créateur *</label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className={inputClass}
                      placeholder="Ex. Clara"
                      autoComplete="off"
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Pseudo Twitch ou lien chaîne *</label>
                    <input
                      type="text"
                      value={formData.twitch}
                      onChange={(e) => setFormData({ ...formData, twitch: e.target.value })}
                      className={inputClass}
                      placeholder="clarastonewall ou https://www.twitch.tv/…"
                      autoComplete="off"
                      required
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200/95">
                        Login détecté :{" "}
                        <strong className="font-semibold text-white">{normalizedTwitch || "—"}</strong>
                      </span>
                      {normalizedTwitch ? (
                        <a
                          href={twitchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-violet-400/30 px-2.5 py-1 text-[11px] font-semibold text-violet-200 transition hover:border-violet-300/60 hover:bg-violet-500/10"
                        >
                          Ouvrir la chaîne
                          <ExternalLink className="h-3 w-3" aria-hidden />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className={panelClass}>
                <div className="mb-4 flex items-center gap-2 text-indigo-100">
                  <MessageCircle className="h-4 w-4 text-sky-300" aria-hidden />
                  <h3 className="text-sm font-semibold tracking-wide">Discord</h3>
                </div>
                <p className="mb-4 text-xs leading-relaxed text-slate-400">
                  Ces champs aident à reconnaître le membre sur le serveur TENF et à synchroniser les données automatiquement.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Pseudo Discord</label>
                    <input
                      type="text"
                      value={formData.discord}
                      onChange={(e) => setFormData({ ...formData, discord: e.target.value })}
                      className={inputClass}
                      placeholder="Ex. ClaraStonewall ou @pseudo"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>ID Discord (optionnel, recommandé)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.discordId}
                      onChange={(e) => setFormData({ ...formData, discordId: e.target.value.replace(/\D/g, "") })}
                      className={inputClass}
                      placeholder="Chiffres uniquement"
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <>
                <div className={panelClass}>
                  <h3 className={`${labelClass.replace("mb-1.5", "mb-3")} normal-case tracking-normal text-sm text-white`}>
                    Rôle & statut sur TENF
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>Rôle</label>
                      <select
                        value={formData.role}
                        onChange={(e) => {
                          const nextRole = e.target.value as MemberRole;
                          setFormData((prev) => ({
                            ...prev,
                            role: nextRole,
                            statut: nextRole === "Communauté" ? "Inactif" : prev.statut,
                          }));
                        }}
                        className={inputClass}
                      >
                        {ROLE_SELECT_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {r === "Communauté" ? "Communauté (évaluation)" : r}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Statut</label>
                      <select
                        value={formData.statut}
                        onChange={(e) =>
                          setFormData({ ...formData, statut: e.target.value as "Actif" | "Inactif" })
                        }
                        disabled={formData.role === "Communauté"}
                        className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        <option value="Actif">Actif</option>
                        <option value="Inactif">Inactif</option>
                      </select>
                      {formData.role === "Communauté" ? (
                        <p className="mt-2 text-xs text-amber-200/90">Le rôle Communauté impose le statut inactif sur les listes publiques.</p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className={panelClass}>
                  <h3 className="mb-1 text-sm font-semibold text-white">Parcours & profil (optionnel)</h3>
                  <p className="mb-4 text-xs text-slate-400">
                    Aligné sur les champs de la fiche membre : tu peux les laisser vides et les compléter après création.
                  </p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Bio courte / description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className={`${inputClass} min-h-[88px] resize-y`}
                        placeholder="Quelques mots sur le créateur, son univers ou ses objectifs sur TENF…"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Onboarding</label>
                      <select
                        value={formData.onboardingStatus}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            onboardingStatus: e.target.value as typeof formData.onboardingStatus,
                          })
                        }
                        className={inputClass}
                      >
                        <option value="a_faire">À faire</option>
                        <option value="en_cours">En cours</option>
                        <option value="termine">Terminé</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Date d&apos;intégration</label>
                      <input
                        type="date"
                        value={formData.integrationDate}
                        onChange={(e) => setFormData({ ...formData, integrationDate: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Mentor (login Twitch)</label>
                      <input
                        type="text"
                        value={formData.mentorTwitchLogin}
                        onChange={(e) => setFormData({ ...formData, mentorTwitchLogin: e.target.value })}
                        className={inputClass}
                        placeholder="login mentor"
                        autoComplete="off"
                      />
                      {normalizedMentor ? (
                        <p className="mt-1 text-[11px] text-slate-500">Normalisé : {normalizedMentor}</p>
                      ) : null}
                    </div>
                    <div>
                      <label className={labelClass}>Parrain (nom ou pseudo)</label>
                      <input
                        type="text"
                        value={formData.parrain}
                        onChange={(e) => setFormData({ ...formData, parrain: e.target.value })}
                        className={inputClass}
                        placeholder="Qui a présenté le créateur ?"
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Langue principale</label>
                      <input
                        type="text"
                        value={formData.primaryLanguage}
                        onChange={(e) => setFormData({ ...formData, primaryLanguage: e.target.value })}
                        className={inputClass}
                        placeholder="Ex. Français"
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Fuseau horaire</label>
                      <input
                        type="text"
                        value={formData.timezone}
                        onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                        className={inputClass}
                        placeholder="Ex. Europe/Paris"
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Pays (code ISO, 2 lettres)</label>
                      <input
                        type="text"
                        maxLength={2}
                        value={formData.countryCode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            countryCode: e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2),
                          })
                        }
                        className={inputClass}
                        placeholder="FR"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {submitError ? (
              <div className="rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-100">{submitError}</div>
            ) : null}
          </form>

          <aside className="hidden border-t border-white/10 bg-black/30 p-5 lg:block lg:border-l lg:border-t-0 lg:max-h-[min(70vh,calc(92vh-200px))] lg:overflow-y-auto">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300/90">Aperçu live</p>
            <div className="mt-4 flex flex-col items-center text-center">
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-violet-400/40 bg-gradient-to-br from-violet-600/40 to-indigo-900/50 text-3xl font-bold text-white shadow-lg shadow-violet-900/40"
                aria-hidden
              >
                {formData.nom.trim().charAt(0) ? formData.nom.trim().charAt(0).toUpperCase() : "?"}
              </div>
              <p className="mt-3 text-lg font-semibold text-white">{formData.nom.trim() || "Nom du créateur"}</p>
              {normalizedTwitch ? (
                <a
                  href={twitchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-violet-300 hover:text-violet-200"
                >
                  @{normalizedTwitch}
                  <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                </a>
              ) : (
                <p className="mt-1 text-sm text-slate-500">Pseudo Twitch…</p>
              )}
              <div className="mt-4 w-full space-y-2 text-left text-xs">
                <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                  <span className="text-slate-500">Rôle</span>
                  <p className="font-medium text-indigo-100">{formData.role}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                  <span className="text-slate-500">Statut</span>
                  <p className="font-medium text-indigo-100">{formData.role === "Communauté" ? "Inactif" : formData.statut}</p>
                </div>
                {formData.discord.trim() ? (
                  <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-2">
                    <span className="text-sky-300/80">Discord</span>
                    <p className="font-medium text-sky-100">{formData.discord.trim()}</p>
                  </div>
                ) : null}
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                  <span className="text-amber-200/70">Onboarding</span>
                  <p className="font-medium text-amber-50">{onboardingLabel(formData.onboardingStatus)}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="flex items-center gap-3 border-t border-white/10 bg-black/40 px-5 py-3 lg:hidden">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-violet-400/35 bg-violet-600/20 text-sm font-bold text-white">
            {formData.nom.trim().charAt(0) ? formData.nom.trim().charAt(0).toUpperCase() : "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{formData.nom.trim() || "Créateur"}</p>
            <p className="truncate text-xs text-violet-300/90">{normalizedTwitch ? `@${normalizedTwitch}` : "Pseudo Twitch requis"}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-black/35 px-5 py-4 md:px-8">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-white/25 hover:bg-white/5"
          >
            Annuler
          </button>
          <div className="flex flex-1 flex-wrap justify-end gap-2 sm:flex-none">
            {step > 1 ? (
              <button
                type="button"
                onClick={goPrev}
                className="inline-flex items-center gap-1 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Retour
              </button>
            ) : null}
            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !step1Ok) {
                    setSubmitError("Renseigne le nom et un pseudo Twitch valide avant de continuer.");
                    return;
                  }
                  setSubmitError(null);
                  goNext();
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-violet-400/40 bg-violet-600/25 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/50 transition hover:bg-violet-600/35"
              >
                Continuer
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            ) : (
              <button
                type="submit"
                form={FORM_ID}
                disabled={!canSubmit}
                className="rounded-xl border border-amber-400/35 bg-gradient-to-r from-violet-600/90 to-indigo-600/90 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Créer la fiche membre
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
