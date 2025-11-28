// Edge Function para limpiar eventos archivados automáticamente
// Se ejecuta cada hora via Supabase Cron Jobs

// @ts-ignore: Deno imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore: Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Declaración de tipos para Deno (Edge Runtime)
declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Crear cliente de Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🧹 Iniciando limpieza de eventos archivados...')

    // 1. Actualizar estados de eventos
    const { error: updateError } = await supabaseClient.rpc('update_event_statuses')
    
    if (updateError) {
      console.error('❌ Error actualizando estados:', updateError)
    } else {
      console.log('✅ Estados de eventos actualizados')
    }

    // 2. Limpiar eventos archivados (más de 6 horas)
    const { data: deletedCount, error: cleanupError } = await supabaseClient.rpc('cleanup_archived_events')
    
    if (cleanupError) {
      console.error('❌ Error en limpieza:', cleanupError)
      throw cleanupError
    }

    console.log(`✅ Eventos eliminados: ${deletedCount || 0}`)

    // 3. Obtener estadísticas
    const { data: stats, error: statsError } = await supabaseClient
      .from('events_with_live_status')
      .select('live_status')
      
    if (!statsError && stats) {
      const statusCount = stats.reduce((acc: any, event: any) => {
        acc[event.live_status] = (acc[event.live_status] || 0) + 1
        return acc
      }, {})
      
      console.log('📊 Estadísticas de eventos:', statusCount)
    }

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount: deletedCount || 0,
        timestamp: new Date().toISOString(),
        message: `Limpieza completada: ${deletedCount || 0} eventos eliminados`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Error en cleanup-events:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
