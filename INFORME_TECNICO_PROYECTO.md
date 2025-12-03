# INFORME TÉCNICO - EVENTRADAR
## Proyecto de Portafolio de Título

---

## 📋 RESUMEN EJECUTIVO

**EventRadar** es una aplicación web progresiva (PWA) diseñada para la gestión, descubrimiento y promoción de eventos. La plataforma integra tecnologías modernas de desarrollo web, inteligencia artificial, y servicios en la nube para ofrecer una experiencia completa tanto para usuarios finales como organizadores de eventos.

**Período de Desarrollo:** 2025  
**Repositorio:** https://github.com/Ivanjax-1/EventRadar  
**URL Producción:** https://eventradar.netlify.app

---

## 🎯 OBJETIVOS DEL PROYECTO

### Objetivos Principales
1. Crear una plataforma centralizada para descubrimiento de eventos
2. Implementar sistema de gestión de eventos con roles diferenciados
3. Integrar inteligencia artificial para asistencia y generación de contenido
4. Desarrollar experiencia móvil optimizada con capacidades nativas
5. Implementar sistema de pagos y promoción de eventos

### Objetivos Técnicos
- Arquitectura escalable y mantenible
- Integración con servicios de IA (Google Gemini)
- Sistema de autenticación seguro
- Base de datos relacional con políticas de seguridad (RLS)
- Despliegue continuo automatizado

---

## 🏗️ ARQUITECTURA Y STACK TECNOLÓGICO

### Frontend
- **Framework Principal:** React 19.1.1
- **Lenguaje:** JavaScript (JSX)
- **Bundler:** Vite 4.5.14
- **Enrutamiento:** React Router DOM 7.1.2
- **Estilos:** 
  - Tailwind CSS 3.4.17 (Utility-first CSS)
  - Framer Motion 11.13.5 (Animaciones)
- **Gestión de Estado:** 
  - Zustand 5.0.3 (State Management)
  - React Context API (Auth Context)

### Backend y Servicios
- **BaaS (Backend as a Service):** Supabase 2.58.0
  - PostgreSQL como base de datos
  - Autenticación integrada
  - Storage para archivos multimedia
  - Row Level Security (RLS)
  - Real-time subscriptions

- **Server Custom:** Node.js + Express
  - `/server/index.js` - Servidor principal
  - Rutas API personalizadas
  - Integración con servicios externos

### Inteligencia Artificial
- **Proveedor:** Google Gemini AI
- **Modelos Utilizados:**
  - `gemini-2.0-flash-exp` (Chatbot conversacional)
  - `gemini-pro` (Generación de descripciones de eventos)
- **SDK:** @google/generative-ai 0.21.0
- **Implementaciones:**
  - Chatbot inteligente con conocimiento contextual
  - Generación de descripciones de eventos con múltiples variantes
  - Sistema de recomendaciones

### Mapas y Geolocalización
- **Google Maps API:**
  - @googlemaps/react-wrapper 1.1.42
  - @react-google-maps/api 2.20.3
- **Funcionalidades:**
  - Visualización de eventos en mapa interactivo
  - Geolocalización de eventos
  - Vista móvil optimizada

### Sistema de Pagos
- **Proveedor:** Stripe
- **Dependencias:**
  - @stripe/stripe-js 5.6.0
  - @stripe/react-stripe-js 2.10.0
- **Implementación:**
  - Promoción de eventos (premium)
  - Pasarelas de pago seguras
  - Modal de pagos integrado

### UI/UX Components
- **Librerías de Componentes:**
  - Radix UI (Componentes accesibles)
  - Lucide React 0.468.0 (Iconos)
  - React Icons 5.3.0
- **Notificaciones:**
  - React Hot Toast 2.4.1
  - React Toastify 11.0.3
- **Formularios y Validación:**
  - React Hook Form 7.54.2
  - Zod 3.24.1 (Schema validation)

### Testing
- **Framework:** Vitest 3.0.3
- **Testing Library:**
  - @testing-library/react 16.1.0
  - @testing-library/jest-dom 6.6.3
- **Cobertura:** Unit tests y component tests

### Aplicación Móvil
- **Framework:** Capacitor 6.2.0
  - Convierte web app en app nativa
  - Android build configurado
- **Capacitor Plugins:**
  - @capacitor/app 6.0.2
  - @capacitor/camera 6.0.3
  - @capacitor/core 6.2.0
  - @capacitor/geolocation 6.0.2
  - @capacitor/haptics 6.0.2
  - @capacitor/keyboard 6.0.3
  - @capacitor/status-bar 6.0.2

### DevOps y Deployment
- **Hosting:** Netlify
  - Deploy automático desde GitHub
  - CI/CD integrado
  - HTTPS automático
- **Control de Versiones:** Git + GitHub
- **Build Process:** Vite build system
- **Configuración:** netlify.toml para SPA routing

---

## 💾 BASE DE DATOS - ESTRUCTURA Y DISEÑO

### Sistema de Gestión
**PostgreSQL** a través de Supabase con las siguientes características:
- Row Level Security (RLS) activado
- Políticas de seguridad por tabla
- Triggers y funciones personalizadas
- Índices optimizados para consultas frecuentes

### Esquema Principal

#### 1. **Tabla: profiles**
Almacena información extendida de usuarios
```sql
- id (uuid, FK a auth.users)
- full_name (text)
- avatar_url (text)
- role (text: 'user' | 'admin')
- created_at (timestamp)
- updated_at (timestamp)
```
**Datos adicionales en user_metadata (JSONB):**
- username
- birth_date
- phone
- address
- favorite_music[] (array de géneros musicales)
- favorite_events[] (array de tipos de eventos)

#### 2. **Tabla: events**
Gestión completa de eventos
```sql
- id (uuid, PK)
- title (text)
- description (text)
- date (timestamp)
- location (text)
- lat (numeric) - Latitud
- lng (numeric) - Longitud
- category (text)
- image_url (text)
- organizer_id (uuid, FK a profiles)
- created_at (timestamp)
- is_premium (boolean) - Evento promocionado
- promoted_until (timestamp)
```

#### 3. **Tabla: favorites**
Sistema de favoritos de usuarios
```sql
- id (uuid, PK)
- user_id (uuid, FK a auth.users)
- event_id (uuid, FK a events)
- created_at (timestamp)
- UNIQUE(user_id, event_id)
```

#### 4. **Tabla: user_gallery**
Galería de fotos de eventos de usuarios
```sql
- id (uuid, PK)
- user_id (uuid, FK a auth.users)
- photo_url (text)
- caption (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 5. **Tabla: gallery_likes**
Sistema de likes para fotos de galería
```sql
- id (uuid, PK)
- photo_id (uuid, FK a user_gallery)
- user_id (uuid, FK a auth.users)
- created_at (timestamp)
- UNIQUE(photo_id, user_id)
```

#### 6. **Tabla: gallery_comments**
Comentarios en fotos de galería
```sql
- id (uuid, PK)
- photo_id (uuid, FK a user_gallery)
- user_id (uuid, FK a auth.users)
- comment (text)
- created_at (timestamp)
```

#### 7. **Tabla: user_interactions**
Tracking de interacciones de usuarios (analytics)
```sql
- id (uuid, PK)
- user_id (uuid, FK a auth.users)
- event_id (uuid, FK a events)
- interaction_type (text: 'view' | 'click' | 'favorite')
- created_at (timestamp)
```

### Storage Buckets (Supabase Storage)

#### Bucket: avatars
- **Propósito:** Fotos de perfil de usuarios
- **Estructura:** `{userId}_{timestamp}.{extension}`
- **Acceso:** Público (lectura), Privado (escritura)

#### Bucket: events
- **Propósito:** Imágenes de eventos y galerías
- **Estructura:** 
  - Eventos: `{eventId}_{timestamp}.{extension}`
  - Galerías: `gallery/{userId}_{timestamp}_{random}.{extension}`
- **Acceso:** Público (lectura), Privado (escritura)

### Políticas de Seguridad (RLS)

Cada tabla tiene políticas específicas:
- **SELECT:** Usuarios autenticados pueden ver sus propios datos
- **INSERT:** Usuarios pueden crear sus propios registros
- **UPDATE:** Usuarios solo pueden actualizar sus propios datos
- **DELETE:** Usuarios solo pueden eliminar sus propios registros
- **CASCADE:** Eliminación en cascada para fotos → likes → comentarios

---

## 🤖 INTEGRACIÓN DE INTELIGENCIA ARTIFICIAL

### 1. Chatbot Conversacional

**Archivo:** `src/components/ChatbotModal.jsx`  
**Servicio:** `src/services/aiService.js`  
**API Backend:** `server/routes/chat.js`

#### Características:
- **Modelo:** Google Gemini 2.0 Flash Experimental
- **Base de Conocimiento:** `src/data/chat_knowledge.json`
  - Información sobre la plataforma
  - Categorías de eventos
  - Funcionalidades disponibles
  - Preguntas frecuentes

#### Funcionalidades:
```javascript
// Sistema de contexto y memoria conversacional
- Mantiene historial de conversación
- Comprende contexto de EventRadar
- Responde preguntas sobre eventos
- Guía a usuarios en el uso de la plataforma
- Procesa consultas en lenguaje natural
```

#### Implementación Técnica:
```javascript
// Configuración del modelo
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
  systemInstruction: knowledgeBase
});

// Chat con contexto
const chat = model.startChat({
  history: conversationHistory,
  generationConfig: {
    maxOutputTokens: 500,
    temperature: 0.7
  }
});
```

### 2. Generador de Descripciones con IA

**Archivo:** `src/components/AIDescriptionGenerator.jsx`

#### Características:
- **Modelo:** Gemini Pro
- **Función:** Genera descripciones atractivas para eventos
- **Output:** Múltiples variantes de descripción

#### Proceso:
1. Usuario ingresa información básica del evento
2. IA analiza el contexto (título, categoría, ubicación)
3. Genera 3 variantes de descripción:
   - Formal/profesional
   - Casual/amigable
   - Entusiasta/promocional
4. Usuario selecciona la variante preferida

#### Implementación:
```javascript
const prompt = `Genera 3 descripciones atractivas para el siguiente evento:
Título: ${eventTitle}
Categoría: ${eventCategory}
Ubicación: ${eventLocation}
...`;

const result = await model.generateContent(prompt);
```

### 3. Sistema de Recomendaciones Inteligente

**Archivo:** `src/components/RecommendedEvents.jsx`

#### Características:
- Analiza preferencias del usuario (favorite_music, favorite_events)
- Considera historial de interacciones
- Filtra eventos relevantes
- Score de similitud por categorías

#### Algoritmo:
```javascript
// Scoring basado en preferencias
if (userPreferences.includes(eventCategory)) {
  score += 10;
}
if (userInteractions.includes(eventId)) {
  score += 5;
}
// Ordena por score descendente
```

---

## 📱 FUNCIONALIDADES PRINCIPALES

### 1. Gestión de Usuarios

#### Autenticación
- **Registro:** Email + Password
- **Login:** Credenciales + Auth token JWT
- **Roles:** User, Admin
- **Sesión:** Persistente con Supabase Auth

#### Perfil de Usuario
**Archivo:** `src/pages/ProfilePage.jsx`

**Funcionalidades:**
- ✅ Edición de información personal (nombre, email, teléfono, dirección)
- ✅ Carga de foto de perfil (upload a Supabase Storage)
- ✅ Selección de preferencias musicales (10 géneros)
- ✅ Selección de tipos de eventos favoritos (10 categorías)
- ✅ Gestión de username único
- ✅ Fecha de nacimiento

**Código Destacado:**
```javascript
// Upload de foto de perfil
const handlePhotoUpload = async (e) => {
  const file = e.target.files[0];
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}_${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file);
    
  // Actualizar user_metadata
  await supabase.auth.updateUser({
    data: { avatar_url: publicUrl }
  });
};
```

### 2. Galería de Eventos de Usuario

**Archivo:** `src/components/EventGalleryModal.jsx`

#### Funcionalidades:
- ✅ Upload múltiple de fotos
- ✅ Sistema de likes (un like por usuario)
- ✅ Comentarios en fotos
- ✅ Eliminación de fotos propias
- ✅ Vista de galería en grid
- ✅ Modal fullscreen con animaciones

**Características Técnicas:**
```javascript
// Upload a Supabase Storage
const fileName = `gallery/${user.id}_${Date.now()}_${random}.${ext}`;
await supabase.storage.from('events').upload(fileName, file);

// Insert en base de datos
await supabase.from('user_gallery').insert({
  user_id: user.id,
  photo_url: publicUrl,
  caption: caption
});

// Sistema de likes con constraint único
await supabase.from('gallery_likes').insert({
  photo_id: photoId,
  user_id: user.id
});
```

### 3. Gestión de Eventos

**Archivo:** `src/pages/CreateEventPage.jsx`

#### Funcionalidades para Admins:
- ✅ Creación de eventos
- ✅ Edición de eventos existentes
- ✅ Eliminación de eventos
- ✅ Upload de imagen de evento
- ✅ Selección de ubicación en mapa
- ✅ Coordenadas GPS (lat/lng)
- ✅ Categorización de eventos

**Categorías Soportadas:**
- Conciertos
- Deportes
- Tecnología
- Arte y Cultura
- Gastronomía
- Educación
- Networking
- Entretenimiento

### 4. Visualización de Eventos

#### Vista de Mapa - Desktop
**Archivo:** `src/components/MapView.jsx`

- Google Maps integrado
- Markers por cada evento
- Info window con detalles
- Filtros por categoría
- Geolocalización del usuario

#### Vista de Mapa - Mobile
**Archivo:** `src/components/MobileMapView.jsx`

**Optimizaciones móviles:**
- Viewport dinámico (100dvh)
- Navegación bottom bar flotante
- Gestos táctiles optimizados
- Safe area para notch/botones del sistema
- Detección automática de dispositivo con `useIsMobile` hook

**Código de detección:**
```javascript
// src/hooks/useIsMobile.js
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};
```

#### Vista de Lista
**Archivo:** `src/pages/Eventspage.jsx`

- Grid responsive de tarjetas
- Filtros avanzados
- Búsqueda por texto
- Paginación
- Badges de eventos premium

### 5. Sistema de Favoritos

**Archivo:** `src/pages/Favorites.jsx`

#### Funcionalidades:
- ✅ Agregar eventos a favoritos
- ✅ Eliminar de favoritos
- ✅ Vista de todos los favoritos
- ✅ Contador de favoritos en navegación
- ✅ Sincronización en tiempo real

**Implementación:**
```javascript
// Toggle favorito
const toggleFavorite = async (eventId) => {
  const { data } = await supabase
    .from('favorites')
    .select()
    .match({ user_id: user.id, event_id: eventId });
    
  if (data.length > 0) {
    await supabase.from('favorites').delete().match({...});
  } else {
    await supabase.from('favorites').insert({...});
  }
};
```

### 6. Sistema de Promoción de Eventos (Premium)

**Archivo:** `src/components/PaymentModal.jsx`

#### Características:
- Integración con Stripe
- Eventos destacados visualmente
- Período de promoción configurable
- Badge "DESTACADO" en eventos premium
- Filtros para eventos promocionados

**Flujo:**
1. Admin selecciona evento a promocionar
2. Elige período de promoción (7, 14, 30 días)
3. Procesa pago via Stripe
4. Evento marcado como `is_premium = true`
5. `promoted_until` actualizado con fecha límite

### 7. Dashboard Principal

**Archivo:** `src/pages/DashboardPage.jsx`

#### Secciones:
- **Hero:** Bienvenida personalizada con nombre de usuario
- **Filtros:** Panel lateral con categorías
- **Mapa/Lista:** Toggle entre vistas (responsive)
- **Navegación Mobile:** 4 botones principales
  - 🗺️ Mapa
  - 📅 Eventos
  - ⭐ Favoritos (con badge contador)
  - 👤 Perfil

**Lógica de navegación móvil:**
```javascript
const [activeView, setActiveView] = useState('mapa');

// Renderizado condicional
{isMobile ? (
  activeView === 'mapa' ? <MobileMapView /> :
  activeView === 'eventos' ? <EventList /> :
  activeView === 'favoritos' ? <Favorites /> :
  <ProfilePage />
) : (
  <MapView />
)}
```

---

## 🎨 COMPONENTES UI REUTILIZABLES

### 1. Sistema de Notificaciones

**Archivo:** `src/components/SmartNotificationManager.jsx`

#### Características:
- Notificaciones push inteligentes
- Análisis de preferencias del usuario
- Notificaciones de eventos cercanos
- Sistema de prioridad
- Agrupación de notificaciones

**Tipos de notificaciones:**
- Eventos nuevos en categorías favoritas
- Eventos próximos a tu ubicación
- Eventos en 24 horas
- Cambios en eventos favoritos

### 2. Asistente de IA Visual

**Archivo:** `src/components/AIAssistant.jsx`

- Botón flotante de ayuda
- Integración con chatbot
- Sugerencias contextuales
- Atajos rápidos

### 3. Badges y Etiquetas

**Archivo:** `src/components/EventPromotionBadge.jsx`

- Badge "DESTACADO" para eventos premium
- Animaciones con Framer Motion
- Estilos degradados
- Pulso de atención

### 4. Modales Reutilizables

- **EditEventModal:** Edición de eventos
- **PaymentModal:** Pagos de Stripe
- **EventGalleryModal:** Galería de fotos
- **ChatbotModal:** Chat con IA
- **DescriptionVariantsModal:** Selección de descripciones IA

---

## 🔒 SEGURIDAD IMPLEMENTADA

### 1. Row Level Security (RLS)

Todas las tablas tienen políticas RLS:
```sql
-- Ejemplo: Política de SELECT en user_gallery
CREATE POLICY "Users can view own gallery"
ON user_gallery FOR SELECT
USING (auth.uid() = user_id);

-- Política de INSERT
CREATE POLICY "Users can insert own photos"
ON user_gallery FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### 2. Autenticación JWT

- Tokens seguros generados por Supabase
- Expiración automática de sesiones
- Refresh token automático
- Protected routes en frontend

### 3. Validación de Datos

**Zod Schemas:**
```javascript
// src/domain/schemas/eventSchema.js
const eventSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10),
  date: z.string().datetime(),
  location: z.string().min(3),
  category: z.enum(['Conciertos', 'Deportes', ...])
});
```

### 4. Variables de Entorno

```javascript
// .env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GOOGLE_MAPS_API_KEY=
VITE_GEMINI_API_KEY=
VITE_STRIPE_PUBLIC_KEY=
```

---

## 📊 ANALYTICS Y TRACKING

**Archivo:** `src/services/trackingService.js`

### Métricas Capturadas:
- Vistas de eventos
- Clicks en eventos
- Favoritos agregados/removidos
- Tiempo de permanencia
- Interacciones con IA

### Implementación:
```javascript
export const trackEventView = async (eventId, userId) => {
  await supabase.from('user_interactions').insert({
    user_id: userId,
    event_id: eventId,
    interaction_type: 'view',
    created_at: new Date().toISOString()
  });
};
```

---

## 🚀 DESPLIEGUE Y CI/CD

### Pipeline de Deployment

**1. Desarrollo Local**
```bash
npm run dev  # Vite dev server en localhost:3000
```

**2. Build de Producción**
```bash
npm run build  # Genera carpeta /dist
```

**3. Deploy Automático (Netlify)**

**Archivo:** `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200  # SPA routing
```

**Flujo:**
1. Push a rama `main` en GitHub
2. Netlify detecta cambio (webhook)
3. Ejecuta `npm install`
4. Ejecuta `npm run build`
5. Despliega carpeta `dist/` a CDN
6. URL: https://eventradar.netlify.app

### Comandos Git Utilizados

```bash
# Commits importantes del proyecto
git commit -m "feat: ProfilePage completo + Galería eventos + MobileMapView"
git commit -m "refactor: eliminar referencias otaku y actualizar textos"
git commit -m "fix: agregar dependencias @stripe para build Netlify"
git commit -m "fix: agregar netlify.toml para SPA routing"
```

---

## 📱 APLICACIÓN MÓVIL ANDROID

### Configuración Capacitor

**Archivo:** `capacitor.config.ts`
```typescript
const config: CapacitorConfig = {
  appId: 'com.eventradar.app',
  appName: 'EventRadar',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};
```

### Build Android

**Archivos clave:**
- `android/app/build.gradle` - Configuración de la app
- `android/build.gradle` - Configuración del proyecto
- `android/gradle.properties` - Variables de build

**Proceso de build:**
```bash
npm run build                    # Build web
npx cap sync android             # Sincronizar con Android
npx cap open android             # Abrir en Android Studio
# Build APK desde Android Studio
```

### Plugins Nativos Integrados

1. **Camera:** Captura de fotos para perfil y galería
2. **Geolocation:** Ubicación del usuario para eventos cercanos
3. **Haptics:** Feedback táctil en interacciones
4. **Status Bar:** Control de barra de estado
5. **Keyboard:** Manejo de teclado virtual

---

## 🧪 TESTING Y CALIDAD

### Tests Implementados

**Archivo:** `src/__tests__/LoginPage.test.jsx`
```javascript
describe('LoginPage', () => {
  test('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
  });
});
```

**Archivo:** `src/__tests__/utils.test.js`
- Tests de funciones utilitarias
- Validación de formatos
- Helpers de fechas

### Configuración Vitest

**Archivo:** `vitest.config.js`
```javascript
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.js'
  }
});
```

---

## 🎯 LOGROS Y FUNCIONALIDADES COMPLETADAS

### ✅ Funcionalidades Core
- [x] Sistema de autenticación completo
- [x] Gestión de eventos (CRUD)
- [x] Visualización en mapa (Google Maps)
- [x] Sistema de favoritos
- [x] Perfiles de usuario personalizables
- [x] Upload de imágenes (perfil y eventos)

### ✅ Inteligencia Artificial
- [x] Chatbot conversacional con Gemini AI
- [x] Generador de descripciones de eventos
- [x] Sistema de recomendaciones inteligente
- [x] Base de conocimiento contextual

### ✅ Funcionalidades Sociales
- [x] Galería de fotos de usuarios
- [x] Sistema de likes
- [x] Comentarios en fotos
- [x] Preferencias y gustos personalizables

### ✅ Mobile
- [x] Diseño responsive completo
- [x] Navegación móvil optimizada
- [x] Vista de mapa mobile específica
- [x] App Android con Capacitor
- [x] Gestos y animaciones táctiles

### ✅ Pagos y Premium
- [x] Integración con Stripe
- [x] Sistema de eventos destacados
- [x] Modal de pagos funcional

### ✅ DevOps
- [x] Deploy automático en Netlify
- [x] CI/CD configurado
- [x] Variables de entorno seguras
- [x] SPA routing configurado

---

## 📈 MÉTRICAS DEL PROYECTO

### Código
- **Archivos totales:** ~150+
- **Componentes React:** 40+
- **Páginas:** 8 principales
- **Líneas de código:** ~15,000+
- **Commits Git:** 50+ (en fase 2)

### Dependencias
- **npm packages:** 720 instalados
- **Tamaño build:** ~2.5 MB (optimizado con Vite)
- **Tiempo de build:** ~4 segundos
- **Tiempo de deploy:** ~20 segundos

### Base de Datos
- **Tablas:** 7 principales
- **Storage Buckets:** 2 (avatars, events)
- **RLS Policies:** 15+ políticas de seguridad

---

## 🔧 COMANDOS ÚTILES DEL PROYECTO

### Desarrollo
```bash
npm install              # Instalar dependencias
npm run dev             # Servidor desarrollo (puerto 3000)
npm run build           # Build producción
npm run preview         # Preview build local
npm test                # Ejecutar tests
```

### Git
```bash
git status              # Ver estado
git add .               # Agregar cambios
git commit -m "mensaje" # Commit
git push origin main    # Push a GitHub
```

### Capacitor (Mobile)
```bash
npx cap sync            # Sincronizar web → native
npx cap open android    # Abrir Android Studio
npx cap run android     # Ejecutar en dispositivo
```

---

## 🐛 PROBLEMAS RESUELTOS DURANTE EL DESARROLLO

### 1. Build Netlify Fallaba
**Problema:** Dependencias de Stripe no instaladas
**Solución:**
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 2. 404 en Rutas de SPA
**Problema:** Netlify no redirigía rutas a index.html
**Solución:** Crear `netlify.toml` con redirect rules

### 3. Espacio Negro en Mobile
**Problema:** Espacio entre mapa y navegación bottom
**Solución:** 
- Usar `100dvh` (dynamic viewport height)
- Navegación flotante con `bottom: 20px`
- `absolute inset-0` para mapa

### 4. Modal de Galería No Aparecía
**Problema:** AnimatePresence no renderizaba
**Solución:** Cambiar de `if (!isOpen) return null` a `{isOpen && (...)}`

### 5. Botón de Foto No Funcionaba
**Problema:** Click no abría selector de archivos
**Solución:** Agregar `ref` y `onClick` handler:
```javascript
<input ref={fileInputRef} type="file" hidden />
<button onClick={() => fileInputRef.current?.click()} />
```

---

## 📚 DOCUMENTACIÓN ADICIONAL

### Archivos de Documentación
- `README.md` - Descripción general del proyecto
- `docs/CHATBOT_Y_PAGOS.md` - Detalles de IA y pagos
- `docs/EVIDENCIA_SQL_BASE_DE_DATOS.md` - Esquema de BD
- `database/gallery_setup.sql` - Script de setup de galería
- `database_setup_complete.sql` - Setup completo de BD

### Enlaces Importantes
- **Repositorio:** https://github.com/Ivanjax-1/EventRadar
- **Producción:** https://eventradar.netlify.app
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Netlify Dashboard:** https://app.netlify.com/sites/eventradar

---

## 🎓 CONOCIMIENTOS APLICADOS

### Frontend
- ✅ React Hooks avanzados (useState, useEffect, useRef, useContext, custom hooks)
- ✅ React Router para SPA
- ✅ State Management con Zustand
- ✅ Tailwind CSS para diseño responsive
- ✅ Framer Motion para animaciones
- ✅ Optimización de performance

### Backend
- ✅ Supabase como BaaS
- ✅ PostgreSQL y SQL avanzado
- ✅ Row Level Security
- ✅ Storage de archivos
- ✅ API REST con Node/Express

### IA y Machine Learning
- ✅ Integración de LLMs (Google Gemini)
- ✅ Prompt engineering
- ✅ Sistemas conversacionales
- ✅ Generación de contenido con IA

### Mobile Development
- ✅ PWA (Progressive Web App)
- ✅ Capacitor para apps nativas
- ✅ Responsive design
- ✅ Touch gestures y UX móvil

### DevOps
- ✅ Git y control de versiones
- ✅ CI/CD con Netlify
- ✅ Variables de entorno
- ✅ Build automation

### Seguridad
- ✅ Autenticación JWT
- ✅ Row Level Security
- ✅ Validación de datos
- ✅ HTTPS y certificados SSL

---

## 🏆 CONCLUSIONES

### Objetivos Alcanzados
EventRadar cumple exitosamente con todos los objetivos planteados:
- ✅ Plataforma funcional de gestión de eventos
- ✅ Integración completa de IA
- ✅ Experiencia mobile optimizada
- ✅ Sistema de pagos implementado
- ✅ Arquitectura escalable y segura

### Tecnologías Modernas
El proyecto demuestra dominio de:
- React 19 (última versión)
- Inteligencia Artificial (Google Gemini)
- Backend as a Service (Supabase)
- Mobile híbrido (Capacitor)
- DevOps automatizado (Netlify)

### Aprendizajes Clave
1. Integración de múltiples servicios externos (Maps, IA, Pagos)
2. Arquitectura de aplicaciones full-stack modernas
3. Optimización de performance y UX
4. Seguridad en aplicaciones web
5. Deploy y mantenimiento continuo

### Impacto Potencial
EventRadar puede:
- Centralizar descubrimiento de eventos locales
- Facilitar la gestión para organizadores
- Mejorar la experiencia de usuarios mediante IA
- Escalar a múltiples ciudades/regiones

---

## 📋 CHECKLIST PARA PRESENTACIÓN

### Demostración en Vivo
- [ ] Mostrar login y registro
- [ ] Crear perfil con foto y preferencias
- [ ] Visualizar eventos en mapa
- [ ] Agregar evento a favoritos
- [ ] Usar chatbot de IA
- [ ] Generar descripción con IA
- [ ] Subir foto a galería
- [ ] Dar like y comentar
- [ ] Mostrar versión móvil (responsive)

### Aspectos Técnicos a Destacar
- [ ] Arquitectura del sistema (diagrama)
- [ ] Stack tecnológico completo
- [ ] Integración de IA (casos de uso)
- [ ] Base de datos (esquema relacional)
- [ ] Seguridad implementada (RLS)
- [ ] Deploy automático (CI/CD)

### Código a Mostrar
- [ ] Componente React interesante (ProfilePage)
- [ ] Integración con Gemini AI (chatbot)
- [ ] Políticas RLS en Supabase
- [ ] Responsive design (useIsMobile)
- [ ] Upload de archivos (Storage)

---

## 📞 INFORMACIÓN DE CONTACTO

**Desarrollador:** Ivan Diaz Vega  
**Email:** diazvega.ivan@gmail.com  
**GitHub:** https://github.com/Ivanjax-1  
**Proyecto:** EventRadar  
**Fecha:** Diciembre 2025

---

**FIN DEL INFORME TÉCNICO**

*Este documento representa el trabajo completo realizado en el proyecto EventRadar, evidenciando conocimientos en desarrollo web full-stack, inteligencia artificial, bases de datos, mobile development y DevOps.*
