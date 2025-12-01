import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Heart, Navigation, Edit2, SlidersHorizontal, X, MapPin, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../hooks/useUserRole';
import { supabase } from '../lib/supabase';
import EditEventModal from './EditEventModal';
import 'leaflet/dist/leaflet.css';

// --- 1. CONFIGURACIÓN DE ÍCONOS (Más grandes para escritorio) ---
const createCustomIcon = (color, emoji) => {
  return L.divIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, ${color}, ${color}dd);
        width: 48px; height: 48px; border-radius: 50%;
        border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        display: flex; align-items: center; justify-content: center; font-size: 24px;
      ">
        ${emoji}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -48]
  });
};

const eventCategories = {
  'anime': { color: '#9333ea', emoji: '🎌', name: 'Anime' }, // ✅ CORREGIDO: Anime
  'musica': { color: '#ec4899', emoji: '🎵', name: 'Música' },
  'gastronomia': { color: '#f59e0b', emoji: '🍕', name: 'Gastronomía' },
  'deportes': { color: '#10b981', emoji: '⚽', name: 'Deportes' },
  'arte': { color: '#8b5cf6', emoji: '🎨', name: 'Arte' },
  'tecnologia': { color: '#06b6d4', emoji: '💻', name: 'Tecnología' },
  'fiestas': { color: '#ec4899', emoji: '🎉', name: 'Fiestas' },
  'conciertos': { color: '#8b5cf6', emoji: '🎤', name: 'Conciertos' },
  'comedia': { color: '#f59e0b', emoji: '😂', name: 'Comedia' },
  'festivales': { color: '#10b981', emoji: '🎪', name: 'Festivales' },
  'otros': { color: '#6b7280', emoji: '📍', name: 'Otros' }
};

// --- 2. MODAL DE NAVEGACIÓN ---
const NavigationModal = ({ isOpen, onClose, eventData }) => {
  if (!isOpen || !eventData) return null;

  const handleNavigation = (app) => {
    const { lat, lng } = eventData.latLng;
    let url = '';
    switch (app) {
      case 'waze': url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`; break;
      case 'google': url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`; break;
      case 'uber': url = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}`; break;
      default: return;
    }
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Ir al evento</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X size={20}/></button>
        </div>
        <div className="p-6 space-y-3">
          <button onClick={() => handleNavigation('waze')} className="w-full flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-left group">
            <span className="text-2xl group-hover:scale-110 transition-transform">🚗</span>
            <div><div className="font-bold text-gray-900">Waze</div><div className="text-xs text-gray-500">Mejor para tráfico</div></div>
          </button>
          <button onClick={() => handleNavigation('google')} className="w-full flex items-center gap-4 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors text-left group">
            <span className="text-2xl group-hover:scale-110 transition-transform">🗺️</span>
            <div><div className="font-bold text-gray-900">Google Maps</div><div className="text-xs text-gray-500">Rutas y transporte</div></div>
          </button>
          <button onClick={() => handleNavigation('uber')} className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left group">
            <span className="text-2xl group-hover:scale-110 transition-transform">🚖</span>
            <div><div className="font-bold text-gray-900">Uber</div><div className="text-xs text-gray-500">Pedir viaje</div></div>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 3. COMPONENTE WEB (ESCRITORIO) ---
const MapView = ({ favoriteIds = new Set(), onFavoriteToggle = () => { } }) => {
  const { user } = useAuth();
  const { role } = useUserRole() || { role: 'user' };
  const isAdmin = role === 'admin';

  // Estados
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPosition, setUserPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState([-33.0194, -71.5519]);
  
  // UI States
  const [isFilterMinimized, setIsFilterMinimized] = useState(false); // Abierto por defecto en escritorio
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modales
  const [navigationModal, setNavigationModal] = useState({ isOpen: false, eventData: null });
  const [editModal, setEditModal] = useState({ isOpen: false, event: null });

  // Carga de Datos
  const loadEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filtrar solo eventos activos (no archivados)
      const now = new Date();
      const activeEvents = (data || []).filter(event => {
        // Calcular fecha de fin
        const startDate = event.start_date ? new Date(event.start_date) : new Date(event.date);
        const endDate = event.end_date ? new Date(event.end_date) : new Date(startDate.getTime() + 3 * 60 * 60 * 1000);
        
        // Solo mostrar eventos que no han terminado
        return endDate > now;
      });
      
      console.log(`📍 [MapView] Eventos cargados: ${data?.length || 0} total, ${activeEvents.length} activos`);
      setEvents(activeEvents);
    } catch (error) {
      console.error('Error cargando eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadEvents();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserPosition([latitude, longitude]);
          // Centrar mapa al inicio
          setMapCenter([latitude, longitude]);
        },
        (err) => console.warn(err)
      );
    }

    const subscription = supabase
      .channel('events-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, loadEvents)
      .subscribe();

    return () => subscription.unsubscribe();
  }, [user]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const cat = event.event_categories?.name?.toLowerCase() || event.category;
      return selectedCategory === 'all' || cat === selectedCategory;
    });
  }, [events, selectedCategory]);

  const handleEventUpdated = () => {
    loadEvents();
    setEditModal({ isOpen: false, event: null });
  };

  if (loading && events.length === 0) {
    return <div className="h-full w-full flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;
  }

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner bg-gray-100"> 
      
      {/* --- PANEL DE FILTROS FLOTANTE (ESTILO DE ESCRITORIO) --- */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col items-start gap-2 pointer-events-none">
         <button
            onClick={() => setIsFilterMinimized(!isFilterMinimized)}
            className="pointer-events-auto bg-white text-gray-800 rounded-full px-5 py-3 shadow-lg flex items-center gap-3 hover:bg-gray-50 transition-all border border-gray-200"
          >
            <SlidersHorizontal className="w-5 h-5 text-purple-600" /> 
            <span className="font-bold text-sm">Filtros</span>
          </button>

          {!isFilterMinimized && (
             <div className="pointer-events-auto mt-2 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl w-64 border border-gray-100 animate-in slide-in-from-left-5">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                   <span className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Categorías ({filteredEvents.length})</span>
                   <button onClick={() => setIsFilterMinimized(true)} className="text-gray-400 hover:text-red-500"><X size={16}/></button>
                </div>
                <div className="space-y-1 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                  <button onClick={() => setSelectedCategory('all')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === 'all' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
                    🌟 Ver Todos
                  </button>
                  {Object.entries(eventCategories).map(([key, cat]) => (
                    <button key={key} onClick={() => setSelectedCategory(key)} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between items-center transition-all ${selectedCategory === key ? 'bg-gray-800 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
                      <span className="flex items-center gap-2 text-lg"><span>{cat.emoji}</span> <span className="text-sm font-medium">{cat.name}</span></span>
                    </button>
                  ))}
                </div>
             </div>
          )}
      </div>

      {/* --- MAPA GRANDE --- */}
      <MapContainer 
        center={mapCenter} 
        zoom={13} 
        zoomControl={false} // Quitamos el zoom por defecto para ponerlo donde queramos si hace falta
        style={{ height: '100%', width: '100%', zIndex: 0 }} 
      >
        <TileLayer attribution='© OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* Marcador Usuario */}
        {userPosition && (
          <Marker position={userPosition} icon={L.divIcon({
            html: `<div style="background: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.4); animation: pulse 2s infinite;"></div>`,
            className: 'user-marker', iconSize: [24, 24]
          })}>
            <Popup>¡Estás aquí!</Popup>
          </Marker>
        )}

        {/* Marcadores Eventos */}
        {filteredEvents.map((evento) => {
          const catKey = evento.event_categories?.name?.toLowerCase() || evento.category;
          const category = eventCategories[catKey] || eventCategories.otros;
          const icon = createCustomIcon(category.color, category.emoji);
          const isFavorite = favoriteIds.has(evento.id);

          return (
            <Marker key={evento.id} position={[evento.latitude || -33.0194, evento.longitude || -71.5519]} icon={icon}>
              <Popup className="desktop-popup" minWidth={300}>
                <div className="rounded-xl overflow-hidden font-sans">
                  {/* Imagen o Header de color */}
                  <div className="h-16 flex items-center justify-center relative" style={{ backgroundColor: category.color }}>
                     <div className="text-4xl drop-shadow-md">{category.emoji}</div>
                     <span className="absolute bottom-2 right-2 text-[10px] bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-full font-bold uppercase">{category.name}</span>
                  </div>
                  
                  {/* Contenido */}
                  <div className="p-4 bg-white">
                    <h3 className="font-bold text-lg text-gray-900 leading-tight mb-2">{evento.title}</h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} className="text-purple-500"/>
                        <span>{new Date(evento.date).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={14} className="text-purple-500"/>
                        <span>{evento.time || 'Hora por definir'}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <MapPin size={14} className="text-purple-500 mt-0.5"/>
                        <span className="line-clamp-2">{evento.location || 'Ubicación pendiente'}</span>
                      </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex gap-2">
                        <button 
                            onClick={(e) => { e.preventDefault(); setNavigationModal({isOpen:true, eventData: {title: evento.title, latLng: {lat: evento.latitude, lng: evento.longitude}}}); }} 
                            className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-lg shadow-gray-200"
                        >
                            <Navigation size={14}/> Cómo llegar
                        </button>
                        
                        <button 
                            onClick={(e) => { 
                              e.preventDefault(); 
                              console.log(`[MapView] ❤️ Click en favorito - Event ID: ${evento.id}, Nombre: ${evento.nombre}`);
                              onFavoriteToggle(evento.id); 
                            }} 
                            className={`p-2 rounded-lg border transition-all ${isFavorite ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                            title="Guardar en favoritos"
                        >
                            <Heart size={20} fill={isFavorite ? "currentColor" : "none"}/>
                        </button>

                        {isAdmin && (
                            <button onClick={(e) => { e.preventDefault(); setEditModal({isOpen:true, event:evento}); }} className="p-2 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-100">
                                <Edit2 size={20}/>
                            </button>
                        )}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* --- MODALES --- */}
      <NavigationModal isOpen={navigationModal.isOpen} onClose={() => setNavigationModal({ isOpen: false, eventData: null })} eventData={navigationModal.eventData} />
      
      {editModal.isOpen && (
        <EditEventModal 
          isOpen={editModal.isOpen} 
          onClose={() => setEditModal({ isOpen: false, event: null })} 
          event={editModal.event} 
          onEventUpdated={handleEventUpdated}
        />
      )}
    </div>
  );
};

export default MapView;