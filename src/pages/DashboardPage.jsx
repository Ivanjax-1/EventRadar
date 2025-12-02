import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Calendar, User, Menu, X, LogOut, Home, Heart, Search, Filter, SortAsc, Plus, Sparkles, DollarSign, Bot, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../hooks/useUserRole';
import { useIsMobile } from '../hooks/useIsMobile';
import { supabase } from '../lib/supabase';
import MapView from '../components/MapView';
import MobileMapView from '../components/MobileMapView';
import ProfilePage from './ProfilePage';
import AdminEventForm from '../components/AdminEventForm';
import EventRadarLogo from '../components/EventRadarLogo';
import RecommendedEvents from '../components/RecommendedEvents';
import AIAssistant from '../components/AIAssistant';
import EventStatusBadge from '../components/ui/EventStatusBadge';
import SmartNotificationManager from '../components/SmartNotificationManager';
import SmartNotificationToast from '../components/SmartNotificationToast';
import trackingService from '../services/trackingService';
import { getActiveEvents, calculateEventStatus, initEventLifecycleService } from '../services/eventLifecycleService';
import PricingPage from './PricingPage';
import { CombinedEventBadges } from '../components/EventPromotionBadge';
import geofencingService from '../services/geofencingService';
import retargetingService from '../services/retargetingService';

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const { role } = useUserRole();
  const isMobile = useIsMobile(); // Detectar si es móvil
  const isAdmin = role === 'admin';
  const isPremium = role === 'premium';
  const [activeTab, setActiveTab] = useState('mapa');
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAIChat, setShowAIChat] = useState(false);

  // Detectar si vienen desde una notificación
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      // Limpiar el state para que no se quede pegado
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location]);

  // Estado simplificado
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]); // Todos los eventos sin filtrar
  const [favoriteIds, setFavoriteIds] = useState(new Set()); // Solo IDs de favoritos
  const [loading, setLoading] = useState(true);

  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('priority'); // priority, date, category, region
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const loadAllData = async () => {
    try {
      console.log('📡 Cargando eventos...');
      setLoading(true);

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_categories(id, name, color, icon)
        `)
        .order('date', { ascending: true });

      if (error) {
        console.error('❌ Error cargando eventos:', error);
        return;
      }

      const uniqueData = data
        ? Array.from(new Map(data.map(event => [event.id, event])).values())
        : [];

      if (!uniqueData.length) {
        setAllEvents([]);
        setEvents([]);
        return;
      }

      const processedEvents = uniqueData.map(event => {
        const startDate = event.start_date
          ? new Date(event.start_date)
          : new Date(event.date);

        const endDate = event.end_date
          ? new Date(event.end_date)
          : new Date(startDate.getTime() + 3 * 60 * 60 * 1000);

        return {
          ...event,
          start_date: startDate,
          calculated_end_date: endDate,
          clientStatus: calculateEventStatus(startDate),
        };
      });

      const activeEvents = processedEvents.filter(
        event => event.clientStatus !== 'archived'
      );

      setAllEvents(activeEvents);
      setEvents(activeEvents);
      
      console.log('✅ Eventos cargados:', activeEvents.length);
      if (activeEvents.length > 0) {
        console.log('📋 Primeros 3 eventos con IDs:', activeEvents.slice(0, 3).map(e => ({
          id: e.id,
          idType: typeof e.id,
          title: e.title
        })));
      }

    } catch (error) {
      console.error('❌ Error en loadAllData:', error);
    } finally {
      setLoading(false);
    }
  };

  // Estado para notificaciones smart
  const [smartNotifications, setSmartNotifications] = useState([]);

  // Cargar datos iniciales
  useEffect(() => {
    if (!user) return;
    loadAllData();
    loadFavoriteIds(); // ⭐ CARGAR FAVORITOS

    // Inicializar servicio de limpieza automática de eventos (solo admin)
    const cleanup = initEventLifecycleService(isAdmin);

    // Inicializar servicios de geofencing y retargeting
    initSmartServices();

    return () => {
      if (cleanup) cleanup();
      // Detener geofencing al desmontar
      geofencingService.stopWatching();
      window.removeEventListener('eventNearby', handleEventNearby);
      window.removeEventListener('retargetingNotification', handleRetargetingNotification);
    };
  }, [user, refreshTrigger]);

  // Inicializar servicios inteligentes
  const initSmartServices = async () => {
    // Solicitar permisos de notificaciones
    const notificationPermission = await retargetingService.requestNotificationPermission();
    console.log('🔔 Permisos de notificación:', notificationPermission ? 'Concedido' : 'Denegado');

    // Iniciar geofencing (radio de 500m)
    const geofencingStarted = await geofencingService.startWatching(allEvents, 500);
    if (geofencingStarted) {
      console.log('🛰️ Geofencing activado - Radio: 500m');
    }

    // Escuchar eventos cercanos
    window.addEventListener('eventNearby', handleEventNearby);
    window.addEventListener('retargetingNotification', handleRetargetingNotification);
  };

  // Handler para eventos cercanos
  const handleEventNearby = (event) => {
    const { event: nearbyEvent, distance } = event.detail;

    console.log(`📍 Evento cercano detectado: ${nearbyEvent.title} (${distance}m)`);

    const notification = {
      id: `nearby-${nearbyEvent.id}-${Date.now()}`,
      type: 'proximity',
      title: 'Evento cercano',
      message: `Estás cerca de ${nearbyEvent.title}`,
      eventId: nearbyEvent.id,
    };

    setSmartNotifications(prev => [...prev, notification]);
  };

  const handleRetargetingNotification = (event) => {
    const detail = event.detail || {};
    console.log('🎯 Notificación de retargeting recibida:', detail);

    const notification = {
      id: detail.id || `retargeting-${detail.eventId || Date.now()}`,
      type: detail.type || 'retargeting',
      title: detail.title || 'Recordatorio de evento',
      message: detail.body || detail.message || 'Revisa este evento nuevamente',
      eventId: detail.eventId,
      timestamp: detail.timestamp || new Date(),
    };

    setSmartNotifications(prev => [...prev, notification]);
  };





  const loadFavoriteIds = async () => {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('💖 Cargando favoritos...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👤 Usuario:', user ? { id: user.id, email: user.email } : 'NO AUTENTICADO');

      if (!user) {
        console.warn('⚠️ No hay usuario autenticado, no se cargarán favoritos');
        return;
      }

      // Cargar favoritos
      const { data, error } = await supabase
        .from('favorites')
        .select('event_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Error cargando favoritos:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return;
      }

      if (!data || data.length === 0) {
        console.log('ℹ️ No tienes favoritos guardados');
        setFavoriteIds(new Set());
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return;
      }

      console.log(`📊 Total favoritos en BD: ${data.length}`);

      // Verificar qué favoritos corresponden a eventos que existen
      const favoriteEventIds = data.map(fav => fav.event_id);
      
      const { data: existingEvents, error: eventsError } = await supabase
        .from('events')
        .select('id')
        .in('id', favoriteEventIds);

      if (eventsError) {
        console.error('❌ Error verificando eventos:', eventsError);
        // Continuar sin verificar
        const ids = new Set(favoriteEventIds);
        setFavoriteIds(ids);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return;
      }

      const existingEventIds = new Set(existingEvents.map(e => e.id));
      const validFavorites = favoriteEventIds.filter(id => existingEventIds.has(id));
      const orphanedFavorites = favoriteEventIds.filter(id => !existingEventIds.has(id));

      // Si hay favoritos huérfanos, eliminarlos
      if (orphanedFavorites.length > 0) {
        console.warn(`🗑️ Encontrados ${orphanedFavorites.length} favoritos huérfanos (eventos eliminados)`);
        console.warn('   IDs huérfanos:', orphanedFavorites);
        
        const { error: deleteError } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .in('event_id', orphanedFavorites);

        if (deleteError) {
          console.error('❌ Error eliminando favoritos huérfanos:', deleteError);
        } else {
          console.log(`✅ ${orphanedFavorites.length} favoritos huérfanos eliminados`);
        }
      }

      // Establecer solo favoritos válidos
      const ids = new Set(validFavorites);
      console.log('✅ Favoritos válidos cargados:');
      console.log('   Total válidos:', ids.size);
      console.log('   IDs:', Array.from(ids));
      setFavoriteIds(ids);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (error) {
      console.error('❌ Excepción en loadFavoriteIds:', error);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
  };

  // Track favoriteIds changes for debugging
  useEffect(() => {
    console.log('📊 [STATE CHANGE] FavoriteIds actualizado:', {
      count: favoriteIds.size,
      ids: Array.from(favoriteIds),
      timestamp: new Date().toISOString()
    });
  }, [favoriteIds]);

  useEffect(() => {
    if (!allEvents.length) return;

    let filteredEvents = [...allEvents];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filteredEvents = filteredEvents.filter(event =>
        event.title?.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term) ||
        event.location?.toLowerCase().includes(term) ||
        event.event_categories?.name?.toLowerCase().includes(term)
      );
    }

    if (filterCategory !== 'all') {
      filteredEvents = filteredEvents.filter(event =>
        event.event_categories?.name?.toLowerCase() === filterCategory.toLowerCase()
      );
    }

    if (filterRegion !== 'all') {
      filteredEvents = filteredEvents.filter(event => {
        const location = event.location?.toLowerCase() || '';
        return location.includes(filterRegion.toLowerCase());
      });
    }

    switch (sortBy) {
      case 'date':
        filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'category':
        filteredEvents.sort((a, b) =>
          (a.event_categories?.name || '').localeCompare(b.event_categories?.name || '')
        );
        break;
      case 'region':
        filteredEvents.sort((a, b) => (a.location || '').localeCompare(b.location || ''));
        break;
      case 'priority':
      default:
        break;
    }

    setEvents(filteredEvents);
  }, [allEvents, searchTerm, sortBy, filterCategory, filterRegion]);

  const getUniqueCategories = () => {
    const categories = allEvents
      .map(event => event.event_categories?.name)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
    return categories;
  };

  const getUniqueRegions = () => {
    const regions = allEvents
      .map(event => {
        const location = event.location || '';
        if (location.toLowerCase().includes('santiago')) return 'Santiago';
        if (location.toLowerCase().includes('valparaíso') || location.toLowerCase().includes('valparaiso')) return 'Valparaíso';
        if (location.toLowerCase().includes('concepción') || location.toLowerCase().includes('concepcion')) return 'Concepción';
        if (location.toLowerCase().includes('viña') || location.toLowerCase().includes('vina')) return 'Viña del Mar';
        return 'Otra región';
      })
      .filter((value, index, self) => self.indexOf(value) === index);
    return regions;
  };
  const toggleFavorite = async (eventId) => {
    const startTime = new Date().toISOString();
    const operationId = `${eventId}_${Date.now()}`;
    
    // 🔍 DIAGNÓSTICO DETALLADO
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔄 Toggle Favorite (DashboardPage) - INICIO [${operationId}]`);
    console.log('⏰ Timestamp:', startTime);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const isFavorite = favoriteIds.has(eventId);

    console.log('Estado actual:', {
      eventId,
      operationId,
      isFavorite,
      user: user ? { id: user.id, email: user.email } : null,
      favoriteIds: Array.from(favoriteIds),
      favoriteCount: favoriteIds.size,
      action: isFavorite ? 'ELIMINAR' : 'AGREGAR'
    });

    if (!user) {
      console.error('❌ ERROR: Usuario no autenticado');
      alert('Debes iniciar sesión para marcar favoritos');
      return;
    }

    // Track favorito (IA)
    if (user) {
      trackingService.trackFavorite(user.id, eventId, !isFavorite);
    }

    try {
      if (isFavorite) {
        // Quitar de favoritos
        console.log('🗑️ Eliminando de BD...', { user_id: user.id, event_id: eventId });

        const { data, error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', eventId)
          .select();

        if (error) {
          console.error('❌ ERROR al eliminar:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          alert('Error al quitar de favoritos: ' + error.message);
          return;
        }
        
        console.log('✅ ÉXITO - Favorito removido de BD', data);
        // Actualizar estado local después del éxito
        const newFavoriteIds = new Set(favoriteIds);
        newFavoriteIds.delete(eventId);
        setFavoriteIds(newFavoriteIds);
        console.log('✅ Estado local actualizado:', Array.from(newFavoriteIds));
        
      } else {
        // Agregar a favoritos - Verificar primero si existe
        console.log('💾 Insertando en BD...', { user_id: user.id, event_id: eventId });

        // Primero verificar si ya existe
        const { data: existing } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('event_id', eventId)
          .maybeSingle();

        if (existing) {
          console.log('ℹ️ Favorito ya existe en BD');
          // Ya existe, asegurar que esté en el estado local
          const newFavoriteIds = new Set(favoriteIds);
          newFavoriteIds.add(eventId);
          setFavoriteIds(newFavoriteIds);
          return;
        }

        // Si no existe, insertar
        const { data, error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, event_id: eventId })
          .select();

        if (error) {
          console.error('❌ ERROR al agregar:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          alert('Error al agregar a favoritos: ' + error.message);
          return;
        }
        
        console.log('✅ ÉXITO - Favorito agregado a BD', data);
        // Actualizar estado local después del éxito
        const newFavoriteIds = new Set(favoriteIds);
        newFavoriteIds.add(eventId);
        setFavoriteIds(newFavoriteIds);
        console.log('✅ Estado local actualizado:', Array.from(newFavoriteIds));
      }
    } catch (error) {
      console.error('❌ EXCEPCIÓN en toggleFavorite:', error);
      alert('Error inesperado: ' + error.message);
    }

    const endTime = new Date().toISOString();
    const duration = Date.now() - parseInt(operationId.split('_')[1]);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🏁 Toggle Favorite - FIN [${operationId}]`);
    console.log(`⏱️ Duración: ${duration}ms`);
    console.log('⏰ Timestamp final:', endTime);
    console.log('📊 FavoriteIds finales:', Array.from(favoriteIds));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  };

  const getFavoriteEvents = () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 [getFavoriteEvents] Buscando favoritos...');
    console.log('📊 Estado actual:');
    console.log('   - allEvents.length:', allEvents.length);
    console.log('   - favoriteIds.size:', favoriteIds.size);
    console.log('   - favoriteIds:', Array.from(favoriteIds));
    
    // Buscar primero en allEvents (eventos activos)
    const favoriteEvents = allEvents.filter(event => {
      const isFavorite = favoriteIds.has(event.id);
      if (isFavorite) {
        console.log(`   ✅ Evento FAVORITO encontrado: ID=${event.id}, Nombre="${event.title}"`);
      }
      return isFavorite;
    });
    
    console.log('📋 Resultado:');
    console.log('   - Favoritos encontrados:', favoriteEvents.length);
    console.log('   - Event IDs encontrados:', favoriteEvents.map(e => `${e.id} (${e.title})`));
    
    // Verificar si hay favoriteIds que NO se encontraron (eventos archivados o eliminados)
    const foundIds = new Set(favoriteEvents.map(e => e.id));
    const missingIds = Array.from(favoriteIds).filter(id => !foundIds.has(id));
    if (missingIds.length > 0) {
      console.warn('⚠️ Favoritos archivados/eliminados (no mostrados):', missingIds);
      console.warn('   Estos eventos ya no están activos pero siguen en favoritos.');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return favoriteEvents;
  };

  const getEventTimeInfo = (event) => {
    const now = new Date();
    const startDate = event.start_date || new Date(event.date);
    const endDate = event.calculated_end_date;

    if (now < startDate) {
      const timeToStart = startDate.getTime() - now.getTime();
      return {
        status: 'upcoming',
        statusText: 'Próximamente',
        timeInfo: `Comienza en ${formatTimeRemaining(timeToStart)}`,
        statusColor: 'bg-blue-100 text-blue-800',
        urgency: 'normal'
      };
    } else if (now >= startDate && now < endDate) {
      // Evento en progreso
      const timeToEnd = endDate.getTime() - now.getTime();
      const isUrgent = timeToEnd < 2 * 60 * 60 * 1000; // Menos de 2 horas
      return {
        status: 'ongoing',
        statusText: '🔴 En Vivo',
        timeInfo: `Termina en ${formatTimeRemaining(timeToEnd)}`,
        statusColor: isUrgent ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800',
        urgency: isUrgent ? 'urgent' : 'normal'
      };
    } else {
      // Evento terminado
      return {
        status: 'ended',
        statusText: 'Finalizado',
        timeInfo: 'Evento terminado',
        statusColor: 'bg-gray-100 text-gray-600',
        urgency: 'ended'
      };
    }
  };

  // Formatear tiempo restante
  const formatTimeRemaining = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  // Componente de temporizador en tiempo real
  const EventTimer = ({ event }) => {
    const [timeInfo, setTimeInfo] = useState(getEventTimeInfo(event));

    useEffect(() => {
      const interval = setInterval(() => {
        setTimeInfo(getEventTimeInfo(event));
      }, 1000); // Actualizar cada segundo

      return () => clearInterval(interval);
    }, [event]);

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${timeInfo.statusColor}`}
          >
            {timeInfo.statusText}
          </span>
          {timeInfo.urgency === 'urgent' && (
            <span className="text-xs animate-pulse">⚠️ ¡Termina pronto!</span>
          )}
        </div>
        <div className={`text-sm font-medium ${timeInfo.urgency === 'urgent' ? 'text-red-600 animate-pulse' :
          timeInfo.urgency === 'ended' ? 'text-gray-500' : 'text-purple-600'
          }`}>
          ⏰ {timeInfo.timeInfo}
        </div>
      </div>
    );
  };

  // Tabs - Ahora usan el hook useUserRole
  const tabs = [
    { id: 'mapa', label: 'Mapa', icon: MapPin },
    { id: 'recomendados', label: 'Para Ti', icon: Sparkles, special: true },
    { id: 'eventos', label: 'Eventos', icon: Calendar },
    { id: 'pricing', label: 'Suscripción de Eventos', icon: DollarSign, special: true },
    ...((isAdmin || isPremium) ? [{ id: 'crear', label: isAdmin ? 'Crear' : 'Inscribe tu Evento', icon: Plus, special: true }] : []),
    { id: 'favoritos', label: 'Favoritos', icon: Heart },
    { id: 'perfil', label: 'Perfil', icon: User },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleEventCreated = (newEvent) => {
    console.log('✅ Nuevo evento creado:', newEvent);
    setRefreshTrigger(prev => prev + 1);
  };

  // Renderizar botón de favorito simple
  const renderFavoriteButton = (eventId) => {
    const isFavorite = favoriteIds.has(eventId);
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log(`[EventCard] Click en favorito - Event ID: ${eventId}, isFavorite: ${isFavorite}`);
          toggleFavorite(eventId);
        }}
        className={`p-2 rounded-full transition-all duration-200 transform hover:scale-110 ${isFavorite
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-red-400'
          } shadow-sm hover:shadow-md`}
        title={isFavorite ? 'Quitar de favoritos ❤️' : 'Agregar a favoritos 🤍'}
      >
        <Heart
          className={`w-5 h-5 transition-all duration-200 ${isFavorite ? 'fill-current text-red-600' : 'text-gray-400'
            }`}
        />
      </button>
    );
  };

  // Renderizar lista de eventos
  const renderEventCard = (event, showFavoriteButton = true) => (
    <div
      key={event.id}
      className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all cursor-pointer"
      onClick={() => {
        // Track click en evento
        if (user) {
          trackingService.trackEventClick(user.id, event.id);
          // Activar retargeting
          retargetingService.trackEventView(user.id, event.id, event);
        }
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-start gap-2 mb-2 flex-wrap">
            {/* Badges de promoción */}
            <CombinedEventBadges
              promotionTier={event.promotion_tier}
              favoritesCount={event.analytics_favorites || 0}
              isLive={event.live_status === 'live'}
              createdAt={event.created_at}
              isNew={event.isNew}
              isAlmostFull={event.isAlmostFull}
              capacity={event.capacity}
              attendeesCount={event.attendees_count || 0}
              maxBadges={3}
            />

            {event.event_categories && (
              <span
                className="text-xs px-2 py-1 rounded-full text-white font-medium"
                style={{ backgroundColor: event.event_categories.color }}
              >
                {event.event_categories.icon} {event.event_categories.name}
              </span>
            )}

            {/* Badge de estado del evento (En vivo, Finalizado) */}
            <EventStatusBadge event={event} />
          </div>
          <h3 className="font-bold text-lg text-gray-800 mb-2">
            {event.title}
          </h3>

          {/* Temporizador del evento */}
          <EventTimer event={event} />

          <p className="text-purple-600 font-medium text-sm mb-1 mt-2">
            📅 {new Date(event.date).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })} a las {new Date(event.date).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          <p className="text-gray-600 text-sm mb-1">
            📍 {event.location}
          </p>
          {event.price > 0 && (
            <p className="text-green-600 font-semibold text-sm mb-1">
              💰 ${event.price}
            </p>
          )}
          <p className="text-gray-600 text-sm">
            {event.description}
          </p>
        </div>
        {showFavoriteButton && renderFavoriteButton(event.id)}
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-white text-lg">Cargando...</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'mapa':
        return isMobile ? (
          // Versión móvil: mapa expandido hasta el borde inferior
          <div className="absolute inset-0">
            <MobileMapView
              key={refreshTrigger}
              favoriteIds={favoriteIds}
              onFavoriteToggle={toggleFavorite}
            />
          </div>
        ) : (
          // Versión desktop: con centrado y estilo
          <div className="h-full w-full flex items-center justify-center relative">
            <div className="h-[90vh] w-[95vw] rounded-3xl overflow-hidden shadow-2xl border-2 border-purple-500">
              <MapView
                key={refreshTrigger}
                favoriteIds={favoriteIds}
                onFavoriteToggle={toggleFavorite}
              />
            </div>
          </div>
        );

      case 'recomendados':
      case 'parati':
      case 'para-ti':
        return (
          <div className="h-full overflow-y-auto">
            <div className="p-6 bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 min-h-full">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                  <Sparkles className="h-8 w-8 text-yellow-400" />
                  Para Ti
                </h2>
                <p className="text-white/80 mb-8">
                  Eventos recomendados basados en tus gustos y preferencias
                </p>
                <RecommendedEvents
                  allEvents={allEvents}
                  onEventClick={(eventId) => {
                    if (user) {
                      trackingService.trackEventClick(user.id, eventId);
                    }
                  }}
                  renderEventCard={(event, showFavoriteButton) => renderEventCard(event, showFavoriteButton)}
                  limit={12}
                />
              </div>
            </div>
          </div>
        );

      case 'eventos':
        return (
          <div className="h-full overflow-y-auto">
            <div className="p-6 bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    🎉 Eventos ({events.length}/{allEvents.length})
                  </h2>

                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm"
                  >
                    <Filter className="w-4 h-4" />
                    {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                  </button>
                </div>

                {/* Buscador Principal */}
                <div className="relative mb-6">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Search className="h-5 w-5 text-gray-600" />
                  </div>
                  <input
                    type="text"
                    placeholder="¿Qué evento quieres buscar en el Radar? 🎯"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white backdrop-blur-sm text-gray-900 placeholder-gray-500 shadow-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>

                {/* Panel de Filtros */}
                {showFilters && (
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/50 shadow-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                      {/* Ordenar por */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <SortAsc className="w-4 h-4 inline mr-1" />
                          Ordenar por
                        </label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                        >
                          <option value="priority">⏰ Prioridad (Terminan pronto)</option>
                          <option value="date">📅 Fecha de inicio</option>
                          <option value="category">🏷️ Categoría</option>
                          <option value="region">📍 Región</option>
                        </select>
                      </div>

                      {/* Filtrar por Categoría */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          🏷️ Categoría
                        </label>
                        <select
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                        >
                          <option value="all">Todas las categorías</option>
                          {getUniqueCategories().map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>

                      {/* Filtrar por Región */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          📍 Región
                        </label>
                        <select
                          value={filterRegion}
                          onChange={(e) => setFilterRegion(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                        >
                          <option value="all">Todas las regiones</option>
                          {getUniqueRegions().map(region => (
                            <option key={region} value={region}>{region}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Botón para limpiar filtros */}
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setSortBy('priority');
                          setFilterCategory('all');
                          setFilterRegion('all');
                        }}
                        className="px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        🗑️ Limpiar todos los filtros
                      </button>
                    </div>
                  </div>
                )}

                {/* Información de filtros activos */}
                {(searchTerm || filterCategory !== 'all' || filterRegion !== 'all' || sortBy !== 'priority') && (
                  <div className="mb-4 p-3 bg-white/10 rounded-lg border-l-4 border-yellow-400 backdrop-blur-sm">
                    <p className="text-sm text-white">
                      🔍 Filtros activos:
                      {searchTerm && ` Búsqueda: "${searchTerm}"`}
                      {filterCategory !== 'all' && ` • Categoría: ${filterCategory}`}
                      {filterRegion !== 'all' && ` • Región: ${filterRegion}`}
                      {sortBy !== 'priority' && ` • Orden: ${sortBy}`}
                    </p>
                  </div>
                )}

                {events.length === 0 ? (
                  <div className="text-center py-12">
                    {allEvents.length === 0 ? (
                      <>
                        <Calendar className="w-16 h-16 text-white/40 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">
                          No hay eventos disponibles
                        </h3>
                        <p className="text-white/70 mb-6">
                          Crea tu primer evento o explora eventos existentes
                        </p>
                        <button
                          onClick={() => setActiveTab('mapa')}
                          className="bg-white/20 text-white px-6 py-3 rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm"
                        >
                          Explorar en Mapa
                        </button>
                      </>
                    ) : (
                      <>
                        <Search className="w-16 h-16 text-white/40 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">
                          No se encontraron eventos
                        </h3>
                        <p className="text-white/70 mb-6">
                          Intenta cambiar los filtros o términos de búsqueda
                        </p>
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setSortBy('priority');
                            setFilterCategory('all');
                            setFilterRegion('all');
                          }}
                          className="bg-white/20 text-white px-6 py-3 rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm"
                        >
                          🗑️ Limpiar Filtros
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {events.map((event) => renderEventCard(event, true))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'favoritos':
        const favoriteEvents = getFavoriteEvents();
        return (
          <div className="h-full overflow-y-auto">
            <div className="p-6 bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                  ❤️ Mis Favoritos ({favoriteEvents.length})
                </h2>

                <p className="text-sm text-white/70 mb-4">
                  📊 Favoritos activos: {favoriteIds.size} | Eventos encontrados: {favoriteEvents.length}
                </p>

                {favoriteEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-white/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No tienes favoritos aún
                    </h3>
                    <p className="text-white/70 mb-6">
                      Marca eventos como favoritos para verlos aquí
                    </p>
                    <button
                      onClick={() => setActiveTab('eventos')}
                      className="bg-white/20 text-white px-6 py-3 rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm"
                    >
                      Ver Todos los Eventos
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {favoriteEvents.map((event) => renderEventCard(event, true))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'pricing':
      case 'suscripcion':
      case 'suscripciones':
        return (
          <div className="h-full overflow-y-auto">
            <PricingPage />
          </div>
        );

      case 'crear':
        return (
          <div className="h-full overflow-y-auto">
            <div className="p-6 bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                  ✨ Crear Evento
                </h2>
                <AdminEventForm onEventCreated={handleEventCreated} alwaysOpen={true} />
              </div>
            </div>
          </div>
        );

      case 'perfil':
        return (
          <div className="h-full overflow-y-auto">
            <ProfilePage />
          </div>
        );

      default:
        // En móvil, el mapa ocupa toda la pantalla sin padding
        if (isMobile) {
          return <MobileMapView />;
        }
        // En desktop, mantener el padding y estilo
        return (
          <div className="h-full bg-gradient-to-br from-purple-100/20 to-pink-100/20 p-4">
            <div className="h-full rounded-xl overflow-hidden shadow-lg">
              <MapView />
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`h-screen flex flex-col ${
      isMobile && activeTab === 'mapa' 
        ? 'bg-black' 
        : 'bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600'
    }`}>
      {/* Header (hidden on small screens when 'mapa' tab is active) */}
      <header className={`${activeTab === 'mapa' ? 'hidden md:block' : ''} bg-white/10 backdrop-blur-md border-b border-white/20 px-4 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <EventRadarLogo size={48} showText={true} variant="white" />
          </div>

          <div className="flex items-center gap-4">
            {/* Botón del Asistente de Eventos */}
            <button
              onClick={() => setShowAIChat(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              title="Asistente de Eventos con IA"
            >
              <Bot className="h-5 w-5" />
              <span className="text-sm font-medium">¡Te Ayudamos!</span>
            </button>

            <div
              className="hidden md:flex items-center gap-3 bg-white/10 rounded-full px-4 py-2 cursor-pointer hover:bg-white/20 transition-colors"
              onClick={() => setActiveTab('perfil')}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-white">
                <div className="text-sm font-medium">
                  {profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'Usuario'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 hover:bg-white/10 rounded-lg md:hidden text-white"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="hidden md:flex flex-col w-64 bg-white/10 backdrop-blur-md border-r border-white/20">
          <div className="p-4">
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      // Restaurar comportamiento: activar pestaña en dashboard
                      setActiveTab(tab.id);
                    }}
                    className={`w-full flex items-center ${tab.iconOnly ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl text-left transition-all ${activeTab === tab.id
                      ? 'bg-white/20 text-white border border-white/30 shadow-lg'
                      : 'hover:bg-white/10 text-white/80 hover:text-white'
                      }`}
                    title={tab.iconOnly ? tab.label : undefined}
                  >
                    <Icon className={`h-5 w-5 ${tab.iconOnly ? 'text-yellow-300' : ''}`} />
                    {!tab.iconOnly && tab.label}
                    {tab.id === 'favoritos' && !tab.iconOnly && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {getFavoriteEvents().length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        {menuOpen && (
          <nav className="md:hidden absolute top-16 left-0 right-0 bg-white/10 backdrop-blur-md border-b border-white/20 shadow-lg z-10">
            <div className="p-4">
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;

                  // Si es el tab de perfil, redirigir a ProfilePage
                  if (tab.id === 'perfil') {
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          navigate('/profile');
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:bg-white/10 text-white/80"
                      >
                        <Icon className="h-5 w-5" />
                        {tab.label}
                      </button>
                    );
                  }

                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTab === tab.id
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'hover:bg-white/10 text-white/80'
                        }`}
                    >
                      <Icon className="h-5 w-5" />
                      {tab.label}
                      {tab.id === 'favoritos' && (
                        <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          {getFavoriteEvents().length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
        )}

        {/* Main Content */}
        <main className={`flex-1 overflow-hidden md:pb-0 ${isMobile && activeTab === 'mapa' ? 'absolute inset-0' : ''}`}>
          {renderContent()}
        </main>
      </div>

      {/* Bottom Navigation Bar para móvil - Scrolleable Horizontal */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl z-50 shadow-2xl pb-safe">
        {/* Indicador de scroll - Completamente oculto */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-transparent"></div>
        
        {/* Contenedor scrolleable */}
        <div className="overflow-x-auto overflow-y-hidden scrollbar-hide px-2 py-2">
          <div className="flex items-center gap-2 min-w-max">
            
            {/* Botón Mapa */}
            <button
              onClick={() => setActiveTab('mapa')}
              className={`flex flex-col items-center gap-1 px-5 py-2.5 rounded-2xl transition-all flex-shrink-0 ${
                activeTab === 'mapa' 
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50 scale-105' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <MapPin className="h-5 w-5" />
              <span className="text-xs font-semibold whitespace-nowrap">Mapa</span>
            </button>

            {/* Botón Para Ti (Recomendaciones) */}
            <button
              onClick={() => setActiveTab('para-ti')}
              className={`flex flex-col items-center gap-1 px-5 py-2.5 rounded-2xl transition-all flex-shrink-0 ${
                activeTab === 'para-ti' 
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50 scale-105' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Sparkles className="h-5 w-5" />
              <span className="text-xs font-semibold whitespace-nowrap">Para Ti</span>
            </button>

            {/* Botón Eventos */}
            <button
              onClick={() => setActiveTab('eventos')}
              className={`flex flex-col items-center gap-1 px-5 py-2.5 rounded-2xl transition-all flex-shrink-0 ${
                activeTab === 'eventos' 
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50 scale-105' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span className="text-xs font-semibold whitespace-nowrap">Eventos</span>
            </button>

            {/* Botón Suscripciones */}
            <button
              onClick={() => setActiveTab('suscripciones')}
              className={`flex flex-col items-center gap-1 px-5 py-2.5 rounded-2xl transition-all flex-shrink-0 ${
                activeTab === 'suscripciones' 
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50 scale-105' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Search className="h-5 w-5" />
              <span className="text-xs font-semibold whitespace-nowrap">Suscripciones</span>
            </button>

            {/* Botón Favoritos */}
            <button
              onClick={() => setActiveTab('favoritos')}
              className={`relative flex flex-col items-center gap-1 px-5 py-2.5 rounded-2xl transition-all flex-shrink-0 ${
                activeTab === 'favoritos' 
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50 scale-105' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Heart className="h-5 w-5" />
              <span className="text-xs font-semibold whitespace-nowrap">Favoritos</span>
              {getFavoriteEvents().length > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-pink-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold min-w-[20px] text-center shadow-lg">
                  {getFavoriteEvents().length}
                </span>
              )}
            </button>

            {/* Botón Crear Evento (Solo Admin o Premium) */}
            {(isAdmin || isPremium) && (
              <button
                onClick={() => setActiveTab('crear')}
                className={`flex flex-col items-center gap-1 px-5 py-2.5 rounded-2xl transition-all flex-shrink-0 ${
                  activeTab === 'crear' 
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/50 scale-105' 
                    : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 border border-amber-500/30'
                }`}
              >
                <Plus className="h-5 w-5" />
                <span className="text-xs font-semibold whitespace-nowrap">Crear</span>
              </button>
            )}

            {/* Botón Perfil */}
            <button
              onClick={() => setActiveTab('perfil')}
              className={`flex flex-col items-center gap-1 px-5 py-2.5 rounded-2xl transition-all flex-shrink-0 ${
                activeTab === 'perfil' 
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50 scale-105' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <User className="h-5 w-5" />
              <span className="text-xs font-semibold whitespace-nowrap">Perfil</span>
            </button>

            {/* Botón Chatbot */}
            <button
              onClick={() => setShowChatbot(true)}
              className="flex flex-col items-center gap-1 px-5 py-2.5 rounded-2xl transition-all flex-shrink-0 bg-gradient-to-br from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-xs font-semibold whitespace-nowrap">Ayuda</span>
            </button>

          </div>
        </div>
        
        {/* Gradientes laterales para indicar scroll */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/90 to-transparent pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/90 to-transparent pointer-events-none"></div>
        
        {/* Estilos para ocultar scrollbar */}
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </nav>

      {/* Manager de notificaciones inteligentes */}
      <SmartNotificationManager allEvents={allEvents} />

      {/* Notificaciones de geofencing y retargeting */}
      {smartNotifications.map(notification => (
        <SmartNotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => {
            setSmartNotifications(prev => prev.filter(n => n.id !== notification.id));
          }}
        />
      ))}

      {/* Chatbot con IA - Google Gemini */}
      <AIAssistant
        events={allEvents}
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        userPreferences={{
          categories: profile?.preferred_categories || [],
          location: profile?.city || '',
          budget: profile?.budget || 'flexible'
        }}
      />

    </div>
  );
};

export default DashboardPage;