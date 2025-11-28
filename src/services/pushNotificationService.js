// ===============================================
// 📱 SERVICIO DE NOTIFICACIONES PUSH NATIVAS
// Web Push (navegador) + Mobile Push (Capacitor)
// ===============================================

import { supabase } from '../config/supabase';

// Solo Web Push (no nativo)
const isNative = false;

// ============================================
// CONFIGURACIÓN
// ============================================

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'TU_VAPID_PUBLIC_KEY_AQUI';

// ============================================
// 1. INICIALIZAR SERVICIO DE PUSH
// ============================================

export const initializePushNotifications = async (userId) => {
  console.log('🔔 Initializing push notifications...');

  try {
    // Solo Web Push (Service Worker)
    await initWebPush(userId);
  } catch (error) {
    console.error('❌ Error initializing push notifications:', error);
  }
};

// ============================================
// 2. WEB PUSH (NAVEGADOR)
// ============================================

async function initWebPush(userId) {
  console.log('🌐 Initializing Web Push...');

  // Verificar soporte del navegador
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ Service Workers not supported');
    return;
  }

  if (!('PushManager' in window)) {
    console.warn('⚠️ Push API not supported');
    return;
  }

  try {
    // Registrar Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('✅ Service Worker registered:', registration);

    // Solicitar permiso
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.warn('⚠️ Notification permission denied');
      return;
    }

    console.log('✅ Notification permission granted');

    // Suscribirse a push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('✅ Push subscription created:', subscription);

    // Guardar token en la base de datos
    await savePushToken(userId, subscription, 'web');

  } catch (error) {
    console.error('❌ Web Push initialization failed:', error);
  }
}



// ============================================
// 4. GUARDAR TOKEN EN BASE DE DATOS
// ============================================

async function savePushToken(userId, token, platform) {
  try {
    const tokenData = platform === 'web' ? JSON.stringify(token) : token;

    const { error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: userId,
        token: tokenData,
        platform: platform,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,platform'
      });

    if (error) {
      console.error('❌ Error saving push token:', error);
      return;
    }

    console.log('✅ Push token saved to database');
  } catch (error) {
    console.error('❌ Error saving push token:', error);
  }
}

// ============================================
// 5. ENVIAR NOTIFICACIÓN PUSH
// ============================================

export const sendPushNotification = async (userId, notification) => {
  try {
    console.log('📤 Sending push notification to user:', userId);

    // Llamar a Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        userId,
        notification: {
          title: notification.title,
          body: notification.message,
          data: {
            eventId: notification.eventId,
            type: notification.type
          }
        }
      }
    });

    if (error) {
      console.error('❌ Error sending push notification:', error);
      return false;
    }

    console.log('✅ Push notification sent:', data);
    return true;

  } catch (error) {
    console.error('❌ Error in sendPushNotification:', error);
    return false;
  }
};

// ============================================
// 6. ENVIAR NOTIFICACIÓN A TODOS LOS USUARIOS
// ============================================

export const sendPushToAll = async (notification) => {
  try {
    console.log('📤 Sending push notification to all users');

    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        notification: {
          title: notification.title,
          body: notification.message,
          data: {
            eventId: notification.eventId,
            type: notification.type
          }
        }
      }
    });

    if (error) {
      console.error('❌ Error sending broadcast push:', error);
      return false;
    }

    console.log('✅ Broadcast push sent:', data);
    return true;

  } catch (error) {
    console.error('❌ Error in sendPushToAll:', error);
    return false;
  }
};

// ============================================
// 7. NOTIFICACIÓN LOCAL (MOBILE)
// ============================================



// ============================================
// 8. MANEJAR CLICK EN NOTIFICACIÓN
// ============================================

function handleNotificationClick(data) {
  console.log('👆 Notification clicked:', data);

  if (data.eventId) {
    // Navegar al evento
    window.location.href = `/events/${data.eventId}`;
  }
}

// ============================================
// 9. DESUSCRIBIRSE DE PUSH
// ============================================

export async function unsubscribeFromPush(userId) {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
    // Eliminar token de la base de datos
    await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId);
    console.log('✅ Unsubscribed from push notifications');
  } catch (error) {
    console.error('❌ Error unsubscribing from push:', error);
  }
}

// ============================================
// 10. VERIFICAR PERMISOS
// ============================================

export async function checkPushPermission() {
  return Notification.permission === 'granted';
}

// ============================================
// UTILIDADES
// ============================================

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
