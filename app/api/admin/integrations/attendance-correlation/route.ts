import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { memberRepository } from "@/lib/repositories";
import {
  getIntegration,
  loadIntegrations,
  loadRegistrations,
  registerForIntegration,
  type IntegrationRegistration,
} from "@/lib/integrationStorage";
import { calendarDayKey, indexIntegrationsByCalendarDay } from "@/lib/integrationSessionCalendar";

type CorrelationMember = {
  twitchLogin: string;
  displayName: string;
  discordId?: string;
  discordUsername?: string;
  parrain?: string;
  attendanceCount: number;
  inMembersList: boolean;
  consideredActivated: boolean;
  memberRole?: string;
  memberStatus?: "actif" | "inactif";
};

type CorrelationSnapshot = {
  sessionsPastCount: number;
  totalAttendances: number;
  integratedMembersCount: number;
  targetIntegration: { id: string; title: string; date: string } | null;
  reassignableCandidates: CorrelationMember[];
  activationSummary: {
    inMembersListCount: number;
    consideredActivatedCount: number;
    toActivateCount: number;
    missingInMembersListCount: number;
  };
  sessions: Array<{
    integrationId: string;
    title: string;
    date: string;
    attendedCount: number;
    registrationsCount: number;
  }>;
};

function normalizeLogin(value?: string): string {
  return String(value || "").trim().toLowerCase();
}

function normalizeRole(value?: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isConsideredActivated(member: any): boolean {
  const role = normalizeRole(member?.role);
  if (member?.isActive === true) return true;
  return role === "affilie" || role === "developpement" || role === "actif";
}

async function loadAllMembers(): Promise<any[]> {
  const pageSize = 1000;
  const maxPages = 20;
  const all: any[] = [];

  for (let page = 0; page < maxPages; page++) {
    const offset = page * pageSize;
    const chunk = await memberRepository.findAll(pageSize, offset);
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    all.push(...chunk);
    if (chunk.length < pageSize) break;
  }

  return all;
}

async function buildSnapshot(targetIntegrationId?: string, minAttendances = 1): Promise<CorrelationSnapshot> {
  const integrations = await loadIntegrations();
  const { dayKeys: sessionDayKeys } = indexIntegrationsByCalendarDay(integrations);

  const nowTs = Date.now();

  const pastIntegrations = integrations
    .filter((item) => new Date(item.date).getTime() < nowTs)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const futureIntegrations = integrations
    .filter((item) => (item.isPublished ?? false) && new Date(item.date).getTime() >= nowTs)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const explicitTarget = targetIntegrationId ? await getIntegration(targetIntegrationId) : null;
  const target = explicitTarget || futureIntegrations[0] || null;

  const attendanceMap = new Map<
    string,
    {
      attendanceCount: number;
      lastSeen: IntegrationRegistration;
    }
  >();

  const sessions: CorrelationSnapshot["sessions"] = [];
  let totalAttendances = 0;

  for (const integration of pastIntegrations) {
    const registrations = await loadRegistrations(integration.id);
    const presentRegs = registrations.filter((reg) => reg.present === true);
    totalAttendances += presentRegs.length;

    sessions.push({
      integrationId: integration.id,
      title: integration.title || "Intégration",
      date: integration.date,
      attendedCount: presentRegs.length,
      registrationsCount: registrations.length,
    });

    for (const reg of presentRegs) {
      const login = normalizeLogin(reg.twitchLogin);
      if (!login) continue;
      const current = attendanceMap.get(login);
      if (!current) {
        attendanceMap.set(login, { attendanceCount: 1, lastSeen: reg });
        continue;
      }
      const currentTs = new Date(current.lastSeen.registeredAt).getTime();
      const candidateTs = new Date(reg.registeredAt).getTime();
      attendanceMap.set(login, {
        attendanceCount: current.attendanceCount + 1,
        lastSeen: candidateTs >= currentTs ? reg : current.lastSeen,
      });
    }
  }

  let targetLogins = new Set<string>();
  if (target?.id) {
    const targetRegistrations = await loadRegistrations(target.id);
    targetLogins = new Set(targetRegistrations.map((reg) => normalizeLogin(reg.twitchLogin)).filter(Boolean));
  }

  const reassignableCandidates: CorrelationMember[] = Array.from(attendanceMap.entries())
    .filter(([login, value]) => value.attendanceCount >= Math.max(1, minAttendances) && !targetLogins.has(login))
    .map(([twitchLogin, value]) => ({
      twitchLogin,
      displayName: value.lastSeen.displayName || value.lastSeen.discordUsername || twitchLogin,
      discordId: value.lastSeen.discordId,
      discordUsername: value.lastSeen.discordUsername,
      parrain: value.lastSeen.parrain,
      attendanceCount: value.attendanceCount,
      inMembersList: false,
      consideredActivated: false,
      memberRole: undefined,
      memberStatus: undefined,
    }));

  const allMembers = await loadAllMembers();
  const membersByLogin = new Map<string, any>();
  for (const member of allMembers) {
    const login = normalizeLogin(member?.twitchLogin);
    if (!login) continue;
    if (!membersByLogin.has(login)) {
      membersByLogin.set(login, member);
    }
  }

  const enrichedCandidates: CorrelationMember[] = reassignableCandidates
    .map((candidate): CorrelationMember => {
      const member = membersByLogin.get(candidate.twitchLogin);
      if (!member) {
        return candidate;
      }
      const memberStatus: CorrelationMember["memberStatus"] = member.isActive === true ? "actif" : "inactif";
      return {
        ...candidate,
        inMembersList: true,
        consideredActivated: isConsideredActivated(member),
        memberRole: member.role,
        memberStatus,
      };
    })
    .sort((a, b) => b.attendanceCount - a.attendanceCount);

  const inMembersListCount = enrichedCandidates.filter((candidate) => candidate.inMembersList).length;
  const consideredActivatedCount = enrichedCandidates.filter((candidate) => candidate.consideredActivated).length;
  const missingInMembersListCount = enrichedCandidates.filter((candidate) => !candidate.inMembersList).length;
  const toActivateCount = enrichedCandidates.filter(
    (candidate) => candidate.inMembersList && !candidate.consideredActivated
  ).length;

  /** Membres TENF (base centrale) dont la date de réunion d’intégration tombe le même jour qu’une session créée. */
  const integratedMemberKeys = new Set<string>(attendanceMap.keys());
  for (const member of allMembers) {
    const login = normalizeLogin(member?.twitchLogin);
    if (!login) continue;
    const integRaw = member?.integrationDate ?? member?.integration_date;
    if (!integRaw) continue;
    const dayKey = calendarDayKey(integRaw);
    if (dayKey && sessionDayKeys.has(dayKey)) {
      integratedMemberKeys.add(login);
    }
  }

  return {
    sessionsPastCount: pastIntegrations.length,
    totalAttendances,
    integratedMembersCount: integratedMemberKeys.size,
    targetIntegration: target
      ? {
          id: target.id,
          title: target.title || "Intégration",
          date: target.date,
        }
      : null,
    reassignableCandidates: enrichedCandidates,
    activationSummary: {
      inMembersListCount,
      consideredActivatedCount,
      toActivateCount,
      missingInMembersListCount,
    },
    sessions,
  };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non authentifié ou accès refusé" }, { status: 401 });
    }

    const targetIntegrationId = request.nextUrl.searchParams.get("targetIntegrationId") || undefined;
    const minAttendances = Number(request.nextUrl.searchParams.get("minAttendances") || "1");
    const snapshot = await buildSnapshot(targetIntegrationId, minAttendances);

    return NextResponse.json({ success: true, data: snapshot });
  } catch (error) {
    console.error("[Integration Attendance Correlation] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non authentifié ou accès refusé" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const targetIntegrationId = String(body?.targetIntegrationId || "").trim() || undefined;
    const minAttendances = Number(body?.minAttendances || "1");
    const dryRun = body?.dryRun === true;
    const syncMembers = body?.syncMembers === true;

    const snapshot = await buildSnapshot(targetIntegrationId, minAttendances);
    if (!snapshot.targetIntegration?.id) {
      return NextResponse.json({ error: "Aucune session future publiée disponible pour la réassignation." }, { status: 400 });
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        targetIntegration: snapshot.targetIntegration,
        candidates: snapshot.reassignableCandidates,
        totalCandidates: snapshot.reassignableCandidates.length,
      });
    }

    let created = 0;
    let skipped = 0;
    let syncedActivated = 0;
    const errors: string[] = [];

    for (const candidate of snapshot.reassignableCandidates) {
      try {
        await registerForIntegration(snapshot.targetIntegration.id, {
          twitchLogin: candidate.twitchLogin,
          twitchChannelUrl: `https://www.twitch.tv/${candidate.twitchLogin}`,
          displayName: candidate.displayName || candidate.twitchLogin,
          discordId: candidate.discordId,
          discordUsername: candidate.discordUsername,
          parrain: candidate.parrain || "Réassignation automatique",
          notes: `Réassignation automatique depuis historique (${candidate.attendanceCount} présence(s) passée(s)).`,
        });
        created += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.toLowerCase().includes("déjà inscrit")) {
          skipped += 1;
        } else {
          errors.push(`${candidate.twitchLogin}: ${message}`);
        }
      }
    }

    if (syncMembers) {
      for (const candidate of snapshot.reassignableCandidates) {
        if (!candidate.inMembersList || candidate.consideredActivated) continue;
        try {
          await memberRepository.update(candidate.twitchLogin, {
            isActive: true,
            updatedAt: new Date(),
            updatedBy: admin.id,
          } as any);
          syncedActivated += 1;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          errors.push(`sync:${candidate.twitchLogin}: ${message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      targetIntegration: snapshot.targetIntegration,
      totalCandidates: snapshot.reassignableCandidates.length,
      created,
      skipped,
      syncedActivated,
      errors,
      message: `${created} membre(s) réassigné(s) automatiquement${skipped > 0 ? `, ${skipped} déjà inscrits` : ""}${
        syncMembers ? `, ${syncedActivated} profil(s) activé(s)` : ""
      }.`,
    });
  } catch (error) {
    console.error("[Integration Attendance Correlation] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

