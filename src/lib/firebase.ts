import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { validateFirebaseClientEnv } from "./firebaseConfig";

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, unknown> }).env || {};
export const firebaseConfiguration = validateFirebaseClientEnv(viteEnv);
export let firebaseStatus: "Configured" | "Not Configured" = firebaseConfiguration.status;

export let app: FirebaseApp | null = null;
export let auth: Auth | null = null;
export let db: Firestore | null = null;
export let storage: FirebaseStorage | null = null;

if (firebaseConfiguration.status === "Configured") {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfiguration.config) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    firebaseStatus = "Not Configured";
    console.warn("Firebase is Not Configured: client initialization failed.", error);
  }
} else {
  console.info("Firebase is Not Configured. Cloud authentication and persistence are disabled.");
}

export function getFirebaseServices(): { app: FirebaseApp; auth: Auth; db: Firestore; storage: FirebaseStorage } {
  if (!app || !auth || !db || !storage) {
    throw new Error("Firebase Not Configured: provide valid VITE_FIREBASE_* client environment values.");
  }
  return { app, auth, db, storage };
}

export {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  onAuthStateChanged
};

export type { User };
