// src/hooks/useSafeAuth.ts
import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../configs/firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';

interface UserBlockStatus {
  isBlocked: boolean;
  reason?: string;
  blockedAt?: string;
}

export function useSafeAuth() {
  try {
    // Get the existing auth context
    const authContext = useAuth();
    
    // Add blocking state to the context
    const [blockStatus, setBlockStatus] = useState<UserBlockStatus>({
      isBlocked: false,
      reason: undefined,
      blockedAt: undefined
    });
    const [isCheckingBlocked, setIsCheckingBlocked] = useState(false);
    
    // Use a ref to track if we're already handling a blocked user
    const isHandlingBlockedRef = useRef(false);

    // Function to handle blocking and logout - useCallback with proper dependencies
    const handleBlockedUser = useCallback(async (reason: string, blockedAt?: string) => {
      // Prevent multiple simultaneous logout attempts
      if (isHandlingBlockedRef.current) {
        return;
      }
      
      isHandlingBlockedRef.current = true;
      console.log('🚨 User is blocked, initiating logout...');
      
      // Update block status
      setBlockStatus({
        isBlocked: true,
        reason,
        blockedAt
      });
      
      // Store in localStorage for persistence across sessions
      localStorage.setItem('userBlockStatus', JSON.stringify({
        isBlocked: true,
        reason,
        blockedAt
      }));

      try {
        // Sign out from Firebase
        await auth.signOut();
        
        // Also call the context's signOut if available
        if (authContext.signOut) {
          await authContext.signOut();
        }
        
        console.log('✅ User logged out successfully due to blocking');
        
        // Show alert to user
        setTimeout(() => {
          alert(`Votre compte a été bloqué. Raison: ${reason}`);
        }, 100);
        
      } catch (error) {
        console.error('❌ Error during blocked user logout:', error);
      } finally {
        // Reset the flag after a delay to prevent immediate retrigger
        setTimeout(() => {
          isHandlingBlockedRef.current = false;
        }, 1000);
      }
    }, [authContext.signOut]); // Only depend on authContext.signOut

    // Check for existing block status on mount - runs only once
    useEffect(() => {
      const storedStatus = localStorage.getItem('userBlockStatus');
      if (storedStatus) {
        const parsedStatus: UserBlockStatus = JSON.parse(storedStatus);
        if (parsedStatus.isBlocked && auth.currentUser) {
          // If user is logged in but localStorage says they're blocked, log them out
          handleBlockedUser(
            parsedStatus.reason || 'Violation des règles de la bibliothèque',
            parsedStatus.blockedAt
          );
        }
      }
    }, []); // Empty dependency array - runs only once on mount

    // Main effect for Firestore listener
    useEffect(() => {
      if (!authContext.currentUser?.id) {
        setBlockStatus({ isBlocked: false });
        return;
      }

      setIsCheckingBlocked(true);
      
      // Listen to user document for status changes
      const userDocRef = doc(db, 'users', authContext.currentUser.id);
      
      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            
            // Check if user is blocked (look for 'etat' field equal to 'bloc')
            const isBlocked = userData.etat === 'bloc';
            
            if (isBlocked && !isHandlingBlockedRef.current) {
              const blockReason = userData.blockedReason || 'Violation des règles de la bibliothèque';
              const blockedAt = userData.blockedAt || new Date().toISOString();
              
              // Update local state
              setBlockStatus({
                isBlocked: true,
                reason: blockReason,
                blockedAt: blockedAt
              });
              
              // Store in localStorage
              localStorage.setItem('userBlockStatus', JSON.stringify({
                isBlocked: true,
                reason: blockReason,
                blockedAt: blockedAt
              }));

              // Trigger logout - but don't wait for it
              handleBlockedUser(blockReason, blockedAt);
            } else if (!isBlocked) {
              // User is not blocked
              setBlockStatus({ isBlocked: false });
              localStorage.removeItem('userBlockStatus');
            }
          }
          setIsCheckingBlocked(false);
        },
        (error) => {
          console.error('Error checking blocked status:', error);
          setIsCheckingBlocked(false);
        }
      );

      return () => unsubscribe();
    }, [authContext.currentUser?.id]); // Only depend on currentUser.id

    // Simple logout function that doesn't create dependency issues
    const logout = useCallback(async () => {
      localStorage.removeItem('userBlockStatus');
      setBlockStatus({ isBlocked: false });
      if (authContext.signOut) {
        return authContext.signOut();
      }
      return auth.signOut();
    }, [authContext.signOut]);

    // Check blocked status from localStorage
    const checkBlockedStatus = useCallback((): UserBlockStatus => {
      const storedStatus = localStorage.getItem('userBlockStatus');
      if (storedStatus) {
        return JSON.parse(storedStatus);
      }
      return { isBlocked: false };
    }, []);

    // Force check blocking status
    const forceCheckBlocked = useCallback(async () => {
      if (!authContext.currentUser?.id) {
        return { isBlocked: false };
      }

      try {
        setIsCheckingBlocked(true);
        const userDocRef = doc(db, 'users', authContext.currentUser.id);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const isBlocked = userData.etat === 'bloc';
          
          if (isBlocked) {
            const blockReason = userData.blockedReason || 'Violation des règles de la bibliothèque';
            const blockedAt = userData.blockedAt || new Date().toISOString();
            
            setBlockStatus({
              isBlocked: true,
              reason: blockReason,
              blockedAt: blockedAt
            });
            
            localStorage.setItem('userBlockStatus', JSON.stringify({
              isBlocked: true,
              reason: blockReason,
              blockedAt: blockedAt
            }));
            
            // Trigger logout
            handleBlockedUser(blockReason, blockedAt);
            return { isBlocked: true, reason: blockReason, blockedAt };
          }
        }
        
        setBlockStatus({ isBlocked: false });
        localStorage.removeItem('userBlockStatus');
        return { isBlocked: false };
      } catch (error) {
        console.error('Error force checking blocked status:', error);
        return { isBlocked: false };
      } finally {
        setIsCheckingBlocked(false);
      }
    }, [authContext.currentUser?.id, handleBlockedUser]);

    return {
      ...authContext,
      isBlocked: blockStatus.isBlocked,
      blockingReason: blockStatus.reason,
      isCheckingBlocked,
      logout,
      checkBlockedStatus,
      forceCheckBlocked,
    };

  } catch (error) {
    console.error('Error in useSafeAuth:', error);
    // Return default auth state when provider is not available
    return {
      currentUser: null,
      firebaseUser: null,
      isLoading: false,
      error: null,
      isBlocked: false,
      blockingReason: undefined,
      isCheckingBlocked: false,
      signIn: async () => { throw new Error('AuthProvider not available'); },
      signUp: async () => { throw new Error('AuthProvider not available'); },
      signOut: async () => {
        localStorage.removeItem('userBlockStatus');
        throw new Error('AuthProvider not available');
      },
      updateProfile: async () => { throw new Error('AuthProvider not available'); },
      checkBlockedStatus: () => ({ isBlocked: false }),
      forceCheckBlocked: async () => ({ isBlocked: false }),
    };
  }
}