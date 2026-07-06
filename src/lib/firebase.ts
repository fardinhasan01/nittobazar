import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDtMBfb_9ivHVgVzl2nBiu_MZnbFTX-_Q0",
  authDomain: "nittobazarbd.firebaseapp.com",
  databaseURL: "https://nittobazarbd-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nittobazarbd",
  storageBucket: "nittobazarbd.firebasestorage.app",
  messagingSenderId: "879013081861",
  appId: "1:879013081861:web:484b497c48f072abcdfd6c",
  measurementId: "G-NMHGPTQVQ8"
};

const app = initializeApp(firebaseConfig);

const database = getDatabase(app);
const storage = getStorage(app);

/** Persist login across APK restarts (IndexedDB + localStorage fallback). */
let auth;
try {
  auth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  });
} catch {
  auth = getAuth(app);
}

export { database, database as db, storage, auth, app };
