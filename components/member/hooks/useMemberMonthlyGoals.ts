"use client";

import { useEffect, useState } from "react";

export type MemberMonthlyGoals = {
  events: number;
  spotlight: number;
  raids: number;
  formations: number;
};

const STORAGE_KEY = "member-monthly-goals-v1";

const DEFAULT_GOALS: MemberMonthlyGoals = {
  events: 6,
  spotlight: 2,
  raids: 8,
  formations: 2,
};

type GoalsMap = Record<string, Partial<MemberMonthlyGoals>>;

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function normalizeGoals(input?: Partial<MemberMonthlyGoals>): MemberMonthlyGoals {
  return {
    events: clampInt(Number(input?.events ?? DEFAULT_GOALS.events), 1, 30),
    spotlight: clampInt(Number(input?.spotlight ?? DEFAULT_GOALS.spotlight), 0, 20),
    raids: clampInt(Number(input?.raids ?? DEFAULT_GOALS.raids), 1, 40),
    formations: clampInt(Number(input?.formations ?? DEFAULT_GOALS.formations), 1, 20),
  };
}

function readGoalsMap(): GoalsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as GoalsMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeGoalsMap(map: GoalsMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getGoalsForMonth(monthKey: string): MemberMonthlyGoals {
  const map = readGoalsMap();
  return normalizeGoals(map[monthKey]);
}

export function setGoalsForMonth(monthKey: string, goals: Partial<MemberMonthlyGoals>): MemberMonthlyGoals {
  const map = readGoalsMap();
  const merged = normalizeGoals({ ...(map[monthKey] || {}), ...goals });
  map[monthKey] = merged;
  writeGoalsMap(map);
  return merged;
}

export function useMemberMonthlyGoals(monthKey: string) {
  const [goals, setGoals] = useState<MemberMonthlyGoals>(DEFAULT_GOALS);

  useEffect(() => {
    if (!monthKey) return;
    setGoals(getGoalsForMonth(monthKey));
  }, [monthKey]);

  const updateGoals = (next: Partial<MemberMonthlyGoals>) => {
    if (!monthKey) return;
    const saved = setGoalsForMonth(monthKey, next);
    setGoals(saved);
  };

  const resetGoals = () => {
    if (!monthKey) return;
    const saved = setGoalsForMonth(monthKey, DEFAULT_GOALS);
    setGoals(saved);
  };

  return { goals, updateGoals, resetGoals, defaults: DEFAULT_GOALS };
}

