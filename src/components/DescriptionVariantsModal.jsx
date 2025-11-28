import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Copy, Sparkles, MessageSquare, Briefcase, Heart, Share2, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';

/**
 * 🎨 DESCRIPTION VARIANTS SELECTOR MODAL
 * Modal para elegir entre múltiples variantes de descripción generadas
 */
const DescriptionVariantsModal = ({ isOpen, onClose, variants = [], onSelectVariant, isMock = false }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!isOpen || !variants || variants.length === 0) return null;

  const variantStyles = [
    { 
      name: 'Corta y Atractiva', 
      icon: MessageSquare, 
      color: 'blue',
      description: 'Breve y al punto, perfecta para captar atención rápida'
    },
    { 
      name: 'Enfoque en Beneficios', 
      icon: Briefcase, 
      color: 'green',
      description: 'Destaca qué ganan los asistentes'
    },
    { 
      name: 'Narrativa Emocional', 
      icon: Heart, 
      color: 'pink',
      description: 'Cuenta una historia, genera conexión'
    },
    { 
      name: 'Formal/Profesional', 
      icon: Briefcase, 
      color: 'purple',
      description: 'Tono corporativo, ideal para eventos de negocios'
    },
    { 
      name: 'Casual/Coloquial', 
      icon: Zap, 
      color: 'orange',
      description: 'Cercana y amigable, para audiencias jóvenes'
    },
    { 
      name: 'Redes Sociales', 
      icon: Share2, 
      color: 'red',
      description: 'Llamativa y breve, optimizada para compartir'
    },
    { 
      name: 'One-Liner Marketing', 
      icon: Sparkles, 
      color: 'yellow',
      description: 'Frase impactante para publicidad'
    },
  ];

  const handleCopy = async (index) => {
    try {
      await navigator.clipboard.writeText(variants[index]);
      setCopiedIndex(index);
      toast({
        title: '📋 Copiado',
        description: 'Descripción copiada al portapapeles',
      });
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Error copying:', error);
    }
  };

  const handleSelect = () => {
    if (onSelectVariant) {
      onSelectVariant(variants[selectedIndex], selectedIndex);
    }
    onClose();
  };

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'border-blue-400 bg-blue-50 text-blue-900',
      green: 'border-green-400 bg-green-50 text-green-900',
      pink: 'border-pink-400 bg-pink-50 text-pink-900',
      purple: 'border-purple-400 bg-purple-50 text-purple-900',
      orange: 'border-orange-400 bg-orange-50 text-orange-900',
      red: 'border-red-400 bg-red-50 text-red-900',
      yellow: 'border-yellow-400 bg-yellow-50 text-yellow-900',
    };
    return colorMap[color] || colorMap.blue;
  };

  const getIconColorClasses = (color) => {
    const colorMap = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      pink: 'text-pink-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      red: 'text-red-600',
      yellow: 'text-yellow-600',
    };
    return colorMap[color] || colorMap.blue;
  };

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
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Elige tu Descripción {isMock && <span className="text-sm font-normal text-gray-500">(Mock)</span>}
                </h2>
                <p className="text-sm text-gray-600">
                  {variants.length} variantes generadas - Selecciona la que mejor se ajuste a tu evento
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {variants.slice(0, variantStyles.length).map((variant, index) => {
                const style = variantStyles[index] || variantStyles[0];
                const Icon = style.icon;
                const isSelected = selectedIndex === index;
                
                return (
                  <motion.button
                    key={index}
                    onClick={() => setSelectedIndex(index)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      relative p-4 rounded-xl border-2 transition-all text-left
                      ${isSelected 
                        ? `${getColorClasses(style.color)} shadow-lg` 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${isSelected ? getIconColorClasses(style.color) : 'text-gray-400'}`} />
                        <h3 className={`font-semibold text-sm ${isSelected ? '' : 'text-gray-700'}`}>
                          {style.name}
                        </h3>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                    </div>
                    <p className={`text-xs mb-3 ${isSelected ? 'opacity-80' : 'text-gray-500'}`}>
                      {style.description}
                    </p>
                    <p className={`text-xs line-clamp-3 ${isSelected ? '' : 'text-gray-600'}`}>
                      {variant}
                    </p>
                  </motion.button>
                );
              })}
            </div>

            {/* Preview completo */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Vista Previa Completa</h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {variantStyles[selectedIndex]?.name || `Variante ${selectedIndex + 1}`}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(selectedIndex)}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  {copiedIndex === selectedIndex ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {variants[selectedIndex]}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
                <Sparkles className="w-3 h-3" />
                <span>
                  {variants[selectedIndex].length} caracteres • 
                  {' '}{Math.ceil(variants[selectedIndex].split(' ').length / 200)} min de lectura
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {isMock ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  Descripciones generadas en modo mock (sin IA configurada)
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Descripciones generadas por IA
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="px-6"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSelect}
                className="px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                Usar esta descripción
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DescriptionVariantsModal;
