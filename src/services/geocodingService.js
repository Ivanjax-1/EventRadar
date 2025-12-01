// src/services/geocodingService.js

// No necesitamos API Key para Nominatim (OpenStreetMap) uso gratuito básico, 
// pero sí necesitamos identificarnos con un User-Agent.
const USER_AGENT = 'EventRadarApp/1.0'; 

export const geocodingService = {
  
  // 1. Convertir dirección a coordenadas
  async addressToCoordinates(address) {
    try {
      // URL directa a OpenStreetMap
      const apiUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=cl&limit=1`;
      
      const response = await fetch(apiUrl, {
        headers: { 'User-Agent': USER_AGENT }
      });

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          address: result.display_name,
          confidence: result.importance || 0.5
        };
      }

      // Si no hay resultados, usar coordenadas por defecto de Santiago
      return {
        latitude: -33.4489,
        longitude: -70.6693,
        address: 'Santiago, Chile',
        confidence: 0.3,
        fallback: true
      };

    } catch (error) {
      console.error('Error in addressToCoordinates:', error);
      return {
        latitude: -33.4489,
        longitude: -70.6693,
        address: 'Santiago, Chile (ubicación aproximada)',
        confidence: 0.1,
        fallback: true,
        error: error.message
      };
    }
  },

  // 2. Convertir coordenadas a dirección (Reverse Geocoding)
  async coordinatesToAddress(latitude, longitude) {
    try {
      // URL directa a OpenStreetMap Reverse
      const apiUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
      
      const response = await fetch(apiUrl, {
        headers: { 'User-Agent': USER_AGENT }
      });

      if (!response.ok) {
        throw new Error(`Reverse geocoding error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.display_name) {
        return {
          address: data.display_name,
          components: {
            street: data.address?.road,
            number: data.address?.house_number,
            neighborhood: data.address?.neighbourhood || data.address?.suburb,
            city: data.address?.city || data.address?.town || data.address?.village,
            region: data.address?.state,
            country: data.address?.country,
            postal_code: data.address?.postcode
          },
          confidence: 0.8
        };
      }
      return {
        address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        components: {},
        confidence: 0.1,
        fallback: true
      };
    } catch (error) {
      console.error('Error in coordinatesToAddress:', error);
      return {
        address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        components: {},
        confidence: 0.1,
        fallback: true,
        error: error.message
      };
    }
  },

  // 3. Buscar lugares (Autocompletado) - ESTA ES LA QUE USA TU FORMULARIO
  async searchPlaces(query, options = {}) {
    // Evitar búsquedas muy cortas
    if (!query || query.length < 3) return [];

    try {
      const { 
        limit = 5, 
        countryCode = 'cl',
        viewbox = '-75,-17,-66,-56' // Chile boundaries
      } = options;

      // URL directa a OpenStreetMap con addressdetails=1 para tener calles y ciudades
      let apiUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=${countryCode}&limit=${limit}&addressdetails=1`;
      
      // Añadimos viewbox para priorizar resultados en Chile
      if (viewbox) {
        apiUrl += `&viewbox=${viewbox}&bounded=1`;
      }

      const response = await fetch(apiUrl, {
        headers: { 'User-Agent': USER_AGENT }
      });

      if (!response.ok) {
        throw new Error(`Places search error: ${response.status}`);
      }

      const data = await response.json();
      
      // Mapeamos los datos para mantener la estructura que tu app espera
      return data.map(place => ({
        id: place.place_id, // Usamos place_id en vez de osm_id a veces es más estable
        name: place.display_name,
        // Adaptamos para que el dropdown del formulario lo entienda fácil (label/value)
        label: place.display_name, 
        value: place.place_id,
        
        latitude: parseFloat(place.lat),
        longitude: parseFloat(place.lon),
        type: place.type,
        importance: place.importance || 0.5,
        address: {
          street: place.address?.road,
          number: place.address?.house_number,
          neighborhood: place.address?.neighbourhood || place.address?.suburb,
          city: place.address?.city || place.address?.town,
          region: place.address?.state,
          country: place.address?.country
        }
      }));
    } catch (error) {
      console.error('Error in searchPlaces:', error);
      return [];
    }
  },

  // --- UTILITIES (Se mantienen igual porque son lógica local) ---

  // Calcular distancia entre dos puntos (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distancia en km
  },

  toRadians(degrees) {
    return degrees * (Math.PI/180);
  },

  // Obtener eventos cercanos a una ubicación (Placeholder)
  async getNearbyEvents(latitude, longitude, radiusKm = 10) {
    // Aquí normalmente conectarías con Supabase usando calculateDistance
    return []; 
  },

  // Validar si las coordenadas están dentro de Chile
  isInChile(latitude, longitude) {
    const chileBounds = {
      north: -17.5,
      south: -56,
      east: -66,
      west: -75
    };

    return (
      latitude >= chileBounds.south &&
      latitude <= chileBounds.north &&
      longitude >= chileBounds.west &&
      longitude <= chileBounds.east
    );
  },

  // Obtener ubicación del usuario
  async getUserLocation() {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocalización no soportada');
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Reutilizamos la función interna corregida
      const addressData = await this.coordinatesToAddress(latitude, longitude);
      
      return {
        latitude,
        longitude,
        address: addressData.address,
        accuracy: position.coords.accuracy,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('Error getting user location:', error);
      
      return {
        latitude: -33.4489,
        longitude: -70.6693,
        address: 'Santiago, Chile (ubicación por defecto)',
        accuracy: null,
        fallback: true,
        error: error.message
      };
    }
  }
};