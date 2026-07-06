package com.nittobazar.app;

import android.content.Context;
import android.util.Log;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import java.util.List;

/**
 * Ensures Firebase is initialized before Capacitor Push Notifications calls FirebaseMessaging.
 */
public final class FirebaseAppInitializer {

    private static final String TAG = "NittoBazarFirebase";
    private static volatile boolean initialized = false;

    private FirebaseAppInitializer() {}

    public static void ensureInitialized(Context context) {
        if (initialized) {
            return;
        }
        synchronized (FirebaseAppInitializer.class) {
            if (initialized) {
                return;
            }
            Context appContext = context.getApplicationContext();
            try {
                List<FirebaseApp> apps = FirebaseApp.getApps(appContext);
                if (!apps.isEmpty()) {
                    initialized = true;
                    return;
                }

                FirebaseOptions options = FirebaseOptions.fromResource(appContext);
                if (options != null) {
                    FirebaseApp.initializeApp(appContext, options);
                    Log.i(TAG, "Firebase initialized from google-services.json");
                } else {
                    FirebaseOptions manual =
                            new FirebaseOptions.Builder()
                                    .setApiKey("AIzaSyDtMBfb_9ivHVgVzl2nBiu_MZnbFTX-_Q0")
                                    .setProjectId("nittobazarbd")
                                    .setGcmSenderId("879013081861")
                                    .setStorageBucket("nittobazarbd.firebasestorage.app")
                                    .setApplicationId("1:879013081861:android:484b497c48f072abcdfd6c")
                                    .build();
                    FirebaseApp.initializeApp(appContext, manual);
                    Log.w(TAG, "Firebase initialized with bundled fallback options");
                }
                initialized = true;
            } catch (Exception e) {
                Log.e(TAG, "Firebase initialization failed", e);
            }
        }
    }

    public static boolean isInitialized(Context context) {
        return !FirebaseApp.getApps(context.getApplicationContext()).isEmpty();
    }
}
