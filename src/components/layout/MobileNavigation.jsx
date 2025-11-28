import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Sparkles, Calendar, DollarSign, Plus, Briefcase, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatbotModal from '../ChatbotModal';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
// import SwiperCore, { FreeMode, Navigation } from 'swiper';

/**
 * 📱 NAVEGACIÓN MÓVIL INFERIOR - Estilo Uber
 * Orden de pestañas basado en la segunda imagen (Uber):
 * 1. Mapa (Inicio/Home)
 * 2. Explorar (Avión - similar a "Ganancias" en Uber)
 * 3. Eventos (Calendario)
 * 4. Suscripción/Premium ($ - similar a "Bandeja de entrada")
 * 5. Crear (+)
 * 6. Favoritos (Maleta - similar a "Menú")
 */
const MobileNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [showBot, setShowBot] = useState(false);

  const navItems = [
    {
      id: 'mapa',
      label: 'Mapa',
      icon: MapPin,
      onClick: () => navigate('/dashboard', { state: { activeTab: 'mapa' } }),
      activeColor: 'text-purple-500'
    },
    {
      id: 'parati',
      label: 'Para ti',
      icon: Sparkles,
      onClick: () => navigate('/dashboard', { state: { activeTab: 'parati' } }),
      activeColor: 'text-blue-500'
    },
    {
      id: 'eventos',
      label: 'Eventos',
      icon: Calendar,
      onClick: () => navigate('/dashboard', { state: { activeTab: 'eventos' } }),
      activeColor: 'text-green-500'
    },
    {
      id: 'suscripcion',
      label: 'Suscripción',
      icon: DollarSign,
      onClick: () => navigate('/dashboard', { state: { activeTab: 'suscripcion' } }),
      activeColor: 'text-yellow-500',
      badge: null
    },
    {
      id: 'crear',
      label: 'Crear',
      icon: Plus,
      onClick: () => navigate('/dashboard', { state: { activeTab: 'crear' } }),
      activeColor: 'text-pink-500',
      isPrimary: true
    },
    {
      id: 'favoritos',
      label: 'Favoritos',
      icon: Briefcase,
      onClick: () => navigate('/dashboard', { state: { activeTab: 'favoritos' } }),
      activeColor: 'text-indigo-500',
      badge: null
    },
    {
      id: 'perfil',
      label: 'Perfil',
      icon: User,
      onClick: () => navigate('/profile'),
      activeColor: 'text-gray-500',
    },
    {
      id: 'bot',
      label: 'Asistente',
      icon: Bot,
      onClick: () => setShowBot(true),
      activeColor: 'text-cyan-500',
      isBot: true
    }
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 border-t border-white/10 pb-safe">
        <Swiper
          slidesPerView={4.2}
          spaceBetween={8}
          loop={true}
          freeMode={true}
          className="w-full px-2 py-2 max-w-screen-xl mx-auto"
        >
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = item.path ? isActive(item.path) : false;
            return (
              <SwiperSlide key={item.id} className="!w-auto">
                <button
                  onClick={item.onClick}
                  className={`flex flex-col items-center justify-center ${item.isPrimary ? 'relative -mt-6' : ''} py-1 px-3 rounded-lg transition-all min-w-[64px]`}
                  style={{ minWidth: 64 }}
                >
                  <div className={item.isPrimary ? 'bg-gradient-to-br from-pink-500 to-purple-600 rounded-full p-4 shadow-xl' : 'relative'}>
                    <Icon className={`w-6 h-6 ${item.isBot ? 'text-cyan-400' : item.isPrimary ? 'text-white' : active ? item.activeColor : 'text-gray-400'}`} strokeWidth={item.isPrimary ? 2.5 : active ? 2.5 : 2} />
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${item.isBot ? 'text-cyan-400' : item.isPrimary ? 'text-white' : active ? item.activeColor : 'text-gray-400'} ${item.isPrimary ? 'absolute -bottom-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap' : ''}`}>{item.label}</span>
                  {active && !item.isPrimary && !item.isBot && (
                    <motion.div layoutId="activeTab" className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                  )}
                </button>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </nav>
      <AnimatePresence>
        {showBot && (
          <ChatbotModal isOpen={showBot} onClose={() => setShowBot(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNavigation;
