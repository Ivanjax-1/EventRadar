import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Flame, Star, Zap } from 'lucide-react';

/**
 * EventPromotionBadge - Badge visual para eventos promocionados
 * Muestra insignia según el tier: basic, featured, premium
 */
const EventPromotionBadge = ({ 
  tier, 
  size = 'md',
  animated = true,
  className = '' 
}) => {
  if (!tier || tier === 'free') return null;

  const badges = {
    basic: {
      icon: Sparkles,
      text: 'Patrocinado',
      gradient: 'from-blue-400 to-purple-600',
      glow: 'shadow-blue-500/30',
      textColor: 'text-blue-100',
      bgOpacity: 'bg-blue-500/20',
      borderColor: 'border-blue-400/30'
    },
    featured: {
      icon: Flame,
      text: 'Destacado',
      gradient: 'from-orange-400 to-red-600',
      glow: 'shadow-orange-500/50',
      textColor: 'text-orange-100',
      bgOpacity: 'bg-orange-500/20',
      borderColor: 'border-orange-400/30',
      pulse: true
    },
    premium: {
      icon: Star,
      text: 'Premium',
      gradient: 'from-yellow-400 to-amber-600',
      glow: 'shadow-yellow-500/60',
      textColor: 'text-yellow-100',
      bgOpacity: 'bg-yellow-500/20',
      borderColor: 'border-yellow-400/30',
      shine: true
    }
  };

  const badge = badges[tier];
  if (!badge) return null;

  const Icon = badge.icon;

  const sizes = {
    sm: {
      container: 'px-1.5 py-0.5',
      icon: 'h-3 w-3',
      text: 'text-[10px]',
      gap: 'gap-0.5'
    },
    md: {
      container: 'px-2 py-1',
      icon: 'h-4 w-4',
      text: 'text-xs',
      gap: 'gap-1'
    },
    lg: {
      container: 'px-3 py-1.5',
      icon: 'h-5 w-5',
      text: 'text-sm',
      gap: 'gap-1.5'
    }
  };

  const sizeStyles = sizes[size];

  const BadgeContent = () => (
    <div className={`
      inline-flex items-center ${sizeStyles.gap} ${sizeStyles.container}
      rounded-full border
      bg-gradient-to-r ${badge.gradient}
      ${badge.borderColor}
      shadow-lg ${badge.glow}
      text-white ${sizeStyles.text} font-bold
      backdrop-blur-sm
      ${className}
    `}>
      <Icon className={`${sizeStyles.icon} ${badge.pulse ? 'animate-pulse' : ''}`} />
      <span className="whitespace-nowrap">{badge.text}</span>
      
      {/* Efecto de brillo para premium */}
      {badge.shine && (
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{
            x: ['-100%', '100%']
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3
          }}
        />
      )}
    </div>
  );

  if (!animated) {
    return <BadgeContent />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <BadgeContent />
    </motion.div>
  );
};

/**
 * EventPromotionIndicator - Indicador más sutil (solo icono)
 * Útil para vistas compactas como el mapa
 */
export const EventPromotionIndicator = ({ tier, size = 'sm', tooltip = true }) => {
  if (!tier || tier === 'free') return null;

  const icons = {
    basic: { Icon: Sparkles, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    featured: { Icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/20' },
    premium: { Icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/20' }
  };

  const config = icons[tier];
  if (!config) return null;

  const { Icon, color, bg } = config;

  const sizeClasses = {
    xs: 'h-3 w-3 p-0.5',
    sm: 'h-4 w-4 p-1',
    md: 'h-5 w-5 p-1.5',
    lg: 'h-6 w-6 p-2'
  };

  return (
    <div 
      className={`
        ${sizeClasses[size]} ${bg} ${color} 
        rounded-full flex items-center justify-center
        backdrop-blur-sm
      `}
      title={tooltip ? `Evento ${tier}` : undefined}
    >
      <Icon className="h-full w-full" />
    </div>
  );
};

/**
 * TrendingBadge - Badge para eventos populares
 */
export const TrendingBadge = ({ type, size = 'md', className = '' }) => {
  const badges = {
    trending: {
      icon: '🔥',
      text: 'Trending',
      gradient: 'from-pink-500 to-rose-600',
      description: 'Más de 100 favoritos en 24h'
    },
    almost_full: {
      icon: '⚡',
      text: 'Casi Lleno',
      gradient: 'from-red-500 to-orange-600',
      description: 'Quedan menos del 20% de lugares'
    },
    new: {
      icon: '🆕',
      text: 'Nuevo',
      gradient: 'from-green-500 to-emerald-600',
      description: 'Publicado hace menos de 48h'
    },
    live: {
      icon: '🔴',
      text: 'En Vivo',
      gradient: 'from-red-600 to-pink-600',
      description: 'Evento en curso ahora',
      pulse: true
    }
  };

  const badge = badges[type];
  if (!badge) return null;

  const sizes = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`
        inline-flex items-center gap-1 ${sizes[size]}
        rounded-full
        bg-gradient-to-r ${badge.gradient}
        text-white font-bold
        shadow-lg
        ${badge.pulse ? 'animate-pulse' : ''}
        ${className}
      `}
      title={badge.description}
    >
      <span>{badge.icon}</span>
      <span>{badge.text}</span>
    </motion.div>
  );
};

/**
 * CombinedEventBadges - Combina múltiples badges
 */
export const CombinedEventBadges = ({ 
  promotionTier, 
  trendingType,
  isLive,
  favoritesCount = 0,
  createdAt,
  capacity = 0,
  attendeesCount = 0,
  isNew = false,
  isAlmostFull = false,
  size = 'md',
  maxBadges = 3,
  className = ''
}) => {
  const badges = [];

  // 1. Evento en vivo (máxima prioridad)
  if (isLive) {
    badges.push(<TrendingBadge key="live" type="live" size={size} />);
  }

  // 2. Tier de promoción
  if (promotionTier && promotionTier !== 'free') {
    badges.push(<EventPromotionBadge key="promotion" tier={promotionTier} size={size} animated={false} />);
  }

  // 3. Trending (más de 100 favoritos en 24h)
  const isRecent = createdAt && (Date.now() - new Date(createdAt).getTime()) < 24 * 60 * 60 * 1000;
  if (favoritesCount >= 100 && isRecent) {
    badges.push(<TrendingBadge key="trending" type="trending" size={size} />);
  }

  // 4. Casi lleno (usar prop directa o calcular)
  if (isAlmostFull || (capacity && attendeesCount && (attendeesCount / capacity) > 0.8)) {
    badges.push(<TrendingBadge key="almost_full" type="almost_full" size={size} />);
  }

  // 5. Nuevo (menos de 48h - usar prop directa o calcular)
  const calculatedIsNew = createdAt && (Date.now() - new Date(createdAt).getTime()) < 48 * 60 * 60 * 1000;
  if ((isNew || calculatedIsNew) && badges.length < maxBadges) {
    badges.push(<TrendingBadge key="new" type="new" size={size} />);
  }

  // Limitar cantidad de badges
  const visibleBadges = badges.slice(0, maxBadges);
  const hiddenCount = badges.length - maxBadges;

  if (visibleBadges.length === 0) return null;

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {visibleBadges}
      {hiddenCount > 0 && (
        <span className="text-xs text-white/60">+{hiddenCount}</span>
      )}
    </div>
  );
};

export default EventPromotionBadge;
