# 🤖 Chatbot & 💳 Pasarela de Pagos - EventRadar

## 📋 Resumen

Este documento describe la implementación del **chatbot con IA** y la **pasarela de pagos integrada** en EventRadar.

### ✅ Características implementadas

#### Chatbot

- ✅ Modal interactivo con diseño profesional
- ✅ Búsqueda inteligente en base de conocimiento (FAQs)
- ✅ Integración con Google Gemini AI
- ✅ Respuestas contextuales según el plan seleccionado
- ✅ Fallback a respuestas estáticas si IA falla
- ✅ Preguntas rápidas sugeridas
- ✅ Historial de conversación

#### Pagos

- ✅ Modal de pago completo y profesional
- ✅ Integración con **Stripe** (tarjetas crédito/débito)
- ✅ Integración con **Mercado Pago** (todos los métodos LATAM)
- ✅ Resumen de compra con descuentos
- ✅ Validación de pagos en backend
- ✅ Webhooks para confirmación de pagos
- ✅ Modo test/sandbox

---

## 🚀 Configuración Inicial

### 1. Variables de Entorno

Edita el archivo `.env` en la raíz del proyecto:

```env
# ====================================
# PAGOS Y SUSCRIPCIONES
# ====================================

# Stripe (Tarjetas de crédito/débito)
# Obtén tus claves en: https://dashboard.stripe.com/test/apikeys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_tu_clave_publishable_aqui
STRIPE_SECRET_KEY=sk_test_tu_clave_secreta_aqui
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret_aqui

# Mercado Pago (Latinoamérica)
# Obtén tu access token en: https://www.mercadopago.com.ar/developers/panel
MERCADOPAGO_ACCESS_TOKEN=TEST-tu_access_token_aqui

# URLs del proyecto
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# IA (ya configurada)
VITE_GEMINI_API_KEY=tu_clave_gemini
```

### 2. Obtener Claves de Stripe (Modo Test)

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Inicia sesión o crea una cuenta
3. En el panel, activa "View test data" (arriba derecha)
4. Copia:
   - **Publishable key** → `VITE_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`

**Tarjetas de prueba:**

- ✅ Pago exitoso: `4242 4242 4242 4242`
- ❌ Pago rechazado: `4000 0000 0000 0002`
- Fecha: cualquier fecha futura
- CVV: cualquier 3 dígitos
- ZIP: cualquier código postal

### 3. Obtener Claves de Mercado Pago (Modo Test)

1. Ve a [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/panel)
2. Crea una aplicación
3. Ve a "Credenciales" > "Credenciales de prueba"
4. Copia el **Access Token** → `MERCADOPAGO_ACCESS_TOKEN`

**Usuarios de prueba:**

- Puedes crear usuarios de prueba en el panel de MP
- O usa el sandbox automático que te redirige

---

## 📂 Estructura de Archivos

```
EventRadar/
├── src/
│   ├── components/
│   │   ├── ChatbotModal.jsx          # Modal del chatbot
│   │   └── PaymentModal.jsx          # Modal de pago
│   ├── data/
│   │   └── chat_knowledge.json       # Base de conocimiento (FAQs)
│   └── pages/
│       └── PricingPage.jsx           # Integración chat + pago
├── server/
│   ├── index.js                      # Servidor principal (endpoints)
│   └── routes/
│       └── chat.js                   # Endpoint del chatbot
└── .env                              # Variables de entorno
```

---

## 🧠 Chatbot - Cómo Funciona

### Flujo de Usuario

1. Usuario hace clic en **"Contáctanos"** en la sección de pricing
2. Se abre el `ChatbotModal`
3. Usuario escribe una pregunta
4. El cliente envía la pregunta al endpoint `/api/chat`
5. El servidor:
   - Busca FAQs relevantes por palabras clave
   - Construye contexto (FAQs + info del plan si aplica)
   - Llama a Google Gemini AI con el contexto
   - Retorna respuesta inteligente
6. Si la IA falla, devuelve respuesta estática de las FAQs

### Actualizar Base de Conocimiento

Edita `src/data/chat_knowledge.json`:

```json
{
  "faqs": [
    {
      "id": "mi-nueva-pregunta",
      "tags": ["palabra1", "palabra2"],
      "question": "¿Pregunta frecuente?",
      "answer": "Respuesta detallada aquí..."
    }
  ]
}
```

**Tags importantes:**

- Usa palabras clave que los usuarios probablemente escribirán
- Incluye sinónimos (ej: "precio", "costo", "valor")
- Mínimo 3-5 tags por FAQ

---

## 💳 Pagos - Cómo Funciona

### Flujo de Pago con Stripe

1. Usuario selecciona plan + paquete
2. Se abre `PaymentModal` con resumen
3. Usuario ingresa datos de tarjeta (Stripe Elements)
4. Al hacer clic en "Pagar":
   - Frontend llama a `/api/create-payment-intent`
   - Backend crea `PaymentIntent` con Stripe
   - Devuelve `client_secret`
   - Frontend confirma pago con `stripe.confirmCardPayment`
5. Stripe procesa pago y retorna resultado
6. Si exitoso: muestra pantalla de éxito y redirige

### Flujo de Pago con Mercado Pago

1. Usuario selecciona "Mercado Pago"
2. Frontend llama a `/api/mercadopago/create-preference`
3. Backend crea Preference con MP
4. Devuelve `init_point` (URL del checkout)
5. Usuario es redirigido a MP para completar pago
6. MP redirige a `back_urls` según resultado
7. Webhook notifica resultado al backend

### Webhooks (Producción)

**Stripe:**

1. Configura webhook en [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. URL: `https://tu-dominio.com/api/stripe/webhook`
3. Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copia el secret → `STRIPE_WEBHOOK_SECRET`

**Mercado Pago:**

- Ya configurado en el código (endpoint `/api/mercadopago/webhook`)
- MP enviará notificaciones automáticamente

---

## 🧪 Pruebas Locales

### 1. Iniciar el servidor backend

```powershell
cd server
node index.js
```

Deberías ver:

```
🚀 eventradar API server running on port 5000
📍 Health check: http://localhost:5000/api/health
```

### 2. Iniciar el frontend

```powershell
npm run dev
```

### 3. Probar el Chatbot

1. Ve a http://localhost:5173/pricing
2. Scroll hasta "¿Tienes dudas? Contáctanos"
3. Haz clic en "Contáctanos"
4. Prueba preguntas como:
   - "¿Cuánto cuesta el plan Destacado?"
   - "¿Qué métodos de pago aceptan?"
   - "¿Hay descuentos por paquetes?"

**Verificar en consola del navegador:**

- `[Chat] Mensaje recibido: ...`
- `[Chat] FAQs relevantes encontradas: 3`
- `[Chat] Llamando a aiService...`

### 4. Probar Pagos

#### Stripe:

1. Selecciona un plan (ej: Destacado → Pack 3)
2. En el modal, selecciona "Tarjeta"
3. Usa tarjeta de prueba: `4242 4242 4242 4242`
4. Fecha: `12/25`, CVV: `123`
5. Haz clic en "Pagar"

**Verificar:**

- Consola frontend: `✅ Pago exitoso: pi_xxxxx`
- Consola backend: `[Stripe] PaymentIntent creado: pi_xxxxx`
- Panel Stripe: verás el pago en "Payments"

#### Mercado Pago:

1. Selecciona un plan
2. En el modal, selecciona "Mercado Pago"
3. Haz clic en "Pagar con Mercado Pago"
4. Serás redirigido al sandbox de MP
5. Completa el pago de prueba

---

## 🔒 Seguridad

### ✅ Buenas Prácticas Implementadas

1. **Nunca exponer claves secretas en el frontend:**

   - `STRIPE_SECRET_KEY` solo en backend
   - `MERCADOPAGO_ACCESS_TOKEN` solo en backend

2. **Validación de montos en backend:**

   - El cliente envía el monto, pero el backend valida antes de crear el PaymentIntent

3. **HTTPS en producción:**

   - Stripe y MP requieren HTTPS en producción
   - Usa certificados SSL (Let's Encrypt, Cloudflare, etc.)

4. **Webhooks firmados:**

   - Stripe verifica firmas con `STRIPE_WEBHOOK_SECRET`
   - MP valida IPN/Webhooks (implementar en producción)

5. **Rate limiting:**
   - Considera agregar rate limiting en endpoints de pago (ej: express-rate-limit)

---

## 📊 Base de Datos (Opcional)

Para guardar suscripciones después de pagos exitosos, crea tabla:

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  package_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_provider TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  events_remaining INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);
```

**Actualizar endpoint de pago:**

En `server/index.js`, después de pago exitoso:

```javascript
// Guardar suscripción
const { data, error } = await supabase.from('subscriptions').insert({
  user_id: metadata.user_id,
  tier: metadata.tier,
  package_type: metadata.packageType,
  amount: paymentIntent.amount / 100,
  payment_provider: 'stripe',
  payment_id: paymentIntent.id,
  events_remaining:
    metadata.packageType === 'pack_5'
      ? 5
      : metadata.packageType === 'pack_3'
      ? 3
      : 1,
});
```

---

## 🐛 Troubleshooting

### Chatbot no responde

1. **Verificar endpoint:**

   ```powershell
   curl http://localhost:5000/api/chat -X POST -H "Content-Type: application/json" -d "{\"message\":\"hola\"}"
   ```

2. **Revisar logs del servidor:**

   - `[Chat] Mensaje recibido: ...`
   - Si falta, el endpoint no está registrado

3. **Verificar GEMINI_API_KEY:**
   - Si la IA falla, usará fallback de FAQs

### Stripe no funciona

1. **Verificar claves:**

   - Frontend: `VITE_STRIPE_PUBLISHABLE_KEY` (debe empezar con `pk_test_`)
   - Backend: `STRIPE_SECRET_KEY` (debe empezar con `sk_test_`)

2. **Error "Stripe is not defined":**

   - Verifica que `stripePromise` no sea `null`
   - Reinicia el servidor frontend

3. **Error 401/403:**
   - Clave incorrecta o expirada
   - Revisa el dashboard de Stripe

### Mercado Pago no redirige

1. **Verificar `MERCADOPAGO_ACCESS_TOKEN`**
2. **Revisar `back_urls` en código:**
   - Deben apuntar a tu frontend (`http://localhost:5173/payment/...`)
3. **Crear rutas de redirección:**

```jsx
// src/pages/PaymentSuccess.jsx
export default function PaymentSuccess() {
  return <div>¡Pago exitoso! Redirigiendo...</div>;
}

// src/App.jsx
<Route path="/payment/success" element={<PaymentSuccess />} />
<Route path="/payment/failure" element={<PaymentFailure />} />
<Route path="/payment/pending" element={<PaymentPending />} />
```

---

## 🚀 Despliegue a Producción

### 1. Variables de Entorno (Producción)

Reemplaza las claves de test por claves de producción:

**Stripe:**

- Dashboard → Desactiva "View test data"
- Copia claves de producción (empiezan con `pk_live_` y `sk_live_`)

**Mercado Pago:**

- Usa credenciales de producción (sin `TEST-`)

### 2. HTTPS Obligatorio

Stripe y MP requieren HTTPS. Opciones:

- **Vercel/Netlify**: HTTPS automático
- **VPS**: usar Nginx + Let's Encrypt
- **Cloudflare**: proxy con SSL

### 3. Webhooks en Producción

**Stripe:**

1. Dashboard → Webhooks → Add endpoint
2. URL: `https://tu-dominio.com/api/stripe/webhook`
3. Copia signing secret → `STRIPE_WEBHOOK_SECRET`

**Mercado Pago:**

1. Panel → Tu app → Webhooks
2. URL: `https://tu-dominio.com/api/mercadopago/webhook`
3. Eventos: `payment`, `merchant_order`

### 4. Backend Seguro

- Usa variables de entorno (no hardcodear claves)
- Habilita CORS solo para tu dominio frontend
- Implementa rate limiting
- Logs de auditoría de pagos

---

## 📈 Próximas Mejoras

- [ ] Implementar RAG con embeddings para chatbot más inteligente
- [ ] Panel de admin para ver suscripciones
- [ ] Emails de confirmación de pago (SendGrid/Resend)
- [ ] Reportes de pagos y analíticas
- [ ] Soporte para PayPal
- [ ] Sistema de cupones/descuentos
- [ ] Facturación automática

---

## 📞 Soporte

Si tienes problemas:

1. **Revisa logs del servidor y consola del navegador**
2. **Verifica variables de entorno**
3. **Prueba con tarjetas de test de Stripe**
4. **Consulta documentación oficial:**
   - [Stripe Docs](https://stripe.com/docs)
   - [Mercado Pago Docs](https://www.mercadopago.com.ar/developers/es/docs)
   - [Gemini API](https://ai.google.dev/docs)

---

**✅ Implementación completa y lista para usar!**
