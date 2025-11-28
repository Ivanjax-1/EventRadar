import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, X, Sparkles, Flame, Star, Zap, 
  TrendingUp, Bell, MapPin, BarChart3, 
  Eye, Target, Gift, ArrowRight, ChevronDown,
  ShoppingCart, CreditCard, Package, MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import ChatbotModal from '../components/ChatbotModal';
import PaymentModal from '../components/PaymentModal';

const PricingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTier, setSelectedTier] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState('single'); // 'single', 'pack_3', 'pack_5'
  const [showComparison, setShowComparison] = useState(false);
  const [pricingData, setPricingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);

  // Cargar precios desde la base de datos
  useEffect(() => {
    loadPricingData();
  }, []);

  const loadPricingData = async () => {
    try {
      const { data, error } = await supabase
        .from('promotion_pricing')
        .select('*')
        .eq('is_active', true)
        .order('single_price', { ascending: true });

      if (error) throw error;

      setPricingData(data);
    } catch (error) {
      console.error('Error loading pricing:', error);
      // Fallback a datos estáticos
      setPricingData(defaultPricingData);
    } finally {
      setLoading(false);
    }
  };

  // Datos por defecto si falla la carga desde BD
  const defaultPricingData = [
    {
      tier: 'basic',
      single_price: 5,
      pack_3_price: 12,
      pack_3_discount: 20,
      pack_5_price: 18,
      pack_5_discount: 28,
      badge_icon: '✨',
      badge_text: 'Patrocinado',
      description: 'Evento básico - Aparece en mapa con prioridad media'
    },
    {
      tier: 'featured',
      single_price: 15,
      pack_3_price: 36,
      pack_3_discount: 20,
      pack_5_price: 54,
      pack_5_discount: 28,
      badge_icon: '🔥',
      badge_text: 'Destacado',
      description: 'Evento destacado - Siempre visible, notificación push'
    },
    {
      tier: 'premium',
      single_price: 30,
      pack_3_price: 72,
      pack_3_discount: 20,
      pack_5_price: 108,
      pack_5_discount: 28,
      badge_icon: '⭐',
      badge_text: 'Premium',
      description: 'Evento premium - Máxima visibilidad y analíticas'
    }
  ];

  const tiers = {
    free: {
      name: 'Gratis',
      icon: Eye,
      gradient: 'from-gray-400 to-gray-600',
      popular: false,
      features: [
        { text: 'Ver eventos ilimitados', included: true },
        { text: 'Guardar favoritos', included: true },
        { text: 'Recomendaciones IA', included: true },
        { text: 'Aparece en pestaña Eventos', included: true },
        { text: 'Aparece en mapa', included: false, note: 'Solo si hay espacio' },
        { text: 'Notificaciones push', included: false },
        { text: 'Posición destacada', included: false },
        { text: 'Analíticas', included: false },
      ]
    },
    basic: {
      name: 'Básico',
      icon: Sparkles,
      gradient: 'from-blue-400 to-purple-600',
      popular: false,
      features: [
        { text: 'Todo lo de Gratuito', included: true },
        { text: 'Badge "Patrocinado"', included: true },
        { text: 'Aparece en mapa garantizado', included: true },
        { text: '+20% boost en recomendaciones', included: true },
        { text: 'Prioridad media en listados', included: true },
        { text: 'Notificaciones push', included: false },
        { text: 'Analíticas avanzadas', included: false },
        { text: 'Estilo personalizado', included: false },
      ]
    },
    featured: {
      name: 'Destacado',
      icon: Flame,
      gradient: 'from-orange-400 to-red-600',
      popular: true,
      features: [
        { text: 'Todo lo de Básico', included: true },
        { text: 'Badge "Destacado" 🔥', included: true },
        { text: 'Siempre visible en mapa', included: true },
        { text: '+100% boost en recomendaciones', included: true },
        { text: 'Top 5 en lista de eventos', included: true },
        { text: 'Notificación push a usuarios cercanos', included: true },
        { text: 'Aparece en carrusel principal', included: true },
        { text: 'Analíticas completas', included: true },
        { text: 'Geofencing inteligente', included: true },
      ]
    },
    premium: {
      name: 'Premium',
      icon: Star,
      gradient: 'from-yellow-400 to-amber-600',
      popular: false,
      features: [
        { text: 'Todo lo de Destacado', included: true },
        { text: 'Badge "Premium" ⭐', included: true },
        { text: 'Máxima prioridad en mapa', included: true },
        { text: '+200% boost en recomendaciones', included: true },
        { text: 'Fijado en primera posición', included: true },
        { text: 'Notificación push a TODOS los usuarios', included: true },
        { text: 'Ventana emergente promocional', included: true },
        { text: 'Dashboard analíticas avanzadas', included: true },
        { text: 'Colores y estilo personalizado', included: true },
        { text: 'Geofencing + retargeting', included: true },
      ]
    }
  };

  const calculatePrice = (tierData, packageType) => {
    if (!tierData) return 0;
    
    switch (packageType) {
      case 'pack_3':
        return tierData.pack_3_price;
      case 'pack_5':
        return tierData.pack_5_price;
      default:
        return tierData.single_price;
    }
  };

  const calculateDiscount = (tierData, packageType) => {
    if (!tierData) return 0;
    
    switch (packageType) {
      case 'pack_3':
        return tierData.pack_3_discount;
      case 'pack_5':
        return tierData.pack_5_discount;
      default:
        return 0;
    }
  };

  const handleSelectPlan = (tier, packageType) => {
    if (!user) {
      navigate('/auth/login', { state: { returnTo: '/pricing' } });
      return;
    }

    setSelectedTier(tier);
    setSelectedPackage(packageType);
    
    // Preparar detalles del pago
    const tierData = pricingData?.find(p => p.tier === tier);
    const price = calculatePrice(tierData, packageType);
    const tierInfo = tiers[tier];
    
    setPaymentDetails({
      tier,
      tierName: tierInfo.name,
      packageType,
      amount: price
    });
    
    // Abrir modal de pago
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (data) => {
    console.log('✅ Pago completado:', data);
    
    // Aquí guardarías la suscripción en la base de datos
    // Por ahora solo mostramos un mensaje de éxito
    alert(`¡Gracias por tu compra! Tu plan ${data.tier} ha sido activado.`);
    
    // Redirigir al dashboard o eventos
    navigate('/dashboard');
  };

  const PackageSelector = ({ tierKey, tierData }) => {
    const packages = [
      {
        type: 'single',
        name: '1 Evento',
        price: tierData?.single_price || 0,
        discount: 0,
        description: 'Pago único'
      },
      {
        type: 'pack_3',
        name: 'Pack 3 Eventos',
        price: tierData?.pack_3_price || 0,
        discount: tierData?.pack_3_discount || 20,
        description: 'Ahorra 20%',
        badge: 'Oferta'
      },
      {
        type: 'pack_5',
        name: 'Pack 5 Eventos',
        price: tierData?.pack_5_price || 0,
        discount: tierData?.pack_5_discount || 28,
        description: 'Ahorra 28%',
        badge: 'Mejor Precio',
        recommended: true
      }
    ];

    return (
      <div className="space-y-2">
        {packages.map((pkg) => (
          <motion.button
            key={pkg.type}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectPlan(tierKey, pkg.type)}
            className={`
              w-full p-3 rounded-lg border-2 text-left
              transition-all relative overflow-hidden
              ${pkg.recommended 
                ? 'border-yellow-400 bg-yellow-500/10' 
                : 'border-white/10 bg-white/5 hover:bg-white/10'
              }
            `}
          >
            {pkg.badge && (
              <div className="absolute top-2 right-2 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-full text-[10px] font-bold text-white">
                {pkg.badge}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-white flex items-center gap-2">
                  {pkg.name}
                  {pkg.discount > 0 && (
                    <span className="text-xs text-green-400">-{pkg.discount}%</span>
                  )}
                </div>
                <div className="text-xs text-white/60">{pkg.description}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-white">
                  ${pkg.price}
                </div>
                {pkg.discount > 0 && (
                  <div className="text-xs text-white/40 line-through">
                    ${Math.round(pkg.price / (1 - pkg.discount / 100))}
                  </div>
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando planes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold text-white mb-4">
            Destaca tu Evento
          </h1>
          <p className="text-xl text-white/80 mb-8">
            Aumenta la visibilidad y asistencia con nuestros planes promocionales
          </p>
          
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all"
          >
            <BarChart3 className="h-5 w-5" />
            Ver comparación detallada
            <ChevronDown className={`h-5 w-5 transition-transform ${showComparison ? 'rotate-180' : ''}`} />
          </button>
        </motion.div>

        {/* Tabla de comparación */}
        <AnimatePresence>
          {showComparison && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-16 overflow-hidden"
            >
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 overflow-x-auto">
                {/* Tabla de comparación aquí */}
                <p className="text-white/60 text-center">Tabla de comparación detallada</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid de planes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(tiers).map(([key, tier], index) => {
            const Icon = tier.icon;
            const tierData = pricingData?.find(p => p.tier === key);
            const isPopular = tier.popular;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 border-2
                  ${isPopular ? 'border-orange-400 scale-105' : 'border-white/10'}
                `}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-orange-400 to-red-600 rounded-full text-white text-sm font-bold">
                    Más Popular
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`inline-flex p-4 rounded-full bg-gradient-to-r ${tier.gradient} mb-4`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                  
                  {key !== 'free' && (
                    <div className="text-white/80">
                      <div className="text-sm">Desde</div>
                      <div className="text-4xl font-bold text-white">
                                ${tierData?.single_price || 0}
                      </div>
                      <div className="text-sm text-white/60">por evento</div>
                    </div>
                  )}
                </div>

                {/* Lista de características */}
                <div className="space-y-3 mb-6">
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-white' : 'text-white/40'}`}>
                        {feature.text}
                        {feature.note && (
                          <span className="block text-xs text-white/30">({feature.note})</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Selector de paquetes */}
                {key !== 'free' && tierData && (
                  <PackageSelector tierKey={key} tierData={tierData} />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-white/60 mb-4">
            ¿Tienes dudas?{' '}
            <button 
              onClick={() => setIsChatbotOpen(true)}
              className="text-yellow-400 hover:underline inline-flex items-center gap-1"
            >
              <MessageCircle className="h-4 w-4" />
              Contáctanos
            </button>
          </p>
          <div className="flex items-center justify-center gap-8 text-white/40 text-sm">
            <span>✓ Pago seguro</span>
            <span>✓ Sin compromisos</span>
            <span>✓ Soporte 24/7</span>
          </div>
        </motion.div>
      </div>

      {/* Chatbot Modal */}
      <ChatbotModal 
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        context={{
          selectedTier,
          selectedPackage,
          page: 'pricing'
        }}
      />

      {/* Payment Modal */}
      {paymentDetails && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          tier={paymentDetails.tier}
          tierName={paymentDetails.tierName}
          packageType={paymentDetails.packageType}
          amount={paymentDetails.amount}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default PricingPage;
