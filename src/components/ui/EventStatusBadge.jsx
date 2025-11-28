import React from 'react';
import { getStatusLabel, calculateEventStatus } from '../../services/eventLifecycleService';

/**
 * Badge que muestra el estado actual de un evento
 * Estados: upcoming, ongoing, finished, archived
 */
const EventStatusBadge = ({ event, className = '', showAllStates = false }) => {
  if (!event || !event.start_date) return null;
  
  const status = event.clientStatus || event.live_status || calculateEventStatus(event.start_date);
  const statusInfo = getStatusLabel(status);
  
  // No mostrar badge para eventos próximos o archivados (a menos que showAllStates = true)
  if (!showAllStates && (status === 'upcoming' || status === 'archived')) {
    return null;
  }
  
  // Estilos mejorados con gradientes y animaciones
  const statusStyles = {
    ongoing: {
      gradient: 'bg-gradient-to-r from-red-500 via-red-600 to-pink-600',
      text: 'text-white',
      border: 'border-red-300',
      shadow: 'shadow-lg shadow-red-500/50',
      animate: 'animate-pulse',
      glow: 'before:absolute before:inset-0 before:rounded-full before:bg-red-500 before:blur-lg before:opacity-30'
    },
    finished: {
      gradient: 'bg-gradient-to-r from-green-500 to-emerald-600',
      text: 'text-white',
      border: 'border-green-300',
      shadow: 'shadow-md shadow-green-500/30',
      glow: ''
    },
    upcoming: {
      gradient: 'bg-gradient-to-r from-blue-500 to-cyan-600',
      text: 'text-white',
      border: 'border-blue-300',
      shadow: 'shadow-md shadow-blue-500/30',
      glow: ''
    },
    archived: {
      gradient: 'bg-gradient-to-r from-gray-400 to-gray-500',
      text: 'text-white',
      border: 'border-gray-300',
      shadow: '',
      glow: ''
    }
  };
  
  const styles = statusStyles[status] || statusStyles.upcoming;
  
  return (
    <div className={`relative inline-flex ${className}`}>
      <div 
        className={`
          relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold
          ${styles.gradient} ${styles.text} ${styles.border} border-2
          ${styles.shadow} ${styles.animate || ''}
          ${styles.glow}
          backdrop-blur-sm transform transition-all duration-300 hover:scale-105
        `}
      >
        {/* Emoji con animación especial para "en vivo" */}
        <span className={`text-base ${status === 'ongoing' ? 'animate-bounce' : ''}`}>
          {statusInfo.emoji}
        </span>
        
        {/* Label con uppercase */}
        <span className="uppercase tracking-wide">
          {statusInfo.label}
        </span>
        
        {/* Indicator dot para eventos en vivo */}
        {status === 'ongoing' && (
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
        )}
      </div>
    </div>
  );
};

export default EventStatusBadge;
