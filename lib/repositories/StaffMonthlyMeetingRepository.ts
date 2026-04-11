import { supabaseAdmin } from "@/lib/db/supabase";
import type {
  StaffMeetingDiscoursItem,
  StaffMeetingDiscoursSection,
  StaffMonthlyMeeting,
} from "@/lib/staff/monthlyMeetingTypes";

const TABLE = "staff_monthly_meetings";

type DbRow = {
  id: string;
  meeting_date: string;
  title: string;
  discours: unknown;
  compte_rendu?: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

function makeDiscoursId(): string {
  return `discours-${crypto.randomUUID()}`;
}

function makeSectionId(): string {
  return `section-${crypto.randomUUID()}`;
}

function normalizeSection(raw: unknown): StaffMeetingDiscoursSection | null {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : makeSectionId();
  const tabTitle = String(o.tabTitle ?? o.titreOnglet ?? o.onglet ?? o.label ?? "").trim();
  const corps = String(o.corps ?? o.texte ?? o.body ?? o.contenu ?? "").trim();
  const conseil = String(o.conseil ?? o.advice ?? "").trim();
  if (!tabTitle && !corps && !conseil) return null;
  return { id, tabTitle, corps, conseil };
}

function normalizeDiscours(raw: unknown): StaffMeetingDiscoursItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const o = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      const id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : makeDiscoursId();
      const intervenant = String(o.intervenant ?? o.speaker ?? "").trim();
      const titre = String(o.titre ?? o.title ?? "").trim();
      const musiqueUrl = String(o.musiqueUrl ?? o.audioUrl ?? o.musicUrl ?? "").trim();

      let sections: StaffMeetingDiscoursSection[] = [];
      if (Array.isArray(o.sections)) {
        for (const s of o.sections) {
          const n = normalizeSection(s);
          if (n) sections.push(n);
        }
      }

      const legacyTexte = String(o.texte ?? o.body ?? o.contenu ?? "").trim();
      if (sections.length === 0 && legacyTexte) {
        sections.push({
          id: makeSectionId(),
          tabTitle: "Contenu",
          corps: legacyTexte,
          conseil: "",
        });
      }
      if (sections.length === 0) {
        sections.push({ id: makeSectionId(), tabTitle: "", corps: "", conseil: "" });
      }

      return { id, intervenant, titre, musiqueUrl: musiqueUrl || undefined, sections };
    })
    .filter((d) => {
      if (d.intervenant.length > 0 || d.titre.length > 0) return true;
      if (d.musiqueUrl && d.musiqueUrl.length > 0) return true;
      return d.sections.some((s) => s.tabTitle.length > 0 || s.corps.length > 0 || s.conseil.length > 0);
    });
}

function mapRow(row: DbRow): StaffMonthlyMeeting {
  return {
    id: row.id,
    meetingDate: row.meeting_date,
    title: row.title || "",
    discours: normalizeDiscours(row.discours),
    compteRendu: row.compte_rendu != null ? String(row.compte_rendu) : "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

export interface StaffMonthlyMeetingUpsertInput {
  meetingDate: string;
  title?: string;
  /** Objets partiels acceptés ; normalisation côté repository */
  discours?: unknown;
  /** Compte-rendu (Markdown ou texte libre) */
  compteRendu?: string;
}

export class StaffMonthlyMeetingRepository {
  async listAll(): Promise<StaffMonthlyMeeting[]> {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select("*")
      .order("meeting_date", { ascending: false });

    if (error) throw error;
    return (data || []).map((row) => mapRow(row as DbRow));
  }

  async getById(id: string): Promise<StaffMonthlyMeeting | null> {
    const { data, error } = await supabaseAdmin.from(TABLE).select("*").eq("id", id).maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return mapRow(data as DbRow);
  }

  async create(input: StaffMonthlyMeetingUpsertInput, updatedBy: string): Promise<StaffMonthlyMeeting> {
    const meetingDate = String(input.meetingDate || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(meetingDate)) {
      throw new Error("INVALID_DATE");
    }

    const payload = {
      meeting_date: meetingDate,
      title: String(input.title ?? "").trim(),
      discours: normalizeDiscours(Array.isArray(input.discours) ? input.discours : []),
      compte_rendu: String(input.compteRendu ?? "").trim(),
      created_by: updatedBy,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin.from(TABLE).insert(payload).select("*").single();
    if (error) throw error;
    return mapRow(data as DbRow);
  }

  async update(id: string, input: StaffMonthlyMeetingUpsertInput, updatedBy: string): Promise<StaffMonthlyMeeting> {
    const meetingDate = String(input.meetingDate || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(meetingDate)) {
      throw new Error("INVALID_DATE");
    }

    const payload = {
      meeting_date: meetingDate,
      title: String(input.title ?? "").trim(),
      discours: normalizeDiscours(Array.isArray(input.discours) ? input.discours : []),
      compte_rendu: String(input.compteRendu ?? "").trim(),
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin.from(TABLE).update(payload).eq("id", id).select("*").single();
    if (error) throw error;
    return mapRow(data as DbRow);
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabaseAdmin.from(TABLE).delete().eq("id", id);
    if (error) throw error;
  }
}

export const staffMonthlyMeetingRepository = new StaffMonthlyMeetingRepository();
