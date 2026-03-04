import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

  // Check if the user is logged in AND has the is_admin flag in their metadata
  const isAdmin = user?.user_metadata?.is_admin === true;

  // We consider admin context "loading" if the underlying auth context is still loading
  return (
    <AdminContext.Provider value={{ isAdmin, isLoading: loading }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
