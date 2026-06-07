"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronRight, Loader2, Sparkles, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import MemberBentoShell, { MemberBentoCell, MemberBentoRow } from "@/components/member/layout/MemberBentoShell";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";
import RgpdConsentCheckbox from "@/components/legal/RgpdConsentCheckbox";
import { PRIVACY_CONSENT_ERROR_FORM } from "@/lib/legal/privacyConsent";
import { buildProfileCompleterModel } from "@/components/member/profil/completer/profileCompleterModel";
import { FIELD_CLASS, FIELD_HINT, FIELD_LABEL } from "@/components/member/profil/completer/profileCompleterUi";
import ProfileCompleterHero from "@/components/member/profil/completer/ProfileCompleterHero";
import ProfileCompleterSidebar from "@/components/member/profil/completer/ProfileCompleterSidebar";
import ProfileCompleterTwitchSection from "@/components/member/profil/completer/ProfileCompleterTwitchSection";
import ProfileCompleterForm from "@/components/member/profil/completer/ProfileCompleterForm";

const MAX_DESCRIPTION = 800;
const TIMEZONE_OPTIONS = [
  { value: "Europe/Paris", label: "France (Europe/Paris)" },
  { value: "Europe/Brussels", label: "Belgique (Europe/Brussels)" },
  { value: "Europe/Zurich", label: "Suisse (Europe/Zurich)" },
  { value: "Europe/Luxembourg", label: "Luxembourg (Europe/Luxembourg)" },
  { value: "America/Montreal", label: "Quebec (America/Montreal)" },
];

type MemberResponse = {
  member: {
    discordId?: string | null;
    displayName: string;
    twitchLogin: string;
    role: string;
    bio?: string;
    socials: {
      discord: string;
      instagram?: string;
      tiktok?: string;
      twitter?: string;
    };
    tenfSummary: { parrain: string | null };
    birthday?: string | null;
    twitchAffiliateDate?: string | null;
    timezone?: string | null;
    countryCode?: string | null;
    primaryLanguage?: string | null;
    onboardingStatus?: "a_faire" | "en_cours" | "termine" | string;
  };
  pending?: {
    description?: string;
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    birthday?: string;
    twitchAffiliateDate?: string;
  } | null;
};

type ProfileTab = "identite" | "public";
const TAB_ORDER: ProfileTab[] = ["identite", "public"];

export default function MemberProfileCompletePage() {
  const searchParams = useSearchParams();
  const { status } = useSession();
  const loginTriggeredRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileAlreadyCreated, setProfileAlreadyCreated] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showWelcomeSuccessMessage, setShowWelcomeSuccessMessage] = useState(false);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [createProfileSuccess, setCreateProfileSuccess] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("identite");
  const [publicProfileForm, setPublicProfileForm] = useState({
    description: "",
    instagram: "",
    tiktok: "",
    twitter: "",
    birthday: "",
    twitchAffiliateDate: "",
    timezone: "Europe/Paris",
    games: "",
  });
  const [form, setForm] = useState({
    discordId: "",
    discordUsername: "",
    creatorName: "",
    twitchChannelUrl: "",
    parrain: "",
    notes: "",
    birthday: "",
    twitchAffiliateDate: "",
    timezone: "Europe/Paris",
    countryCode: "FR",
    primaryLanguage: "fr",
  });

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      if (!loginTriggeredRef.current) {
        loginTriggeredRef.current = true;
        signIn("discord", { callbackUrl: "/member/profil/completer?onboarding=1" });
      }
      setLoading(true);
      return;
    }

    let active = true;
    (async () => {
      try {
        setError(null);
        const res = await fetch("/api/members/me", { cache: "no-store" });
        const body = await res.json();
        if (!active) return;
        if (!res.ok) {
          setError(body.error || "Impossible de charger ton profil.");
          return;
        }
        const data = body as MemberResponse;
        const isPlaceholder =
          data.member.twitchLogin.startsWith("nouveau_") || data.member.twitchLogin.startsWith("nouveau-");
        setProfileAlreadyCreated(!isPlaceholder);
        const onboardingStatus = String(data.member.onboardingStatus || "").toLowerCase();
        setShowWelcomeModal(
          isPlaceholder || onboardingStatus === "a_faire" || searchParams?.get("onboarding") === "1",
        );
        setForm((prev) => ({
          ...prev,
          discordId: data.member.discordId || prev.discordId,
          discordUsername: data.member.socials.discord || prev.discordUsername,
          creatorName: data.member.displayName || prev.creatorName,
          twitchChannelUrl:
            isPlaceholder ? prev.twitchChannelUrl : `https://www.twitch.tv/${data.member.twitchLogin || ""}`,
          parrain: data.member.tenfSummary?.parrain || prev.parrain,
          birthday: data.member.birthday ? String(data.member.birthday).slice(0, 10) : prev.birthday,
          twitchAffiliateDate: data.member.twitchAffiliateDate
            ? String(data.member.twitchAffiliateDate).slice(0, 10)
            : prev.twitchAffiliateDate,
          timezone: data.member.timezone || prev.timezone || "Europe/Paris",
          countryCode: data.member.countryCode || prev.countryCode || "FR",
          primaryLanguage: data.member.primaryLanguage || prev.primaryLanguage || "fr",
        }));
        setPublicProfileForm((prev) => ({
          ...prev,
          description: data.pending?.description ?? data.member.bio ?? "",
          instagram: data.pending?.instagram ?? data.member.socials.instagram ?? "",
          tiktok: data.pending?.tiktok ?? data.member.socials.tiktok ?? "",
          twitter: data.pending?.twitter ?? data.member.socials.twitter ?? "",
          birthday:
            data.pending?.birthday || (data.member.birthday ? String(data.member.birthday).slice(0, 10) : ""),
          twitchAffiliateDate:
            data.pending?.twitchAffiliateDate ||
            (data.member.twitchAffiliateDate ? String(data.member.twitchAffiliateDate).slice(0, 10) : ""),
          timezone: data.member.timezone || prev.timezone || "Europe/Paris",
        }));
      } catch {
        if (active) setError("Erreur de connexion.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [searchParams, status]);

  const descriptionWithGames = useMemo(
    () =>
      [
        (publicProfileForm.description || "").trim(),
        publicProfileForm.games.trim() ? `Jeux proposés sur la chaîne : ${publicProfileForm.games.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    [publicProfileForm.description, publicProfileForm.games],
  );

  const requiredIdentityReady =
    form.discordUsername.trim().length > 0 &&
    form.creatorName.trim().length > 0 &&
    form.twitchChannelUrl.trim().length > 0 &&
    form.parrain.trim().length > 0 &&
    form.timezone.trim().length > 0 &&
    form.countryCode.trim().length > 0 &&
    form.primaryLanguage.trim().length > 0;
  const hasPublicDescription = publicProfileForm.description.trim().length > 0;
  const canSubmit = requiredIdentityReady;
  const completionPercent = (requiredIdentityReady ? 70 : 0) + (hasPublicDescription ? 30 : 0);
  const activeTabIndex = TAB_ORDER.indexOf(activeTab);

  const identityChecks = useMemo(
    () =>
      [
        { label: "Pseudo Discord", done: form.discordUsername.trim().length > 0, fieldId: "field-discordUsername" },
        { label: "Nom créateur", done: form.creatorName.trim().length > 0, fieldId: "field-creatorName" },
        { label: "Lien Twitch", done: form.twitchChannelUrl.trim().length > 0, fieldId: "field-twitchChannelUrl" },
        { label: "Parrain TENF", done: form.parrain.trim().length > 0, fieldId: "field-parrain" },
        { label: "Fuseau horaire", done: form.timezone.trim().length > 0, fieldId: "field-timezone" },
        { label: "Pays", done: form.countryCode.trim().length > 0, fieldId: "field-countryCode" },
        { label: "Langue", done: form.primaryLanguage.trim().length > 0, fieldId: "field-primaryLanguage" },
      ] as const,
    [form],
  );
  const identityDoneCount = identityChecks.filter((item) => item.done).length;

  const viewModel = useMemo(
    () =>
      buildProfileCompleterModel({
        completionPercent,
        identityDoneCount,
        identityTotal: identityChecks.length,
        hasPublicDescription,
        requiredIdentityReady,
        isNewMember: showWelcomeModal || !profileAlreadyCreated,
        creatorName: form.creatorName,
      }),
    [
      completionPercent,
      identityDoneCount,
      identityChecks.length,
      hasPublicDescription,
      requiredIdentityReady,
      showWelcomeModal,
      profileAlreadyCreated,
      form.creatorName,
    ],
  );

  const scrollToField = useCallback((fieldId: string) => {
    setActiveTab("identite");
    window.requestAnimationFrame(() => {
      document.getElementById(fieldId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, []);

  function goToNextTab() {
    const next = TAB_ORDER[activeTabIndex + 1];
    if (next) setActiveTab(next);
  }

  function goToPrevTab() {
    const prev = TAB_ORDER[activeTabIndex - 1];
    if (prev) setActiveTab(prev);
  }

  async function submitProfileSetup() {
    if (!privacyConsent) {
      setConsentError(PRIVACY_CONSENT_ERROR_FORM);
      return false;
    }
    setConsentError(null);
    setCreatingProfile(true);
    setCreateProfileSuccess(false);
    try {
      if (descriptionWithGames.length > MAX_DESCRIPTION) {
        alert(`La description finale dépasse ${MAX_DESCRIPTION} caractères.`);
        return false;
      }

      const res = await fetch("/api/members/me/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, privacyConsent: true }),
      });
      const body = await res.json();
      if (!res.ok) {
        alert(body.error || "Erreur lors de la création du profil");
        return false;
      }

      const profileRes = await fetch("/api/members/me/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: descriptionWithGames,
          instagram: publicProfileForm.instagram,
          tiktok: publicProfileForm.tiktok,
          twitter: publicProfileForm.twitter,
          birthday: form.birthday,
          twitchAffiliateDate: form.twitchAffiliateDate,
          timezone: form.timezone,
          privacyConsent: true,
        }),
      });
      const profileBody = await profileRes.json();
      if (!profileRes.ok) {
        alert(profileBody.error || "Erreur lors de la soumission du profil public");
        return false;
      }

      setCreateProfileSuccess(true);
      return true;
    } catch {
      alert("Erreur de connexion");
      return false;
    } finally {
      setCreatingProfile(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submitProfileSetup();
  }

  if (loading) return <ProfileCompleterSkeleton />;
  if (error) {
    return (
      <MemberBentoShell>
        <EmptyFeatureCard title="Compléter mon profil" description={error} />
      </MemberBentoShell>
    );
  }

  return (
    <MemberBentoShell accentHex={viewModel.accent}>
        {showWelcomeModal ? (
          <WelcomeModal
            form={form}
            setForm={setForm}
            publicProfileForm={publicProfileForm}
            setPublicProfileForm={setPublicProfileForm}
            canSubmit={canSubmit}
            creatingProfile={creatingProfile}
            privacyConsent={privacyConsent}
            setPrivacyConsent={setPrivacyConsent}
            consentError={consentError}
            setConsentError={setConsentError}
            onClose={() => setShowWelcomeModal(false)}
            onSubmit={async () => {
              const success = await submitProfileSetup();
              if (success) {
                setShowWelcomeModal(false);
                setShowWelcomeSuccessMessage(true);
              }
            }}
          />
        ) : null}

          {showWelcomeSuccessMessage ? (
            <div className="rounded-[1.35rem] border border-emerald-500/32 bg-gradient-to-br from-emerald-500/14 via-black/20 to-cyan-500/8 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.28)] backdrop-blur-sm">
              <p className="text-base font-bold text-emerald-100">Profil bien reçu — bienvenue dans la New Family.</p>
              <p className="mt-2 text-sm leading-relaxed text-emerald-100/85">
                Ton espace est créé ou mis à jour. Le staff valide les changements si nécessaire — en attendant,
                explore le dashboard, les événements et ton planning.
              </p>
              <Link
                href="/member/profil"
                className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-bold text-emerald-950 transition hover:-translate-y-0.5 hover:bg-emerald-300"
              >
                Voir mon profil <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          ) : null}

          <MemberBentoRow>
            <MemberBentoCell span={8}>
              <ProfileCompleterHero model={viewModel} />
            </MemberBentoCell>
            <MemberBentoCell span={4}>
              <ProfileCompleterSidebar
                model={viewModel}
                identityChecks={identityChecks}
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                onScrollToField={scrollToField}
              />
            </MemberBentoCell>
          </MemberBentoRow>

          <MemberBentoRow>
            <MemberBentoCell span={12}>
              <ProfileCompleterTwitchSection />
            </MemberBentoCell>
          </MemberBentoRow>

          <MemberBentoRow>
            <MemberBentoCell span={12}>
              <ProfileCompleterForm
                accent={viewModel.accent}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                form={form}
                setForm={setForm}
                publicProfileForm={publicProfileForm}
                setPublicProfileForm={setPublicProfileForm}
                identityDoneCount={identityDoneCount}
                identityChecksLength={identityChecks.length}
                requiredIdentityReady={requiredIdentityReady}
                hasPublicDescription={hasPublicDescription}
                descriptionWithGames={descriptionWithGames}
                maxDescription={MAX_DESCRIPTION}
                canSubmit={canSubmit}
                privacyConsent={privacyConsent}
                setPrivacyConsent={setPrivacyConsent}
                consentError={consentError}
                setConsentError={setConsentError}
                creatingProfile={creatingProfile}
                createProfileSuccess={createProfileSuccess}
                profileAlreadyCreated={profileAlreadyCreated}
                onSubmit={onSubmit}
                goToNextTab={goToNextTab}
                goToPrevTab={goToPrevTab}
              />
            </MemberBentoCell>
          </MemberBentoRow>
    </MemberBentoShell>
  );
}

function ProfileCompleterSkeleton() {
  return (
    <MemberBentoShell>
      <div className="flex w-full animate-pulse flex-col gap-[clamp(0.65rem,1.1vw,1.25rem)]">
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="h-52 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.05] lg:col-span-8" />
          <div className="h-52 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.05] lg:col-span-4" />
        </div>
        <div className="h-40 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.05]" />
        <div className="h-[28rem] rounded-[1.35rem] border border-white/[0.06] bg-white/[0.05]" />
      </div>
    </MemberBentoShell>
  );
}

type WelcomeModalProps = {
  form: {
    discordId: string;
    discordUsername: string;
    creatorName: string;
    twitchChannelUrl: string;
    parrain: string;
    birthday: string;
    twitchAffiliateDate: string;
    timezone: string;
    countryCode: string;
    primaryLanguage: string;
  };
  setForm: React.Dispatch<React.SetStateAction<WelcomeModalProps["form"] & { notes: string }>>;
  publicProfileForm: {
    description: string;
    instagram: string;
    tiktok: string;
    twitter: string;
    games: string;
    birthday: string;
    twitchAffiliateDate: string;
    timezone: string;
  };
  setPublicProfileForm: React.Dispatch<React.SetStateAction<WelcomeModalProps["publicProfileForm"]>>;
  canSubmit: boolean;
  creatingProfile: boolean;
  privacyConsent: boolean;
  setPrivacyConsent: (v: boolean) => void;
  consentError: string | null;
  setConsentError: (v: string | null) => void;
  onClose: () => void;
  onSubmit: () => void;
};

function WelcomeModal({
  form,
  setForm,
  publicProfileForm,
  setPublicProfileForm,
  canSubmit,
  creatingProfile,
  privacyConsent,
  setPrivacyConsent,
  consentError,
  setConsentError,
  onClose,
  onSubmit,
}: WelcomeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-3 pt-6 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="relative w-full max-w-3xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-[1.35rem] border border-emerald-500/25 bg-gradient-to-b from-[#101820] to-[#0a0f14] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)] md:max-h-[calc(100dvh-2rem)] md:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl border border-white/10 p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
          aria-label="Fermer"
        >
          <X size={18} />
        </button>

        <div className="mb-6 overflow-hidden rounded-2xl border border-emerald-400/25 bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-violet-600/15 p-5">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Première connexion
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">Crée ton espace membre TENF</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/75">
            Quelques champs pour que le staff te reconnaisse et t&apos;attribue les bons accès. Le reste peut
            attendre — tu peux tout peaufiner depuis ton profil ensuite. Rien n&apos;est définitif : on avance
            ensemble, sans pression.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={FIELD_LABEL}>ID Discord (automatique)</label>
            <input value={form.discordId} disabled className={FIELD_CLASS} />
          </div>
          <div>
            <label className={FIELD_LABEL}>Pseudo Discord *</label>
            <input
              value={form.discordUsername}
              onChange={(e) => setForm((prev) => ({ ...prev, discordUsername: e.target.value }))}
              className={FIELD_CLASS}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={FIELD_LABEL}>URL ou pseudo Twitch *</label>
            <input
              value={form.twitchChannelUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, twitchChannelUrl: e.target.value }))}
              placeholder="https://www.twitch.tv/pseudo"
              className={FIELD_CLASS}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={FIELD_LABEL}>Nom affiché / créateur *</label>
            <input
              value={form.creatorName}
              onChange={(e) => setForm((prev) => ({ ...prev, creatorName: e.target.value }))}
              className={FIELD_CLASS}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={FIELD_LABEL}>Parrain TENF *</label>
            <input
              value={form.parrain}
              onChange={(e) => setForm((prev) => ({ ...prev, parrain: e.target.value }))}
              placeholder="Pseudo Twitch, ami·e, chaîne…"
              className={FIELD_CLASS}
            />
            <p className={FIELD_HINT}>La personne ou le média grâce auquel tu as découvert TENF.</p>
          </div>
          <div>
            <label className={FIELD_LABEL}>Fuseau horaire *</label>
            <select
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
            <label className={FIELD_LABEL}>Pays *</label>
            <select
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
          <div className="sm:col-span-2">
            <label className={FIELD_LABEL}>Langue principale *</label>
            <select
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
        </div>

        <div className="mt-4">
          <label className={FIELD_LABEL}>Descriptif de chaîne (optionnel)</label>
          <textarea
            value={publicProfileForm.description}
            onChange={(e) => setPublicProfileForm((prev) => ({ ...prev, description: e.target.value }))}
            rows={3}
            placeholder="Tu peux compléter ça plus tard depuis la page profil."
            className={FIELD_CLASS}
          />
        </div>

        <div className="mt-5">
          <RgpdConsentCheckbox
            id="member-profile-welcome-privacy-consent"
            checked={privacyConsent}
            onChange={(checked) => {
              setPrivacyConsent(checked);
              if (checked) setConsentError(null);
            }}
            error={consentError}
          />
        </div>

        <div className="sticky bottom-0 mt-6 flex flex-wrap gap-3 border-t border-white/10 bg-[#0a0f14]/95 py-4 backdrop-blur-md">
          <button
            type="button"
            onClick={onSubmit}
            disabled={creatingProfile || !canSubmit || !privacyConsent}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-50 sm:flex-none"
          >
            {creatingProfile ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Création en cours…
              </>
            ) : (
              <>
                Créer mon espace <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/5"
          >
            Formulaire complet
          </button>
        </div>
      </div>
    </div>
  );
}
