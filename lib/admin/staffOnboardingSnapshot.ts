/**
 * Données onboarding staff — mêmes endpoints que /admin/onboarding/staff
 * (page inscription-moderateur). Centralisé pour la version mobile et le bureau.
 */

import {
  computeStaffSessionStaffing,
  type StaffSessionStaffingStats,
} from "@/lib/integrationStaffSessionRules";

export type StaffOnboardingIntegration = {
  id: string;
  title: string;
  description: string;
  image?: string;
  date: string;
  category: string;
  location?: string;
};

export type StaffOnboardingRegistrationRow = {
  id: string;
  pseudo: string;
  role: string;
  roleKey?: string | null;
  placement: string;
  registeredAt?: string;
};

export type StaffOnboardingModeratorStats = StaffSessionStaffingStats & {
  registrations: StaffOnboardingRegistrationRow[];
  /** @deprecated Utiliser adminModeratorCount */
  adminCount: number;
};

export type StaffOnboardingRegistrationStats = {
  normalCount: number;
};

export type StaffOnboardingSnapshot = {
  integrations: StaffOnboardingIntegration[];
  moderatorStats: Record<string, StaffOnboardingModeratorStats>;
  registrationStats: Record<string, StaffOnboardingRegistrationStats>;
};

function mapModeratorStats(
  registrations: StaffOnboardingRegistrationRow[],
): StaffOnboardingModeratorStats {
  const staffing = computeStaffSessionStaffing(registrations);
  return {
    ...staffing,
    registrations,
    adminCount: staffing.adminModeratorCount,
  };
}

export async function loadStaffOnboardingSnapshot(): Promise<StaffOnboardingSnapshot> {
  const response = await fetch("/api/integrations?admin=true", {
    cache: "no-store",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Impossible de charger les sessions.");
  }
  const data = await response.json();
  const integrationsList: StaffOnboardingIntegration[] = data.integrations || [];

  const moderatorStats: Record<string, StaffOnboardingModeratorStats> = {};
  const registrationStats: Record<string, StaffOnboardingRegistrationStats> = {};

  await Promise.all(
    integrationsList.map(async (integration) => {
      try {
        const modResponse = await fetch(`/api/integrations/${integration.id}/moderators`, {
          cache: "no-store",
          credentials: "include",
        });
        if (modResponse.ok) {
          const modData = await modResponse.json();
          const registrations = (modData.registrations || []) as StaffOnboardingRegistrationRow[];
          moderatorStats[integration.id] = modData.staffing
            ? {
                ...(modData.staffing as StaffSessionStaffingStats),
                registrations,
                adminCount: (modData.staffing as StaffSessionStaffingStats).adminModeratorCount,
              }
            : mapModeratorStats(registrations);
        } else {
          moderatorStats[integration.id] = mapModeratorStats([]);
        }

        const regResponse = await fetch(`/api/admin/integrations/${integration.id}/registrations`, {
          cache: "no-store",
          credentials: "include",
        });
        if (regResponse.ok) {
          const regData = await regResponse.json();
          const normalRegistrations = regData.registrations || [];
          registrationStats[integration.id] = {
            normalCount: normalRegistrations.length,
          };
        } else {
          registrationStats[integration.id] = { normalCount: 0 };
        }
      } catch {
        moderatorStats[integration.id] = mapModeratorStats([]);
        registrationStats[integration.id] = { normalCount: 0 };
      }
    }),
  );

  return { integrations: integrationsList, moderatorStats, registrationStats };
}
