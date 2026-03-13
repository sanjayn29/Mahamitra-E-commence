import { supabase } from '@/lib/supabaseClient';
import { getCatalogProduct } from '@/services/catalogService';

export interface ProductReview {
  id: string;
  product_id: string;
  product_public_id: string;
  product_category: 'women' | 'girls' | 'babies';
  user_id: string;
  rating: number;
  review_text: string;
  created_at: string;
  profiles?: { name: string | null; email: string | null } | null;
}

type RawProductReview = Omit<ProductReview, 'profiles'>;

interface ProfileRow {
  id: string;
  name: string | null;
  email: string | null;
}

const attachProfiles = (reviews: RawProductReview[], profiles: ProfileRow[]): ProductReview[] => {
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  return reviews.map((review) => ({
    ...review,
    profiles: profileMap.get(review.user_id)
      ? {
          name: profileMap.get(review.user_id)!.name,
          email: profileMap.get(review.user_id)!.email,
        }
      : null,
  }));
};

export interface ReviewSummary {
  averageRating: number;
  count: number;
}

export const reviewService = {
  async getReviews(productPublicId: string, category: 'women' | 'girls' | 'babies'): Promise<ProductReview[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, product_id, product_public_id, product_category, user_id, rating, review_text, created_at')
      .eq('product_public_id', productPublicId)
      .eq('product_category', category)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const reviews = (data || []) as RawProductReview[];
    if (reviews.length === 0) {
      return [];
    }

    const userIds = [...new Set(reviews.map((review) => review.user_id))];
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .in('id', userIds);

    if (profilesError) {
      throw profilesError;
    }

    return attachProfiles(reviews, (profilesData || []) as ProfileRow[]);
  },

  async getReviewSummary(productPublicId: string, category: 'women' | 'girls' | 'babies'): Promise<ReviewSummary> {
    const reviews = await this.getReviews(productPublicId, category);
    if (reviews.length === 0) {
      return { averageRating: 0, count: 0 };
    }

    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return {
      averageRating: Number((sum / reviews.length).toFixed(1)),
      count: reviews.length,
    };
  },

  async upsertReview(
    productPublicId: string,
    category: 'women' | 'girls' | 'babies',
    rating: number,
    reviewText: string
  ): Promise<ProductReview> {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const catalogProduct = await getCatalogProduct(productPublicId, category);
    if (!catalogProduct) {
      throw new Error('Product catalog entry not found');
    }

    const payload = {
      product_id: catalogProduct.id,
      product_public_id: productPublicId,
      product_category: category,
      user_id: user.id,
      rating,
      review_text: reviewText,
    };

    const { error } = await supabase
      .from('reviews')
      .upsert(payload, { onConflict: 'product_id,user_id' })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    const reviews = await this.getReviews(productPublicId, category);
    const savedReview = reviews.find((review) => review.user_id === user.id);

    if (!savedReview) {
      throw new Error('Review was saved but could not be reloaded');
    }

    return savedReview;
  },

  async deleteReview(reviewId: string): Promise<void> {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      throw error;
    }
  },
};
