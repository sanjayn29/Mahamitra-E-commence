import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ratingsService } from '@/services/userInteractionService';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface RatingProps {
  productId: string;
  productType: 'girls' | 'women' | 'babies';
  showUserRating?: boolean; // Whether to show the user's personal rating controls
  readonly?: boolean;
}

interface RatingDisplayProps {
  productId: string;
  productType: 'girls' | 'women' | 'babies';
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

// Component for displaying average rating (read-only)
export const RatingDisplay = ({ 
  productId, 
  productType, 
  size = 'md', 
  showCount = true 
}: RatingDisplayProps) => {
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAverageRating();
  }, [productId, productType]);

  const loadAverageRating = async () => {
    try {
      const { average, count } = await ratingsService.getAverageRating(productId, productType);
      setAverageRating(average);
      setRatingCount(count);
    } catch (error) {
      console.error('Error loading rating:', error);
    } finally {
      setLoading(false);
    }
  };

  const starSize = size === 'sm' ? 12 : size === 'md' ? 16 : 20;

  if (loading) {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={starSize} className="text-muted-foreground animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={starSize}
            className={`${
              i < Math.floor(averageRating)
                ? 'text-yellow-400 fill-yellow-400'
                : i < averageRating
                ? 'text-yellow-400 fill-yellow-400/50'
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
      {showCount && (
        <span className="text-sm text-muted-foreground">
          {averageRating.toFixed(1)} ({ratingCount} {ratingCount === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
};

// Component for interactive rating (user can rate)
export const Rating = ({ 
  productId, 
  productType, 
  showUserRating = false, 
  readonly = false 
}: RatingProps) => {
  const [userRating, setUserRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user && showUserRating) {
      loadUserRating();
    }
  }, [user, productId, productType, showUserRating]);

  const loadUserRating = async () => {
    try {
      const rating = await ratingsService.getUserRating(productId, productType);
      setUserRating(rating?.rating || 0);
    } catch (error) {
      console.error('Error loading user rating:', error);
    }
  };

  const handleRating = async (rating: number) => {
    if (!user) {
      toast.error('Please login to rate products');
      return;
    }

    if (readonly) return;

    try {
      setLoading(true);
      await ratingsService.upsertRating(productId, productType, rating);
      setUserRating(rating);
      toast.success('Rating submitted successfully!');
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  if (!showUserRating) {
    return <RatingDisplay productId={productId} productType={productType} />;
  }

  return (
    <div className="space-y-3">
      {/* Average Rating Display */}
      <RatingDisplay productId={productId} productType={productType} />
      
      {/* User Rating Controls */}
      {user && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Your Rating:</p>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <button
                key={i}
                type="button"
                disabled={loading || readonly}
                onClick={() => handleRating(i + 1)}
                onMouseEnter={() => setHoveredRating(i + 1)}
                onMouseLeave={() => setHoveredRating(0)}
                className="disabled:cursor-not-allowed"
              >
                <Star
                  size={20}
                  className={`transition-colors ${
                    i < (hoveredRating || userRating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-muted-foreground hover:text-yellow-400'
                  }`}
                />
              </button>
            ))}
          </div>
          {userRating > 0 && (
            <p className="text-xs text-muted-foreground">
              You rated this product {userRating} star{userRating !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
      
      {!user && ( 
        <p className="text-sm text-muted-foreground">
          <a href="/login" className="text-primary hover:underline">
            Login
          </a>{' '}
          to rate this product
        </p>
      )}
    </div>
  );
};

export default Rating;