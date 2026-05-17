"use client";

import Link from "next/link";
import {
  ClipboardList,
  GraduationCap,
  LayoutList,
  ListChecks,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { cockpitBtnClass, cockpitPanelClass, hubFocusRingClass } from "./membersHubStyles";

type ReminderItem = {
  tone: string;
  dot: string;
  content: ReactNode;
};

type Props = {
  pendingTotal: number;
  profileValidationPending?: number;
  incomplete?: number;
};

const STAFF_REMINDERS: ReminderItem[] = [
  {
    tone: "text-amber-200",
    dot: "bg-amber-300",
    content: (
      <>
        Commence toujours par <strong className="text-zinc-100">À traiter aujourd&apos;hui</strong> : chaque ligne est
        un raccourci vers la page qui règle le problème.
      </>
    ),
  },
  {
    tone: "text-rose-200",
    dot: "bg-rose-300",
    content: (
      <>
        <strong className="text-zinc-100">Urgent</strong> = un créateur est bloqué (validation, sync, erreur).{" "}
        <strong className="text-zinc-100">Important</strong> = à traiter cette semaine sans blocage immédiat.
      </>
    ),
  },
  {
    tone: "text-violet-200",
    dot: "bg-violet-300",
    content: (
      <>
        <strong className="text-zinc-100">Liste & gestion</strong> sert à chercher un pseudo, changer un rôle (ex. Nouveau
        → Affilié) ou faire une action de masse — ce n&apos;est pas la file des tâches.
      </>
    ),
  },
  {
    tone: "text-emerald-200",
    dot: "bg-emerald-300",
    content: (
      <>
        Après une <strong className="text-zinc-100">session d&apos;accueil</strong>, passe par{" "}
        <Link href="/admin/onboarding" className="text-violet-200 underline-offset-2 hover:underline">
          Intégration
        </Link>{" "}
        (présences, activation) avant d&apos;activer le profil ici.
      </>
    ),
  },
  {
    tone: "text-sky-200",
    dot: "bg-sky-300",
    content: (
      <>
        <strong className="text-zinc-100">Validation profil</strong> = un créateur a soumis sa fiche pour contrôle staff.
        Ce n&apos;est pas lié aux événements communauté ni aux inscriptions intégration.
      </>
    ),
  },
];

const RECOMMENDED_PATH = [
  "Lire la phrase du jour et la file « À traiter » sur cette page.",
  "Cliquer chaque ligne urgente jusqu'à ce que la file se vide (ou basculer sur Actions pour tout voir).",
  "Chercher ou mettre à jour un créateur dans Liste & gestion si on te donne un pseudo.",
  "Si le membre vient d'une session d'accueil : hub Intégration d'abord, puis retour ici.",
  "Signaux faibles en bas de page = à surveiller, pas forcément urgent.",
];

export default function MembersHubCockpitAside({
  pendingTotal,
  profileValidationPending = 0,
  incomplete = 0,
}: Props) {
  const dynamicReminders: ReminderItem[] = [...STAFF_REMINDERS];
  if (profileValidationPending > 0) {
    dynamicReminders.unshift({
      tone: "text-amber-200",
      dot: "bg-amber-400",
      content: (
        <>
          <strong className="text-zinc-100">{profileValidationPending}</strong> validation
          {profileValidationPending > 1 ? "s" : ""} profil en attente — priorise{" "}
          <Link
            href="/admin/membres/validation-profil"
            className="text-violet-200 underline-offset-2 hover:underline"
          >
            Validation profil
          </Link>
          .
        </>
      ),
    });
  }
  if (incomplete > 0) {
    dynamicReminders.push({
      tone: "text-zinc-300",
      dot: "bg-zinc-400",
      content: (
        <>
          <strong className="text-zinc-100">{incomplete}</strong> fiche{incomplete > 1 ? "s" : ""} incomplète
          {incomplete > 1 ? "s" : ""} (&lt; 80 %) : accompagnement via{" "}
          <Link href="/admin/membres/incomplets" className="text-violet-200 underline-offset-2 hover:underline">
            Profils incomplets
          </Link>
          .
        </>
      ),
    });
  }

  return (
    <>
      <div className={`${cockpitPanelClass} p-4 sm:p-5`}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Rappels staff</h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          Règles simples pour l&apos;équipe — pas besoin de connaître tout le site par cœur.
        </p>
        <ul className="mt-3 space-y-3 text-sm leading-relaxed">
          {dynamicReminders.map((item, i) => (
            <li key={i} className={`flex gap-2.5 ${item.tone}`}>
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.dot}`} aria-hidden />
              <span>{item.content}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={`${cockpitPanelClass} p-4 sm:p-5`}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Parcours conseillé</h2>
        <ol className="mt-3 space-y-2.5 text-sm text-zinc-400">
          {RECOMMENDED_PATH.map((step, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-bold tabular-nums text-violet-300">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className={`${cockpitPanelClass} p-4`}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Agir maintenant</h2>
        <div className="mt-3 flex flex-col gap-2">
          <Link
            href="/admin/membres/actions"
            className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center border-rose-400/30 bg-rose-950/25 text-rose-100`}
          >
            <ListChecks className="h-4 w-4 shrink-0" aria-hidden />
            File complète
            {pendingTotal > 0 ? (
              <span className="rounded-md bg-black/25 px-1.5 py-0.5 text-xs font-bold tabular-nums">{pendingTotal}</span>
            ) : null}
          </Link>
          <Link href="/admin/membres/gestion" className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center`}>
            <LayoutList className="h-4 w-4 shrink-0" aria-hidden />
            Liste & gestion
          </Link>
          <Link
            href="/admin/membres/validation-profil"
            className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center ${
              profileValidationPending > 0
                ? "border-amber-400/30 bg-amber-950/25 text-amber-100"
                : "border-white/10 bg-white/[0.04] text-zinc-300"
            }`}
          >
            <UserCheck className="h-4 w-4 shrink-0" aria-hidden />
            Validation profil
            {profileValidationPending > 0 ? (
              <span className="rounded-md bg-black/25 px-1.5 py-0.5 text-xs font-bold tabular-nums">
                {profileValidationPending}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      <div className={`${cockpitPanelClass} p-4`}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Liens utiles</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <Link
              href="/admin/membres/incomplets"
              className={`text-violet-200 hover:text-white ${hubFocusRingClass} rounded`}
            >
              Profils incomplets
            </Link>
          </li>
          <li>
            <Link
              href="/admin/membres/qualite-data"
              className={`text-violet-200 hover:text-white ${hubFocusRingClass} rounded`}
            >
              Qualité des données
            </Link>
          </li>
          <li>
            <Link
              href="/admin/onboarding"
              className={`text-violet-200 hover:text-white ${hubFocusRingClass} rounded`}
            >
              Hub intégration (sessions d&apos;accueil)
            </Link>
          </li>
          <li>
            <Link href="/integration" target="_blank" rel="noopener noreferrer" className={`text-violet-200 hover:text-white ${hubFocusRingClass} rounded`}>
              Parcours public /integration
            </Link>
          </li>
          <li>
            <Link href="/admin/pilotage" className={`text-zinc-500 hover:text-zinc-300 ${hubFocusRingClass} rounded text-xs`}>
              Pilotage TENF
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}
