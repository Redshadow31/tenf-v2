import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { hasPermission } from "@/lib/adminRoles";
import { 
  findMemberByIdentifier, 
  loadMemberDataFromStorage,
  getAllMemberData 
} from "@/lib/memberData";
import { getAllAuditLogs } from "@/lib/adminAudit";
import { loadIntegrations, loadRegistrations } from "@/lib/integrationStorage";
import { getAllFollowValidationsForMonth } from "@/lib/followStorage";
import { loadRaidsFaits, loadRaidsRecus, getCurrentMonthKey } from "@/lib/raidStorage";
import { 
  loadSectionAData, 
  loadSectionCData, 
  loadSectionDData, 
  loadFinalResult
} from "@/lib/evaluationStorage";
import { getMonthKey } from "@/lib/raidStorage";

/**
 * GET - Récupère toutes les données agrégées pour la fiche 360° d'un membre
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    if (!hasPermission(admin.id, "read")) {
      return NextResponse.json(
        { error: "Accès refusé. Permissions insuffisantes." },
        { status: 403 }
      );
    }

    const { id } = params;
    const decodedId = decodeURIComponent(id);
    const section = new URL(request.url).searchParams.get("section") || "";

    // Charger les données de base
    await loadMemberDataFromStorage();

    // Trouver le membre
    let member = findMemberByIdentifier({ twitchLogin: decodedId });
    if (!member) {
      member = findMemberByIdentifier({ discordId: decodedId });
    }
    if (!member && /^\d+$/.test(decodedId)) {
      member = findMemberByIdentifier({ twitchId: decodedId });
    }
    if (!member) {
      const allMembers = getAllMemberData();
      member = allMembers.find(
        (m) => m.displayName?.toLowerCase() === decodedId.toLowerCase()
      ) || null;
    }

    if (!member) {
      return NextResponse.json(
        { error: "Membre non trouvé" },
        { status: 404 }
      );
    }

    const memberId = member.twitchLogin || member.discordId || member.displayName;
    const result: any = {
      member: {
        ...member,
        createdAt: member.createdAt?.toISOString(),
        updatedAt: member.updatedAt?.toISOString(),
        integrationDate: member.integrationDate?.toISOString(),
      },
    };

    // Lazy loading par section
    if (!section || section === "logs") {
      // B) Historique (logs d'audit)
      try {
        const allLogs = await getAllAuditLogs({ limit: 200 });
        const memberLogs = allLogs.filter((log: any) => {
          const resourceId = String(log.resourceId || "").toLowerCase();
          const searchTerms = [
            member.twitchLogin?.toLowerCase(),
            member.discordId?.toLowerCase(),
            member.displayName?.toLowerCase(),
          ].filter(Boolean);

          return (
            (log.resourceType === "member" && searchTerms.some(term => resourceId.includes(term || ""))) ||
            (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(member.twitchLogin?.toLowerCase() || "")) ||
            (log.action && log.action.toLowerCase().includes(member.twitchLogin?.toLowerCase() || ""))
          );
        }).slice(0, 20);

        result.logs = memberLogs;
      } catch (err) {
        console.error("Error loading logs:", err);
        result.logs = [];
      }
    }

    if (!section || section === "integration") {
      // C) Intégration
      try {
        const allIntegrations = await loadIntegrations();
        const memberIntegrations = [];

        for (const integration of allIntegrations) {
          const registrations = await loadRegistrations(integration.id);
          const registration = registrations.find(
            (reg: any) =>
              reg.twitchLogin?.toLowerCase() === member.twitchLogin?.toLowerCase() ||
              reg.discordId === member.discordId ||
              reg.displayName?.toLowerCase() === member.displayName?.toLowerCase()
          );

          if (registration) {
            memberIntegrations.push({
              integration: {
                id: integration.id,
                title: integration.title,
                date: integration.date,
                category: integration.category,
              },
              registration: {
                present: registration.present,
                registeredAt: registration.registeredAt,
                notes: registration.notes,
                parrain: registration.parrain,
              },
            });
          }
        }

        result.integration = memberIntegrations.sort(
          (a, b) => new Date(b.integration.date).getTime() - new Date(a.integration.date).getTime()
        );
      } catch (err) {
        console.error("Error loading integration:", err);
        result.integration = [];
      }
    }

    if (!section || section === "engagement") {
      // D) Engagement (Follow/Raids/Présences)
      try {
        const currentMonth = getCurrentMonthKey();
        
        // Follow validations (3 derniers mois)
        const followData = [];
        const now = new Date();
        for (let i = 0; i < 3; i++) {
          const checkDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}`;
          
          try {
            const validations = await getAllFollowValidationsForMonth(monthKey);
            const memberFollows = validations.filter((validation: any) => {
              return validation.members?.some((m: any) =>
                m.twitchLogin?.toLowerCase() === member.twitchLogin?.toLowerCase()
              );
            }).map((validation: any) => ({
              month: monthKey,
              staffSlug: validation.staffSlug,
              staffName: validation.staffName,
              status: validation.members?.find((m: any) =>
                m.twitchLogin?.toLowerCase() === member.twitchLogin?.toLowerCase()
              ),
            }));
            
            followData.push(...memberFollows);
          } catch (err) {
            // Ignorer les erreurs pour les mois sans données
          }
        }

        // Raids (mois en cours + mois précédent)
        const raidsData = { sent: 0, received: 0, details: [] as any[] };
        for (let i = 0; i < 2; i++) {
          const checkDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = getMonthKey(checkDate.getFullYear(), checkDate.getMonth() + 1);
          
          try {
            const raidsFaits = await loadRaidsFaits(monthKey);
            const raidsRecus = await loadRaidsRecus(monthKey);
            
            const memberRaidsFaits = raidsFaits.filter((raid: any) =>
              raid.raider === member.twitchLogin || 
              raid.raider === member.discordId ||
              (typeof raid.raider === "string" && raid.raider.toLowerCase() === member.twitchLogin?.toLowerCase())
            );
            
            const memberRaidsRecus = raidsRecus.filter((raid: any) =>
              raid.target === member.twitchLogin || 
              raid.target === member.discordId ||
              (typeof raid.target === "string" && raid.target.toLowerCase() === member.twitchLogin?.toLowerCase())
            );

            raidsData.sent += memberRaidsFaits.reduce((sum: number, r: any) => sum + (r.count || 1), 0);
            raidsData.received += memberRaidsRecus.length;
            
            if (i === 0) {
              // Détails pour le mois en cours
              raidsData.details.push(...memberRaidsFaits.map((r: any) => ({
                type: "sent",
                date: r.date,
                count: r.count || 1,
                target: r.target,
                month: monthKey,
              })));
              raidsData.details.push(...memberRaidsRecus.map((r: any) => ({
                type: "received",
                date: r.date,
                raider: r.raider,
                month: monthKey,
              })));
            }
          } catch (err) {
            // Ignorer les erreurs
          }
        }

        result.engagement = {
          follows: followData,
          raids: raidsData,
          presences: [], // TODO: Si vous avez un système de présences aux événements/spotlights
        };
      } catch (err) {
        console.error("Error loading engagement:", err);
        result.engagement = { follows: [], raids: { sent: 0, received: 0, details: [] }, presences: [] };
      }
    }

    if (!section || section === "evaluations") {
      // E) Évaluations mensuelles (3 derniers mois)
      try {
        const now = new Date();
        const evaluations = [];

        for (let i = 0; i < 3; i++) {
          const checkDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = getMonthKey(checkDate.getFullYear(), checkDate.getMonth() + 1);

          try {
            const finalResult = await loadFinalResult(monthKey);
            if (finalResult) {
              const memberScore = finalResult.scores?.find(
                (s: any) => s.twitchLogin?.toLowerCase() === member.twitchLogin?.toLowerCase()
              );

              if (memberScore) {
                // Charger les détails par section
                const sectionA = await loadSectionAData(monthKey).catch(() => null);
                const sectionC = await loadSectionCData(monthKey).catch(() => null);
                const sectionD = await loadSectionDData(monthKey).catch(() => null);

                evaluations.push({
                  month: monthKey,
                  score: memberScore,
                  details: {
                    sectionA: sectionA?.spotlights?.filter((s: any) =>
                      s.streamerTwitchLogin?.toLowerCase() === member.twitchLogin?.toLowerCase()
                    ) || [],
                    sectionC: sectionC?.validations?.filter((v: any) =>
                      Object.keys(v.follows || {}).some(login =>
                        login.toLowerCase() === member.twitchLogin?.toLowerCase()
                      )
                    ) || [],
                    sectionDBonuses: sectionD?.bonuses?.filter((b: any) =>
                      b.twitchLogin?.toLowerCase() === member.twitchLogin?.toLowerCase()
                    ) || [],
                  },
                });
              }
            }
          } catch (err) {
            // Mois sans évaluation
          }
        }

        result.evaluations = evaluations.reverse(); // Du plus ancien au plus récent
      } catch (err) {
        console.error("Error loading evaluations:", err);
        result.evaluations = [];
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching member 360 data:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
