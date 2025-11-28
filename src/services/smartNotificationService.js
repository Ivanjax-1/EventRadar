import { supabase } from '../lib/supabase';
import recommendationService from './recommendationService';
import { calculateEventStatus } from './eventLifecycleService';

/**
 * Servicio de notificaciones inteligentes in-app
 * Genera notificaciones personalizadas basadas en IA y comportamiento del usuario
 */

const NOTIFICATION_TYPES = {
  RECOMMENDATION: 'recommendation',
  FAVORITE_REMINDER: 'favorite_reminder',
  EVENT_STARTING: 'event_starting',
  EVENT_EXPIRING: 'event_expiring',
  NEW_IN_CATEGORY: 'new_in_category',
  TRENDING: 'trending'
};

/**
 * Genera una notificación inteligente para el usuario
 * @param {string} userId - ID del usuario
 * @param {array} allEvents - Todos los eventos disponibles
 * @returns {object|null} Notificación o null si no hay nada que mostrar
 */
export const generateSmartNotification = async (userId, allEvents) => {
  try {
    // Obtener historial de notificaciones mostradas (últimas 24 horas)
    const shownNotifications = getShownNotifications();
    
    // Obtener favoritos del usuario
    const { data: favorites } = await supabase
      .from('favorites')
      .select('event_id')
      .eq('user_id', userId);
    
    const favoriteIds = new Set(favorites?.map(f => f.event_id) || []);
    
    // Obtener interacciones del usuario
    const { data: interactions } = await supabase
      .from('user_interactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    // Obtener categorías favoritas del usuario
    const categoryPreferences = extractCategoryPreferences(interactions || []);
    
    // Array de posibles notificaciones (ordenadas por prioridad)
    const possibleNotifications = [];
    
    // 1. EVENTO FAVORITO INICIANDO (Prioridad ALTA)
    const startingFavorite = allEvents.find(event => {
      if (!favoriteIds.has(event.id)) return false;
      if (shownNotifications.includes(`starting_${event.id}`)) return false;
      
      const status = calculateEventStatus(event.start_date);
      return status === 'ongoing';
    });
    
    if (startingFavorite) {
      possibleNotifications.push({
        type: NOTIFICATION_TYPES.EVENT_STARTING,
        priority: 10,
        event: startingFavorite,
        title: '🔴 ¡Evento en vivo!',
        message: `"${startingFavorite.title}" acaba de comenzar. ¡No te lo pierdas!`,
        emoji: '🔴',
        color: 'red',
        trackingId: `starting_${startingFavorite.id}`
      });
    }
    
    // 2. EVENTO POR EXPIRAR (Prioridad ALTA)
    const expiringEvent = allEvents.find(event => {
      if (shownNotifications.includes(`expiring_${event.id}`)) return false;
      
      const status = calculateEventStatus(event.start_date);
      if (status !== 'finished') return false;
      
      // Verificar si está en las últimas 2 horas antes de borrarse
      const start = new Date(event.start_date);
      const now = new Date();
      const hoursSinceStart = (now - start) / (1000 * 60 * 60);
      
      return hoursSinceStart >= 4 && hoursSinceStart < 5.5; // Entre 4 y 5.5 horas
    });
    
    if (expiringEvent) {
      possibleNotifications.push({
        type: NOTIFICATION_TYPES.EVENT_EXPIRING,
        priority: 9,
        event: expiringEvent,
        title: '⏰ Última oportunidad',
        message: `"${expiringEvent.title}" se eliminará pronto. ¿Lo revisaste?`,
        emoji: '⚠️',
        color: 'orange',
        trackingId: `expiring_${expiringEvent.id}`
      });
    }
    
    // 3. RECORDATORIO DE FAVORITO PRÓXIMO (Prioridad MEDIA-ALTA)
    const upcomingFavorite = allEvents.find(event => {
      if (!favoriteIds.has(event.id)) return false;
      if (shownNotifications.includes(`reminder_${event.id}`)) return false;
      
      const start = new Date(event.start_date || event.date);
      const now = new Date();
      const hoursUntilStart = (start - now) / (1000 * 60 * 60);
      
      // Entre 2 y 24 horas antes del evento
      return hoursUntilStart > 2 && hoursUntilStart < 24;
    });
    
    if (upcomingFavorite) {
      const start = new Date(upcomingFavorite.start_date || upcomingFavorite.date);
      const now = new Date();
      const hoursUntilStart = Math.floor((start - now) / (1000 * 60 * 60));
      
      possibleNotifications.push({
        type: NOTIFICATION_TYPES.FAVORITE_REMINDER,
        priority: 8,
        event: upcomingFavorite,
        title: '💖 Recordatorio de favorito',
        message: `"${upcomingFavorite.title}" empieza en ${hoursUntilStart} horas`,
        emoji: '⏰',
        color: 'purple',
        trackingId: `reminder_${upcomingFavorite.id}`
      });
    }
    
    // 4. NUEVO EVENTO EN CATEGORÍA FAVORITA (Prioridad MEDIA)
    const newInCategory = allEvents.find(event => {
      if (shownNotifications.includes(`new_${event.id}`)) return false;
      
      // Verificar si el evento es nuevo (creado en las últimas 24 horas)
      const created = new Date(event.created_at);
      const now = new Date();
      const hoursSinceCreated = (now - created) / (1000 * 60 * 60);
      
      if (hoursSinceCreated > 24) return false;
      
      // Verificar si está en una categoría favorita
      const categoryName = event.event_categories?.name;
      return categoryPreferences.includes(categoryName);
    });
    
    if (newInCategory) {
      possibleNotifications.push({
        type: NOTIFICATION_TYPES.NEW_IN_CATEGORY,
        priority: 6,
        event: newInCategory,
        title: '✨ Nuevo evento para ti',
        message: `Nuevo evento de ${newInCategory.event_categories?.name}: "${newInCategory.title}"`,
        emoji: '🆕',
        color: 'blue',
        trackingId: `new_${newInCategory.id}`
      });
    }
    
    // 5. EVENTO TRENDING (Prioridad MEDIA)
    const { data: popularEvents } = await supabase
      .from('event_popularity')
      .select('event_id, trending_score')
      .order('trending_score', { ascending: false })
      .limit(5);
    
    const trendingEvent = allEvents.find(event => {
      if (shownNotifications.includes(`trending_${event.id}`)) return false;
      if (favoriteIds.has(event.id)) return false; // No mostrar si ya es favorito
      
      return popularEvents?.some(p => p.event_id === event.id && p.trending_score > 50);
    });
    
    if (trendingEvent) {
      possibleNotifications.push({
        type: NOTIFICATION_TYPES.TRENDING,
        priority: 5,
        event: trendingEvent,
        title: '🔥 Evento popular',
        message: `"${trendingEvent.title}" está siendo muy popular. ¡Échale un vistazo!`,
        emoji: '🔥',
        color: 'orange',
        trackingId: `trending_${trendingEvent.id}`
      });
    }
    
    // 6. RECOMENDACIÓN PERSONALIZADA (Prioridad BAJA-MEDIA)
    const recommendations = await recommendationService.getPersonalizedRecommendations(
      userId,
      allEvents,
      10
    );
    
    const recommendedEvent = recommendations.find(event => {
      if (shownNotifications.includes(`rec_${event.id}`)) return false;
      if (favoriteIds.has(event.id)) return false;
      
      // Solo mostrar recomendaciones con score alto
      return event.recommendationScore > 40;
    });
    
    if (recommendedEvent) {
      possibleNotifications.push({
        type: NOTIFICATION_TYPES.RECOMMENDATION,
        priority: 4,
        event: recommendedEvent,
        title: '🎯 Recomendado para ti',
        message: `Basado en tus gustos: "${recommendedEvent.title}"`,
        emoji: '✨',
        color: 'indigo',
        trackingId: `rec_${recommendedEvent.id}`
      });
    }
    
    // Ordenar por prioridad y retornar la mejor opción
    possibleNotifications.sort((a, b) => b.priority - a.priority);
    
    console.log('📊 Notificaciones posibles generadas:', possibleNotifications.length);
    
    if (possibleNotifications.length === 0) {
      console.log('ℹ️ No hay notificaciones específicas, intentando fallback...');
      
      // FALLBACK: Si no hay notificaciones específicas, mostrar un evento aleatorio
      const randomEvent = allEvents.find(event => {
        if (shownNotifications.includes(`fallback_${event.id}`)) return false;
        const status = calculateEventStatus(event.start_date || event.date);
        return status === 'upcoming'; // Solo eventos próximos
      });
      
      if (randomEvent) {
        console.log('✅ Usando notificación fallback para evento:', randomEvent.title);
        saveShownNotification(`fallback_${randomEvent.id}`);
        
        return {
          type: NOTIFICATION_TYPES.RECOMMENDATION,
          priority: 3,
          event: randomEvent,
          title: '🎉 Descubre este evento',
          message: `¿Ya conoces "${randomEvent.title}"? ¡Podría interesarte!`,
          emoji: '✨',
          color: 'indigo',
          trackingId: `fallback_${randomEvent.id}`
        };
      }
      
      console.log('⚠️ No hay eventos para mostrar notificación');
      return null;
    }
    
    const selectedNotification = possibleNotifications[0];
    
    console.log('✅ Notificación seleccionada:', {
      type: selectedNotification.type,
      priority: selectedNotification.priority,
      event: selectedNotification.event?.title
    });
    
    // Guardar en historial
    saveShownNotification(selectedNotification.trackingId);
    
    return selectedNotification;
    
  } catch (error) {
    console.error('❌ Error generando notificación inteligente:', error);
    return null;
  }
};

/**
 * Extrae las categorías preferidas del usuario desde sus interacciones
 */
const extractCategoryPreferences = (interactions) => {
  const categoryCount = {};
  
  interactions.forEach(interaction => {
    if (interaction.metadata?.category) {
      categoryCount[interaction.metadata.category] = 
        (categoryCount[interaction.metadata.category] || 0) + 1;
    }
  });
  
  // Retornar top 3 categorías
  return Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => category);
};

/**
 * Obtiene notificaciones mostradas en las últimas 24 horas
 */
const getShownNotifications = () => {
  const stored = localStorage.getItem('shown_notifications');
  if (!stored) return [];
  
  try {
    const data = JSON.parse(stored);
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    // Filtrar solo las del último día
    return data
      .filter(item => item.timestamp > oneDayAgo)
      .map(item => item.id);
  } catch {
    return [];
  }
};

/**
 * Guarda una notificación en el historial
 */
const saveShownNotification = (notificationId) => {
  const stored = localStorage.getItem('shown_notifications');
  let data = [];
  
  try {
    data = stored ? JSON.parse(stored) : [];
  } catch {
    data = [];
  }
  
  // Agregar nueva notificación
  data.push({
    id: notificationId,
    timestamp: Date.now()
  });
  
  // Limpiar notificaciones viejas (más de 24 horas)
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  data = data.filter(item => item.timestamp > oneDayAgo);
  
  localStorage.setItem('shown_notifications', JSON.stringify(data));
};

/**
 * Limpia el historial de notificaciones (para testing)
 */
export const clearNotificationHistory = () => {
  localStorage.removeItem('shown_notifications');
  console.log('✅ Historial de notificaciones limpiado');
};

export default {
  generateSmartNotification,
  clearNotificationHistory,
  NOTIFICATION_TYPES
};
