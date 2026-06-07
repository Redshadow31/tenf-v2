"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  ChevronRight,
  Globe2,
  Instagram,
  Loader2,
  Music2,
} from "lucide-react";
import RgpdConsentCheckbox from "@/components/legal/RgpdConsentCheckbox";
import { DashboardInnerCard } from "@/components/member/dashboard/dashboardUi";
import { CompleterPanel, FIELD_CLASS, FIELD_HINT, FIELD_LABEL } from "@/components/member/profil/completer/profileCompleterUi";
import { FileText, UserCircle2 } from "lucide-react";

const TIMEZONE_OPTIONS = [
  { value: "Europe/Paris", label: "France (Europe/Paris)" },
  { value: "Europe/Brussels", label: "Belgique (Europe/Brussels)" },
  { value: "Europe/Zurich", label: "Suisse (Europe/Zurich)" },
  { value: "Europe/Luxembourg", label: "Luxembourg (Europe/Luxembourg)" },
  { value: "America/Montreal", label: "Quebec (America/Montreal)" },
];

export type ProfileCompleterFormProps = {
  accent: string;
  activeTab: "identite" | "public";
  setActiveTab: (tab: "identite" | "public") => void;
  form: {
    discordUsername: string;
    creatorName: string;
    twitchChannelUrl: string;
    parrain: string;
    timezone: string;
    countryCode: string;
    primaryLanguage: string;
    birthday: string;
    twitchAffiliateDate: string;
    notes: string;
  };
  setForm: React.Dispatch<React.SetStateAction<ProfileCompleterFormProps["form"] & { discordId: string }>>;
  publicProfileForm: {
    description: string;
    instagram: string;
    tiktok: string;
    twitter: string;
    games: string;
  };
  setPublicProfileForm: React.Dispatch<
    React.SetStateAction<ProfileCompleterFormProps["publicProfileForm"] & { birthday: string; twitchAffiliateDate: string; timezone: string }>
  >;
  identityDoneCount: number;
  identityChecksLength: number;
  requiredIdentityReady: boolean;
  hasPublicDescription: boolean;
  descriptionWithGames: string;
  maxDescription: number;
  canSubmit: boolean;
  privacyConsent: boolean;
  setPrivacyConsent: (v: boolean) => void;
  consentError: string | null;
  setConsentError: (v: string | null) => void;
  creatingProfile: boolean;
  createProfileSuccess: boolean;
  profileAlreadyCreated: boolean;
  onSubmit: (e: React.FormEvent) => void;
  goToNextTab: () => void;
  goToPrevTab: () => void;
};

export default function ProfileCompleterForm(props: ProfileCompleterFormProps) {
  const {
    accent,
    activeTab,
    setActiveTab,
    form,
    setForm,
    publicProfileForm,
    setPublicProfileForm,
    identityDoneCount,
    identityChecksLength,
    requiredIdentityReady,
    hasPublicDescription,
    descriptionWithGames,
    maxDescription,
    canSubmit,
    privacyConsent,
    setPrivacyConsent,
    consentError,
    setConsentError,
    creatingProfile,
    createProfileSuccess,
    profileAlreadyCreated,
    onSubmit,
    goToNextTab,
    goToPrevTab,
  } = props;

  return (
    <CompleterPanel
      id="completer-form"
      kicker="Formulaire"
      title={activeTab === "identite" ? "Identité TENF" : "Fiche publique"}
      description={
        activeTab === "identite"
          ? "Infos nécessaires pour te reconnaître et t'attribuer les bons accès — champs * obligatoires."
          : "Ce que les visiteurs et le hub TENF peuvent mettre en avant. Tout est optionnel ici."
      }
      icon={activeTab === "identite" ? UserCircle2 : FileText}
      tone="accent"
      accentHex={accent}
    >
      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col gap-5">
        {activeTab === "identite" ? (
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="sm:col-span-2 xl:col-span-2">
              <label htmlFor="field-discordUsername" className={FIELD_LABEL}>
                Pseudo Discord *
              </label>
              <input
                id="field-discordUsername"
                required
                value={form.discordUsername}
                onChange={(e) => setForm((prev) => ({ ...prev, discordUsername: e.target.value }))}
                className={FIELD_CLASS}
              />
              <p className={FIELD_HINT}>Tel qu&apos;on te retrouve sur le serveur — corrige si Discord a mal synchronisé.</p>
            </div>
            <div className="sm:col-span-2 xl:col-span-2">
              <label htmlFor="field-creatorName" className={FIELD_LABEL}>
                Nom affiché / créateur *
              </label>
              <input
                id="field-creatorName"
                required
                value={form.creatorName}
                onChange={(e) => setForm((prev) => ({ ...prev, creatorName: e.target.value }))}
                className={FIELD_CLASS}
              />
            </div>
            <div className="sm:col-span-2 xl:col-span-3">
              <label htmlFor="field-twitchChannelUrl" className={FIELD_LABEL}>
                Pseudo Twitch ou URL complète *
              </label>
              <input
                id="field-twitchChannelUrl"
                required
                value={form.twitchChannelUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, twitchChannelUrl: e.target.value }))}
                placeholder="https://www.twitch.tv/pseudo"
                className={FIELD_CLASS}
              />
            </div>
            <div>
              <label htmlFor="field-timezone" className={FIELD_LABEL}>
                Fuseau horaire *
              </label>
              <select
                id="field-timezone"
                required
                value={form.timezone}
                onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
                className={`${FIELD_CLASS} cursor-pointer`}
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="field-countryCode" className={FIELD_LABEL}>
                Pays *
              </label>
              <select
                id="field-countryCode"
                required
                value={form.countryCode}
                onChange={(e) => setForm((prev) => ({ ...prev, countryCode: e.target.value }))}
                className={`${FIELD_CLASS} cursor-pointer`}
              >
                <option value="FR">France (FR)</option>
                <option value="BE">Belgique (BE)</option>
                <option value="CH">Suisse (CH)</option>
                <option value="CA">Canada (CA)</option>
                <option value="LU">Luxembourg (LU)</option>
              </select>
            </div>
            <div className="sm:col-span-2 xl:col-span-2">
              <label htmlFor="field-primaryLanguage" className={FIELD_LABEL}>
                Langue principale sur stream *
              </label>
              <select
                id="field-primaryLanguage"
                required
                value={form.primaryLanguage}
                onChange={(e) => setForm((prev) => ({ ...prev, primaryLanguage: e.target.value }))}
                className={`${FIELD_CLASS} cursor-pointer`}
              >
                <option value="fr">Français</option>
                <option value="en">Anglais</option>
                <option value="es">Espagnol</option>
                <option value="de">Allemand</option>
              </select>
            </div>
            <div className="sm:col-span-2 xl:col-span-3">
              <label htmlFor="field-parrain" className={FIELD_LABEL}>
                Parrain TENF *
              </label>
              <input
                id="field-parrain"
                required
                value={form.parrain}
                onChange={(e) => setForm((prev) => ({ ...prev, parrain: e.target.value }))}
                placeholder="Chaîne Twitch, ami·e, média…"
                className={FIELD_CLASS}
              />
              <p className={FIELD_HINT}>La personne ou le média grâce auquel tu as découvert TENF.</p>
            </div>
            <div>
              <label htmlFor="field-birthday" className={FIELD_LABEL}>
                Date d&apos;anniversaire
              </label>
              <input
                id="field-birthday"
                type="date"
                value={form.birthday}
                onChange={(e) => setForm((prev) => ({ ...prev, birthday: e.target.value }))}
                className={FIELD_CLASS}
              />
            </div>
            <div>
              <label htmlFor="field-twitchAffiliateDate" className={FIELD_LABEL}>
                Date d&apos;affiliation Twitch
              </label>
              <input
                id="field-twitchAffiliateDate"
                type="date"
                value={form.twitchAffiliateDate}
                onChange={(e) => setForm((prev) => ({ ...prev, twitchAffiliateDate: e.target.value }))}
                className={FIELD_CLASS}
              />
            </div>
            <div className="sm:col-span-2 xl:col-span-3">
              <label htmlFor="field-notes" className={FIELD_LABEL}>
                Notes (interne / staff)
              </label>
              <textarea
                id="field-notes"
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className={FIELD_CLASS}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="field-public-description" className={FIELD_LABEL}>
                Descriptif chaîne (Markdown Discord) — {descriptionWithGames.length}/{maxDescription}
              </label>
              <textarea
                id="field-public-description"
                value={publicProfileForm.description}
                onChange={(e) => setPublicProfileForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={8}
                maxLength={maxDescription}
                className={`${FIELD_CLASS} min-h-[180px] resize-y`}
              />
              <p className={FIELD_HINT}>**Gras**, *italique*, __souligné__ — même rendu que sur Discord.</p>
            </div>
            <div>
              <label htmlFor="field-public-games" className={FIELD_LABEL}>
                Jeux proposés sur la chaîne
              </label>
              <input
                id="field-public-games"
                value={publicProfileForm.games}
                onChange={(e) => setPublicProfileForm((prev) => ({ ...prev, games: e.target.value }))}
                placeholder="Ex. GTA RP, Valorant, Minecraft"
                className={FIELD_CLASS}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="field-public-instagram" className={`${FIELD_LABEL} inline-flex items-center gap-2`}>
                  <Instagram className="h-3.5 w-3.5 text-pink-400" aria-hidden />
                  Instagram
                </label>
                <input
                  id="field-public-instagram"
                  value={publicProfileForm.instagram}
                  onChange={(e) => setPublicProfileForm((prev) => ({ ...prev, instagram: e.target.value }))}
                  placeholder="@pseudo"
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <label htmlFor="field-public-tiktok" className={`${FIELD_LABEL} inline-flex items-center gap-2`}>
                  <Music2 className="h-3.5 w-3.5 text-cyan-400" aria-hidden />
                  TikTok
                </label>
                <input
                  id="field-public-tiktok"
                  value={publicProfileForm.tiktok}
                  onChange={(e) => setPublicProfileForm((prev) => ({ ...prev, tiktok: e.target.value }))}
                  placeholder="@pseudo"
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <label htmlFor="field-public-twitter" className={`${FIELD_LABEL} inline-flex items-center gap-2`}>
                  <AtSign className="h-3.5 w-3.5 text-sky-400" aria-hidden />
                  X / Twitter
                </label>
                <input
                  id="field-public-twitter"
                  value={publicProfileForm.twitter}
                  onChange={(e) => setPublicProfileForm((prev) => ({ ...prev, twitter: e.target.value }))}
                  placeholder="@pseudo"
                  className={FIELD_CLASS}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t border-white/[0.08] pt-3">
          {activeTab === "identite" ? (
            <button
              type="button"
              onClick={() => {
                setActiveTab("public");
                goToNextTab();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/20"
            >
              Fiche publique <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setActiveTab("identite");
                goToPrevTab();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/12 px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/[0.05]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Retour identité
            </button>
          )}
        </div>

        <DashboardInnerCard className="mt-auto !p-3.5">
          <p className="text-sm text-white/65">
            <span className="font-semibold text-white">Avant envoi :</span>{" "}
            {requiredIdentityReady ? (
              <span className="text-emerald-300">identité complète ({identityDoneCount}/{identityChecksLength})</span>
            ) : (
              <span className="text-amber-300">identité incomplète</span>
            )}
            {" · "}
            {hasPublicDescription ? (
              <span className="text-fuchsia-300">fiche publique enrichie</span>
            ) : (
              <span>fiche publique minimale (OK)</span>
            )}
          </p>
          {!canSubmit ? (
            <p className="mt-1 text-xs text-white/45">Remplis tous les champs * pour activer l&apos;envoi.</p>
          ) : null}
          {createProfileSuccess ? (
            <p className="mt-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              {profileAlreadyCreated
                ? "Mise à jour enregistrée — le staff traite si une validation est nécessaire."
                : "Création terminée — bienvenue dans la New Family."}
            </p>
          ) : null}
        </DashboardInnerCard>

        <RgpdConsentCheckbox
          id="member-profile-complete-privacy-consent"
          checked={privacyConsent}
          onChange={(checked) => {
            setPrivacyConsent(checked);
            if (checked) setConsentError(null);
          }}
          error={consentError}
        />

        <div className="flex flex-col gap-3 rounded-xl border border-violet-500/25 bg-violet-950/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-sm text-white/60">
            <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden />
            <span>Un envoi transmet identité + fiche publique au staff pour traitement.</span>
          </div>
          <button
            type="submit"
            disabled={creatingProfile || !canSubmit || !privacyConsent}
            className="inline-flex min-h-[46px] shrink-0 items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-[#1f1a12] transition hover:brightness-110 disabled:pointer-events-none disabled:opacity-45"
            style={{ background: "linear-gradient(90deg, #7c3aed, #d946ef)" }}
          >
            {creatingProfile ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Envoi en cours…
              </>
            ) : (
              <>
                Envoyer mon profil
                <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            )}
          </button>
        </div>
      </form>
    </CompleterPanel>
  );
}
