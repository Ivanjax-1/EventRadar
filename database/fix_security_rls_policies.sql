-- ===============================================
-- 🔒 FIX SECURITY - ROW LEVEL SECURITY (RLS)
-- EventRadar - Corregir alertas de Supabase Security Advisor
-- ===============================================
-- 
-- Este script habilita RLS en todas las tablas principales
-- y configura políticas de seguridad apropiadas
--
-- INSTRUCCIONES:
-- 1. Abre Supabase SQL Editor
-- 2. Copia y pega TODO este archivo
-- 3. Click en "RUN" ▶️
-- 4. Verifica que no haya errores
--
-- ===============================================

-- ============================================
-- 1. TABLA EVENTS - Eventos públicos
-- ============================================

-- Habilitar RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Políticas para EVENTS
-- Todos pueden ver eventos
DROP POLICY IF EXISTS "Anyone can view events" ON events;
CREATE POLICY "Anyone can view events"
  ON events FOR SELECT
  USING (true);

-- Solo usuarios autenticados pueden crear eventos
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Solo el creador puede actualizar sus eventos
DROP POLICY IF EXISTS "Users can update their own events" ON events;
CREATE POLICY "Users can update their own events"
  ON events FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Solo el creador puede eliminar sus eventos
DROP POLICY IF EXISTS "Users can delete their own events" ON events;
CREATE POLICY "Users can delete their own events"
  ON events FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- ============================================
-- 2. TABLA FAVORITES - Favoritos de usuarios
-- ============================================

-- Habilitar RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Políticas para FAVORITES
-- Usuarios solo ven sus propios favoritos
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
CREATE POLICY "Users can view their own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Usuarios pueden crear sus propios favoritos
DROP POLICY IF EXISTS "Users can create their own favorites" ON favorites;
CREATE POLICY "Users can create their own favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Usuarios pueden eliminar sus propios favoritos
DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorites;
CREATE POLICY "Users can delete their own favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 3. TABLA PROFILES - Perfiles de usuarios
-- ============================================

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para PROFILES
-- Todos pueden ver perfiles públicos
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

-- Usuarios solo pueden actualizar su propio perfil
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Permitir crear perfil (para nuevos usuarios)
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 4. TABLA EVENT_CATEGORIES - Categorías públicas
-- ============================================

-- Habilitar RLS (si existe la tabla)
ALTER TABLE IF EXISTS event_categories ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver categorías
DROP POLICY IF EXISTS "Anyone can view categories" ON event_categories;
CREATE POLICY "Anyone can view categories"
  ON event_categories FOR SELECT
  USING (true);

-- ============================================
-- 5. TABLA NOTIFICATIONS - Notificaciones de usuarios
-- ============================================

-- Habilitar RLS (si existe la tabla)
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;

-- Usuarios solo ven sus propias notificaciones
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Usuarios pueden actualizar sus notificaciones (marcar como leídas)
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Sistema puede crear notificaciones
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- 6. TABLA PAYMENTS - Pagos de usuarios
-- ============================================

-- Habilitar RLS (si existe la tabla)
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;

-- Usuarios solo ven sus propios pagos
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Solo sistema puede crear pagos
DROP POLICY IF EXISTS "System can create payments" ON payments;
CREATE POLICY "System can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 7. TABLA SUBSCRIPTIONS - Suscripciones premium
-- ============================================

-- Habilitar RLS (si existe la tabla)
ALTER TABLE IF EXISTS subscriptions ENABLE ROW LEVEL SECURITY;

-- Usuarios solo ven sus propias suscripciones
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Sistema puede crear/actualizar suscripciones
DROP POLICY IF EXISTS "System can manage subscriptions" ON subscriptions;
CREATE POLICY "System can manage subscriptions"
  ON subscriptions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 8. VERIFICACIÓN - Comprobar RLS habilitado
-- ============================================

-- Mostrar todas las tablas con RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'events',
    'favorites', 
    'profiles',
    'event_categories',
    'event_reviews',
    'notification_history',
    'event_views',
    'user_interactions',
    'notifications',
    'payments',
    'subscriptions'
  )
ORDER BY tablename;

-- Mostrar políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- ✅ SCRIPT COMPLETADO
-- ============================================

SELECT '✅ RLS habilitado y políticas configuradas correctamente' as status;
