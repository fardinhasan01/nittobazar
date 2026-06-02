/* eslint-disable no-undef */
// Firebase Cloud Messaging service worker (background + locked screen on supported browsers)
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCngkkSssUDBlFV_bTa4F1eXwKZTmytDsk',
  authDomain: 'ab-gadgets-prime.firebaseapp.com',
  projectId: 'ab-gadgets-prime',
  storageBucket: 'ab-gadgets-prime.appspot.com',
  messagingSenderId: '474049729314',
  appId: '1:474049729314:web:bb3ff1641c749ac95ccb7b',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const notification = payload.notification || {};
  const title = notification.title || '🛒 New Order Received';
  const body =
    notification.body ||
    `Customer: ${data.customerName || 'Customer'} | Amount: ৳${data.amount || '0'} | Order ID: #${data.orderId || ''}`;

  const orderId = data.orderId || '';
  const targetUrl = orderId
    ? `${self.location.origin}/admin/dashboard?orderId=${orderId}`
    : `${self.location.origin}/admin/dashboard`;

  return self.registration.showNotification(title, {
    body,
    icon: '/lovable-uploads/d3afd300-289e-412e-ab42-87bdeed21cda.png',
    badge: '/lovable-uploads/d3afd300-289e-412e-ab42-87bdeed21cda.png',
    tag: orderId ? `order-${orderId}` : 'new-order',
    renotify: false,
    data: { ...data, url: targetUrl },
    vibrate: [200, 100, 200],
    requireInteraction: true,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url =
    event.notification.data?.url ||
    `${self.location.origin}/admin/dashboard`;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('/admin/dashboard') && 'focus' in client) {
            client.postMessage({
              type: 'OPEN_ORDER',
              orderId: event.notification.data?.orderId,
            });
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
