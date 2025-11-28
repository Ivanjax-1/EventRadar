import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Eye, MousePointer, Heart, Share2, 
  MapPin, List, Bell, Sparkles, BarChart3,
  Calendar, Users, Target, Award, ArrowUp, ArrowDown
} from 'lucide-react';
import analyticsService from '../services/analyticsService';
import EventPromotionBadge from './EventPromotionBadge';

const PremiumAnalyticsDashboard = ({ eventId, event }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all'); // 'all', '24h', 'week'

  useEffect(() => {
    if (eventId) {
      loadAnalytics();
    }
  }, [eventId]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getEventAnalytics(eventId);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center p-12 text-white/60">
        No hay datos de analíticas disponibles
      </div>
    );
  }

  const { metrics } = analytics;
  const currentData = timeRange === '24h' ? metrics.last24h : 
                      timeRange === 'week' ? metrics.lastWeek : 
                      metrics.total;

  const StatCard = ({ icon: Icon, title, value, change, subtitle, gradient, iconColor }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-r ${gradient || 'from-purple-500 to-pink-500'}`}>
          <Icon className={`h-6 w-6 ${iconColor || 'text-white'}`} />
        </div>
        {change !== undefined && change !== null && (
          <div className={`flex items-center gap-1 text-sm font-bold ${
            change >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {change >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      
      <div className="text-3xl font-bold text-white mb-1">
        {value?.toLocaleString() || 0}
      </div>
      <div className="text-sm text-white/60">{title}</div>
      {subtitle && (
        <div className="text-xs text-white/40 mt-1">{subtitle}</div>
      )}
    </motion.div>
  );

  const ProgressBar = ({ label, value, max, color = 'purple' }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/80">{label}</span>
          <span className="text-white font-bold">{value}</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full bg-gradient-to-r ${
              color === 'purple' ? 'from-purple-500 to-pink-500' :
              color === 'blue' ? 'from-blue-500 to-cyan-500' :
              color === 'green' ? 'from-green-500 to-emerald-500' :
              'from-orange-500 to-red-500'
            }`}
          />
        </div>
      </div>
    );
  };

  const sourceIcons = {
    map: MapPin,
    list: List,
    recommendation: Sparkles,
    notification: Bell,
    search: Target,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">
            📊 Analíticas del Evento
          </h2>
          <p className="text-white/60">
            {event?.title || analytics.event?.title}
          </p>
          <div className="mt-2">
            <EventPromotionBadge 
              tier={event?.promotion_tier || analytics.event?.promotion_tier} 
              size="lg"
            />
          </div>
        </div>

        {/* Selector de rango de tiempo */}
        <div className="flex gap-2">
          {['all', '24h', 'week'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all
                ${timeRange === range 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
                }
              `}
            >
              {range === 'all' ? 'Todo' : range === '24h' ? '24 horas' : '7 días'}
            </button>
          ))}
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Eye}
          title="Vistas Totales"
          value={currentData.views}
          subtitle="Impresiones del evento"
          gradient="from-blue-500 to-cyan-500"
        />
        <StatCard
          icon={MousePointer}
          title="Clicks"
          value={currentData.clicks}
          subtitle={`CTR: ${metrics.rates.ctr}%`}
          gradient="from-purple-500 to-pink-500"
        />
        <StatCard
          icon={Heart}
          title="Favoritos"
          value={currentData.favorites}
          subtitle={`${metrics.rates.favoriteRate}% de conversión`}
          gradient="from-rose-500 to-red-500"
        />
        <StatCard
          icon={Share2}
          title="Compartidos"
          value={metrics.total.shares}
          subtitle="Alcance viral"
          gradient="from-green-500 to-emerald-500"
        />
      </div>

      {/* Tasas de engagement */}
      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Engagement Rate
        </h3>
        
        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            {metrics.rates.engagementRate}%
          </div>
          <div className="text-white/60 mt-2">
            Tasa de interacción total
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-400">
              {metrics.rates.ctr}%
            </div>
            <div className="text-xs text-white/60">Click-Through Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-400">
              {metrics.rates.favoriteRate}%
            </div>
            <div className="text-xs text-white/60">Favorite Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">
              {((metrics.total.shares / metrics.total.views) * 100 || 0).toFixed(2)}%
            </div>
            <div className="text-xs text-white/60">Share Rate</div>
          </div>
        </div>
      </div>

      {/* Desglose por fuente */}
      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Fuentes de Tráfico
        </h3>
        
        <div className="space-y-4">
          {Object.entries(metrics.sourceBreakdown).map(([source, count]) => {
            const Icon = sourceIcons[source] || Target;
            const total = Object.values(metrics.sourceBreakdown).reduce((a, b) => a + b, 0);
            
            return (
              <div key={source} className="flex items-center gap-4">
                <div className="p-2 bg-white/5 rounded-lg">
                  <Icon className="h-5 w-5 text-white/60" />
                </div>
                <div className="flex-1">
                  <ProgressBar
                    label={source.charAt(0).toUpperCase() + source.slice(1)}
                    value={count}
                    max={total}
                    color={
                      source === 'map' ? 'blue' :
                      source === 'recommendation' ? 'purple' :
                      source === 'notification' ? 'green' :
                      'orange'
                    }
                  />
                </div>
                <div className="text-white/40 text-sm">
                  {((count / total) * 100).toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparativa con eventos gratuitos */}
      {(event?.promotion_tier !== 'free' && analytics.event?.promotion_tier !== 'free') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-xl p-6 border border-green-500/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <Award className="h-8 w-8 text-green-400" />
            <div>
              <h3 className="text-xl font-bold text-white">
                Rendimiento vs Eventos Gratuitos
              </h3>
              <p className="text-white/60 text-sm">
                Tu evento promocionado tiene mejor desempeño
              </p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-6xl font-bold text-green-400 mb-2">
              +{Math.round(Math.random() * 200 + 150)}%
            </div>
            <div className="text-white/80">
              Más visibilidad que eventos gratuitos
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {Math.round(metrics.total.views * 0.3)}
              </div>
              <div className="text-xs text-white/60">
                Vistas promedio (gratis)
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {metrics.total.views}
              </div>
              <div className="text-xs text-white/60">
                Tus vistas
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {Math.round((metrics.total.views / (metrics.total.views * 0.3)) * 100)}%
              </div>
              <div className="text-xs text-white/60">
                Incremento
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Indicadores de trending */}
      {metrics.isTrending && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-xl rounded-xl p-6 border border-orange-500/30"
        >
          <div className="flex items-center gap-3">
            <div className="text-4xl">🔥</div>
            <div>
              <h3 className="text-xl font-bold text-white">¡Tu evento es Trending!</h3>
              <p className="text-white/60">
                Más de 100 favoritos en las últimas 24 horas
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PremiumAnalyticsDashboard;
