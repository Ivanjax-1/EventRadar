import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Heart, Navigation, Edit2, SlidersHorizontal, X, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../hooks/useUserRole';
import { supabase } from '../lib/supabase';
import EditEventModal from './EditEventModal';
import 'leaflet/dist/leaflet.css';

// --- 1. CONFIGURACIÓN DE ÍCONOS ---
const createCustomIcon = (color, emoji) => {
  return L.divIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, ${color}, ${color}dd);
        width: 42px; height: 42px; border-radius: 50%;
        border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        display: flex; align-items: center; justify-content: center; font-size: 20px;
      ">
        ${emoji}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -21]
  });
};

const eventCategories = {
  'anime': { color: '#7c3aed', emoji: '🎌', name: 'Anime' }, // Violeta más fuerte
  'musica': { color: '#db2777', emoji: '🎵', name: 'Música' }, // Rosa fuerte
  'gastronomia': { color: '#d97706', emoji: '🍕', name: 'Comida' }, // Ambar oscuro
  'deportes': { color: '#059669', emoji: '⚽', name: 'Deportes' }, // Esmeralda
  'arte': { color: '#7c3aed', emoji: '🎨', name: 'Arte' },
  'tecnologia': { color: '#0891b2', emoji: '💻', name: 'Tech' },
  'fiestas': { color: '#e11d48', emoji: '🎉', name: 'Fiestas' },
  'conciertos': { color: '#9333ea', emoji: '🎤', name: 'Concierto' },
  'otros': { color: '#4b5563', emoji: '📍', name: 'Otros' }
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-end justify-center animate-in fade-in duration-200">
      <div className="bg-zinc-900 border-t border-zinc-800 rounded-t-3xl w-full max-w-md mx-auto animate-in slide-in-from-bottom duration-300">
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white">Ir al evento</h3>
            <p className="text-zinc-400 text-sm mt-1 line-clamp-1">{eventData.title}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-zinc-800 text-white rounded-full hover:bg-zinc-700">
            <X size={20}/>
          </button>
        </div>
        <div className="p-6 space-y-3">
          <button onClick={() => handleNavigation('waze')} className="w-full flex items-center justify-between p-4 bg-zinc-800/50 border border-zinc-700 rounded-2xl active:bg-zinc-700 transition-colors">
            <div className="flex items-center gap-4"><span className="text-2xl">🚗</span><span className="font-semibold text-white">Waze</span></div>
            <ChevronRight className="text-zinc-500" size={20} />
          </button>
          <button onClick={() => handleNavigation('google')} className="w-full flex items-center justify-between p-4 bg-zinc-800/50 border border-zinc-700 rounded-2xl active:bg-zinc-700 transition-colors">
            <div className="flex items-center gap-4"><span className="text-2xl">🗺️</span><span className="font-semibold text-white">Google Maps</span></div>
            <ChevronRight className="text-zinc-500" size={20} />
          </button>
          <button onClick={() => handleNavigation('uber')} className="w-full flex items-center justify-between p-4 bg-zinc-800/50 border border-zinc-700 rounded-2xl active:bg-zinc-700 transition-colors">
            <div className="flex items-center gap-4"><span className="text-2xl">🚖</span><span className="font-semibold text-white">Uber</span></div>
            <ChevronRight className="text-zinc-500" size={20} />
          </button>
        </div>
        <div className="p-6 pt-0"><button onClick={onClose} className="w-full p-4 text-zinc-400 font-medium active:text-white">Cancelar</button></div>
      </div>
    </div>
  );
};

// --- 3. MOBILE MAP VIEW ---
const MobileMapView = ({ favoriteIds = new Set(), onFavoriteToggle = () => { } }) => {
  const { user } = useAuth();
  const { role } = useUserRole() || { role: 'user' };
  const isAdmin = role === 'admin';

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPosition, setUserPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState([-33.0194, -71.5519]);
  
  // UI States
  const [isFilterMinimized, setIsFilterMinimized] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modales
  const [navigationModal, setNavigationModal] = useState({ isOpen: false, eventData: null });
  const [editModal, setEditModal] = useState({ isOpen: false, event: null });

  const loadEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      // Filtrar solo eventos activos (no archivados)
      const now = new Date();
      const activeEvents = (data || []).filter(event => {
        const startDate = event.start_date ? new Date(event.start_date) : new Date(event.date);
        const endDate = event.end_date ? new Date(event.end_date) : new Date(startDate.getTime() + 3 * 60 * 60 * 1000);
        return endDate > now;
      });
      
      console.log(`📱 [MobileMapView] Eventos cargados: ${data?.length || 0} total, ${activeEvents.length} activos`);
      setEvents(activeEvents);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user) return;
    loadEvents();
    let watchId;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserPosition([pos.coords.latitude, pos.coords.longitude]); setMapCenter([pos.coords.latitude, pos.coords.longitude]); },
        (err) => console.warn(err)
      );
      watchId = navigator.geolocation.watchPosition((pos) => setUserPosition([pos.coords.latitude, pos.coords.longitude]));
    }
    const sub = supabase.channel('events-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, loadEvents).subscribe();
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); sub.unsubscribe(); };
  }, [user]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => selectedCategory === 'all' || event.category === selectedCategory);
  }, [events, selectedCategory]);

  const handleEventUpdated = () => { loadEvents(); setEditModal({ isOpen: false, event: null }); };

  if (loading && events.length === 0) return <div className="h-full w-full flex items-center justify-center bg-transparent"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div></div>;

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden"> 
      
      {/* --- UI FLOTANTE: MENÚ ESTILO DARK GLASS --- */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col items-start gap-2 pointer-events-none">
         {/* Botón Principal - Negro con borde sutil */}
         <button
            onClick={() => setIsFilterMinimized(!isFilterMinimized)}
            className="pointer-events-auto bg-zinc-900/90 backdrop-blur-md text-white border border-zinc-700/50 rounded-full px-4 py-2.5 shadow-xl flex items-center gap-2 active:scale-95 transition-all"
          >
            <SlidersHorizontal className="w-4 h-4 text-purple-400" /> 
            <span className="font-semibold text-sm">Filtros</span>
          </button>

          {/* Panel Desplegable - Estilo Lista Oscura */}
          {!isFilterMinimized && (
             <div className="pointer-events-auto mt-2 bg-zinc-900/95 backdrop-blur-xl rounded-2xl p-2 shadow-2xl w-56 border border-zinc-700/50 animate-in slide-in-from-left-5">
                <div className="flex justify-between items-center mb-1 px-2 py-1 border-b border-zinc-800">
                   <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Categorías ({filteredEvents.length})</span>
                   <button onClick={() => setIsFilterMinimized(true)} className="text-zinc-400 hover:text-white"><X size={14}/></button>
                </div>
                <div className="space-y-0.5 max-h-[50vh] overflow-y-auto custom-scrollbar">
                  <button onClick={() => setSelectedCategory('all')} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2 ${selectedCategory === 'all' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'}`}>
                    <span>🌟</span> Todos
                  </button>
                  {Object.entries(eventCategories).map(([key, cat]) => (
                    <button key={key} onClick={() => setSelectedCategory(key)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex justify-between items-center transition-all ${selectedCategory === key ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'}`}>
                      <span className="flex items-center gap-2"><span>{cat.emoji}</span> {cat.name}</span>
                    </button>
                  ))}
                </div>
             </div>
          )}
      </div>

      {/* --- MAPA --- */}
      <MapContainer 
        center={mapCenter} 
        zoom={14} 
        zoomControl={false} 
        style={{ height: '100%', width: '100%', zIndex: 0 }} 
      >
        <TileLayer attribution='© OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* Marcador Usuario */}
        {userPosition && (
          <Marker position={userPosition} icon={L.divIcon({
            html: `<div style="background: #3b82f6; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.4); animation: pulse 2s infinite;"></div>`,
            className: 'user-marker', iconSize: [18, 18]
          })} />
        )}

        {/* Marcadores Eventos */}
        {filteredEvents.map((evento) => {
          const category = eventCategories[evento.category] || eventCategories.otros;
          const icon = createCustomIcon(category.color, category.emoji);
          const isFavorite = favoriteIds.has(evento.id);

          return (
            <Marker key={evento.id} position={[evento.latitude || -33.0194, evento.longitude || -71.5519]} icon={icon}>
              <Popup className="mobile-popup" maxWidth={300} minWidth={260} closeButton={false}>
                <div className="bg-white rounded-2xl shadow-none overflow-hidden w-full font-sans">
                  {/* Header Popup Limpio */}
                  <div className="flex justify-between items-start p-4 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 border border-gray-100" style={{ backgroundColor: `${category.color}15` }}>{category.emoji}</div>
                      <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">{evento.title}</h3>
                          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{category.name}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contenido Popup */}
                  <div className="px-4 pb-4">
                    <div className="text-xs text-gray-500 space-y-2 mt-1 mb-3">
                      <div className="flex items-center gap-2"><span className="text-gray-400">📅</span> {new Date(evento.date).toLocaleDateString()}</div>
                      <div className="flex items-center gap-2"><span className="text-gray-400">📍</span> <span className="line-clamp-1">{evento.location || 'Sin ubicación'}</span></div>
                    </div>

                    {/* Botones de Acción - DISEÑO SÓLIDO */}
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={(e) => { e.preventDefault(); setNavigationModal({isOpen:true, eventData: {title: evento.title, latLng: {lat: evento.latitude, lng: evento.longitude}}}); }} 
                            className="bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm hover:bg-blue-700"
                        >
                            <Navigation size={14} className="text-blue-100"/> Ir ahora
                        </button>
                        
                        <button 
                            onClick={(e) => { 
                              e.preventDefault(); 
                              console.log(`[MobileMapView] ❤️ Click en favorito - Event ID: ${evento.id}, Nombre: ${evento.nombre}`);
                              onFavoriteToggle(evento.id); 
                            }} 
                            className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all border ${isFavorite ? 'bg-red-50 border-red-100 text-red-600' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                        >
                            <Heart size={14} fill={isFavorite ? "currentColor" : "none"}/> Guardar
                        </button>
                    </div>
                     {isAdmin && (
                        <button onClick={(e) => { e.preventDefault(); setEditModal({isOpen:true, event:evento}); }} className="w-full mt-2 py-2 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl text-xs font-bold">
                            Editar Evento
                        </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* --- MODALES --- */}
      <NavigationModal isOpen={navigationModal.isOpen} onClose={() => setNavigationModal({ isOpen: false, eventData: null })} eventData={navigationModal.eventData} />
      {editModal.isOpen && <EditEventModal isOpen={editModal.isOpen} onClose={() => setEditModal({ isOpen: false, event: null })} event={editModal.event} onEventUpdated={handleEventUpdated}/>}
    </div>
  );
};

export default MobileMapView;