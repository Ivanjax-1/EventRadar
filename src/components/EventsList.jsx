import React from 'react';
import { Calendar, MapPin, Clock, DollarSign, Tag } from 'lucide-react';

const EventsList = ({ events = [] }) => {
  
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
        <Calendar className="w-12 h-12 mb-3 opacity-20" />
        <p className="text-lg font-medium">No hay eventos disponibles</p>
        <p className="text-sm">Vuelve a intentar más tarde o cambia los filtros.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => {
        // Aseguramos que la categoría tenga un color por defecto si no viene
        const categoryColor = event.event_categories?.color || '#9333ea';
        const categoryName = event.event_categories?.name || 'Evento';

        return (
          <div 
            key={event.id} 
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                {/* Badge Categoría */}
                <span 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-white mb-2"
                  style={{ backgroundColor: categoryColor }}
                >
                  {categoryName === 'Anime' ? 'Anime' : categoryName}
                </span>
                
                {/* Título */}
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                  {event.title}
                </h3>
              </div>
              
              {/* Precio (Si existe) */}
              {event.price > 0 && (
                <div className="flex items-center gap-1 text-green-600 font-bold bg-green-50 px-2 py-1 rounded-lg text-sm">
                  <DollarSign size={14} />
                  {event.price}
                </div>
              )}
            </div>

            {/* Detalles */}
            <div className="space-y-2 mt-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={16} className="text-purple-500" />
                <span className="capitalize">
                  {new Date(event.date).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
              </div>

              {event.time && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={16} className="text-purple-500" />
                  <span>{event.time}</span>
                </div>
              )}

              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin size={16} className="text-purple-500 mt-0.5 shrink-0" />
                <span className="line-clamp-1">{event.location || 'Ubicación por confirmar'}</span>
              </div>
            </div>

            {/* Descripción corta */}
            {event.description && (
              <p className="mt-3 text-xs text-gray-500 line-clamp-2 border-t border-gray-50 pt-2">
                {event.description}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EventsList;
