/**
 * RETARGETING SERVICE
 * Sistema de retargeting para re-enganche de usuarios
 * - Track de eventos vistos pero sin inscripción
 * - Notificaciones de recordatorio
 * - Ofertas especiales para usuarios indecisos
 */

import { supabase } from '../config/supabase';

class RetargetingService {
  constructor() {
    this.viewedEvents = new Map(); // eventId -> timestamp
    this.reminderTimers = new Map();
    this.storageKey = 'eventRadar_retargeting';
    this.loadFromStorage();
  }

  /**
   * Cargar datos de localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.viewedEvents = new Map(data.viewedEvents || []);
      }
    } catch (error) {
      console.error('Error cargando retargeting data:', error);
    }
  }

  /**
   * Guardar en localStorage
   */
  saveToStorage() {
    try {
      const data = {
        viewedEvents: Array.from(this.viewedEvents.entries()),
        timestamp: Date.now()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error guardando retargeting data:', error);
    }
  }

  /**
   * Registrar que un usuario vio un evento
   */
  async trackEventView(userId, eventId, eventData) {
    const now = Date.now();
    
    // Guardar en memoria
    this.viewedEvents.set(eventId, {
      timestamp: now,
      userId,
      eventData: {
        id: eventId,
        title: eventData.title,
        date: eventData.date,
        location: eventData.location,
        price: eventData.price
      }
    });

    this.saveToStorage();

    // Guardar en base de datos
    try {
      await supabase
        .from('event_analytics')
        .insert({
          event_id: eventId,
          user_id: userId,
          action: 'view',
          source: 'detail_page',
          created_at: new Date().toISOString()
        });

      console.log('📊 Vista registrada para retargeting:', eventId);
    } catch (error) {
      console.error('Error guardando vista en BD:', error);
    }

    // Programar recordatorio si el usuario no se inscribe
    this.scheduleReminder(userId, eventId, eventData);
  }

  /**
   * Programar recordatorio después de X tiempo
   */
  scheduleReminder(userId, eventId, eventData) {
    // Cancelar recordatorio previo si existe
    if (this.reminderTimers.has(eventId)) {
      clearTimeout(this.reminderTimers.get(eventId));
    }

    // Programar para 1 hora después
    const reminderDelay = 60 * 60 * 1000; // 1 hora
    
    const timerId = setTimeout(() => {
      this.sendReminder(userId, eventId, eventData);
    }, reminderDelay);

    this.reminderTimers.set(eventId, timerId);
    console.log(`⏰ Recordatorio programado para evento ${eventId} en 1 hora`);
  }

  /**
   * Enviar recordatorio al usuario
   */
  async sendReminder(userId, eventId, eventData) {
    // Verificar si el usuario ya se inscribió
    const hasRegistered = await this.checkIfUserRegistered(userId, eventId);
    
    if (hasRegistered) {
      console.log('✅ Usuario ya inscrito, cancelando recordatorio');
      this.reminderTimers.delete(eventId);
      return;
    }

    // Verificar si añadió a favoritos
    const isFavorite = await this.checkIfIsFavorite(userId, eventId);
    
    const title = isFavorite 
      ? '⭐ Evento en tus favoritos pronto!'
      : '⏰ ¿Aún interesado en este evento?';
    
    const body = `${eventData.title} - ${new Date(eventData.date).toLocaleDateString('es-ES')}`;

    // Enviar notificación
    this.sendNotification(title, body, eventId, 'reminder');

    // Registrar en analytics
    await this.trackReminderSent(userId, eventId);

    console.log('🔔 Recordatorio enviado:', eventData.title);
  }

  /**
   * Verificar si el usuario se registró al evento
   */
  async checkIfUserRegistered(userId, eventId) {
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('Error verificando registro:', error);
      return false;
    }
  }

  /**
   * Verificar si el evento está en favoritos
   */
  async checkIfIsFavorite(userId, eventId) {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('Error verificando favorito:', error);
      return false;
    }
  }

  /**
   * Registrar que se envió un recordatorio
   */
  async trackReminderSent(userId, eventId) {
    try {
      await supabase
        .from('push_notifications_log')
        .insert({
          event_id: eventId,
          user_id: userId,
          notification_type: 'retargeting_reminder',
          sent_at: new Date().toISOString(),
          status: 'sent'
        });
    } catch (error) {
      console.error('Error registrando recordatorio:', error);
    }
  }

  /**
   * Enviar notificación (browser o in-app)
   */
  sendNotification(title, body, eventId, type = 'reminder') {
    if (!('Notification' in window)) {
      this.showInAppNotification(title, body, eventId, type);
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: `retargeting-${eventId}`,
        data: { eventId, type },
        requireInteraction: false,
        actions: [
          { action: 'view', title: 'Ver Evento' },
          { action: 'dismiss', title: 'Cerrar' }
        ]
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body });
        } else {
          this.showInAppNotification(title, body, eventId, type);
        }
      });
    } else {
      this.showInAppNotification(title, body, eventId, type);
    }
  }

  /**
   * Mostrar notificación dentro de la app
   */
  showInAppNotification(title, body, eventId, type) {
    const notification = {
      id: `retargeting-${eventId}-${Date.now()}`,
      type,
      title,
      body,
      eventId,
      timestamp: new Date()
    };

    window.dispatchEvent(new CustomEvent('retargetingNotification', { detail: notification }));
    console.log('📱 Notificación in-app:', title);
  }

  /**
   * Obtener eventos que el usuario vio pero no se inscribió
   */
  getViewedButNotRegistered() {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    return Array.from(this.viewedEvents.entries())
      .filter(([eventId, data]) => data.timestamp > oneDayAgo)
      .map(([eventId, data]) => ({
        eventId,
        ...data
      }));
  }

  /**
   * Marcar evento como inscrito (cancelar retargeting)
   */
  markAsRegistered(eventId) {
    this.viewedEvents.delete(eventId);
    
    if (this.reminderTimers.has(eventId)) {
      clearTimeout(this.reminderTimers.get(eventId));
      this.reminderTimers.delete(eventId);
    }

    this.saveToStorage();
    console.log('✅ Retargeting cancelado para evento:', eventId);
  }

  /**
   * Limpiar eventos antiguos
   */
  cleanup() {
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

    this.viewedEvents.forEach((data, eventId) => {
      if (data.timestamp < sevenDaysAgo) {
        this.viewedEvents.delete(eventId);
        
        if (this.reminderTimers.has(eventId)) {
          clearTimeout(this.reminderTimers.get(eventId));
          this.reminderTimers.delete(eventId);
        }
      }
    });

    this.saveToStorage();
    console.log('🧹 Retargeting limpiado');
  }

  /**
   * Programar recordatorio antes del evento
   */
  scheduleEventReminder(userId, eventId, eventData) {
    const eventDate = new Date(eventData.date);
    const now = new Date();
    const timeDiff = eventDate - now;

    // Recordatorio 24 horas antes
    const reminderTime24h = timeDiff - (24 * 60 * 60 * 1000);
    // Recordatorio 1 hora antes
    const reminderTime1h = timeDiff - (1 * 60 * 60 * 1000);

    if (reminderTime24h > 0) {
      setTimeout(() => {
        this.sendNotification(
          '⏰ Evento mañana',
          `${eventData.title} es mañana a las ${new Date(eventData.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
          eventId,
          'event_reminder_24h'
        );
      }, reminderTime24h);

      console.log('⏰ Recordatorio 24h programado para:', eventData.title);
    }

    if (reminderTime1h > 0) {
      setTimeout(() => {
        this.sendNotification(
          '🔥 ¡Evento en 1 hora!',
          `${eventData.title} comienza pronto en ${eventData.location}`,
          eventId,
          'event_reminder_1h'
        );
      }, reminderTime1h);

      console.log('⏰ Recordatorio 1h programado para:', eventData.title);
    }
  }

  /**
   * Obtener estadísticas de retargeting
   */
  getStats() {
    return {
      viewedEventsCount: this.viewedEvents.size,
      activeReminders: this.reminderTimers.size,
      lastCleanup: new Date()
    };
  }

  /**
   * Solicitar permisos de notificaciones
   */
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }
}

// Exportar instancia singleton
const retargetingService = new RetargetingService();

// Limpiar datos antiguos cada hora
setInterval(() => {
  retargetingService.cleanup();
}, 60 * 60 * 1000);

export default retargetingService;
