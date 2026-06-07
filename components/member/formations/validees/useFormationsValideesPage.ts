"use client";

import { useEffect, useMemo, useState } from "react";
import type { MemberOverview } from "@/components/member/hooks/useMemberOverview";
import { useMemberMonthlyGoals } from "@/components/member/hooks/useMemberMonthlyGoals";
import {
  buildFormationsByMonth,
  getLast12Months,
  previousMonthKey,
  type FormationEntry,
  type MonthFormationHistory,
} from "@/components/member/formations/validees/formationsValideesUtils";

export function useFormationsValideesPage(data: MemberOverview | null) {
  const [selectedMonth, setSelectedMonth] = useState("");
  const { goals } = useMemberMonthlyGoals(selectedMonth);

  useEffect(() => {
    setSelectedMonth(getLast12Months().slice(-1)[0] || "");
  }, []);

  const formationsByMonth = useMemo(() => buildFormationsByMonth(data), [data]);

  const selectedFormations = useMemo(
    () =>
      (formationsByMonth.get(selectedMonth) || [])
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [formationsByMonth, selectedMonth],
  );

  const monthlyHistory = useMemo<MonthFormationHistory[]>(() => {
    return getLast12Months().map((monthKey) => ({
      monthKey,
      validated: (formationsByMonth.get(monthKey) || []).length,
    }));
  }, [formationsByMonth]);

  const monthOptions = useMemo(() => getLast12Months().slice().reverse(), []);

  const totalValidated12Months = monthlyHistory.reduce((sum, item) => sum + item.validated, 0);
  const currentMonthValidated = selectedFormations.length;
  const prevKey = previousMonthKey(selectedMonth);
  const previousMonthValidated = (formationsByMonth.get(prevKey) || []).length;
  const delta = currentMonthValidated - previousMonthValidated;
  const completionRate = goals.formations > 0 ? (currentMonthValidated / goals.formations) * 100 : 0;
  const remainingToTarget = Math.max(0, goals.formations - currentMonthValidated);
  const sparklineData = monthlyHistory.filter((item) => item.validated > 0).slice(-6);
  const maxValidated = Math.max(1, ...sparklineData.map((item) => item.validated));

  return {
    selectedMonth,
    setSelectedMonth,
    goals,
    selectedFormations,
    monthlyHistory,
    monthOptions,
    formationsByMonth,
    totalValidated12Months,
    currentMonthValidated,
    delta,
    completionRate,
    remainingToTarget,
    sparklineData,
    maxValidated,
  };
}

export type { FormationEntry };
