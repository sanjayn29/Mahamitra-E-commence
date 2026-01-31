import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
import { toast } from 'sonner';

interface UserData {
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
  lastLoginAt: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for redirect result on component mount
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          const user = result.user;
          // Create or update user document in Firestore
          const userRef = doc(db, 'Users', user.email!);
          const userDoc = await getDoc(userRef);

          const userData: UserData = {
            email: user.email!,
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            createdAt: userDoc.exists() ? userDoc.data().createdAt : new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          };

          await setDoc(userRef, userData, { merge: true });
          setUserData(userData);

          toast.success('Welcome to Mahamitra!', {
            description: `Signed in as ${user.displayName}`,
          });
        }
      } catch (error: any) {
        console.error('Error handling redirect:', error);
        if (error.code !== 'auth/popup-closed-by-user') {
          toast.error('Sign in failed', {
            description: error.message || 'Please try again',
          });
        }
      }
    };

    checkRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, 'Users', user.email!));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      // Use redirect instead of popup to avoid COOP issues
      await signInWithRedirect(auth, googleProvider);
      // The result will be handled in the useEffect with getRedirectResult
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      
      // Provide specific error messages
      let errorMessage = 'Please try again';
      if (error.code === 'auth/configuration-not-found') {
        errorMessage = 'Google Sign-In is not configured. Please enable it in Firebase Console.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized. Please add it in Firebase Console.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error('Sign in failed', {
        description: errorMessage,
      });
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUserData(null);
      toast.success('Signed out successfully');
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast.error('Sign out failed', {
        description: error.message || 'Please try again',
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
