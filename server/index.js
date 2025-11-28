const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { z } = require('zod');
const handleChatRequest = require('./routes/chat');
const Stripe = require('stripe');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const { AIService } = require('./services/aiService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Inicializar servicios de pago
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY) 
  : null;

const mercadopagoClient = process.env.MERCADOPAGO_ACCESS_TOKEN
  ? new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN })
  : null;

// Inicializar servicio de IA
const aiService = new AIService();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas de geocodificación
const geocodeRouter = require('./routes/geocode');
app.use('/api/geocode', geocodeRouter);

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Validation schemas
const eventSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  date: z.string().refine((date) => new Date(date) > new Date()),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  location: z.string().min(5),
  category: z.enum(['music', 'sports', 'technology', 'food', 'art', 'business', 'education', 'other']),
  capacity: z.number().min(1).max(10000),
  price: z.number().min(0),
  image_url: z.string().url().optional(),
  user_id: z.string().uuid(),
});

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'eventradar API is running' });
});

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    const { category, location, date_from, date_to, price_max, search } = req.query;
    
    let query = supabase
      .from('events')
      .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });
    
    if (category) query = query.eq('category', category);
    if (location) query = query.ilike('location', `%${location}%`);
    if (date_from) query = query.gte('date', date_from);
    if (date_to) query = query.lte('date', date_to);
    if (price_max) query = query.lte('price', price_max);
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get event by ID
app.get('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create event
app.post('/api/events', async (req, res) => {
  try {
    const validatedData = eventSchema.parse(req.body);
    
    const { data, error } = await supabase
      .from('events')
      .insert([validatedData])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update event
app.put('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Validate partial data
    const partialSchema = eventSchema.partial();
    const validatedData = partialSchema.parse(updates);
    
    const { data, error } = await supabase
      .from('events')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete event
app.delete('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join event
app.post('/api/events/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const { data, error } = await supabase
      .from('event_attendees')
      .insert([{ event_id: id, user_id }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json(data);
  } catch (error) {
    console.error('Error joining event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Leave event
app.delete('/api/events/:id/leave', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const { error } = await supabase
      .from('event_attendees')
      .delete()
      .eq('event_id', id)
      .eq('user_id', user_id);
    
    if (error) throw error;
    
    res.json({ message: 'Left event successfully' });
  } catch (error) {
    console.error('Error leaving event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ CHAT ENDPOINT ============
app.post('/api/chat', async (req, res) => {
  await handleChatRequest(req, res, aiService);
});

// ============ PAYMENT ENDPOINTS ============

// Stripe: Create Payment Intent
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ 
        error: 'Stripe no está configurado. Por favor, configura STRIPE_SECRET_KEY en las variables de entorno.' 
      });
    }

    const { amount, currency = 'usd', metadata = {} } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount inválido' });
    }

    // Crear PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe usa centavos
      currency: currency,
      metadata: {
        ...metadata,
        integration: 'eventradar'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('[Stripe] PaymentIntent creado:', paymentIntent.id);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('[Stripe] Error:', error);
    res.status(500).json({ 
      error: 'Error al crear payment intent',
      message: error.message 
    });
  }
});

// Mercado Pago: Create Preference
app.post('/api/mercadopago/create-preference', async (req, res) => {
  try {
    if (!mercadopagoClient) {
      return res.status(503).json({ 
        error: 'Mercado Pago no está configurado. Por favor, configura MERCADOPAGO_ACCESS_TOKEN.' 
      });
    }

    const { items, payer = {}, metadata = {} } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items inválidos' });
    }

    // Crear preferencia de pago con nueva API
    const preference = new Preference(mercadopagoClient);
    const result = await preference.create({
      body: {
        items: items.map(item => ({
          title: item.title,
          unit_price: Number(item.price),
          quantity: Number(item.quantity) || 1,
          currency_id: item.currency || 'CLP'
        })),
        payer: {
          name: payer.name,
          email: payer.email
        },
        back_urls: {
          success: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success`,
          failure: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failure`,
          pending: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/pending`
        },
        auto_return: 'approved',
        metadata: metadata,
        notification_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/mercadopago/webhook`
      }
    });

    console.log('[Mercado Pago] Preference creada:', result.id);

    res.json({
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point
    });

  } catch (error) {
    console.error('[Mercado Pago] Error:', error);
    res.status(500).json({ 
      error: 'Error al crear preferencia de pago',
      message: error.message 
    });
  }
});

// Mercado Pago: Webhook para notificaciones
app.post('/api/mercadopago/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    console.log('[Mercado Pago] Webhook recibido:', type, data);
    
    // Aquí procesarías la notificación (actualizar base de datos, enviar email, etc.)
    // Por ahora solo respondemos 200 OK
    
    res.sendStatus(200);
  } catch (error) {
    console.error('[Mercado Pago] Error en webhook:', error);
    res.sendStatus(500);
  }
});

// Stripe: Webhook para eventos
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn('[Stripe] Webhook secret no configurado');
      return res.sendStatus(200);
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('[Stripe] Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log('[Stripe] Webhook recibido:', event.type);

    // Manejar diferentes tipos de eventos
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('[Stripe] Payment succeeded:', paymentIntent.id);
        // Aquí actualizarías la base de datos, enviarías email, etc.
        break;
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('[Stripe] Payment failed:', failedPayment.id);
        break;
      default:
        console.log('[Stripe] Unhandled event type:', event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[Stripe] Error en webhook:', error);
    res.sendStatus(500);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 eventradar API server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});