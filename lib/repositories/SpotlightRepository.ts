// Repository pour les spotlights - Utilise Supabase
import { supabaseAdmin } from '../db/supabase';

export interface Spotlight {
  id: string;
  streamerTwitchLogin: string;
  streamerDisplayName?: string;
  startedAt: Date;
  endsAt: Date;
  status: 'active' | 'completed' | 'cancelled';
  moderatorDiscordId: string;
  moderatorUsername: string;
  createdAt: Date;
  createdBy: string;
}

export interface SpotlightPresence {
  id: string;
  spotlightId: string;
  twitchLogin: string;
  displayName?: string;
  addedAt: Date;
  addedBy: string;
}

export interface SpotlightEvaluation {
  id: string;
  spotlightId: string;
  streamerTwitchLogin: string;
  criteria: Array<{
    id: string;
    label: string;
    maxValue: number;
    value: number;
  }>;
  totalScore: number;
  maxScore: number;
  moderatorComments?: string;
  evaluatedAt: Date;
  evaluatedBy: string;
  validated: boolean;
  validatedAt?: Date;
}

export class SpotlightRepository {
  /**
   * Récupère le spotlight actif
   */
  async findActive(): Promise<Spotlight | null> {
    const { data, error } = await supabaseAdmin
      .from('spotlights')
      .select('*')
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? this.mapToSpotlight(data) : null;
  }

  /**
   * Récupère un spotlight par son ID
   */
  async findById(id: string): Promise<Spotlight | null> {
    const { data, error } = await supabaseAdmin
      .from('spotlights')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? this.mapToSpotlight(data) : null;
  }

  /**
   * Récupère tous les spotlights avec pagination
   * @param limit - Nombre maximum de résultats (défaut: 50)
   * @param offset - Nombre de résultats à ignorer (défaut: 0)
   */
  async findAll(limit = 50, offset = 0): Promise<Spotlight[]> {
    const { data, error } = await supabaseAdmin
      .from('spotlights')
      .select('*')
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return (data || []).map(this.mapToSpotlight);
  }

  /**
   * Crée un nouveau spotlight
   */
  async create(spotlight: Partial<Spotlight>): Promise<Spotlight> {
    const spotlightRecord = this.mapToDbFormat(spotlight);

    const { data, error } = await supabaseAdmin
      .from('spotlights')
      .insert(spotlightRecord)
      .select()
      .single();

    if (error) throw error;

    return this.mapToSpotlight(data);
  }

  /**
   * Met à jour un spotlight
   */
  async update(id: string, updates: Partial<Spotlight>): Promise<Spotlight> {
    const updateRecord = this.mapToDbFormat(updates);

    const { data, error } = await supabaseAdmin
      .from('spotlights')
      .update(updateRecord)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error(`Spotlight not found: ${id}`);

    return this.mapToSpotlight(data);
  }

  /**
   * Récupère les présences d'un spotlight
   */
  async getPresences(spotlightId: string): Promise<SpotlightPresence[]> {
    const { data, error } = await supabaseAdmin
      .from('spotlight_presences')
      .select('*')
      .eq('spotlight_id', spotlightId)
      .order('added_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(this.mapToPresence);
  }

  /**
   * Ajoute une présence à un spotlight
   */
  async addPresence(presence: Partial<SpotlightPresence>): Promise<SpotlightPresence> {
    const presenceRecord: any = {
      spotlight_id: presence.spotlightId,
      twitch_login: presence.twitchLogin,
      display_name: presence.displayName || null,
      added_at: presence.addedAt?.toISOString() || new Date().toISOString(),
      added_by: presence.addedBy,
    };

    const { data, error } = await supabaseAdmin
      .from('spotlight_presences')
      .insert(presenceRecord)
      .select()
      .single();

    if (error) throw error;

    return this.mapToPresence(data);
  }

  /**
   * Supprime une présence d'un spotlight
   */
  async deletePresence(spotlightId: string, twitchLogin: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('spotlight_presences')
      .delete()
      .eq('spotlight_id', spotlightId)
      .eq('twitch_login', twitchLogin.toLowerCase());

    if (error) throw error;
  }

  /**
   * Remplace toutes les présences d'un spotlight
   */
  async replacePresences(spotlightId: string, presences: Partial<SpotlightPresence>[]): Promise<SpotlightPresence[]> {
    // Supprimer toutes les présences existantes
    const { error: deleteError } = await supabaseAdmin
      .from('spotlight_presences')
      .delete()
      .eq('spotlight_id', spotlightId);

    if (deleteError) throw deleteError;

    // Insérer les nouvelles présences
    if (presences.length === 0) {
      return [];
    }

    const presenceRecords = presences.map(p => ({
      spotlight_id: spotlightId,
      twitch_login: p.twitchLogin,
      display_name: p.displayName || null,
      added_at: p.addedAt?.toISOString() || new Date().toISOString(),
      added_by: p.addedBy || '',
    }));

    const { data, error } = await supabaseAdmin
      .from('spotlight_presences')
      .insert(presenceRecords)
      .select();

    if (error) throw error;

    return (data || []).map(this.mapToPresence);
  }

  /**
   * Récupère l'évaluation d'un spotlight
   */
  async getEvaluation(spotlightId: string): Promise<SpotlightEvaluation | null> {
    const { data, error } = await supabaseAdmin
      .from('spotlight_evaluations')
      .select('*')
      .eq('spotlight_id', spotlightId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? this.mapToEvaluation(data) : null;
  }

  /**
   * Crée ou met à jour l'évaluation d'un spotlight
   */
  async saveEvaluation(evaluation: Partial<SpotlightEvaluation>): Promise<SpotlightEvaluation> {
    const evalRecord: any = {
      spotlight_id: evaluation.spotlightId,
      streamer_twitch_login: evaluation.streamerTwitchLogin,
      criteria: evaluation.criteria,
      total_score: evaluation.totalScore,
      max_score: evaluation.maxScore,
      moderator_comments: evaluation.moderatorComments || null,
      evaluated_at: evaluation.evaluatedAt?.toISOString() || new Date().toISOString(),
      evaluated_by: evaluation.evaluatedBy,
      validated: evaluation.validated || false,
      validated_at: evaluation.validatedAt?.toISOString() || null,
    };

    const { data, error } = await supabaseAdmin
      .from('spotlight_evaluations')
      .upsert(evalRecord, { onConflict: 'spotlight_id' })
      .select()
      .single();

    if (error) throw error;

    return this.mapToEvaluation(data);
  }

  private mapToSpotlight(row: any): Spotlight {
    return {
      id: row.id,
      streamerTwitchLogin: row.streamer_twitch_login,
      streamerDisplayName: row.streamer_display_name || undefined,
      startedAt: new Date(row.started_at),
      endsAt: new Date(row.ends_at),
      status: row.status,
      moderatorDiscordId: row.moderator_discord_id,
      moderatorUsername: row.moderator_username,
      createdAt: new Date(row.created_at),
      createdBy: row.created_by,
    };
  }

  private mapToPresence(row: any): SpotlightPresence {
    return {
      id: row.id,
      spotlightId: row.spotlight_id,
      twitchLogin: row.twitch_login,
      displayName: row.display_name || undefined,
      addedAt: new Date(row.added_at),
      addedBy: row.added_by,
    };
  }

  private mapToEvaluation(row: any): SpotlightEvaluation {
    return {
      id: row.id,
      spotlightId: row.spotlight_id,
      streamerTwitchLogin: row.streamer_twitch_login,
      criteria: row.criteria,
      totalScore: row.total_score,
      maxScore: row.max_score,
      moderatorComments: row.moderator_comments || undefined,
      evaluatedAt: new Date(row.evaluated_at),
      evaluatedBy: row.evaluated_by,
      validated: row.validated,
      validatedAt: row.validated_at ? new Date(row.validated_at) : undefined,
    };
  }

  private mapToDbFormat(spotlight: Partial<Spotlight>): any {
    const record: any = {};

    if (spotlight.id !== undefined) record.id = spotlight.id;
    if (spotlight.streamerTwitchLogin !== undefined) record.streamer_twitch_login = spotlight.streamerTwitchLogin;
    if (spotlight.streamerDisplayName !== undefined) record.streamer_display_name = spotlight.streamerDisplayName;
    if (spotlight.startedAt !== undefined) {
      record.started_at = spotlight.startedAt instanceof Date 
        ? spotlight.startedAt.toISOString() 
        : spotlight.startedAt;
    }
    if (spotlight.endsAt !== undefined) {
      record.ends_at = spotlight.endsAt instanceof Date 
        ? spotlight.endsAt.toISOString() 
        : spotlight.endsAt;
    }
    if (spotlight.status !== undefined) record.status = spotlight.status;
    if (spotlight.moderatorDiscordId !== undefined) record.moderator_discord_id = spotlight.moderatorDiscordId;
    if (spotlight.moderatorUsername !== undefined) record.moderator_username = spotlight.moderatorUsername;
    if (spotlight.createdBy !== undefined) record.created_by = spotlight.createdBy;
    if (spotlight.createdAt !== undefined) {
      record.created_at = spotlight.createdAt instanceof Date 
        ? spotlight.createdAt.toISOString() 
        : spotlight.createdAt;
    }

    return record;
  }
}

export const spotlightRepository = new SpotlightRepository();
