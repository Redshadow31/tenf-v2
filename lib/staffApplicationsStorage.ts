import { supabaseAdmin } from "@/lib/db/supabase";

export type StaffApplicationRole = "moderateur" | "soutien" | "les_deux";
export type StaffApplicationStatus =
  | "nouveau"
  | "a_contacter"
  | "entretien_prevu"
  | "accepte"
  | "refuse"
  | "archive";

export interface StaffApplicationAnswers {
  pseudo_discord: string;
  pseudo_twitch?: string;
  age: number;
  pays_fuseau: string;
  disponibilites: string;
  micro_ok: boolean;
  vocal_reunion: "oui" | "non" | "parfois";

  role_postule: StaffApplicationRole;

  experience_modo: boolean;
  experience_details?: string;
  experience_similaire?: string;
  pourquoi_tenf: string;
  pourquoi_role: string;
  motivation_560: string;

  niveau_discord: 1 | 2 | 3 | 4 | 5;
  principes_proportionnalite: boolean;
  principes_proportionnalite_explication: string;
  difference_sanctions: boolean;
  difference_sanctions_exemple: string;
  redaction_cr: boolean;

  scenario_critique_staff: string;
  scenario_clash_vocal: string;
  scenario_dm_grave: string;
  scenario_spam_promo: string;
  scenario_modo_sec: string;
  scenario_manipulation: string;
  scenario_intrusif_vocal: string;

  style_communication: "direct" | "empathique" | "structure" | "mixte" | "autre";
  style_communication_autre?: string;
  contradiction: string;
  quand_jai_tort: string;
  limites_declencheurs: string;
  prise_de_recul: string;

  energie_mentale: 1 | 2 | 3 | 4 | 5;
  periode_impact: "non" | "oui_legere" | "oui_importante";
  periode_gestion?: string;
  reaction_stress: Array<"renfermer" | "enerver" | "trop_parler" | "controle" | "pleurer" | "autre">;
  reaction_stress_autre?: string;
  preference_cadre: "cadre" | "humain" | "mix";
  preference_cadre_detail?: string;
  passer_relais: boolean;
  passer_relais_exemple: string;
  desaccord_staff: string;
  accepte_pause_retrait: boolean;
  accepte_pause_retrait_pourquoi: string;

  accepte_confidentialite: boolean;
  ami_demande_infos: string;
  accepte_documenter: boolean;

  engagement_hebdo: "2h" | "4h" | "6h" | "variable";
  engagement_hebdo_variable?: string;
  poles_interet: string[];
  objectif_apprentissage: string;

  consentement_traitement: boolean;
  comprend_entretien: boolean;
  commentaire_libre?: string;
}

export interface StaffApplication {
  id: string;
  created_at: string;
  updated_at: string;
  applicant_discord_id: string;
  applicant_username: string;
  applicant_avatar?: string | null;
  answers: StaffApplicationAnswers;
  admin_status: StaffApplicationStatus;
  admin_notes: string[];
  red_flags: string[];
  has_red_flag: boolean;
  assigned_to?: string;
  last_contacted_at?: string;
  score?: number;
}

type StaffApplicationRow = {
  id: string;
  created_at: string;
  updated_at: string;
  applicant_discord_id: string;
  applicant_username: string;
  applicant_avatar: string | null;
  answers: StaffApplicationAnswers;
  admin_status: StaffApplicationStatus;
  admin_notes: string[] | null;
  red_flags: string[] | null;
  has_red_flag: boolean | null;
  assigned_to: string | null;
  last_contacted_at: string | null;
  score: number | null;
};

function mapRowToApplication(row: StaffApplicationRow): StaffApplication {
  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    applicant_discord_id: row.applicant_discord_id,
    applicant_username: row.applicant_username,
    applicant_avatar: row.applicant_avatar,
    answers: row.answers,
    admin_status: row.admin_status,
    admin_notes: row.admin_notes || [],
    red_flags: row.red_flags || [],
    has_red_flag: !!row.has_red_flag,
    assigned_to: row.assigned_to || undefined,
    last_contacted_at: row.last_contacted_at || undefined,
    score: row.score ?? undefined,
  };
}

export async function loadStaffApplications(): Promise<StaffApplication[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("staff_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return ((data || []) as StaffApplicationRow[]).map(mapRowToApplication);
  } catch (error) {
    console.error("[StaffApplications] Erreur chargement:", error);
    return [];
  }
}

export async function loadStaffApplicationsByApplicant(discordId: string): Promise<StaffApplication[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("staff_applications")
      .select("*")
      .eq("applicant_discord_id", discordId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return ((data || []) as StaffApplicationRow[]).map(mapRowToApplication);
  } catch (error) {
    console.error("[StaffApplications] Erreur chargement candidat:", error);
    return [];
  }
}

export async function createStaffApplication(input: {
  applicant_discord_id: string;
  applicant_username: string;
  applicant_avatar?: string | null;
  answers: StaffApplicationAnswers;
}): Promise<StaffApplication> {
  const applications = await loadStaffApplications();

  const existingOpen = applications.find(
    (item) =>
      item.applicant_discord_id === input.applicant_discord_id &&
      item.answers.role_postule === input.answers.role_postule &&
      ["nouveau", "a_contacter", "entretien_prevu"].includes(item.admin_status)
  );
  if (existingOpen) {
    throw new Error("Une candidature active existe déjà pour ce rôle.");
  }

  const now = new Date().toISOString();
  const insertPayload = {
    created_at: now,
    updated_at: now,
    applicant_discord_id: input.applicant_discord_id,
    applicant_username: input.applicant_username,
    applicant_avatar: input.applicant_avatar || null,
    answers: input.answers,
    admin_status: "nouveau" as StaffApplicationStatus,
    admin_notes: [] as string[],
    red_flags: [] as string[],
    has_red_flag: false,
    assigned_to: null as string | null,
    last_contacted_at: null as string | null,
    score: null as number | null,
  };

  const { data, error } = await supabaseAdmin
    .from("staff_applications")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error || !data) {
    throw error || new Error("Création de la candidature impossible.");
  }

  return mapRowToApplication(data as StaffApplicationRow);
}

export async function updateStaffApplicationAdmin(input: {
  id: string;
  admin_status?: StaffApplicationStatus;
  admin_note?: string;
  has_red_flag?: boolean;
  red_flag_label?: string;
  assigned_to?: string;
  last_contacted_at?: string;
}): Promise<StaffApplication | null> {
  const { data: currentData, error: currentError } = await supabaseAdmin
    .from("staff_applications")
    .select("*")
    .eq("id", input.id)
    .single();

  if (currentError || !currentData) return null;

  const current = mapRowToApplication(currentData as StaffApplicationRow);

  const next: StaffApplication = { ...current, updated_at: new Date().toISOString() };

  if (input.admin_status) next.admin_status = input.admin_status;
  if (input.assigned_to !== undefined) next.assigned_to = input.assigned_to || undefined;
  if (input.last_contacted_at !== undefined) next.last_contacted_at = input.last_contacted_at || undefined;

  if (input.admin_note && input.admin_note.trim()) {
    next.admin_notes = [...(next.admin_notes || []), input.admin_note.trim()];
  }

  if (input.has_red_flag !== undefined) {
    next.has_red_flag = input.has_red_flag;
    if (input.has_red_flag) {
      const label = (input.red_flag_label || "Red flag manuel").trim();
      next.red_flags = Array.from(new Set([...(next.red_flags || []), label]));
    } else {
      next.red_flags = [];
    }
  }

  const updatePayload = {
    updated_at: next.updated_at,
    admin_status: next.admin_status,
    admin_notes: next.admin_notes,
    red_flags: next.red_flags,
    has_red_flag: next.has_red_flag,
    assigned_to: next.assigned_to || null,
    last_contacted_at: next.last_contacted_at || null,
  };

  const { data: updatedData, error: updateError } = await supabaseAdmin
    .from("staff_applications")
    .update(updatePayload)
    .eq("id", input.id)
    .select("*")
    .single();

  if (updateError || !updatedData) {
    throw updateError || new Error("Mise à jour de la candidature impossible.");
  }

  return mapRowToApplication(updatedData as StaffApplicationRow);
}

export async function updateStaffApplicationCandidate(input: {
  id: string;
  applicant_discord_id: string;
  answers: StaffApplicationAnswers;
  applicant_username?: string;
  applicant_avatar?: string | null;
}): Promise<StaffApplication | null> {
  const { data: currentData, error: currentError } = await supabaseAdmin
    .from("staff_applications")
    .select("*")
    .eq("id", input.id)
    .eq("applicant_discord_id", input.applicant_discord_id)
    .single();

  if (currentError || !currentData) return null;

  const current = mapRowToApplication(currentData as StaffApplicationRow);
  const editableStatuses: StaffApplicationStatus[] = ["nouveau", "a_contacter", "entretien_prevu"];
  if (!editableStatuses.includes(current.admin_status)) {
    return null;
  }

  const updatePayload = {
    updated_at: new Date().toISOString(),
    answers: input.answers,
    applicant_username: input.applicant_username || current.applicant_username,
    applicant_avatar: input.applicant_avatar ?? current.applicant_avatar ?? null,
  };

  const { data: updatedData, error: updateError } = await supabaseAdmin
    .from("staff_applications")
    .update(updatePayload)
    .eq("id", input.id)
    .eq("applicant_discord_id", input.applicant_discord_id)
    .select("*")
    .single();

  if (updateError || !updatedData) {
    throw updateError || new Error("Mise à jour candidat impossible.");
  }

  return mapRowToApplication(updatedData as StaffApplicationRow);
}

export async function cancelStaffApplicationCandidate(input: {
  id: string;
  applicant_discord_id: string;
}): Promise<StaffApplication | null> {
  const { data: currentData, error: currentError } = await supabaseAdmin
    .from("staff_applications")
    .select("*")
    .eq("id", input.id)
    .eq("applicant_discord_id", input.applicant_discord_id)
    .single();

  if (currentError || !currentData) return null;

  const current = mapRowToApplication(currentData as StaffApplicationRow);
  const cancellableStatuses: StaffApplicationStatus[] = ["nouveau", "a_contacter", "entretien_prevu"];
  if (!cancellableStatuses.includes(current.admin_status)) {
    return null;
  }

  const nextNotes = [
    ...(current.admin_notes || []),
    "Candidature annulee par le candidat.",
  ];

  const { data: updatedData, error: updateError } = await supabaseAdmin
    .from("staff_applications")
    .update({
      updated_at: new Date().toISOString(),
      admin_status: "archive",
      admin_notes: nextNotes,
    })
    .eq("id", input.id)
    .eq("applicant_discord_id", input.applicant_discord_id)
    .select("*")
    .single();

  if (updateError || !updatedData) {
    throw updateError || new Error("Annulation candidature impossible.");
  }

  return mapRowToApplication(updatedData as StaffApplicationRow);
}
