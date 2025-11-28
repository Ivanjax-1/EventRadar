/**
 * GEOFENCING SERVICE
 * Detecta cuando el usuario está cerca de un evento y envía notificaciones
 */

class GeofencingService {
  constructor() {
    this.watchId = null;
    this.nearbyEvents = new Set();
    this.notifiedEvents = new Set();
    this.isWatching = false;
    this.radius = 500; // metros (0.5km por defecto)
    this.checkInterval = 60000; // 1 minuto
    this.lastCheck = null;
  }

  /**
   * Iniciar monitoreo de ubicación
   */
  async startWatching(events = [], radius = 500) {
    if (this.isWatching) {
      console.log('🛰️ Geofencing ya está activo');
      return;
    }

    if (!navigator.geolocation) {
      console.error('❌ Geolocation no está disponible en este navegador');
      return false;
    }

    this.radius = radius;

    try {
      // Solicitar permisos de ubicación
      const permission = await this.requestLocationPermission();
      if (!permission) {
        console.warn('⚠️ Permisos de ubicación denegados');
        return false;
      }

      this.isWatching = true;
      console.log('✅ Geofencing iniciado - Radio:', this.radius, 'metros');

      // Monitorear ubicación en tiempo real
      this.watchId = navigator.geolocation.watchPosition(
        (position) => this.onLocationUpdate(position, events),
        (error) => this.onLocationError(error),
        {
          enableHighAccuracy: true,
          maximumAge: 30000, // Cache de 30 segundos
          timeout: 27000 // Timeout de 27 segundos
        }
      );

      return true;
    } catch (error) {
      console.error('❌ Error iniciando geofencing:', error);
      return false;
    }
  }

  /**
   * Detener monitoreo
   */
  stopWatching() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isWatching = false;
    this.nearbyEvents.clear();
    console.log('🛑 Geofencing detenido');
  }

  /**
   * Solicitar permisos de ubicación
   */
  async requestLocationPermission() {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      
      if (result.state === 'granted') {
        return true;
      } else if (result.state === 'prompt') {
        // El navegador pedirá permisos automáticamente en la primera llamada
        return true;
      } else {
        return false;
      }
    } catch (error) {
      // Algunos navegadores no soportan permissions API
      return true; // Intentar de todos modos
    }
  }

  /**
   * Callback cuando se actualiza la ubicación
   */
  onLocationUpdate(position, events) {
    const now = Date.now();
    
    // Evitar checks muy frecuentes
    if (this.lastCheck && (now - this.lastCheck) < this.checkInterval) {
      return;
    }

    this.lastCheck = now;

    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;

    console.log('📍 Ubicación actualizada:', { lat: userLat, lng: userLng });

    // Buscar eventos cercanos
    const nearbyEvents = events.filter(event => {
      if (!event.latitude || !event.longitude) return false;

      const distance = this.calculateDistance(
        userLat,
        userLng,
        event.latitude,
        event.longitude
      );

      return distance <= this.radius;
    });

    // Notificar eventos nuevos cercanos
    nearbyEvents.forEach(event => {
      const eventId = event.id;
      
      if (!this.notifiedEvents.has(eventId)) {
        this.notifiedEvents.add(eventId);
        this.nearbyEvents.add(eventId);
        
        const distance = Math.round(
          this.calculateDistance(userLat, userLng, event.latitude, event.longitude)
        );
        
        this.sendProximityNotification(event, distance);
      }
    });

    // Limpiar eventos que ya no están cerca
    this.nearbyEvents.forEach(eventId => {
      const stillNearby = nearbyEvents.some(e => e.id === eventId);
      if (!stillNearby) {
        this.nearbyEvents.delete(eventId);
      }
    });
  }

  /**
   * Callback de error de ubicación
   */
  onLocationError(error) {
    console.error('❌ Error de geolocalización:', error.message);
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        console.warn('⚠️ Permisos de ubicación denegados');
        this.stopWatching();
        break;
      case error.POSITION_UNAVAILABLE:
        console.warn('⚠️ Ubicación no disponible');
        break;
      case error.TIMEOUT:
        console.warn('⚠️ Timeout obteniendo ubicación');
        break;
    }
  }

  /**
   * Calcular distancia entre dos coordenadas (Haversine formula)
   * @returns distancia en metros
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Enviar notificación de proximidad
   */
  sendProximityNotification(event, distance) {
    const title = `📍 ¡Evento Cerca!`;
    const body = `${event.title} está a ${distance}m de ti`;
    const icon = '/icons/icon-192x192.png';

    // Verificar si el navegador soporta notificaciones
    if (!('Notification' in window)) {
      console.log('📱 Notificación (sin permisos):', title, body);
      this.showInAppNotification(event, distance);
      return;
    }

    // Verificar permisos
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon,
        badge: icon,
        tag: `event-nearby-${event.id}`,
        data: { eventId: event.id },
        requireInteraction: false
      });
      
      console.log('🔔 Notificación enviada:', event.title);
    } else if (Notification.permission !== 'denied') {
      // Solicitar permisos
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body, icon });
        }
      });
    } else {
      // Fallback: notificación in-app
      this.showInAppNotification(event, distance);
    }
  }

  /**
   * Mostrar notificación dentro de la app (fallback)
   */
  showInAppNotification(event, distance) {
    const notification = {
      id: `nearby-${event.id}`,
      type: 'proximity',
      event,
      distance,
      timestamp: new Date()
    };

    // Emitir evento personalizado que la UI puede escuchar
    window.dispatchEvent(new CustomEvent('eventNearby', { detail: notification }));
    console.log('📍 Evento cercano detectado:', event.title, `(${distance}m)`);
  }

  /**
   * Obtener ubicación actual una sola vez
   */
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation no disponible'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  /**
   * Verificar si un evento está cerca de una ubicación
   */
  isEventNearby(event, userLat, userLng, radius = this.radius) {
    if (!event.latitude || !event.longitude) return false;
    
    const distance = this.calculateDistance(
      userLat,
      userLng,
      event.latitude,
      event.longitude
    );
    
    return distance <= radius;
  }

  /**
   * Obtener eventos cercanos a la ubicación actual
   */
  async getNearbyEvents(events, radius = this.radius) {
    try {
      const location = await this.getCurrentLocation();
      
      return events
        .filter(event => this.isEventNearby(event, location.latitude, location.longitude, radius))
        .map(event => ({
          ...event,
          distance: Math.round(
            this.calculateDistance(
              location.latitude,
              location.longitude,
              event.latitude,
              event.longitude
            )
          )
        }))
        .sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error('Error obteniendo eventos cercanos:', error);
      return [];
    }
  }

  /**
   * Estado del servicio
   */
  getStatus() {
    return {
      isWatching: this.isWatching,
      radius: this.radius,
      nearbyEventsCount: this.nearbyEvents.size,
      notifiedEventsCount: this.notifiedEvents.size
    };
  }
}

// Exportar instancia singleton
const geofencingService = new GeofencingService();
export default geofencingService;
