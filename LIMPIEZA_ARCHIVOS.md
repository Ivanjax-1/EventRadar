# 🧹 LIMPIEZA DE ARCHIVOS - EventRadar

## ✅ ARCHIVOS A ELIMINAR (Duplicados o ya no necesarios)

### 📄 Archivos .env duplicados (Mantener solo .env)
- [ ] `.env.demo` - Demo, no necesario
- [ ] `.env.example` - Ejemplo, no necesario  
- [ ] `.env.template` - Template, no necesario
- ✅ **MANTENER**: `.env` (tu configuración actual)

### 📚 Guías de documentación duplicadas o antiguas
- [ ] `ACTIVAR_DEPURACION.md` - Ya no necesario
- [ ] `ANDROID_STUDIO_FINAL.md` - Guía antigua
- [ ] `ESTADO_MOVIL_REAL.md` - Estado antiguo
- [ ] `GUIA_AGREGAR_EVENTOS.md` - Duplicado
- [ ] `GUIA_ANDROID_STUDIO.md` - Ya integrado
- [ ] `GUIA_EDICION_EVENTOS.md` - Ya integrado
- [ ] `GUIA_VER_MOVIL.md` - Ya no necesario
- [ ] `ICONOS_CONFIGURACION.md` - Ya configurado
- [ ] `LOGO_ESTADO.md` - Ya no necesario
- [ ] `POPUP_MEJORADO.md` - Ya integrado
- [ ] `RESUMEN_SQL_CORREGIDO.md` - Ya no necesario
- [ ] `REVISION-PROYECTO.md` - Revisión antigua
- [ ] `SOLUCION_CELULAR.md` - Solución aplicada
- [ ] `VER_AHORA_CELULAR.md` - Ya no necesario
- ✅ **MANTENER**: `README.md` (documentación principal)
- ✅ **MANTENER**: `SUPABASE-INTEGRATION.md` (referencia útil)
- ✅ **MANTENER**: `SUPABASE-SETUP.md` (referencia útil)

### 🗂️ Carpetas duplicadas o vacías
- [ ] `EventRadar/` - Carpeta duplicada (verificar si está vacía)
- [ ] `EventRadarMobile/` - Carpeta duplicada (verificar contenido)
- [ ] `server/` - Si no estás usando backend separado
- ✅ **MANTENER**: `src/` (código fuente)
- ✅ **MANTENER**: `android/` (proyecto Android)
- ✅ **MANTENER**: `public/` (recursos públicos)
- ✅ **MANTENER**: `dist/` (build, pero puede regenerarse)

### 📊 Archivos de datos de ejemplo
- [ ] `eventos_ejemplo.json` - Ejemplo, no necesario
- [ ] `test-favorites.js` - Test antiguo
- [ ] `sprints.csv` - Planificación antigua
- [ ] `SPRINTS.md` - Planificación antigua

### 📄 Archivos Dashboard duplicados (Mantener solo DashboardPage.jsx)
- [ ] `src/pages/DashboardPage_SIMPLE.jsx` - Versión antigua
- [ ] `src/pages/DashboardPage_OLD.jsx` - Versión antigua
- [ ] `src/pages/DashboardPage_FIXED.jsx` - Versión antigua
- [ ] `src/pages/DashboardPage.current.jsx` - Versión antigua
- ✅ **MANTENER**: `src/pages/DashboardPage.jsx` (versión actual en uso)

### 🔄 Archivos backup y duplicados en componentes
- [ ] `src/components/AdminEventForm.backup.jsx` - Backup antiguo
- [ ] `src/components/MapView_backup.jsx` - Backup antiguo
- [ ] `src/pages/Favorites-old.jsx` - Versión antigua
- [ ] `src/pages/DebugPage.jsx` - Página de debug (si ya no la usas)
- [ ] `src/components/TestSupabase.jsx` - Componente de prueba
- ✅ **MANTENER**: `src/components/AdminEventForm.jsx` (versión actual)
- ✅ **MANTENER**: `src/components/MapView.jsx` (versión actual)
- ✅ **MANTENER**: `src/pages/Favorites.jsx` (versión actual)

### 🗂️ Carpetas completas a eliminar
- [ ] `EventRadar/` - Carpeta vacía ✅ CONFIRMADO VACÍA
- [ ] `EventRadarMobile/` - Carpeta con package.json antiguo (no se usa)
- [ ] `server/` - Backend Node.js (si no lo estás usando, ya que tienes Supabase)

### 🗃️ Archivos SQL (consolidar)
- ✅ **MANTENER**: `EVENTOS_PLANTILLA.sql` (plantilla principal)
- ✅ **MANTENER**: `EVENTO_FERIA_EMPRENDE.sql` (evento específico)
- ✅ **MANTENER**: `ACTUALIZAR_FECHAS_2025.sql` (útil para actualizar)
- ✅ **MANTENER**: `VERIFICAR_COORDENADAS.sql` (útil para verificar)

## 📝 RESUMEN DE ELIMINACIÓN

### Eliminar (35+ archivos/carpetas):
```
# Archivos .env duplicados
.env.demo
.env.example
.env.template

# Guías y documentación antigua
ACTIVAR_DEPURACION.md
ANDROID_STUDIO_FINAL.md
ESTADO_MOVIL_REAL.md
GUIA_AGREGAR_EVENTOS.md
GUIA_ANDROID_STUDIO.md
GUIA_EDICION_EVENTOS.md
GUIA_VER_MOVIL.md
ICONOS_CONFIGURACION.md
LOGO_ESTADO.md
POPUP_MEJORADO.md
RESUMEN_SQL_CORREGIDO.md
REVISION-PROYECTO.md
SOLUCION_CELULAR.md
VER_AHORA_CELULAR.md

# Archivos de ejemplo y test
eventos_ejemplo.json
test-favorites.js
sprints.csv
SPRINTS.md

# Versiones antiguas de Dashboard
src/pages/DashboardPage_SIMPLE.jsx
src/pages/DashboardPage_OLD.jsx
src/pages/DashboardPage_FIXED.jsx
src/pages/DashboardPage.current.jsx

# Backups y archivos antiguos de componentes
src/components/AdminEventForm.backup.jsx
src/components/MapView_backup.jsx
src/pages/Favorites-old.jsx
src/pages/DebugPage.jsx
src/components/TestSupabase.jsx

# Carpetas completas
EventRadar/ (carpeta vacía)
EventRadarMobile/ (proyecto antiguo no usado)
server/ (backend Node.js si usas solo Supabase)
```

### Mantener (importantes):
```
.env
.gitignore
capacitor.config.ts
index.html
package.json
package-lock.json
postcss.config.js
tailwind.config.js
vite.config.js
README.md
SUPABASE-INTEGRATION.md
SUPABASE-SETUP.md
EVENTOS_PLANTILLA.sql
EVENTO_FERIA_EMPRENDE.sql
ACTUALIZAR_FECHAS_2025.sql
VERIFICAR_COORDENADAS.sql
android/
dist/
node_modules/
public/
src/
```

## 🚀 COMANDOS PARA ELIMINAR (PowerShell)

```powershell
# Navega a la carpeta del proyecto
cd "C:\Users\joaqu\OneDrive\Escritorio\EventRadar"

# Eliminar archivos .env duplicados
Remove-Item .env.demo, .env.example, .env.template

# Eliminar guías antiguas
Remove-Item ACTIVAR_DEPURACION.md, ANDROID_STUDIO_FINAL.md, ESTADO_MOVIL_REAL.md
Remove-Item GUIA_AGREGAR_EVENTOS.md, GUIA_ANDROID_STUDIO.md, GUIA_EDICION_EVENTOS.md
Remove-Item GUIA_VER_MOVIL.md, ICONOS_CONFIGURACION.md, LOGO_ESTADO.md
Remove-Item POPUP_MEJORADO.md, RESUMEN_SQL_CORREGIDO.md, REVISION-PROYECTO.md
Remove-Item SOLUCION_CELULAR.md, VER_AHORA_CELULAR.md

# Eliminar archivos de ejemplo/test
Remove-Item eventos_ejemplo.json, test-favorites.js, sprints.csv, SPRINTS.md

# Eliminar versiones antiguas de Dashboard
Remove-Item src\pages\DashboardPage_SIMPLE.jsx, src\pages\DashboardPage_OLD.jsx
Remove-Item src\pages\DashboardPage_FIXED.jsx, src\pages\DashboardPage.current.jsx

# Eliminar backups y archivos antiguos de componentes
Remove-Item src\components\AdminEventForm.backup.jsx
Remove-Item src\components\MapView_backup.jsx
Remove-Item src\pages\Favorites-old.jsx
Remove-Item src\pages\DebugPage.jsx
Remove-Item src\components\TestSupabase.jsx

# Eliminar carpetas completas (CUIDADO - verifica antes)
Remove-Item EventRadar -Recurse -Force
Remove-Item EventRadarMobile -Recurse -Force
# Remove-Item server -Recurse -Force  # Descomenta solo si NO usas el backend
# Si EventRadar/ y EventRadarMobile/ están vacías:
# Remove-Item EventRadar/ -Recurse -Force
# Remove-Item EventRadarMobile/ -Recurse -Force
```

## ⚠️ RECOMENDACIONES

1. **Antes de eliminar**, verifica que EventRadar/ y EventRadarMobile/ no contengan nada importante
2. **Haz un backup** o commit en git antes de eliminar
3. **No elimines** node_modules/, dist/, android/ - son generados automáticamente
4. **Mantén** los archivos SQL para futuras referencias

## 💾 DESPUÉS DE LIMPIAR

Tu estructura quedará más limpia:
```
EventRadar/
├── android/
├── dist/
├── node_modules/
├── public/
├── src/
├── .env
├── .gitignore
├── capacitor.config.ts
├── index.html
├── package.json
├── README.md
├── SUPABASE-INTEGRATION.md
├── SUPABASE-SETUP.md
├── *.sql (archivos SQL útiles)
└── *.config.js (archivos de configuración)
```
