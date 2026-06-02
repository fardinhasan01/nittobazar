import { getApp } from 'firebase/app';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  getDeviceId,
  loadNotificationSettings,
  type AdminNotificationSettings,
} from '@/lib/adminNotificationSettings';

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
  const ref = doc(db, 'adminFcmTokens', userId);
  const snap = await getDoc(ref);

  const entry: FcmTokenEntry = {
    token,
    deviceId,
    platform,
    updatedAt: new Date().toISOString(),
  };

  if (!snap.exists()) {
    await setDoc(ref, {
      tokens: [entry],
      settings: {
        enabled: settings.enabled,
        sound: settings.sound,
        vibration: settings.vibration,
      },
      updatedAt: serverTimestamp(),
    });
    return;
  }

  const existing: FcmTokenEntry[] = snap.data()?.tokens || [];
  const withoutDevice = existing.filter((e) => {
    const t = typeof e === 'string' ? null : e;
    if (typeof e === 'string') return true;
    return t?.deviceId !== deviceId;
  });

  const normalized = withoutDevice
    .map((e) => (typeof e === 'string' ? { token: e, deviceId: '', platform: 'legacy', updatedAt: '' } : e))
    .filter((e) => e.token !== token);

  await setDoc(
    ref,
    {
      tokens: [...normalized, entry],
      settings: {
        enabled: settings.enabled,
        sound: settings.sound,
        vibration: settings.vibration,
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function syncNotificationSettingsToFirestore(
  userId: string,
  settings: AdminNotificationSettings
): Promise<void> {
  const ref = doc(db, 'adminFcmTokens', userId);
  await setDoc(
    ref,
    {
      settings: {
        enabled: settings.enabled,
        sound: settings.sound,
        vibration: settings.vibration,
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function registerWebFcmToken(userId: string): Promise<string | null> {
  const settings = loadNotificationSettings();
  if (!settings.enabled) return null;

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

  const { isSupported, getMessaging, getToken, onMessage } = await import('firebase/messaging');

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
  } catch {
    // Capacitor not configured on this build
  }
}

export async function registerNativePushToken(userId: string): Promise<string | null> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return null;

    const { PushNotifications } = await import('@capacitor/push-notifications');

    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') return null;

    return new Promise((resolve) => {
      void PushNotifications.addListener('registration', async (t) => {
        if (t.value) {
          await saveAdminFcmToken(userId, t.value, Capacitor.getPlatform());
          resolve(t.value);
        }
      });
      void PushNotifications.addListener('registrationError', () => resolve(null));
      void PushNotifications.register();
      setTimeout(() => resolve(null), 8000);
    });
  } catch {
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
