// Mock responses inteligentes y conversacionales para el chatbot de eventos

export function getMockResponse(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  
  // Detección de solicitud de contacto humano
  if (lowerMessage.match(/(hablar con|contactar|supervisor|ejecutivo|humano|persona real|agente|ayuda humana|asistente humano)/)) {
    return '👤 ¡Por supuesto! Si necesitas hablar con un asistente humano, puedes contactarnos directamente:\n\n📧 Email: contactoempresa@eventradar.com\n\nNuestro equipo te responderá lo antes posible para ayudarte con tu consulta. ¿Hay algo más en lo que pueda ayudarte mientras tanto?';
  }
  
  // Respuestas a saludos y despedidas
  if (lowerMessage.match(/^(hola|hey|hi|buenas|buenos días|buenas tardes|buenas noches)$/)) {
    const greetings = [
      '¡Hola! 👋 Soy tu asistente de eventos. ¿Buscas algo de música, deportes, arte o gastronomía? ¡Dime qué te interesa!',
      '¡Hey! 😊 ¿Qué tipo de eventos te gustaría descubrir hoy? Tenemos de todo: conciertos, deportes, arte y más.',
      '¡Buenas! 🎉 Estoy aquí para ayudarte a encontrar el evento perfecto. ¿Qué te apetece hacer?'
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  
  if (lowerMessage.match(/(gracias|thank you|thanks|genial|perfecto|excelente|ok|vale)/)) {
    const thanks = [
      '¡De nada! 😊 Si necesitas ayuda con algo más, aquí estoy. ¿Te gustaría explorar otra categoría?',
      '¡Un placer ayudarte! 🎉 No dudes en preguntarme lo que necesites sobre eventos.',
      '¡Para eso estoy! ✨ ¿Hay algo más que quieras saber sobre los eventos disponibles?',
      '¡Encantado de ayudar! 🙌 Si buscas algo específico, solo dímelo.'
    ];
    return thanks[Math.floor(Math.random() * thanks.length)];
  }
  
  if (lowerMessage.match(/(adiós|chao|bye|hasta luego|nos vemos)/)) {
    const goodbyes = [
      '¡Hasta pronto! 👋 Que disfrutes los eventos. ¡Vuelve cuando quieras!',
      '¡Nos vemos! 🎉 Espero que encuentres eventos increíbles.',
      '¡Chao! ✨ Aquí estaré cuando me necesites. ¡Diviértete!'
    ];
    return goodbyes[Math.floor(Math.random() * goodbyes.length)];
  }
  
  // Respuestas por categorías
  if (lowerMessage.includes('música') || lowerMessage.includes('concierto') || lowerMessage.includes('music')) {
    const responses = [
      '🎵 ¡La música es vida! Tenemos desde rock hasta jazz, pop y música electrónica. Filtra por "Música" en la página principal y encuentra tu concierto ideal. ¿Algún género favorito?',
      '🎸 ¡Eventos musicales al poder! Te recomiendo revisar los conciertos disponibles. Hay opciones para todos los gustos: indie, clásica, urbana... ¿Qué estilo prefieres?',
      '🎶 ¡Música para los oídos! Encuentra conciertos, festivales y recitales en la categoría "Música". ¿Buscas algo en especial?'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('deporte') || lowerMessage.includes('fútbol') || lowerMessage.includes('basketball') || lowerMessage.includes('sport')) {
    const responses = [
      '⚽ ¡A darle con todo! Tenemos partidos, torneos y competencias deportivas. Filtra por "Deportes" para ver todo. ¿Fútbol, basketball, running?',
      '🏃‍♂️ ¡El deporte te llama! Desde partidos profesionales hasta maratones locales. ¿Qué deporte te apasiona?',
      '🏀 ¡Eventos deportivos emocionantes! Encuentra partidos en vivo, torneos y actividades. ¿Prefieres verlos o participar?'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('gratis') || lowerMessage.includes('free') || lowerMessage.includes('sin costo') || lowerMessage.includes('barato')) {
    const responses = [
      '🎁 ¡Eventos sin gastar! Usa el filtro de precio "$0" para ver todo lo gratuito. Siempre hay opciones increíbles que no cuestan nada. ¿Alguna categoría en particular?',
      '💰 ¡Diversión gratis! Tenemos eventos culturales, talleres y actividades que no cuestan un peso. Filtra por precio "0" y descúbrelos.',
      '🆓 ¡Lo mejor de la vida es gratis! Encuentra conciertos al aire libre, exposiciones y más sin costo. ¿Qué te gustaría hacer?'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('hoy') || lowerMessage.includes('today') || lowerMessage.includes('ahora')) {
    const responses = [
      '📅 ¡Eventos para hoy! Usa el filtro de fecha para ver qué está pasando ahora mismo. ¡Siempre hay algo emocionante!',
      '🕐 ¡Acción inmediata! Filtra por "Hoy" y descubre eventos que están sucediendo en este momento. ¿Indoor o outdoor?',
      '⚡ ¡No esperes más! Revisa los eventos de hoy y sal a disfrutar. ¡La ciudad está viva!'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  if (lowerMessage.includes('fin de semana') || lowerMessage.includes('weekend') || lowerMessage.includes('sábado') || lowerMessage.includes('domingo')) {
    const responses = [
      '🎉 ¡Fin de semana épico! Los sábados y domingos están llenos de eventos. Usa los filtros de fecha para ver todo. ¿Planes de día o de noche?',
      '🌟 ¡Weekend mode ON! Encuentra festivales, conciertos y actividades para sábado y domingo. ¿Qué te apetece hacer?',
      '🎊 ¡El fin de semana te espera! Hay eventos increíbles ambos días. Filtra por fecha y descubre tus opciones.'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('arte') || lowerMessage.includes('art') || lowerMessage.includes('exposición') || lowerMessage.includes('galería')) {
    const responses = [
      '🎨 ¡El arte te inspira! Tenemos exposiciones, galerías, talleres creativos y más. Filtra por "Arte" y sumérgete en la cultura. ¿Contemporáneo o clásico?',
      '🖼️ ¡Eventos artísticos únicos! Desde arte callejero hasta museos. ¿Buscas ver o crear?',
      '✨ ¡Creatividad en acción! Encuentra exposiciones de pintura, escultura, fotografía y más. ¿Qué estilo te gusta?'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('gastronomía') || lowerMessage.includes('comida') || lowerMessage.includes('food') || lowerMessage.includes('restaurant') || lowerMessage.includes('comer')) {
    const responses = [
      '🍽️ ¡Delicias gastronómicas! Festivales de comida, catas de vino, clases de cocina... Filtra por "Gastronomía" y prepara el apetito. ¿Qué cocina te gusta?',
      '🍕 ¡Eventos para foodies! Desde food trucks hasta cenas temáticas. ¿Dulce o salado? ¿Internacional o local?',
      '🍷 ¡Experiencias culinarias! Encuentra degustaciones, talleres y festivales gastronómicos. ¿Prefieres aprender o solo disfrutar?'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('tecnología') || lowerMessage.includes('tech') || lowerMessage.includes('coding') || lowerMessage.includes('hackathon')) {
    const responses = [
      '💻 ¡Eventos tech! Hackathons, charlas de innovación, workshops de programación. Filtra por "Tecnología" y conecta con la comunidad tech.',
      '🚀 ¡Innovación y código! Encuentra meetups, conferencias y talleres tecnológicos. ¿Desarrollo, IA, blockchain?',
      '⚡ ¡El futuro está aquí! Eventos de startups, tech talks y competencias de programación. ¿Qué te interesa?'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('niños') || lowerMessage.includes('familia') || lowerMessage.includes('kids') || lowerMessage.includes('family')) {
    const responses = [
      '👨‍👩‍👧‍👦 ¡Diversión familiar! Busca eventos aptos para todas las edades. Teatros infantiles, parques temáticos, talleres creativos... ¿Cuántos años tienen los peques?',
      '🎈 ¡Eventos para toda la familia! Desde cuentacuentos hasta festivales al aire libre. ¿Algo educativo o pura diversión?',
      '🧒 ¡Actividades para niños! Encuentra opciones divertidas y seguras para los más pequeños. ¿Indoor o outdoor?'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('noche') || lowerMessage.includes('night') || lowerMessage.includes('fiesta') || lowerMessage.includes('party')) {
    const responses = [
      '🌙 ¡La noche es joven! Fiestas, conciertos nocturnos, eventos en bares y clubes. ¿Buscas bailar o algo más relajado?',
      '🎉 ¡Eventos nocturnos! Desde after-office hasta raves. ¿Qué vibra buscas esta noche?',
      '✨ ¡Diversión nocturna! Encuentra fiestas temáticas, DJ sets y eventos bajo las estrellas. ¿Con amigos o para conocer gente nueva?'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('pareja') || lowerMessage.includes('romántico') || lowerMessage.includes('date') || lowerMessage.includes('cita')) {
    const responses = [
      '💕 ¡Plan romántico! Cenas con música en vivo, paseos culturales, cine bajo las estrellas... ¿Qué les gusta hacer juntos?',
      '🌹 ¡Eventos para dos! Desde íntimos conciertos hasta aventuras gastronómicas. ¿Primera cita o aniversario?',
      '❤️ ¡Momentos especiales! Encuentra eventos perfectos para parejas: teatro, arte, gastronomía... ¿Algo sorpresa?'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('cerca') || lowerMessage.includes('cerca de mí') || lowerMessage.includes('nearby') || lowerMessage.includes('zona')) {
    const responses = [
      '📍 ¡Eventos cerca de ti! Activa la ubicación o busca por tu zona. ¿En qué comuna o barrio estás?',
      '🗺️ ¡Lo mejor de tu zona! Filtra por ubicación para ver eventos cercanos. ¿Centro, sur, norte, oriente?',
      '🎯 ¡Eventos a la vuelta de la esquina! Dime tu ubicación y te muestro qué hay cerca.'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('recomien') || lowerMessage.includes('suger') || lowerMessage.includes('qué hacer')) {
    const responses = [
      '🌟 ¡Te ayudo a decidir! Dime: ¿prefieres indoor o outdoor? ¿De día o de noche? ¿Solo, con amigos o en pareja?',
      '💡 ¡Recomendaciones personalizadas! Cuéntame más: ¿qué te gusta hacer en tu tiempo libre? ¿Música, deportes, cultura?',
      '🎭 ¡Encuentra tu evento ideal! ¿Eres más de acción, relax o aventura? Dime y te sugiero opciones perfectas.'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Respuesta por defecto con más personalidad
  const defaultResponses = [
    '👋 ¡Hola! Soy tu asistente personal de eventos. Puedo ayudarte con:\n\n🎵 Música y conciertos\n⚽ Deportes y actividades\n🎨 Arte y cultura\n🍽️ Gastronomía\n🎁 Eventos gratuitos\n📅 Planes para hoy o el fin de semana\n\n¿Qué te apetece hacer? ¡Solo pregunta!\n\n💡 Si necesitas ayuda personalizada, escríbenos a: contactoempresa@eventradar.com',
    '✨ ¡Aquí estoy para ayudarte! Puedo recomendarte:\n\n🎶 Conciertos y festivales\n🏃‍♂️ Eventos deportivos\n🖼️ Exposiciones de arte\n🍕 Experiencias gastronómicas\n💰 Opciones gratis\n🌟 Planes especiales\n\nCuéntame, ¿qué buscas?\n\n📧 ¿Necesitas asistencia directa? contactoempresa@eventradar.com',
    '🎉 ¡Hola! Estoy aquí para que encuentres el plan perfecto. Dime qué te interesa:\n\n🎸 Música\n⚡ Deportes\n🎭 Arte y cultura  \n🍷 Comida y bebida\n🎁 Eventos sin costo\n📆 Hoy, mañana o fin de semana\n\n¿Por dónde empezamos?\n\n👤 Para consultas especiales: contactoempresa@eventradar.com'
  ];
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}
