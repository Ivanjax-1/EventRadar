import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SmartNotificationToast from './SmartNotificationToast';
import { generateSmartNotification } from '../services/smartNotificationService';
import { useNavigate } from 'react-router-dom';

/**
 * Manager de notificaciones inteligentes
 * Muestra notificaciones personalizadas cada 8 minutos
 */
const SmartNotificationManager = ({ allEvents }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentNotification, setCurrentNotification] = useState(null);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());

  useEffect(() => {
    if (!user || !allEvents || allEvents.length === 0) {
      return;
    }

    // Detectar actividad del usuario
    const handleActivity = () => {
      setLastActivityTime(Date.now());
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Generar notificación inmediatamente (después de 30 segundos)
    const initialTimer = setTimeout(() => {
      console.log('⏰ Tiempo para primera notificación');
      checkAndShowNotification();
    }, 30000); // 30 segundos después de cargar

    // Generar notificaciones cada 8 minutos
    const interval = setInterval(() => {
      checkAndShowNotification();
    }, 8 * 60 * 1000); // 8 minutos

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [user, allEvents]);

  const checkAndShowNotification = async () => {
    console.log('🔔 Verificando si mostrar notificación...');
    
    // No mostrar si el usuario está inactivo por más de 5 minutos
    const inactiveTime = (Date.now() - lastActivityTime) / 1000 / 60;
    if (inactiveTime > 5) {
      console.log('⏸️ Usuario inactivo por', inactiveTime.toFixed(1), 'minutos');
      return;
    }

    // No mostrar si ya hay una notificación visible
    if (currentNotification) {
      console.log('⏸️ Ya hay una notificación visible');
      return;
    }

    console.log('📊 Generando notificación para user:', user.id);
    console.log('📊 Eventos disponibles:', allEvents.length);

    try {
      const notification = await generateSmartNotification(user.id, allEvents);
      
      if (notification) {
        console.log('🔔 ✅ Mostrando notificación inteligente:', notification);
        setCurrentNotification(notification);
      } else {
        console.log('ℹ️ No hay notificaciones para mostrar en este momento');
      }
    } catch (error) {
      console.error('❌ Error generando notificación:', error);
    }
  };

  const handleClose = () => {
    setCurrentNotification(null);
  };

  const handleEventClick = (eventId) => {
    navigate(`/events/${eventId}`);
    setCurrentNotification(null);
  };

  if (!currentNotification) {
    return null;
  }

  return (
    <SmartNotificationToast
      notification={currentNotification}
      onClose={handleClose}
      onEventClick={handleEventClick}
    />
  );
};

export default SmartNotificationManager;
