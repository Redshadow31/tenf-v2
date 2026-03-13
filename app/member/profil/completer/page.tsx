"use client";

import { useEffect, useState } from "react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import MemberInfoCard from "@/components/member/ui/MemberInfoCard";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";

const TIMEZONE_OPTIONS = [
  { value: "Europe/Paris", label: "France (Europe/Paris)" },
  { value: "Europe/Brussels", label: "Belgique (Europe/Brussels)" },
  { value: "Europe/Zurich", label: "Suisse (Europe/Zurich)" },
  { value: "Europe/Luxembourg", label: "Luxembourg (Europe/Luxembourg)" },
  { value: "America/Montreal", label: "Quebec (America/Montreal)" },
];

type MemberResponse = {
  member: {
    displayName: string;
    twitchLogin: string;
    role: string;
    socials: { discord: string };
    tenfSummary: { parrain: string | null };
    birthday?: string | null;
    twitchAffiliateDate?: string | null;
    timezone?: string | null;
  };
};

export default function MemberProfileCompletePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [createProfileSuccess, setCreateProfileSuccess] = useState(false);
  const [form, setForm] = useState({
    discordUsername: "",
    creatorName: "",
    twitchChannelUrl: "",
    parrain: "",
    notes: "",
    birthday: "",
    twitchAffiliateDate: "",
    timezone: "Europe/Paris",
    countryCode: "FR",
  });

  useEffect(() => {
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
        setForm((prev) => ({
          ...prev,
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
          countryCode: "FR",
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
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreatingProfile(true);
    setCreateProfileSuccess(false);
    try {
      const res = await fetch("/api/members/me/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) {
        alert(body.error || "Erreur lors de la creation du profil");
        return;
      }
      setCreateProfileSuccess(true);
    } catch {
      alert("Erreur de connexion");
    } finally {
      setCreatingProfile(false);
    }
  }

  if (loading) return <p style={{ color: "var(--color-text-secondary)" }}>Chargement...</p>;
  if (error) return <EmptyFeatureCard title="Completer mon profil" description={error} />;

  return (
    <MemberSurface>
      <MemberPageHeader title="Completer mon profil" description="Renseigne ton profil de base pour finaliser ton activation TENF." />
      <MemberInfoCard title="Creation / activation du profil">
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Ton profil reste inactif tant qu il n est pas valide par le staff apres la reunion d integration.
        </p>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
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
          {createProfileSuccess ? <p className="text-sm text-green-500">Profil cree/mis a jour. Le staff doit encore le valider.</p> : null}
          <button type="submit" disabled={creatingProfile} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-60" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            {creatingProfile ? "Creation..." : "Creer mon profil"}
          </button>
        </form>
      </MemberInfoCard>
    </MemberSurface>
  );
}
