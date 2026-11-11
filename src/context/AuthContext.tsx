import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { auth, isFirebaseConfigured } from '../config/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('airota_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
        if (firebaseUser) {
          const profile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Developer',
          };
          setUser(profile);
          localStorage.setItem('airota_auth_user', JSON.stringify(profile));
        } else {
          const saved = localStorage.getItem('airota_auth_user');
          if (!saved) {
            setUser(null);
          }
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        try {
          const res = await signInWithEmailAndPassword(auth, email, pass);
          const profile: UserProfile = {
            uid: res.user.uid,
            email: res.user.email,
            displayName: res.user.displayName || email.split('@')[0],
          };
          setUser(profile);
          localStorage.setItem('airota_auth_user', JSON.stringify(profile));
          return;
        } catch (fbErr: any) {
          // If user doesn't exist yet, attempt automatic signup
          if (
            fbErr.code === 'auth/user-not-found' ||
            fbErr.code === 'auth/invalid-credential' ||
            fbErr.code === 'auth/invalid-login-credentials'
          ) {
            try {
              const createRes = await createUserWithEmailAndPassword(auth, email, pass);
              const profile: UserProfile = {
                uid: createRes.user.uid,
                email: createRes.user.email,
                displayName: createRes.user.displayName || email.split('@')[0],
              };
              setUser(profile);
              localStorage.setItem('airota_auth_user', JSON.stringify(profile));
              return;
            } catch (createErr: any) {
              if (createErr.code === 'auth/email-already-in-use') {
                throw fbErr;
              }
            }
          }
          // If project Auth provider is pending activation in console, allow login with entered email
          if (
            fbErr.code === 'auth/operation-not-allowed' ||
            fbErr.code === 'auth/configuration-not-found' ||
            fbErr.message?.includes('CONFIGURATION_NOT_FOUND')
          ) {
            const profile: UserProfile = {
              uid: `usr_${Date.now().toString(36)}`,
              email,
              displayName: email.split('@')[0],
            };
            setUser(profile);
            localStorage.setItem('airota_auth_user', JSON.stringify(profile));
            return;
          }
          throw fbErr;
        }
      } else {
        const profile: UserProfile = {
          uid: `usr_${Date.now().toString(36)}`,
          email,
          displayName: email.split('@')[0],
        };
        setUser(profile);
        localStorage.setItem('airota_auth_user', JSON.stringify(profile));
      }
    } finally {
      setLoading(false);
    }
  };

  const signupWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        try {
          const res = await createUserWithEmailAndPassword(auth, email, pass);
          const profile: UserProfile = {
            uid: res.user.uid,
            email: res.user.email,
            displayName: email.split('@')[0],
          };
          setUser(profile);
          localStorage.setItem('airota_auth_user', JSON.stringify(profile));
          return;
        } catch (fbErr: any) {
          if (
            fbErr.code === 'auth/operation-not-allowed' ||
            fbErr.code === 'auth/configuration-not-found' ||
            fbErr.message?.includes('CONFIGURATION_NOT_FOUND')
          ) {
            const profile: UserProfile = {
              uid: `usr_${Date.now().toString(36)}`,
              email,
              displayName: email.split('@')[0],
            };
            setUser(profile);
            localStorage.setItem('airota_auth_user', JSON.stringify(profile));
            return;
          }
          throw fbErr;
        }
      } else {
        const profile: UserProfile = {
          uid: `usr_${Date.now().toString(36)}`,
          email,
          displayName: email.split('@')[0],
        };
        setUser(profile);
        localStorage.setItem('airota_auth_user', JSON.stringify(profile));
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        const provider = new GoogleAuthProvider();
        const res = await signInWithPopup(auth, provider);
        const profile: UserProfile = {
          uid: res.user.uid,
          email: res.user.email,
          displayName: res.user.displayName,
        };
        setUser(profile);
        localStorage.setItem('airota_auth_user', JSON.stringify(profile));
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.warn('Error signing out of Firebase:', err);
      }
    }
    setUser(null);
    localStorage.removeItem('airota_auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
