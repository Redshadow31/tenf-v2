// Repository pour l'historique VIP - Utilise Supabase
import { supabaseAdmin } from '../db/supabase';

export interface VipHistoryEntry {
  id: string;
  month: Date; // Format: YYYY-MM-01
  twitchLogin: string;
  displayName: string;
  vipBadge?: string;
  consecutiveMonths: number;
  createdAt: Date;
}

export class VipRepository {
  /**
   * Récupère l'historique VIP d'un mois
   */
  async findByMonth(month: string): Promise<VipHistoryEntry[]> {
    // month format: YYYY-MM
    const monthDate = `${month}-01`;
    
    const { data, error } = await supabaseAdmin
      .from('vip_history')
      .select('*')
      .eq('month', monthDate)
      .order('consecutive_months', { ascending: false });

    if (error) throw error;

    return (data || []).map(this.mapToVipEntry);
  }

  /**
   * Récupère l'historique VIP d'un membre
   */
  async findByMember(twitchLogin: string): Promise<VipHistoryEntry[]> {
    const { data, error } = await supabaseAdmin
      .from('vip_history')
      .select('*')
      .eq('twitch_login', twitchLogin.toLowerCase())
      .order('month', { ascending: false });

    if (error) throw error;

    return (data || []).map(this.mapToVipEntry);
  }

  /**
   * Récupère tous les VIPs du mois actuel
   */
  async findCurrentMonth(): Promise<VipHistoryEntry[]> {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return this.findByMonth(month);
  }

  /**
   * Ajoute une entrée VIP
   */
  async create(entry: Partial<VipHistoryEntry>): Promise<VipHistoryEntry> {
    const entryRecord = this.mapToDbFormat(entry);

    const { data, error } = await supabaseAdmin
      .from('vip_history')
      .insert(entryRecord)
      .select()
      .single();

    if (error) throw error;

    return this.mapToVipEntry(data);
  }

  /**
   * Supprime une entrée VIP
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('vip_history')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private mapToVipEntry(row: any): VipHistoryEntry {
    return {
      id: row.id,
      month: new Date(row.month),
      twitchLogin: row.twitch_login,
      displayName: row.display_name,
      vipBadge: row.vip_badge || undefined,
      consecutiveMonths: row.consecutive_months || 1,
      createdAt: new Date(row.created_at),
    };
  }

  private mapToDbFormat(entry: Partial<VipHistoryEntry>): any {
    const record: any = {};

    if (entry.month !== undefined) {
      const monthDate = entry.month instanceof Date 
        ? entry.month 
        : new Date(entry.month);
      // Format: YYYY-MM-01
      record.month = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-01`;
    }
    if (entry.twitchLogin !== undefined) record.twitch_login = entry.twitchLogin.toLowerCase();
    if (entry.displayName !== undefined) record.display_name = entry.displayName;
    if (entry.vipBadge !== undefined) record.vip_badge = entry.vipBadge;
    if (entry.consecutiveMonths !== undefined) record.consecutive_months = entry.consecutiveMonths;

    return record;
  }
}

export const vipRepository = new VipRepository();
