import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  loadNotificationSettings,
  saveNotificationSettings,
  type AdminNotificationSettings,
} from '@/lib/adminNotificationSettings';
import {
  registerWebFcmToken,
  initNativePushListeners,
  listenForegroundMessages,
  playNotificationSound,
  vibrateDevice,
  syncNotificationSettingsToFirestore,
} from '@/lib/adminNotifications';

export interface InAppOrderAlert {
  orderId: string;
  customerName: string;
  amount: string;
  orderNumber: string;
  phoneNumber: string;
}

const notifiedKey = 'ab-admin-notified-orders';

function loadNotifiedSet(): Set<string> {
  try {
    const raw = sessionStorage.getItem(notifiedKey);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function persistNotifiedSet(set: Set<string>) {
  sessionStorage.setItem(notifiedKey, JSON.stringify([...set].slice(-200)));
}

export function useAdminOrderNotifications(
  orders: Array<{ id: string; orderNumber?: string; orderDate?: string; pricing?: { total?: number }; customer?: { firstName?: string; lastName?: string; phone?: string }; status?: string }>,
  onOpenOrder: (orderId: string) => void
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [settings, setSettings] = useState<AdminNotificationSettings>(loadNotificationSettings);
  const [inAppAlert, setInAppAlert] = useState<InAppOrderAlert | null>(null);
  const [fcmReady, setFcmReady] = useState(false);
  const userRef = useRef<User | null>(null);
  const knownOrderIdsRef = useRef<Set<string> | null>(null);
  const notifiedRef = useRef<Set<string>>(loadNotifiedSet());

  const handleNewOrder = useCallback(
    (orderId: string, data?: Record<string, string>) => {
      if (notifiedRef.current.has(orderId)) return;
      notifiedRef.current.add(orderId);
      persistNotifiedSet(notifiedRef.current);

      const order = orders.find((o) => o.id === orderId);
      const customerName =
        data?.customerName ||
        (order?.customer
          ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim()
          : 'Customer');
      const amount = data?.amount || String(order?.pricing?.total ?? '');
      const orderNumber = order?.orderNumber || orderId;
      const phoneNumber = data?.phoneNumber || order?.customer?.phone || '';

      setInAppAlert({
        orderId,
        customerName,
        amount,
        orderNumber,
        phoneNumber,
      });

      playNotificationSound();
      vibrateDevice();
    },
    [orders]
  );

  // Deep link from push notification URL or SW message
  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId) {
      onOpenOrder(orderId);
      searchParams.delete('orderId');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, onOpenOrder]);

  useEffect(() => {
    let cancelled = false;
    let removeSwListener: (() => void) | undefined;

    void import('@capacitor/core').then(({ Capacitor }) => {
      if (cancelled || Capacitor.isNativePlatform()) return;
      const onSwMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OPEN_ORDER' && event.data.orderId) {
          onOpenOrder(event.data.orderId);
        }
      };
      navigator.serviceWorker?.addEventListener('message', onSwMessage);
      removeSwListener = () =>
        navigator.serviceWorker?.removeEventListener('message', onSwMessage);
    });

    return () => {
      cancelled = true;
      removeSwListener?.();
    };
  }, [onOpenOrder]);

  // Register FCM when admin is authenticated
  useEffect(() => {
    let unsubForeground: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      userRef.current = user;
      if (!user) {
        setFcmReady(false);
        unsubForeground?.();
        return;
      }

      const s = loadNotificationSettings();
      setSettings(s);
      await syncNotificationSettingsToFirestore(user.uid, s);

      const { Capacitor } = await import('@capacitor/core');
      const isNative = Capacitor.isNativePlatform();

      await initNativePushListeners(user.uid, {
        onOpenOrder: onOpenOrder,
        onForegroundOrder: handleNewOrder,
      });

      let token: string | null = null;
      if (!isNative) {
        token = await registerWebFcmToken(user.uid);
        const unsubPromise = listenForegroundMessages((payload) => {
          const orderId = payload.data?.orderId;
          if (!orderId) return;
          handleNewOrder(orderId, payload.data);
        });
        unsubPromise.then((unsub) => {
          unsubForeground = unsub;
        });
      }

      setFcmReady(isNative ? s.enabled : !!token);
    });

    return () => {
      unsubAuth();
      unsubForeground?.();
    };
  }, [handleNewOrder]);

  // Real-time in-app alerts when orders list updates (foreground)
  useEffect(() => {
    if (!settings.enabled) return;

    const ids = new Set(orders.map((o) => o.id));

    if (knownOrderIdsRef.current === null) {
      knownOrderIdsRef.current = ids;
      orders.forEach((o) => {
        notifiedRef.current.add(o.id);
      });
      persistNotifiedSet(notifiedRef.current);
      return;
    }

    orders.forEach((order) => {
      if (!knownOrderIdsRef.current!.has(order.id)) {
        handleNewOrder(order.id, {
          customerName: `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim(),
          amount: String(order.pricing?.total ?? ''),
          phoneNumber: order.customer?.phone || '',
        });
      }
    });

    knownOrderIdsRef.current = ids;
  }, [orders, settings.enabled, handleNewOrder]);

  const updateSettings = useCallback(async (next: AdminNotificationSettings) => {
    setSettings(next);
    saveNotificationSettings(next);
    if (userRef.current) {
      await syncNotificationSettingsToFirestore(userRef.current.uid, next);
      if (next.enabled) {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) {
          await registerWebFcmToken(userRef.current.uid);
        }
        await initNativePushListeners(userRef.current.uid, {
          onOpenOrder,
          onForegroundOrder: handleNewOrder,
        });
      }
    }
  }, []);

  const dismissAlert = useCallback(() => setInAppAlert(null), []);

  const openAlertOrder = useCallback(() => {
    if (inAppAlert) {
      onOpenOrder(inAppAlert.orderId);
      setInAppAlert(null);
    }
  }, [inAppAlert, onOpenOrder]);

  const sendTestNotification = useCallback(async () => {
    const orderId = orders[0]?.id || 'test';
    handleNewOrder(orderId, {
      customerName: 'Test Customer',
      amount: '999',
      phoneNumber: '01700000000',
    });

    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) return;
    } catch {
      // web only below
    }

    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
    if (Notification.permission === 'granted') {
      new Notification('🛒 New Order Received', {
        body: 'Customer: Test Customer | Amount: ৳999 | Order ID: #TEST',
        icon: '/logo.png',
        tag: 'test-order',
      });
    }
  }, [orders, handleNewOrder]);

  return {
    settings,
    updateSettings,
    inAppAlert,
    dismissAlert,
    openAlertOrder,
    sendTestNotification,
    fcmReady,
  };
}
