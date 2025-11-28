import React, { useState } from 'react';
import { Sparkles, Wand2, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import aiService from '../services/aiService';
import { toast } from './ui/use-toast';

/**
 * ✍️ AI DESCRIPTION GENERATOR
 * Genera descripciones atractivas para eventos usando IA
 */
const AIDescriptionGenerator = ({ eventData, onDescriptionGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [generatedVariants, setGeneratedVariants] = useState(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Etiquetas de tonos para las variantes
  const toneLabels = [
    { name: '📝 Corta', emoji: '📝', description: 'Directa y concisa' },
    { name: '✨ Beneficios', emoji: '✨', description: 'Destaca ventajas' },
    { name: '🎭 Narrativa', emoji: '🎭', description: 'Historia envolvente' },
    { name: '🎯 Formal', emoji: '🎯', description: 'Profesional' },
    { name: '🎉 Casual', emoji: '🎉', description: 'Amigable y cercana' },
    { name: '📱 Redes', emoji: '📱', description: 'Para compartir' }
  ];

  const handleGenerate = async () => {
    if (!aiService.isConfigured()) {
      toast({
        title: '⚠️ API no configurada',
        description: 'Agrega tu VITE_OPENAI_API_KEY en .env para usar esta función',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const result = await aiService.generateEventDescription(eventData);
      
      if (result.success) {
        setGeneratedDescription(result.description);
        // Si vienen varias descripciones (mock o alternativas), guardarlas
        if (result.descriptions && Array.isArray(result.descriptions)) {
          setGeneratedVariants(result.descriptions);
          setSelectedVariantIndex(0);
        } else {
          setGeneratedVariants(null);
          setSelectedVariantIndex(0);
        }
        toast({
          title: '✨ Descripción generada',
          description: result.isMock 
            ? 'Descripciones de ejemplo creadas (sin API configurada)' 
            : 'La IA ha creado una descripción atractiva para tu evento',
        });
      } else {
        throw new Error(result.error || 'Error generando descripción');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: '❌ Error',
        description: 'No se pudo generar la descripción. Intenta de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedDescription);
      setCopied(true);
      
      toast({
        title: '📋 Copiado',
        description: 'Descripción copiada al portapapeles',
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying:', error);
    }
  };

  const handleUseDescription = () => {
    if (onDescriptionGenerated) {
      onDescriptionGenerated(generatedDescription);
    }
    
    toast({
      title: '✅ Descripción aplicada',
      description: 'La descripción fue agregada al formulario',
    });
  };

  return (
    <div className="space-y-4">
      {/* Botón de generar */}
      <div className="flex gap-3">
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !eventData.title}
          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generando con IA...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Generar con IA
            </>
          )}
        </Button>

        {aiService.isConfigured() && (
          <div className="px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-green-600 font-medium">
              {aiService.getModelName()}
            </span>
          </div>
        )}
      </div>

      {/* Descripción generada */}
      {generatedDescription && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6 space-y-4">
          {/* Si hay variantes, mostrarlas como opciones */}
          {generatedVariants && generatedVariants.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-purple-700 font-medium">Elige el estilo que prefieras:</p>
              <div className="flex flex-wrap gap-2">
                {generatedVariants.map((v, i) => {
                  const tone = toneLabels[i] || toneLabels[0];
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setGeneratedDescription(v);
                        setSelectedVariantIndex(i);
                      }}
                      className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                        selectedVariantIndex === i
                          ? 'bg-purple-600 text-white border-purple-600 shadow-lg'
                          : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50'
                      }`}
                      title={tone.description}
                    >
                      <span className="mr-1">{tone.emoji}</span>
                      {tone.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-purple-900">Descripción generada por IA</h4>
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="border-purple-300 text-purple-700 hover:bg-purple-100"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copiar
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                size="sm"
                onClick={handleUseDescription}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Usar esta descripción
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {generatedDescription}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-purple-600">
            <Sparkles className="w-3 h-3" />
            <span>Generado automáticamente con {aiService.getModelName()}</span>
          </div>
        </div>
      )}

      {!aiService.isConfigured() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900 mb-1">Configura la IA</h4>
              <p className="text-sm text-yellow-700 leading-relaxed">
                Para usar esta función, agrega tu API key en el archivo <code className="bg-yellow-100 px-1 rounded">.env</code>:
              </p>
              <pre className="bg-yellow-100 rounded p-2 text-xs mt-2 overflow-x-auto">
                <code>VITE_OPENAI_API_KEY=tu-api-key-aqui</code>
              </pre>
              <p className="text-xs text-yellow-600 mt-2">
                O usa DeepSeek (más económico): <code className="bg-yellow-100 px-1 rounded">VITE_DEEPSEEK_API_KEY</code>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIDescriptionGenerator;
