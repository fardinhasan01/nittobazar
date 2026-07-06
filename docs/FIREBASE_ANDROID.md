# Firebase Android (APK crash fix)

## Cause

`PushNotifications.register()` uses native `FirebaseMessaging.getInstance()`, which requires `FirebaseApp.initializeApp()` on Android. Without `google-services.json` and early initialization, the app crashes with:

`Default FirebaseApp is not initialized in this process com.nittobazar.app`

## Fix in this repo

1. `android/app/google-services.json` — Firebase Android config (replace with file from Console if push tokens fail).
2. `MainApplication` + `MainActivity` — call `FirebaseAppInitializer.ensureInitialized()` before Capacitor loads.
3. `app/build.gradle` — Firebase BOM + `google-services` plugin when JSON exists.
4. JS — `PushNotifications.register()` only runs when `VITE_NATIVE_PUSH_ENABLED=true`.

## Enable native push (optional)

1. Firebase Console → Project **nittobazar-prime** → Add app → **Android** → package `com.nittobazar.app`.
2. Download **google-services.json** → replace `android/app/google-services.json`.
3. Add to `.env`: `VITE_NATIVE_PUSH_ENABLED=true`
4. Rebuild: `npm run build && npx cap sync android && cd android && ./gradlew assembleDebug`

In-app order alerts (Firestore realtime + banner) work without native FCM.
