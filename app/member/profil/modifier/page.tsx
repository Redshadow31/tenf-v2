"use client";

import { useEffect, useState } from "react";
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

type MemberProfileResponse = {
  member: {
    twitchLogin: string;
    bio: string;
    socials: { instagram: string; tiktok: string; twitter: string };
    birthday?: string | null;
    twitchAffiliateDate?: string | null;
    timezone?: string | null;
  };
  pending: {
    description?: string;
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    birthday?: string;
    twitchAffiliateDate?: string;
  } | null;
};

export default function MemberProfileEditPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [member, setMember] = useState<MemberProfileResponse["member"] | null>(null);
  const [description, setDescription] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [twitter, setTwitter] = useState("");
  const [birthday, setBirthday] = useState("");
  const [twitchAffiliateDate, setTwitchAffiliateDate] = useState("");
  const [timezone, setTimezone] = useState("Europe/Paris");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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
        const data = body as MemberProfileResponse;
        setMember(data.member);
        setDescription(data.pending?.description ?? data.member.bio ?? "");
        setInstagram(data.pending?.instagram ?? data.member.socials.instagram ?? "");
        setTiktok(data.pending?.tiktok ?? data.member.socials.tiktok ?? "");
        setTwitter(data.pending?.twitter ?? data.member.socials.twitter ?? "");
        setBirthday(data.pending?.birthday || (data.member.birthday ? String(data.member.birthday).slice(0, 10) : ""));
        setTwitchAffiliateDate(
          data.pending?.twitchAffiliateDate ||
            (data.member.twitchAffiliateDate ? String(data.member.twitchAffiliateDate).slice(0, 10) : "")
        );
        setTimezone(data.member.timezone || "Europe/Paris");
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
    if (!member) return;
    setSubmitting(true);
    setSubmitSuccess(false);
    try {
      const res = await fetch("/api/members/me/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          instagram,
          tiktok,
          twitter,
          birthday,
          twitchAffiliateDate,
          timezone,
          twitchLogin: member.twitchLogin,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        alert(body.error || "Erreur lors de la soumission");
        return;
      }
      setSubmitSuccess(true);
    } catch {
      alert("Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p style={{ color: "var(--color-text-secondary)" }}>Chargement...</p>;
  if (error || !member) return <EmptyFeatureCard title="Modifier mon profil" description={error || "Profil indisponible."} />;

  return (
    <MemberSurface>
      <MemberPageHeader title="Modifier mon profil" description="Renseigne ou mets a jour tes informations. Les modifications sont soumises au staff." />
      <TwitchLinkCard />
      <MemberInfoCard title="Edition de la fiche profil">
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Description ({description.length}/{MAX_DESCRIPTION})
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={MAX_DESCRIPTION}
              rows={4}
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram" className="w-full rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }} />
            <input value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="TikTok" className="w-full rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }} />
            <input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="X / Twitter" className="w-full rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }} />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className="w-full rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }} />
            <input type="date" value={twitchAffiliateDate} onChange={(e) => setTwitchAffiliateDate(e.target.value)} className="w-full rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }} />
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}>
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
          {submitSuccess ? <p className="text-sm text-green-500">Modifications soumises pour validation.</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-60"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
          >
            {submitting ? "Envoi..." : "Soumettre pour validation"}
          </button>
        </form>
      </MemberInfoCard>
    </MemberSurface>
  );
}
