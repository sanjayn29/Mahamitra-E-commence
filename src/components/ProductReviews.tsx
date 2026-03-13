import { useEffect, useMemo, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { reviewService, ProductReview } from '@/services/reviewService';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface ProductReviewsProps {
  productId: string;
  productType: 'women' | 'girls' | 'babies';
}

const renderStars = (rating: number, interactive = false, onClick?: (star: number) => void, hoverValue = 0) => {
  const displayRating = hoverValue || rating;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={interactive ? '' : 'cursor-default'}
          disabled={!interactive}
          onClick={() => onClick?.(star)}
        >
          <Star
            size={18}
            className={star <= displayRating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}
          />
        </button>
      ))}
    </div>
  );
};

export const ProductReviews = ({ productId, productType }: ProductReviewsProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const summary = useMemo(() => {
    if (reviews.length === 0) {
      return { average: 0, count: 0 };
    }

    const total = reviews.reduce((acc, item) => acc + item.rating, 0);
    return {
      average: Number((total / reviews.length).toFixed(1)),
      count: reviews.length,
    };
  }, [reviews]);

  const userReview = useMemo(() => {
    if (!user) {
      return null;
    }
    return reviews.find((review) => review.user_id === user.id) || null;
  }, [reviews, user]);

  useEffect(() => {
    loadReviews();
  }, [productId, productType]);

  useEffect(() => {
    if (userReview) {
      setRating(userReview.rating);
      setReviewText(userReview.review_text);
    } else {
      setRating(0);
      setReviewText('');
    }
  }, [userReview]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await reviewService.getReviews(productId, productType);
      setReviews(data);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Please login to submit a review');
      return;
    }

    if (rating < 1 || rating > 5) {
      toast.error('Please select a rating between 1 and 5');
      return;
    }

    if (!reviewText.trim()) {
      toast.error('Review text is required');
      return;
    }

    try {
      setSaving(true);
      await reviewService.upsertReview(productId, productType, rating, reviewText.trim());
      await loadReviews();
      toast.success(userReview ? 'Review updated successfully' : 'Review submitted successfully');
    } catch (error: any) {
      console.error('Error saving review:', error);
      toast.error(error.message || 'Failed to save review');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    try {
      setDeletingId(reviewId);
      await reviewService.deleteReview(reviewId);
      await loadReviews();
      toast.success('Review deleted');
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    } finally {
      setDeletingId(null);
    }
  };

  const getReviewerName = (review: ProductReview) => {
    if (review.profiles?.name) {
      return review.profiles.name;
    }
    if (review.profiles?.email) {
      return review.profiles.email.split('@')[0];
    }
    return 'Verified Buyer';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ratings and Reviews</span>
            <span className="text-sm font-normal text-muted-foreground">{summary.count} review{summary.count === 1 ? '' : 's'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            {renderStars(Math.round(summary.average))}
            <p className="text-sm text-muted-foreground">
              {summary.count === 0 ? 'No reviews yet' : `${summary.average} out of 5`}
            </p>
          </div>
        </CardContent>
      </Card>

      {user ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{userReview ? 'Update Your Review' : 'Write a Review'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div onMouseLeave={() => setHoverRating(0)} className="inline-flex" role="presentation">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    size={22}
                    className={star <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}
                  />
                </button>
              ))}
            </div>

            <Textarea
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Share quality, fit, color, and your overall experience"
            />

            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">{reviewText.length}/1000 characters</p>
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : userReview ? 'Update Review' : 'Submit Review'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Please login to submit a rating and review.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">Loading reviews...</CardContent>
          </Card>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">No reviews yet. Be the first to review this product.</CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{getReviewerName(review)}</p>
                    {renderStars(review.rating)}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    {user?.id === review.user_id && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive mt-1"
                        onClick={() => handleDelete(review.id)}
                        disabled={deletingId === review.id}
                      >
                        <Trash2 size={14} className="mr-1" />
                        {deletingId === review.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{review.review_text}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
