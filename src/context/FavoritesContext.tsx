import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { favoritesService, Favorite } from '@/services/userInteractionService';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface FavoritesContextType {
  favorites: Favorite[];
  loading: boolean;
  isFavorite: (productId: string, productType: string) => boolean;
  toggleFavorite: (productId: string, productType: string) => Promise<void>;
  loadFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load favorites when user logs in
  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setFavorites([]);
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userFavorites = await favoritesService.getFavorites();
      setFavorites(userFavorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const isFavorite = (productId: string, productType: string): boolean => {
    return favorites.some(
      fav => fav.product_id === productId && fav.product_type === productType
    );
  };

  const toggleFavorite = async (productId: string, productType: string) => {
    if (!user) {
      toast.error('Please login to manage favorites');
      return;
    }

    try {
      // The service now returns a boolean indicating the new state.
      const isNowFavorite = await favoritesService.toggleFavorite(productId, productType);
      
      if (isNowFavorite) {
        toast.success('Added to favorites!');
      } else {
        toast.success('Removed from favorites');
      }
      
      // Instead of a full reload, we can update the state optimistically 
      // or based on the returned status. For simplicity, we'll reload.
      await loadFavorites();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        loading,
        isFavorite,
        toggleFavorite,
        loadFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};