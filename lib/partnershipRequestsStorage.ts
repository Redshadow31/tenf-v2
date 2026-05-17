/**
 * Couche de stockage pour les demandes de partenariat soumises depuis la
 * modale publique /partenariats. Stocke en Supabase (tables
 * partnership_requests + partnership_request_notes — voir migration 0051).
 *
 * Toutes les fonctions admin (list, get, update, addNote) utilisent
 * supabaseAdmin (clé service_role) et doivent être appelées uniquement
 * derrière `requireSectionAccess('/admin/partenariats')` côté API.
 *
 * La fonction publique `createPartnershipRequest` est appelée depuis
 * `POST /api/partnerships` ; elle valide et insère via supabaseAdmin afin
 * d'éviter qu'un visiteur puisse forger le `status` ou les colonnes admin.
 */

import { supabaseAdmin } from "@/lib/db/supabase";

export type PartnershipRequestStatus =
  | "new"
  | "in_review"
  | "in_meeting"
  | "accepted"
  | "refused"
  | "archived";

export type RiskLevel = "low" | "medium" | "high";

export type PartnershipType =
  | "inter_serveurs"
  | "evenementiel"
  | "caritatif"
  | "visibilite"
  | "autre";

export type DesiredDuration =
  | "ponctuel"
  | "30_jours"
  | "3_mois"
  | "long_terme"
  | "a_definir"
  | null;

export interface PartnershipRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: PartnershipRequestStatus;

  projectName: string;
  partnershipType: PartnershipType;
  projectDescription: string;
  discordLink: string | null;
  twitchLink: string | null;
  websiteLink: string | null;
  socialLinks: string | null;

  contactName: string;
  contactRole: string | null;
  contactEmail: string;
  contactDiscord: string | null;
  otherContact: string | null;

  partnershipGoal: string;
  partnerOffers: string;
  partnerExpectations: string;
  desiredDuration: DesiredDuration;
  desiredDate: string | null;
  targetAudience: string | null;
  estimatedMembers: string | null;

  independenceAccepted: boolean;
  noRecruitmentAccepted: boolean;
  confidentialityAccepted: boolean;
  observationAccepted: boolean;
  interruptionAccepted: boolean;

  additionalMessage: string | null;

  representativeConfirmed: boolean;
  dataUsageAccepted: boolean;

  // Workflow admin
  decisionReason: string | null;
  reviewDueDate: string | null;
}

export interface PartnershipRequestReview {
  id: string;
  requestId: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
  valuesAlignment: number | null;
  membersInterest: number | null;
  partnerSeriousness: number | null;
  recruitmentRisk: RiskLevel | null;
  confusionRisk: RiskLevel | null;
  observationNeeded: boolean | null;
  comment: string | null;
}

export interface UpsertPartnershipReviewInput {
  requestId: string;
  updatedBy: string;
  valuesAlignment: number | null;
  membersInterest: number | null;
  partnerSeriousness: number | null;
  recruitmentRisk: RiskLevel | null;
  confusionRisk: RiskLevel | null;
  observationNeeded: boolean | null;
  comment: string | null;
}

export interface PartnershipRequestNote {
  id: string;
  requestId: string;
  createdAt: string;
  author: string;
  note: string;
}

export interface CreatePartnershipRequestInput {
  projectName: string;
  partnershipType: PartnershipType;
  projectDescription: string;
  discordLink?: string | null;
  twitchLink?: string | null;
  websiteLink?: string | null;
  socialLinks?: string | null;
  contactName: string;
  contactRole?: string | null;
  contactEmail: string;
  contactDiscord?: string | null;
  otherContact?: string | null;
  partnershipGoal: string;
  partnerOffers: string;
  partnerExpectations: string;
  desiredDuration?: DesiredDuration;
  desiredDate?: string | null;
  targetAudience?: string | null;
  estimatedMembers?: string | null;
  independenceAccepted: boolean;
  noRecruitmentAccepted: boolean;
  confidentialityAccepted: boolean;
  observationAccepted: boolean;
  interruptionAccepted: boolean;
  additionalMessage?: string | null;
  representativeConfirmed: boolean;
  dataUsageAccepted: boolean;
  submittedIp?: string | null;
  submittedUserAgent?: string | null;
}

export const PARTNERSHIP_STATUSES: readonly PartnershipRequestStatus[] = [
  "new",
  "in_review",
  "in_meeting",
  "accepted",
  "refused",
  "archived",
] as const;

export const RISK_LEVELS: readonly RiskLevel[] = ["low", "medium", "high"] as const;

/**
 * Statuts pour lesquels un motif de décision interne est obligatoire
 * côté API et UI admin.
 */
export const STATUSES_REQUIRING_DECISION_REASON: readonly PartnershipRequestStatus[] = [
  "accepted",
  "refused",
] as const;

export const PARTNERSHIP_TYPES: readonly PartnershipType[] = [
  "inter_serveurs",
  "evenementiel",
  "caritatif",
  "visibilite",
  "autre",
] as const;

export const PARTNERSHIP_DURATIONS: readonly NonNullable<DesiredDuration>[] = [
  "ponctuel",
  "30_jours",
  "3_mois",
  "long_terme",
  "a_definir",
] as const;

export const STATUS_LABELS: Record<PartnershipRequestStatus, string> = {
  new: "Nouveau",
  in_review: "En étude",
  in_meeting: "À discuter en réunion",
  accepted: "Accepté",
  refused: "Refusé",
  archived: "Archivé",
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Faible",
  medium: "Moyen",
  high: "Fort",
};

export const TYPE_LABELS: Record<PartnershipType, string> = {
  inter_serveurs: "Inter-serveurs d'entraide",
  evenementiel: "Événementiel",
  caritatif: "Caritatif / associatif",
  visibilite: "Visibilité / promotion croisée",
  autre: "Autre",
};

export const DURATION_LABELS: Record<NonNullable<DesiredDuration>, string> = {
  ponctuel: "Ponctuel",
  "30_jours": "30 jours",
  "3_mois": "3 mois",
  long_terme: "Long terme",
  a_definir: "À définir ensemble",
};

type Row = Record<string, unknown>;

function rowToRequest(row: Row): PartnershipRequest {
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at ?? row.created_at),
    status: row.status as PartnershipRequestStatus,
    projectName: String(row.project_name ?? ""),
    partnershipType: row.partnership_type as PartnershipType,
    projectDescription: String(row.project_description ?? ""),
    discordLink: (row.discord_link as string | null) ?? null,
    twitchLink: (row.twitch_link as string | null) ?? null,
    websiteLink: (row.website_link as string | null) ?? null,
    socialLinks: (row.social_links as string | null) ?? null,
    contactName: String(row.contact_name ?? ""),
    contactRole: (row.contact_role as string | null) ?? null,
    contactEmail: String(row.contact_email ?? ""),
    contactDiscord: (row.contact_discord as string | null) ?? null,
    otherContact: (row.other_contact as string | null) ?? null,
    partnershipGoal: String(row.partnership_goal ?? ""),
    partnerOffers: String(row.partner_offers ?? ""),
    partnerExpectations: String(row.partner_expectations ?? ""),
    desiredDuration: (row.desired_duration as DesiredDuration) ?? null,
    desiredDate: (row.desired_date as string | null) ?? null,
    targetAudience: (row.target_audience as string | null) ?? null,
    estimatedMembers: (row.estimated_members as string | null) ?? null,
    independenceAccepted: Boolean(row.independence_accepted),
    noRecruitmentAccepted: Boolean(row.no_recruitment_accepted),
    confidentialityAccepted: Boolean(row.confidentiality_accepted),
    observationAccepted: Boolean(row.observation_accepted),
    interruptionAccepted: Boolean(row.interruption_accepted),
    additionalMessage: (row.additional_message as string | null) ?? null,
    representativeConfirmed: Boolean(row.representative_confirmed),
    dataUsageAccepted: Boolean(row.data_usage_accepted),
    decisionReason: (row.decision_reason as string | null) ?? null,
    reviewDueDate: (row.review_due_date as string | null) ?? null,
  };
}

function rowToReview(row: Row): PartnershipRequestReview {
  const valuesAlignment = row.values_alignment;
  const membersInterest = row.members_interest;
  const partnerSeriousness = row.partner_seriousness;
  return {
    id: String(row.id),
    requestId: String(row.request_id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at ?? row.created_at),
    updatedBy: (row.updated_by as string | null) ?? null,
    valuesAlignment: typeof valuesAlignment === "number" ? valuesAlignment : null,
    membersInterest: typeof membersInterest === "number" ? membersInterest : null,
    partnerSeriousness: typeof partnerSeriousness === "number" ? partnerSeriousness : null,
    recruitmentRisk: (row.recruitment_risk as RiskLevel | null) ?? null,
    confusionRisk: (row.confusion_risk as RiskLevel | null) ?? null,
    observationNeeded: typeof row.observation_needed === "boolean" ? row.observation_needed : null,
    comment: (row.comment as string | null) ?? null,
  };
}

function rowToNote(row: Row): PartnershipRequestNote {
  return {
    id: String(row.id),
    requestId: String(row.request_id),
    createdAt: String(row.created_at),
    author: String(row.author ?? ""),
    note: String(row.note ?? ""),
  };
}

export async function createPartnershipRequest(
  input: CreatePartnershipRequestInput
): Promise<PartnershipRequest> {
  const payload = {
    status: "new" as const,
    project_name: input.projectName,
    partnership_type: input.partnershipType,
    project_description: input.projectDescription,
    discord_link: input.discordLink ?? null,
    twitch_link: input.twitchLink ?? null,
    website_link: input.websiteLink ?? null,
    social_links: input.socialLinks ?? null,
    contact_name: input.contactName,
    contact_role: input.contactRole ?? null,
    contact_email: input.contactEmail,
    contact_discord: input.contactDiscord ?? null,
    other_contact: input.otherContact ?? null,
    partnership_goal: input.partnershipGoal,
    partner_offers: input.partnerOffers,
    partner_expectations: input.partnerExpectations,
    desired_duration: input.desiredDuration ?? null,
    desired_date: input.desiredDate ?? null,
    target_audience: input.targetAudience ?? null,
    estimated_members: input.estimatedMembers ?? null,
    independence_accepted: input.independenceAccepted,
    no_recruitment_accepted: input.noRecruitmentAccepted,
    confidentiality_accepted: input.confidentialityAccepted,
    observation_accepted: input.observationAccepted,
    interruption_accepted: input.interruptionAccepted,
    additional_message: input.additionalMessage ?? null,
    representative_confirmed: input.representativeConfirmed,
    data_usage_accepted: input.dataUsageAccepted,
    submitted_ip: input.submittedIp ?? null,
    submitted_user_agent: input.submittedUserAgent ?? null,
  };

  const { data, error } = await supabaseAdmin
    .from("partnership_requests")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Insertion partnership_request échouée");
  }
  return rowToRequest(data as Row);
}

export interface ListPartnershipRequestsOptions {
  status?: PartnershipRequestStatus | "all";
  type?: PartnershipType | "all";
  search?: string;
  limit?: number;
}

export async function listPartnershipRequests(
  options: ListPartnershipRequestsOptions = {}
): Promise<PartnershipRequest[]> {
  let query = supabaseAdmin
    .from("partnership_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (options.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }
  if (options.type && options.type !== "all") {
    query = query.eq("partnership_type", options.type);
  }
  if (options.search && options.search.trim().length > 0) {
    const term = options.search.trim().replace(/[%,]/g, " ");
    // ilike sur 3 colonnes : project_name, contact_email, contact_discord
    query = query.or(
      `project_name.ilike.%${term}%,contact_email.ilike.%${term}%,contact_discord.ilike.%${term}%`
    );
  }
  if (typeof options.limit === "number" && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return (data || []).map((row) => rowToRequest(row as Row));
}

export async function getPartnershipRequest(id: string): Promise<{
  request: PartnershipRequest;
  notes: PartnershipRequestNote[];
  review: PartnershipRequestReview | null;
} | null> {
  const { data: requestRow, error: requestError } = await supabaseAdmin
    .from("partnership_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (requestError) throw new Error(requestError.message);
  if (!requestRow) return null;

  const { data: noteRows, error: noteError } = await supabaseAdmin
    .from("partnership_request_notes")
    .select("*")
    .eq("request_id", id)
    .order("created_at", { ascending: false });

  if (noteError) throw new Error(noteError.message);

  const { data: reviewRow, error: reviewError } = await supabaseAdmin
    .from("partnership_request_reviews")
    .select("*")
    .eq("request_id", id)
    .maybeSingle();

  if (reviewError) throw new Error(reviewError.message);

  return {
    request: rowToRequest(requestRow as Row),
    notes: (noteRows || []).map((row) => rowToNote(row as Row)),
    review: reviewRow ? rowToReview(reviewRow as Row) : null,
  };
}

export interface UpdatePartnershipStatusInput {
  status: PartnershipRequestStatus;
  /** Obligatoire si status ∈ STATUSES_REQUIRING_DECISION_REASON. */
  decisionReason?: string | null;
  /** Optionnelle, n'a de sens que si status === "accepted". */
  reviewDueDate?: string | null;
}

export async function updatePartnershipRequestStatus(
  id: string,
  input: UpdatePartnershipStatusInput
): Promise<PartnershipRequest> {
  const payload: Record<string, unknown> = {
    status: input.status,
  };

  // Pour les statuts "accepted" / "refused" on enregistre le motif fourni
  // (l'API a déjà vérifié qu'il est non vide).
  // Pour les autres statuts, on nettoie systématiquement le motif :
  // un retour en "in_review" n'a pas vocation à garder un motif obsolète.
  if (STATUSES_REQUIRING_DECISION_REASON.includes(input.status)) {
    payload.decision_reason = (input.decisionReason ?? "").trim() || null;
  } else {
    payload.decision_reason = null;
  }

  if (input.status === "accepted") {
    // On préserve la date de bilan existante si l'appelant n'en envoie pas.
    if (input.reviewDueDate !== undefined) {
      payload.review_due_date = input.reviewDueDate;
    }
  } else {
    // Pour tout autre statut, on nettoie systématiquement la date de bilan
    // (elle n'a de sens que pour un partenariat accepté).
    payload.review_due_date = null;
  }

  const { data, error } = await supabaseAdmin
    .from("partnership_requests")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Mise à jour partnership_request échouée");
  }
  return rowToRequest(data as Row);
}

export async function getPartnershipRequestReview(
  requestId: string
): Promise<PartnershipRequestReview | null> {
  const { data, error } = await supabaseAdmin
    .from("partnership_request_reviews")
    .select("*")
    .eq("request_id", requestId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToReview(data as Row) : null;
}

export async function upsertPartnershipRequestReview(
  input: UpsertPartnershipReviewInput
): Promise<PartnershipRequestReview> {
  const payload = {
    request_id: input.requestId,
    updated_by: input.updatedBy,
    values_alignment: input.valuesAlignment,
    members_interest: input.membersInterest,
    partner_seriousness: input.partnerSeriousness,
    recruitment_risk: input.recruitmentRisk,
    confusion_risk: input.confusionRisk,
    observation_needed: input.observationNeeded,
    comment: input.comment,
  };

  // `onConflict: 'request_id'` requiert l'index UNIQUE sur request_id
  // posé par la migration 0052.
  const { data, error } = await supabaseAdmin
    .from("partnership_request_reviews")
    .upsert(payload, { onConflict: "request_id" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Mise à jour partnership_request_review échouée");
  }
  return rowToReview(data as Row);
}

export async function addPartnershipRequestNote(input: {
  requestId: string;
  author: string;
  note: string;
}): Promise<PartnershipRequestNote> {
  const { data, error } = await supabaseAdmin
    .from("partnership_request_notes")
    .insert({
      request_id: input.requestId,
      author: input.author,
      note: input.note,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Insertion note échouée");
  }
  return rowToNote(data as Row);
}
