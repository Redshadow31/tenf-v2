"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AtSign, CheckCircle2, Circle, FileText, Instagram, Music2, UserCircle2, X } from "lucide-react";
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
          isPlaceholder || shouldShowFromState || searchParams.get("onboarding") === "1"
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
        publicProfileForm.games.trim() ? `Jeux proposes sur la chaine: ${publicProfileForm.games.trim()}` : "",
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
        alert(`La description finale depasse ${MAX_DESCRIPTION} caracteres.`);
        return false;
      }

      const res = await fetch("/api/members/me/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) {
        alert(body.error || "Erreur lors de la creation du profil");
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

  if (loading) return <p style={{ color: "var(--color-text-secondary)" }}>Chargement...</p>;
  if (error) return <EmptyFeatureCard title="Completer mon profil" description={error} />;

  return (
    <MemberSurface>
      {showWelcomeModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
          <div className="relative w-full max-w-3xl rounded-2xl border border-emerald-400/30 bg-[#11161a] p-5 shadow-2xl md:p-7">
            <button
              type="button"
              onClick={() => setShowWelcomeModal(false)}
              className="absolute right-4 top-4 rounded-md border border-gray-700 p-1 text-gray-300 hover:bg-white/5"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
            <div className="mb-5 rounded-xl border border-emerald-400/20 bg-gradient-to-r from-emerald-500/20 via-cyan-400/10 to-purple-500/20 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-emerald-300">Communaute TENF</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Bienvenue dans la creation de ton Espace TENF</h2>
              <p className="mt-2 text-sm text-gray-200">
                Complete d abord les infos essentielles. Le reste peut etre ajuste ensuite dans ton profil membre.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-gray-300">ID Discord (auto)</label>
                <input value={form.discordId} disabled className="w-full rounded-lg border border-gray-700 bg-[#0f1317] px-3 py-2 text-gray-300" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-300">Pseudo Discord (auto, modifiable) *</label>
                <input value={form.discordUsername} onChange={(e) => setForm((prev) => ({ ...prev, discordUsername: e.target.value }))} className="w-full rounded-lg border border-gray-700 bg-[#0f1317] px-3 py-2 text-white" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-300">Pseudo Twitch / URL Twitch *</label>
                <input value={form.twitchChannelUrl} onChange={(e) => setForm((prev) => ({ ...prev, twitchChannelUrl: e.target.value }))} placeholder="https://www.twitch.tv/pseudo" className="w-full rounded-lg border border-gray-700 bg-[#0f1317] px-3 py-2 text-white" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-300">Nom du createur *</label>
                <input value={form.creatorName} onChange={(e) => setForm((prev) => ({ ...prev, creatorName: e.target.value }))} className="w-full rounded-lg border border-gray-700 bg-[#0f1317] px-3 py-2 text-white" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-300">Parrain TENF *</label>
                <input value={form.parrain} onChange={(e) => setForm((prev) => ({ ...prev, parrain: e.target.value }))} placeholder="Pseudo Twitch du membre ou reseau social" className="w-full rounded-lg border border-gray-700 bg-[#0f1317] px-3 py-2 text-white" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-300">Fuseau horaire *</label>
                <select value={form.timezone} onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))} className="w-full rounded-lg border border-gray-700 bg-[#0f1317] px-3 py-2 text-white">
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-300">Pays *</label>
                <select value={form.countryCode} onChange={(e) => setForm((prev) => ({ ...prev, countryCode: e.target.value }))} className="w-full rounded-lg border border-gray-700 bg-[#0f1317] px-3 py-2 text-white">
                  <option value="FR">France (FR)</option>
                  <option value="BE">Belgique (BE)</option>
                  <option value="CH">Suisse (CH)</option>
                  <option value="CA">Canada (CA)</option>
                  <option value="LU">Luxembourg (LU)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-300">Langue *</label>
                <select value={form.primaryLanguage} onChange={(e) => setForm((prev) => ({ ...prev, primaryLanguage: e.target.value }))} className="w-full rounded-lg border border-gray-700 bg-[#0f1317] px-3 py-2 text-white">
                  <option value="fr">Francais</option>
                  <option value="en">Anglais</option>
                  <option value="es">Espagnol</option>
                  <option value="de">Allemand</option>
                </select>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-gray-300">Date d anniversaire (optionnel)</label>
                <input type="date" value={form.birthday} onChange={(e) => setForm((prev) => ({ ...prev, birthday: e.target.value }))} className="w-full rounded-lg border border-gray-700 bg-[#0f1317] px-3 py-2 text-white" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-300">Date d affiliation Twitch (optionnel)</label>
                <input type="date" value={form.twitchAffiliateDate} onChange={(e) => setForm((prev) => ({ ...prev, twitchAffiliateDate: e.target.value }))} className="w-full rounded-lg border border-gray-700 bg-[#0f1317] px-3 py-2 text-white" />
                <p className="mt-1 text-xs text-gray-400">
                  Procedure: Tableau de bord createur {"->"} Parametres {"->"} Chaine {"->"} Evenements de streaming.
                </p>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <input value={publicProfileForm.instagram} onChange={(e) => setPublicProfileForm((prev) => ({ ...prev, instagram: e.target.value }))} placeholder="Instagram (optionnel)" className="w-full rounded-lg border border-gray-700 bg-[#0f1317] px-3 py-2 text-white" />
              <input value={publicProfileForm.tiktok} onChange={(e) => setPublicProfileForm((prev) => ({ ...prev, tiktok: e.target.value }))} placeholder="TikTok (optionnel)" className="w-full rounded-lg border border-gray-700 bg-[#0f1317] px-3 py-2 text-white" />
              <input value={publicProfileForm.twitter} onChange={(e) => setPublicProfileForm((prev) => ({ ...prev, twitter: e.target.value }))} placeholder="X / Twitter (optionnel)" className="w-full rounded-lg border border-gray-700 bg-[#0f1317] px-3 py-2 text-white" />
            </div>
            <p className="mt-2 text-xs text-gray-400">Ces liens sont optionnels, mais utiles pour completer ton profil public.</p>

            <div className="mt-3">
              <label className="mb-1 block text-sm text-gray-300">Descriptif de chaine (optionnel)</label>
              <textarea
                value={publicProfileForm.description}
                onChange={(e) => setPublicProfileForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                placeholder="Tu peux aussi le remplir plus tard."
                className="w-full rounded-lg border border-gray-700 bg-[#0f1317] px-3 py-2 text-white"
              />
              <p className="mt-1 text-xs text-gray-400">Tu pourras revenir dessus plus tard sans bloquer ta creation d espace.</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
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
                className="rounded-lg border border-emerald-400/30 bg-emerald-500/20 px-4 py-2 text-sm text-emerald-100 disabled:opacity-60"
              >
                {creatingProfile ? "Creation en cours..." : "Creer mon Espace TENF"}
              </button>
              <button
                type="button"
                onClick={() => setShowWelcomeModal(false)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <MemberPageHeader
        title="Completer mon profil"
        description="Un seul formulaire pour activer et mettre a jour ton profil TENF."
      />
      {showWelcomeSuccessMessage ? (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/15 p-4">
          <p className="text-sm font-semibold text-emerald-200">
            Profil bien recu, et surtout : bienvenue officiellement dans la New Family TENF.
          </p>
          <p className="mt-1 text-xs text-emerald-100/90">
            Ton espace membre est maintenant cree et pret a evoluer avec toi. Le staff prend le relais pour la validation finale, puis tu pourras profiter pleinement de toutes les fonctionnalites de la communaute.
          </p>
        </div>
      ) : null}
      <TwitchLinkCard />
      <MemberInfoCard title="Parcours de completion">
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Remplis les 2 onglets puis envoie une seule soumission. Les changements restent en attente de validation staff.
        </p>
        <div className="mt-4 rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span style={{ color: "var(--color-text)" }}>Progression du profil</span>
            <span style={{ color: "var(--color-text-secondary)" }}>{completionPercent}%</span>
          </div>
          <div className="h-2 rounded-full" style={{ backgroundColor: "var(--color-card-hover)" }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${completionPercent}%`, background: "linear-gradient(90deg, rgba(145,70,255,0.95), rgba(186,142,255,0.95))" }}
            />
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-xs uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
              Etape 1
            </p>
            <p className="mt-1 text-sm font-medium" style={{ color: "var(--color-text)" }}>
              Identite TENF
            </p>
            <p className="mt-1 text-xs" style={{ color: requiredIdentityReady ? "#22c55e" : "var(--color-text-secondary)" }}>
              {requiredIdentityReady ? "Champs obligatoires completes." : "Completer les champs obligatoires (*)."}
            </p>
          </div>
          <div className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-xs uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
              Etape 2
            </p>
            <p className="mt-1 text-sm font-medium" style={{ color: "var(--color-text)" }}>
              Fiche publique
            </p>
            <p className="mt-1 text-xs" style={{ color: hasPublicDescription ? "#22c55e" : "var(--color-text-secondary)" }}>
              {hasPublicDescription ? "Description ajoutee (optionnelle)." : "Description optionnelle, tu peux la completer plus tard."}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setActiveTab("identite")}
            className="rounded-xl border px-3 py-3 text-left text-sm transition-colors"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: activeTab === "identite" ? "rgba(145, 70, 255, 0.14)" : "transparent",
              color: "var(--color-text)",
            }}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2">
                <UserCircle2 size={16} />
                Onglet 1 - Identite TENF
              </span>
              {requiredIdentityReady ? <CheckCircle2 size={16} className="text-green-500" /> : <Circle size={16} />}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("public")}
            className="rounded-xl border px-3 py-3 text-left text-sm transition-colors"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: activeTab === "public" ? "rgba(145, 70, 255, 0.14)" : "transparent",
              color: "var(--color-text)",
            }}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2">
                <FileText size={16} />
                Onglet 2 - Fiche publique
              </span>
              {hasPublicDescription ? <CheckCircle2 size={16} className="text-green-500" /> : <Circle size={16} />}
            </span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          {activeTab === "identite" ? (
            <section className="space-y-3 rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Renseigne les informations d identification et d activation membre.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm" style={{ color: "var(--color-text-secondary)" }}>Pseudo Discord *</label>
                  <input required value={form.discordUsername} onChange={(e) => setForm((prev) => ({ ...prev, discordUsername: e.target.value }))} className="w-full rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }} />
                </div>
                <div>
                  <label className="mb-1 block text-sm" style={{ color: "var(--color-text-secondary)" }}>Nom du createur *</label>
                  <input required value={form.creatorName} onChange={(e) => setForm((prev) => ({ ...prev, creatorName: e.target.value }))} className="w-full rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }} />
                </div>
                <div>
                  <label className="mb-1 block text-sm" style={{ color: "var(--color-text-secondary)" }}>Pseudo Twitch / URL Twitch *</label>
                  <input required value={form.twitchChannelUrl} onChange={(e) => setForm((prev) => ({ ...prev, twitchChannelUrl: e.target.value }))} placeholder="https://www.twitch.tv/pseudo" className="w-full rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }} />
                </div>
                <div>
                  <label className="mb-1 block text-sm" style={{ color: "var(--color-text-secondary)" }}>Fuseau horaire *</label>
                  <select required value={form.timezone} onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))} className="w-full rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}>
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm" style={{ color: "var(--color-text-secondary)" }}>Pays *</label>
                  <select required value={form.countryCode} onChange={(e) => setForm((prev) => ({ ...prev, countryCode: e.target.value }))} className="w-full rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}>
                    <option value="FR">France (FR)</option>
                    <option value="BE">Belgique (BE)</option>
                    <option value="CH">Suisse (CH)</option>
                    <option value="CA">Canada (CA)</option>
                    <option value="LU">Luxembourg (LU)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm" style={{ color: "var(--color-text-secondary)" }}>Parrain TENF</label>
                  <input value={form.parrain} onChange={(e) => setForm((prev) => ({ ...prev, parrain: e.target.value }))} className="w-full rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }} />
                </div>
                <div>
                  <label className="mb-1 block text-sm" style={{ color: "var(--color-text-secondary)" }}>Date d anniversaire</label>
                  <input type="date" value={form.birthday} onChange={(e) => setForm((prev) => ({ ...prev, birthday: e.target.value }))} className="w-full rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }} />
                </div>
                <div>
                  <label className="mb-1 block text-sm" style={{ color: "var(--color-text-secondary)" }}>Date d affiliation Twitch</label>
                  <input type="date" value={form.twitchAffiliateDate} onChange={(e) => setForm((prev) => ({ ...prev, twitchAffiliateDate: e.target.value }))} className="w-full rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }} />
                  <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    Procedure: Tableau de bord createur {">"} Parametres {">"} Chaine {">"} Evenements de streaming.
                  </p>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm" style={{ color: "var(--color-text-secondary)" }}>Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} rows={3} className="w-full rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }} />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("public")}
                  className="rounded-lg border px-4 py-2 text-sm"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  Continuer vers la fiche publique
                </button>
                <button
                  type="button"
                  onClick={goToNextTab}
                  className="rounded-lg border px-4 py-2 text-sm"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  Onglet suivant
                </button>
              </div>
            </section>
          ) : (
            <section className="space-y-3 rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Ces informations alimentent ta fiche publique streamer.
              </p>
              <div>
                <label className="mb-1 block text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Descriptif chaine (Markdown Discord) ({descriptionWithGames.length}/{MAX_DESCRIPTION})
                </label>
                <textarea
                  value={publicProfileForm.description}
                  onChange={(e) => setPublicProfileForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={10}
                  maxLength={MAX_DESCRIPTION}
                  className="w-full rounded-lg border px-3 py-2"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)", minHeight: "220px" }}
                />
                <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  Supporte le Markdown Discord: **gras**, *italique*, __souligne__, &gt; citation.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm" style={{ color: "var(--color-text-secondary)" }}>Jeux proposes sur la chaine</label>
                <input
                  value={publicProfileForm.games}
                  onChange={(e) => setPublicProfileForm((prev) => ({ ...prev, games: e.target.value }))}
                  placeholder="Ex: GTA RP, Valorant, Minecraft"
                  className="w-full rounded-lg border px-3 py-2"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 inline-flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    <Instagram size={14} />
                    <span>Instagram</span>
                  </label>
                  <input
                    value={publicProfileForm.instagram}
                    onChange={(e) => setPublicProfileForm((prev) => ({ ...prev, instagram: e.target.value }))}
                    placeholder="Pseudo ou @pseudo"
                    className="w-full rounded-lg border px-3 py-2"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                  />
                </div>
                <div>
                  <label className="mb-1 inline-flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    <Music2 size={14} />
                    <span>TikTok</span>
                  </label>
                  <input
                    value={publicProfileForm.tiktok}
                    onChange={(e) => setPublicProfileForm((prev) => ({ ...prev, tiktok: e.target.value }))}
                    placeholder="Pseudo ou @pseudo"
                    className="w-full rounded-lg border px-3 py-2"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                  />
                </div>
                <div>
                  <label className="mb-1 inline-flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    <AtSign size={14} />
                    <span>X / Twitter</span>
                  </label>
                  <input
                    value={publicProfileForm.twitter}
                    onChange={(e) => setPublicProfileForm((prev) => ({ ...prev, twitter: e.target.value }))}
                    placeholder="Pseudo ou @pseudo"
                    className="w-full rounded-lg border px-3 py-2"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                  />
                </div>
              </div>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Astuce: privilegie une description concise de ton style, ta frequence et tes jeux.
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={goToPrevTab}
                  className="rounded-lg border px-4 py-2 text-sm"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  Revenir a l identite
                </button>
              </div>
            </section>
          )}

          <div className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              Verification avant envoi: {requiredIdentityReady ? "Identite OK" : "Identite incomplete"} - {hasPublicDescription ? "Fiche publique enrichie" : "Fiche publique optionnelle"}
            </p>
            {!canSubmit ? (
              <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Remplis les champs obligatoires (*). La description de chaine peut etre ajoutee plus tard.
              </p>
            ) : null}
            {createProfileSuccess ? (
              <p className="mt-2 text-sm text-green-500">
                {profileAlreadyCreated
                  ? "Mise a jour enregistree avec succes. Merci pour ta confiance : l'equipe TENF traite maintenant ta demande."
                  : "Creation terminee avec succes. Bienvenue officiellement dans la New Family TENF : ton aventure commence ici."}
              </p>
            ) : null}
          </div>

          <button type="submit" disabled={creatingProfile || !canSubmit} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-60" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            {creatingProfile ? "Envoi..." : "Envoyer mon profil a valider"}
          </button>
        </form>
      </MemberInfoCard>
    </MemberSurface>
  );
}
