// Repository pour les événements - Utilise Supabase avec cache Redis
import { supabaseAdmin } from '../db/supabase';
import { cacheGet, cacheSet, cacheSetWithNamespace, cacheInvalidateNamespace, cacheKey, CACHE_TTL } from '../cache';
import { logDatabase, logCache } from '../logging/logger';

export interface Event {
  id: string;
  title: string;
  description: string;
  image?: string;
  date: Date;
  category: string;
  location?: string;
  invitedMembers?: string[];
  isPublished: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  twitchLogin: string;
  displayName: string;
  discordId?: string;
  discordUsername?: string;
  notes?: string;
  registeredAt: Date;
}

const EVENTS_TABLE = 'community_events';
const isUuid = (value?: string) =>
  !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export class EventRepository {
  private toSafeDate(value: any, fallbackValue?: any): Date {
    const primary = new Date(value);
    if (!Number.isNaN(primary.getTime())) {
      return primary;
    }

    if (fallbackValue !== undefined) {
      const fallback = new Date(fallbackValue);
      if (!Number.isNaN(fallback.getTime())) {
        return fallback;
      }
    }

    return new Date();
  }

  private normalizeImageUrl(image?: string | null): string | undefined {
    if (!image || typeof image !== 'string') return undefined;
    const trimmed = image.trim();
    if (!trimmed) return undefined;

    if (trimmed.startsWith('/api/admin/events/images/')) {
      return trimmed;
    }

    // Compat: URL publique Supabase -> route interne proxy image
    const marker = '/storage/v1/object/public/events-images/';
    const markerIndex = trimmed.indexOf(marker);
    if (markerIndex >= 0) {
      const fileName = trimmed.slice(markerIndex + marker.length).split('?')[0];
      if (fileName) {
        return `/api/admin/events/images/${fileName}`;
      }
    }

    return trimmed;
  }

  /**
   * Backfill applicatif des images depuis la table legacy `events`
   * quand `community_events.image` est vide.
   */
  private async hydrateMissingImages(rows: any[]): Promise<any[]> {
    if (!rows.length) return rows;
    const needsImage = rows.filter((row) => !row.image);
    if (!needsImage.length) return rows;

    try {
      const { data: legacyRows, error } = await supabaseAdmin
        .from('events')
        .select('id, title, date, image')
        .not('image', 'is', null)
        .limit(5000);

      if (error || !legacyRows?.length) {
        return rows;
      }

      const byId = new Map<string, string>();
      const byTitleDate = new Map<string, string>();

      for (const legacy of legacyRows) {
        if (!legacy?.image) continue;
        byId.set(String(legacy.id), String(legacy.image));
        if (legacy.title && legacy.date) {
          byTitleDate.set(`${legacy.title}__${legacy.date}`, String(legacy.image));
        }
      }

      return rows.map((row) => {
        if (row.image) {
          return row;
        }
        const fromLegacyId = row.legacy_event_id ? byId.get(String(row.legacy_event_id)) : undefined;
        const fromTitleDate = byTitleDate.get(`${row.title}__${row.starts_at}`);
        const recoveredImage = fromLegacyId || fromTitleDate;
        if (!recoveredImage) return row;

        return {
          ...row,
          image: recoveredImage,
        };
      });
    } catch {
      // La table legacy peut ne pas exister en prod finale.
      return rows;
    }
  }

  private async fetchEventsRows(params: {
    limit: number;
    offset: number;
    publishedOnly?: boolean;
    upcomingOnly?: boolean;
    ascending?: boolean;
  }): Promise<any[]> {
    const { limit, offset, publishedOnly, upcomingOnly, ascending = false } = params;
    const nowIso = new Date().toISOString();

    const tryCommunityEvents = async (orderColumn: 'starts_at' | 'date'): Promise<any[] | null> => {
      let query = supabaseAdmin
        .from(EVENTS_TABLE)
        .select('*');

      if (publishedOnly) {
        query = query.eq('is_published', true);
      }
      if (upcomingOnly) {
        query = query.gte(orderColumn, nowIso);
      }

      const { data, error } = await query
        .order(orderColumn, { ascending })
        .range(offset, offset + limit - 1);

      if (!error) return data || [];

      const message = (error.message || '').toLowerCase();
      // Compat: colonne absente selon l'état du schéma (schema cache / SQL error)
      if (
        (message.includes('column') || message.includes('could not find')) &&
        message.includes(orderColumn)
      ) {
        return null; // On retente avec l'autre colonne, puis fallback legacy
      }
      // Compat: table/community_events absente sur un environnement partiellement migré
      if (message.includes('relation') && message.includes('community_events')) {
        return null;
      }
      throw error;
    };

    // 1) Nouveau schéma prioritaire
    const onStartsAt = await tryCommunityEvents('starts_at');
    if (onStartsAt !== null && onStartsAt.length > 0) return onStartsAt;
    const onDate = await tryCommunityEvents('date');
    if (onDate !== null && onDate.length > 0) return onDate;

    // 2) Fallback ancien schéma
    const tryLegacyEvents = async (
      publishedColumn: 'is_published' | 'isPublished',
      dateColumn: 'date' | 'starts_at'
    ): Promise<any[] | null> => {
      let legacyQuery = supabaseAdmin
        .from('events')
        .select('*');

      if (publishedOnly) {
        legacyQuery = legacyQuery.eq(publishedColumn, true);
      }
      if (upcomingOnly) {
        legacyQuery = legacyQuery.gte(dateColumn, nowIso);
      }

      const { data: legacyData, error: legacyError } = await legacyQuery
        .order(dateColumn, { ascending })
        .range(offset, offset + limit - 1);

      if (!legacyError) {
        return legacyData || [];
      }

      const message = (legacyError.message || '').toLowerCase();
      if (publishedColumn === 'is_published' && message.includes('column') && message.includes('is_published')) {
        return null; // retry on old camelCase name
      }
      if (
        (message.includes('column') || message.includes('could not find')) &&
        message.includes(dateColumn)
      ) {
        return null; // retry with the other date column
      }
      if (message.includes('relation') && message.includes('events')) {
        return [];
      }
      throw legacyError;
    };

    const legacySnakeDate = await tryLegacyEvents('is_published', 'date');
    if (legacySnakeDate !== null) return legacySnakeDate;
    const legacySnakeStartsAt = await tryLegacyEvents('is_published', 'starts_at');
    if (legacySnakeStartsAt !== null) return legacySnakeStartsAt;
    const legacyCamelDate = await tryLegacyEvents('isPublished', 'date');
    if (legacyCamelDate !== null) return legacyCamelDate;
    const legacyCamelStartsAt = await tryLegacyEvents('isPublished', 'starts_at');
    if (legacyCamelStartsAt !== null) return legacyCamelStartsAt;

    return [];
  }

  /**
   * Retourne les IDs potentiels d'un événement:
   * - l'UUID courant
   * - l'ancien ID (legacy_event_id) si présent
   */
  private async getEventIdAliases(eventId: string): Promise<string[]> {
    const aliases = new Set<string>([eventId]);
    try {
      const { data, error } = await supabaseAdmin
        .from(EVENTS_TABLE)
        .select('id, legacy_event_id, title, starts_at')
        .eq('id', eventId)
        .maybeSingle();

      if (!error && data?.legacy_event_id) {
        aliases.add(String(data.legacy_event_id));
      }

      // Fallback legacy: certains événements ont été backfill sans legacy_event_id.
      // On reconstruit alors l'ancien id via la table legacy `events` (title + date).
      if (!error && data?.title && data?.starts_at && !data?.legacy_event_id) {
        try {
          const legacy = await supabaseAdmin
            .from('events')
            .select('id')
            .eq('title', data.title)
            .eq('date', data.starts_at)
            .limit(1)
            .maybeSingle();

          if (!legacy.error && legacy.data?.id) {
            aliases.add(String(legacy.data.id));
          }
        } catch {
          // no-op: la table legacy peut ne pas exister
        }
      }
    } catch {
      // Best effort: on garde eventId seulement
    }

    return Array.from(aliases);
  }

  /**
   * Récupère tous les événements avec pagination
   * @param limit - Nombre maximum de résultats (défaut: 50)
   * @param offset - Nombre de résultats à ignorer (défaut: 0)
   */
  async findAll(limit = 50, offset = 0): Promise<Event[]> {
    const cacheKeyStr = cacheKey('events', 'all', limit, offset);
    const startTime = Date.now();
    
    // Essayer de récupérer du cache
    const cached = await cacheGet<Event[]>(cacheKeyStr);
    if (cached) {
      logCache.hit(cacheKeyStr);
      return cached;
    }
    logCache.miss(cacheKeyStr);

    const data = await this.fetchEventsRows({ limit, offset, ascending: false });

    const duration = Date.now() - startTime;
    logDatabase.query('SELECT', EVENTS_TABLE, duration, { limit, offset, count: data?.length || 0 });

    const hydratedRows = await this.hydrateMissingImages(data || []);
    const events = hydratedRows.map(this.mapToEvent);
    
    // Mettre en cache avec namespace
    await cacheSetWithNamespace('events', cacheKeyStr, events, CACHE_TTL.EVENTS_ALL);

    return events;
  }

  /**
   * Récupère un événement par son ID
   */
  async findById(id: string): Promise<Event | null> {
    const cacheKeyStr = cacheKey('events', 'id', id);
    
    // Essayer de récupérer du cache
    const cached = await cacheGet<Event>(cacheKeyStr);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabaseAdmin
      .from(EVENTS_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    const hydratedRows = data ? await this.hydrateMissingImages([data]) : [];
    const event = hydratedRows.length ? this.mapToEvent(hydratedRows[0]) : null;
    
    // Mettre en cache si trouvé
    if (event) {
      await cacheSetWithNamespace('events', cacheKeyStr, event, CACHE_TTL.EVENTS_PUBLISHED);
    }

    return event;
  }

  /**
   * Récupère les événements publiés avec pagination
   * @param limit - Nombre maximum de résultats (défaut: 20)
   * @param offset - Nombre de résultats à ignorer (défaut: 0)
   */
  async findPublished(limit = 20, offset = 0): Promise<Event[]> {
    const cacheKeyStr = cacheKey('events', 'published', limit, offset);
    
    // Essayer de récupérer du cache
    const cached = await cacheGet<Event[]>(cacheKeyStr);
    if (cached) {
      return cached;
    }

    const data = await this.fetchEventsRows({
      limit,
      offset,
      publishedOnly: true,
      ascending: false,
    });

    const hydratedRows = await this.hydrateMissingImages(data || []);
    const events = hydratedRows.map(this.mapToEvent);
    
    // Mettre en cache avec namespace
    await cacheSetWithNamespace('events', cacheKeyStr, events, CACHE_TTL.EVENTS_PUBLISHED);

    return events;
  }

  /**
   * Récupère les événements à venir avec pagination
   * @param limit - Nombre maximum de résultats (défaut: 10)
   * @param offset - Nombre de résultats à ignorer (défaut: 0)
   */
  async findUpcoming(limit = 10, offset = 0): Promise<Event[]> {
    const data = await this.fetchEventsRows({
      limit,
      offset,
      publishedOnly: true,
      upcomingOnly: true,
      ascending: true,
    });

    return (data || []).map(this.mapToEvent);
  }

  /**
   * Crée un nouvel événement
   */
  async create(event: Partial<Event>): Promise<Event> {
    const eventRecord = this.mapToDbFormat(event);
    if (eventRecord.id && !isUuid(eventRecord.id)) {
      // Sur le schéma v2, l'id est UUID: on laisse Postgres le générer.
      delete eventRecord.id;
    }

    const { data, error } = await supabaseAdmin
      .from(EVENTS_TABLE)
      .insert(eventRecord)
      .select()
      .single();

    if (error) throw error;

    const newEvent = this.mapToEvent(data);
    
    // Invalider le cache des événements
    await cacheInvalidateNamespace('events');

    return newEvent;
  }

  /**
   * Met à jour un événement
   */
  async update(id: string, updates: Partial<Event>): Promise<Event> {
    const updateRecord = this.mapToDbFormat(updates);
    updateRecord.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from(EVENTS_TABLE)
      .update(updateRecord)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error(`Event not found: ${id}`);

    const updatedEvent = this.mapToEvent(data);
    
    // Invalider le cache des événements
    await cacheInvalidateNamespace('events');

    return updatedEvent;
  }

  /**
   * Supprime un événement (présences et inscriptions supprimées en premier pour éviter les FK)
   */
  async delete(id: string): Promise<void> {
    // Supprimer d'abord les présences puis les inscriptions (ou laisser CASCADE si configuré)
    const { error: errPresences } = await supabaseAdmin
      .from('event_presences')
      .delete()
      .eq('event_id', id);
    if (errPresences) {
      console.warn('[EventRepository] Erreur suppression presences (peut être CASCADE):', errPresences.message);
    }

    const { error: errRegistrations } = await supabaseAdmin
      .from('event_registrations')
      .delete()
      .eq('event_id', id);
    if (errRegistrations) {
      console.warn('[EventRepository] Erreur suppression inscriptions (peut être CASCADE):', errRegistrations.message);
    }

    const { error } = await supabaseAdmin
      .from(EVENTS_TABLE)
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Invalider le cache des événements
    await cacheInvalidateNamespace('events');
  }

  /**
   * Récupère les inscriptions à un événement
   */
  async getRegistrations(eventId: string): Promise<EventRegistration[]> {
    console.log(`[EventRepository] Récupération inscriptions pour événement ${eventId}...`);

    const eventIds = await this.getEventIdAliases(eventId);
    let allRows: any[] = [];

    // On fait des requêtes séparées pour éviter les erreurs de cast (uuid/text)
    for (const id of eventIds) {
      const { data, error } = await supabaseAdmin
        .from('event_registrations')
        .select('*')
        .eq('event_id', id)
        .order('registered_at', { ascending: false })
        .limit(10000);

      if (error) {
        const message = error.message || '';
        // Compat: si event_id est typé uuid, un id legacy text peut casser la requête.
        // On ignore uniquement ces erreurs de cast pour poursuivre avec l'autre id.
        if (!message.toLowerCase().includes('invalid input syntax for type uuid')) {
          console.error(`[EventRepository] Erreur récupération inscriptions pour événement ${eventId} (id=${id}):`, error);
          throw error;
        }
        continue;
      }

      if (data?.length) {
        allRows.push(...data);
      }
    }

    // Déduplication défensive si une ligne remonte via plusieurs alias
    const dedupedMap = new Map<string, any>();
    for (const row of allRows) {
      if (!dedupedMap.has(row.id)) {
        dedupedMap.set(row.id, row);
      }
    }
    const data = Array.from(dedupedMap.values());

    console.log(`[EventRepository] Données brutes Supabase pour événement ${eventId}:`, {
      count: data?.length || 0,
      firstFew: data?.slice(0, 3).map(r => ({
        id: r.id,
        event_id: r.event_id,
        event_id_type: typeof r.event_id,
        event_id_matches: r.event_id === eventId,
        twitch_login: r.twitch_login,
        display_name: r.display_name,
      })) || [],
    });

    if ((data?.length || 0) === 0) {
      const { data: allRegistrations } = await supabaseAdmin
        .from('event_registrations')
        .select('event_id, twitch_login, display_name')
        .limit(20);
      console.log(`[EventRepository] Debug: Aucune inscription trouvée pour ${eventId}. Exemples d'inscriptions dans la table (premiers 20):`, {
        total: allRegistrations?.length || 0,
        uniqueEventIds: [...new Set(allRegistrations?.map(r => r.event_id) || [])],
        sample: allRegistrations?.slice(0, 5) || [],
      });
      
      // Vérifier si l'eventId existe dans les inscriptions mais avec un format différent
      const matchingRegistrations = allRegistrations?.filter(r => {
        return r.event_id === eventId || 
               String(r.event_id) === String(eventId) ||
               r.event_id?.toString() === eventId?.toString();
      });
      if (matchingRegistrations && matchingRegistrations.length > 0) {
        console.log(`[EventRepository] ⚠️ Trouvé ${matchingRegistrations.length} inscription(s) avec event_id qui correspond (format différent?)`, matchingRegistrations);
      }
    }

    const registrations = (data || []).map(this.mapToRegistration);
    console.log(`[EventRepository] Récupéré ${registrations.length} inscriptions mappées pour événement ${eventId}`);
    
    return registrations;
  }

  /**
   * Récupère une inscription spécifique
   */
  async getRegistration(eventId: string, twitchLogin: string): Promise<EventRegistration | null> {
    const { data, error } = await supabaseAdmin
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('twitch_login', twitchLogin.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? this.mapToRegistration(data) : null;
  }

  /**
   * Ajoute une inscription à un événement
   * Vérifie d'abord si l'inscription existe déjà
   */
  async addRegistration(registration: Partial<EventRegistration>): Promise<EventRegistration> {
    if (!registration.eventId || !registration.twitchLogin) {
      throw new Error('eventId et twitchLogin sont requis');
    }

    // Vérifier si l'inscription existe déjà
    const existing = await this.getRegistration(registration.eventId, registration.twitchLogin);
    if (existing) {
      throw new Error('Vous êtes déjà inscrit à cet événement');
    }

    const regRecord: any = {
      event_id: registration.eventId,
      twitch_login: registration.twitchLogin.toLowerCase(),
      display_name: registration.displayName,
      discord_id: registration.discordId || null,
      discord_username: registration.discordUsername || null,
      notes: registration.notes || null,
      registered_at: registration.registeredAt?.toISOString() || new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('event_registrations')
      .insert(regRecord)
      .select()
      .single();

    if (error) throw error;

    return this.mapToRegistration(data);
  }

  /**
   * Supprime une inscription
   */
  async removeRegistration(eventId: string, twitchLogin: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('event_registrations')
      .delete()
      .eq('event_id', eventId)
      .eq('twitch_login', twitchLogin);

    if (error) throw error;
  }

  private mapToEvent(row: any): Event {
    const dateValue = row.starts_at || row.date;
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      image: this.normalizeImageUrl(row.image),
      date: this.toSafeDate(dateValue, row.created_at || row.updated_at),
      category: row.category || 'Non classé',
      location: row.location || undefined,
      invitedMembers: row.invited_members || undefined,
      isPublished: row.is_published ?? row.isPublished ?? false,
      createdAt: this.toSafeDate(row.created_at, row.updated_at),
      createdBy: row.created_by,
      updatedAt: row.updated_at ? this.toSafeDate(row.updated_at, row.created_at) : undefined,
    };
  }

  private mapToRegistration(row: any): EventRegistration {
    // Gérer registered_at qui peut être une string ou un Date
    let registeredAt: Date;
    if (row.registered_at instanceof Date) {
      registeredAt = row.registered_at;
    } else if (typeof row.registered_at === 'string') {
      registeredAt = new Date(row.registered_at);
    } else {
      // Fallback si la date est invalide
      registeredAt = new Date();
    }

    return {
      id: row.id,
      eventId: row.event_id,
      twitchLogin: row.twitch_login,
      displayName: row.display_name,
      discordId: row.discord_id || undefined,
      discordUsername: row.discord_username || undefined,
      notes: row.notes || undefined,
      registeredAt,
    };
  }

  /**
   * Récupère les présences pour un événement
   */
  async getPresences(eventId: string): Promise<any[]> {
    const eventIds = await this.getEventIdAliases(eventId);
    let allRows: any[] = [];

    for (const id of eventIds) {
      const { data, error } = await supabaseAdmin
        .from('event_presences')
        .select('*')
        .eq('event_id', id)
        .order('validated_at', { ascending: false })
        .limit(10000);

      if (error) {
        const message = error.message || '';
        if (!message.toLowerCase().includes('invalid input syntax for type uuid')) {
          console.error(`[EventRepository] Erreur récupération présences pour événement ${eventId} (id=${id}):`, error);
          throw error;
        }
        continue;
      }

      if (data?.length) {
        allRows.push(...data);
      }
    }

    const dedupedMap = new Map<string, any>();
    for (const row of allRows) {
      if (!dedupedMap.has(row.id)) {
        dedupedMap.set(row.id, row);
      }
    }
    const data = Array.from(dedupedMap.values());

    const presences = (data || []).map(this.mapToPresence);
    console.log(`[EventRepository] Récupéré ${presences.length} présences pour événement ${eventId}`);
    
    return presences;
  }

  /**
   * Ajoute ou met à jour une présence
   */
  async upsertPresence(presence: {
    eventId: string;
    twitchLogin: string;
    displayName: string;
    discordId?: string;
    discordUsername?: string;
    isRegistered: boolean;
    present: boolean;
    note?: string;
    validatedBy: string;
    addedManually?: boolean;
  }): Promise<any> {
    const presenceRecord: any = {
      event_id: presence.eventId,
      twitch_login: presence.twitchLogin.toLowerCase(),
      display_name: presence.displayName,
      is_registered: presence.isRegistered,
      present: presence.present,
      note: presence.note || null,
      validated_at: new Date().toISOString(),
      validated_by: presence.validatedBy,
      added_manually: presence.addedManually || false,
    };

    const { data, error } = await supabaseAdmin
      .from('event_presences')
      .upsert(presenceRecord, {
        onConflict: 'event_id,twitch_login',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) throw error;

    return this.mapToPresence(data);
  }

  /**
   * Met à jour la note d'une présence
   */
  async updatePresenceNote(eventId: string, twitchLogin: string, note: string | undefined, validatedBy: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('event_presences')
      .update({
        note: note || null,
        validated_at: new Date().toISOString(),
        validated_by: validatedBy,
      })
      .eq('event_id', eventId)
      .eq('twitch_login', twitchLogin.toLowerCase())
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }

    return !!data;
  }

  /**
   * Supprime une présence
   */
  async removePresence(eventId: string, twitchLogin: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('event_presences')
      .delete()
      .eq('event_id', eventId)
      .eq('twitch_login', twitchLogin.toLowerCase());

    if (error) throw error;

    return true;
  }

  private mapToPresence(row: any): any {
    return {
      id: row.id,
      eventId: row.event_id,
      twitchLogin: row.twitch_login,
      displayName: row.display_name,
      discordId: row.discord_id || undefined,
      discordUsername: row.discord_username || undefined,
      isRegistered: row.is_registered,
      present: row.present,
      note: row.note || undefined,
      validatedAt: row.validated_at ? new Date(row.validated_at).toISOString() : undefined,
      validatedBy: row.validated_by || undefined,
      addedManually: row.added_manually,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    };
  }

  private mapToDbFormat(event: Partial<Event>): any {
    const record: any = {};

    if (event.id !== undefined) record.id = event.id;
    if (event.title !== undefined) record.title = event.title;
    if (event.description !== undefined) record.description = event.description;
    if (event.image !== undefined) record.image = event.image;
    if (event.date !== undefined) {
      record.starts_at = event.date instanceof Date ? event.date.toISOString() : event.date;
    }
    if (event.category !== undefined) record.category = event.category;
    if (event.location !== undefined) record.location = event.location;
    if (event.invitedMembers !== undefined) record.invited_members = event.invitedMembers;
    if (event.isPublished !== undefined) record.is_published = event.isPublished;
    if (event.createdBy !== undefined) record.created_by = event.createdBy;
    if (event.createdAt !== undefined) {
      record.created_at = event.createdAt instanceof Date 
        ? event.createdAt.toISOString() 
        : event.createdAt;
    }

    return record;
  }
}

export const eventRepository = new EventRepository();
