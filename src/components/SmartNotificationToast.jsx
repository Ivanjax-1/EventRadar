import React, { useState, useEffect } from 'react';
import { X, Sparkles, Clock, TrendingUp, AlertCircle, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Componente de notificación toast inteligente
 * Se muestra en la esquina inferior derecha con animación
 */
const SmartNotificationToast = ({ notification, onClose, onEventClick }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Animación de entrada
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Auto-cerrar después de 10 segundos
    const autoCloseTimer = setTimeout(() => {
      handleClose();
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoCloseTimer);
    };
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleClick = () => {
    // Siempre navegar al dashboard con la pestaña de eventos activa
    if (notification.event?.id) {
      // Si tiene ID de evento específico, ir al dashboard con ese evento
      navigate('/dashboard', { 
        state: { 
          activeTab: 'eventos',
          highlightEventId: notification.event.id 
        }
      });
    } else {
      // Si no, solo abrir la pestaña de eventos
      navigate('/dashboard', { 
        state: { activeTab: 'eventos' }
      });
    }
    handleClose();
  };

  if (!notification) return null;

  const getColorClasses = () => {
    const colors = {
      red: {
        bg: 'bg-gradient-to-r from-red-500 to-pink-500',
        border: 'border-red-400',
        text: 'text-red-50'
      },
      orange: {
        bg: 'bg-gradient-to-r from-orange-500 to-amber-500',
        border: 'border-orange-400',
        text: 'text-orange-50'
      },
      purple: {
        bg: 'bg-gradient-to-r from-purple-500 to-pink-500',
        border: 'border-purple-400',
        text: 'text-purple-50'
      },
      blue: {
        bg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
        border: 'border-blue-400',
        text: 'text-blue-50'
      },
      indigo: {
        bg: 'bg-gradient-to-r from-indigo-500 to-purple-500',
        border: 'border-indigo-400',
        text: 'text-indigo-50'
      }
    };

    return colors[notification.color] || colors.indigo;
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'event_starting':
        return <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />;
      case 'event_expiring':
        return <AlertCircle className="w-5 h-5" />;
      case 'favorite_reminder':
        return <Bell className="w-5 h-5" />;
      case 'new_in_category':
        return <Sparkles className="w-5 h-5" />;
      case 'trending':
        return <TrendingUp className="w-5 h-5" />;
      case 'recommendation':
        return <Sparkles className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const colors = getColorClasses();

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-[9999] max-w-sm w-full
        transform transition-all duration-300 ease-out
        ${isVisible && !isLeaving ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
      `}
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className={`
          ${colors.bg} ${colors.border}
          rounded-xl shadow-2xl border-2
          backdrop-blur-lg
          overflow-hidden
          cursor-pointer
          hover:scale-105 transition-transform duration-200
        `}
        onClick={handleClick}
      >
        {/* Header con gradiente */}
        <div className="p-4 relative">
          {/* Botón cerrar */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="absolute top-2 right-2 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          {/* Contenido */}
          <div className="flex items-start gap-3 pr-6">
            {/* Ícono */}
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl">{notification.emoji}</span>
              </div>
            </div>

            {/* Texto */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getIcon()}
                <h4 className={`font-bold text-sm ${colors.text}`}>
                  {notification.title}
                </h4>
              </div>
              <p className={`text-sm ${colors.text} opacity-95 leading-snug`}>
                {notification.message}
              </p>

              {/* Info del evento */}
              {notification.event && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <div className="flex items-center gap-2 text-xs text-white/90">
                    {notification.event.event_categories && (
                      <span className="px-2 py-0.5 bg-white/20 rounded-full">
                        {notification.event.event_categories.icon} {notification.event.event_categories.name}
                      </span>
                    )}
                    {notification.event.price > 0 && (
                      <span className="px-2 py-0.5 bg-white/20 rounded-full">
                        💰 ${notification.event.price}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/75 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(notification.event.date).toLocaleDateString('es-ES', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}

              {/* CTA mejorado con botones */}
              <div className="mt-3 flex gap-2">
                {notification.event?.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/dashboard', { state: { activeTab: 'eventos', highlightEventId: notification.event.id } });
                      handleClose();
                    }}
                    className="flex-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold text-white transition-all backdrop-blur-sm border border-white/30"
                  >
                    🔍 Ver Evento
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/dashboard', { state: { activeTab: 'eventos' } });
                    handleClose();
                  }}
                  className="flex-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold text-white transition-all backdrop-blur-sm border border-white/30"
                >
                  📋 Ver Todos
                </button>
              </div>
            </div>
          </div>

          {/* Barra de progreso de auto-cierre */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-white/50 animate-shrink-width"
              style={{
                animation: 'shrinkWidth 10s linear forwards'
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shrinkWidth {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .animate-shrink-width {
          animation: shrinkWidth 10s linear forwards;
        }
      `}</style>
    </div>
  );
};

export default SmartNotificationToast;
