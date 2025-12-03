-- ===============================================
-- 📍 AGREGAR EVENTOS VALPARAÍSO Y VIÑA DEL MAR
-- EventRadar - Eventos para la Quinta Región
-- ===============================================
-- 
-- Este script agrega 12 eventos variados entre Valparaíso y Viña del Mar
-- para llenar el mapa y la página de eventos
--
-- INSTRUCCIONES:
-- 1. Abre Supabase SQL Editor
-- 2. Copia y pega TODO este archivo
-- 3. Click en "RUN" ▶️
-- 4. Los eventos aparecerán en el mapa y lista
--
-- ===============================================

-- Necesitamos el ID de un usuario para asignar como creador
-- Este query obtiene el primer usuario admin disponible
DO $$ 
DECLARE
  admin_user_id UUID;
BEGIN
  -- Buscar un usuario admin
  SELECT id INTO admin_user_id
  FROM auth.users
  LIMIT 1;
  
  -- Si no hay usuarios, crear eventos sin created_by (NULL)
  -- Los eventos serán visibles para todos de todas formas
  
  -- ============================================
  -- EVENTO 1: Festival de Música Electrónica - Viña del Mar
  -- ============================================
  INSERT INTO events (
    title,
    description,
    date,
    time,
    location,
    latitude,
    longitude,
    category,
    price,
    status,
    created_by,
    created_at
  ) VALUES (
    'Festival Electrónico Viña Beats',
    'El festival de música electrónica más grande de la costa. DJs internacionales y locales en una noche inolvidable con visuales impresionantes.',
    '2025-12-20',
    '21:00:00',
    'Playa Acapulco, Viña del Mar',
    -33.0239,
    -71.5519,
    'musica',
    15000,
    'active',
    admin_user_id,
    NOW()
  );
  
  -- ============================================
  -- EVENTO 2: Feria Gastronómica del Puerto
  -- ============================================
  INSERT INTO events (
    title,
    description,
    date,
    time,
    location,
    latitude,
    longitude,
    category,
    price,
    status,
    created_by,
    created_at
  ) VALUES (
    'Feria Gastronómica del Puerto',
    'Degusta lo mejor de la cocina porteña y marina. Más de 40 stands con comida típica, mariscos frescos y food trucks gourmet.',
    '2025-12-08',
    '12:00:00',
    'Muelle Prat, Valparaíso',
    -33.0458,
    -71.6197,
    'gastronomia',
    0,
    'active',
    admin_user_id,
    NOW()
  );
  
  -- ============================================
  -- EVENTO 3: Convención Anime Valpo
  -- ============================================
  INSERT INTO events (
    title,
    description,
    date,
    time,
    location,
    latitude,
    longitude,
    category,
    price,
    status,
    created_by,
    created_at
  ) VALUES (
    'Valpo Anime Fest 2025',
    'La convención anime más grande del puerto. Cosplay, proyecciones, concursos, tiendas y invitados especiales del mundo del anime.',
    '2025-12-22',
    '10:00:00',
    'Centro Cultural Parque, Valparaíso',
    -33.0472,
    -71.6127,
    'anime',
    8000,
    'active',
    admin_user_id,
    NOW()
  );
  
  -- ============================================
  -- EVENTO 4: Partido de Fútbol Local
  -- ============================================
  INSERT INTO events (
    title,
    description,
    date,
    time,
    location,
    latitude,
    longitude,
    category,
    price,
    status,
    created_by,
    created_at
  ) VALUES (
    'Santiago Wanderers vs Everton',
    'Clásico porteño! Partido de fútbol profesional entre los dos equipos históricos de la región. Ambiente familiar garantizado.',
    '2025-12-12',
    '18:00:00',
    'Estadio Elías Figueroa Brander, Valparaíso',
    -33.0475,
    -71.6239,
    'deportes',
    12000,
    'active',
    admin_user_id,
    NOW()
  );
  
  -- ============================================
  -- EVENTO 5: Exposición de Arte Contemporáneo
  -- ============================================
  INSERT INTO events (
    title,
    description,
    date,
    time,
    location,
    latitude,
    longitude,
    category,
    price,
    status,
    created_by,
    created_at
  ) VALUES (
    'Muestra de Arte Urbano Porteño',
    'Exposición de arte contemporáneo y urbano de artistas locales. Murales, grafitis y arte callejero que define la cultura porteña.',
    '2025-12-05',
    '15:00:00',
    'Museo a Cielo Abierto, Cerro Bellavista',
    -33.0428,
    -71.6219,
    'arte',
    0,
    'active',
    admin_user_id,
    NOW()
  );
  
  -- ============================================
  -- EVENTO 6: Concierto de Rock en Vivo
  -- ============================================
  INSERT INTO events (
    title,
    description,
    date,
    time,
    location,
    latitude,
    longitude,
    category,
    price,
    status,
    created_by,
    created_at
  ) VALUES (
    'Rock en la Quinta - Bandas Locales',
    'Noche de rock con las mejores bandas locales de la región. Garage rock, punk y rock alternativo en un ambiente íntimo.',
    '2025-12-05',
    '20:30:00',
    'Club Enjoy, Viña del Mar',
    -33.0187,
    -71.5513,
    'musica',
    7000,
    'active',
    admin_user_id,
    NOW()
  );
  
  -- ============================================
  -- EVENTO 7: Hackathon Tech
  -- ============================================
  INSERT INTO events (
    title,
    description,
    date,
    time,
    location,
    latitude,
    longitude,
    category,
    price,
    status,
    created_by,
    created_at
  ) VALUES (
    'Hackathon Valpo Tech 2025',
    'Maratón de programación de 24 horas. Desarrolla soluciones innovadoras, gana premios y conecta con la comunidad tech local.',
    '2025-12-10',
    '09:00:00',
    'Universidad Técnica Federico Santa María, Valparaíso',
    -33.0351,
    -71.5954,
    'tecnologia',
    0,
    'active',
    admin_user_id,
    NOW()
  );
  
  -- ============================================
  -- EVENTO 8: Maratón Costera
  -- ============================================
  INSERT INTO events (
    title,
    description,
    date,
    time,
    location,
    latitude,
    longitude,
    category,
    price,
    status,
    created_by,
    created_at
  ) VALUES (
    'Maratón Valparaíso - Viña 10K',
    'Carrera de 10 kilómetros por el borde costero. Recorrido panorámico desde Valparaíso hasta Viña del Mar con vista al mar.',
    '2026-01-02',
    '07:00:00',
    'Av. España, Valparaíso (Salida)',
    -33.0458,
    -71.6197,
    'deportes',
    5000,
    'active',
    admin_user_id,
    NOW()
  );
  
  -- ============================================
  -- EVENTO 9: Festival de Jazz
  -- ============================================
  INSERT INTO events (
    title,
    description,
    date,
    time,
    location,
    latitude,
    longitude,
    category,
    price,
    status,
    created_by,
    created_at
  ) VALUES (
    'Viña Jazz Festival',
    'Festival de jazz internacional en el corazón de Viña. Músicos de clase mundial en un ambiente elegante junto al mar.',
    '2025-12-14',
    '19:00:00',
    'Hotel Sheraton, Viña del Mar',
    -33.0178,
    -71.5497,
    'musica',
    25000,
    'active',
    admin_user_id,
    NOW()
  );
  
  -- ============================================
  -- EVENTO 10: Feria de Emprendedores
  -- ============================================
  INSERT INTO events (
    title,
    description,
    date,
    time,
    location,
    latitude,
    longitude,
    category,
    price,
    status,
    created_by,
    created_at
  ) VALUES (
    'Feria de Emprendedores Quinta Región',
    'Más de 100 emprendedores locales muestran sus productos. Artesanías, diseño, moda, comida y más. Apoya el comercio local.',
    '2025-12-18',
    '11:00:00',
    'Plaza Vergara, Viña del Mar',
    -33.0167,
    -71.5500,
    'otros',
    0,
    'active',
    admin_user_id,
    NOW()
  );
  
  -- ============================================
  -- EVENTO 11: Cata de Vinos
  -- ============================================
  INSERT INTO events (
    title,
    description,
    date,
    time,
    location,
    latitude,
    longitude,
    category,
    price,
    status,
    created_by,
    created_at
  ) VALUES (
    'Cata de Vinos del Valle de Casablanca',
    'Degustación guiada de vinos premium del Valle de Casablanca. Incluye maridaje con quesos artesanales y charla con sommelier.',
    '2025-12-16',
    '18:00:00',
    'Vinoteca del Mar, Viña del Mar',
    -33.0195,
    -71.5480,
    'gastronomia',
    18000,
    'active',
    admin_user_id,
    NOW()
  );
  
  -- ============================================
  -- EVENTO 12: Noche de Stand Up Comedy
  -- ============================================
  INSERT INTO events (
    title,
    description,
    date,
    time,
    location,
    latitude,
    longitude,
    category,
    price,
    status,
    created_by,
    created_at
  ) VALUES (
    'Stand Up Comedy Night',
    'Los mejores comediantes de Chile en una noche de risas. Show para adultos con humor inteligente y sin censura.',
    '2025-12-14',
    '21:00:00',
    'Teatro Municipal, Valparaíso',
    -33.0458,
    -71.6197,
    'otros',
    10000,
    'active',
    admin_user_id,
    NOW()
  );
  
  RAISE NOTICE '✅ Se agregaron 12 eventos exitosamente en Valparaíso y Viña del Mar';
  
END $$;

-- Verificar eventos creados
SELECT 
  title,
  location,
  date,
  category,
  price
FROM events
WHERE location LIKE '%Valparaíso%' OR location LIKE '%Viña%'
ORDER BY date;

-- ============================================
-- ✅ SCRIPT COMPLETADO
-- ============================================

SELECT '✅ Eventos agregados correctamente al mapa y lista' as status;
