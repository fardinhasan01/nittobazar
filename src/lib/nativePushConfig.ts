import { Capacitor } from '@capacitor/core';

/**
 * Native FCM requires google-services.json + Android app in Firebase Console.
 * Set VITE_NATIVE_PUSH_ENABLED=true only after replacing android/app/google-services.json
 * with the file downloaded from Firebase (package com.nittobazar.app).
 */
export function isNativePushEnabled(): boolean {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }
  return import.meta.env.VITE_NATIVE_PUSH_ENABLED === 'true';
}
