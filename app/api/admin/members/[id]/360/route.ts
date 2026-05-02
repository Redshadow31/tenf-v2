import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { 
  findMemberByIdentifier, 
  loadMemberDataFromStorage,
  getAllMemberData,
  getArchivedMemberEntries,
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
import { eventRepository, memberRepository } from "@/lib/repositories";
import { fetchCanonicalTwitchAvatarForLogin, resolveMemberAvatar } from "@/lib/memberAvatar";
import { debugAgentLog } from "@/lib/debugAgentLog";

const SUPABASE_PAGE_SIZE = 1000;
const SUPABASE_MAX_PAGES = 20;

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

function buildMemberIdentifierSets(member: any, decodedId: string) {
  const logins = new Set<string>();
  const discordIds = new Set<string>();
  const displayNames = new Set<string>();
  const siteUsernames = new Set<string>();

  const addLower = (set: Set<string>, value?: string) => {
    if (value && String(value).trim()) set.add(String(value).trim().toLowerCase());
  };

  addLower(logins, member?.twitchLogin);
  addLower(discordIds, member?.discordId);
  addLower(displayNames, member?.displayName);
  addLower(siteUsernames, member?.siteUsername);
  addLower(logins, decodedId); // utile si URL contient twitch login
  addLower(discordIds, decodedId); // utile si URL contient discordId
  addLower(displayNames, decodedId);
  addLower(siteUsernames, decodedId);

  return { logins, discordIds, displayNames, siteUsernames };
}

async function fetchAllSupabaseMembers(): Promise<any[]> {
  const allMembers: any[] = [];
  for (let page = 0; page < SUPABASE_MAX_PAGES; page += 1) {
    const offset = page * SUPABASE_PAGE_SIZE;
    const chunk = await memberRepository.findAll(SUPABASE_PAGE_SIZE, offset);
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    allMembers.push(...chunk);
    if (chunk.length < SUPABASE_PAGE_SIZE) break;
  }
  return allMembers;
}

/**
 * GET - Récupère toutes les données agrégées pour la fiche 360° d'un membre
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const t360Start = Date.now();
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

    // #region agent log
    debugAgentLog({
      location: "360/route.ts:params",
      message: "360 GET params",
      data: { section, months, monthKeysLen: monthKeys.length },
      hypothesisId: "H360-entry",
    });
    // #endregion

    // Charger les données de base
    const t360Supabase = Date.now();
    await loadMemberDataFromStorage();
    const supabaseMembers = await fetchAllSupabaseMembers();

    // #region agent log
    debugAgentLog({
      location: "360/route.ts:supabase",
      message: "360 after fetchAllSupabaseMembers",
      data: {
        section,
        supabaseMs: Date.now() - t360Supabase,
        supabaseMemberCount: supabaseMembers.length,
      },
      hypothesisId: "H360-supabase",
    });
    // #endregion

    // Trouver le membre
    // 1) Source canonique Supabase (plus fiable pour l'état courant)
    const fromSupabase = supabaseMembers.find((m: any) => {
      const id = decodedId.toLowerCase();
      return (
        String(m.twitchLogin || "").toLowerCase() === id ||
        String(m.discordId || "").toLowerCase() === id ||
        String(m.displayName || "").toLowerCase() === id ||
        String(m.siteUsername || "").toLowerCase() === id ||
        String(m.twitchId || "").toLowerCase() === id
      );
    }) || null;

    // 2) Fallback memberData (compat historique)
    let member = fromSupabase || findMemberByIdentifier({ twitchLogin: decodedId });
    if (!member) member = findMemberByIdentifier({ discordId: decodedId });
    if (!member && /^\d+$/.test(decodedId)) member = findMemberByIdentifier({ twitchId: decodedId });
    if (!member) {
      const allMembers = getAllMemberData();
      member = allMembers.find(
        (m) =>
          m.displayName?.toLowerCase() === decodedId.toLowerCase() ||
          m.siteUsername?.toLowerCase() === decodedId.toLowerCase()
      ) || null;
    }

    if (!member) {
      const archived = await getArchivedMemberEntries();
      const idLower = decodedId.toLowerCase();
      const archivedEntry = archived.find((entry) =>
        memberMatches(entry.snapshot, idLower)
      );
      if (archivedEntry) {
        member = {
          ...archivedEntry.snapshot,
          archived: true,
          archivedAt: archivedEntry.deletedAt,
          archivedBy: archivedEntry.deletedBy,
          archiveReason: archivedEntry.deleteReason,
        } as any;
      }
    }

    if (!member) {
      return NextResponse.json(
        { error: "Membre non trouvé" },
        { status: 404 }
      );
    }

    // Fusion canonique pour limiter les cas "id obsolète"
    const memberCanonical = {
      ...member,
      ...fromSupabase,
      // Prioriser les valeurs non vides
      twitchLogin: fromSupabase?.twitchLogin || member.twitchLogin,
      discordId: fromSupabase?.discordId || member.discordId,
      displayName: fromSupabase?.displayName || member.displayName,
      siteUsername: fromSupabase?.siteUsername || member.siteUsername,
      twitchId: fromSupabase?.twitchId || member.twitchId,
    };
    const memberIds = buildMemberIdentifierSets(memberCanonical, decodedId);

    const memberId = memberCanonical.twitchLogin || memberCanonical.discordId || memberCanonical.displayName;
    const fetchedAvatar = await fetchCanonicalTwitchAvatarForLogin(memberCanonical.twitchLogin);
    const result: any = {
      member: {
        ...memberCanonical,
        avatar: resolveMemberAvatar(memberCanonical, fetchedAvatar),
        createdAt: memberCanonical.createdAt?.toISOString?.() || memberCanonical.createdAt,
        updatedAt: memberCanonical.updatedAt?.toISOString?.() || memberCanonical.updatedAt,
        integrationDate: memberCanonical.integrationDate?.toISOString?.() || memberCanonical.integrationDate,
      },
    };

    if (section === "summary") {
      // #region agent log
      debugAgentLog({
        location: "360/route.ts:summary-return",
        message: "360 summary response",
        data: { section: "summary", totalMs: Date.now() - t360Start },
        hypothesisId: "H360-total",
      });
      // #endregion
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
            ...Array.from(memberIds.logins),
            ...Array.from(memberIds.discordIds),
            ...Array.from(memberIds.displayNames),
            ...Array.from(memberIds.siteUsernames),
          ].filter(Boolean);

          return (
            (log.resourceType === "member" && searchTerms.some(term => resourceId.includes(term || ""))) ||
            (log.metadata && searchTerms.some((term: string) => JSON.stringify(log.metadata).toLowerCase().includes(term))) ||
            (log.action && searchTerms.some((term: string) => String(log.action).toLowerCase().includes(term)))
          );
        }).slice(0, 20);

        result.logs = memberLogs;
      } catch (err) {
        console.error("Error loading logs:", err);
        result.logs = [];
      }
    }

    if (section === "integration") {
      // C) Intégration (chargements registrations en parallèle + correspondance sur profil canonique)
      try {
        const allIntegrations = await loadIntegrations();
        const resolved = await Promise.all(
          allIntegrations.map(async (integration) => {
            const registrations = await loadRegistrations(integration.id);
            const registration = registrations.find(
              (reg: any) =>
                reg.twitchLogin?.toLowerCase() ===
                  memberCanonical.twitchLogin?.toLowerCase() ||
                reg.discordId === memberCanonical.discordId ||
                reg.displayName?.toLowerCase() ===
                  memberCanonical.displayName?.toLowerCase()
            );
            if (!registration) return null;
            return {
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
            };
          })
        );
        const memberIntegrations = resolved.filter(Boolean) as Array<{
          integration: {
            id: string;
            title: string;
            date: string;
            category: string;
          };
          registration: {
            present: boolean;
            registeredAt: string;
            notes?: string;
            parrain?: string;
          };
        }>;

        result.integration = memberIntegrations.sort(
          (a, b) =>
            new Date(b.integration.date).getTime() -
            new Date(a.integration.date).getTime()
        );
      } catch (err) {
        console.error("Error loading integration:", err);
        result.integration = [];
      }
    }

    if (section === "engagement") {
      // D) Engagement (Follow/Raids — mois en parallèle)
      try {
        const followChunks = await Promise.all(
          monthKeys.map(async (monthKey) => {
            try {
              const validations = await getAllFollowValidationsForMonth(monthKey);
              return validations
                .filter((validation: any) =>
                  validation.members?.some((m: any) =>
                    memberIds.logins.has(String(m.twitchLogin || "").toLowerCase())
                  )
                )
                .map((validation: any) => ({
                  month: monthKey,
                  staffSlug: validation.staffSlug,
                  staffName: validation.staffName,
                  status: validation.members?.find((m: any) =>
                    memberIds.logins.has(String(m.twitchLogin || "").toLowerCase())
                  ),
                }));
            } catch {
              return [];
            }
          })
        );
        const followData = followChunks.flat();

        const raidsChunks = await Promise.all(
          monthKeys.map(async (monthKey) => {
            try {
              const [raidsFaits, raidsRecus] = await Promise.all([
                loadRaidsFaits(monthKey),
                loadRaidsRecus(monthKey),
              ]);

              const memberRaidsFaits = raidsFaits.filter(
                (raid: any) =>
                  memberIds.logins.has(String(raid.raider || "").toLowerCase()) ||
                  memberIds.discordIds.has(String(raid.raider || "").toLowerCase()) ||
                  memberIds.displayNames.has(String(raid.raider || "").toLowerCase()) ||
                  memberIds.siteUsernames.has(String(raid.raider || "").toLowerCase())
              );

              const memberRaidsRecus = raidsRecus.filter(
                (raid: any) =>
                  memberIds.logins.has(String(raid.target || "").toLowerCase()) ||
                  memberIds.discordIds.has(String(raid.target || "").toLowerCase()) ||
                  memberIds.displayNames.has(String(raid.target || "").toLowerCase()) ||
                  memberIds.siteUsernames.has(String(raid.target || "").toLowerCase())
              );

              const monthSent = memberRaidsFaits.reduce(
                (sum: number, r: any) => sum + (r.count || 1),
                0
              );
              const monthReceived = memberRaidsRecus.length;

              const details: any[] = [
                ...memberRaidsFaits.map((r: any) => ({
                  type: "sent" as const,
                  date: r.date,
                  count: r.count || 1,
                  target: r.target,
                  month: monthKey,
                  source: r.source,
                  manual: !!r.manual,
                })),
                ...memberRaidsRecus.map((r: any) => ({
                  type: "received" as const,
                  date: r.date,
                  raider: r.raider,
                  month: monthKey,
                  source: r.source,
                  manual: !!r.manual,
                })),
              ];

              return {
                monthKey,
                monthSent,
                monthReceived,
                details,
              };
            } catch {
              return {
                monthKey,
                monthSent: 0,
                monthReceived: 0,
                details: [] as any[],
              };
            }
          })
        );

        const raidsData = {
          sent: 0,
          received: 0,
          details: [] as any[],
          byMonth: [] as Array<{ month: string; sent: number; received: number }>,
        };
        for (const chunk of raidsChunks) {
          raidsData.sent += chunk.monthSent;
          raidsData.received += chunk.monthReceived;
          raidsData.byMonth.push({
            month: chunk.monthKey,
            sent: chunk.monthSent,
            received: chunk.monthReceived,
          });
          raidsData.details.push(...chunk.details);
        }

        result.engagement = {
          months,
          monthKeys,
          follows: followData,
          raids: raidsData,
          presences: [],
        };
      } catch (err) {
        console.error("Error loading engagement:", err);
        result.engagement = {
          follows: [],
          raids: { sent: 0, received: 0, details: [] },
          presences: [],
        };
      }
    }

    if (section === "evaluations") {
      // E) Évaluations mensuelles (mois en parallèle ; détails A/C/D en parallèle par mois)
      try {
        const evaluationChunks = await Promise.all(
          monthKeys.map(async (monthKey) => {
            try {
              const finalResult = await loadFinalResult(monthKey);
              if (!finalResult) return null;
              const memberScore = finalResult.scores?.find((s: any) =>
                memberIds.logins.has(String(s.twitchLogin || "").toLowerCase())
              );
              if (!memberScore) return null;

              const [sectionA, sectionC, sectionD] = await Promise.all([
                loadSectionAData(monthKey).catch(() => null),
                loadSectionCData(monthKey).catch(() => null),
                loadSectionDData(monthKey).catch(() => null),
              ]);

              return {
                month: monthKey,
                score: memberScore,
                details: {
                  sectionA:
                    sectionA?.spotlights?.filter((s: any) =>
                      memberIds.logins.has(
                        String(s.streamerTwitchLogin || "").toLowerCase()
                      )
                    ) || [],
                  sectionC:
                    sectionC?.validations?.filter((v: any) =>
                      Object.keys(v.follows || {}).some((login) =>
                        memberIds.logins.has(String(login || "").toLowerCase())
                      )
                    ) || [],
                  sectionDBonuses:
                    sectionD?.bonuses?.filter((b: any) =>
                      memberIds.logins.has(String(b.twitchLogin || "").toLowerCase())
                    ) || [],
                },
              };
            } catch {
              return null;
            }
          })
        );

        result.evaluations = evaluationChunks
          .filter((e): e is NonNullable<(typeof evaluationChunks)[number]> => e != null)
          .reverse();
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
            memberMatches(memberCanonical, p.twitchLogin) ||
            memberMatches(memberCanonical, p.discordId) ||
            memberMatches(memberCanonical, p.displayName)
          );
          const memberRegistrations = (registrations || []).filter((r: any) =>
            memberMatches(memberCanonical, r.twitchLogin) ||
            memberMatches(memberCanonical, r.discordId) ||
            memberMatches(memberCanonical, r.displayName)
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
            ...Array.from(memberIds.logins),
            ...Array.from(memberIds.discordIds),
            ...Array.from(memberIds.displayNames),
            ...Array.from(memberIds.siteUsernames),
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
            current: (memberCanonical as any).notesInternes || "",
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
          result.internalNotes = {
            current: (memberCanonical as any).notesInternes || "",
            history: [],
          };
        }
        if (section === "sanctions") {
          result.sanctions = [];
        }
      }
    }

    // #region agent log
    debugAgentLog({
      location: "360/route.ts:complete",
      message: "360 GET complete",
      data: { section, totalMs: Date.now() - t360Start },
      hypothesisId: "H360-total",
    });
    // #endregion
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching member 360 data:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
