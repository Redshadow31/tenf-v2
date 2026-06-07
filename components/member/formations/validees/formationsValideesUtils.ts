import {
  isFormationEventCategory,
  mergeFormationHistoryIntoMap,
} from "@/lib/member/memberOverviewAttendance";

export { FORMATIONS_CATALOG_ACCENT as FORMATIONS_VALIDEES_ACCENT } from "@/components/member/formations/catalog/formationsCatalogUtils";

export type FormationEntry = {
  id: string;
  title: string;
  date: string;
  category: string;
};

export type MonthFormationHistory = {
  monthKey: string;
  validated: number;
};

export type FormationTier = {
  label: string;
  color: string;
};

export function isFormationCategory(category?: string): boolean {
  return isFormationEventCategory(category);
}

export function formatMonthLabel(key: string): string {
  const [, month] = key.split("-");
  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];
  const year = key.split("-")[0];
  const monthIndex = Number(month) - 1;
  return `${monthNames[monthIndex] || "Mois"} ${year}`;
}

export function formatMonthShort(key: string): string {
  const [year, month] = key.split("-");
  const short = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const i = Number(month) - 1;
  return `${short[i] || "mois"} ${year}`;
}

export function getLast12Months(): string[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, idx) => {
    const date = new Date(now.getFullYear(), now.getMonth() - idx, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }).reverse();
}

export function getFormationTier(validatedCount: number): FormationTier {
  if (validatedCount >= 4) return { label: "Masterclass", color: "#d4af37" };
  if (validatedCount >= 3) return { label: "Pilier", color: "#60a5fa" };
  if (validatedCount >= 2) return { label: "Régulier", color: "#34d399" };
  if (validatedCount >= 1) return { label: "En route", color: "#f59e0b" };
  return { label: "Démarrage", color: "#f87171" };
}

export function previousMonthKey(monthKey: string): string {
  if (!monthKey) return "";
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(year, month - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function buildFormationsByMonth(data: {
  attendance?: {
    monthEventsByMonth?: Array<{
      monthKey: string;
      events: Array<{ id: string; title: string; date: string; category: string; attended?: boolean }>;
    }>;
  };
  formationHistory?: Array<{ id: string; title: string; date: string }>;
} | null): Map<string, FormationEntry[]> {
  if (!data) return new Map();

  const map = new Map<string, FormationEntry[]>();

  for (const monthBlock of data.attendance?.monthEventsByMonth || []) {
    const formations = monthBlock.events
      .filter((event) => event.attended && isFormationCategory(event.category))
      .map((event) => ({
        id: event.id,
        title: event.title,
        date: event.date,
        category: event.category,
      }));
    if (formations.length > 0) {
      map.set(monthBlock.monthKey, formations);
    }
  }

  return mergeFormationHistoryIntoMap(map, data.formationHistory ?? []);
}
