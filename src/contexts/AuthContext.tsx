import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../configs/firebase';
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        try {
          const biblioUser = await authService.getCurrentUser();
          setCurrentUser(biblioUser);
          
          // Initialize WebSocket connection for user
          if (biblioUser) {
            // We'll initialize WebSocket here, but need to handle it properly
            // to avoid multiple connections
          }
        } catch (err) {
          console.error('Error loading user data:', err);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await authService.signIn({ email, password, rememberMe: false});
      
      if (result.success && result.user) {
        setCurrentUser(result.user);
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      setError(err.message);
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};