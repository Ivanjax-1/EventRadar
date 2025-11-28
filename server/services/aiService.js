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

  // Helpers para generar descripciones mock más variadas
  _mockDescriptionShort(ctx) {
    // Intentar extraer título desde el contexto (si aplica)
    const t = (ctx && ctx.title) ? ctx.title : 'Tu evento';
    return `${t} es una experiencia imperdible: ven a disfrutar, conectar y vivir momentos únicos. ¡Entradas limitadas! 🎟️`;
  }

  _mockDescriptionBenefits(ctx) {
    const t = (ctx && ctx.title) ? ctx.title : 'Este evento';
    const cat = (ctx && ctx.category) ? ` en la categoría ${ctx.category}` : '';
    const loc = (ctx && ctx.location) ? ` en ${ctx.location}` : '';
    return `${t}${cat}${loc} ofrece: ponencias inspiradoras, networking con expertos y actividades prácticas. Perfecto para quienes buscan aprender y conectar. Reserva tu lugar hoy.`;
  }

  _mockDescriptionNarrative(ctx) {
    const t = (ctx && ctx.title) ? ctx.title : 'El evento';
    const date = (ctx && ctx.date) ? ` el ${ctx.date}` : '';
    return `Vive ${t}${date}: una jornada diseñada para sorprenderte con talento local, experiencias interactivas y sorpresas en el lugar. Ideal para amigos y familias. ¡No faltes! 🎉`;
  }

  _mockDescriptionFormal(ctx) {
    const t = (ctx && ctx.title) ? ctx.title : 'El evento';
    const cat = (ctx && ctx.category) ? ` de ${ctx.category}` : '';
    const loc = (ctx && ctx.location) ? ` ubicado en ${ctx.location}` : '';
    const price = (ctx && ctx.price && ctx.price > 0) ? ` Valor de entrada: $${ctx.price}.` : ' Entrada gratuita.';
    return `Le invitamos a participar en ${t}${cat}${loc}. Una actividad diseñada para brindar conocimiento, generar contactos profesionales y ofrecer una experiencia enriquecedora.${price} Se recomienda confirmar asistencia con anticipación. Cupos limitados.`;
  }

  _mockDescriptionCasual(ctx) {
    const t = (ctx && ctx.title) ? ctx.title : 'el evento';
    const cat = (ctx && ctx.category) ? ` de ${ctx.category}` : '';
    const loc = (ctx && ctx.location) ? ` en ${ctx.location}` : '';
    const price = (ctx && ctx.price && ctx.price > 0) ? `Por solo $${ctx.price}` : '¡Gratis!';
    return `¡Hey! 👋 No te pierdas ${t}${cat}${loc}. ${price} te llevas una experiencia increíble, conoces gente copada y te diviertes un montón. ¿Vas a faltar? ¡Dale, anótate! 🚀`;
  }

  _mockDescriptionSocialMedia(ctx) {
    const t = (ctx && ctx.title) ? ctx.title : 'nuestro evento';
    const emoji = this._getEmojiForCategory(ctx?.category);
    const hashtag = (ctx && ctx.category) ? `#${ctx.category.charAt(0).toUpperCase() + ctx.category.slice(1)}` : '#Evento';
    return `${emoji} ¡IMPERDIBLE! ${t} es EL evento que estabas esperando. Entradas limitadas, experiencia única. ¿Te lo vas a perder? 👀 ¡Reserva YA! ${hashtag} #EventRadar #NoTeLoPierdas`;
  }

  _mockDescriptionOneLiner(ctx) {
    const t = (ctx && ctx.title) ? ctx.title : 'Este evento';
    const emoji = this._getEmojiForCategory(ctx?.category);
    return `${emoji} ${t}: la experiencia que transforma. ¡Asegura tu lugar hoy!`;
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
}

module.exports = { AIService };
