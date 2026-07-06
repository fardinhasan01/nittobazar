/* eslint-disable no-undef */
// Firebase Cloud Messaging service worker (background + locked screen on supported browsers)
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDtMBfb_9ivHVgVzl2nBiu_MZnbFTX-_Q0",
  authDomain: "nittobazarbd.firebaseapp.com",
  databaseURL: "https://nittobazarbd-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nittobazarbd",
  storageBucket: "nittobazarbd.firebasestorage.app",
  messagingSenderId: "879013081861",
  appId: "1:879013081861:web:484b497c48f072abcdfd6c",
  measurementId: "G-NMHGPTQVQ8"
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
    icon: '/logo.png',
    badge: '/logo.png',
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
