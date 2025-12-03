// ====================================
// AI SERVICE - Multi-Provider Integration
// Servicios de IA para EventRadar
// Soporta: Google Gemini, DeepSeek, OpenAI
// ====================================

import { getMockResponse } from './mockResponses.js';

// Google Gemini API (RECOMENDADO - Tier gratuito generoso)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
// Usar el modelo de tu suscripción (gemini-2.5-pro)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';

// DeepSeek API (Alternativa económica)
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// OpenAI API (Más caro pero más conocido)
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

class AIService {
  constructor() {
    // Prioridad: Gemini > DeepSeek > OpenAI
    if (GEMINI_API_KEY) {
      this.provider = 'gemini';
      this.model = 'Gemini Pro';
    } else if (DEEPSEEK_API_KEY) {
      this.provider = 'deepseek';
      this.model = 'deepseek-chat';
    } else if (OPENAI_API_KEY) {
      this.provider = 'openai';
      this.model = 'gpt-3.5-turbo';
    } else {
      this.provider = 'none';
      this.model = 'mock';
    }
  }

  /**
   * 🤖 AI EVENT ASSISTANT
   * Chatbot que ayuda a encontrar eventos
   */
  async chatWithAssistant(userMessage, events = [], userPreferences = {}) {
    try {
      console.log('[aiService] chatWithAssistant llamado');
      console.log('[aiService] userMessage:', userMessage);
      console.log('[aiService] events count:', events.length);
      console.log('[aiService] provider:', this.provider);
      console.log('[aiService] model:', this.model);
      
      const systemPrompt = this.getSystemPrompt(events, userPreferences);
      
      console.log('[aiService] systemPrompt generado, longitud:', systemPrompt.length);
      
      const response = await this.callAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]);

      console.log('[aiService] Respuesta recibida:', response?.substring(0, 100));

      return {
        success: true,
        message: response,
        suggestedEvents: this.extractEventIds(response, events)
      };
    } catch (error) {
      console.error('[aiService] ❌ Error en AI Chat:', error);
      console.error('[aiService] Error stack:', error.stack);
      
      // Usar respuesta mock inteligente como fallback
      const mockMessage = getMockResponse(userMessage);
      
      return {
        success: true,
        message: mockMessage,
        error: error.message,
        isMock: true
      };
    }
  }

  /**
   * ✍️ AI DESCRIPTION GENERATOR
   * Genera descripciones atractivas para eventos
   */
  async generateEventDescription(eventData) {
    try {
      const prompt = `
Eres un experto en marketing de eventos. Genera una descripción atractiva y profesional para el siguiente evento:

Nombre: ${eventData.title}
Categoría: ${eventData.category || 'General'}
Ubicación: ${eventData.location || 'Por definir'}
Fecha: ${eventData.date || 'Por confirmar'}
Precio: ${eventData.price === 0 ? 'Gratis' : `$${eventData.price}`}

Requisitos:
- Máximo 150 palabras
- Tono entusiasta y profesional
- Incluir llamado a la acción
- Resaltar beneficios clave
- Usar emojis relevantes (máximo 3)

Genera solo la descripción, sin títulos ni encabezados.
      `.trim();

      const response = await this.callAI([
        { role: 'user', content: prompt }
      ], { temperature: 0.8 });

      return {
        success: true,
        description: response,
        originalPrompt: prompt
      };
    } catch (error) {
      console.error('❌ Error generando descripción:', error);
      
      // Generar varias descripciones mockicadas y variadas
      const variants = this._generateMockDescriptions(eventData, 3);
      return {
        success: true,
        description: variants[0],
        descriptions: variants,
        error: error.message,
        isMock: true
      };
    }
  }

  // Generador de descripciones mock en el cliente (varias variantes)
  _generateMockDescriptions(eventData, count = 6) {
    const title = eventData?.title || 'Tu evento';
    const category = eventData?.category ? `de ${eventData.category}` : '';
    const location = eventData?.location ? `en ${eventData.location}` : '';
    const date = eventData?.date ? `el ${eventData.date}` : '';
    const price = (eventData?.price === 0 || eventData?.price === '0') ? 'Entrada gratuita' : (eventData?.price ? `Precio: $${eventData.price}` : 'Precio por confirmar');
    const emoji = this._getEmojiForCategory(eventData?.category);

    const variants = [];

    // Descripción específica por categoría
    const categoryDescriptions = this._getCategorySpecificDescription(eventData);
    if (categoryDescriptions) {
      variants.push(...categoryDescriptions);
    }

    // Variante 1: corta y directa
    variants.push(`${title} ${category} ${location} ${date}. ${price}. Una experiencia pensada para conectar con personas afines y disfrutar de momentos únicos. ¡Reserva tu lugar! 🎟️`);

    // Variante 2: beneficios
    variants.push(`${title} ${category} ${location} ${date}. ${price}. Destacado por su contenido práctico y networking: charlas, talleres y actividades interactivas que te permitirán aprender y conocer gente del rubro.`);

    // Variante 3: narrativa
    variants.push(`Vive ${title} ${category} ${location} ${date}. Sumérgete en una jornada llena de sorpresas, música y propuestas para todos. Ideal para familias y profesionales que buscan nuevas experiencias. ¡No te lo pierdas! 🎉`);

    // Variante 4: formal/profesional
    const priceText = (eventData?.price && eventData.price > 0) ? `Valor de entrada: $${eventData.price}.` : 'Entrada gratuita.';
    variants.push(`Le invitamos a participar en ${title} ${category} ${location}. Una actividad diseñada para brindar conocimiento, generar contactos profesionales y ofrecer una experiencia enriquecedora. ${priceText} Se recomienda confirmar asistencia con anticipación. Cupos limitados.`);

    // Variante 5: coloquial/casual
    const casualPrice = (eventData?.price && eventData.price > 0) ? `Por solo $${eventData.price}` : '¡Gratis!';
    variants.push(`¡Hey! 👋 No te pierdas ${title} ${category} ${location}. ${casualPrice} te llevas una experiencia increíble, conoces gente copada y te diviertes un montón. ¿Vas a faltar? ¡Dale, anótate! 🚀`);

    // Variante 6: redes sociales (llamativo y corto)
    const hashtag = eventData?.category ? `#${eventData.category.charAt(0).toUpperCase() + eventData.category.slice(1)}` : '#Evento';
    variants.push(`${emoji} ¡IMPERDIBLE! ${title} es EL evento que estabas esperando. Entradas limitadas, experiencia única. ¿Te lo vas a perder? 👀 ¡Reserva YA! ${hashtag} #EventRadar #NoTeLoPierdas`);

    // Variante 7: one-liner para marketing
    variants.push(`${emoji} ${title}: la experiencia que transforma. ¡Asegura tu lugar hoy!`);

    // Variante 8: enfocada en la comunidad
    variants.push(`Únete a ${title} ${location} ${date} y forma parte de una comunidad apasionada. ${price}. Más que un evento, una oportunidad para crecer, aprender y conectar con personas increíbles. ¡Te esperamos! ✨`);

    // Variante 9: urgencia y FOMO
    variants.push(`⏰ ¡ÚLTIMO LLAMADO! ${title} ${location} ${date}. ${price}. Los cupos se agotan rápido y no querrás quedarte fuera de esta experiencia única. Confirma tu asistencia ahora antes de que sea tarde. 🔥`);

    // Variante 10: storytelling
    variants.push(`Imagina un lugar donde ${this._getStorytellingHook(eventData?.category)}. Eso es ${title} ${location} ${date}. ${price}. Una experiencia diseñada para sorprenderte y dejarte recuerdos inolvidables. 🌟`);

    return variants.slice(0, count).map(v => v.replace(/\s+/g, ' ').trim());
  }

  _getCategorySpecificDescription(eventData) {
    const title = eventData?.title || 'Tu evento';
    const location = eventData?.location ? `en ${eventData.location}` : '';
    const date = eventData?.date ? `el ${eventData.date}` : '';
    const price = (eventData?.price === 0 || eventData?.price === '0') ? 'Gratis' : (eventData?.price ? `$${eventData.price}` : 'Precio por confirmar');
    const category = eventData?.category?.toLowerCase();

    const descriptions = [];

    switch(category) {
      case 'musica':
      case 'music':
      case 'conciertos':
        descriptions.push(`🎵 ${title} ${location} ${date}. ${price}. Prepárate para vibrar con los mejores beats, artistas en vivo y una producción de primer nivel. Una noche que quedará en tu memoria. ¡Compra tu entrada!`);
        descriptions.push(`🎸 Vive la magia de la música en vivo con ${title}. ${location} ${date}. ${price}. Escenario épico, sonido profesional y una atmósfera inigualable. No te pierdas este show.`);
        break;
      
      case 'deportes':
      case 'sports':
        descriptions.push(`⚽ ${title} ${location} ${date}. ${price}. Acción, emoción y adrenalina pura. Ven a apoyar, competir o simplemente disfrutar del mejor deporte en vivo. ¡Trae a toda tu familia!`);
        descriptions.push(`🏃‍♂️ Prepárate para sudar con ${title} ${location} ${date}. ${price}. Desafío físico, compañerismo y premios increíbles. Perfecto para deportistas de todos los niveles.`);
        break;
      
      case 'tecnologia':
      case 'technology':
      case 'tech':
        descriptions.push(`💻 ${title} ${location} ${date}. ${price}. Las últimas tendencias tech, demos en vivo, networking con innovadores y charlas de expertos. El futuro empieza aquí.`);
        descriptions.push(`🚀 Innovación y tecnología se encuentran en ${title}. ${location} ${date}. ${price}. Aprende, conecta y descubre las herramientas que cambiarán tu carrera.`);
        break;
      
      case 'gastronomia':
      case 'food':
      case 'comida':
        descriptions.push(`🍽️ ${title} ${location} ${date}. ${price}. Un viaje culinario que deleitará tus sentidos. Chefs destacados, sabores únicos y una experiencia gastronómica inolvidable.`);
        descriptions.push(`👨‍🍳 Descubre los secretos de la cocina en ${title} ${location} ${date}. ${price}. Degustaciones, talleres y recetas que podrás replicar en casa. ¡Para foodies!`);
        break;
      
      case 'arte':
      case 'art':
        descriptions.push(`🎨 ${title} ${location} ${date}. ${price}. Sumérgete en el mundo del arte con exposiciones, talleres interactivos y la oportunidad de conocer a los artistas. Inspiración garantizada.`);
        descriptions.push(`🖼️ La creatividad cobra vida en ${title} ${location} ${date}. ${price}. Obras únicas, técnicas innovadoras y un espacio para explorar tu lado artístico.`);
        break;
      
      case 'anime':
      case 'manga':
        descriptions.push(`🎌 ${title} ${location} ${date}. ${price}. El evento definitivo para fans del anime y manga. Cosplay, proyecciones exclusivas, merchandising y una comunidad apasionada. ¡Kawaii!`);
        descriptions.push(`⚡ Otakus, prepárense: ${title} ${location} ${date}. ${price}. Concursos de cosplay, stands de coleccionables, charlas con mangakas y mucho más. No faltes.`);
        break;
      
      case 'fiestas':
      case 'party':
        descriptions.push(`🎉 ${title} ${location} ${date}. ${price}. La fiesta del año está aquí. DJ en vivo, luces espectaculares, barra libre y la mejor vibra. ¡Ven a bailar toda la noche!`);
        descriptions.push(`🥳 Celebra a lo grande en ${title} ${location} ${date}. ${price}. Música, diversión sin límites y un ambiente increíble. Trae a tus amigos y prepárate para lo mejor.`);
        break;
    }

    return descriptions.length > 0 ? descriptions : null;
  }

  _getStorytellingHook(category) {
    const hooks = {
      musica: 'la música te envuelve, los artistas te sorprenden y cada nota te hace vibrar',
      deportes: 'la competencia enciende tu espíritu, la energía es contagiosa y cada jugada te emociona',
      tecnologia: 'la innovación no tiene límites, las ideas se transforman en realidad y el futuro se crea hoy',
      gastronomia: 'cada bocado cuenta una historia, los sabores te transportan y la experiencia es memorable',
      arte: 'la creatividad no tiene barreras, cada obra te inspira y el talento brilla en cada rincón',
      anime: 'tus personajes favoritos cobran vida, la comunidad te abraza y la pasión otaku reina',
      fiestas: 'la música no para, las risas abundan y los mejores momentos se crean',
      default: 'todo es posible, las conexiones son reales y cada momento cuenta'
    };
    
    return hooks[category?.toLowerCase()] || hooks.default;
  }

  _getEmojiForCategory(category) {
    const emojiMap = {
      music: '🎵',
      sports: '⚽',
      technology: '💻',
      food: '🍽️',
      art: '🎨',
      business: '💼',
      education: '📚',
      other: '🎉'
    };
    return emojiMap[category] || '🎉';
  }

  /**
   * 🔍 AI SMART SEARCH
   * Busca eventos usando lenguaje natural
   */
  async smartSearch(query, allEvents) {
    try {
      const eventsContext = allEvents.slice(0, 20).map(e => ({
        id: e.id,
        title: e.title,
        category: e.event_categories?.name || 'General',
        location: e.location,
        date: e.date,
        price: e.price
      }));

      const prompt = `
Eres un asistente de búsqueda de eventos. El usuario busca: "${query}"

Eventos disponibles:
${JSON.stringify(eventsContext, null, 2)}

Analiza la consulta del usuario y:
1. Identifica qué eventos coinciden mejor
2. Retorna los IDs de los 5 eventos más relevantes
3. Explica brevemente por qué los recomendas

Formato de respuesta:
{
  "event_ids": ["id1", "id2", "id3"],
  "explanation": "Encontré estos eventos porque..."
}

Retorna SOLO el JSON, sin texto adicional.
      `.trim();

      const response = await this.callAI([
        { role: 'user', content: prompt }
      ], { temperature: 0.3 });

      // Parsear respuesta JSON
      const result = this.parseJSON(response);
      
      if (result && result.event_ids) {
        const matchedEvents = allEvents.filter(e => 
          result.event_ids.includes(e.id)
        );

        return {
          success: true,
          events: matchedEvents,
          explanation: result.explanation,
          query
        };
      }

      throw new Error('No se pudo parsear la respuesta de IA');

    } catch (error) {
      console.error('❌ Error en búsqueda inteligente:', error);
      
      // Fallback: búsqueda tradicional
      const fallbackResults = allEvents.filter(e => 
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        e.description?.toLowerCase().includes(query.toLowerCase())
      );

      return {
        success: false,
        events: fallbackResults,
        explanation: 'Búsqueda tradicional (IA no disponible)',
        error: error.message
      };
    }
  }

  /**
   * 📊 AI EVENT INSIGHTS
   * Genera insights sobre un evento
   */
  async getEventInsights(event, similarEvents = []) {
    try {
      const prompt = `
Analiza este evento y genera insights útiles:

Evento: ${event.title}
Categoría: ${event.event_categories?.name || 'General'}
Precio: ${event.price === 0 ? 'Gratis' : `$${event.price}`}
Ubicación: ${event.location}
Fecha: ${new Date(event.date).toLocaleDateString('es-ES')}

${similarEvents.length > 0 ? `
Eventos similares disponibles:
${similarEvents.map(e => `- ${e.title} (${e.event_categories?.name})`).join('\n')}
` : ''}

Genera:
1. Un resumen en 1 oración de qué esperar
2. A quién le recomendarías este evento (1 oración)
3. Un consejo útil para asistentes (1 oración)

Formato:
{
  "summary": "...",
  "target_audience": "...",
  "tip": "..."
}

Retorna SOLO el JSON.
      `.trim();

      const response = await this.callAI([
        { role: 'user', content: prompt }
      ], { temperature: 0.7 });

      const result = this.parseJSON(response);
      
      return {
        success: true,
        insights: result,
        event: event.title
      };
    } catch (error) {
      console.error('❌ Error generando insights:', error);
      return {
        success: false,
        insights: null,
        error: error.message
      };
    }
  }

  /**
   * 🎯 AI PERSONALIZED SUGGESTIONS
   * Genera sugerencias personalizadas en lenguaje natural
   */
  async getPersonalizedSuggestions(userProfile, recommendedEvents) {
    try {
      const prompt = `
Eres un asistente personal de eventos. Genera un mensaje personalizado para el usuario.

Perfil del usuario:
- Categorías favoritas: ${userProfile.favoriteCategories?.join(', ') || 'No definido'}
- Rango de precio habitual: ${userProfile.priceRange || 'Cualquiera'}
- Ubicaciones frecuentes: ${userProfile.locations?.join(', ') || 'Varias'}

Eventos recomendados para él/ella:
${recommendedEvents.slice(0, 3).map((e, i) => 
  `${i + 1}. ${e.title} - ${e.event_categories?.name} - $${e.price}`
).join('\n')}

Genera un mensaje entusiasta y personalizado (máximo 100 palabras) explicando:
- Por qué estos eventos son perfectos para el usuario
- Qué hace especial cada recomendación
- Un llamado a la acción

Usa un tono amigable y cercano. Incluye 2-3 emojis relevantes.
      `.trim();

      const response = await this.callAI([
        { role: 'user', content: prompt }
      ], { temperature: 0.9 });

      return {
        success: true,
        message: response,
        count: recommendedEvents.length
      };
    } catch (error) {
      console.error('❌ Error generando sugerencias:', error);
      return {
        success: false,
        message: '¡Aquí tienes algunos eventos que podrían interesarte! 🎉',
        error: error.message
      };
    }
  }

  // ====================================
  // MÉTODOS AUXILIARES
  // ====================================

  /**
   * Llamada a la API de IA (Gemini, DeepSeek u OpenAI)
   */
  async callAI(messages, options = {}) {
    // Si no hay API configurada, usar respuestas mock
    if (this.provider === 'none') {
      console.warn('⚠️ No hay API key configurada. Usando respuestas mock.');
      return getMockResponse(messages[messages.length - 1].content);
    }

    try {
      // GEMINI API
      if (this.provider === 'gemini') {
        return await this.callGeminiAPI(messages, options);
      }
      
      // DEEPSEEK API
      if (this.provider === 'deepseek') {
        return await this.callDeepSeekAPI(messages, options);
      }
      
      // OPENAI API
      if (this.provider === 'openai') {
        return await this.callOpenAIAPI(messages, options);
      }
    } catch (error) {
      console.error(`❌ Error en ${this.provider} API:`, error);
      console.error('Stack:', error.stack);
      // Re-lanzar el error en lugar de usar mock
      throw error;
    }
  }

  /**
   * Llamada específica a Google Gemini API
   */
  async callGeminiAPI(messages, options = {}) {
    console.log('🔵 Llamando a Gemini API...', { messages, options });
    
    // Gemini usa formato diferente: "contents" en lugar de "messages"
    const geminiContents = messages
      .filter(msg => msg.role !== 'system') // Gemini no soporta 'system' role
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

    // Agregar contexto del sistema como primer mensaje del usuario
    const systemMessage = messages.find(msg => msg.role === 'system');
    if (systemMessage) {
      geminiContents.unshift({
        role: 'user',
        parts: [{ text: `Contexto: ${systemMessage.content}` }]
      });
    }

    console.log('📤 Enviando a Gemini:', geminiContents);

    const response = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: geminiContents,
          generationConfig: {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens || 500,
            topP: 0.8,
            topK: 40,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error de Gemini API:', errorData);
      throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('📥 Respuesta de Gemini:', data);
    
    // Gemini devuelve el texto en: candidates[0].content.parts[0].text
    const aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiMessage) {
      console.error('❌ Estructura de respuesta inválida:', data);
      throw new Error('Respuesta inválida de Gemini');
    }

    console.log('✅ Texto generado:', aiMessage);
    return aiMessage.trim();
  }

  /**
   * Llamada específica a DeepSeek API
   */
  async callDeepSeekAPI(messages, options = {}) {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 500
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error en DeepSeek API');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  /**
   * Llamada específica a OpenAI API
   */
  async callOpenAIAPI(messages, options = {}) {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 500
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error en OpenAI API');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  /**
   * Respuesta mock cuando no hay API key configurada
   */
  getMockResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('música') || lowerMessage.includes('concierto')) {
      return '🎵 ¡Encontré eventos de música interesantes! Te recomiendo revisar los conciertos disponibles en la página principal. Filtra por categoría "Música" para ver todo. ¿Buscas algún género específico?';
    }
    
    if (lowerMessage.includes('deporte') || lowerMessage.includes('fútbol') || lowerMessage.includes('basketball')) {
      return '⚽ ¡Hay varios eventos deportivos disponibles! Revisa la sección de deportes para ver partidos y torneos. ¿Prefieres fútbol, basketball u otro deporte?';
    }
    
    if (lowerMessage.includes('gratis') || lowerMessage.includes('free')) {
      return '🎁 ¡Eventos gratuitos disponibles! Usa el filtro de precio en la página principal para ver solo eventos sin costo. ¿Te interesa alguna categoría específica?';
    }
    
    if (lowerMessage.includes('hoy') || lowerMessage.includes('today')) {
      return '📅 Para eventos de hoy, usa el filtro de fecha en la página principal. ¡Siempre hay algo interesante sucediendo!';
    }

    if (lowerMessage.includes('fin de semana') || lowerMessage.includes('weekend')) {
      return '🎉 ¡Los fines de semana están llenos de eventos! Usa los filtros de fecha para ver todo lo que pasa sábado y domingo.';
    }
    
    if (lowerMessage.includes('arte') || lowerMessage.includes('art')) {
      return '🎨 ¡Los eventos de arte están en auge! Filtra por categoría "Arte" para ver exposiciones, galerías y talleres creativos. ¿Prefieres arte contemporáneo o clásico?';
    }
    
    if (lowerMessage.includes('gastronomía') || lowerMessage.includes('comida') || lowerMessage.includes('food')) {
      return '🍽️ ¡Eventos gastronómicos deliciosos! Encuentra festivales de comida, catas y experiencias culinarias en la categoría "Gastronomía". ¿Alguna cocina en particular?';
    }
    
    return '� ¡Hola! Puedo ayudarte a encontrar eventos. Prueba preguntando por:\n🎵 Música o conciertos\n⚽ Deportes\n🎨 Arte\n🍽️ Gastronomía\n🎁 Eventos gratuitos\n📅 Eventos de hoy o del fin de semana\n\n¿Qué te interesa?';
  }

  /**
   * Prompt del sistema para el asistente
   */
  getSystemPrompt(events, userPreferences) {
    const eventList = events.slice(0, 10).map(e => 
      `- ${e.title} (${e.event_categories?.name}) - ${e.location} - $${e.price}`
    ).join('\n');

    return `
Eres EventRadar AI, un asistente experto en eventos que ayuda a usuarios a encontrar las mejores experiencias.

Eventos disponibles actualmente:
${eventList}

Preferencias del usuario:
- Categorías favoritas: ${userPreferences.categories?.join(', ') || 'No definido'}
- Ubicación: ${userPreferences.location || 'Cualquiera'}
- Presupuesto: ${userPreferences.budget || 'Flexible'}

Tu rol:
- Recomienda eventos basándote en las preferencias del usuario
- Sé entusiasta pero honesto
- Si no hay eventos que coincidan exactamente, sugiere alternativas
- Usa emojis relevantes para hacer la conversación más amigable
- Mantén respuestas concisas (máximo 150 palabras)

IMPORTANTE: 
- Si mencionas un evento, usa su nombre exacto del listado
- Si no hay eventos disponibles que coincidan, sugiere categorías alternativas
- Siempre termina con una pregunta o llamado a la acción
    `.trim();
  }

  /**
   * Extraer IDs de eventos mencionados
   */
  extractEventIds(response, events) {
    const eventIds = [];
    
    events.forEach(event => {
      if (response.includes(event.title)) {
        eventIds.push(event.id);
      }
    });

    return eventIds;
  }

  /**
   * Parsear JSON de respuesta de IA
   */
  parseJSON(text) {
    try {
      // Intentar parsear directamente
      return JSON.parse(text);
    } catch {
      // Extraer JSON de markdown code blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                       text.match(/```\n([\s\S]*?)\n```/) ||
                       text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } catch {
          return null;
        }
      }
      
      return null;
    }
  }

  /**
   * Verificar si la API está configurada
   */
  isConfigured() {
    return this.provider !== 'none';
  }

  /**
   * Obtener nombre del modelo actual
   */
  getModelName() {
    const modelNames = {
      'gemini': 'Google Gemini 2.0 Flash',
      'deepseek': 'DeepSeek Chat',
      'openai': 'GPT-3.5 Turbo',
      'none': 'Mock (Sin API)'
    };
    return modelNames[this.provider] || 'Desconocido';
  }

  /**
   * Obtener proveedor actual
   */
  getProvider() {
    return this.provider;
  }
}

export const aiService = new AIService();
export default aiService;
