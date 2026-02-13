"use client";

import React, { useState, useEffect } from "react";
import {
  Twitch,
  MessageCircle,
  Instagram,
  Music2,
  Twitter,
  Calendar,
  TrendingUp,
  Mic,
  MessageSquare,
  Users,
  Send,
  Loader2,
} from "lucide-react";
import { getRoleBadgeStyles } from "@/lib/roleColors";

const MAX_DESCRIPTION = 800;

type ProfileStatus = "non_soumis" | "en_cours_examen" | "valide";

interface MemberProfile {
  displayName: string;
  twitchLogin: string;
  memberId: string;
  avatar: string;
  role: string;
  bio: string;
  memberSince: string | null;
  profileValidationStatus: ProfileStatus;
  socials: {
    twitch: string;
    discord: string;
    instagram: string;
    tiktok: string;
    twitter: string;
  };
  tenfSummary: {
    role: string;
    status: string;
    integration: { integrated: boolean; date: string | null };
    parrain: string | null;
  };
}

interface PendingData {
  description: string;
  instagram: string;
  tiktok: string;
  twitter: string;
}

interface MonthlyStats {
  monthKey: string;
  raidsTENF: number;
  spotlightPresence: { present: number; total: number; rate: number };
  messagesRanking: { rank: number; lastUpdate: string };
  vocalRanking: { rank: number; lastUpdate: string };
}

function StatusBadge({ status }: { status: ProfileStatus }) {
  const config = {
    non_soumis: { label: "Non soumis", bg: "#6b728020", text: "#6b7280", border: "#6b728030" },
    en_cours_examen: { label: "En cours d'examen", bg: "#f59e0b20", text: "#f59e0b", border: "#f59e0b30" },
    valide: { label: "Validé par le staff", bg: "#10b98120", text: "#10b981", border: "#10b98130" },
  };
  const c = config[status] || config.non_soumis;
  return (
    <span
      className="px-3 py-1 rounded-full text-xs font-semibold border"
      style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border }}
    >
      {c.label}
    </span>
  );
}

function SocialLink({ icon: Icon, label, value, url }: { icon: any; label: string; value: string; url?: string }) {
  if (!value?.trim()) return null;
  const href = url || (value.startsWith("http") ? value : `https://${value}`);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 p-2 rounded-lg border transition-colors hover:opacity-80"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <Icon className="w-5 h-5 flex-shrink-0" style={{ color: "var(--color-text-secondary)" }} />
      <span className="text-sm truncate" style={{ color: "var(--color-text)" }}>{value}</span>
    </a>
  );
}

export default function MyProfilePage() {
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [pending, setPending] = useState<PendingData | null>(null);
  const [monthly, setMonthly] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [twitchSearch, setTwitchSearch] = useState("");
  const [membersList, setMembersList] = useState<{ twitchLogin: string; displayName: string }[]>([]);
  const [selectedTwitch, setSelectedTwitch] = useState<string | null>(null);

  // Formulaire descriptif + réseaux
  const [description, setDescription] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [twitter, setTwitter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    loadMembersList();
  }, []);

  useEffect(() => {
    if (selectedTwitch || !twitchSearch) {
      loadProfile();
      loadMonthly();
    }
  }, [selectedTwitch, twitchSearch]);

  async function loadMembersList() {
    try {
      const res = await fetch("/api/members/public", { cache: "no-store" });
      const data = await res.json();
      const list = (data.members || []).map((m: any) => ({
        twitchLogin: m.twitchLogin,
        displayName: m.displayName || m.twitchLogin,
      }));
      setMembersList(list);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadProfile() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTwitch) params.set("twitchLogin", selectedTwitch);
      const res = await fetch(`/api/members/me?${params}`, { cache: "no-store" });
      if (!res.ok) {
        setMember(null);
        setPending(null);
        return;
      }
      const data = await res.json();
      setMember(data.member);
      setPending(data.pending);
      setDescription(data.pending?.description ?? data.member?.bio ?? "");
      setInstagram(data.pending?.instagram ?? data.member?.socials?.instagram ?? "");
      setTiktok(data.pending?.tiktok ?? data.member?.socials?.tiktok ?? "");
      setTwitter(data.pending?.twitter ?? data.member?.socials?.twitter ?? "");
    } catch (e) {
      console.error(e);
      setMember(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadMonthly() {
    if (!member && !selectedTwitch) return;
    try {
      const params = new URLSearchParams();
      if (selectedTwitch) params.set("twitchLogin", selectedTwitch);
      const res = await fetch(`/api/members/me/monthly?${params}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMonthly(data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSubmitProfile(e: React.FormEvent) {
    e.preventDefault();
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
          twitchLogin: member?.twitchLogin || selectedTwitch,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitSuccess(true);
        loadProfile();
      } else {
        alert(data.error || "Erreur lors de la soumission");
      }
    } catch (e) {
      alert("Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredMembers = membersList.filter(
    (m) =>
      m.twitchLogin.toLowerCase().includes(twitchSearch.toLowerCase()) ||
      m.displayName.toLowerCase().includes(twitchSearch.toLowerCase())
  );

  if (loading && !member) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg)" }}>
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen px-8 py-8" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
        <h1 className="text-3xl font-bold mb-6">Mon Profil</h1>
        <div className="rounded-xl border p-8" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <p className="mb-4" style={{ color: "var(--color-text-secondary)" }}>
            Sélectionne ton pseudo Twitch pour accéder à ton profil.
          </p>
          <div className="relative max-w-md">
            <input
              type="text"
              value={twitchSearch}
              onChange={(e) => setTwitchSearch(e.target.value)}
              placeholder="Rechercher ton pseudo..."
              className="w-full px-4 py-3 rounded-lg border"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
            />
            {twitchSearch && filteredMembers.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border max-h-48 overflow-y-auto z-10" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                {filteredMembers.slice(0, 10).map((m) => (
                  <button
                    key={m.twitchLogin}
                    type="button"
                    onClick={() => {
                      setSelectedTwitch(m.twitchLogin);
                      setTwitchSearch("");
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-opacity-80 transition-colors"
                    style={{ color: "var(--color-text)" }}
                  >
                    {m.displayName} (@{m.twitchLogin})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const roleStyles = getRoleBadgeStyles(member.role);
  const hasAnySocial = member.socials.instagram || member.socials.tiktok || member.socials.twitter || member.socials.discord;

  return (
    <div className="min-h-screen px-8 py-8" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Mon Profil</h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>
          Gère tes informations et consulte tes statistiques TENF
        </p>

        {/* Header profil + badge statut */}
        <div className="rounded-xl border p-6 mb-8" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex items-start gap-4">
              <img src={member.avatar} alt={member.displayName} className="w-20 h-20 rounded-full object-cover border-2" style={{ borderColor: "var(--color-primary)" }} />
              <div>
                <h2 className="text-2xl font-bold mb-1">{member.displayName}</h2>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: roleStyles.bg, color: roleStyles.text, borderColor: roleStyles.border || roleStyles.bg }}>
                    {member.role}
                  </span>
                  <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text-secondary)" }}>
                    ID : {member.memberId}
                  </span>
                  <StatusBadge status={member.profileValidationStatus as ProfileStatus} />
                </div>
                {member.memberSince && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    <Calendar className="w-4 h-4" />
                    Membre depuis {member.memberSince}
                  </div>
                )}
              </div>
            </div>

            {/* Réseaux - affichés uniquement si renseignés */}
            {hasAnySocial && (
              <div className="lg:ml-auto lg:w-64">
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-secondary)" }}>Réseaux</h3>
                <div className="space-y-2">
                  {member.socials.twitch && (
                    <SocialLink icon={Twitch} label="Twitch" value={member.twitchLogin} url={member.socials.twitch} />
                  )}
                  {member.socials.discord && <SocialLink icon={MessageCircle} label="Discord" value={member.socials.discord} />}
                  {member.socials.instagram && <SocialLink icon={Instagram} label="Instagram" value={member.socials.instagram} />}
                  {member.socials.tiktok && <SocialLink icon={Music2} label="TikTok" value={member.socials.tiktok} />}
                  {member.socials.twitter && <SocialLink icon={Twitter} label="X/Twitter" value={member.socials.twitter} />}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TENF — Mois en cours */}
        <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--color-text)" }}>TENF — Mois en cours</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-lg border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" style={{ color: "#9146ff" }} />
              <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>Raids TENF</span>
            </div>
            <p className="text-2xl font-bold">{monthly?.raidsTENF ?? 0}</p>
          </div>
          <div className="rounded-lg border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5" style={{ color: "#10b981" }} />
              <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>Présence Spotlight</span>
            </div>
            <p className="text-2xl font-bold">{monthly?.spotlightPresence?.rate ?? 0}%</p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
              {monthly?.spotlightPresence?.present ?? 0}/{monthly?.spotlightPresence?.total ?? 0} spotlights
            </p>
          </div>
          <div className="rounded-lg border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5" style={{ color: "#5865F2" }} />
              <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>Classement Messages</span>
            </div>
            <p className="text-2xl font-bold">#{monthly?.messagesRanking?.rank || "-"}</p>
          </div>
          <div className="rounded-lg border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Mic className="w-5 h-5" style={{ color: "#f59e0b" }} />
              <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>Classement Vocaux</span>
            </div>
            <p className="text-2xl font-bold">#{monthly?.vocalRanking?.rank || "-"}</p>
          </div>
        </div>

        {/* Descriptif de chaîne + Réseaux à remplir */}
        <div className="rounded-xl border p-6 mb-8" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <h2 className="text-xl font-semibold mb-2">Descriptif de chaîne</h2>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
            Remplis ici ton descriptif et tes réseaux. Les modifications seront soumises à validation par le staff avant affichage sur la page Membres.
          </p>

          <form onSubmit={handleSubmitProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>Descriptif (max {MAX_DESCRIPTION} caractères)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={MAX_DESCRIPTION}
                rows={4}
                placeholder="Décris ta chaîne, ton univers..."
                className="w-full px-4 py-3 rounded-lg border resize-none"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
              />
              <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>{description.length}/{MAX_DESCRIPTION}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>Instagram</label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@username"
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>TikTok</label>
                <input
                  type="text"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  placeholder="@username"
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>X / Twitter</label>
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="@username"
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />
              </div>
            </div>

            {submitSuccess && (
              <p className="text-sm text-green-500">Modifications soumises pour validation par le staff.</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? "Envoi..." : "Soumettre pour validation"}
            </button>
          </form>
        </div>

        {/* Résumé TENF */}
        <div className="rounded-xl border p-6" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <h2 className="text-xl font-semibold mb-4">Résumé TENF</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>Rôle</p>
              <span className="px-3 py-1 rounded-full text-sm font-semibold border" style={{ backgroundColor: roleStyles.bg, color: roleStyles.text, borderColor: roleStyles.border || roleStyles.bg }}>
                {member.tenfSummary.role}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>Statut</p>
              <span className="text-sm font-semibold" style={{ color: member.tenfSummary.status === "Actif" ? "#10b981" : "#6b7280" }}>
                {member.tenfSummary.status}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>Intégration</p>
              <p className="text-sm">{member.tenfSummary.integration.integrated ? `Oui (${member.tenfSummary.integration.date || "-"})` : "Non"}</p>
            </div>
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>Parrain</p>
              <p className="text-sm">{member.tenfSummary.parrain || "Non renseigné"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
