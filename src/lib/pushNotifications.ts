// Push Notification Manager for ForenClue PWA
// Supports background notifications on Android, iOS PWA (iOS 16.4+), and Desktop

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
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
      error: 'Push notifications are not supported in this browser. For iOS devices, please add this app to your Home Screen first.'
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
          ? 'Notification permission was denied. Please allow notifications in your browser or device settings.' 
          : 'Notification permission was dismissed.'
      };
    }

    // 3. Fetch VAPID Public Key from server
    const keyRes = await fetch('/api/push/vapid-public-key');
    if (!keyRes.ok) {
      throw new Error('Failed to retrieve push notification server key.');
    }
    const { publicKey } = await keyRes.json();

    if (!publicKey) {
      throw new Error('Push notification server key is missing.');
    }

    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    // 4. Check for existing subscription or create new
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
    }

    // 5. Send subscription details to server
    const subJson = subscription.toJSON();
    await fetch('/api/push/subscribe', {
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
      await fetch('/api/push/unsubscribe', {
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
  try {
    const res = await fetch('/api/push/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId ? String(userId) : undefined,
        title: customTitle,
        body: customBody
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to trigger test push notification.');
    }
    return { success: true, message: data.message || 'Push notification sent!' };
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
    const res = await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.error('Error dispatching background push notification:', err);
    return false;
  }
}
