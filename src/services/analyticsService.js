import { supabase } from '../config/supabase';

/**
 * AnalyticsService - Servicio para trackear interacciones de usuarios con eventos
 * Registra vistas, clicks, favoritos, shares, etc.
 */
class AnalyticsService {
  /**
   * Registra una interacción del usuario con un evento
   * @param {string} eventId - ID del evento
   * @param {string} actionType - Tipo de acción: 'view', 'click', 'favorite', 'share', etc.
   * @param {string} source - Fuente: 'map', 'list', 'recommendation', 'notification', 'search'
   * @param {object} userLocation - { lat, lng } opcional
   */
  async trackAction(eventId, actionType, source = null, userLocation = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const analyticsData = {
        event_id: eventId,
        user_id: user?.id || null,
        action_type: actionType,
        source: source,
      };

      // Agregar ubicación si está disponible (formato JSONB)
      if (userLocation && userLocation.lat && userLocation.lng) {
        analyticsData.user_location = {
          lat: userLocation.lat,
          lng: userLocation.lng
        };
      }

      const { error } = await supabase
        .from('event_analytics')
        .insert([analyticsData]);

      if (error) {
        console.error('Error tracking analytics:', error);
      }

      // Actualizar contadores en tiempo real (optimista)
      this.updateLocalCounters(eventId, actionType);

    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  /**
   * Trackea vista de evento
   */
  async trackView(eventId, source = 'list', userLocation = null) {
    await this.trackAction(eventId, 'view', source, userLocation);
  }

  /**
   * Trackea click en evento
   */
  async trackClick(eventId, source = 'list', userLocation = null) {
    await this.trackAction(eventId, 'click', source, userLocation);
  }

  /**
   * Trackea cuando usuario agrega a favoritos
   */
  async trackFavorite(eventId, source = null) {
    await this.trackAction(eventId, 'favorite', source);
  }

  /**
   * Trackea cuando usuario remueve de favoritos
   */
  async trackUnfavorite(eventId, source = null) {
    await this.trackAction(eventId, 'unfavorite', source);
  }

  /**
   * Trackea compartir evento
   */
  async trackShare(eventId, source = null) {
    await this.trackAction(eventId, 'share', source);
  }

  /**
   * Trackea vista en mapa
   */
  async trackMapView(eventId, userLocation = null) {
    await this.trackAction(eventId, 'map_view', 'map', userLocation);
  }

  /**
   * Trackea apertura desde notificación
   */
  async trackNotificationOpen(eventId) {
    await this.trackAction(eventId, 'notification_open', 'notification');
  }

  /**
   * Actualiza contadores locales (optimista)
   */
  updateLocalCounters(eventId, actionType) {
    // Esta función puede ser usada para actualizar UI inmediatamente
    // sin esperar la respuesta del servidor
    window.dispatchEvent(new CustomEvent('analytics-update', {
      detail: { eventId, actionType }
    }));
  }

  /**
   * Obtiene analíticas de un evento
   * @param {string} eventId 
   * @returns {Promise<object>} Estadísticas del evento
   */
  async getEventAnalytics(eventId) {
    try {
      // Obtener datos del evento con contadores
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select(`
          id,
          title,
          analytics_views,
          analytics_clicks,
          analytics_favorites,
          analytics_shares,
          promotion_tier,
          created_at
        `)
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      // Obtener detalles de analíticas
      const { data: analytics, error: analyticsError } = await supabase
        .from('event_analytics')
        .select('action_type, source, created_at')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (analyticsError) throw analyticsError;

      // Calcular métricas
      const metrics = this.calculateMetrics(event, analytics);

      return {
        event,
        metrics,
        recentActivity: analytics,
      };

    } catch (error) {
      console.error('Error fetching event analytics:', error);
      return null;
    }
  }

  /**
   * Calcula métricas a partir de datos de analíticas
   */
  calculateMetrics(event, analytics) {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    // Filtrar actividad reciente
    const last24h = analytics.filter(a => 
      new Date(a.created_at).getTime() > oneDayAgo
    );

    const lastWeek = analytics.filter(a => 
      new Date(a.created_at).getTime() > oneWeekAgo
    );

    // Contar por fuente
    const sourceBreakdown = analytics.reduce((acc, item) => {
      const source = item.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    // Calcular CTR (Click-Through Rate)
    const ctr = event.analytics_views > 0
      ? ((event.analytics_clicks / event.analytics_views) * 100).toFixed(2)
      : 0;

    // Calcular tasa de favoritos
    const favoriteRate = event.analytics_clicks > 0
      ? ((event.analytics_favorites / event.analytics_clicks) * 100).toFixed(2)
      : 0;

    // Calcular engagement rate
    const engagementRate = event.analytics_views > 0
      ? (((event.analytics_clicks + event.analytics_favorites + event.analytics_shares) / event.analytics_views) * 100).toFixed(2)
      : 0;

    return {
      total: {
        views: event.analytics_views || 0,
        clicks: event.analytics_clicks || 0,
        favorites: event.analytics_favorites || 0,
        shares: event.analytics_shares || 0,
      },
      last24h: {
        views: last24h.filter(a => a.action_type === 'view').length,
        clicks: last24h.filter(a => a.action_type === 'click').length,
        favorites: last24h.filter(a => a.action_type === 'favorite').length,
      },
      lastWeek: {
        views: lastWeek.filter(a => a.action_type === 'view').length,
        clicks: lastWeek.filter(a => a.action_type === 'click').length,
        favorites: lastWeek.filter(a => a.action_type === 'favorite').length,
      },
      rates: {
        ctr: parseFloat(ctr),
        favoriteRate: parseFloat(favoriteRate),
        engagementRate: parseFloat(engagementRate),
      },
      sourceBreakdown,
      isTrending: last24h.filter(a => a.action_type === 'favorite').length >= 100,
    };
  }

  /**
   * Obtiene analíticas de todos los eventos de un usuario (organizador)
   */
  async getUserEventsAnalytics(userId) {
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          analytics_views,
          analytics_clicks,
          analytics_favorites,
          analytics_shares,
          promotion_tier,
          created_at
        `)
        .eq('organizer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calcular totales
      const totals = events.reduce((acc, event) => ({
        views: acc.views + (event.analytics_views || 0),
        clicks: acc.clicks + (event.analytics_clicks || 0),
        favorites: acc.favorites + (event.analytics_favorites || 0),
        shares: acc.shares + (event.analytics_shares || 0),
      }), { views: 0, clicks: 0, favorites: 0, shares: 0 });

      // Comparar eventos free vs promocionados
      const freeEvents = events.filter(e => e.promotion_tier === 'free');
      const promotedEvents = events.filter(e => e.promotion_tier !== 'free');

      const avgFreeViews = freeEvents.length > 0
        ? freeEvents.reduce((sum, e) => sum + (e.analytics_views || 0), 0) / freeEvents.length
        : 0;

      const avgPromotedViews = promotedEvents.length > 0
        ? promotedEvents.reduce((sum, e) => sum + (e.analytics_views || 0), 0) / promotedEvents.length
        : 0;

      const visibilityBoost = avgFreeViews > 0
        ? (((avgPromotedViews - avgFreeViews) / avgFreeViews) * 100).toFixed(0)
        : 0;

      return {
        events,
        totals,
        averages: {
          free: avgFreeViews,
          promoted: avgPromotedViews,
          visibilityBoost: parseInt(visibilityBoost),
        },
        counts: {
          total: events.length,
          free: freeEvents.length,
          promoted: promotedEvents.length,
        },
      };

    } catch (error) {
      console.error('Error fetching user analytics:', error);
      return null;
    }
  }

  /**
   * Registra log de notificación push enviada
   */
  async logPushNotification(eventId, notificationType, targetCount) {
    try {
      const { error } = await supabase
        .from('push_notifications_log')
        .insert([{
          event_id: eventId,
          notification_type: notificationType,
          target_count: targetCount,
        }]);

      if (error) throw error;

      // Marcar que se envió push en el evento
      await supabase
        .from('events')
        .update({
          push_notification_sent: true,
          push_notification_sent_at: new Date().toISOString(),
        })
        .eq('id', eventId);

    } catch (error) {
      console.error('Error logging push notification:', error);
    }
  }

  /**
   * Incrementa contador de notificaciones abiertas
   */
  async incrementNotificationOpened(eventId) {
    try {
      // Buscar el log de notificación más reciente
      const { data: log, error: findError } = await supabase
        .from('push_notifications_log')
        .select('id, opened_count')
        .eq('event_id', eventId)
        .order('sent_at', { ascending: false })
        .limit(1)
        .single();

      if (findError || !log) return;

      // Incrementar contador
      await supabase
        .from('push_notifications_log')
        .update({
          opened_count: (log.opened_count || 0) + 1,
        })
        .eq('id', log.id);

    } catch (error) {
      console.error('Error incrementing notification opened:', error);
    }
  }
}

// Exportar instancia singleton
const analyticsService = new AnalyticsService();
export default analyticsService;
