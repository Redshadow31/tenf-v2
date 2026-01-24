// Repository pour les membres - Utilise Supabase avec cache Redis
import { supabaseAdmin } from '../db/supabase';
import type { MemberData } from '../memberData';
import { cacheGet, cacheSet, cacheSetWithNamespace, cacheInvalidateNamespace, cacheKey, CACHE_TTL } from '../cache';

export class MemberRepository {
  /**
   * Récupère tous les membres avec pagination
   * @param limit - Nombre maximum de résultats (défaut: 100)
   * @param offset - Nombre de résultats à ignorer (défaut: 0)
   */
  async findAll(limit = 100, offset = 0): Promise<MemberData[]> {
    const cacheKeyStr = cacheKey('members', 'all', limit, offset);
    
    // Essayer de récupérer du cache
    const cached = await cacheGet<MemberData[]>(cacheKeyStr);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabaseAdmin
      .from('members')
      .select('*')
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const members = (data || []).map(this.mapToMemberData);
    
    // Mettre en cache avec namespace
    await cacheSetWithNamespace('members', cacheKeyStr, members, CACHE_TTL.MEMBERS_ALL);

    return members;
  }

  /**
   * Récupère un membre par son login Twitch
   */
  async findByTwitchLogin(login: string): Promise<MemberData | null> {
    const cacheKeyStr = cacheKey('members', 'twitch', login.toLowerCase());
    
    // Essayer de récupérer du cache
    const cached = await cacheGet<MemberData>(cacheKeyStr);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('twitch_login', login.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    const member = data ? this.mapToMemberData(data) : null;
    
    // Mettre en cache si trouvé
    if (member) {
      await cacheSetWithNamespace('members', cacheKeyStr, member, CACHE_TTL.MEMBERS_ACTIVE);
    }

    return member;
  }

  /**
   * Récupère un membre par son ID Discord
   */
  async findByDiscordId(discordId: string): Promise<MemberData | null> {
    const cacheKeyStr = cacheKey('members', 'discord', discordId);
    
    // Essayer de récupérer du cache
    const cached = await cacheGet<MemberData>(cacheKeyStr);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('discord_id', discordId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    const member = data ? this.mapToMemberData(data) : null;
    
    // Mettre en cache si trouvé
    if (member) {
      await cacheSetWithNamespace('members', cacheKeyStr, member, CACHE_TTL.MEMBERS_ACTIVE);
    }

    return member;
  }

  /**
   * Récupère les membres actifs avec pagination
   */
  async findActive(limit = 50, offset = 0): Promise<MemberData[]> {
    const cacheKeyStr = cacheKey('members', 'active', limit, offset);
    
    // Essayer de récupérer du cache
    try {
      const cached = await cacheGet<MemberData[]>(cacheKeyStr);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached;
      }
    } catch (cacheError) {
      console.warn('[MemberRepository] Erreur cache, passage direct à Supabase:', cacheError);
      // Continuer sans cache en cas d'erreur
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('members')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('[MemberRepository] Erreur Supabase findActive:', error);
        throw error;
      }

      const members = (data || []).map(this.mapToMemberData);
      
      // Mettre en cache avec namespace (en arrière-plan, ne pas bloquer en cas d'erreur)
      cacheSetWithNamespace('members', cacheKeyStr, members, CACHE_TTL.MEMBERS_ACTIVE)
        .catch(cacheError => {
          console.warn('[MemberRepository] Erreur mise en cache (non bloquant):', cacheError);
        });

      return members;
    } catch (error) {
      console.error('[MemberRepository] Erreur fatale findActive:', error);
      throw error;
    }
  }

  /**
   * Récupère les membres VIP avec pagination
   * @param limit - Nombre maximum de résultats (défaut: 50)
   * @param offset - Nombre de résultats à ignorer (défaut: 0)
   */
  async findVip(limit = 50, offset = 0): Promise<MemberData[]> {
    const cacheKeyStr = cacheKey('members', 'vip', limit, offset);
    
    // Essayer de récupérer du cache
    const cached = await cacheGet<MemberData[]>(cacheKeyStr);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('is_vip', true)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const members = (data || []).map(this.mapToMemberData);
    
    // Mettre en cache avec namespace
    await cacheSetWithNamespace('members', cacheKeyStr, members, CACHE_TTL.MEMBERS_VIP);

    return members;
  }

  /**
   * Récupère les membres par rôle avec pagination
   * @param role - Rôle à rechercher
   * @param limit - Nombre maximum de résultats (défaut: 50)
   * @param offset - Nombre de résultats à ignorer (défaut: 0)
   */
  async findByRole(role: string, limit = 50, offset = 0): Promise<MemberData[]> {
    const cacheKeyStr = cacheKey('members', 'role', role, limit, offset);
    
    // Essayer de récupérer du cache
    const cached = await cacheGet<MemberData[]>(cacheKeyStr);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('role', role)
      .eq('is_active', true)
      .order('display_name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const members = (data || []).map(this.mapToMemberData);
    
    // Mettre en cache avec namespace
    await cacheSetWithNamespace('members', cacheKeyStr, members, CACHE_TTL.MEMBERS_ACTIVE);

    return members;
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

    const newMember = this.mapToMemberData(data);
    
    // Invalider le cache des membres
    await cacheInvalidateNamespace('members');

    return newMember;
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

    const updatedMember = this.mapToMemberData(data);
    
    // Invalider le cache des membres
    await cacheInvalidateNamespace('members');

    return updatedMember;
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
    
    // Invalider le cache des membres
    await cacheInvalidateNamespace('members');
  }

  /**
   * Compte le nombre total de membres actifs
   */
  async countActive(): Promise<number> {
    const cacheKeyStr = cacheKey('members', 'count', 'active');
    
    // Essayer de récupérer du cache
    const cached = await cacheGet<number>(cacheKeyStr);
    if (cached !== null) {
      return cached;
    }

    const { count, error } = await supabaseAdmin
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) throw error;
    const result = count || 0;
    
    // Mettre en cache pour 1 minute (stats changent moins souvent)
    await cacheSet(cacheKeyStr, result, 60);

    return result;
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
