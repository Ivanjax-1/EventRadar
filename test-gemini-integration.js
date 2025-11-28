// TEST - Verificar integración de Gemini
// Ejecutar en la consola del navegador (F12 → Console)

// 1. Verificar que aiService está disponible
import('../src/services/aiService.js').then(module => {
  const aiService = module.default;
  
  console.log('🔍 DIAGNÓSTICO DE GEMINI:');
  console.log('─────────────────────────');
  
  // Verificar proveedor
  const provider = aiService.getProvider();
  console.log('✅ Proveedor activo:', provider);
  
  // Verificar modelo
  const model = aiService.getModelName();
  console.log('✅ Modelo:', model);
  
  // Verificar configuración
  const isConfigured = aiService.isConfigured();
  console.log('✅ Configurado:', isConfigured ? 'Sí ✅' : 'No ❌');
  
  // Verificar API key
  const hasGemini = !!import.meta.env.VITE_GEMINI_API_KEY;
  console.log('✅ VITE_GEMINI_API_KEY:', hasGemini ? 'Presente ✅' : 'Ausente ❌');
  
  console.log('─────────────────────────');
  
  if (provider === 'gemini') {
    console.log('🎉 GEMINI CONFIGURADO CORRECTAMENTE');
  } else if (provider === 'none') {
    console.log('⚠️ SIN API KEY - Modo Demo');
    console.log('💡 Solución: Agregar VITE_GEMINI_API_KEY en .env y reiniciar servidor');
  } else {
    console.log(`ℹ️ Usando: ${provider}`);
  }
});
