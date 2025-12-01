// src/services/trackingService.js
import { supabase } from '../lib/supabase';

class TrackingService {
  constructor() {
    // Solo necesitamos rastrear los tiempos de inicio de vista
    this.eventViewStartTime = {};
    this.trackingAvailable = true;
    this.trackingDisabledReason = null;
  }

  disableTracking(reason) {
    if (!this.trackingAvailable) return;
    this.trackingAvailable = false;
    this.trackingDisabledReason = reason;
    console.warn('⚠️ Tracking deshabilitado:', reason);
  }

  /**
   * Iniciar tracking de una vista de evento
   */
  startEventView(userId, eventId) {
    if (!userId || !eventId) return;
    
    const key = `${userId}-${eventId}`;
    this.eventViewStartTime[key] = Date.now();
  }

  /**
   * Finalizar tracking de vista y registrar interacción
   */
  async endEventView(userId, eventId) {
    if (!userId || !eventId) return;
    
    const key = `${userId}-${eventId}`;
    const startTime = this.eventViewStartTime[key];
    
    if (!startTime) return;
    
    const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
    delete this.eventViewStartTime[key];

    // Solo registrar si vio el evento por más de 2 segundos (filtro de rebote)
    if (durationSeconds >= 2) {
      await this.trackInteraction(userId, eventId, 'view', { durationSeconds });
    }
  }

  /**
   * Registrar cualquier tipo de interacción
   */
  async trackInteraction(userId, eventId, interactionType, metadata = {}) {
    if (!userId || !interactionType || !this.trackingAvailable) return;

    try {
      const interaction = {
        user_id: userId,
        event_id: eventId || null,
        interaction_type: interactionType,
        interaction_data: Object.keys(metadata).length ? metadata : null,
        created_at: new Date().toISOString()
      };

      // Insertar en la base de datos
      const { error } = await supabase
        .from('user_interactions')
        .insert([interaction]);

      if (error) {
        // Ignoramos errores silenciosamente en producción, pero logueamos en dev
        console.warn('⚠️ Error tracking interaction (check RLS policies):', error.message);
        if (error.code === '42501' || /permission denied/i.test(error.message)) {
          this.disableTracking('Sin permisos para user_interactions');
        }
      } else {
        // Opcional: comentar este log en producción para limpiar la consola
        console.log(`✅ Tracked ${interactionType} for event ${eventId}`);
      }
    } catch (error) {
      console.error('❌ Error in trackInteraction:', error);
      if (error.code === '42501' || /permission denied/i.test(error.message)) {
        this.disableTracking('Sin permisos para user_interactions');
      }
    }
  }

  /**
   * Track click en evento
   */
  async trackEventClick(userId, eventId) {
    return this.trackInteraction(userId, eventId, 'click');
  }

  /**
   * Track favorito
   */
  async trackFavorite(userId, eventId, isAdding) {
    return this.trackInteraction(userId, eventId, isAdding ? 'favorite_add' : 'favorite_remove', {
      action: isAdding ? 'add' : 'remove'
    });
  }

  /**
   * Track compartir
   */
  async trackShare(userId, eventId) {
    return this.trackInteraction(userId, eventId, 'share');
  }

  /**
   * Track búsqueda
   */
  async trackSearch(userId, searchQuery, resultsCount) {
    if (!userId || !searchQuery) return;

    return this.trackInteraction(userId, null, 'search', {
      searchQuery,
      resultsCount
    });
  }

  /**
   * Obtener interacciones recientes del usuario
   * NOTA: Requiere que las políticas RLS en Supabase permitan el SELECT
   */
  async getUserInteractions(userId, limit = 100) {
    if (!userId || !this.trackingAvailable) return [];

    try {
      const { data, error } = await supabase
        .from('user_interactions')
        .select('*') // Importante: NO incluir 'users(*)' para evitar error 403
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching user interactions:', error);
      if (error.code === '42501' || /permission denied/i.test(error.message)) {
        this.disableTracking('Sin permisos para leer user_interactions');
      }
      return [];
    }
  }

  /**
   * Limpiar tracking al cerrar sesión
   */
  cleanup() {
    this.eventViewStartTime = {};
    // Ya no es necesario limpiar intervalos porque los eliminamos
  }
}

export const trackingService = new TrackingService();
export default trackingService;