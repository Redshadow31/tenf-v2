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
   * Remplace toutes les entrées VIP d'un mois (sync après enregistrement admin).
   */
  async replaceMonth(month: string, twitchLogins: string[]): Promise<number> {
    const monthDate = `${month}-01`;
    const normalized = Array.from(
      new Set(twitchLogins.map((l) => l.toLowerCase().trim()).filter(Boolean))
    );

    const { error: deleteError } = await supabaseAdmin
      .from("vip_history")
      .delete()
      .eq("month", monthDate);

    if (deleteError) throw deleteError;
    if (normalized.length === 0) return 0;

    const records = normalized.map((login) => ({
      month: monthDate,
      twitch_login: login,
      display_name: login,
      consecutive_months: 1,
    }));

    const chunkSize = 100;
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      const { error: insertError } = await supabaseAdmin.from("vip_history").insert(chunk);
      if (insertError) throw insertError;
    }

    return normalized.length;
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

  /** Supprime l'entrée VIP d'un membre pour un mois donné. */
  async deleteByMemberAndMonth(month: string, twitchLogin: string): Promise<void> {
    const monthDate = `${month}-01`;
    const { error } = await supabaseAdmin
      .from("vip_history")
      .delete()
      .eq("month", monthDate)
      .eq("twitch_login", twitchLogin.toLowerCase());

    if (error) throw error;
  }

  /** Ajoute une entrée VIP si absente pour ce mois / membre. */
  async ensureMemberMonth(
    month: string,
    twitchLogin: string,
    displayName?: string
  ): Promise<void> {
    const monthDate = `${month}-01`;
    const login = twitchLogin.toLowerCase();
    const { data, error: findError } = await supabaseAdmin
      .from("vip_history")
      .select("id")
      .eq("month", monthDate)
      .eq("twitch_login", login)
      .maybeSingle();

    if (findError) throw findError;
    if (data) return;

    const { error: insertError } = await supabaseAdmin.from("vip_history").insert({
      month: monthDate,
      twitch_login: login,
      display_name: displayName || login,
      consecutive_months: 1,
    });

    if (insertError) throw insertError;
  }

  /** Historique agrégé par mois (YYYY-MM → logins). */
  async findAllGroupedByMonth(): Promise<Record<string, string[]>> {
    const { data, error } = await supabaseAdmin
      .from("vip_history")
      .select("month, twitch_login")
      .order("month", { ascending: false });

    if (error) throw error;

    const byMonth: Record<string, string[]> = {};
    for (const row of data || []) {
      const monthKey = String(row.month).slice(0, 7);
      if (!byMonth[monthKey]) byMonth[monthKey] = [];
      const login = String(row.twitch_login || "").toLowerCase();
      if (login && !byMonth[monthKey].includes(login)) {
        byMonth[monthKey].push(login);
      }
    }
    return byMonth;
  }

  /** Mois VIP d'un membre (YYYY-MM triés desc). */
  async findMonthsByMember(twitchLogin: string): Promise<string[]> {
    const entries = await this.findByMember(twitchLogin);
    return Array.from(
      new Set(
        entries.map((entry) => {
          const d = entry.month instanceof Date ? entry.month : new Date(entry.month);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        })
      )
    ).sort((a, b) => b.localeCompare(a));
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
