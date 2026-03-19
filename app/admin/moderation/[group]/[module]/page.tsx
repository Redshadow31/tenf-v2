import Link from "next/link";
import { notFound } from "next/navigation";
import CharteValidationsPage from "./CharteValidationsPage";
import MonthlyExercisesAssignationsPage from "./MonthlyExercisesAssignationsPage";

const moduleLabels: Record<string, Record<string, string>> = {
  config: {
    "navigation-labels": "Navigation labels",
    "roles-permissions": "Rôles & permissions",
    parametres: "Paramètres",
  },
  logs: {
    actions: "Actions",
    "status-history": "Historique des statuts",
    exports: "Exports",
  },
  info: {
    annonces: "Annonces",
    "charte-versions": "Charte versions",
    "charte-validations": "Charte validations",
  },
  "petits-travaux": {
    "catalogue-exercices": "Catalogue exercices",
    "campagnes-mensuelles": "Campagnes mensuelles",
    assignations: "Assignations",
    soumissions: "Soumissions",
    validations: "Validations",
  },
  discord: {
    tickets: "Tickets",
    incidents: "Incidents",
    "cas-sensibles": "Cas sensibles",
    "transferts-admin": "Transferts admin",
  },
};

type AdminModerationModulePageProps = {
  params: {
    group: string;
    module: string;
  };
};

export default function AdminModerationModulePage({ params }: AdminModerationModulePageProps) {
  const title = moduleLabels[params.group]?.[params.module];
  if (!title) notFound();

  if (params.group === "info" && params.module === "charte-validations") {
    return <CharteValidationsPage />;
  }
  if (params.group === "petits-travaux" && params.module === "assignations") {
    return <MonthlyExercisesAssignationsPage />;
  }

  return (
    <div className="min-h-screen space-y-5 bg-[#0b0f1a] p-6 text-white md:p-8">
      <section className="rounded-2xl border border-[#353a50] bg-[#101523]/85 p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
          Admin / Modération / {params.group}
        </p>
        <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-slate-300">
          Module prêt pour l’intégration métier (services, validations, statuts, logs, exports).
        </p>
      </section>
      <Link
        href={`/admin/moderation/${params.group}`}
        className="inline-flex rounded-lg border border-[#3c425d] bg-[#0f1422] px-3 py-2 text-sm text-slate-200 transition hover:border-indigo-300/45 hover:bg-[#161d31]"
      >
        ← Retour au groupe
      </Link>
    </div>
  );
}
