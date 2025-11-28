import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import chatKnowledge from '../data/chat_knowledge.json';

// Helper para buscar respuestas en el knowledge base
const findBestAnswer = (message) => {
  const messageLower = message.toLowerCase();
  const words = messageLower.split(/\s+/).filter(w => w.length > 3);
  
  let bestMatch = null;
  let bestScore = 0;

  chatKnowledge.faqs.forEach(faq => {
    let score = 0;
    
    // Buscar en tags
    faq.tags.forEach(tag => {
      if (messageLower.includes(tag.toLowerCase())) {
        score += 10;
      }
    });
    
    // Buscar en pregunta
    words.forEach(word => {
      if (faq.question.toLowerCase().includes(word)) {
        score += 5;
      }
      if (faq.answer.toLowerCase().includes(word)) {
        score += 2;
      }
    });
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = faq;
    }
  });

  if (bestMatch && bestScore > 5) {
    // Generar variantes de la respuesta
    const baseAnswer = bestMatch.answer;
    const variants = [
      baseAnswer,
      `📋 ${baseAnswer}\n\n¿Necesitas más información sobre esto?`,
      `Aquí está la info: ${baseAnswer.split('.')[0]}. ${baseAnswer.split('.').slice(1).join('.')}`,
    ];
    
    return {
      reply: variants[0],
      variations: variants,
      sources: [bestMatch.id]
    };
  }

  // Si no hay match, respuesta genérica con variantes
  return {
    reply: '👋 Puedo ayudarte con información sobre nuestros planes (Básico, Destacado, Premium), métodos de pago, descuentos y características. ¿Qué te gustaría saber?',
    variations: [
      '👋 Puedo ayudarte con información sobre nuestros planes (Básico, Destacado, Premium), métodos de pago, descuentos y características. ¿Qué te gustaría saber?',
      '¿Buscas info sobre precios, planes o pagos? Pregúntame lo que necesites.',
      'Estoy aquí para resolver tus dudas sobre EventRadar. Pregunta sobre planes, precios, características o lo que necesites.'
    ],
    sources: []
  };
};

const ChatbotModal = ({ isOpen, onClose, context = {} }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '¡Hola! 👋 Soy el asistente de EventRadar. Estoy aquí para ayudarte con cualquier duda sobre nuestros planes de suscripción, características y pagos. ¿En qué puedo ayudarte?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const getMockReply = (message) => {
    const m = message.toLowerCase();
    
    // Detectar solicitud de contacto humano
    if (m.match(/(hablar con|contactar|supervisor|ejecutivo|humano|persona real|agente|ayuda humana|asistente humano)/)) {
      return {
        reply: '👤 ¡Por supuesto! Si necesitas hablar con un asistente humano, puedes contactarnos directamente:\n\n📧 Email: contactoempresa@eventradar.com\n\nNuestro equipo te responderá lo antes posible para ayudarte con tu consulta. ¿Hay algo más en lo que pueda ayudarte mientras tanto?',
        variations: [
          'Claro, te conectamos con nuestro equipo. Escríbenos a contactoempresa@eventradar.com y un ejecutivo te atenderá personalmente.',
          'Entendido. Para atención personalizada, comunícate con nosotros en contactoempresa@eventradar.com. ¡Estaremos encantados de ayudarte!'
        ]
      };
    }
    
    if (m.includes('precio') || m.includes('costo') || m.includes('plan')) {
      return {
        reply: 'El plan Básico cuesta $5 por evento (packs 3x $12, 5x $18). El plan Destacado cuesta $15 (packs 3x $36, 5x $54) y el Premium $30 (packs 3x $72, 5x $108). ¿Te ayudo a elegir el mejor para ti?',
        variations: [
          'Básico $5 • Destacado $15 • Premium $30. Todos con paquetes 3x (20% descuento) y 5x (28% descuento). ¿Cuántos eventos necesitas promocionar?',
          'Para eventos pequeños: Básico $5. Para eventos medianos/populares: Destacado $15 (mejor relación). Para eventos masivos: Premium $30 con máxima visibilidad.'
        ]
      };
    }
    
    if (m.includes('destacado') || m.includes('featured')) {
      return {
        reply: 'El plan Destacado ($15) incluye: badge 🔥, siempre visible en mapa, +100% boost en recomendaciones, notificaciones push a usuarios cercanos, Top 5 en listados y analíticas completas. ¡Es nuestro plan más popular!',
        variations: [
          'Destacado es ideal para eventos medianos: apareces siempre en el mapa, envías notificaciones a personas cercanas y obtienes métricas detalladas. $15 por evento o pack de 5x $54.',
          'Con Destacado duplicas tu visibilidad vs plan Básico: +100% boost, geofencing inteligente y analíticas en tiempo real. Perfecto para conciertos, talleres y eventos culturales.'
        ]
      };
    }
    
    if (m.includes('gratis') || m.includes('free') || m.includes('sin costo')) {
      return {
        reply: '¡Sí! Puedes publicar eventos GRATIS. El plan gratuito incluye: ver eventos ilimitados, guardar favoritos, recomendaciones IA y aparición en la pestaña Eventos. Para aparecer garantizado en el mapa necesitas plan Básico o superior.',
        variations: [
          'Plan Gratis: publica eventos sin costo, pero la aparición en mapa no está garantizada (solo si hay espacio). Sin notificaciones ni analíticas.',
          'Publicar es gratis, promocionar es desde $5. El plan gratuito te permite listar eventos, pero para visibilidad en mapa y notificaciones necesitas un plan de pago.'
        ]
      };
    }
    
    if (m.includes('pago') || m.includes('tarjeta') || m.includes('mercado pago') || m.includes('stripe')) {
      return {
        reply: 'Aceptamos tarjetas de crédito/débito (Visa, Mastercard, Amex) vía Stripe, y también Mercado Pago para Latinoamérica. Todos los pagos son seguros con encriptación PCI DSS Level 1. 🔒',
        variations: [
          'Métodos de pago: 💳 Tarjetas (Stripe) • 💰 Mercado Pago. Procesamos pagos de forma segura y recibes confirmación instantánea por email.',
          'Puedes pagar con cualquier tarjeta o usar Mercado Pago. Los datos de tarjeta nunca se almacenan en nuestros servidores, solo en los procesadores certificados.'
        ]
      };
    }
    
    if (m.includes('premium') || m.includes('mejor')) {
      return {
        reply: 'Plan Premium ($30): badge ⭐, máxima prioridad en mapa, +200% boost, notificaciones push a TODOS los usuarios, ventana emergencial promocional, dashboard avanzado de analíticas y estilo personalizado. Ideal para eventos masivos y corporativos.',
        variations: [
          'Premium es el plan top: tus eventos aparecen primero siempre, notificas a toda la base de usuarios y obtienes métricas avanzadas. Para eventos de 500+ personas.',
          'Con Premium triplicas tu alcance: todos los usuarios reciben notificación, tienes popup promocional y dashboard con exportación de datos. $30 evento o 5x $108.'
        ]
      };
    }
    
    if (m.includes('descuento') || m.includes('ahorro') || m.includes('pack')) {
      return {
        reply: '¡Sí! Pack de 3 eventos: 20% descuento. Pack de 5 eventos: 28% descuento (mejor precio). Aplica a todos los planes. Ej: 5 eventos Destacados = $54 en vez de $75. ¡Ahorras $21!',
        variations: [
          'Descuentos por volumen: 3 eventos -20% • 5 eventos -28%. Los paquetes no expiran, úsalos cuando quieras.',
          'Mejor oferta: pack 5x con 28% off. Básico 5x $18, Destacado 5x $54, Premium 5x $108. Perfecto para organizadores frecuentes.'
        ]
      };
    }
    
    // Respuesta por defecto
    return {
      reply: '👋 ¡Hola! Puedo ayudarte con información sobre planes, precios y pagos de EventRadar. ¿Qué te gustaría saber? Por ejemplo: "¿Cuánto cuesta el plan Destacado?" o "¿Qué métodos de pago aceptan?"\n\n💡 Si tu consulta requiere atención personalizada, escríbenos a: contactoempresa@eventradar.com',
      variations: [
        'Estoy aquí para ayudarte a elegir el mejor plan para tu evento. Pregúntame sobre precios, características o métodos de pago.\n\n📧 ¿Algo más específico? contactoempresa@eventradar.com',
        'Puedo resolver tus dudas sobre: planes y precios 💰, métodos de pago 💳, descuentos por paquetes 📦, y características de cada plan ✨\n\n👤 Para asistencia directa: contactoempresa@eventradar.com'
      ]
    };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          context: context,
          conversationHistory: messages.slice(-6)
        }),
        signal: AbortSignal.timeout(5000) // timeout 5s
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      const data = await response.json();

      const assistantMessage = {
        role: 'assistant',
        content: data.reply,
        sources: data.sources,
        variations: data.reply_variations,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Usar respuestas mock locales como fallback
      const mockResponse = getMockReply(messageToSend);
      
      const assistantMessage = {
        role: 'assistant',
        content: mockResponse.reply,
        variations: mockResponse.variations,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    '¿Cuánto cuesta el plan Destacado?',
    '¿Qué métodos de pago aceptan?',
    '¿Hay descuentos por paquetes?',
    '¿Qué incluye el plan Premium?'
  ];

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-gradient-to-br from-purple-900/95 via-purple-800/95 to-pink-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[80vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-400 to-pink-600 rounded-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Asistente EventRadar</h2>
                <p className="text-sm text-white/60">Respuestas instantáneas con IA</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-600 rounded-full flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-[75%] rounded-2xl p-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                      : message.isError
                      ? 'bg-red-500/20 border border-red-500/50 text-white'
                      : 'bg-white/10 backdrop-blur-sm text-white border border-white/10'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/20">
                      <p className="text-xs text-white/60 mb-1">Fuentes:</p>
                      <div className="flex flex-wrap gap-1">
                        {message.sources.map((source, idx) => (
                          <span key={idx} className="text-xs bg-white/10 px-2 py-0.5 rounded">
                            {source}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {message.variations && message.variations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/20">
                      <p className="text-xs text-white/60 mb-1">Variantes sugeridas (toca para editar):</p>
                      <div className="flex flex-col gap-2">
                        {message.variations.map((v, idx) => (
                          <button
                            key={idx}
                            onClick={() => { setInputMessage(v); inputRef.current?.focus(); }}
                            className="text-sm text-left p-2 rounded bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-white/40 mt-2">
                    {message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                )}
              </motion.div>
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3 justify-start"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-600 rounded-full flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                    <span className="text-sm text-white">Pensando...</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="px-6 pb-4">
              <p className="text-xs text-white/60 mb-2">Preguntas frecuentes:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors border border-white/20"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-6 border-t border-white/10">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu pregunta aquí..."
                disabled={isLoading}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-gray-500 disabled:to-gray-600 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Enviar
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-white/40 mt-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Impulsado por IA - Respuestas instantáneas sobre planes y pagos
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ChatbotModal;
