import { initializeApp } from "firebase/app";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

const useFirebaseEmulators =
  String(import.meta.env.VITE_USE_FIREBASE_EMULATORS ?? "").trim() === "true";
const emulatorHost = String(import.meta.env.VITE_FIREBASE_EMULATOR_HOST ?? "").trim();
const emulatorProjectId = String(
  import.meta.env.VITE_FIREBASE_EMULATOR_PROJECT_ID ?? "",
).trim();

if (useFirebaseEmulators && (!emulatorHost || emulatorProjectId !== "demo-medea-beauty")) {
  throw new Error(
    "[Firebase emulator] Host valido e project ID demo-medea-beauty sono obbligatori.",
  );
}

const firebaseConfig = {
  apiKey: "AIzaSyA2hnsrqVHSn69bvJSkKlKEcjxVvrxP4dk",
  authDomain: "medea-82bc9.firebaseapp.com",
  projectId: useFirebaseEmulators ? emulatorProjectId : "medea-82bc9",
  storageBucket: "medea-82bc9.firebasestorage.app",
  messagingSenderId: "636597757086",
  appId: "1:636597757086:web:216e5759549840a880878f",
  measurementId: "G-9DCGDZ8VL7",
};

const app = initializeApp(firebaseConfig);

let appCheckPromise;

export function ensureFirebaseAppCheck() {
  if (useFirebaseEmulators) return Promise.resolve();
  const siteKey = String(import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY ?? "").trim();
  if (!siteKey) return Promise.resolve();
  appCheckPromise ??= import("firebase/app-check").then(({
    initializeAppCheck,
    ReCaptchaEnterpriseProvider,
  }) => {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  });
  return appCheckPromise;
}

export const storage = getStorage(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app, "europe-west1");

if (useFirebaseEmulators) {
  connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, emulatorHost, 8080);
  connectFunctionsEmulator(functions, emulatorHost, 5001);
  connectStorageEmulator(storage, emulatorHost, 9199);
}
