import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../configs/firebase';
import { authService } from '../services/auth/authService';
import { BiblioUser } from '../types/auth';

interface AuthContextType {
  currentUser: BiblioUser | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: any) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<BiblioUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<BiblioUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (user) {
        try {
          // Resolve the correct user document (Email first, then UID fallback)
          let userDocRef = doc(db, 'BiblioUser', user.email!);
          let userDocSnap = await getDoc(userDocRef);

          if (!userDocSnap.exists()) {
            userDocRef = doc(db, 'BiblioUser', user.uid);
            userDocSnap = await getDoc(userDocRef);
          }

          if (userDocSnap.exists()) {
            // Setup real-time listener for user data using the resolved reference
            unsubscribeSnapshot = onSnapshot(userDocRef, (snapshot) => {
              if (snapshot.exists()) {
                // On stocke l'ID du document (email ou UID) pour utilisation future
                const biblioUser = {
                  ...snapshot.data() as BiblioUser,
                  id: user.uid,
                  documentId: snapshot.id
                };

                // ⭐ CHECK IF USER IS BLOCKED
                if (biblioUser.etat === 'bloc') {
                  console.warn('⚠️ User is blocked, forcing logout and redirection');

                  // Store blocking info for UI
                  localStorage.setItem('userBlockStatus', JSON.stringify({
                    isBlocked: true,
                    reason: biblioUser.blockedReason || 'Violation des règles de la bibliothèque',
                    blockedAt: biblioUser.blockedAt && (biblioUser.blockedAt as any).toDate
                      ? (biblioUser.blockedAt as any).toDate().toISOString()
                      : biblioUser.blockedAt
                  }));

                  setCurrentUser(null);
                  auth.signOut();

                  if (window.location.pathname !== '/blocked' && window.location.pathname !== '/auth') {
                    window.location.href = '/blocked';
                  }
                  return;
                }

                setCurrentUser(biblioUser);
                localStorage.removeItem('userBlockStatus');
              } else {
                setCurrentUser(null);
              }
            }, (err) => {
              console.error('Firestore snapshot error:', err);
            });
          } else {
            console.warn('❌ User document not found in BiblioUser collection');
            setCurrentUser(null);
          }

        } catch (err) {
          console.error('Error loading user data:', err);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
          unsubscribeSnapshot = undefined;
        }
      }

      setIsLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await authService.signIn({ email, password, rememberMe: false });

      if (result.success && result.user) {
        // ⭐ IMMEDIATELY CHECK IF USER IS BLOCKED AFTER LOGIN
        if (result.user.etat === 'bloc') {
          // Log out immediately
          await auth.signOut();
          setCurrentUser(null);

          // Store blocking info
          localStorage.setItem('userBlockStatus', JSON.stringify({
            isBlocked: true,
            reason: result.user.blockedReason || 'Violation des règles de la bibliothèque',
            blockedAt: result.user.blockedAt && (result.user.blockedAt as any).toDate
              ? (result.user.blockedAt as any).toDate().toISOString()
              : result.user.blockedAt
          }));

          throw new Error(`Votre compte est bloqué. Raison: ${result.user.blockedReason || 'Violation des règles de la bibliothèque'}`);
        }

        setCurrentUser(result.user);
        localStorage.removeItem('userBlockStatus');
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      // If it's a blocking error, keep the error message
      if (err.message.includes('bloqué')) {
        setError(err.message);
      } else {
        // For other errors, use generic message
        setError(err.message || 'Erreur de connexion');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await authService.signUp(data);

      if (!result.success) {
        throw new Error(result.message);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await authService.signOut();
      setCurrentUser(null);
      localStorage.removeItem('userBlockStatus'); // Clear blocking info on logout
      // Clean up WebSocket connection
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (data: Partial<BiblioUser>) => {
    try {
      await authService.updateUserProfile(data);
      if (currentUser) {
        setCurrentUser({ ...currentUser, ...data });
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        isLoading,
        error,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
        updateProfile: handleUpdateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return a default context instead of throwing error
    console.warn('useAuth used outside AuthProvider, returning default context');
    return {
      currentUser: null,
      firebaseUser: null,
      isLoading: false,
      error: null,
      signIn: async () => { throw new Error('AuthProvider not available'); },
      signUp: async () => { throw new Error('AuthProvider not available'); },
      signOut: async () => { throw new Error('AuthProvider not available'); },
      updateProfile: async () => { throw new Error('AuthProvider not available'); },
    };
  }
  return context;
};