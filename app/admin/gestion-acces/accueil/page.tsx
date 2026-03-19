"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Lock, Settings, ShieldCheck, Sparkles, Users } from "lucide-react";
import { getDiscordUser } from "@/lib/discord";

type QuickCard = {
  href: string;
  title: string;
  description: string;
  badge: string;
};

const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-[#0f1118]";

const accessCards: QuickCard[] = [
  {
    href: "/admin/gestion-acces",
    title: "Comptes administrateurs",
    description: "Ajouter, modifier et retirer les accès de l'équipe admin.",
    badge: "Sécurité",
  },
  {
    href: "/admin/gestion-acces/permissions",
    title: "Permissions par section",
    description: "Définir précisément les droits par page et par rôle.",
    badge: "RBAC",
  },
  {
    href: "/admin/gestion-acces/admin-avance",
    title: "Admin avancé",
    description: "Accès sensible réservé aux fondateurs.",
    badge: "Critique",
  },
];

const dataCards: QuickCard[] = [
  {
    href: "/admin/gestion-acces/dashboard",
    title: "Paramètres dashboard",
    description: "Mettre à jour les données manuelles affichées dans les dashboards.",
    badge: "Config",
  },
  {
    href: "/admin/gestion-acces/images",
    title: "Images profils Twitch",
    description: "Synchroniser les avatars et corriger les profils incomplets.",
    badge: "Qualité data",
  },
  {
    href: "/admin/migration",
    title: "Migration des données",
    description: "Contrôler les synchronisations legacy vers Supabase.",
    badge: "Fiabilité",
  },
];

const structureCards: QuickCard[] = [
  {
    href: "/admin/gestion-acces/organigramme-staff",
    title: "Organigramme staff",
    description: "Maintenir la vue publique des rôles, pôles et statuts.",
    badge: "Organisation",
  },
  {
    href: "/admin/follow/config",
    title: "Configuration follow staff",
    description: "Piloter la configuration des feuilles de suivi staff.",
    badge: "Process",
  },
  {
    href: "/admin/audit-logs",
    title: "Audit & conformité",
    description: "Centraliser les traces d'actions et les vérifications.",
    badge: "Conformité",
  },
  {
    href: "/admin/gestion-acces/retours-faq",
    title: "Retours FAQ rejoindre",
    description: "Traiter les demandes envoyées depuis la FAQ publique.",
    badge: "Support",
  },
];

function HeroStat({
  label,
  value,
  state = "neutral",
}: {
  label: string;
  value: string;
  state?: "ok" | "warn" | "neutral";
}) {
  const stateClass =
    state === "ok"
      ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-200"
      : state === "warn"
      ? "border-amber-500/35 bg-amber-500/10 text-amber-200"
      : "border-white/15 bg-white/[0.04] text-gray-200";

  return (
    <div className={`rounded-xl border px-3 py-2 ${stateClass}`}>
      <p className="text-[10px] uppercase tracking-[0.11em] text-gray-300">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function SectionCards({ title, cards }: { title: string; cards: QuickCard[] }) {
  return (
    <section className="rounded-2xl border p-5" style={{ borderColor: "rgba(212,175,55,0.2)", background: "rgba(18,18,24,0.78)" }}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <span className="rounded-full border border-white/15 px-2.5 py-1 text-[11px] uppercase tracking-[0.09em] text-gray-300">
          {cards.length} pages
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`group rounded-xl border p-4 transition ${focusRingClass} hover:-translate-y-[1px]`}
            style={{
              borderColor: "rgba(255,255,255,0.12)",
              background: "linear-gradient(145deg, rgba(29,30,38,0.9), rgba(19,19,24,0.9))",
            }}
          >
            <div className="mb-3 inline-flex rounded-full border border-[#d4af37]/35 bg-[#d4af37]/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.09em] text-[#f4db97]">
              {card.badge}
            </div>
            <h3 className="text-base font-semibold text-white transition-colors group-hover:text-[#f4db97]">{card.title}</h3>
            <p className="mt-1 text-sm text-gray-300">{card.description}</p>
            <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#d8b96b]">
              Ouvrir
              <ArrowUpRight size={13} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function AdministrationAccueilPage() {
  const [username, setUsername] = useState("Admin");
  const [roleLabel, setRoleLabel] = useState<string | null>(null);
  const [advancedEnabled, setAdvancedEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadContext() {
      try {
        const [user, roleRes, advancedRes, aliasRes] = await Promise.all([
          getDiscordUser(),
          fetch("/api/user/role", { cache: "no-store" }),
          fetch("/api/admin/advanced-access?check=1", { cache: "no-store" }),
          fetch("/api/admin/access/self", { cache: "no-store" }),
        ]);

        if (!mounted) return;

        if (user?.username) {
          setUsername(user.username);
        }
        if (aliasRes.ok) {
          const aliasData = await aliasRes.json();
          const alias = typeof aliasData?.adminAlias === "string" ? aliasData.adminAlias.trim() : "";
          if (alias) setUsername(alias);
        }

        if (roleRes.ok) {
          const roleData = await roleRes.json();
          setRoleLabel(typeof roleData?.role === "string" ? roleData.role : null);
        }

        if (advancedRes.ok) {
          const advancedData = await advancedRes.json();
          setAdvancedEnabled(advancedData?.canAccessAdvanced === true);
        }
      } catch {
        // fallback silencieux
      }
    }

    void loadContext();
    return () => {
      mounted = false;
    };
  }, []);

  const totalPages = useMemo(
    () => accessCards.length + dataCards.length + structureCards.length,
    []
  );

  return (
    <div className="space-y-6 text-white">
      <section
        className="rounded-3xl border p-6 md:p-8"
        style={{
          borderColor: "rgba(212,175,55,0.24)",
          background:
            "radial-gradient(circle at 12% 12%, rgba(212,175,55,0.22), rgba(25,25,32,0.97) 40%)",
          boxShadow: "0 20px 45px rgba(0, 0, 0, 0.28)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "rgba(230, 201, 128, 0.9)" }}>
              Administration du site
            </p>
            <h1 className="mt-3 text-2xl font-semibold sm:text-3xl md:text-4xl">Bonjour {username}</h1>
            <p className="mt-2 text-sm text-[rgba(236,236,239,0.84)] md:text-base">
              Merci pour ton aide quotidienne. Clara, Nexou et Red te remercient pour ton implication.
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.11em] text-[rgba(222,209,170,0.86)]">
              {roleLabel || "Rôle non détecté"}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <HeroStat label="Pages opérationnelles" value={String(totalPages)} state="neutral" />
            <HeroStat
              label="Accès admin avancé"
              value={advancedEnabled ? "Autorisé" : "Verrouillé"}
              state={advancedEnabled ? "ok" : "warn"}
            />
            <HeroStat label="Périmètre" value="Accès · Data · Audit" state="neutral" />
            <HeroStat label="Mode" value="Pilotage administration" state="ok" />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/admin/gestion-acces"
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:-translate-y-[1px] ${focusRingClass}`}
            style={{ backgroundColor: "rgba(212,175,55,0.95)", color: "#201b12" }}
          >
            <ShieldCheck size={14} />
            Ouvrir comptes administrateurs
          </Link>
          <Link
            href="/admin/gestion-acces/permissions"
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-[1px] ${focusRingClass}`}
            style={{ borderColor: "rgba(255,255,255,0.18)", backgroundColor: "rgba(255,255,255,0.05)" }}
          >
            <Lock size={14} />
            Ouvrir permissions
          </Link>
          <Link
            href="/admin/gestion-acces/dashboard"
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-[1px] ${focusRingClass}`}
            style={{ borderColor: "rgba(255,255,255,0.18)", backgroundColor: "rgba(255,255,255,0.05)" }}
          >
            <Settings size={14} />
            Ouvrir paramètres dashboard
          </Link>
        </div>
      </section>

      <section
        className="grid grid-cols-1 gap-3 rounded-2xl border p-4 lg:grid-cols-3"
        style={{
          borderColor: "rgba(138,180,248,0.24)",
          background: "linear-gradient(145deg, rgba(18,25,38,0.8), rgba(13,19,29,0.88))",
        }}
      >
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <Users size={15} />
            À traiter maintenant
          </p>
          <p className="mt-1 text-xs text-gray-300">Vérifier les nouveaux admins, rôles et sorties d'équipe.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles size={15} />
            Qualité de la configuration
          </p>
          <p className="mt-1 text-xs text-gray-300">Centraliser les réglages dashboard pour éviter la dette manuelle.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <ShieldCheck size={15} />
            Audit continu
          </p>
          <p className="mt-1 text-xs text-gray-300">Suivre les actions sensibles et conserver une traçabilité claire.</p>
        </div>
      </section>

      <SectionCards title="Accès & sécurité" cards={accessCards} />
      <SectionCards title="Configuration & données" cards={dataCards} />
      <SectionCards title="Organisation & conformité" cards={structureCards} />
    </div>
  );
}

