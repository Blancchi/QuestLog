import { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { subscribeToAuthState } from '../services/authService';

interface UseAuthReturn {
  user: FirebaseUser | null;
  loading: boolean;
  isGuest: boolean;
  isLoggedIn: boolean;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe; // cleanup on unmount
  }, []);

  return {
    user,
    loading,
    isGuest: user?.isAnonymous ?? false,
    isLoggedIn: !!user && !user.isAnonymous,
  };
};
