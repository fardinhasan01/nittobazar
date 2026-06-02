const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();

const db = getFirestore();

/**
 * Collect FCM tokens from all admin devices (respects per-admin enabled setting).
 */
async function collectAdminTokens() {
  const snap = await db.collection('adminFcmTokens').get();
  const tokenToUid = new Map();

  snap.forEach((docSnap) => {
    const data = docSnap.data() || {};
    if (data.settings?.enabled === false) return;

    const entries = data.tokens || [];
    entries.forEach((entry) => {
      const token = typeof entry === 'string' ? entry : entry?.token;
      if (token) tokenToUid.set(token, docSnap.id);
    });
  });

  return { tokens: [...tokenToUid.keys()], tokenToUid };
}

function isInvalidTokenError(code) {
  return (
    code === 'messaging/invalid-registration-token' ||
    code === 'messaging/registration-token-not-registered'
  );
}

async function removeInvalidTokens(tokenToUid, responses, tokens) {
  const invalidByUid = new Map();

  responses.forEach((resp, idx) => {
    if (!resp.success && isInvalidTokenError(resp.error?.code)) {
      const badToken = tokens[idx];
      const uid = tokenToUid.get(badToken);
      if (!uid) return;
      if (!invalidByUid.has(uid)) invalidByUid.set(uid, new Set());
      invalidByUid.get(uid).add(badToken);
    }
  });

  for (const [uid, badSet] of invalidByUid) {
    const ref = db.collection('adminFcmTokens').doc(uid);
    const doc = await ref.get();
    const entries = doc.data()?.tokens || [];
    const filtered = entries.filter((entry) => {
      const t = typeof entry === 'string' ? entry : entry?.token;
      return t && !badSet.has(t);
    });
    await ref.update({
      tokens: filtered,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

exports.notifyAdminsOnNewOrder = onDocumentCreated(
  {
    document: 'orders/{orderId}',
    region: 'asia-south1',
  },
  async (event) => {
    const orderId = event.params.orderId;
    const order = event.data?.data();
    if (!order) return null;

    if (order.notificationSent === true) {
      return null;
    }

    const customer = order.customer || {};
    const customerName =
      `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Customer';
    const phoneNumber = String(customer.phone || '');
    const total =
      order.pricing?.total ?? order.totalPrice ?? 0;
    const orderNumber = String(order.orderNumber || orderId);
    const orderStatus = String(order.status || 'pending');
    const timestamp = String(order.orderDate || new Date().toISOString());

    const { tokens, tokenToUid } = await collectAdminTokens();
    if (tokens.length === 0) {
      await event.data.ref.set(
        { notificationSent: true, notificationSkippedReason: 'no_admin_tokens' },
        { merge: true }
      );
      return null;
    }

    const body = `Customer: ${customerName} | Amount: ৳${total} | Order ID: #${orderNumber}`;

    const response = await getMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title: '🛒 New Order Received',
        body,
      },
      data: {
        orderId,
        customerName,
        phoneNumber,
        amount: String(total),
        orderStatus,
        timestamp,
        type: 'new_order',
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'ab_gadgets_orders',
          priority: 'high',
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      webpush: {
        headers: { Urgency: 'high' },
        notification: {
          title: '🛒 New Order Received',
          body,
          icon: '/lovable-uploads/d3afd300-289e-412e-ab42-87bdeed21cda.png',
        },
        fcmOptions: {
          link: `/admin/dashboard?orderId=${orderId}`,
        },
      },
    });

    await removeInvalidTokens(tokenToUid, response.responses, tokens);

    await event.data.ref.set(
      {
        notificationSent: true,
        notificationSentAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { successCount: response.successCount, failureCount: response.failureCount };
  }
);
