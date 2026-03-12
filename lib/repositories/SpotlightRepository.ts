// Repository pour les spotlights - Utilise Supabase
import { supabaseAdmin } from '../db/supabase';

export interface Spotlight {
  id: string;
  streamerTwitchLogin: string;
  streamerDisplayName?: string;
  startedAt: Date;
  endsAt?: Date;
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

const SPOTLIGHT_EVAL_METRIC = 'evaluation_total_score';

export class SpotlightRepository {
  private isMissingColumnError(error: any): boolean {
    const text = String(error?.message || error?.details || "").toLowerCase();
    return error?.code === "42703" || text.includes("column") || text.includes("does not exist");
  }

  /**
   * Retourne les IDs potentiels d'un spotlight:
   * - l'ID courant
   * - un éventuel ID legacy si présent en colonne
   * - fallback heuristique via spotlight_metrics (streamer + fenetre temporelle)
   */
  private async getSpotlightIdAliases(spotlightId: string): Promise<string[]> {
    const aliases = new Set<string>([spotlightId]);

    try {
      const { data, error } = await supabaseAdmin
        .from('spotlights')
        .select('*')
        .eq('id', spotlightId)
        .maybeSingle();

      if (error || !data) {
        return Array.from(aliases);
      }

      if (data.legacy_spotlight_id) {
        aliases.add(String(data.legacy_spotlight_id));
      }

      const startsAtRaw = data.starts_at || data.started_at;
      const streamerLogin = (data.streamer_twitch_login || '').toLowerCase();
      if (!startsAtRaw || !streamerLogin) {
        return Array.from(aliases);
      }

      const startsAt = new Date(startsAtRaw);
      if (Number.isNaN(startsAt.getTime())) {
        return Array.from(aliases);
      }

      const windowStart = new Date(startsAt.getTime() - 6 * 60 * 60 * 1000).toISOString();
      const windowEnd = new Date(startsAt.getTime() + 6 * 60 * 60 * 1000).toISOString();

      // Fallback legacy: certains metrics ont garde l'ancien spotlight_id.
      const metrics = await supabaseAdmin
        .from('spotlight_metrics')
        .select('spotlight_id, metadata, measured_at')
        .eq('metric_name', SPOTLIGHT_EVAL_METRIC)
        .gte('measured_at', windowStart)
        .lte('measured_at', windowEnd)
        .limit(50);

      if (!metrics.error && metrics.data?.length) {
        for (const row of metrics.data) {
          const rowStreamer = String(row.metadata?.streamer_twitch_login || '').toLowerCase();
          if (rowStreamer === streamerLogin && row.spotlight_id) {
            aliases.add(String(row.spotlight_id));
          }
        }
      }
    } catch {
      // best effort
    }

    return Array.from(aliases);
  }

  /**
   * Récupère le spotlight actif
   */
  async findActive(): Promise<Spotlight | null> {
    let response = await supabaseAdmin
      .from('spotlights')
      .select('*')
      .eq('status', 'active')
      .order('starts_at', { ascending: false })
      .limit(1)
      .single();

    if (response.error && this.isMissingColumnError(response.error)) {
      response = await supabaseAdmin
        .from('spotlights')
        .select('*')
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();
    }

    if (response.error) {
      if (response.error.code === 'PGRST116') return null;
      throw response.error;
    }

    return response.data ? this.mapToSpotlight(response.data) : null;
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
    let response = await supabaseAdmin
      .from('spotlights')
      .select('*')
      .order('starts_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (response.error && this.isMissingColumnError(response.error)) {
      response = await supabaseAdmin
        .from('spotlights')
        .select('*')
        .order('started_at', { ascending: false })
        .range(offset, offset + limit - 1);
    }

    if (response.error && this.isMissingColumnError(response.error)) {
      response = await supabaseAdmin
        .from('spotlights')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
    }

    if (response.error) throw response.error;

    return (response.data || []).map(this.mapToSpotlight);
  }

  /**
   * Crée un nouveau spotlight
   */
  async create(spotlight: Partial<Spotlight>): Promise<Spotlight> {
    const spotlightRecord = this.mapToDbFormat(spotlight);
    // Compatibilité legacy: certaines tables spotlights n'ont pas de DEFAULT sur id.
    if (spotlightRecord.id === undefined || spotlightRecord.id === null) {
      spotlightRecord.id = crypto.randomUUID();
    }

    let response = await supabaseAdmin
      .from('spotlights')
      .insert(spotlightRecord)
      .select()
      .single();

    if (response.error && this.isMissingColumnError(response.error)) {
      const legacyRecord = { ...spotlightRecord };
      if ('starts_at' in legacyRecord) {
        legacyRecord.started_at = legacyRecord.starts_at;
        delete legacyRecord.starts_at;
      }

      response = await supabaseAdmin
        .from('spotlights')
        .insert(legacyRecord)
        .select()
        .single();
    }

    if (response.error) throw response.error;

    return this.mapToSpotlight(response.data);
  }

  /**
   * Met à jour un spotlight
   */
  async update(id: string, updates: Partial<Spotlight>): Promise<Spotlight> {
    const updateRecord = this.mapToDbFormat(updates);

    let response = await supabaseAdmin
      .from('spotlights')
      .update(updateRecord)
      .eq('id', id)
      .select()
      .single();

    if (response.error && this.isMissingColumnError(response.error)) {
      const legacyUpdateRecord = { ...updateRecord };
      if ('starts_at' in legacyUpdateRecord) {
        legacyUpdateRecord.started_at = legacyUpdateRecord.starts_at;
        delete legacyUpdateRecord.starts_at;
      }

      response = await supabaseAdmin
        .from('spotlights')
        .update(legacyUpdateRecord)
        .eq('id', id)
        .select()
        .single();
    }

    if (response.error) throw response.error;
    if (!response.data) throw new Error(`Spotlight not found: ${id}`);

    return this.mapToSpotlight(response.data);
  }

  /**
   * Récupère les présences d'un spotlight
   */
  async getPresences(spotlightId: string): Promise<SpotlightPresence[]> {
    const spotlightIds = await this.getSpotlightIdAliases(spotlightId);
    const mergedRows: any[] = [];

    for (const id of spotlightIds) {
      const { data, error } = await supabaseAdmin
        .from('spotlight_attendance')
        .select('*')
        .eq('spotlight_id', id)
        .order('added_at', { ascending: false });
      if (error) throw error;
      if (data?.length) mergedRows.push(...data);
    }

    const deduped = new Map<string, any>();
    for (const row of mergedRows) {
      if (!deduped.has(row.id)) deduped.set(row.id, row);
    }

    return Array.from(deduped.values()).map(this.mapToPresence);
  }

  /**
   * Ajoute une présence à un spotlight
   */
  async addPresence(presence: Partial<SpotlightPresence>): Promise<SpotlightPresence> {
    const presenceRecord: any = {
      spotlight_id: presence.spotlightId,
      twitch_login: presence.twitchLogin,
      present: true,
      added_at: presence.addedAt?.toISOString() || new Date().toISOString(),
      added_by: presence.addedBy,
    };

    const { data, error } = await supabaseAdmin
      .from('spotlight_attendance')
      .upsert(presenceRecord, {
        onConflict: 'spotlight_id,twitch_login',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) throw error;

    return this.mapToPresence(data);
  }

  /**
   * Supprime une présence d'un spotlight
   */
  async deletePresence(spotlightId: string, twitchLogin: string): Promise<void> {
    const spotlightIds = await this.getSpotlightIdAliases(spotlightId);
    for (const id of spotlightIds) {
      const { error } = await supabaseAdmin
        .from('spotlight_attendance')
        .delete()
        .eq('spotlight_id', id)
        .eq('twitch_login', twitchLogin.toLowerCase());
      if (error) throw error;
    }
  }

  /**
   * Remplace toutes les présences d'un spotlight
   */
  async replacePresences(spotlightId: string, presences: Partial<SpotlightPresence>[]): Promise<SpotlightPresence[]> {
    const spotlightIds = await this.getSpotlightIdAliases(spotlightId);
    // Supprimer toutes les présences existantes (ID courant + alias)
    for (const id of spotlightIds) {
      const { error: deleteError } = await supabaseAdmin
        .from('spotlight_attendance')
        .delete()
        .eq('spotlight_id', id);
      if (deleteError) throw deleteError;
    }

    // Insérer les nouvelles présences
    if (presences.length === 0) {
      return [];
    }

    const presenceRecords = presences.map(p => ({
      spotlight_id: spotlightId,
      twitch_login: p.twitchLogin,
      present: true,
      added_at: p.addedAt?.toISOString() || new Date().toISOString(),
      added_by: p.addedBy || '',
    }));

    const { data, error } = await supabaseAdmin
      .from('spotlight_attendance')
      .insert(presenceRecords)
      .select();

    if (error) throw error;

    return (data || []).map(this.mapToPresence);
  }

  /**
   * Récupère l'évaluation d'un spotlight
   */
  async getEvaluation(spotlightId: string): Promise<SpotlightEvaluation | null> {
    const spotlightIds = await this.getSpotlightIdAliases(spotlightId);
    const mergedRows: any[] = [];

    for (const id of spotlightIds) {
      const { data, error } = await supabaseAdmin
        .from('spotlight_metrics')
        .select('*')
        .eq('spotlight_id', id)
        .eq('metric_name', SPOTLIGHT_EVAL_METRIC)
        .order('measured_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      if (data?.length) mergedRows.push(...data);
    }

    if (!mergedRows.length) return null;

    mergedRows.sort((a, b) => {
      const aTime = new Date(a.measured_at || 0).getTime();
      const bTime = new Date(b.measured_at || 0).getTime();
      return bTime - aTime;
    });

    return this.mapToEvaluation(mergedRows[0]);
  }

  /**
   * Crée ou met à jour l'évaluation d'un spotlight
   */
  async saveEvaluation(evaluation: Partial<SpotlightEvaluation>): Promise<SpotlightEvaluation> {
    if (!evaluation.spotlightId) {
      throw new Error('spotlightId is required');
    }

    const evalRecord: any = {
      spotlight_id: evaluation.spotlightId,
      metric_name: SPOTLIGHT_EVAL_METRIC,
      metric_value: evaluation.totalScore ?? 0,
      metric_unit: 'points',
      measured_at: evaluation.evaluatedAt?.toISOString() || new Date().toISOString(),
      metadata: {
        streamer_twitch_login: evaluation.streamerTwitchLogin,
        criteria: evaluation.criteria || [],
        total_score: evaluation.totalScore ?? 0,
        max_score: evaluation.maxScore ?? 0,
        moderator_comments: evaluation.moderatorComments || null,
        evaluated_by: evaluation.evaluatedBy,
        validated: evaluation.validated || false,
        validated_at: evaluation.validatedAt?.toISOString() || null,
      },
    };

    const spotlightIds = await this.getSpotlightIdAliases(evaluation.spotlightId);
    for (const id of spotlightIds) {
      const { error: cleanupError } = await supabaseAdmin
        .from('spotlight_metrics')
        .delete()
        .eq('spotlight_id', id)
        .eq('metric_name', SPOTLIGHT_EVAL_METRIC);
      if (cleanupError) throw cleanupError;
    }

    const { data, error } = await supabaseAdmin
      .from('spotlight_metrics')
      .insert(evalRecord)
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
      startedAt: new Date(row.starts_at || row.started_at),
      endsAt: row.ends_at ? new Date(row.ends_at) : undefined,
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
    const metadata = row.metadata || {};
    return {
      id: row.id,
      spotlightId: row.spotlight_id,
      streamerTwitchLogin: metadata.streamer_twitch_login || '',
      criteria: metadata.criteria || [],
      totalScore: metadata.total_score ?? Number(row.metric_value || 0),
      maxScore: metadata.max_score ?? 0,
      moderatorComments: metadata.moderator_comments || undefined,
      evaluatedAt: new Date(row.measured_at),
      evaluatedBy: metadata.evaluated_by || 'system',
      validated: metadata.validated === true,
      validatedAt: metadata.validated_at ? new Date(metadata.validated_at) : undefined,
    };
  }

  private mapToDbFormat(spotlight: Partial<Spotlight>): any {
    const record: any = {};

    if (spotlight.id !== undefined) record.id = spotlight.id;
    if (spotlight.streamerTwitchLogin !== undefined) record.streamer_twitch_login = spotlight.streamerTwitchLogin;
    if (spotlight.streamerDisplayName !== undefined) record.streamer_display_name = spotlight.streamerDisplayName;
    if (spotlight.startedAt !== undefined) {
      record.starts_at = spotlight.startedAt instanceof Date 
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
