package com.nittobazar.app;

import android.app.Application;

public class MainApplication extends Application {
    @Override
    public void onCreate() {
        FirebaseAppInitializer.ensureInitialized(this);
        super.onCreate();
    }
}
