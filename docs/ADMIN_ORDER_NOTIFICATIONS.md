# Admin Order Notifications (FCM)

Instant push notifications when a customer places an order on AB GADGETS.

## Architecture

1. Customer completes checkout → order document created in Firestore `orders/{orderId}`.
2. Cloud Function `notifyAdminsOnNewOrder` runs once per new order (`notificationSent` flag prevents duplicates).
3. Function reads all tokens from `adminFcmTokens/{adminUid}` and sends FCM multicast.
4. Admin app registers tokens after login (web service worker + optional Capacitor Android).

**Server keys never ship in the client** — only the public VAPID key is used in the browser.

## One-time setup

### 1. Firebase Console

1. **Cloud Messaging** → enable Web Push → copy **Key pair (VAPID)**.
2. Add to project root `.env`:
   ```
   VITE_FIREBASE_VAPID_KEY=your_vapid_key
   ```
3. Deploy **Firestore rules** (includes `adminFcmTokens`):
   ```bash
   firebase deploy --only firestore:rules
   ```

### 2. Deploy Cloud Functions

```bash
cd functions && npm install && cd ..
firebase deploy --only functions
```

Requires Blaze plan for outbound FCM.

### 3. Admin app usage

1. Log in at `/admin/login`.
2. Open **Overview** → **Notification Settings**.
3. Enable notifications and allow browser permission when prompted.
4. Use **Send Test Notification** to verify sound/banner.

### 4. Android (Capacitor) — optional

```bash
npm install @capacitor/push-notifications
npx cap add android
```

Add `google-services.json` from Firebase to `android/app/`, configure FCM in Android project, then:

```bash
npm run build && npx cap sync android
```

## Notification payload

| Field | Description |
|--------|-------------|
| `orderId` | Firestore order document ID |
| `customerName` | Full name |
| `phoneNumber` | Customer phone |
| `amount` | Order total |
| `orderStatus` | e.g. `pending` |
| `timestamp` | ISO order date |

Tapping a notification opens `/admin/dashboard?orderId=...` and scrolls to that order.

## Troubleshooting

- **No push when app closed**: Deploy functions + set `VITE_FIREBASE_VAPID_KEY` + allow notifications.
- **In-app banner only**: FCM token not registered; check browser permission and console for VAPID warnings.
- **Duplicate alerts**: Prevented server-side with `notificationSent`; in-app uses session dedupe.
