const functions = require('firebase-functions');
const { initializeApp } = require('firebase-admin/app');
const { getDatabase, ServerValue } = require('firebase-admin/database');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();

const database = getDatabase();

/**
 * Collect FCM tokens from all admin devices (respects per-admin enabled setting).
 */
async function collectAdminTokens() {
  const snap = await database.ref('admins').once('value');
  const admins = snap.val() || {};
  const tokenToUid = new Map();

  Object.entries(admins).forEach(([uid, data]) => {
    if (!data || data.settings?.enabled === false) return;

    const tokens = data.tokens || {};
    Object.values(tokens).forEach((entry) => {
      const token = typeof entry === 'string' ? entry : entry?.token;
      if (token) tokenToUid.set(token, uid);
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
    const ref = database.ref(`admins/${uid}/tokens`);
    const snap = await ref.once('value');
    const entries = snap.val() || {};
    const filtered = {};

    Object.entries(entries).forEach(([deviceId, entry]) => {
      const token = typeof entry === 'string' ? entry : entry?.token;
      if (token && !badSet.has(token)) {
        filtered[deviceId] = entry;
      }
    });

    await ref.set(filtered);
    await database.ref(`admins/${uid}/updatedAt`).set(ServerValue.TIMESTAMP);
  }
}

exports.notifyAdminsOnNewOrder = functions.database
  .ref('orders/{orderId}')
  .onCreate(async (snapshot, context) => {
    const orderId = context.params.orderId;
    const order = snapshot.val();
    if (!order) return null;

    if (order.notificationSent === true) {
      return null;
    }

    const customer = order.customer || {};
    const customerName =
      `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Customer';
    const phoneNumber = String(customer.phone || '');
    const total = order.pricing?.total ?? order.totalPrice ?? 0;
    const orderNumber = String(order.orderNumber || orderId);
    const orderStatus = String(order.status || 'pending');
    const timestamp = String(order.orderDate || new Date().toISOString());

    const { tokens, tokenToUid } = await collectAdminTokens();
    if (tokens.length === 0) {
      await snapshot.ref.update({
        notificationSent: true,
        notificationSkippedReason: 'no_admin_tokens',
      });
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
          icon: '/logo.png',
        },
        fcmOptions: {
          link: `/admin/dashboard?orderId=${orderId}`,
        },
      },
    });

    await removeInvalidTokens(tokenToUid, response.responses, tokens);

    await snapshot.ref.update({
      notificationSent: true,
      notificationSentAt: ServerValue.TIMESTAMP,
    });

    return { successCount: response.successCount, failureCount: response.failureCount };
  });
