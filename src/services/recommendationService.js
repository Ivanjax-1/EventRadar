// src/services/recommendationService.js
import { supabase } from '../lib/supabase';
import trackingService from './trackingService';

class RecommendationService {
  /**
   * Obtener recomendaciones personalizadas para un usuario
   * Combina múltiples algoritmos de IA
   */
  async getPersonalizedRecommendations(userId, allEvents, limit = 10) {
    if (!userId || !allEvents || allEvents.length === 0) {
      return allEvents.slice(0, limit);
    }

    try {
      // 1. Obtener interacciones del usuario
      const interactions = await trackingService.getUserInteractions(userId, 200);
      
      // 2. Obtener favoritos
      const { data: favorites } = await supabase
        .from('favorites')
        .select('event_id')
        .eq('user_id', userId);
      
      const favoriteIds = new Set(favorites?.map(f => f.event_id) || []);

      // 3. Calcular scores para cada evento
      const scoredEvents = allEvents.map(event => {
        let score = 0;

        // Score base por recencia (eventos más recientes tienen prioridad)
        const daysUntilEvent = this.getDaysUntilEvent(event.date);
        if (daysUntilEvent >= 0 && daysUntilEvent <= 30) {
          score += (30 - daysUntilEvent) * 0.5; // Max +15 puntos
        }

        // Score por categoría preferida
        score += this.getCategoryScore(event, interactions, favoriteIds);

        // Score por ubicación preferida
        score += this.getLocationScore(event, interactions);

        // Score por rango de precio preferido
        score += this.getPriceScore(event, interactions);

        // Score por popularidad general
        score += this.getPopularityScore(event, interactions);

        // Penalizar eventos ya vistos muchas veces
        score -= this.getViewPenalty(event.id, interactions);

        // Bonus si es similar a eventos favoritos
        if (favoriteIds.size > 0) {
          score += this.getSimilarityScore(event, allEvents, favoriteIds);
        }

        // Bonus por eventos trending
        score += this.getTrendingScore(event);

        return {
          ...event,
          recommendationScore: score
        };
      });

      // 4. Ordenar por score y devolver top N
      const recommendations = scoredEvents
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit);

      // 🔥 DEDUPLICACIÓN: Eliminar eventos duplicados por ID
      const uniqueRecommendations = Array.from(
        new Map(recommendations.map(event => [event.id, event])).values()
      );

      console.log('🤖 Generated recommendations:', uniqueRecommendations.length);
      if (recommendations.length !== uniqueRecommendations.length) {
        console.warn(`⚠️ Se eliminaron ${recommendations.length - uniqueRecommendations.length} recomendaciones duplicadas`);
      }
      
      return uniqueRecommendations;

    } catch (error) {
      console.error('❌ Error generating recommendations:', error);
      return allEvents.slice(0, limit);
    }
  }

  /**
   * Calcular días hasta el evento
   */
  getDaysUntilEvent(eventDate) {
    const now = new Date();
    const event = new Date(eventDate);
    const diffTime = event.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Score basado en categorías preferidas del usuario
   */
  getCategoryScore(event, interactions, favoriteIds) {
    let score = 0;

    // Contar interacciones por categoría
    const categoryInteractions = {};
    
    interactions.forEach(interaction => {
      // Aquí necesitarías el category_id del evento de la interacción
      // Por simplicidad, usamos el peso de la interacción
      const weight = this.getInteractionWeight(interaction.interaction_type);
      if (!categoryInteractions[event.category_id]) {
        categoryInteractions[event.category_id] = 0;
      }
      categoryInteractions[event.category_id] += weight;
    });

    // Si el evento es de una categoría con la que el usuario ha interactuado
    if (categoryInteractions[event.category_id]) {
      score += Math.min(categoryInteractions[event.category_id] * 2, 20); // Max +20
    }

    return score;
  }

  /**
   * Score basado en ubicaciones preferidas
   */
  getLocationScore(event, interactions) {
    // Analizar las ubicaciones de eventos con los que ha interactuado
    const locationCounts = {};
    
    interactions.forEach(interaction => {
      if (interaction.interaction_type === 'view' || interaction.interaction_type === 'click') {
        // Aquí necesitarías la ubicación del evento de la interacción
        // Por ahora retornamos un score base
      }
    });

    return 5; // Score base por ahora
  }

  /**
   * Score basado en rango de precio preferido
   */
  getPriceScore(event, interactions) {
    // Calcular precio promedio de eventos con los que interactuó
    let totalPrice = 0;
    let priceCount = 0;

    interactions.forEach(interaction => {
      if (interaction.interaction_type === 'favorite_add' || interaction.interaction_type === 'click') {
        // Aquí necesitarías el precio del evento de la interacción
        priceCount++;
      }
    });

    const eventPrice = event.price || 0;

    // Eventos gratis siempre tienen buen score
    if (eventPrice === 0) return 10;

    // Si está en el rango de lo que suele ver
    if (eventPrice <= 50000) return 8;
    if (eventPrice <= 100000) return 5;
    return 2;
  }

  /**
   * Score de popularidad (eventos con más interacciones)
   */
  getPopularityScore(event, allInteractions) {
    // Contar interacciones totales del evento
    const eventInteractions = allInteractions.filter(i => i.event_id === event.id);
    
    if (eventInteractions.length >= 50) return 15;
    if (eventInteractions.length >= 20) return 10;
    if (eventInteractions.length >= 10) return 5;
    return 2;
  }

  /**
   * Penalizar eventos ya vistos muchas veces
   */
  getViewPenalty(eventId, interactions) {
    const views = interactions.filter(
      i => i.event_id === eventId && i.interaction_type === 'view'
    );

    if (views.length >= 5) return 10; // Penalizar mucho
    if (views.length >= 3) return 5;
    if (views.length >= 2) return 2;
    return 0;
  }

  /**
   * Score de similitud con eventos favoritos
   */
  getSimilarityScore(event, allEvents, favoriteIds) {
    let score = 0;

    // Obtener eventos favoritos
    const favoriteEvents = allEvents.filter(e => favoriteIds.has(e.id));

    favoriteEvents.forEach(favEvent => {
      // Misma categoría
      if (favEvent.category_id === event.category_id) {
        score += 5;
      }

      // Precio similar (±30%)
      const priceDiff = Math.abs((favEvent.price || 0) - (event.price || 0));
      const avgPrice = ((favEvent.price || 0) + (event.price || 0)) / 2;
      if (avgPrice > 0 && priceDiff / avgPrice <= 0.3) {
        score += 3;
      }

      // Ubicación similar (por ahora score base)
      score += 2;
    });

    return Math.min(score, 25); // Max +25 puntos
  }

  /**
   * Score de tendencia (eventos con actividad reciente)
   */
  getTrendingScore(event) {
    // Por ahora score aleatorio, pero podrías implementar:
    // - Eventos con más interacciones en las últimas 24h
    // - Eventos con crecimiento exponencial de vistas
    // - Eventos mencionados en redes sociales
    
    const createdDate = new Date(event.created_at);
    const now = new Date();
    const daysSinceCreated = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

    // Eventos nuevos (menos de 7 días) tienen bonus
    if (daysSinceCreated <= 7) return 8;
    if (daysSinceCreated <= 14) return 4;
    return 0;
  }

  /**
   * Peso de cada tipo de interacción
   */
  getInteractionWeight(interactionType) {
    const weights = {
      'favorite_add': 10,
      'click': 5,
      'view': 2,
      'share': 15,
      'favorite_remove': -5
    };
    return weights[interactionType] || 1;
  }

  /**
   * Obtener eventos similares a uno específico
   */
  async getSimilarEvents(event, allEvents, limit = 5) {
    if (!event || !allEvents) return [];

    const scoredEvents = allEvents
      .filter(e => e.id !== event.id) // Excluir el evento actual
      .map(e => {
        let score = 0;

        // Misma categoría = +50 puntos
        if (e.category_id === event.category_id) {
          score += 50;
        }

        // Precio similar (±30%) = +20 puntos
        const priceDiff = Math.abs((e.price || 0) - (event.price || 0));
        const avgPrice = ((e.price || 0) + (event.price || 0)) / 2;
        if (avgPrice === 0 || priceDiff / avgPrice <= 0.3) {
          score += 20;
        }

        // Fecha similar (±7 días) = +15 puntos
        const dateDiff = Math.abs(
          new Date(e.date).getTime() - new Date(event.date).getTime()
        );
        const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
        if (daysDiff <= 7) {
          score += 15;
        }

        // Ubicación similar = +10 puntos (implementar con coordenadas)
        // if (distance < 5km) score += 10;

        return { ...e, similarityScore: score };
      })
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);

    return scoredEvents;
  }

  /**
   * Actualizar preferencias del usuario en la BD
   */
  async updateUserPreferences(userId, interactions) {
    try {
      // Analizar interacciones para extraer preferencias
      const preferences = this.analyzeInteractions(interactions);

      // Guardar en la tabla user_preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          preferred_categories: preferences.categories,
          preferred_locations: preferences.locations,
          preferred_price_range: preferences.priceRange,
          preferred_days: preferences.days,
          last_updated: new Date().toISOString()
        });

      if (error) throw error;
      console.log('✅ User preferences updated');
      return data;
    } catch (error) {
      console.error('❌ Error updating user preferences:', error);
    }
  }

  /**
   * Analizar interacciones para extraer preferencias
   */
  analyzeInteractions(interactions) {
    const categoryCounts = {};
    const locationCounts = {};
    const prices = [];
    const dayCounts = {};

    interactions.forEach(interaction => {
      // Analizar categorías
      // if (interaction.event.category_id) {
      //   categoryCounts[interaction.event.category_id] = (categoryCounts[interaction.event.category_id] || 0) + 1;
      // }

      // Analizar días de la semana
      const date = new Date(interaction.created_at);
      const day = date.getDay();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    return {
      categories: Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => ({ id, weight: count })),
      locations: Object.entries(locationCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      priceRange: prices.length > 0 ? {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: prices.reduce((a, b) => a + b, 0) / prices.length
      } : { min: 0, max: 100000 },
      days: Object.entries(dayCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([day]) => parseInt(day))
    };
  }
}

export const recommendationService = new RecommendationService();
export default recommendationService;
