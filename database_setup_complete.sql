-- ===============================================
-- 🗄️ SCRIPT COMPLETO DE BASE DE DATOS
-- EventRadar - Sistema de IA y Notificaciones
-- ===============================================
-- 
-- INSTRUCCIONES:
-- 1. Abre Supabase SQL Editor
-- 2. Copia y pega TODO este archivo
-- 3. Click en "RUN" ▶️
-- 4. Espera a que termine (puede tardar 10-15 segundos)
-- 5. ¡Listo! Todas las tablas estarán creadas
--
-- ===============================================

-- ============================================
-- 1. ACTUALIZAR TABLA EVENTS
-- ============================================

-- Agregar campos de estado y clasificación
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming',
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_categorized BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS classification_confidence NUMERIC;

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_events_date_time ON events(date, time);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category_id);

-- ============================================
-- 2. CREAR TABLA EVENT_REVIEWS
-- (Para análisis de sentimientos)
-- ============================================

CREATE TABLE IF NOT EXISTS event_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  sentiment TEXT, -- 'positive', 'neutral', 'negative'
  sentiment_score NUMERIC, -- 0-1
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_reviews_event ON event_reviews(event_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON event_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_sentiment ON event_reviews(sentiment);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON event_reviews(created_at);

-- RLS (Row Level Security)
ALTER TABLE event_reviews ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
DROP POLICY IF EXISTS "Users can view all reviews" ON event_reviews;
CREATE POLICY "Users can view all reviews"
  ON event_reviews FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create their own reviews" ON event_reviews;
CREATE POLICY "Users can create their own reviews"
  ON event_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON event_reviews;
CREATE POLICY "Users can update their own reviews"
  ON event_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON event_reviews;
CREATE POLICY "Users can delete their own reviews"
  ON event_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 3. CREAR TABLA NOTIFICATION_HISTORY
-- (Para tracking de notificaciones)
-- ============================================

CREATE TABLE IF NOT EXISTS notification_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL,
  shown_at TIMESTAMPTZ DEFAULT NOW(),
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_event ON notification_history(event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notification_history(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_shown ON notification_history(shown_at);

-- RLS
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Users can view their own notifications" ON notification_history;
CREATE POLICY "Users can view their own notifications"
  ON notification_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own notifications" ON notification_history;
CREATE POLICY "Users can create their own notifications"
  ON notification_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notification_history;
CREATE POLICY "Users can update their own notifications"
  ON notification_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 4. CREAR TABLA EVENT_VIEWS
-- (Para tracking de eventos vistos)
-- ============================================

CREATE TABLE IF NOT EXISTS event_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  duration_seconds INTEGER DEFAULT 0
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_views_user ON event_views(user_id);
CREATE INDEX IF NOT EXISTS idx_views_event ON event_views(event_id);
CREATE INDEX IF NOT EXISTS idx_views_date ON event_views(viewed_at);

-- Índice único para evitar duplicados (un usuario solo ve un evento una vez por día)
-- Nota: Removido DATE() porque causa error IMMUTABLE. Se maneja duplicados en código.
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_views_unique 
--   ON event_views(user_id, event_id, DATE(viewed_at));

-- RLS
ALTER TABLE event_views ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Users can view their own views" ON event_views;
CREATE POLICY "Users can view their own views"
  ON event_views FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own views" ON event_views;
CREATE POLICY "Users can create their own views"
  ON event_views FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. CREAR TABLA USER_INTERACTIONS
-- (Para mejorar ML y recomendaciones)
-- ============================================

CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- 'view', 'favorite', 'unfavorite', 'share', 'attend', 'review'
  interaction_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_interactions_user ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_event ON user_interactions(event_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_date ON user_interactions(created_at);

-- RLS
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Users can view their own interactions" ON user_interactions;
CREATE POLICY "Users can view their own interactions"
  ON user_interactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own interactions" ON user_interactions;
CREATE POLICY "Users can create their own interactions"
  ON user_interactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. CREAR TABLA EVENT_DELETIONS
-- (Para auditoría de eventos eliminados)
-- ============================================

CREATE TABLE IF NOT EXISTS event_deletions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL,
  event_title TEXT,
  event_date DATE,
  event_time TIME,
  event_category TEXT,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  hours_since_start NUMERIC,
  deletion_reason TEXT DEFAULT 'auto_lifecycle'
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_deletions_date ON event_deletions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_deletions_event ON event_deletions(event_id);

-- No necesita RLS (es para admin/logs)

-- ============================================
-- 7. FUNCIÓN PARA AUTO-ACTUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para event_reviews
DROP TRIGGER IF EXISTS update_event_reviews_updated_at ON event_reviews;
CREATE TRIGGER update_event_reviews_updated_at
  BEFORE UPDATE ON event_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. VISTAS ÚTILES (OPCIONAL)
-- ============================================

-- Vista de eventos con conteo de favoritos
CREATE OR REPLACE VIEW events_with_stats AS
SELECT 
  e.*,
  COUNT(DISTINCT f.user_id) as favorite_count,
  COUNT(DISTINCT r.id) as review_count,
  AVG(r.rating) as avg_rating,
  COUNT(DISTINCT v.user_id) as view_count
FROM events e
LEFT JOIN favorites f ON e.id = f.event_id
LEFT JOIN event_reviews r ON e.id = r.event_id
LEFT JOIN event_views v ON e.id = v.event_id
GROUP BY e.id;

-- Vista de análisis de sentimientos por evento
CREATE OR REPLACE VIEW event_sentiment_summary AS
SELECT 
  e.id,
  e.title,
  COUNT(r.id) as total_reviews,
  SUM(CASE WHEN r.sentiment = 'positive' THEN 1 ELSE 0 END) as positive_count,
  SUM(CASE WHEN r.sentiment = 'neutral' THEN 1 ELSE 0 END) as neutral_count,
  SUM(CASE WHEN r.sentiment = 'negative' THEN 1 ELSE 0 END) as negative_count,
  AVG(r.sentiment_score) as avg_sentiment_score,
  AVG(r.rating) as avg_rating
FROM events e
LEFT JOIN event_reviews r ON e.id = r.event_id
GROUP BY e.id, e.title;

-- ============================================
-- ✅ SCRIPT COMPLETADO
-- ============================================

-- Verificar que todo se creó correctamente
SELECT 
  'Tablas creadas exitosamente' as status,
  COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'events',
    'event_reviews',
    'notification_history',
    'event_views',
    'user_interactions',
    'event_deletions'
  );

-- Mostrar estructura de tablas nuevas
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'event_reviews',
    'notification_history',
    'event_views',
    'user_interactions',
    'event_deletions'
  )
ORDER BY table_name, ordinal_position;
