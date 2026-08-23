import React, { createContext, useContext, useEffect, useState } from "react";
import {
  firebaseStatus,
  getFirebaseServices,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  onAuthStateChanged,
  User
} from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
  organizationId: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  configurationStatus: "Configured" | "Not Configured";
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (e: string, p: string) => Promise<void>;
  signUpWithEmail: (e: string, p: string, name: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  configurationStatus: firebaseStatus,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  sendVerificationEmail: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (firebaseStatus === "Not Configured") {
      setLoading(false);
      return;
    }
    const { auth, db } = getFirebaseServices();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Derive organization from email domain (e.g., @university.edu)
        const domain = currentUser.email?.split("@")[1] || "default-org";
        const orgId = `org-${domain.replace(/[^a-zA-Z0-9]/g, "-")}`;

        const userDocRef = doc(db, "users", currentUser.uid);
        try {
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            setUserProfile(snap.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || "",
              displayName: currentUser.displayName || currentUser.email?.split("@")[0] || "Researcher",
              photoURL: currentUser.photoURL || undefined,
              emailVerified: currentUser.emailVerified,
              organizationId: orgId,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (e) {
          console.warn("Firestore user profile fetch notice:", e);
          setUserProfile({
            uid: currentUser.uid,
            email: currentUser.email || "",
            displayName: currentUser.displayName || "Researcher",
            emailVerified: currentUser.emailVerified,
            organizationId: orgId,
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { auth } = getFirebaseServices();
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (e: string, p: string) => {
    const { auth } = getFirebaseServices();
    await signInWithEmailAndPassword(auth, e, p);
  };

  const signUpWithEmail = async (e: string, p: string, name: string) => {
    const { auth } = getFirebaseServices();
    const res = await createUserWithEmailAndPassword(auth, e, p);
    if (res.user) {
      try {
        await sendEmailVerification(res.user);
      } catch (err) {
        console.warn("Could not send verification email immediately:", err);
      }
    }
  };

  const sendVerificationEmail = async () => {
    const { auth } = getFirebaseServices();
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const logout = async () => {
    const { auth } = getFirebaseServices();
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        configurationStatus: firebaseStatus,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendVerificationEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
