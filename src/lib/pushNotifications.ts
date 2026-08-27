// Client-Side Push Notifications Manager for ForenClue PWA
// Supports background notifications on Android, iOS PWA (iOS 16.4+), and Desktop

import { saveFirestorePushSubscription, removeFirestorePushSubscription } from './firestoreService';
import { apiFetch } from './api';

export const DEFAULT_VAPID_PUBLIC_KEY = 'BD6x0QDTjiEXrGNy1exUxz3JEL1-LbNRNu4WTxdeAqjNG59QnJef-hMTRHNdxjQ8d_tGoOmeUmqsFIMzrkz3jpk';

export function urlBase64ToUint8Array(base64String?: string): Uint8Array {
  // Ensure we have a clean string without HTML tags, whitespace, or invalid characters
  let cleanStr = (base64String || '').trim().replace(/\s+/g, '');
  if (!cleanStr || cleanStr.includes('<') || cleanStr.length < 50) {
    cleanStr = DEFAULT_VAPID_PUBLIC_KEY;
  }

  const padding = '='.repeat((4 - (cleanStr.length % 4)) % 4);
  const base64 = (cleanStr + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  try {
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch (e) {
    console.warn('atob decoding error, falling back to manual decode:', e);
    // Manual byte decode fallback
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const bytes: number[] = [];
    let buffer = 0;
    let bits = 0;
    for (let i = 0; i < base64.length; i++) {
      const c = base64[i];
      if (c === '=') break;
      const val = chars.indexOf(c);
      if (val === -1) continue;
      buffer = (buffer << 6) | val;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        bytes.push((buffer >> bits) & 0xff);
      }
    }
    return new Uint8Array(bytes);
  }
}

export function isPushNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await registration.update().catch(() => {});
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Failed to get existing push subscription:', error);
    return null;
  }
}

export async function subscribeToPushNotifications(userInfo?: {
  id?: string | number;
  forenclueId?: string;
  role?: string;
  department?: string;
}): Promise<{ success: boolean; error?: string; subscription?: PushSubscription }> {
  if (!isPushNotificationSupported()) {
    return {
      success: false,
      error: 'Push notifications are not supported in this browser. For iOS devices, please add this app to your Home Screen first (Share > Add to Home Screen).'
    };
  }

  try {
    // 1. Ensure Service Worker is registered and ready
    await registerServiceWorker();
    const registration = await navigator.serviceWorker.ready;

    // 2. Request Notification Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        error: permission === 'denied' 
          ? 'Notification permission was denied. Please allow notifications in your device or browser settings.' 
          : 'Notification permission request was dismissed.'
      };
    }

    // 3. Obtain VAPID Public Key safely (default constant with server override)
    let publicKey = DEFAULT_VAPID_PUBLIC_KEY;
    try {
      const keyRes = await apiFetch('/api/push/vapid-public-key');
      const keyContentType = keyRes.headers.get('content-type') || '';
      if (keyRes.ok && keyContentType.includes('application/json')) {
        const keyData = await keyRes.json();
        if (keyData?.publicKey && typeof keyData.publicKey === 'string' && !keyData.publicKey.includes('<')) {
          publicKey = keyData.publicKey.trim();
        }
      }
    } catch {
      // Use default VAPID key
    }

    const uint8Key = urlBase64ToUint8Array(publicKey);

    // 4. Check for existing subscription or create new
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Standard W3C Web Push subscription with Uint8Array key
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: uint8Key
        });
      } catch (err1: any) {
        console.warn('Subscription attempt with Uint8Array failed, retrying with ArrayBuffer:', err1);
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: uint8Key.buffer
          });
        } catch (err2: any) {
          console.error('All PushManager.subscribe formats failed:', err2);
          throw new Error(err2?.message || 'Push subscription could not be created by the browser.');
        }
      }
    }

    if (!subscription) {
      throw new Error('Could not establish push notification subscription on this device.');
    }

    // 5. Persist subscription in Firestore
    const subJson = subscription.toJSON();
    await saveFirestorePushSubscription(subJson, userInfo);

    // 6. Send subscription to Express server if active
    try {
      await apiFetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subJson,
          userId: userInfo?.id ? String(userInfo.id) : undefined,
          forenclueId: userInfo?.forenclueId,
          role: userInfo?.role,
          department: userInfo?.department,
          userAgent: navigator.userAgent
        })
      });
    } catch (serverErr) {
      console.warn('Server sync warning (Firestore saved subscription):', serverErr);
    }

    return { success: true, subscription };
  } catch (error: any) {
    console.error('Push notification subscription error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to subscribe to push notifications.'
    };
  }
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!isPushNotificationSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await removeFirestorePushSubscription(endpoint);
      await apiFetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint })
      }).catch(console.error);
    }
    return true;
  } catch (error) {
    console.error('Failed to unsubscribe from push:', error);
    return false;
  }
}

export async function sendTestPushNotification(
  userId?: string | number,
  customTitle?: string,
  customBody?: string
): Promise<{ success: boolean; message?: string }> {
  const title = customTitle || 'ForenClue Background Alert';
  const body = customBody || 'Your background notifications are active! Tasks and announcements will alert your device.';

  try {
    // 1. Trigger local service worker notification immediately for verification
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && 'showNotification' in registration) {
        await registration.showNotification(title, {
          body,
          icon: '/app-icon-192.png',
          badge: '/favicon.png',
          tag: `test-push-${Date.now()}`,
          data: { url: '/profile' }
        });
      }
    }

    // 2. Also dispatch via backend/Firestore
    try {
      await apiFetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId ? String(userId) : undefined,
          title,
          body
        })
      });
    } catch {
      // Local notification already displayed
    }

    return { 
      success: true, 
      message: 'Test background notification dispatched! Check your notification tray or Home Screen.' 
    };
  } catch (error: any) {
    return { success: false, message: error?.message || 'Failed to send test notification.' };
  }
}

export async function dispatchBackgroundPush(payload: {
  userId?: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
  data?: Record<string, any>;
}): Promise<boolean> {
  try {
    const res = await apiFetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.warn('Background push dispatch warning:', err);
    return false;
  }
}

export async function showDeviceNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    url?: string;
    data?: any;
    silent?: boolean;
  }
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;

  const notifOptions: NotificationOptions = {
    body: options?.body || '',
    icon: options?.icon || '/app-icon-192.png',
    badge: options?.badge || '/favicon.png',
    tag: options?.tag || `notif-${Date.now()}`,
    data: {
      url: options?.url || '/',
      ...(options?.data || {})
    }
  };

  // 1. Try Service Worker showNotification (Supported on Android Chrome, iOS 16.4+ PWA, and Desktop)
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(title, notifOptions);
        return true;
      }
    } catch (swErr) {
      console.warn('Service worker showNotification notice:', swErr);
    }
  }

  // 2. Safe fallback for desktop browsers
  try {
    const notif = new Notification(title, {
      body: notifOptions.body,
      icon: notifOptions.icon,
      tag: notifOptions.tag
    });
    if (options?.url) {
      notif.onclick = () => {
        window.focus();
        window.location.href = options.url!;
      };
    }
    return true;
  } catch {
    return false;
  }
}
