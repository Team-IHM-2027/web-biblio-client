import { useAuth } from '../contexts/AuthContext';

export function useSafeAuth() {
    try {
        return useAuth();
    } catch (error) {
        // Return default auth state when provider is not available
        return {
            currentUser: null,
            user: null,
            isLoading: false,
            login: async () => { throw new Error('AuthProvider not available'); },
            logout: async () => { throw new Error('AuthProvider not available'); },
            register: async () => { throw new Error('AuthProvider not available'); },
        };
    }
}