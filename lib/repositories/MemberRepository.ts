// Repository pour les membres - Utilise Supabase
import { supabaseAdmin } from '../db/supabase';
import type { MemberData } from '../memberData';

export class MemberRepository {
  /**
   * Récupère tous les membres avec pagination
   * @param limit - Nombre maximum de résultats (défaut: 100)
   * @param offset - Nombre de résultats à ignorer (défaut: 0)
   */
  async findAll(limit = 100, offset = 0): Promise<MemberData[]> {
    const { data, error } = await supabaseAdmin
      .from('members')
      .select('*')
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return (data || []).map(this.mapToMemberData);
  }

  /**
   * Récupère un membre par son login Twitch
   */
  async findByTwitchLogin(login: string): Promise<MemberData | null> {
    const { data, error } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('twitch_login', login.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data ? this.mapToMemberData(data) : null;
  }

  /**
   * Récupère un membre par son ID Discord
   */
  async findByDiscordId(discordId: string): Promise<MemberData | null> {
    const { data, error } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('discord_id', discordId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data ? this.mapToMemberData(data) : null;
  }

  /**
   * Récupère les membres actifs avec pagination
   */
  async findActive(limit = 50, offset = 0): Promise<MemberData[]> {
    const { data, error } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return (data || []).map(this.mapToMemberData);
  }

  /**
   * Récupère les membres VIP avec pagination
   * @param limit - Nombre maximum de résultats (défaut: 50)
   * @param offset - Nombre de résultats à ignorer (défaut: 0)
   */
  async findVip(limit = 50, offset = 0): Promise<MemberData[]> {
    const { data, error } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('is_vip', true)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return (data || []).map(this.mapToMemberData);
  }

  /**
   * Récupère les membres par rôle avec pagination
   * @param role - Rôle à rechercher
   * @param limit - Nombre maximum de résultats (défaut: 50)
   * @param offset - Nombre de résultats à ignorer (défaut: 0)
   */
  async findByRole(role: string, limit = 50, offset = 0): Promise<MemberData[]> {
    const { data, error } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('role', role)
      .eq('is_active', true)
      .order('display_name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return (data || []).map(this.mapToMemberData);
  }

  /**
   * Crée un nouveau membre
   */
  async create(member: Partial<MemberData>): Promise<MemberData> {
    const memberRecord = this.mapToDbFormat(member);

    const { data, error } = await supabaseAdmin
      .from('members')
      .insert(memberRecord)
      .select()
      .single();

    if (error) throw error;

    return this.mapToMemberData(data);
  }

  /**
   * Met à jour un membre
   */
  async update(login: string, updates: Partial<MemberData>): Promise<MemberData> {
    const updateRecord = this.mapToDbFormat(updates);
    updateRecord.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('members')
      .update(updateRecord)
      .eq('twitch_login', login.toLowerCase())
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error(`Member not found: ${login}`);

    return this.mapToMemberData(data);
  }

  /**
   * Supprime un membre (soft delete en mettant is_active à false)
   */
  async delete(login: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('members')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('twitch_login', login.toLowerCase());

    if (error) throw error;
  }

  /**
   * Compte le nombre total de membres actifs
   */
  async countActive(): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Mappe les données de la base vers MemberData
   */
  private mapToMemberData(row: any): MemberData {
    return {
      twitchLogin: row.twitch_login,
      twitchId: row.twitch_id || undefined,
      twitchUrl: row.twitch_url,
      discordId: row.discord_id || undefined,
      discordUsername: row.discord_username || undefined,
      displayName: row.display_name,
      siteUsername: row.site_username || undefined,
      role: row.role as any,
      isVip: row.is_vip,
      isActive: row.is_active,
      badges: row.badges || undefined,
      listId: row.list_id || undefined,
      roleManuallySet: row.role_manually_set || undefined,
      twitchStatus: row.twitch_status || undefined,
      description: row.description || undefined,
      customBio: row.custom_bio || undefined,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
      updatedBy: row.updated_by || undefined,
      integrationDate: row.integration_date ? new Date(row.integration_date) : undefined,
      roleHistory: row.role_history || undefined,
      parrain: row.parrain || undefined,
    };
  }

  /**
   * Mappe MemberData vers le format de la base de données
   */
  private mapToDbFormat(member: Partial<MemberData>): any {
    const record: any = {};

    if (member.twitchLogin !== undefined) record.twitch_login = member.twitchLogin.toLowerCase();
    if (member.twitchId !== undefined) record.twitch_id = member.twitchId;
    if (member.twitchUrl !== undefined) record.twitch_url = member.twitchUrl;
    if (member.discordId !== undefined) record.discord_id = member.discordId;
    if (member.discordUsername !== undefined) record.discord_username = member.discordUsername;
    if (member.displayName !== undefined) record.display_name = member.displayName;
    if (member.siteUsername !== undefined) record.site_username = member.siteUsername;
    if (member.role !== undefined) record.role = member.role;
    if (member.isVip !== undefined) record.is_vip = member.isVip;
    if (member.isActive !== undefined) record.is_active = member.isActive;
    if (member.badges !== undefined) record.badges = member.badges;
    if (member.listId !== undefined) record.list_id = member.listId;
    if (member.roleManuallySet !== undefined) record.role_manually_set = member.roleManuallySet;
    if (member.twitchStatus !== undefined) record.twitch_status = member.twitchStatus;
    if (member.description !== undefined) record.description = member.description;
    if (member.customBio !== undefined) record.custom_bio = member.customBio;
    if (member.updatedBy !== undefined) record.updated_by = member.updatedBy;
    if (member.integrationDate !== undefined) {
      record.integration_date = member.integrationDate instanceof Date 
        ? member.integrationDate.toISOString() 
        : member.integrationDate;
    }
    if (member.roleHistory !== undefined) record.role_history = member.roleHistory;
    if (member.parrain !== undefined) record.parrain = member.parrain;
    if (member.createdAt !== undefined) {
      record.created_at = member.createdAt instanceof Date 
        ? member.createdAt.toISOString() 
        : member.createdAt;
    }

    return record;
  }
}

export const memberRepository = new MemberRepository();
