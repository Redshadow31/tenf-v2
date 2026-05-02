"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  FileText,
  Globe2,
  Info,
  Instagram,
  Loader2,
  Music2,
  Sparkles,
  UserCircle2,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import MemberInfoCard from "@/components/member/ui/MemberInfoCard";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";
import TwitchLinkCard from "@/components/member/ui/TwitchLinkCard";

const MAX_DESCRIPTION = 800;
const TIMEZONE_OPTIONS = [
  { value: "Europe/Paris", label: "France (Europe/Paris)" },
  { value: "Europe/Brussels", label: "Belgique (Europe/Brussels)" },
  { value: "Europe/Zurich", label: "Suisse (Europe/Zurich)" },
  { value: "Europe/Luxembourg", label: "Luxembourg (Europe/Luxembourg)" },
  { value: "America/Montreal", label: "Quebec (America/Montreal)" },
];

const FIELD_CLASS =
  "w-full rounded-xl border border-white/12 bg-[#0a0c12]/90 px-3.5 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 transition focus:border-violet-500/45 focus:outline-none focus:ring-2 focus:ring-violet-500/15 disabled:opacity-60";
const FIELD_LABEL = "mb-1.5 block text-sm font-medium text-zinc-200";
const FIELD_HINT = "mt-1.5 text-xs leading-relaxed text-zinc-500";

function ProfileCompleterSkeleton() {
  return (
    <MemberSurface>
      <div className="animate-pulse space-y-8">
        <div className="h-9 w-64 rounded-xl bg-white/10" />
        <div className="h-4 max-w-xl rounded-lg bg-white/5" />
        <div className="h-36 rounded-3xl bg-white/[0.06]" />
        <div className="h-24 rounded-2xl bg-white/[0.06]" />
        <div className="h-[28rem] rounded-3xl bg-white/[0.06]" />
      </div>
    </MemberSurface>
  );
}

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
        const shouldShowFromState = onboardingStatus === "a_faire";
        setShowWelcomeModal(
          isPlaceholder || shouldShowFromState || searchParams?.get("onboarding") === "1"
        );
        setForm((prev) => ({
          ...prev,
          discordId: data.member.discordId || prev.discordId,
          discordUsername: data.member.socials.discord || prev.discordUsername,
          creatorName: data.member.displayName || prev.creatorName,
          twitchChannelUrl:
            data.member.twitchLogin.startsWith("nouveau_") || data.member.twitchLogin.startsWith("nouveau-")
              ? prev.twitchChannelUrl
              : `https://www.twitch.tv/${data.member.twitchLogin || ""}`,
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
          birthday: data.pending?.birthday || (data.member.birthday ? String(data.member.birthday).slice(0, 10) : ""),
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
    [publicProfileForm.description, publicProfileForm.games]
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
    [
      form.countryCode,
      form.creatorName,
      form.discordUsername,
      form.parrain,
      form.primaryLanguage,
      form.timezone,
      form.twitchChannelUrl,
    ],
  );
  const identityDoneCount = identityChecks.filter((item) => item.done).length;

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
        body: JSON.stringify(form),
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
  if (error) return <EmptyFeatureCard title="Compléter mon profil" description={error} />;

  return (
    <MemberSurface>
      {showWelcomeModal ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-3 pt-6 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="relative w-full max-w-3xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-3xl border border-emerald-500/25 bg-gradient-to-b from-[#101820] to-[#0a0f14] p-5 pb-0 shadow-[0_24px_80px_rgba(0,0,0,0.55)] md:max-h-[calc(100dvh-2rem)] md:p-8 md:pb-0">
            <button
              type="button"
              onClick={() => setShowWelcomeModal(false)}
              className="absolute right-4 top-4 rounded-xl border border-white/10 p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
            <div className="mb-6 overflow-hidden rounded-2xl border border-emerald-400/25 bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-violet-600/15 p-5">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Première connexion
              </p>
              <h2 className="mt-2 text-balance text-2xl font-black text-white">Crée ton espace membre TENF</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                Quelques champs obligatoires pour que le staff te reconnaisse et t’attribue les bons accès. Le reste peut attendre : tu pourras
                tout peaufiner depuis ton profil ensuite.
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
                <p className={FIELD_HINT}>Pré-rempli depuis Discord — corrige si besoin.</p>
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

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={FIELD_LABEL}>Date d’anniversaire</label>
                <input
                  type="date"
                  value={form.birthday}
                  onChange={(e) => setForm((prev) => ({ ...prev, birthday: e.target.value }))}
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <label className={FIELD_LABEL}>Date d’affiliation Twitch</label>
                <input
                  type="date"
                  value={form.twitchAffiliateDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, twitchAffiliateDate: e.target.value }))}
                  className={FIELD_CLASS}
                />
                <p className={FIELD_HINT}>Créateur · Paramètres · Chaîne · Événements de streaming.</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={FIELD_LABEL}>Instagram</label>
                <input
                  value={publicProfileForm.instagram}
                  onChange={(e) => setPublicProfileForm((prev) => ({ ...prev, instagram: e.target.value }))}
                  placeholder="@pseudo"
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <label className={FIELD_LABEL}>TikTok</label>
                <input
                  value={publicProfileForm.tiktok}
                  onChange={(e) => setPublicProfileForm((prev) => ({ ...prev, tiktok: e.target.value }))}
                  placeholder="@pseudo"
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <label className={FIELD_LABEL}>X / Twitter</label>
                <input
                  value={publicProfileForm.twitter}
                  onChange={(e) => setPublicProfileForm((prev) => ({ ...prev, twitter: e.target.value }))}
                  placeholder="@pseudo"
                  className={FIELD_CLASS}
                />
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-500">Réseaux optionnels mais utiles pour ta fiche publique.</p>

            <div className="mt-5">
              <label className={FIELD_LABEL}>Descriptif de chaîne</label>
              <textarea
                value={publicProfileForm.description}
                onChange={(e) => setPublicProfileForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                placeholder="Tu peux compléter ça plus tard depuis la page profil."
                className={FIELD_CLASS}
              />
            </div>

            <div className="sticky bottom-0 mt-6 flex flex-wrap gap-3 border-t border-white/10 bg-[#0a0f14]/95 py-4 backdrop-blur-md">
              <button
                type="button"
                onClick={async () => {
                  const success = await submitProfileSetup();
                  if (success) {
                    setShowWelcomeModal(false);
                    setShowWelcomeSuccessMessage(true);
                  }
                }}
                disabled={creatingProfile || !canSubmit}
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
                onClick={() => setShowWelcomeModal(false)}
                className="min-h-[48px] rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/5"
              >
                Plus tard — formulaire complet
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <MemberPageHeader
        title="Compléter ton profil TENF"
        description="Pour les nouveaux comme pour les membres déjà installés : mets à jour ton identité, ta vitrine streamer et tes réseaux. Une validation staff peut suivre — prends le temps de bien te présenter."
      />
      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/member/profil"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-violet-400/30 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Retour au profil
        </Link>
      </div>
      {showWelcomeSuccessMessage ? (
        <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 p-5 sm:p-6">
          <p className="text-base font-bold text-emerald-100">Profil bien reçu — bienvenue dans la New Family.</p>
          <p className="mt-2 text-sm leading-relaxed text-emerald-100/85">
            Ton espace est créé ou mis à jour. Le staff valide les changements quand c’est nécessaire ; en attendant, explore le dashboard, les
            événements et ton planning.
          </p>
          <Link
            href="/member/profil"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-emerald-950 transition hover:bg-zinc-100"
          >
            Voir mon profil <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      ) : null}
      <TwitchLinkCard />
      <section
        className="relative mb-8 overflow-hidden rounded-3xl border p-5 shadow-xl sm:p-8"
        style={{
          borderColor: "rgba(145, 70, 255, 0.35)",
          background:
            "radial-gradient(ellipse 90% 70% at 0% -20%, rgba(145, 70, 255, 0.22), transparent 50%), radial-gradient(ellipse 60% 50% at 100% 0%, rgba(56, 189, 248, 0.12), transparent 45%), linear-gradient(165deg, rgba(17, 24, 39, 0.85), rgba(8, 10, 16, 0.95))",
        }}
      >
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300/90">Parcours guidé</p>
            <h2 className="mt-2 text-balance text-2xl font-black text-white sm:text-3xl">Deux étapes, une seule envoi</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
              D’abord ton identité TENF (obligatoire), puis ta fiche publique (facultatif mais recommandé). Tu peux envoyer sans bio : tu la
              ajouteras quand tu es inspiré·e.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-center sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Progression</p>
              <p className="mt-1 text-3xl font-black tabular-nums text-white">{completionPercent}%</p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:w-auto">
              <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-center">
                <UserCircle2 className="mx-auto h-4 w-4 text-violet-400" aria-hidden />
                <p className="mt-1 text-lg font-bold text-white">{identityDoneCount}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Identité</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-center">
                <FileText className="mx-auto h-4 w-4 text-fuchsia-400" aria-hidden />
                <p className="mt-1 text-xs font-semibold leading-tight text-white">{hasPublicDescription ? "Bio OK" : "Bio +"}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Public</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-center">
                <Clock3 className="mx-auto h-4 w-4 text-sky-400" aria-hidden />
                <p className="mt-1 text-xs font-semibold leading-tight text-white">Staff</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Suite</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative mt-6 h-2.5 overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-400 transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </section>

      <div className="mb-6 flex gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-sm text-zinc-300">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
        <p>
          <strong className="text-emerald-100">Rappel :</strong> les champs avec astérisque sont nécessaires pour enregistrer. La bio et les réseaux
          enrichissent ta vitrine — tu peux les remplir tranquillement.
        </p>
      </div>
      <MemberInfoCard title="Formulaire de complétion">
        <p className="text-sm leading-relaxed text-zinc-400">
          Les deux volets se soumettent ensemble : d’abord l’identité (obligatoire), puis ta vitrine publique si tu veux la peaufiner maintenant.
          Les changements peuvent rester en attente de validation staff.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div
            className={`rounded-2xl border p-4 transition-colors ${
              requiredIdentityReady ? "border-emerald-500/35 bg-emerald-950/15" : "border-white/10 bg-black/25"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-300/90">Étape 1</p>
            <p className="mt-1 text-base font-bold text-white">Identité TENF</p>
            <p className={`mt-2 text-xs ${requiredIdentityReady ? "text-emerald-300/90" : "text-zinc-500"}`}>
              {requiredIdentityReady ? "Tous les champs requis sont remplis." : "Complète les cases marquées d’une astérisque."}
            </p>
            <p className="mt-2 text-xs tabular-nums text-zinc-500">
              {identityDoneCount}/{identityChecks.length} critères validés
            </p>
          </div>
          <div
            className={`rounded-2xl border p-4 transition-colors ${
              hasPublicDescription ? "border-fuchsia-500/35 bg-fuchsia-950/15" : "border-white/10 bg-black/25"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-fuchsia-300/90">Étape 2</p>
            <p className="mt-1 text-base font-bold text-white">Fiche publique</p>
            <p className="mt-2 text-xs text-zinc-500">
              {hasPublicDescription
                ? "Ta bio est renseignée — tu peux encore l’éditer avant envoi."
                : "Optionnel : ajoute une bio et tes réseaux pour compléter ta vitrine."}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Checklist identité — clique pour te positionner sur le champ
          </p>
          <div className="flex flex-wrap gap-2">
            {identityChecks.map((item) => (
              <button
                key={item.fieldId}
                type="button"
                onClick={() => scrollToField(item.fieldId)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition hover:border-violet-400/40 hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-violet-500/25 ${
                  item.done ? "border-emerald-500/30 text-emerald-100/95" : "border-white/12 text-zinc-400"
                }`}
              >
                {item.done ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden /> : <Circle className="h-3.5 w-3.5 shrink-0 text-zinc-600" aria-hidden />}
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setActiveTab("identite")}
            className={`rounded-2xl border px-4 py-4 text-left text-sm transition-all ${
              activeTab === "identite"
                ? "border-violet-500/45 bg-violet-500/[0.12] shadow-[0_0_28px_rgba(139,92,246,0.12)]"
                : "border-white/10 bg-black/20 hover:border-white/18"
            }`}
          >
            <span className="flex items-center justify-between gap-2 text-zinc-100">
              <span className="inline-flex items-center gap-2 font-semibold">
                <UserCircle2 className="h-4 w-4 text-violet-400" aria-hidden />
                Identité TENF
              </span>
              {requiredIdentityReady ? <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden /> : <Circle className="h-4 w-4 text-zinc-600" aria-hidden />}
            </span>
            <span className="mt-1.5 block text-xs text-zinc-500">Discord, Twitch, parrain, fuseau, pays, langue.</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("public")}
            className={`rounded-2xl border px-4 py-4 text-left text-sm transition-all ${
              activeTab === "public"
                ? "border-fuchsia-500/40 bg-fuchsia-500/[0.10] shadow-[0_0_28px_rgba(217,70,239,0.10)]"
                : "border-white/10 bg-black/20 hover:border-white/18"
            }`}
          >
            <span className="flex items-center justify-between gap-2 text-zinc-100">
              <span className="inline-flex items-center gap-2 font-semibold">
                <FileText className="h-4 w-4 text-fuchsia-400" aria-hidden />
                Fiche publique
              </span>
              {hasPublicDescription ? <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden /> : <Circle className="h-4 w-4 text-zinc-600" aria-hidden />}
            </span>
            <span className="mt-1.5 block text-xs text-zinc-500">Bio Markdown, jeux, Instagram, TikTok, X.</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-6">
          {activeTab === "identite" ? (
            <section className="space-y-5 rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-base font-bold text-white">Identité TENF</p>
                  <p className="mt-1 text-sm text-zinc-500">Infos nécessaires pour te reconnaître et t’attribuer les bons accès.</p>
                </div>
                <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-xs font-medium tabular-nums text-zinc-400">
                  {identityDoneCount}/{identityChecks.length} obligatoires
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
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
                  <p className={FIELD_HINT}>Tel qu’on te retrouve sur le serveur — corrige si Discord a mal synchronisé.</p>
                </div>
                <div className="md:col-span-2">
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
                <div className="md:col-span-2">
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
                <div className="md:col-span-2">
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
                  <p className={FIELD_HINT}>Utilisée pour le staff et les futurs outils communautaires.</p>
                </div>
                <div className="md:col-span-2">
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
                    Date d’anniversaire
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
                    Date d’affiliation Twitch
                  </label>
                  <input
                    id="field-twitchAffiliateDate"
                    type="date"
                    value={form.twitchAffiliateDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, twitchAffiliateDate: e.target.value }))}
                    className={FIELD_CLASS}
                  />
                  <p className={FIELD_HINT}>Créateur · Paramètres · Chaîne · Événements de streaming.</p>
                </div>
                <div className="md:col-span-2">
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
                  <p className={FIELD_HINT}>Optionnel — précisions que tu souhaites transmettre au staff.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("public")}
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/20"
                >
                  Fiche publique <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={goToNextTab}
                  className="rounded-xl border border-white/12 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.05]"
                >
                  Onglet suivant
                </button>
              </div>
            </section>
          ) : (
            <section className="space-y-5 rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-base font-bold text-white">Fiche publique</p>
                  <p className="mt-1 text-sm text-zinc-500">Ce que les visiteurs et le hub TENF peuvent mettre en avant.</p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    hasPublicDescription ? "border-emerald-500/35 text-emerald-300" : "border-white/12 text-zinc-500"
                  }`}
                >
                  {hasPublicDescription ? "Bio renseignée" : "Bio optionnelle"}
                </span>
              </div>

              <div>
                <label htmlFor="field-public-description" className={FIELD_LABEL}>
                  Descriptif chaîne (Markdown Discord) — {descriptionWithGames.length}/{MAX_DESCRIPTION}
                </label>
                <textarea
                  id="field-public-description"
                  value={publicProfileForm.description}
                  onChange={(e) => setPublicProfileForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={10}
                  maxLength={MAX_DESCRIPTION}
                  className={`${FIELD_CLASS} min-h-[220px] resize-y`}
                />
                <p className={FIELD_HINT}>
                  **Gras**, *italique*, __souligné__, &gt; citation — même rendu que sur Discord.
                </p>
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
                <p className={FIELD_HINT}>Ajouté sous ta bio dans la description finale envoyée au staff.</p>
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

              <p className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-zinc-500">
                Astuce : une phrase sur ton univers, ta fréquence de live et tes jeux phares suffit souvent pour une première version.
              </p>

              <div className="border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={goToPrevTab}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/12 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.05]"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Retour identité
                </button>
              </div>
            </section>
          )}

          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <p className="text-sm text-zinc-400">
              <span className="font-semibold text-zinc-200">Avant envoi :</span>{" "}
              {requiredIdentityReady ? (
                <span className="text-emerald-400/95">identité complète</span>
              ) : (
                <span className="text-amber-400/95">identité incomplète</span>
              )}
              {" · "}
              {hasPublicDescription ? (
                <span className="text-fuchsia-300/90">fiche publique enrichie</span>
              ) : (
                <span>fiche publique minimale (OK)</span>
              )}
            </p>
            {!canSubmit ? <p className="mt-2 text-xs text-zinc-500">Remplis tous les champs obligatoires (*) pour activer le bouton d’envoi.</p> : null}
            {createProfileSuccess ? (
              <p className="mt-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                {profileAlreadyCreated
                  ? "Mise à jour enregistrée. L’équipe TENF traite ta demande si une validation est nécessaire."
                  : "Création terminée — bienvenue dans la New Family. Tu peux continuer à compléter ton profil quand tu veux."}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/40 to-black/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2 text-sm text-zinc-400">
              <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" aria-hidden />
              <span>Un envoi transmet identité + fiche publique au staff pour traitement.</span>
            </div>
            <button
              type="submit"
              disabled={creatingProfile || !canSubmit}
              className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-900/30 transition hover:brightness-110 disabled:pointer-events-none disabled:opacity-45"
            >
              {creatingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Envoi en cours…
                </>
              ) : (
                <>
                  Envoyer mon profil à valider
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </>
              )}
            </button>
          </div>
        </form>
      </MemberInfoCard>
    </MemberSurface>
  );
}
