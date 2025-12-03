import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import aiService from '../services/aiService';
import { useNavigate } from 'react-router-dom';

/**
 * 🤖 AI EVENT ASSISTANT CHAT
 * Chat interactivo con IA para buscar eventos
 */
const AIAssistant = ({ events = [], isOpen, onClose, userPreferences = {} }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '¡Hola! 👋 Soy tu asistente de EventRadar. ¿Qué tipo de evento estás buscando hoy?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedEvents, setSuggestedEvents] = useState([]);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getMockEventReply = (message, availableEvents) => {
    const m = message.toLowerCase();
    
    // Detectar solicitud de contacto humano
    if (m.match(/(hablar con|contactar|supervisor|ejecutivo|humano|persona real|agente|ayuda humana|asistente humano)/)) {
      return '👤 ¡Claro! Si necesitas hablar con un asistente humano, contáctanos directamente:\n\n📧 Email: contactoempresa@eventradar.com\n\nNuestro equipo te ayudará personalmente. ¿Hay algo más que pueda hacer por ti mientras tanto?';
    }
    
    // Detectar búsqueda por ubicación
    if (m.match(/(valparaíso|valparaiso|viña del mar|viña|vina|quinta región|v región)/)) {
      const localEvents = availableEvents.filter(e => 
        e.location?.toLowerCase().includes('valparaíso') || 
        e.location?.toLowerCase().includes('viña') ||
        e.location?.toLowerCase().includes('valparaiso') ||
        e.location?.toLowerCase().includes('vina')
      );
      
      if (localEvents.length > 0) {
        return `📍 ¡Tengo ${localEvents.length} eventos en Valparaíso y Viña del Mar! Te recomiendo "${localEvents[0].title}" en ${localEvents[0].location}. Usa el mapa para ver todos los eventos cerca de ti. ¿Quieres que te cuente de alguno en específico?`;
      }
      return '📍 Hay muchos eventos en Valparaíso y Viña del Mar. Usa el mapa interactivo para explorar eventos cerca de ti o filtra por ubicación. ¿Buscas algo específico en la zona?';
    }
    
    // Detectar búsqueda de categorías específicas
    if (m.match(/(anime|manga|otaku|cosplay)/)) {
      const animeEvents = availableEvents.filter(e => 
        e.category?.toLowerCase().includes('anime') || 
        e.title?.toLowerCase().includes('anime') ||
        e.title?.toLowerCase().includes('manga')
      );
      
      if (animeEvents.length > 0) {
        return `🎌 ¡Hay ${animeEvents.length} eventos de anime/manga! "${animeEvents[0].title}" podría interesarte. ¿Eres fan de alguna serie en particular?`;
      }
      return '🎌 Filtra por categoría "Anime" para ver convenciones, proyecciones y eventos otaku. ¿Buscas algo específico como cosplay o proyecciones?';
    }
    
    // Detectar búsqueda por precio
    if (m.match(/(barato|económico|precio|costo|cuánto cuesta|cuanto cuesta)/)) {
      const affordableEvents = availableEvents.filter(e => !e.price || e.price === 0 || e.price < 5000);
      
      if (affordableEvents.length > 0) {
        return `💰 Encontré ${affordableEvents.length} eventos económicos. "${affordableEvents[0].title}" ${affordableEvents[0].price === 0 ? 'es gratis' : `cuesta $${affordableEvents[0].price}`}. Usa el filtro de precio para ajustar tu presupuesto.`;
      }
      return '💰 Usa el filtro de precio en la página de eventos para encontrar opciones que se ajusten a tu presupuesto. Hay eventos desde gratuitos hasta premium.';
    }
    
    // Detectar búsqueda por horario
    if (m.match(/(noche|nocturno|tarde|mañana|madrugada)/)) {
      if (m.includes('noche') || m.includes('nocturno')) {
        return '🌙 Para eventos nocturnos, revisa los horarios en cada evento. Muchos conciertos y fiestas comienzan después de las 20:00. ¿Buscas algo específico como música en vivo o fiestas?';
      }
      if (m.includes('tarde')) {
        return '🌆 Los eventos de tarde generalmente son de 15:00 a 20:00. Encuentra ferias gastronómicas, exposiciones y eventos familiares. ¿Qué tipo de evento te gustaría?';
      }
      return '🌅 Los eventos matutinos son perfectos para actividades al aire libre y deportes. Revisa el mapa para eventos temprano en el día.';
    }
    
    // Detectar búsqueda de eventos para niños/familia
    if (m.match(/(niños|niño|familia|familiar|infantil|kids)/)) {
      return '👨‍👩‍👧‍👦 Para eventos familiares, busca en categorías como "Gastronomía" (ferias), "Deportes" o eventos al aire libre. Muchos incluyen actividades para niños. ¿Buscas algo específico?';
    }
    
    // Detectar tecnología
    if (m.match(/(tecnología|tech|programación|software|hackathon|tecnológico)/)) {
      const techEvents = availableEvents.filter(e => 
        e.category?.toLowerCase().includes('tecnologia') ||
        e.category?.toLowerCase().includes('tech') ||
        e.title?.toLowerCase().includes('tech')
      );
      
      if (techEvents.length > 0) {
        return `💻 Hay ${techEvents.length} eventos tech. "${techEvents[0].title}" podría interesarte. Perfecto para desarrolladores y entusiastas de la tecnología.`;
      }
      return '💻 Los eventos de tecnología incluyen hackathons, charlas y workshops. Filtra por "Tecnología" para ver todas las opciones disponibles.';
    }
    
    if (m.includes('música') || m.includes('concierto') || m.includes('music')) {
      const musicEvents = availableEvents.filter(e => 
        e.event_categories?.name?.toLowerCase().includes('música') || 
        e.title?.toLowerCase().includes('música') ||
        e.title?.toLowerCase().includes('concierto')
      );
      
      if (musicEvents.length > 0) {
        return `🎵 Encontré ${musicEvents.length} eventos de música. Te recomiendo "${musicEvents[0].title}" - ${musicEvents[0].location}. ¿Quieres ver más opciones de música?`;
      }
      return '🎵 Los eventos de música son muy populares. Filtra por categoría "Música" en la página principal para ver todos los conciertos disponibles. ¿Te interesa algún género específico?';
    }
    
    if (m.includes('gratis') || m.includes('free') || m.includes('sin costo')) {
      const freeEvents = availableEvents.filter(e => e.price === 0 || e.price === '0');
      
      if (freeEvents.length > 0) {
        return `🎁 ¡Hay ${freeEvents.length} eventos gratuitos! Te sugiero "${freeEvents[0].title}". Usa el filtro de precio "$0" en la página principal para verlos todos.`;
      }
      return '🎁 Para eventos gratuitos, usa el filtro de precio y selecciona "$0". ¡Siempre hay eventos sin costo disponibles!';
    }
    
    if (m.includes('hoy') || m.includes('today')) {
      const today = new Date().toISOString().split('T')[0];
      const todayEvents = availableEvents.filter(e => e.date?.startsWith(today));
      
      if (todayEvents.length > 0) {
        return `📅 ¡Hay ${todayEvents.length} eventos hoy! "${todayEvents[0].title}" en ${todayEvents[0].location}. ¿Quieres más detalles?`;
      }
      return '📅 Para eventos de hoy, usa el filtro de fecha en la página principal. ¡Revisa qué está pasando ahora!';
    }
    
    if (m.includes('fin de semana') || m.includes('weekend') || m.includes('sábado') || m.includes('domingo')) {
      return '🎉 Los fines de semana están llenos de eventos. Usa el filtro de fecha para ver todo lo disponible para sábado y domingo. ¿Prefieres eventos de día o de noche?';
    }
    
    if (m.includes('deporte') || m.includes('fútbol') || m.includes('basketball') || m.includes('sport')) {
      const sportEvents = availableEvents.filter(e => 
        e.event_categories?.name?.toLowerCase().includes('deporte') ||
        e.title?.toLowerCase().includes('deporte') ||
        e.title?.toLowerCase().includes('fútbol')
      );
      
      if (sportEvents.length > 0) {
        return `⚽ Hay ${sportEvents.length} eventos deportivos. "${sportEvents[0].title}" podría interesarte. Filtra por "Deportes" para ver partidos y torneos.`;
      }
      return '⚽ Revisa la categoría "Deportes" para ver partidos, torneos y actividades deportivas. ¿Buscas algo específico como fútbol o basketball?';
    }
    
    if (m.includes('gastronomía') || m.includes('comida') || m.includes('food') || m.includes('restaurant')) {
      const foodEvents = availableEvents.filter(e => 
        e.event_categories?.name?.toLowerCase().includes('gastronomía') ||
        e.title?.toLowerCase().includes('gastronóm')
      );
      
      if (foodEvents.length > 0) {
        return `🍽️ Tengo ${foodEvents.length} eventos gastronómicos. "${foodEvents[0].title}" se ve delicioso. ¿Quieres conocer más opciones culinarias?`;
      }
      return '🍽️ Los eventos gastronómicos están en la categoría "Gastronomía". Encuentra festivales de comida, catas y experiencias culinarias. ¿Alguna cocina en particular?';
    }
    
    if (m.includes('arte') || m.includes('art') || m.includes('exposición')) {
      return '🎨 Los eventos de arte están en pleno auge. Filtra por "Arte" para ver exposiciones, galerías y talleres creativos. ¿Prefieres arte contemporáneo o clásico?';
    }
    
    // Detectar consultas sobre clima/temporada
    if (m.match(/(clima|lluvia|sol|verano|invierno)/)) {
      return '☀️ Te recomiendo revisar el clima antes de asistir a eventos al aire libre. Muchos eventos tienen alternativas bajo techo. ¿Buscas eventos indoor o outdoor?';
    }
    
    // Detectar consultas sobre transporte/estacionamiento
    if (m.match(/(transporte|estacionamiento|parking|cómo llegar|como llegar|metro|bus)/)) {
      return '🚗 Usa el botón "Ir ahora" en cada evento para abrir Waze, Google Maps o Uber y navegar fácilmente. ¡Te llevamos directo al evento!';
    }
    
    // Detectar consultas sobre entradas/tickets
    if (m.match(/(entrada|ticket|boleto|comprar|reservar)/)) {
      return '🎫 Los detalles de entradas están en cada evento. Algunos son de entrada libre y otros requieren compra anticipada. ¿Buscas un evento específico?';
    }
    
    // Detectar consultas sobre comida/bebida
    if (m.match(/(comer|beber|restaurant|bar|cerveza|vino)/)) {
      return '🍽️ Muchos eventos incluyen opciones gastronómicas. Revisa la categoría "Gastronomía" para festivales de comida, catas y experiencias culinarias. ¿Algún tipo de cocina en particular?';
    }
    
    // Detectar consultas sobre música en vivo
    if (m.match(/(música en vivo|musica en vivo|banda|banda en vivo|show en vivo)/)) {
      const liveEvents = availableEvents.filter(e => 
        e.title?.toLowerCase().includes('vivo') ||
        e.title?.toLowerCase().includes('concierto') ||
        e.category?.toLowerCase().includes('música')
      );
      
      if (liveEvents.length > 0) {
        return `🎸 ¡Hay ${liveEvents.length} eventos con música en vivo! "${liveEvents[0].title}" tiene muy buena pinta. ¿Qué género musical prefieres?`;
      }
      return '🎸 Para música en vivo, filtra por "Música" o "Conciertos". Siempre hay bandas tocando en la región. ¿Rock, pop, jazz?';
    }
    
    // Detectar días de la semana específicos
    if (m.match(/(lunes|martes|miércoles|miercoles|jueves|viernes)/)) {
      const dayMatch = m.match(/(lunes|martes|miércoles|miercoles|jueves|viernes)/);
      const day = dayMatch ? dayMatch[0] : '';
      return `📆 Para eventos del ${day}, usa el filtro de fecha en la página principal. Muchos lugares tienen promociones entre semana. ¿Buscas algo en particular?`;
    }
    
    // Detectar consultas sobre actividades específicas
    if (m.match(/(taller|workshop|curso|clase|aprender)/)) {
      return '📚 Los talleres y workshops suelen estar en categorías como "Arte", "Tecnología" o eventos especiales. ¿Qué te gustaría aprender?';
    }
    
    // Detectar consultas sobre grupos/edad
    if (m.match(/(adulto|mayor|tercera edad|senior)/)) {
      return '👴 Hay eventos para todas las edades. Muchas exposiciones, conciertos y eventos culturales son ideales para adultos mayores. ¿Algún interés en particular?';
    }
    
    // Detectar consultas sobre mascotas
    if (m.match(/(mascota|perro|pet|dog friendly)/)) {
      return '🐕 Algunos eventos al aire libre admiten mascotas. Revisa la descripción de cada evento para confirmar si son pet-friendly. ¿Buscas un evento específico?';
    }
    
    // Respuesta por defecto con sugerencias
    const suggestions = [];
    if (availableEvents.length > 0) {
      suggestions.push(`"${availableEvents[0].title}"`);
      if (availableEvents.length > 1) suggestions.push(`"${availableEvents[1].title}"`);
    }
    
    if (suggestions.length > 0) {
      return `👋 Puedo ayudarte a encontrar eventos. Algunos populares: ${suggestions.join(', ')}. Prueba buscar por categoría (música, deportes, arte, gastronomía) o pregúntame sobre eventos gratuitos, de hoy, o del fin de semana.\n\n📧 ¿Necesitas ayuda específica? Contáctanos: contactoempresa@eventradar.com`;
    }
    
    return '👋 ¡Hola! Puedo ayudarte a encontrar eventos. Prueba preguntando por:\n🎵 Música o conciertos\n⚽ Deportes\n🎨 Arte\n🍽️ Gastronomía\n🎁 Eventos gratuitos\n📅 Eventos de hoy o del fin de semana\n\n¿Qué te interesa?\n\n💡 Si no encuentro lo que buscas, escríbenos a: contactoempresa@eventradar.com';
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Agregar mensaje del usuario
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
      // Llamar a la IA
      console.log('[AIAssistant] Enviando mensaje a IA:', messageToSend);
      console.log('[AIAssistant] Eventos disponibles:', events.length);
      
      const response = await aiService.chatWithAssistant(
        messageToSend,
        events,
        userPreferences
      );

      console.log('[AIAssistant] Respuesta de IA:', response);

      // Agregar respuesta de la IA
      const assistantMessage = {
        role: 'assistant',
        content: response.message || response.reply || (response.description || ''),
        suggestedEvents: response.suggestedEvents || [],
        timestamp: new Date(),
        variations: response.variants || response.descriptions || null
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Guardar eventos sugeridos
      if (response.suggestedEvents && response.suggestedEvents.length > 0) {
        const suggested = events.filter(e => 
          response.suggestedEvents.includes(e.id)
        );
        setSuggestedEvents(suggested);
      }
      // Si hay variaciones de descripción, abrir UI para elegir
      if (assistantMessage.variations && assistantMessage.variations.length > 0) {
        // Insert a system message prompting user to choose one
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'He generado varias versiones. Puedes tocar una para copiarla al cuadro de texto y editarla antes de publicar.',
          timestamp: new Date()
        }]);
      }

    } catch (error) {
      console.error('[AIAssistant] Error en chat:', error);
      
      // Usar respuesta mock local como fallback
      const mockReply = getMockEventReply(messageToSend, events);
      
      const assistantMessage = {
        role: 'assistant',
        content: mockReply,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    setInputMessage(action);
  };

  const handleEventClick = (eventId) => {
    navigate(`/events/${eventId}`);
    onClose && onClose();
  };

  const quickActions = [
    '🎵 Eventos de música este fin de semana',
    '🎨 Eventos de arte gratis',
    '⚽ Eventos deportivos en Santiago',
    '🍕 Eventos gastronómicos'
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-end md:items-center justify-center md:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full md:max-w-2xl h-full md:h-[600px] bg-gradient-to-br from-purple-900/95 via-indigo-900/95 to-blue-900/95 backdrop-blur-xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col border-t md:border border-white/20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 md:p-6 flex items-center justify-between border-b border-white/20 safe-area-top">
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-pulse flex-shrink-0">
                <Bot className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                  <span className="truncate">EventAssistant</span>
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-yellow-300 animate-pulse flex-shrink-0" />
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-xs md:text-sm text-white/80 truncate">
                    Powered by {aiService.getModelName()}
                  </p>
                  {aiService.isConfigured() && (
                    <span className={`
                      text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full font-semibold whitespace-nowrap flex-shrink-0
                      ${aiService.getProvider() === 'gemini' ? 'bg-green-500/20 text-green-300 border border-green-400/30' : ''}
                      ${aiService.getProvider() === 'deepseek' ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' : ''}
                      ${aiService.getProvider() === 'openai' ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30' : ''}
                    `}>
                      {aiService.getProvider() === 'gemini' && '✨ Gemini'}
                      {aiService.getProvider() === 'deepseek' && '🚀 DeepSeek'}
                      {aiService.getProvider() === 'openai' && '🤖 OpenAI'}
                    </span>
                  )}
                  {!aiService.isConfigured() && (
                    <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-400/30 whitespace-nowrap flex-shrink-0">
                      ⚠️ No configurado
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 md:p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors active:scale-95 ml-2 flex-shrink-0"
              aria-label="Cerrar chat"
            >
              <X className="w-5 h-5 md:w-5 md:h-5 text-white" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'bg-white/10 backdrop-blur-sm text-white border border-white/20'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  
                  {/* Eventos sugeridos */}
                  {message.suggestedEvents && message.suggestedEvents.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/20 space-y-2">
                      <p className="text-xs font-semibold text-white/80">Eventos sugeridos:</p>
                      {events.filter(e => message.suggestedEvents.includes(e.id)).map(event => (
                        <button
                          key={event.id}
                          onClick={() => handleEventClick(event.id)}
                          className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                        >
                          <p className="text-sm font-semibold text-white">{event.title}</p>
                          <p className="text-xs text-white/70">
                            {event.event_categories?.name} • ${event.price}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-white/50 mt-2">
                    {message.timestamp.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 2 && (
            <div className="px-6 pb-4">
              <p className="text-xs text-white/60 mb-2">Acciones rápidas:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-xs text-white transition-colors border border-white/20"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-6 border-t border-white/20 bg-black/20">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Escribe tu pregunta sobre eventos..."
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 backdrop-blur-sm"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIAssistant;
