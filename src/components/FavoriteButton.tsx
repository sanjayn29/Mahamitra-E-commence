import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/context/FavoritesContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  productId: string;
  productType: 'girls' | 'women' | 'babies';
  variant?: 'default' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const FavoriteButton = ({  
  productId, 
  productType, 
  variant = 'icon',
  size = 'md',
  className 
}: FavoriteButtonProps) => {
  const { isFavorite, toggleFavorite, loading } = useFavorites();
  const { user } = useAuth();
  
  const isCurrentlyFavorite = isFavorite(productId, productType);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(productId, productType);
  };

  const heartSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24;

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={handleClick}
        disabled={!user || loading}
        className={cn(
          "rounded-full transition-all duration-200",
          isCurrentlyFavorite 
            ? "text-red-500 hover:text-red-600" 
            : "text-muted-foreground hover:text-red-500",
          className
        )}
        title={user ? (isCurrentlyFavorite ? 'Remove from favorites' : 'Add to favorites') : 'Login to add favorites'}
      >
        <Heart 
          size={heartSize} 
          className={cn(
            "transition-all duration-200",
            isCurrentlyFavorite && "fill-current"
          )}
        />
      </Button>
    );
  }

  return (
    <Button
      variant={isCurrentlyFavorite ? "default" : "outline"}
      size={size}
      onClick={handleClick}
      disabled={!user || loading}
      className={cn(
        "transition-all duration-200",
        isCurrentlyFavorite && "bg-red-500 hover:bg-red-600 text-white",
        className
      )}
    >
      <Heart 
        size={heartSize} 
        className={cn(
          "mr-2 transition-all duration-200",
          isCurrentlyFavorite && "fill-current"
        )}
      />
      {isCurrentlyFavorite ? 'Favorited' : 'Add to Favorites'}
    </Button>
  );
};

export default FavoriteButton;