/**
 * Données onboarding staff — mêmes endpoints que /admin/onboarding/staff
 * (page inscription-moderateur). Centralisé pour la version mobile et le bureau.
 */

export type StaffOnboardingIntegration = {
  id: string;
  title: string;
  description: string;
  image?: string;
  date: string;
  category: string;
  location?: string;
};

export type StaffOnboardingModeratorStats = {
  total: number;
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
          const registrations = modData.registrations || [];
          const adminCount = registrations.filter(
            (r: { role?: string }) => r.role && String(r.role).toLowerCase().includes("admin")
          ).length;
          moderatorStats[integration.id] = {
            total: registrations.length,
            adminCount,
          };
        } else {
          moderatorStats[integration.id] = { total: 0, adminCount: 0 };
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
        moderatorStats[integration.id] = { total: 0, adminCount: 0 };
        registrationStats[integration.id] = { normalCount: 0 };
      }
    })
  );

  return { integrations: integrationsList, moderatorStats, registrationStats };
}
