import React, { useState, useEffect, useRef } from 'react';
import { useUserRole } from '../hooks/useUserRole';
import { createEvent } from '../services/eventService'; // ✅ Importación correcta
import { notificationService } from '../services/notificationService';
import { geocodingService } from '../services/geocodingService';
import { aiService } from '../services/aiService';
import { X, Loader2, MapPin, Wand2, Plus, Tag, Calendar, Clock, DollarSign } from 'lucide-react';

const AdminEventForm = ({ onEventCreated, alwaysOpen = false }) => {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [isOpen, setIsOpen] = useState(alwaysOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Estados para autocompletado de ubicación
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const locationInputRef = useRef(null);

  // Sincronizar con la prop alwaysOpen
  useEffect(() => {
    setIsOpen(alwaysOpen);
  }, [alwaysOpen]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'anime',
    date: '',
    time: '',
    location: '',
    latitude: -33.0194,
    longitude: -71.5519,
    price: '',
    website: ''
  });

  const eventCategories = {
    'anime': { emoji: '🎌', name: 'Anime' },
    'musica': { emoji: '🎵', name: 'Música' },
    'gastronomia': { emoji: '🍕', name: 'Gastronomía' },
    'deportes': { emoji: '⚽', name: 'Deportes' },
    'arte': { emoji: '🎨', name: 'Arte' },
    'tecnologia': { emoji: '💻', name: 'Tecnología' },
    'fiestas': { emoji: '🎉', name: 'Fiestas' },
    'conciertos': { emoji: '🎤', name: 'Conciertos' },
    'otros': { emoji: '📍', name: 'Otros' }
  };

  if (roleLoading) return null;
  if (!isAdmin && !alwaysOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);
    
    try {
      console.log('📝 Creating event:', formData);
      
      const payload = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      };

      // ✅ Usamos la función importada directamente
      const result = await createEvent(payload);

      if (!result.success) {
        throw new Error(result.error?.message || 'Error desconocido al crear evento');
      }

      console.log('✅ Event created successfully:', result.data);

      // Notificaciones Push
      try {
        if (notificationService && notificationService.notifyNewEvent) {
            await notificationService.notifyNewEvent(result.data);
        }
      } catch (notifError) {
        console.error('⚠️ Error enviando notificaciones:', notifError);
      }

      setNotification({ type: 'success', message: '¡Felicitaciones! Has creado tu nuevo evento! 🎉' });
      
      // Limpiar formulario
      setFormData({
        title: '', description: '', category: 'anime',
        date: '', time: '', location: '',
        latitude: -33.0194, longitude: -71.5519,
        price: '', website: ''
      });
      
      if (onEventCreated) onEventCreated(result.data);
      if (!alwaysOpen) setTimeout(() => setIsOpen(false), 2000);

    } catch (error) {
      console.error('❌ Error creando evento:', error);
      setNotification({ type: 'error', message: `Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Búsqueda de ubicación
  const handleLocationSearch = async (searchText) => {
    setFormData(prev => ({ ...prev, location: searchText }));
    
    if (searchText.length < 3) {
      setLocationSuggestions([]);
      setShowLocationDropdown(false);
      return;
    }

    setSearchingLocation(true);
    try {
      const places = await geocodingService.searchPlaces(searchText, { limit: 5 });
      setLocationSuggestions(places);
      setShowLocationDropdown(places.length > 0);
    } catch (error) {
      console.error('Error buscando ubicación:', error);
    } finally {
      setSearchingLocation(false);
    }
  };

  const handleLocationSelect = (place) => {
    setFormData(prev => ({
      ...prev,
      location: place.name,
      latitude: place.latitude,
      longitude: place.longitude
    }));
    setShowLocationDropdown(false);
    setLocationSuggestions([]);
  };

  const handleLocationBlur = async () => {
    setTimeout(async () => {
      setShowLocationDropdown(false);
    }, 200);
  };

  // Generar descripción con IA
  const handleGenerateDescription = async () => {
    if (!formData.title || !formData.category) {
      setNotification({ type: 'error', message: 'Completa título y categoría primero' });
      return;
    }

    setGeneratingDescription(true);
    try {
      const result = await aiService.generateEventDescription({
        title: formData.title,
        category: formData.category,
        location: formData.location,
        date: formData.date,
        price: formData.price
      });

      if (result.success && result.description) {
        setFormData(prev => ({ ...prev, description: result.description }));
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'No se pudo generar descripción con IA' });
    } finally {
      setGeneratingDescription(false);
    }
  };

  return (
    <>
      {/* Botón flotante para abrir modal (solo si no es alwaysOpen) */}
      {!alwaysOpen && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 z-50 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-4 rounded-full shadow-2xl transform hover:scale-110 transition-all duration-200"
          title="Agregar Evento"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      )}

      {/* Modal / Contenedor */}
      {isOpen && (
        <div className={alwaysOpen ? 'w-full' : `fixed z-50 transition-all duration-300 ${isMinimized ? 'top-4 right-4 w-80' : 'inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'}`}>
          <div className={`bg-white rounded-2xl shadow-2xl transition-all duration-300 ${alwaysOpen ? 'w-full shadow-none' : isMinimized ? 'w-full' : 'w-full max-w-2xl max-h-[90vh] overflow-y-auto'}`}>
            
            <div className="p-6">
              {!alwaysOpen && (
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">➕ Crear Nuevo Evento</h2>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setIsMinimized(!isMinimized)} className="text-gray-400 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center">{isMinimized ? "□" : "─"}</button>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center"><X size={20}/></button>
                  </div>
                </div>
              )}

              {!isMinimized && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {notification && (
                    <div className={`p-4 rounded-xl text-sm font-medium ${notification.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {notification.message}
                    </div>
                  )}

                  {/* Título y Categoría */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">📝 Título del evento *</label>
                        <input 
                            type="text" 
                            name="title" 
                            value={formData.title} 
                            onChange={handleChange} 
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-gray-900 placeholder-gray-400" 
                            placeholder="Ej: Festival de Anime" 
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">🏷️ Categoría *</label>
                        <div className="relative">
                            <select 
                                name="category" 
                                value={formData.category} 
                                onChange={handleChange} 
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-gray-900 appearance-none"
                            >
                                {Object.entries(eventCategories).map(([key, cat]) => (
                                    <option key={key} value={key}>{cat.emoji} {cat.name}</option>
                                ))}
                            </select>
                            <Tag className="absolute right-3 top-2.5 text-gray-400 h-5 w-5 pointer-events-none" />
                        </div>
                    </div>
                  </div>

                  {/* Fecha y Hora */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">📅 Fecha *</label>
                      <input 
                        type="date" 
                        name="date" 
                        value={formData.date} 
                        onChange={handleChange} 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-gray-900" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">🕐 Hora</label>
                      <input 
                        type="time" 
                        name="time" 
                        value={formData.time} 
                        onChange={handleChange} 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-gray-900" 
                      />
                    </div>
                  </div>

                  {/* Ubicación con Autocompletado */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">📍 Ubicación</label>
                    <div className="relative">
                      <input 
                        ref={locationInputRef}
                        type="text" 
                        name="location" 
                        value={formData.location} 
                        onChange={(e) => handleLocationSearch(e.target.value)} 
                        onFocus={() => locationSuggestions.length > 0 && setShowLocationDropdown(true)}
                        onBlur={handleLocationBlur}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-gray-900 placeholder-gray-400" 
                        placeholder="Buscar dirección..." 
                      />
                      {searchingLocation && <div className="absolute right-3 top-2.5"><Loader2 className="animate-spin h-5 w-5 text-purple-600"/></div>}
                    </div>
                    
                    {/* Dropdown Sugerencias */}
                    {showLocationDropdown && locationSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                        {locationSuggestions.map((place, idx) => (
                          <button key={idx} type="button" onMouseDown={() => handleLocationSelect(place)} className="w-full text-left px-4 py-2 hover:bg-purple-50 text-sm text-gray-700 border-b border-gray-50 last:border-0">
                            {place.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Precio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">💰 Precio (CLP)</label>
                    <input 
                        type="number" 
                        name="price" 
                        value={formData.price} 
                        onChange={handleChange} 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-gray-900 placeholder-gray-400" 
                        placeholder="0 para gratis" 
                        min="0" 
                    />
                  </div>

                  {/* Descripción con IA */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">📄 Descripción *</label>
                        <button type="button" onClick={handleGenerateDescription} disabled={generatingDescription || !formData.title} className="text-xs flex items-center gap-1 text-purple-600 font-bold hover:text-purple-800 disabled:opacity-50">
                            {generatingDescription ? <Loader2 className="animate-spin h-3 w-3"/> : <Wand2 className="h-3 w-3"/>}
                            {generatingDescription ? 'Generando...' : 'Mejorar con IA'}
                        </button>
                    </div>
                    <textarea 
                        name="description" 
                        value={formData.description} 
                        onChange={handleChange} 
                        rows="4" 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none bg-white text-gray-900 placeholder-gray-400" 
                        required 
                        placeholder="Detalles del evento..."
                    />
                  </div>

                  {/* Botones */}
                  <div className="flex gap-3 pt-4">
                    {!alwaysOpen && (
                        <button type="button" onClick={() => setIsOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancelar</button>
                    )}
                    <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium">
                        {loading ? <><Loader2 className="animate-spin h-4 w-4"/> Creando...</> : '✨ Crear Evento'}
                    </button>
                  </div>

                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminEventForm;