import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
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
import { eventRepository } from "@/lib/repositories";

function buildMonthKeys(months: number): string[] {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return getMonthKey(date.getFullYear(), date.getMonth() + 1);
  });
}

function memberMatches(member: any, value: string | undefined): boolean {
  if (!value) return false;
  const normalized = String(value).toLowerCase();
  return (
    normalized === String(member.twitchLogin || "").toLowerCase() ||
    normalized === String(member.discordId || "").toLowerCase() ||
    normalized === String(member.displayName || "").toLowerCase() ||
    normalized === String(member.siteUsername || "").toLowerCase() ||
    normalized === String(member.twitchId || "").toLowerCase()
  );
}

function parseMonthsParam(request: NextRequest): number {
  const monthsParam = new URL(request.url).searchParams.get("months");
  const parsed = Number.parseInt(monthsParam || "3", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 3;
  return Math.min(parsed, 24);
}

function extractNotesValue(value: any): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  if (typeof value.notesInternes === "string") return value.notesInternes;
  if (value.member && typeof value.member.notesInternes === "string") return value.member.notesInternes;
  return undefined;
}

function isLikelySanctionLog(log: any): boolean {
  const text = [
    String(log.action || ""),
    String(log.resourceType || ""),
    JSON.stringify(log.metadata || {}),
  ]
    .join(" ")
    .toLowerCase();
  return /(sanction|warn|warning|mute|ban|suspend|exclusion)/.test(text);
}

/**
 * GET - Récupère toutes les données agrégées pour la fiche 360° d'un membre
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentification NextAuth + permission read
    const admin = await requirePermission("read");
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou permissions insuffisantes" },
        { status: 401 }
      );
    }

    const { id } = params;
    const decodedId = decodeURIComponent(id);
    const section = new URL(request.url).searchParams.get("section") || "summary";
    const months = parseMonthsParam(request);
    const monthKeys = buildMonthKeys(months);

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

    if (section === "summary") {
      return NextResponse.json(result);
    }

    // Lazy loading par section
    if (section === "logs") {
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

    if (section === "integration") {
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

    if (section === "engagement") {
      // D) Engagement (Follow/Raids/Présences)
      try {
        // Follow validations (N derniers mois)
        const followData = [];
        for (const monthKey of monthKeys) {
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

        // Raids (N derniers mois)
        const raidsData = {
          sent: 0,
          received: 0,
          details: [] as any[],
          byMonth: [] as Array<{ month: string; sent: number; received: number }>,
        };
        for (const monthKey of monthKeys) {
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

            const monthSent = memberRaidsFaits.reduce((sum: number, r: any) => sum + (r.count || 1), 0);
            const monthReceived = memberRaidsRecus.length;

            raidsData.sent += monthSent;
            raidsData.received += monthReceived;
            raidsData.byMonth.push({ month: monthKey, sent: monthSent, received: monthReceived });

            raidsData.details.push(...memberRaidsFaits.map((r: any) => ({
              type: "sent",
              date: r.date,
              count: r.count || 1,
              target: r.target,
              month: monthKey,
              source: r.source,
              manual: !!r.manual,
            })));
            raidsData.details.push(...memberRaidsRecus.map((r: any) => ({
              type: "received",
              date: r.date,
              raider: r.raider,
              month: monthKey,
              source: r.source,
              manual: !!r.manual,
            })));
          } catch (err) {
            // Ignorer les erreurs
          }
        }

        result.engagement = {
          months,
          monthKeys,
          follows: followData,
          raids: raidsData,
          presences: [], // TODO: Si vous avez un système de présences aux événements/spotlights
        };
      } catch (err) {
        console.error("Error loading engagement:", err);
        result.engagement = { follows: [], raids: { sent: 0, received: 0, details: [] }, presences: [] };
      }
    }

    if (section === "evaluations") {
      // E) Évaluations mensuelles (N derniers mois)
      try {
        const evaluations = [];

        for (const monthKey of monthKeys) {
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
        result.evaluationsMeta = { months, monthKeys };
      } catch (err) {
        console.error("Error loading evaluations:", err);
        result.evaluations = [];
        result.evaluationsMeta = { months, monthKeys };
      }
    }

    if (section === "events") {
      try {
        const events = await eventRepository.findAll(1000, 0);
        const participations: Array<{
          eventId: string;
          title: string;
          category: string;
          date: string;
          mode: "presence" | "registration";
          present?: boolean;
          note?: string;
        }> = [];

        for (const event of events) {
          const [presences, registrations] = await Promise.all([
            eventRepository.getPresences(event.id).catch(() => []),
            eventRepository.getRegistrations(event.id).catch(() => []),
          ]);

          const memberPresences = (presences || []).filter((p: any) =>
            memberMatches(member, p.twitchLogin) ||
            memberMatches(member, p.discordId) ||
            memberMatches(member, p.displayName)
          );
          const memberRegistrations = (registrations || []).filter((r: any) =>
            memberMatches(member, r.twitchLogin) ||
            memberMatches(member, r.discordId) ||
            memberMatches(member, r.displayName)
          );

          // La présence prime sur l'inscription:
          // - si présence présente=true => participation
          // - si présence existe mais présente=false => pas de participation
          // - sinon, inscription suffit
          const hasPresence = memberPresences.length > 0;
          const hasPresentPresence = memberPresences.some((p: any) => p.present === true);
          const hasRegistration = memberRegistrations.length > 0;

          if ((hasPresence && hasPresentPresence) || (!hasPresence && hasRegistration)) {
            participations.push({
              eventId: event.id,
              title: event.title,
              category: event.category || "Autre",
              date: event.date instanceof Date ? event.date.toISOString() : new Date(event.date).toISOString(),
              mode: hasPresence ? "presence" : "registration",
              present: hasPresence ? true : undefined,
              note: memberPresences[0]?.note || memberRegistrations[0]?.notes,
            });
          }
        }

        participations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const statsByCategory: Record<string, number> = {};
        for (const p of participations) {
          statsByCategory[p.category] = (statsByCategory[p.category] || 0) + 1;
        }
        const favoriteCategory = Object.entries(statsByCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

        result.events = {
          participations,
          statsByCategory,
          favoriteCategory,
          total: participations.length,
        };
      } catch (err) {
        console.error("Error loading events participation:", err);
        result.events = {
          participations: [],
          statsByCategory: {},
          favoriteCategory: null,
          total: 0,
        };
      }
    }

    if (section === "notes" || section === "sanctions") {
      try {
        const allLogs = await getAllAuditLogs({ limit: 600 });
        const memberLogs = allLogs.filter((log: any) => {
          const resourceId = String(log.resourceId || "").toLowerCase();
          const searchTerms = [
            member.twitchLogin?.toLowerCase(),
            member.discordId?.toLowerCase(),
            member.displayName?.toLowerCase(),
            member.siteUsername?.toLowerCase(),
          ].filter(Boolean);
          const payload = JSON.stringify({
            previousValue: log.previousValue,
            newValue: log.newValue,
            metadata: log.metadata,
            action: log.action,
          }).toLowerCase();
          return (
            (log.resourceType === "member" && searchTerms.some(term => resourceId.includes(term || ""))) ||
            searchTerms.some(term => payload.includes(term || ""))
          );
        });

        if (section === "notes") {
          const noteHistory = memberLogs
            .filter((log: any) => {
              const action = String(log.action || "").toLowerCase();
              const metadataText = JSON.stringify(log.metadata || {}).toLowerCase();
              const prev = extractNotesValue(log.previousValue);
              const next = extractNotesValue(log.newValue);
              return (
                action.includes("note") ||
                metadataText.includes("note") ||
                metadataText.includes("notesinternes") ||
                prev !== undefined ||
                next !== undefined
              );
            })
            .map((log: any) => ({
              date: log.timestamp,
              author: log.actorUsername || log.actorDiscordId || "unknown",
              action: log.action,
              before: extractNotesValue(log.previousValue),
              after: extractNotesValue(log.newValue),
            }))
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

          result.internalNotes = {
            current: (member as any).notesInternes || "",
            history: noteHistory,
          };
        }

        if (section === "sanctions") {
          const sanctions = memberLogs
            .filter((log: any) => isLikelySanctionLog(log))
            .map((log: any) => ({
              date: log.timestamp,
              type: log.metadata?.sanction?.type || log.metadata?.type || log.action,
              motif: log.metadata?.sanction?.reason || log.metadata?.reason || log.metadata?.motif || "",
              duree: log.metadata?.sanction?.duration || log.metadata?.duration || "",
              staff: log.actorUsername || log.actorDiscordId || "unknown",
              commentaire: log.metadata?.sanction?.comment || log.metadata?.comment || "",
              action: log.action,
            }))
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

          result.sanctions = sanctions;
        }
      } catch (err) {
        console.error("Error loading notes/sanctions:", err);
        if (section === "notes") {
          result.internalNotes = { current: (member as any).notesInternes || "", history: [] };
        }
        if (section === "sanctions") {
          result.sanctions = [];
        }
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
