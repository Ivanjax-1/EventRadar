// Endpoint para el chatbot con contexto de conocimiento
const { readFileSync } = require('fs');
const { dirname, join } = require('path');
const { fileURLToPath } = require('url');

// En CommonJS, __filename y __dirname ya existen, no es necesario redefinirlos

// Cargar knowledge base
const knowledgePath = join(__dirname, '../../src/data/chat_knowledge.json');
const knowledge = JSON.parse(readFileSync(knowledgePath, 'utf-8'));

// Función para buscar FAQs relevantes por palabras clave
function findRelevantFAQs(message, limit = 3) {
  const messageLower = message.toLowerCase();
  const words = messageLower.split(/\s+/);
  
  const scoredFAQs = knowledge.faqs.map(faq => {
    let score = 0;
    
    // Buscar coincidencias en tags
    faq.tags.forEach(tag => {
      if (messageLower.includes(tag.toLowerCase())) {
        score += 5;
      }
    });
    
    // Buscar coincidencias en pregunta
    words.forEach(word => {
      if (word.length > 3 && faq.question.toLowerCase().includes(word)) {
        score += 2;
      }
      if (word.length > 3 && faq.answer.toLowerCase().includes(word)) {
        score += 1;
      }
    });
    
    return { ...faq, score };
  });
  
  return scoredFAQs
    .filter(faq => faq.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// Función para construir el contexto
function buildContext(relevantFAQs, userContext = {}) {
  let context = "=== INFORMACIÓN DE EVENTRADAR ===\n\n";
  
  // Agregar FAQs relevantes
  if (relevantFAQs.length > 0) {
    context += "PREGUNTAS FRECUENTES RELACIONADAS:\n";
    relevantFAQs.forEach((faq, index) => {
      context += `${index + 1}. ${faq.question}\n${faq.answer}\n\n`;
    });
  }
  
  // Agregar información de pricing si no hay FAQs específicas
  if (relevantFAQs.length === 0) {
    context += "PLANES DE SUSCRIPCIÓN:\n";
    Object.entries(knowledge.pricing_tiers).forEach(([tier, info]) => {
      context += `\n${info.name.toUpperCase()}:\n`;
      context += `Precio: $${info.price}${info.pack_3 ? ` (Pack 3: $${info.pack_3}, Pack 5: $${info.pack_5})` : ''}\n`;
      context += `Características: ${info.features.join(', ')}\n`;
    });
  }
  
  // Agregar contexto del usuario (ej: plan seleccionado)
  if (userContext.selectedTier) {
    context += `\nCONTEXTO: El usuario está viendo el plan ${userContext.selectedTier.toUpperCase()}\n`;
  }
  
  // Agregar políticas si es relevante
  if (relevantFAQs.some(faq => faq.tags.includes('pago') || faq.tags.includes('reembolso'))) {
    context += "\nPOLÍTICAS IMPORTANTES:\n";
    knowledge.policies.forEach(policy => {
      context += `${policy.title}: ${policy.content}\n`;
    });
  }
  
  return context;
}

// Handler del endpoint
async function handleChatRequest(req, res, aiService) {
  try {
    const { message, context = {}, conversationHistory = [] } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Mensaje inválido' });
    }
    
    console.log('[Chat] Mensaje recibido:', message);
    
    // Buscar FAQs relevantes
    const relevantFAQs = findRelevantFAQs(message);
    console.log('[Chat] FAQs relevantes encontradas:', relevantFAQs.length);
    
    // Construir contexto
    const knowledgeContext = buildContext(relevantFAQs, context);
    
    // Construir el prompt para la IA
    const systemPrompt = `Eres el asistente virtual de EventRadar, una plataforma de eventos en Chile.

INSTRUCCIONES IMPORTANTES:
- Usa SOLO la información proporcionada en el CONTEXTO para responder
- Si la información NO está en el contexto, di: "No tengo esa información específica. ¿Quieres que te comunique con nuestro equipo de soporte? Escríbenos a soporte@eventradar.com o WhatsApp +56 9 XXXX XXXX"
- Sé amigable, profesional y conciso
- Usa emojis ocasionalmente para hacer la conversación más amena 😊
- Si preguntan por planes, destaca beneficios clave
- Si preguntan por pagos, enfatiza seguridad y opciones
- Siempre sugiere el plan que mejor se ajuste a sus necesidades

CONTEXTO:
${knowledgeContext}`;

    // Construir historial de conversación para contexto
    const messages = [
      { role: 'system', content: systemPrompt }
    ];
    
    // Agregar historial limitado (últimos 3 intercambios)
    conversationHistory.slice(-6).forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });
    
    // Agregar mensaje actual
    messages.push({ role: 'user', content: message });
    
    console.log('[Chat] Llamando a aiService con', messages.length, 'mensajes');
    
    // Llamar al servicio de IA
    let reply;
    let replyVariants = [];
    try {
      // Usar el método chatWithAssistant si existe, sino generateEventDescription adaptado
      let aiResult;
      if (typeof aiService.chatWithAssistant === 'function') {
        aiResult = await aiService.chatWithAssistant(message, systemPrompt);
      } else {
        // Fallback: usar generateEventDescription con un formato adaptado
        const combinedPrompt = `${systemPrompt}\n\nUsuario: ${message}\n\nAsistente:`;
        aiResult = await aiService.generateEventDescription(
          'Chat EventRadar',
          'Consulta de usuario',
          combinedPrompt
        );
      }

      // Si el servicio devolvió un objeto mock con variantes
      if (aiResult && aiResult.isMock && Array.isArray(aiResult.variants)) {
        replyVariants = aiResult.variants;
        reply = aiResult.reply || aiResult.variants[0];
      } else if (typeof aiResult === 'object' && aiResult !== null && aiResult.message) {
        // Estructura esperada desde aiService.chatWithAssistant (client/server)
        reply = aiResult.message || aiResult.reply || JSON.stringify(aiResult);
      } else {
        reply = aiResult;
      }

      console.log('[Chat] Respuesta de IA recibida');
    } catch (aiError) {
      console.error('[Chat] Error en aiService:', aiError);

      // Fallback mejorado: construir múltiples variaciones basadas en FAQs
      if (relevantFAQs.length > 0) {
        const base = relevantFAQs[0].answer;
        replyVariants = [
          base,
          `${base} Si necesitas más detalles, puedo explicarte los pasos para contratar o comparar planes.`,
          `Breve resumen: ${base.split('.')[0]}. ¿Quieres que te muestre packs y precios?`
        ];
        reply = replyVariants[0];
      } else {
        replyVariants = [
          'Disculpa, estoy teniendo problemas técnicos en este momento. Por favor, contacta directamente a nuestro equipo de soporte:\n\n📧 soporte@eventradar.com\n📱 WhatsApp: +56 9 XXXX XXXX\n\nTe responderemos en menos de 1 hora. Gracias por tu paciencia.',
          'Estamos con problemas momentáneos. ¿Quieres que te conecte con soporte vía email o WhatsApp?',
          'Si prefieres, puedo guardar tu consulta y enviarla al equipo de soporte para que te contacten.'
        ];
        reply = replyVariants[0];
      }
    }
    
    // Preparar respuesta
    const response = {
      reply: reply,
      sources: relevantFAQs.map(faq => faq.id),
      timestamp: new Date().toISOString()
    };
    // Incluir variantes si existen (útil para mostrar opciones al usuario)
    if (replyVariants && replyVariants.length > 0) {
      response.reply_variations = replyVariants;
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('[Chat] Error en el endpoint:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'Por favor, intenta nuevamente o contacta a soporte.'
    });
  }
}

module.exports = handleChatRequest;
