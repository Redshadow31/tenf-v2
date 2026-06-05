import { supabaseAdmin } from "@/lib/db/supabase";
import type { MemberData } from "@/lib/memberData";
import { deleteFaqContactsByIds, listFaqContacts } from "@/lib/faqContactStorage";
import { memberRepository } from "@/lib/repositories";

export type RgpdSearchHit = {
  twitchLogin: string;
  displayName: string;
  discordId?: string;
  discordUsername?: string;
  role?: string;
  isActive?: boolean;
  memberId?: string;
};

export type RgpdDataSection = {
  id: string;
  label: string;
  count: number;
  data: unknown;
  note?: string;
};

export type RgpdExportBundle = {
  exportedAt: string;
  subject: {
    twitchLogin: string;
    displayName: string;
    discordId?: string;
    memberId?: string;
  };
  sections: RgpdDataSection[];
  summary: { totalRecords: number; tablesWithData: number };
};

export type RgpdEraseResult = {
  twitchLogin: string;
  discordId?: string;
  deleted: { table: string; count: number }[];
  warnings: string[];
};

type MemberKeys = {
  member: MemberData;
  twitchLogin: string;
  discordId?: string;
  memberId?: string;
};

async function fetchRows(
  table: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apply: (q: any) => any
): Promise<unknown[]> {
  try {
    const { data, error } = await apply(supabaseAdmin.from(table).select("*"));
    if (error) {
      console.warn(`[rgpd] fetch ${table}:`, error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn(`[rgpd] fetch ${table} failed:`, err);
    return [];
  }
}

async function deleteRows(
  table: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apply: (q: any) => any
): Promise<number> {
  try {
    const { data, error } = await apply(supabaseAdmin.from(table).delete().select("*"));
    if (error) {
      console.warn(`[rgpd] delete ${table}:`, error.message);
      return 0;
    }
    return Array.isArray(data) ? data.length : 0;
  } catch (err) {
    console.warn(`[rgpd] delete ${table} failed:`, err);
    return 0;
  }
}

function toSearchHit(member: MemberData): RgpdSearchHit {
  return {
    twitchLogin: member.twitchLogin,
    displayName: member.displayName || member.siteUsername || member.twitchLogin,
    discordId: member.discordId,
    discordUsername: member.discordUsername,
    role: member.role,
    isActive: member.isActive,
    memberId: member.memberId,
  };
}

export async function searchMembersForRgpd(rawQuery: string): Promise<RgpdSearchHit[]> {
  const q = String(rawQuery || "").trim();
  if (q.length < 2) return [];

  const hits = new Map<string, RgpdSearchHit>();

  const push = (member: MemberData | null) => {
    if (!member?.twitchLogin) return;
    const key = member.twitchLogin.toLowerCase();
    if (!hits.has(key)) hits.set(key, toSearchHit(member));
  };

  if (/^\d{16,22}$/.test(q)) {
    push(await memberRepository.findByDiscordId(q));
  }

  push(await memberRepository.findByTwitchLogin(q));
  push(await memberRepository.findByDisplayNameOrSiteUsernameExactCI(q));

  if (q.includes("@")) {
    const { data } = await supabaseAdmin
      .from("members")
      .select("twitch_login")
      .ilike("staff_notification_email", q)
      .limit(5);
    for (const row of data || []) {
      const login = String((row as { twitch_login?: string }).twitch_login || "");
      push(await memberRepository.findByTwitchLogin(login));
    }
  }

  const autocomplete = await memberRepository.searchMembersForAutocomplete(q, {
    includeInactive: true,
    includeCommunity: true,
    limit: 20,
  });
  for (const m of autocomplete) push(m);

  return Array.from(hits.values()).slice(0, 25);
}

async function resolveMemberKeys(twitchLogin: string): Promise<MemberKeys | null> {
  const login = twitchLogin.trim().toLowerCase();
  if (!login) return null;
  const member = await memberRepository.findByTwitchLogin(login);
  if (!member) return null;
  return {
    member,
    twitchLogin: login,
    discordId: member.discordId,
    memberId: member.memberId,
  };
}

export async function exportMemberRgpdData(twitchLogin: string): Promise<RgpdExportBundle | null> {
  const keys = await resolveMemberKeys(twitchLogin);
  if (!keys) return null;

  const { member, discordId, memberId } = keys;
  const login = keys.twitchLogin;
  const sections: RgpdDataSection[] = [];

  const memberRow = await fetchRows("members", (q) => q.eq("twitch_login", login));
  sections.push({ id: "members", label: "Fiche membre (Supabase)", count: memberRow.length, data: memberRow });

  const pending = await fetchRows("member_profile_pending", (q) => q.eq("twitch_login", login));
  sections.push({ id: "member_profile_pending", label: "Modifications profil en attente", count: pending.length, data: pending });

  if (discordId) {
    const staffApps = await fetchRows("staff_applications", (q) => q.eq("applicant_discord_id", discordId));
    sections.push({ id: "staff_applications", label: "Candidatures staff", count: staffApps.length, data: staffApps });

    const formations = await fetchRows("formation_requests", (q) => q.eq("member_discord_id", discordId));
    sections.push({ id: "formation_requests", label: "Demandes de formation", count: formations.length, data: formations });

    const raids = await fetchRows("raid_declarations", (q) => q.eq("member_discord_id", discordId));
    sections.push({ id: "raid_declarations", label: "Déclarations de raids", count: raids.length, data: raids });

    const connLogs = await fetchRows("connection_logs", (q) => q.eq("discord_id", discordId).order("created_at", { ascending: false }).limit(500));
    sections.push({
      id: "connection_logs",
      label: "Logs de connexion (500 derniers)",
      count: connLogs.length,
      data: connLogs,
      note: "Adresses IP masquées / hachées selon la politique du site.",
    });

    const activeConn = await fetchRows("active_connections", (q) => q.eq("discord_id", discordId));
    sections.push({ id: "active_connections", label: "Sessions actives", count: activeConn.length, data: activeConn });

    const pageActivity = await fetchRows("page_activity_events", (q) =>
      q.eq("user_id", discordId).order("created_at", { ascending: false }).limit(500)
    );
    sections.push({
      id: "page_activity_events",
      label: "Historique de navigation (500 derniers)",
      count: pageActivity.length,
      data: pageActivity,
    });
  }

  const registrations = await fetchRows("event_registrations", (q) =>
    q.or(`twitch_login.eq.${login},discord_id.eq.${discordId || "___none___"}`)
  );
  sections.push({ id: "event_registrations", label: "Inscriptions événements", count: registrations.length, data: registrations });

  const presences = await fetchRows("event_presences", (q) =>
    q.or(`twitch_login.eq.${login},discord_id.eq.${discordId || "___none___"}`)
  );
  sections.push({ id: "event_presences", label: "Présences événements", count: presences.length, data: presences });

  const spotlightPresence = await fetchRows("spotlight_presences", (q) => q.eq("twitch_login", login));
  sections.push({ id: "spotlight_presences", label: "Présences Spotlight", count: spotlightPresence.length, data: spotlightPresence });

  if (memberId) {
    const questionnaire = await fetchRows("staff_questionnaire_submissions", (q) => q.eq("member_id", memberId));
    sections.push({
      id: "staff_questionnaire_submissions",
      label: "Questionnaires staff",
      count: questionnaire.length,
      data: questionnaire,
    });
  }

  const pseudoCandidates = new Set(
    [member.displayName, member.siteUsername, member.discordUsername, login].filter(Boolean).map((s) => String(s).trim())
  );
  const reviews: unknown[] = [];
  for (const pseudo of pseudoCandidates) {
    const rows = await fetchRows("public_reviews", (q) => q.ilike("pseudo", pseudo));
    reviews.push(...rows);
  }
  sections.push({ id: "public_reviews", label: "Témoignages / avis publics", count: reviews.length, data: reviews });

  const faqAll = await listFaqContacts();
  const faqMatches = faqAll.filter((m) => {
    const pseudo = m.pseudo?.toLowerCase() || "";
    const contact = m.contact?.toLowerCase() || "";
    return (
      pseudoCandidates.has(m.pseudo) ||
      contact.includes(login) ||
      (discordId && contact.includes(discordId)) ||
      pseudo.includes(login)
    );
  });
  sections.push({ id: "faq_contacts", label: "Messages FAQ rejoindre", count: faqMatches.length, data: faqMatches });

  let legacyBlob: unknown = null;
  try {
    const { loadMemberDataFromStorage, getMemberData } = await import("@/lib/memberData");
    await loadMemberDataFromStorage();
    legacyBlob = getMemberData(login) || null;
  } catch {
    legacyBlob = null;
  }
  if (legacyBlob) {
    sections.push({
      id: "legacy_blob",
      label: "Copie legacy (stockage historique)",
      count: 1,
      data: legacyBlob,
      note: "Ancien stockage fichier — peut dupliquer des champs déjà présents en base.",
    });
  }

  sections.push({
    id: "member_mapped",
    label: "Vue applicative membre",
    count: 1,
    data: member,
  });

  const totalRecords = sections.reduce((acc, s) => acc + s.count, 0);
  const tablesWithData = sections.filter((s) => s.count > 0).length;

  return {
    exportedAt: new Date().toISOString(),
    subject: {
      twitchLogin: login,
      displayName: member.displayName || member.siteUsername || login,
      discordId,
      memberId,
    },
    sections,
    summary: { totalRecords, tablesWithData },
  };
}

export async function eraseMemberRgpdData(
  twitchLogin: string,
  reason: string,
  adminDiscordId: string
): Promise<RgpdEraseResult | null> {
  const keys = await resolveMemberKeys(twitchLogin);
  if (!keys) return null;

  const { member, discordId, memberId } = keys;
  const login = keys.twitchLogin;
  const deleted: { table: string; count: number }[] = [];
  const warnings: string[] = [];

  const track = (table: string, count: number) => {
    if (count > 0) deleted.push({ table, count });
  };

  if (memberId) {
    track(
      "staff_questionnaire_submissions",
      await deleteRows("staff_questionnaire_submissions", (q) => q.eq("member_id", memberId))
    );
  }

  track("member_profile_pending", await deleteRows("member_profile_pending", (q) => q.eq("twitch_login", login)));

  if (discordId) {
    track("staff_applications", await deleteRows("staff_applications", (q) => q.eq("applicant_discord_id", discordId)));
    track("formation_requests", await deleteRows("formation_requests", (q) => q.eq("member_discord_id", discordId)));
    track("raid_declarations", await deleteRows("raid_declarations", (q) => q.eq("member_discord_id", discordId)));
    track("connection_logs", await deleteRows("connection_logs", (q) => q.eq("discord_id", discordId)));
    track("active_connections", await deleteRows("active_connections", (q) => q.eq("discord_id", discordId)));
    track("page_activity_events", await deleteRows("page_activity_events", (q) => q.eq("user_id", discordId)));
  }

  track(
    "event_registrations",
    await deleteRows("event_registrations", (q) =>
      q.or(`twitch_login.eq.${login},discord_id.eq.${discordId || "___none___"}`)
    )
  );
  track(
    "event_presences",
    await deleteRows("event_presences", (q) => q.or(`twitch_login.eq.${login},discord_id.eq.${discordId || "___none___"}`))
  );
  track("spotlight_presences", await deleteRows("spotlight_presences", (q) => q.eq("twitch_login", login)));

  const pseudoCandidates = new Set(
    [member.displayName, member.siteUsername, member.discordUsername, login].filter(Boolean).map((s) => String(s).trim())
  );
  for (const pseudo of pseudoCandidates) {
    track("public_reviews", await deleteRows("public_reviews", (q) => q.ilike("pseudo", pseudo)));
  }

  const faqAll = await listFaqContacts();
  const faqIds = faqAll
    .filter((m) => {
      const pseudo = m.pseudo?.toLowerCase() || "";
      const contact = m.contact?.toLowerCase() || "";
      return (
        pseudoCandidates.has(m.pseudo) ||
        contact.includes(login) ||
        (discordId && contact.includes(discordId)) ||
        pseudo.includes(login)
      );
    })
    .map((m) => m.id);
  const faqRemoved = await deleteFaqContactsByIds(faqIds);
  if (faqRemoved > 0) deleted.push({ table: "faq_contacts", count: faqRemoved });

  try {
    const { deleteMemberData } = await import("@/lib/memberData");
    const blobDeleted = await deleteMemberData(login, adminDiscordId, reason, member);
    if (blobDeleted) deleted.push({ table: "legacy_blob", count: 1 });
  } catch (err) {
    warnings.push(`Legacy blob : ${err instanceof Error ? err.message : "échec suppression"}`);
  }

  try {
    await memberRepository.hardDelete(login);
    deleted.push({ table: "members", count: 1 });
  } catch (err) {
    warnings.push(`Supabase members : ${err instanceof Error ? err.message : "échec suppression"}`);
  }

  return { twitchLogin: login, discordId, deleted, warnings };
}
