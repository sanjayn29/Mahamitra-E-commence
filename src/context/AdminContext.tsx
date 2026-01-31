import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AdminContextType {
  isLoggedIn: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('adminLoggedIn') === 'true';
  });

  const login = (email: string, password: string): boolean => {
    if (email === 'mahamitra@kec' && password === 'kec@mahamitra') {
      setIsLoggedIn(true);
      sessionStorage.setItem('adminLoggedIn', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('adminLoggedIn');
  };

  return (
    <AdminContext.Provider value={{ isLoggedIn, login, logout }}>
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
