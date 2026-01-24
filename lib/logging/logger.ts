/**
 * Système de logging structuré par catégories
 * Permet de suivre les actions, routes, et systèmes du site
 * Les logs sont enregistrés dans Supabase pour persistance
 */

import { supabaseAdmin } from '../db/supabase';

export enum LogCategory {
  // Actions utilisateur
  AUTH = 'auth',
  MEMBER_ACTION = 'member_action',
  EVENT_ACTION = 'event_action',
  SPOTLIGHT_ACTION = 'spotlight_action',
  EVALUATION_ACTION = 'evaluation_action',
  
  // Routes API
  API_ROUTE = 'api_route',
  API_ERROR = 'api_error',
  API_SUCCESS = 'api_success',
  
  // Systèmes
  DATABASE = 'database',
  CACHE = 'cache',
  TWITCH = 'twitch',
  DISCORD = 'discord',
  STORAGE = 'storage',
  
  // Performance
  PERFORMANCE = 'performance',
  QUERY = 'query',
  
  // Sécurité
  SECURITY = 'security',
  RATE_LIMIT = 'rate_limit',
  
  // Tests
  SYSTEM_TEST = 'system_test',
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogEntry {
  id?: string;
  timestamp: string;
  category: LogCategory;
  level: LogLevel;
  message: string;
  details?: any;
  userId?: string;
  route?: string;
  duration?: number; // en millisecondes
  metadata?: Record<string, any>;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Limite de logs en mémoire (cache)
  private listeners: Array<(log: LogEntry) => void> = [];

  /**
   * Ajoute un log (en mémoire ET dans Supabase)
   */
  async log(entry: Omit<LogEntry, 'timestamp'>): Promise<void> {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    // Ajouter au tableau (FIFO) pour cache en mémoire
    this.logs.push(logEntry);
    
    // Limiter la taille
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Enregistrer dans Supabase (asynchrone, ne bloque pas)
    this.saveToSupabase(logEntry).catch(error => {
      console.error('[Logger] Erreur sauvegarde Supabase:', error);
    });

    // Notifier les listeners
    this.listeners.forEach(listener => {
      try {
        listener(logEntry);
      } catch (error) {
        console.error('[Logger] Erreur listener:', error);
      }
    });

    // Afficher dans la console selon le niveau
    this.consoleLog(logEntry);
  }

  /**
   * Sauvegarde un log dans Supabase
   */
  private async saveToSupabase(entry: LogEntry): Promise<void> {
    try {
      const { error } = await supabaseAdmin.from('structured_logs').insert({
        timestamp: entry.timestamp,
        category: entry.category,
        level: entry.level,
        message: entry.message,
        details: entry.details || {},
        actor_discord_id: entry.userId,
        actor_role: entry.metadata?.actorRole,
        resource_type: entry.metadata?.resourceType,
        resource_id: entry.metadata?.resourceId,
        route: entry.route,
        duration_ms: entry.duration,
        status_code: entry.metadata?.statusCode,
      });

      if (error) {
        console.error('[Logger] Erreur insertion Supabase:', error);
      }
    } catch (error) {
      console.error('[Logger] Erreur inattendue Supabase:', error);
    }
  }

  /**
   * Log de debug
   */
  async debug(category: LogCategory, message: string, details?: any): Promise<void> {
    await this.log({
      category,
      level: LogLevel.DEBUG,
      message,
      details,
    });
  }

  /**
   * Log d'information
   */
  async info(category: LogCategory, message: string, details?: any): Promise<void> {
    await this.log({
      category,
      level: LogLevel.INFO,
      message,
      details,
    });
  }

  /**
   * Log d'avertissement
   */
  async warn(category: LogCategory, message: string, details?: any): Promise<void> {
    await this.log({
      category,
      level: LogLevel.WARN,
      message,
      details,
    });
  }

  /**
   * Log d'erreur
   */
  async error(category: LogCategory, message: string, details?: any): Promise<void> {
    await this.log({
      category,
      level: LogLevel.ERROR,
      message,
      details,
    });
  }

  /**
   * Log d'une route API
   */
  async route(
    method: string,
    path: string,
    status: number,
    duration?: number,
    userId?: string,
    details?: any
  ): Promise<void> {
    const level = status >= 500 
      ? LogLevel.ERROR 
      : status >= 400 
      ? LogLevel.WARN 
      : LogLevel.INFO;

    await this.log({
      category: LogCategory.API_ROUTE,
      level,
      message: `${method} ${path} - ${status}`,
      route: `${method} ${path}`,
      duration,
      userId,
      details: {
        status,
        ...details,
      },
      metadata: {
        statusCode: status,
        ...details,
      },
    });
  }

  /**
   * Log d'une requête base de données
   */
  async query(
    operation: string,
    table: string,
    duration?: number,
    details?: any
  ): Promise<void> {
    await this.log({
      category: LogCategory.QUERY,
      level: LogLevel.DEBUG,
      message: `${operation} on ${table}`,
      duration,
      details: {
        operation,
        table,
        ...details,
      },
    });
  }

  /**
   * Log d'un test système
   */
  async systemTest(
    system: string,
    status: 'success' | 'error' | 'warning',
    message: string,
    details?: any
  ): Promise<void> {
    const level = status === 'error' 
      ? LogLevel.ERROR 
      : status === 'warning' 
      ? LogLevel.WARN 
      : LogLevel.INFO;

    await this.log({
      category: LogCategory.SYSTEM_TEST,
      level,
      message: `[${system}] ${message}`,
      details: {
        system,
        status,
        ...details,
      },
    });
  }

  /**
   * Récupère les logs filtrés depuis Supabase
   */
  async getLogs(filters?: {
    category?: LogCategory;
    level?: LogLevel;
    since?: Date;
    limit?: number;
    offset?: number;
  }): Promise<LogEntry[]> {
    try {
      let query = supabaseAdmin
        .from('structured_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.level) {
        query = query.eq('level', filters.level);
      }

      if (filters?.since) {
        query = query.gte('timestamp', filters.since.toISOString());
      }

      const limit = filters?.limit || 100;
      const offset = filters?.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        console.error('[Logger] Erreur récupération logs Supabase:', error);
        // Fallback sur les logs en mémoire
        return this.getLogsFromMemory(filters);
      }

      // Convertir les données Supabase en LogEntry
      return (data || []).map((row: any) => ({
        id: row.id,
        timestamp: row.timestamp,
        category: row.category as LogCategory,
        level: row.level as LogLevel,
        message: row.message,
        details: row.details || {},
        userId: row.actor_discord_id,
        route: row.route,
        duration: row.duration_ms,
        metadata: {
          actorRole: row.actor_role,
          resourceType: row.resource_type,
          resourceId: row.resource_id,
          statusCode: row.status_code,
        },
      }));
    } catch (error) {
      console.error('[Logger] Erreur inattendue récupération logs:', error);
      // Fallback sur les logs en mémoire
      return this.getLogsFromMemory(filters);
    }
  }

  /**
   * Récupère les logs depuis la mémoire (fallback)
   */
  private getLogsFromMemory(filters?: {
    category?: LogCategory;
    level?: LogLevel;
    since?: Date;
    limit?: number;
  }): LogEntry[] {
    let filtered = [...this.logs];

    if (filters?.category) {
      filtered = filtered.filter(log => log.category === filters.category);
    }

    if (filters?.level) {
      filtered = filtered.filter(log => log.level === filters.level);
    }

    if (filters?.since) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= filters.since!);
    }

    if (filters?.limit) {
      filtered = filtered.slice(-filters.limit);
    }

    return filtered.reverse(); // Plus récents en premier
  }

  /**
   * Récupère les statistiques des logs
   */
  getStats(): {
    total: number;
    byCategory: Record<LogCategory, number>;
    byLevel: Record<LogLevel, number>;
    errors: number;
    warnings: number;
  } {
    const byCategory: Record<string, number> = {};
    const byLevel: Record<string, number> = {};
    let errors = 0;
    let warnings = 0;

    this.logs.forEach(log => {
      byCategory[log.category] = (byCategory[log.category] || 0) + 1;
      byLevel[log.level] = (byLevel[log.level] || 0) + 1;
      
      if (log.level === LogLevel.ERROR) errors++;
      if (log.level === LogLevel.WARN) warnings++;
    });

    return {
      total: this.logs.length,
      byCategory: byCategory as Record<LogCategory, number>,
      byLevel: byLevel as Record<LogLevel, number>,
      errors,
      warnings,
    };
  }

  /**
   * Vide les logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * S'abonner aux nouveaux logs
   */
  subscribe(listener: (log: LogEntry) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Affiche dans la console selon le niveau
   */
  private consoleLog(entry: LogEntry): void {
    const prefix = `[${entry.category.toUpperCase()}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        if (process.env.NODE_ENV === 'development') {
          console.debug(message, entry.details || '');
        }
        break;
      case LogLevel.INFO:
        console.log(message, entry.details || '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.details || '');
        break;
      case LogLevel.ERROR:
        console.error(message, entry.details || '');
        break;
    }
  }
}

// Instance singleton
export const logger = new Logger();

// Helpers pour chaque catégorie
export const logAuth = {
  login: (userId: string, details?: any) => logger.info(LogCategory.AUTH, `Login: ${userId}`, details),
  logout: (userId: string) => logger.info(LogCategory.AUTH, `Logout: ${userId}`),
  error: (message: string, details?: any) => logger.error(LogCategory.AUTH, message, details),
};

export const logMember = {
  create: (twitchLogin: string, userId?: string) => logger.info(LogCategory.MEMBER_ACTION, `Member created: ${twitchLogin}`, { twitchLogin, userId }),
  update: (twitchLogin: string, userId?: string) => logger.info(LogCategory.MEMBER_ACTION, `Member updated: ${twitchLogin}`, { twitchLogin, userId }),
  delete: (twitchLogin: string, userId?: string) => logger.warn(LogCategory.MEMBER_ACTION, `Member deleted: ${twitchLogin}`, { twitchLogin, userId }),
};

export const logEvent = {
  create: (eventId: string, userId?: string) => logger.info(LogCategory.EVENT_ACTION, `Event created: ${eventId}`, { eventId, userId }),
  update: (eventId: string, userId?: string) => logger.info(LogCategory.EVENT_ACTION, `Event updated: ${eventId}`, { eventId, userId }),
  register: (eventId: string, twitchLogin: string) => logger.info(LogCategory.EVENT_ACTION, `Registration: ${twitchLogin} to ${eventId}`, { eventId, twitchLogin }),
};

export const logSpotlight = {
  create: (spotlightId: string, userId?: string) => logger.info(LogCategory.SPOTLIGHT_ACTION, `Spotlight created: ${spotlightId}`, { spotlightId, userId }),
  finalize: (spotlightId: string, userId?: string) => logger.info(LogCategory.SPOTLIGHT_ACTION, `Spotlight finalized: ${spotlightId}`, { spotlightId, userId }),
};

export const logEvaluation = {
  save: (month: string, twitchLogin: string, userId?: string) => logger.info(LogCategory.EVALUATION_ACTION, `Evaluation saved: ${month} for ${twitchLogin}`, { month, twitchLogin, userId }),
};

export const logApi = {
  route: (method: string, path: string, status: number, duration?: number, userId?: string, details?: any) => 
    logger.route(method, path, status, duration, userId, details),
  error: (path: string, error: Error, userId?: string) => 
    logger.error(LogCategory.API_ERROR, `API Error: ${path}`, { path, error: error.message, stack: error.stack, userId }),
  success: (path: string, duration?: number) => 
    logger.info(LogCategory.API_SUCCESS, `API Success: ${path}`, { path, duration }),
};

export const logDatabase = {
  query: (operation: string, table: string, duration?: number, details?: any) => 
    logger.query(operation, table, duration, details),
  error: (operation: string, table: string, error: Error) => 
    logger.error(LogCategory.DATABASE, `DB Error: ${operation} on ${table}`, { operation, table, error: error.message }),
};

export const logCache = {
  hit: (key: string) => logger.debug(LogCategory.CACHE, `Cache hit: ${key}`, { key }),
  miss: (key: string) => logger.debug(LogCategory.CACHE, `Cache miss: ${key}`, { key }),
  error: (key: string, error: Error) => logger.warn(LogCategory.CACHE, `Cache error: ${key}`, { key, error: error.message }),
};

export const logSystemTest = {
  success: (system: string, message: string, details?: any) => 
    logger.systemTest(system, 'success', message, details),
  error: (system: string, message: string, details?: any) => 
    logger.systemTest(system, 'error', message, details),
  warning: (system: string, message: string, details?: any) => 
    logger.systemTest(system, 'warning', message, details),
};
