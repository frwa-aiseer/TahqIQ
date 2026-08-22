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
import {
  getFirestore,
  Firestore,
  enableIndexedDbPersistence
} from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Default configuration fallback
const defaultConfig = {
  apiKey: "AIzaSyDemoKeyForTehqIQPlatformApplet2026",
  authDomain: "tehqiq-applet.firebaseapp.com",
  projectId: "tehqiq-applet",
  storageBucket: "tehqiq-applet.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:demo1234567890"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  if (getApps().length === 0) {
    app = initializeApp(defaultConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.warn("Firebase initialization warning:", error);
  app = getApps()[0] || initializeApp(defaultConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export {
  app,
  auth,
  db,
  storage,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  onAuthStateChanged
};

export type { User };
