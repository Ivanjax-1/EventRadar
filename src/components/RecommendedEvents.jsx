import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import recommendationService from '../services/recommendationService';
import EventStatusBadge from './ui/EventStatusBadge';

const RecommendedEvents = ({ allEvents, onEventClick, renderEventCard, limit = 6 }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleEventClick = (eventId) => {
    if (onEventClick) {
      onEventClick(eventId);
    } else {
      navigate(`/events/${eventId}`);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [allEvents, user]);

  const loadRecommendations = async () => {
    if (!allEvents || allEvents.length === 0) {
      setRecommendations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (!user) {
        // Usuario no autenticado: mostrar eventos más populares/recientes
        const sortedByDate = [...allEvents]
          .filter(e => new Date(e.date) >= new Date())
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, limit);
        
        // Eliminar duplicados por ID
        const uniqueEvents = Array.from(
          new Map(sortedByDate.map(event => [event.id, event])).values()
        );
        
        setRecommendations(uniqueEvents);
      } else {
        // Usuario autenticado: usar IA
        const recommended = await recommendationService.getPersonalizedRecommendations(
          user.id,
          allEvents,
          limit
        );
        
        // Eliminar duplicados por ID
        const uniqueRecommended = Array.from(
          new Map(recommended.map(event => [event.id, event])).values()
        );
        
        setRecommendations(uniqueRecommended);
        console.log('🤖 Recomendaciones generadas:', uniqueRecommended.length);
      }
    } catch (error) {
      console.error('❌ Error loading recommendations:', error);
      // Fallback: mostrar eventos recientes
      const fallback = allEvents
        .filter(e => new Date(e.date) >= new Date())
        .slice(0, limit);
        
      // Eliminar duplicados por ID
      const uniqueFallback = Array.from(
        new Map(fallback.map(event => [event.id, event])).values()
      );
      
      setRecommendations(uniqueFallback);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-10 h-10 text-white animate-spin mx-auto mb-4" />
        <p className="text-white text-lg">Generando recomendaciones personalizadas...</p>
        <p className="text-white/60 text-sm mt-2">Analizando tus preferencias con IA 🤖</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-12">
        <Sparkles className="w-16 h-16 text-white/40 mx-auto mb-4" />
        <p className="text-white text-lg">No hay recomendaciones disponibles</p>
        <p className="text-white/60 text-sm mt-2">Explora eventos para que podamos recomendarte más</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {user ? 'Recomendado para ti' : 'Eventos Destacados'}
            </h2>
            <p className="text-sm text-white/70">
              {user 
                ? 'Basado en tus intereses y preferencias' 
                : 'Los eventos más populares del momento'}
            </p>
          </div>
        </div>

        {user && (
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-white font-medium">
              IA Activa
            </span>
          </div>
        )}
      </div>

      {/* Lista de recomendaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((event, index) => (
          <div 
            key={`recommended-${event.id}-${index}`}
            className="relative cursor-pointer"
            onClick={() => handleEventClick(event.id)}
          >
            {/* Badge de recomendación */}
            {user && index < 3 && (
              <div className="absolute -top-2 -right-2 z-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                TOP {index + 1}
              </div>
            )}
            
            {/* Evento Card */}
            {renderEventCard ? (
              renderEventCard(event, true)
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50 hover:shadow-xl hover:scale-[1.02] transition-all">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-lg text-gray-800 flex-1">{event.title}</h3>
                  <EventStatusBadge event={event} />
                </div>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{event.description}</p>
                <p className="text-purple-600 text-sm">📍 {event.location}</p>
                <p className="text-gray-500 text-sm">
                  📅 {new Date(event.date).toLocaleDateString('es-ES')}
                </p>
                {event.price !== undefined && (
                  <p className="text-green-600 font-semibold text-sm mt-2">
                    {event.price === 0 ? 'Gratis' : `$${event.price}`}
                  </p>
                )}
              </div>
            )}

            {/* Score de recomendación (solo en desarrollo) */}
            {user && event.recommendationScore && process.env.NODE_ENV === 'development' && (
              <div className="mt-2 text-xs text-gray-400 text-center">
                Score: {event.recommendationScore.toFixed(1)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer informativo */}
      {user && (
        <div className="mt-8 p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white text-sm mb-1">
                ¿Cómo funcionan las recomendaciones?
              </h4>
              <p className="text-white/70 text-xs">
                Nuestro sistema de IA analiza tus interacciones, favoritos y preferencias para sugerirte 
                eventos que realmente te van a interesar. Mientras más uses la app, mejores serán las recomendaciones. 🎯
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendedEvents;
