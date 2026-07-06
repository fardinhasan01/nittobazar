import { getApp } from 'firebase/app';
import { get, ref, set, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import {
  getDeviceId,
  loadNotificationSettings,
  type AdminNotificationSettings,
} from '@/lib/adminNotificationSettings';
import { isNativePushEnabled } from '@/lib/nativePushConfig';

export interface FcmTokenEntry {
  token: string;
  deviceId: string;
  platform: string;
  updatedAt: string;
}

export async function saveAdminFcmToken(
  userId: string,
  token: string,
  platform = 'web'
): Promise<void> {
  const settings = loadNotificationSettings();
  const deviceId = getDeviceId();
  const adminRef = ref(database, `admins/${userId}`);
  const snap = await get(adminRef);

  const entry: FcmTokenEntry = {
    token,
    deviceId,
    platform,
    updatedAt: new Date().toISOString(),
  };

  if (!snap.exists()) {
    await set(adminRef, {
      tokens: {
        [deviceId]: entry,
      },
      settings: {
        enabled: settings.enabled,
        sound: settings.sound,
        vibration: settings.vibration,
      },
      updatedAt: Date.now(),
    });
    return;
  }

  const existingTokens = (snap.val()?.tokens || {}) as Record<string, FcmTokenEntry>;
  const duplicateDevice = Object.values(existingTokens).find((e) => e.token === token && e.deviceId === deviceId);
  if (duplicateDevice) {
    await update(adminRef, {
      settings: {
        enabled: settings.enabled,
        sound: settings.sound,
        vibration: settings.vibration,
      },
      updatedAt: Date.now(),
    });
    return;
  }

  await update(adminRef, {
    [`tokens/${deviceId}`]: entry,
    settings: {
      enabled: settings.enabled,
      sound: settings.sound,
      vibration: settings.vibration,
    },
    updatedAt: Date.now(),
  });
}

export async function syncNotificationSettingsToFirestore(
  userId: string,
  settings: AdminNotificationSettings
): Promise<void> {
  const adminRef = ref(database, `admins/${userId}`);
  await update(adminRef, {
      settings: {
        enabled: settings.enabled,
        sound: settings.sound,
        vibration: settings.vibration,
      },
      updatedAt: Date.now(),
  });
}

export async function registerWebFcmToken(userId: string): Promise<string | null> {
  const settings = loadNotificationSettings();
  if (!settings.enabled) return null;

  try {
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      return null;
    }
  } catch {
    // not in capacitor
  }

  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return null;
  }

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;
  if (!vapidKey) {
    console.warn('[FCM] Missing VITE_FIREBASE_VAPID_KEY — add Web Push key in Firebase Console.');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const { isSupported, getMessaging, getToken } = await import('firebase/messaging');

  if (!(await isSupported())) return null;

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
    scope: '/',
  });

  const messaging = getMessaging(getApp());
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (token) {
    await saveAdminFcmToken(userId, token, 'web');
  }

  return token;
}

export function listenForegroundMessages(
  onPayload: (payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => void
) {
  return import('firebase/messaging').then(async ({ isSupported, getMessaging, onMessage }) => {
    if (!(await isSupported())) return () => {};
    const messaging = getMessaging(getApp());
    return onMessage(messaging, onPayload);
  });
}

export async function initNativePushListeners(
  userId: string,
  handlers: {
    onOpenOrder: (orderId: string) => void;
    onForegroundOrder?: (orderId: string, data?: Record<string, string>) => void;
  }
): Promise<void> {
  if (!isNativePushEnabled()) {
    console.info(
      '[FCM] Native push disabled. In-app order alerts still work. Set VITE_NATIVE_PUSH_ENABLED=true after adding google-services.json from Firebase.'
    );
    return;
  }

  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;

    const { PushNotifications } = await import('@capacitor/push-notifications');

    await PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
      const orderId = event.notification.data?.orderId as string | undefined;
      if (orderId) handlers.onOpenOrder(orderId);
    });

    await PushNotifications.addListener('pushNotificationReceived', (event) => {
      const orderId = event.data?.orderId as string | undefined;
      if (orderId && handlers.onForegroundOrder) {
        handlers.onForegroundOrder(orderId, event.data as Record<string, string>);
      }
    });

    await registerNativePushToken(userId);
  } catch (err) {
    console.warn('[FCM] Native push listeners failed (non-fatal):', err);
  }
}

export async function registerNativePushToken(userId: string): Promise<string | null> {
  if (!isNativePushEnabled()) {
    return null;
  }

  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return null;

    const { PushNotifications } = await import('@capacitor/push-notifications');

    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') return null;

    return new Promise((resolve) => {
      let settled = false;
      const finish = (value: string | null) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      void PushNotifications.addListener('registration', async (t) => {
        if (t.value) {
          try {
            await saveAdminFcmToken(userId, t.value, Capacitor.getPlatform());
          } catch (e) {
            console.warn('[FCM] Failed to save token:', e);
          }
          finish(t.value);
        }
      });

      void PushNotifications.addListener('registrationError', (err) => {
        console.warn('[FCM] Push registration error (non-fatal):', err);
        finish(null);
      });

      void PushNotifications.register().catch((err) => {
        console.warn('[FCM] PushNotifications.register failed (non-fatal):', err);
        finish(null);
      });

      setTimeout(() => finish(null), 8000);
    });
  } catch (err) {
    console.warn('[FCM] Native push registration failed (non-fatal):', err);
    return null;
  }
}

export function playNotificationSound() {
  const settings = loadNotificationSettings();
  if (!settings.sound) return;
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // ignore
  }
}

export function vibrateDevice() {
  const settings = loadNotificationSettings();
  if (settings.vibration && 'vibrate' in navigator) {
    navigator.vibrate([200, 100, 200]);
  }
}
