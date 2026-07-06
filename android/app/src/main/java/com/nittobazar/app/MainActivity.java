package com.nittobazar.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        FirebaseAppInitializer.ensureInitialized(this);
        super.onCreate(savedInstanceState);
    }
}
