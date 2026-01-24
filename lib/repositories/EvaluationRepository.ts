// Repository pour les évaluations mensuelles - Utilise Supabase
import { supabaseAdmin } from '../db/supabase';

export interface Evaluation {
  id: string;
  month: Date; // Format: YYYY-MM-01
  twitchLogin: string;
  sectionAPoints: number;
  sectionBPoints: number;
  sectionCPoints: number;
  sectionDBonuses: number;
  totalPoints: number;
  spotlightEvaluations?: any[];
  eventEvaluations?: any[];
  raidPoints?: number;
  raidPointsManual?: number; // Points manuels (surcharge le calcul automatique)
  raidNotes?: Array<{
    twitchLogin: string;
    note?: string;
    manualPoints?: number;
    lastUpdated: string;
    updatedBy: string;
  }>;
  spotlightBonus?: number;
  discordEngagement?: any;
  followValidations?: any[];
  bonuses?: any[];
  finalNote?: number;
  finalNoteSavedAt?: Date;
  finalNoteSavedBy?: string;
  calculatedAt?: Date;
  calculatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class EvaluationRepository {
  /**
   * Récupère toutes les évaluations d'un mois avec pagination
   * @param month - Mois au format YYYY-MM
   * @param limit - Nombre maximum de résultats (défaut: 100)
   * @param offset - Nombre de résultats à ignorer (défaut: 0)
   */
  async findByMonth(month: string, limit = 100, offset = 0): Promise<Evaluation[]> {
    // month format: YYYY-MM
    const monthDate = `${month}-01`;
    
    const { data, error } = await supabaseAdmin
      .from('evaluations')
      .select('*')
      .eq('month', monthDate)
      .order('total_points', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return (data || []).map(this.mapToEvaluation);
  }

  /**
   * Récupère l'évaluation d'un membre pour un mois
   */
  async findByMemberAndMonth(twitchLogin: string, month: string): Promise<Evaluation | null> {
    const monthDate = `${month}-01`;
    
    const { data, error } = await supabaseAdmin
      .from('evaluations')
      .select('*')
      .eq('twitch_login', twitchLogin.toLowerCase())
      .eq('month', monthDate)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? this.mapToEvaluation(data) : null;
  }

  /**
   * Récupère toutes les évaluations d'un membre
   */
  async findByMember(twitchLogin: string): Promise<Evaluation[]> {
    const { data, error } = await supabaseAdmin
      .from('evaluations')
      .select('*')
      .eq('twitch_login', twitchLogin.toLowerCase())
      .order('month', { ascending: false });

    if (error) throw error;

    return (data || []).map(this.mapToEvaluation);
  }

  /**
   * Crée ou met à jour une évaluation
   */
  async upsert(evaluation: Partial<Evaluation>): Promise<Evaluation> {
    const evalRecord = this.mapToDbFormat(evaluation);

    const { data, error } = await supabaseAdmin
      .from('evaluations')
      .upsert(evalRecord, {
        onConflict: 'twitch_login,month',
      })
      .select()
      .single();

    if (error) throw error;

    return this.mapToEvaluation(data);
  }

  /**
   * Met à jour une évaluation
   */
  async update(id: string, updates: Partial<Evaluation>): Promise<Evaluation> {
    const updateRecord = this.mapToDbFormat(updates);
    updateRecord.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('evaluations')
      .update(updateRecord)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error(`Evaluation not found: ${id}`);

    return this.mapToEvaluation(data);
  }

  /**
   * Supprime une évaluation
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('evaluations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private mapToEvaluation(row: any): Evaluation {
    return {
      id: row.id,
      month: new Date(row.month),
      twitchLogin: row.twitch_login,
      sectionAPoints: row.section_a_points || 0,
      sectionBPoints: row.section_b_points || 0,
      sectionCPoints: row.section_c_points || 0,
      sectionDBonuses: row.section_d_bonuses || 0,
      totalPoints: row.total_points || 0,
      spotlightEvaluations: row.spotlight_evaluations || undefined,
      eventEvaluations: row.event_evaluations || undefined,
      raidPoints: row.raid_points || undefined,
      raidPointsManual: row.raid_points_manual || undefined,
      raidNotes: row.raid_notes || undefined,
      spotlightBonus: row.spotlight_bonus || undefined,
      discordEngagement: row.discord_engagement || undefined,
      followValidations: row.follow_validations || undefined,
      bonuses: row.bonuses || undefined,
      finalNote: row.final_note || undefined,
      finalNoteSavedAt: row.final_note_saved_at ? new Date(row.final_note_saved_at) : undefined,
      finalNoteSavedBy: row.final_note_saved_by || undefined,
      calculatedAt: row.calculated_at ? new Date(row.calculated_at) : undefined,
      calculatedBy: row.calculated_by || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapToDbFormat(evaluation: Partial<Evaluation>): any {
    const record: any = {};

    if (evaluation.month !== undefined) {
      const monthDate = evaluation.month instanceof Date 
        ? evaluation.month 
        : new Date(evaluation.month);
      // Format: YYYY-MM-01
      record.month = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-01`;
    }
    if (evaluation.twitchLogin !== undefined) record.twitch_login = evaluation.twitchLogin.toLowerCase();
    if (evaluation.sectionAPoints !== undefined) record.section_a_points = evaluation.sectionAPoints;
    if (evaluation.sectionBPoints !== undefined) record.section_b_points = evaluation.sectionBPoints;
    if (evaluation.sectionCPoints !== undefined) record.section_c_points = evaluation.sectionCPoints;
    if (evaluation.sectionDBonuses !== undefined) record.section_d_bonuses = evaluation.sectionDBonuses;
    if (evaluation.totalPoints !== undefined) record.total_points = evaluation.totalPoints;
    if (evaluation.spotlightEvaluations !== undefined) record.spotlight_evaluations = evaluation.spotlightEvaluations;
    if (evaluation.eventEvaluations !== undefined) record.event_evaluations = evaluation.eventEvaluations;
    if (evaluation.raidPoints !== undefined) record.raid_points = evaluation.raidPoints;
    if (evaluation.raidPointsManual !== undefined) record.raid_points_manual = evaluation.raidPointsManual;
    if (evaluation.raidNotes !== undefined) record.raid_notes = evaluation.raidNotes;
    if (evaluation.spotlightBonus !== undefined) record.spotlight_bonus = evaluation.spotlightBonus;
    if (evaluation.discordEngagement !== undefined) record.discord_engagement = evaluation.discordEngagement;
    if (evaluation.followValidations !== undefined) record.follow_validations = evaluation.followValidations;
    if (evaluation.bonuses !== undefined) record.bonuses = evaluation.bonuses;
    if (evaluation.calculatedAt !== undefined) {
      record.calculated_at = evaluation.calculatedAt instanceof Date 
        ? evaluation.calculatedAt.toISOString() 
        : evaluation.calculatedAt;
    }
    if (evaluation.calculatedBy !== undefined) record.calculated_by = evaluation.calculatedBy;
    if (evaluation.finalNote !== undefined) record.final_note = evaluation.finalNote;
    if (evaluation.finalNoteSavedAt !== undefined) {
      record.final_note_saved_at = evaluation.finalNoteSavedAt instanceof Date 
        ? evaluation.finalNoteSavedAt.toISOString() 
        : evaluation.finalNoteSavedAt;
    }
    if (evaluation.finalNoteSavedBy !== undefined) record.final_note_saved_by = evaluation.finalNoteSavedBy;

    return record;
  }
}

export const evaluationRepository = new EvaluationRepository();
