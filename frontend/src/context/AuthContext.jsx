import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userClaims, setUserClaims] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get ID token result with custom claims
        const tokenResult = await firebaseUser.getIdTokenResult();
        
        setUser(firebaseUser);
        setUserClaims({
          roles: tokenResult.claims.roles || [],
          householdId: tokenResult.claims.householdId || null
        });
      } else {
        setUser(null);
        setUserClaims(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    // Force token refresh to get latest claims
    await result.user.getIdToken(true);
    return result;
  };

  const signOut = () => {
    return firebaseSignOut(auth);
  };

  const hasRole = (role) => {
    return userClaims?.roles?.includes(role) || false;
  };

  const isAdmin = () => hasRole('admin');
  const isGuard = () => hasRole('guard');
  const isResident = () => hasRole('resident');

  const value = {
    user,
    userClaims,
    loading,
    signIn,
    signOut,
    hasRole,
    isAdmin,
    isGuard,
    isResident
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};