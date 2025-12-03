// Versión simplificada de AIService para el servidor Node.js
require('dotenv').config();

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

class AIService {
  constructor() {
    this.provider = GEMINI_API_KEY ? 'gemini' : 'none';
    this.model = 'Gemini Pro';
  }

  async chatWithAssistant(message, systemPrompt) {
    if (!GEMINI_API_KEY) {
      // Respuesta mock enriquecida: devolvemos un objeto con variantes para mejorar UX
      const variants = this.aiMockChatReply(message, systemPrompt);
      return {
        isMock: true,
        provider: 'mock',
        model: 'mock-v1',
        reply: variants[0],
        variants
      };
    }

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nUsuario: ${message}\n\nAsistente:`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[AI] Gemini error:', error);
        throw new Error('Error en Gemini API');
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      return text.trim();
    } catch (error) {
      console.error('[AI] Error:', error);
      throw error;
    }
  }

  async generateEventDescription(title, description, prompt) {
    return await this.chatWithAssistant(`Genera descripción para: ${title}`, prompt);
  }

  // =========================
  // Mock helpers (server-side)
  // =========================
  aiMockChatReply(userMessage, systemContext) {
    const m = (userMessage || '').toLowerCase();
    const variants = [];

    // Si pregunta por precios / planes, usar respuestas detalladas
    if (m.includes('precio') || m.includes('plan') || m.includes('costo')) {
      variants.push(
        `El plan Básico cuesta $5 por evento (packs 3x $12, 5x $18). El plan Destacado cuesta $15 (packs 3x $36, 5x $54) y el Premium $30 (packs 3x $72, 5x $108). ¿Te recomiendo que te muestre cuál se ajusta según tamaño del evento?`);
      variants.push(
        `Resumen rápido: Básico $5 (visibilidad media), Destacado $15 (alta visibilidad y notificaciones locales), Premium $30 (prioridad máxima + analíticas y push a todos). Si me dices cuánta gente esperas, te sugiero el mejor plan.`);
      variants.push(
        `¿Quieres que compare planes por beneficio? Puedo listar diferencias en visibilidad, notificaciones y analytics para ayudarte a decidir.`);
      return variants;
    }

    // Si contiene 'mejorar' o 'mejora' asumimos que quiere ayuda con una descripción
    if (m.includes('mejorar') || m.includes('mejora') || m.includes('mejor') || m.includes('descripción')) {
      variants.push(`Versión corta y atractiva: ${this._mockDescriptionShort(systemContext)}`);
      variants.push(`Versión enfocada en beneficios: ${this._mockDescriptionBenefits(systemContext)}`);
      variants.push(`Versión narrativa: ${this._mockDescriptionNarrative(systemContext)}`);
      variants.push(`Versión formal: ${this._mockDescriptionFormal(systemContext)}`);
      variants.push(`Versión coloquial: ${this._mockDescriptionCasual(systemContext)}`);
      variants.push(`Para redes sociales: ${this._mockDescriptionSocialMedia(systemContext)}`);
      return variants;
    }

    // Respuesta general, tres estilos
    variants.push('👋 ¡Hola! Puedo ayudarte con información sobre planes, pagos y publicación de eventos. ¿Qué necesitas exactamente?');
    variants.push('Si buscas precios o paquetes, dime cuántos eventos necesitas promocionar y te calculo la mejor opción con descuentos.');
    variants.push('También puedo ayudarte a mejorar la descripción de tu evento para que atraiga más asistentes. ¿Quieres probar con un ejemplo?');

    return variants;
  }

  // Helpers para generar descripciones mock más variadas y específicas por categoría
  _mockDescriptionShort(ctx) {
    const t = (ctx && ctx.title) ? ctx.title : 'Tu evento';
    const category = ctx?.category?.toLowerCase();
    
    // Descripciones cortas específicas por categoría
    const templates = {
      'musica': `🎵 ${t} trae la mejor música en vivo. Una noche inolvidable de ritmo y energía. ¡Entradas limitadas!`,
      'deportes': `⚽ ${t} es la competencia que estabas esperando. Ven a vivir la emoción del deporte en su máxima expresión.`,
      'tecnologia': `💻 ${t} reúne a los innovadores del futuro. Conoce las últimas tendencias tech y conecta con expertos.`,
      'gastronomia': `🍕 ${t} es un festín para los sentidos. Sabores únicos, experiencias culinarias memorables.`,
      'arte': `🎨 ${t} celebra la creatividad en todas sus formas. Inspiración, talento y cultura en un solo lugar.`,
      'anime': `🎌 ${t} es el paraíso otaku que esperabas. Cosplay, merchandising y diversión sin límites.`,
      'default': `${t} es una experiencia imperdible: ven a disfrutar, conectar y vivir momentos únicos. ¡Entradas limitadas! 🎟️`
    };
    
    return templates[category] || templates.default;
  }

  _mockDescriptionBenefits(ctx) {
    const t = (ctx && ctx.title) ? ctx.title : 'Este evento';
    const cat = (ctx && ctx.category) ? ctx.category.toLowerCase() : '';
    const loc = (ctx && ctx.location) ? ` en ${ctx.location}` : '';
    
    const benefits = {
      'musica': `actuaciones en vivo de artistas reconocidos, ambiente electrizante y producción de primer nivel`,
      'deportes': `competencias emocionantes, atletas de alto rendimiento y premios para los ganadores`,
      'tecnologia': `conferencias con líderes de la industria, demos de productos innovadores y networking exclusivo`,
      'gastronomia': `degustaciones de chefs galardonados, maridajes únicos y experiencias culinarias interactivas`,
      'arte': `exposiciones de artistas emergentes y consagrados, talleres creativos y tours guiados`,
      'anime': `proyecciones exclusivas, concursos de cosplay con premios, venta de merchandising oficial`,
      'default': `ponencias inspiradoras, networking con expertos y actividades prácticas`
    };
    
    const benefit = benefits[cat] || benefits.default;
    return `${t}${loc} ofrece: ${benefit}. Perfecto para quienes buscan experiencias memorables. Reserva tu lugar hoy.`;
  }

  _mockDescriptionNarrative(ctx) {
    const t = (ctx && ctx.title) ? ctx.title : 'El evento';
    const date = (ctx && ctx.date) ? ` el ${ctx.date}` : '';
    const category = ctx?.category?.toLowerCase();
    
    const narratives = {
      'musica': `🎶 Prepárate para ${t}${date}, una experiencia sonora que te hará vibrar. Desde el primer acorde hasta el último bis, vivirás momentos mágicos rodeado de verdaderos amantes de la música. ¡La fiesta del año!`,
      'deportes': `🏆 ${t}${date} promete ser épico. Atletas dando el máximo, público apasionado y emociones a flor de piel. Trae a tus amigos y vivan juntos la gloria del deporte.`,
      'tecnologia': `🚀 Bienvenido al futuro en ${t}${date}. Innovación, inteligencia artificial y tecnología de vanguardia se dan cita para transformar tu visión del mañana. ¡No te lo pierdas!`,
      'gastronomia': `🍽️ ${t}${date} es un viaje culinario sin precedentes. Sabores que cuentan historias, chefs que son artistas y una experiencia gastronómica que recordarás por siempre.`,
      'arte': `🎭 Déjate llevar por ${t}${date}. Arte que inspira, creatividad que transforma y cultura que nos une. Perfecto para almas sensibles y mentes curiosas.`,
      'anime': `✨ Otakus, ¡su momento ha llegado! ${t}${date} reúne todo lo que amas: anime, manga, cosplay y una comunidad vibrante. Vive tu pasión al máximo.`,
      'default': `Vive ${t}${date}: una jornada diseñada para sorprenderte con talento local, experiencias interactivas y sorpresas en el lugar. Ideal para amigos y familias. ¡No faltes! 🎉`
    };
    
    return narratives[category] || narratives.default;
  }

  _mockDescriptionFormal(ctx) {
    const t = (ctx && ctx.title) ? ctx.title : 'El evento';
    const cat = (ctx && ctx.category) ? ` de ${ctx.category}` : '';
    const loc = (ctx && ctx.location) ? ` ubicado en ${ctx.location}` : '';
    const price = (ctx && ctx.price && ctx.price > 0) ? ` Valor de entrada: $${ctx.price}.` : ' Entrada gratuita.';
    const category = ctx?.category?.toLowerCase();
    
    const formalIntros = {
      'musica': 'concierto musical de alto nivel',
      'deportes': 'evento deportivo de categoría profesional',
      'tecnologia': 'conferencia tecnológica especializada',
      'gastronomia': 'experiencia gastronómica premium',
      'arte': 'exhibición artística de vanguardia',
      'anime': 'convención cultural especializada',
      'default': 'actividad cultural y recreativa'
    };
    
    const intro = formalIntros[category] || formalIntros.default;
    return `Le invitamos cordialmente a participar en ${t}, un ${intro}${loc}. Una propuesta diseñada para brindar una experiencia enriquecedora, generar contactos valiosos y ofrecer contenido de calidad.${price} Se recomienda confirmar asistencia con anticipación. Cupos limitados.`;
  }

  _mockDescriptionCasual(ctx) {
    const t = (ctx && ctx.title) ? ctx.title : 'el evento';
    const cat = (ctx && ctx.category) ? ` de ${ctx.category}` : '';
    const loc = (ctx && ctx.location) ? ` en ${ctx.location}` : '';
    const price = (ctx && ctx.price && ctx.price > 0) ? `Por solo $${ctx.price}` : '¡Gratis!';
    const category = ctx?.category?.toLowerCase();
    
    const casualPhrases = {
      'musica': '🎸 ¡Música en vivo que te va a volar la cabeza!',
      'deportes': '⚽ ¡La competencia más brutal del año!',
      'tecnologia': '💻 ¡El evento tech más cool de la ciudad!',
      'gastronomia': '🍕 ¡Prepárate para comer como nunca!',
      'arte': '🎨 ¡Arte que te va a dejar sin palabras!',
      'anime': '🎌 ¡El paraíso otaku que esperabas!',
      'default': '¡Una experiencia increíble!'
    };
    
    const phrase = casualPhrases[category] || casualPhrases.default;
    return `¡Hey! 👋 No te pierdas ${t}${cat}${loc}. ${phrase} ${price} te llevas recuerdos inolvidables, conoces gente copada y te diviertes un montón. ¿Vas a faltar? ¡Dale, anótate! 🚀`;
  }

  _mockDescriptionSocialMedia(ctx) {
    const t = (ctx && ctx.title) ? ctx.title : 'nuestro evento';
    const category = ctx?.category?.toLowerCase();
    const emoji = this._getEmojiForCategory(category);
    const hashtags = this._getHashtagsForCategory(category);
    
    return `${emoji} ¡IMPERDIBLE! ${t} es EL evento que estabas esperando. Entradas limitadas, experiencia única. ¿Te lo vas a perder? 👀 ¡Reserva YA! ${hashtags} #EventRadar #NoTeLoPierdas`;
  }

  _mockDescriptionOneLiner(ctx) {
    const t = (ctx && ctx.title) ? ctx.title : 'Este evento';
    const category = ctx?.category?.toLowerCase();
    const emoji = this._getEmojiForCategory(category);
    
    const oneLiners = {
      'musica': 'donde la música cobra vida y las emociones vibran',
      'deportes': 'donde campeones nacen y leyendas se forjan',
      'tecnologia': 'donde el futuro se construye hoy',
      'gastronomia': 'donde los sabores cuentan historias',
      'arte': 'donde la creatividad no tiene límites',
      'anime': 'donde los sueños otaku se hacen realidad',
      'default': 'la experiencia que transforma'
    };
    
    const oneLiner = oneLiners[category] || oneLiners.default;
    return `${emoji} ${t}: ${oneLiner}. ¡Asegura tu lugar hoy!`;
  }

  _getEmojiForCategory(category) {
    const emojiMap = {
      'musica': '🎵',
      'deportes': '⚽',
      'tecnologia': '💻',
      'gastronomia': '🍕',
      'arte': '🎨',
      'anime': '🎌',
      'negocios': '💼',
      'educacion': '📚',
      'default': '🎉'
    };
    return emojiMap[category] || emojiMap.default;
  }

  _getHashtagsForCategory(category) {
    const hashtagMap = {
      'musica': '#Música #Concierto #MúsicaEnVivo',
      'deportes': '#Deportes #Competencia #TeamWork',
      'tecnologia': '#Tech #Innovación #Futuro',
      'gastronomia': '#Gastronomía #Foodie #Sabores',
      'arte': '#Arte #Cultura #Creatividad',
      'anime': '#Anime #Otaku #Cosplay',
      'default': '#Evento #Entretenimiento #NoTeLoPierdas'
    };
    return hashtagMap[category] || hashtagMap.default;
  }
}

module.exports = { AIService };
