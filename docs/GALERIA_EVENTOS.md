# Galería de Eventos - Configuración

## 📸 Funcionalidad Implementada

Se ha creado una **galería de eventos personal** donde los usuarios pueden:

- ✅ **Subir fotos** de eventos que han asistido (hasta 10MB por foto)
- ✅ **Ver su galería** organizada en cuadrícula
- ✅ **Dar likes** a fotos (propias y de otros usuarios)
- ✅ **Comentar** en las fotos
- ✅ **Eliminar** sus propias fotos
- ✅ Ver el **conteo de likes y comentarios** en tiempo real

## 🗄️ Configuración de Base de Datos

### Paso 1: Ejecutar el Script SQL

1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto **EventRadar**
3. En el menú lateral, ve a **SQL Editor**
4. Haz clic en **+ New Query**
5. Copia y pega el contenido del archivo `database/gallery_setup.sql`
6. Haz clic en **Run** (o presiona Ctrl + Enter)

El script creará:
- ✅ Tabla `user_gallery` (fotos de usuarios)
- ✅ Tabla `gallery_likes` (likes en fotos)
- ✅ Tabla `gallery_comments` (comentarios en fotos)
- ✅ Políticas RLS (seguridad a nivel de fila)
- ✅ Índices para mejor rendimiento
- ✅ Vista `user_gallery_with_stats` para consultas optimizadas

### Paso 2: Verificar el Bucket de Storage

El sistema usa el bucket `events` que ya existe en tu proyecto. Las fotos se guardan en la carpeta `gallery/`.

**Estructura de almacenamiento:**
```
events/
  └── gallery/
      ├── {userId}_{timestamp}_{random}.jpg
      ├── {userId}_{timestamp}_{random}.png
      └── ...
```

## 🎯 Cómo Usar la Galería

### Desde el Perfil de Usuario

1. Inicia sesión en la aplicación
2. Ve a tu **Perfil**
3. En "Acciones Rápidas", haz clic en **"📸 Ver Galería"**
4. Se abrirá el modal de galería

### Subir Fotos

1. Haz clic en el botón **"Subir Fotos"**
2. Selecciona una o varias imágenes (puedes seleccionar múltiples a la vez)
3. Las fotos se subirán automáticamente
4. Recibirás una notificación de confirmación

### Dar Likes

1. Haz clic en el ícono ❤️ debajo de cualquier foto
2. El contador de likes se actualizará instantáneamente
3. Haz clic de nuevo para quitar el like

### Comentar

1. Escribe tu comentario en el campo de texto debajo de la foto
2. Presiona **Enter** o haz clic en el botón de enviar ✉️
3. Tu comentario aparecerá inmediatamente

### Eliminar Fotos

1. Haz clic en el ícono 🗑️ en la esquina superior derecha de tu foto
2. Confirma la eliminación
3. La foto se eliminará del storage y de la base de datos

## 🔒 Seguridad

- ✅ **Autenticación requerida**: Solo usuarios autenticados pueden interactuar
- ✅ **RLS habilitado**: Cada usuario solo puede eliminar sus propias fotos
- ✅ **Validación de archivos**: Solo imágenes, máximo 10MB
- ✅ **Cascada en eliminación**: Al eliminar una foto, se eliminan sus likes y comentarios

## 🎨 Características Técnicas

### Tecnologías Usadas
- **React 19** con hooks (useState, useEffect, useRef)
- **Supabase** para base de datos y storage
- **Framer Motion** para animaciones
- **Tailwind CSS** para estilos
- **Lucide Icons** para iconos

### Optimizaciones
- Carga lazy de imágenes
- Índices en base de datos para consultas rápidas
- Upload múltiple de archivos
- Actualización en tiempo real de likes y comentarios

## 📊 Esquema de Base de Datos

```sql
user_gallery
├── id (UUID)
├── user_id (UUID) → auth.users
├── photo_url (TEXT)
├── caption (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

gallery_likes
├── id (UUID)
├── photo_id (UUID) → user_gallery
├── user_id (UUID) → auth.users
└── created_at (TIMESTAMP)

gallery_comments
├── id (UUID)
├── photo_id (UUID) → user_gallery
├── user_id (UUID) → auth.users
├── comment (TEXT)
└── created_at (TIMESTAMP)
```

## 🚀 Próximas Mejoras (Opcional)

- [ ] Galería pública (ver fotos de todos los usuarios)
- [ ] Filtros por evento
- [ ] Etiquetas de eventos en fotos
- [ ] Compartir en redes sociales
- [ ] Descargar fotos
- [ ] Álbumes/colecciones
- [ ] Búsqueda de fotos

## 🐛 Troubleshooting

### Error: "No se pudo cargar la galería"
- Verifica que ejecutaste el script SQL
- Revisa las políticas RLS en Supabase
- Asegúrate de estar autenticado

### Error: "No se pudo subir la foto"
- Verifica que el bucket `events` existe
- Revisa las políticas del bucket
- Confirma que el archivo es una imagen y pesa menos de 10MB

### Los likes/comentarios no se actualizan
- Refresca la galería haciendo clic en "Subir Fotos" (aunque no subas nada)
- Verifica las políticas RLS de las tablas

## 📝 Notas

- Las fotos se almacenan en el bucket público `events`
- El límite de 10MB por foto puede ajustarse en el código
- Los comentarios y likes son visibles para todos los usuarios autenticados
- Solo el propietario puede eliminar sus propias fotos
