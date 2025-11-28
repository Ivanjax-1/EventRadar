import { supabase } from '../lib/supabase';

/**
 * Servicio para gestionar el ciclo de vida de eventos
 * Maneja estados: upcoming, ongoing, finished, archived
 */

/**
 * Calcula el estado actual de un evento basado en su fecha de inicio
 * @param {string} startDate - Fecha de inicio del evento (ISO string)
 * @returns {string} Estado: 'upcoming', 'ongoing', 'finished', 'archived'
 */
export const calculateEventStatus = (startDate) => {
  if (!startDate) return 'upcoming';
  
  const start = new Date(startDate);
  const now = new Date();
  const diffInHours = (now - start) / (1000 * 60 * 60);
  
  // Evento aún no ha iniciado
  if (diffInHours < 0) {
    return 'upcoming';
  }
  
  // Evento en progreso (0 a 4 horas desde inicio)
  if (diffInHours >= 0 && diffInHours < 4) {
    return 'ongoing';
  }
  
  // Evento finalizado (4 a 6 horas desde inicio)
  if (diffInHours >= 4 && diffInHours < 6) {
    return 'finished';
  }
  
  // Evento debe ser archivado (más de 6 horas desde inicio)
  return 'archived';
};

/**
 * Obtiene el label visual del estado del evento
 * @param {string} status - Estado del evento
 * @returns {object} Objeto con label, emoji y color
 */
export const getStatusLabel = (status) => {
  const labels = {
    upcoming: {
      label: 'Próximamente',
      emoji: '⏳',
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-300'
    },
    ongoing: {
      label: 'En vivo',
      emoji: '🔴',
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-300',
      animate: 'animate-pulse'
    },
    finished: {
      label: 'Finalizado',
      emoji: '✅',
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-300'
    },
    archived: {
      label: 'Archivado',
      emoji: '📦',
      color: 'gray',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-600',
      borderColor: 'border-gray-300'
    }
  };
  
  return labels[status] || labels.upcoming;
};

/**
 * Actualiza el estado de todos los eventos en la base de datos
 * Se debe ejecutar periódicamente (cada hora) desde un cron job o edge function
 */
export const updateAllEventStatuses = async () => {
  try {
    const { data, error } = await supabase.rpc('update_event_statuses');
    
    if (error) throw error;
    
    console.log('✅ Estados de eventos actualizados correctamente');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error actualizando estados de eventos:', error);
    return { success: false, error };
  }
};

/**
 * Elimina eventos archivados (más de 6 horas desde inicio)
 * Se debe ejecutar periódicamente
 */
export const cleanupArchivedEvents = async () => {
  try {
    const { data, error } = await supabase.rpc('cleanup_archived_events');
    
    if (error) throw error;
    
    console.log(`✅ ${data} eventos archivados eliminados`);
    return { success: true, deletedCount: data };
  } catch (error) {
    console.error('❌ Error eliminando eventos archivados:', error);
    return { success: false, error };
  }
};

/**
 * Obtiene eventos excluyendo los archivados
 * Usa la vista events_with_live_status para obtener estado en tiempo real
 * @param {object} filters - Filtros opcionales
 * @returns {array} Lista de eventos activos
 */
export const getActiveEvents = async (filters = {}) => {
  try {
    let query = supabase
      .from('events_with_live_status')
      .select('*')
      .in('live_status', ['upcoming', 'ongoing', 'finished'])
      .order('start_date', { ascending: true });
    
    // Aplicar filtros adicionales si existen
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
    
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Calcular estado en el cliente también (por si la vista no está disponible)
    const eventsWithStatus = data.map(event => ({
      ...event,
      clientStatus: calculateEventStatus(event.start_date),
      statusInfo: getStatusLabel(calculateEventStatus(event.start_date))
    }));
    
    console.log(`✅ ${eventsWithStatus.length} eventos activos obtenidos`);
    return { success: true, data: eventsWithStatus };
    
  } catch (error) {
    console.error('❌ Error obteniendo eventos activos:', error);
    
    // Fallback: obtener de tabla normal y calcular estado en cliente
    try {
      const { data, error: fallbackError } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true });
      
      if (fallbackError) throw fallbackError;
      
      // Filtrar eventos archivados en el cliente
      const activeEvents = data
        .map(event => ({
          ...event,
          clientStatus: calculateEventStatus(event.start_date),
          statusInfo: getStatusLabel(calculateEventStatus(event.start_date))
        }))
        .filter(event => event.clientStatus !== 'archived');
      
      console.log(`⚠️ Usando fallback - ${activeEvents.length} eventos activos`);
      return { success: true, data: activeEvents };
      
    } catch (fallbackError) {
      console.error('❌ Error en fallback:', fallbackError);
      return { success: false, error: fallbackError };
    }
  }
};

/**
 * Obtiene el tiempo restante hasta el inicio del evento
 * @param {string} startDate - Fecha de inicio del evento
 * @returns {object} Tiempo restante formateado
 */
export const getTimeUntilStart = (startDate) => {
  if (!startDate) return null;
  
  const start = new Date(startDate);
  const now = new Date();
  const diff = start - now;
  
  if (diff < 0) return { started: true };
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return {
    started: false,
    days,
    hours,
    minutes,
    formatted: days > 0 
      ? `${days}d ${hours}h` 
      : hours > 0 
        ? `${hours}h ${minutes}m`
        : `${minutes}m`
  };
};

/**
 * Inicializa el servicio de limpieza automática
 * Ejecuta limpieza cada 1 hora
 */
export const initEventLifecycleService = () => {
  console.log('🔄 Servicio de ciclo de vida de eventos iniciado');
  
  // Ejecutar limpieza inmediatamente
  cleanupArchivedEvents();
  
  // Ejecutar cada hora
  setInterval(() => {
    console.log('🔄 Ejecutando limpieza programada de eventos...');
    cleanupArchivedEvents();
    updateAllEventStatuses();
  }, 60 * 60 * 1000); // 1 hora
  
  return () => {
    console.log('🛑 Servicio de ciclo de vida de eventos detenido');
  };
};

export default {
  calculateEventStatus,
  getStatusLabel,
  updateAllEventStatuses,
  cleanupArchivedEvents,
  getActiveEvents,
  getTimeUntilStart,
  initEventLifecycleService
};
