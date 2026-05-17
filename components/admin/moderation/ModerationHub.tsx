"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  FileCheck2,
  ListTodo,
  Megaphone,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  UserCog,
} from "lucide-react";
import { MUI, muiCardStyle } from "@/components/admin/moderation/moderation-ui";
import ModerationPageShell from "@/components/admin/moderation/ModerationPageShell";
import ModerationGroupCard from "@/components/admin/moderation/ModerationGroupCard";
import QuestionnaireHubCard from "@/components/admin/moderation/questionnaire/QuestionnaireHubCard";
import { QuestionnaireHubProvider } from "@/components/admin/moderation/questionnaire/QuestionnaireHubContext";
import StaffHubHeaderAside from "@/components/admin/moderation/StaffHubHeaderAside";
import {
  MODERATION_BASE,
  MODERATION_STAFF_BASE,
  buildModerationHref,
  getGroupsForView,
  type ModerationView,
} from "@/lib/moderation/moderationTree";

const STAFF_ATTENUATE_MODULE_SLUGS = ["questionnaire-posture"];

type ModerationHubProps = {
  view: ModerationView;
  canPilot: boolean;
  charterSigned: boolean;
  username: string;
};

export default function ModerationHub({
  view,
  canPilot,
  charterSigned,
  username,
}: ModerationHubProps) {
  const router = useRouter();
  const groups = useMemo(() => getGroupsForView(view), [view]);

  const breadcrumb: Array<{ label: string; href?: string }> = useMemo(() => {
    const items: Array<{ label: string; href?: string }> = [
      { label: "Admin", href: "/admin" },
      { label: "Modération", href: MODERATION_BASE },
    ];
    items.push({ label: view === "staff" ? "Vue modérateur" : "Vue admin" });
    return items;
  }, [view]);

  const handleSwitchView = (next: ModerationView) => {
    if (next === view) return;
    router.push(next === "admin" ? MODERATION_BASE : MODERATION_STAFF_BASE);
  };

  const attenuateModuleSlugs =
    view === "staff" ? STAFF_ATTENUATE_MODULE_SLUGS : [];

  const hubContent = (
    <div className="space-y-[clamp(0.75rem,1vw,1.15rem)]">
        <TodoNowBlock
          view={view}
          charterSigned={charterSigned}
          username={username}
        />

        {view === "staff" ? (
          <QuestionnaireHubCard view="staff" variant="banner" />
        ) : null}

        <section
          aria-labelledby="moderation-hub-groups"
          className="space-y-[clamp(0.55rem,0.75vw,0.85rem)]"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className={MUI.sectionLabel}>Sections</p>
              <h2
                id="moderation-hub-groups"
                className={`text-pretty font-bold tracking-tight ${MUI.text}`}
                style={{ fontSize: "clamp(0.95rem,1.1vw,1.15rem)" }}
              >
                {view === "admin"
                  ? "Tout ce que tu peux piloter"
                  : "Tout ce qui te concerne en tant que modérateur"}
              </h2>
              <p
                className={`mt-1 max-w-[65ch] text-pretty ${MUI.textMuted}`}
                style={{ fontSize: "clamp(0.72rem,0.8vw,0.82rem)" }}
              >
                Catalogue complet des modules — les priorités du moment sont listées
                ci-dessus.
              </p>
            </div>
            {view === "staff" && canPilot ? (
              <Link href={MODERATION_BASE} className={MUI.btnGhost}>
                <Compass className="h-3.5 w-3.5" aria-hidden />
                Vue admin
              </Link>
            ) : null}
            {view === "admin" ? (
              <Link href={MODERATION_STAFF_BASE} className={MUI.btnGhost}>
                <UserCog className="h-3.5 w-3.5" aria-hidden />
                Vue modérateur
              </Link>
            ) : null}
          </div>

          <div className="grid gap-[clamp(0.55rem,0.85vw,1rem)] sm:grid-cols-2 2xl:grid-cols-3">
            {groups.map((group) => (
              <ModerationGroupCard
                key={group.slug}
                group={group}
                view={view}
                attenuateModuleSlugs={attenuateModuleSlugs}
              />
            ))}
            {view === "admin" ? <QuestionnaireHubCard view="admin" variant="card" /> : null}
          </div>
        </section>
    </div>
  );

  return (
    <ModerationPageShell
      breadcrumb={breadcrumb}
      title="Centre de modération TENF"
      description="Charte, exercices, annonces staff, comptes-rendus et suivi des actions. Hub unique pour piloter et opérer la modération du serveur."
      icon={ShieldCheck}
      audienceLabel={view === "admin" ? "Vue admin" : "Vue modérateur"}
      detachedContent
      rightSlot={
        <StaffHubHeaderAside
          view={view}
          charterSigned={charterSigned}
          canPilot={canPilot}
          viewToggle={canPilot ? { current: view, onChange: handleSwitchView } : null}
        />
      }
    >
      {view === "staff" ? (
        <QuestionnaireHubProvider enabled>{hubContent}</QuestionnaireHubProvider>
      ) : (
        hubContent
      )}
    </ModerationPageShell>
  );
}

function TodoNowBlock({
  view,
  charterSigned,
  username,
}: {
  view: ModerationView;
  charterSigned: boolean;
  username: string;
}) {
  const items =
    view === "staff" ? buildStaffTodo(charterSigned) : buildAdminTodo();

  const primaryItems = items.filter((i) => i.emphasis === "primary" || i.urgent);
  const otherItems = items.filter((i) => i.emphasis !== "primary" && !i.urgent);

  return (
    <section aria-label="À faire maintenant" className="rounded-[clamp(0.85rem,1.2vw,1.2rem)] border" style={muiCardStyle}>
      <header
        className={MUI.panelHeader}
        style={{
          paddingInline: "clamp(0.75rem, 0.6rem + 0.7vw, 1.15rem)",
          paddingBlock: "clamp(0.55rem, 0.45rem + 0.55vw, 0.85rem)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className={MUI.iconAmber} aria-hidden>
              <Target className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className={MUI.sectionLabel}>
                {view === "staff" ? `Bonjour ${username}` : `Pilotage ${username}`}
              </p>
              <h2
                className={`text-pretty font-bold tracking-tight ${MUI.text}`}
                style={{ fontSize: "clamp(0.9rem,1.02vw,1.05rem)", lineHeight: 1.2 }}
              >
                À faire maintenant
              </h2>
            </div>
          </div>
          <p
            className={`max-w-md text-pretty ${MUI.textMuted}`}
            style={{ fontSize: "clamp(0.7rem,0.78vw,0.8rem)" }}
          >
            Les priorités ci-dessous changent selon ton état. Les sections plus bas
            restent le catalogue complet.
          </p>
        </div>
      </header>
      <ul
        className="grid gap-[clamp(0.4rem,0.6vw,0.6rem)] sm:grid-cols-2 xl:grid-cols-3"
        style={{
          paddingInline: "clamp(0.6rem, 0.5rem + 0.6vw, 1rem)",
          paddingBlock: "clamp(0.6rem, 0.5rem + 0.6vw, 1rem)",
        }}
      >
        {primaryItems.map((item) => (
          <TodoLink key={item.title} item={item} />
        ))}
        {otherItems.map((item) => (
          <TodoLink key={item.title} item={item} muted />
        ))}
      </ul>
    </section>
  );
}

function TodoLink({ item, muted }: { item: TodoItem; muted?: boolean }) {
  const rowClass = item.urgent
    ? MUI.todoUrgent
    : muted
      ? MUI.todoMuted
      : MUI.todoPrimary;

  return (
    <li>
      <Link
        href={item.href}
        className={
          "group flex h-full min-h-[3.25rem] items-start gap-2 rounded-xl border px-3 py-2.5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60 " +
          rowClass
        }
      >
        <span
          aria-hidden
          className={
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border " +
            (item.urgent
              ? "border-rose-400/40 bg-[color-mix(in_srgb,#f43f5e_14%,var(--color-card))] text-rose-700 dark:text-rose-200"
              : `border-violet-400/30 bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-card))] text-violet-700 dark:text-violet-200`)
          }
        >
          <item.icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={`line-clamp-2 text-pretty font-bold ${MUI.text}`}
            style={{ fontSize: "clamp(0.8rem,0.9vw,0.9rem)", lineHeight: 1.25 }}
          >
            {item.title}
          </p>
          <p
            className={`mt-0.5 line-clamp-2 text-pretty ${MUI.textSecondary}`}
            style={{ fontSize: "clamp(0.7rem,0.78vw,0.78rem)" }}
          >
            {item.subtitle}
          </p>
        </div>
      </Link>
    </li>
  );
}

type TodoItem = {
  title: string;
  subtitle: string;
  href: string;
  icon: typeof ShieldAlert;
  urgent?: boolean;
  emphasis?: "primary" | "muted";
};

function buildStaffTodo(charterSigned: boolean): TodoItem[] {
  const items: TodoItem[] = [];
  if (!charterSigned) {
    items.push({
      title: "Signer la charte de modération",
      subtitle: "Lecture indispensable avant tout autre outil.",
      href: buildModerationHref("staff", "info", "charte"),
      icon: ShieldAlert,
      urgent: true,
      emphasis: "primary",
    });
  } else {
    items.push({
      title: "Charte signée",
      subtitle: "Tu peux relire et ajuster ta validation à tout moment.",
      href: buildModerationHref("staff", "info", "validation-charte"),
      icon: CheckCircle2,
      emphasis: "muted",
    });
  }
  items.push({
    title: "Questionnaire posture staff",
    subtitle: "Voir le bandeau dédié ci-dessous pour commencer ou reprendre.",
    href: "/admin/moderation/staff/questionnaire",
    icon: ClipboardCheck,
    emphasis: "muted",
  });
  items.push({
    title: "Mes exercices mensuels",
    subtitle: "Compléter les scénarios assignés ce mois-ci.",
    href: buildModerationHref("staff", "petits-travaux", "exercices-mensuels"),
    icon: ListTodo,
    emphasis: "primary",
  });
  items.push({
    title: "Dernier compte-rendu",
    subtitle: "Lire et valider le CR de réunion le plus récent.",
    href: buildModerationHref("staff", "info", "comptes-rendus-reunions"),
    icon: ScrollText,
    emphasis: "muted",
  });
  items.push({
    title: "Annonces staff",
    subtitle: "Voir les messages publiés à l'équipe modération.",
    href: buildModerationHref("staff", "info", "annonces-staff"),
    icon: Megaphone,
    emphasis: "muted",
  });
  return items;
}

function buildAdminTodo(): TodoItem[] {
  return [
    {
      title: "Validations de la charte",
      subtitle: "Voir qui a signé, lire les feedbacks reçus.",
      href: buildModerationHref("admin", "info", "charte-validations"),
      icon: FileCheck2,
      emphasis: "primary",
    },
    {
      title: "Questionnaires posture staff",
      subtitle: "Suivi des réponses, synthèses et objectifs modérateurs.",
      href: "/admin/moderation/staff/questionnaires",
      icon: ClipboardCheck,
      emphasis: "primary",
    },
    {
      title: "Assignations mensuelles",
      subtitle: "Composer la campagne d'exercices et l'attribuer.",
      href: buildModerationHref("admin", "petits-travaux", "assignations"),
      icon: ClipboardCheck,
      emphasis: "primary",
    },
    {
      title: "Annonces staff",
      subtitle: "Publier ou archiver les annonces internes.",
      href: buildModerationHref("staff", "info", "annonces-staff"),
      icon: Megaphone,
      emphasis: "muted",
    },
    {
      title: "Modules à venir",
      subtitle: "Vue d'ensemble des chantiers ouverts (config, logs, Discord).",
      href: buildModerationHref("admin", "config", "parametres"),
      icon: Sparkles,
      emphasis: "muted",
    },
    {
      title: "Cas sensibles & transferts",
      subtitle: "À brancher — file d'escalade staff vers admin.",
      href: buildModerationHref("admin", "discord", "transferts-admin"),
      icon: AlertTriangle,
      emphasis: "muted",
    },
  ];
}

