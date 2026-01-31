import { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from 'sonner';

// Mock User type - replace with your actual user structure if needed
interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

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
  const [loading, setLoading] = useState(false); // Set to false as we are not loading from a service

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      // This is a mock sign-in.
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockUser: User = {
        uid: 'mock-user-123',
        email: 'mock.user@example.com',
        displayName: 'Mock User',
        photoURL: 'https://i.pravatar.cc/150?u=mockuser',
      };

      const mockUserData: UserData = {
        email: mockUser.email!,
        displayName: mockUser.displayName || 'Mock User',
        photoURL: mockUser.photoURL || '',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      setUser(mockUser);
      setUserData(mockUserData);

      toast.success('Welcome to Mahamitra!', {
        description: `Signed in as ${mockUser.displayName}`,
      });
    } catch (error: any) {
      console.error('Error signing in with Google (mock):', error);
      toast.error('Sign in failed', {
        description: 'An unexpected error occurred during mock sign-in.',
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // This is a mock sign-out.
      await new Promise(resolve => setTimeout(resolve, 500));
      setUser(null);
      setUserData(null);
      toast.success('Signed out successfully');
    } catch (error: any) {
      console.error('Error signing out (mock):', error);
      toast.error('Sign out failed', {
        description: 'An unexpected error occurred during mock sign-out.',
      });
    } finally {
      setLoading(false);
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
