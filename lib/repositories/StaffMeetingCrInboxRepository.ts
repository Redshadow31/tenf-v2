import { supabaseAdmin } from "@/lib/db/supabase";

const TABLE = "staff_meeting_cr_inbox";

export type StaffMeetingCrInboxRow = {
  id: string;
  meetingId: string;
  meetingDate: string;
  meetingTitle: string;
  bodyMarkdown: string;
  sentAt: string;
  sentBy: string | null;
  readAt: string | null;
};

type DbRow = {
  id: string;
  meeting_id: string;
  recipient_discord_id: string;
  body_markdown: string;
  sent_at: string;
  sent_by: string | null;
  read_at: string | null;
  staff_monthly_meetings?: unknown;
};

function joinedMeeting(raw: unknown): { meeting_date: string; title: string } | null {
  if (raw == null) return null;
  const one = Array.isArray(raw) ? raw[0] : raw;
  if (!one || typeof one !== "object") return null;
  const o = one as Record<string, unknown>;
  return {
    meeting_date: String(o.meeting_date ?? ""),
    title: String(o.title ?? ""),
  };
}

function mapRow(row: DbRow): StaffMeetingCrInboxRow {
  const m = joinedMeeting(row.staff_monthly_meetings);
  return {
    id: row.id,
    meetingId: row.meeting_id,
    meetingDate: m?.meeting_date ?? "",
    meetingTitle: m?.title ?? "",
    bodyMarkdown: row.body_markdown,
    sentAt: row.sent_at,
    sentBy: row.sent_by,
    readAt: row.read_at,
  };
}

export type StaffMeetingCrInboxInsert = {
  meetingId: string;
  recipientDiscordId: string;
  bodyMarkdown: string;
  sentBy: string;
};

export class StaffMeetingCrInboxRepository {
  async listForRecipient(recipientDiscordId: string): Promise<StaffMeetingCrInboxRow[]> {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select(
        "id, meeting_id, recipient_discord_id, body_markdown, sent_at, sent_by, read_at, staff_monthly_meetings(meeting_date, title)",
      )
      .eq("recipient_discord_id", recipientDiscordId)
      .order("sent_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((r) => mapRow(r as unknown as DbRow));
  }

  async insertMany(rows: StaffMeetingCrInboxInsert[]): Promise<void> {
    if (rows.length === 0) return;
    const payload = rows.map((r) => ({
      meeting_id: r.meetingId,
      recipient_discord_id: r.recipientDiscordId,
      body_markdown: r.bodyMarkdown,
      sent_by: r.sentBy,
    }));
    const { error } = await supabaseAdmin.from(TABLE).insert(payload);
    if (error) throw error;
  }

  async markRead(id: string, recipientDiscordId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("recipient_discord_id", recipientDiscordId)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    return !!data;
  }
}

export const staffMeetingCrInboxRepository = new StaffMeetingCrInboxRepository();
