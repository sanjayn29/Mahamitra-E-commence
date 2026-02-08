import { supabase } from '@/lib/supabaseClient';

export interface Comment {
  id: string;
  user_id: string;
  product_id: string;
  product_type: 'girls' | 'women' | 'babies';
  comment: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export interface Rating {
  id: string;
  user_id: string;
  product_id: string;
  product_type: 'girls' | 'women' | 'babies';
  rating: number;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  product_type: 'girls' | 'women' | 'babies';
  quantity: number;
  size?: string;
  color?: string;
  added_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  product_type: 'girls' | 'women' | 'babies';
  created_at: string;
}

// Comments Service
export const commentsService = {
  // Get comments for a product
  async getComments(productId: string, productType: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('product_comments')
      .select('*')
      .eq('product_id', productId)
      .eq('product_type', productType)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Add a comment
  async addComment(productId: string, productType: string, comment: string): Promise<Comment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('product_comments')
      .insert({
        product_id: productId,
        product_type: productType,
        comment,
        user_id: user.id,
        user_email: user.email,
        user_name: user.user_metadata?.full_name || user.email?.split('@')[0]
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a comment
  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('product_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
  }
};

// Ratings Service
export const ratingsService = {
  // Get ratings for a product
  async getRatings(productId: string, productType: string): Promise<Rating[]> {
    const { data, error } = await supabase
      .from('product_ratings')
      .select('*')
      .eq('product_id', productId)
      .eq('product_type', productType);

    if (error) throw error;
    return data || [];
  },

  // Get average rating for a product
  async getAverageRating(productId: string, productType: string): Promise<{ average: number; count: number }> {
    const ratings = await this.getRatings(productId, productType);
    const count = ratings.length;
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    const average = count > 0 ? sum / count : 0;
    
    return { average: Math.round(average * 10) / 10, count };
  },

  // Add or update a rating
  async upsertRating(productId: string, productType: string, rating: number): Promise<Rating> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('product_ratings')
      .upsert({
        user_id: user.id,
        product_id: productId,
        product_type: productType,
        rating
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get user's rating for a product
  async getUserRating(productId: string, productType: string): Promise<Rating | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('product_ratings')
      .select('*')
      .eq('product_id', productId)
      .eq('product_type', productType)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116: no rows found
    return data || null;
  }
};

// Cart Service
export const cartService = {
  // Get user's cart items
  async getCartItems(): Promise<CartItem[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false });

    if (error) {
      console.error('Cart fetch error:', error);
      throw error;
    }
    return data || [];
  },

  // Add item to cart
  async addToCart(
    productId: string,
    productType: string,
    quantity: number = 1,
    size?: string,
    color?: string
  ): Promise<CartItem> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Normalize size and color to empty string if not provided
    const normalizedSize = size || '';
    const normalizedColor = color || '';

    // Check for existing item with same product (current DB constraint: user_id, product_id, product_type only)
    const { data: existingItems, error: selectError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .eq('product_type', productType);

    if (selectError) {
      console.error('Error checking for existing cart item:', selectError);
      throw selectError;
    }

    // Find exact match including size and color
    const exactMatch = existingItems?.find(
      item => (item.size || '') === normalizedSize && (item.color || '') === normalizedColor
    );

    if (exactMatch) {
      // Update existing item's quantity
      const newQuantity = exactMatch.quantity + quantity;
      const { data, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', exactMatch.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Cart update error:', updateError);
        throw updateError;
      }
      return data;
    }

    // If there are existing items but no exact match, delete them first
    // (due to DB constraint limitation - can't have same product with different size/color)
    if (existingItems && existingItems.length > 0) {
      for (const item of existingItems) {
        await supabase.from('cart_items').delete().eq('id', item.id);
      }
    }

    // Insert new item
    const { data, error: insertError } = await supabase
      .from('cart_items')
      .insert({
        user_id: user.id,
        product_id: productId,
        product_type: productType,
        quantity,
        size: normalizedSize,
        color: normalizedColor,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Cart add error:', insertError);
      throw insertError;
    }
    return data;
  },

  // Update cart item quantity
  async updateCartItemQuantity(cartItemId: string, quantity: number): Promise<CartItem> {
    if (quantity <= 0) {
      // If quantity is 0 or less, remove the item from the cart.
      await this.removeFromCart(cartItemId);
      // This part of the logic might need refinement based on UI needs.
      // Returning an empty object to satisfy the type, assuming the caller will refetch cart.
      return {} as CartItem;
    }

    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId)
      .select()
      .single();

    if (error) {
      console.error('Cart quantity update error:', error);
      throw error;
    }
    return data;
  },

  // Remove item from cart
  async removeFromCart(cartItemId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)
      .eq('id', cartItemId);

    if (error) {
        console.error('Cart removal error:', error);
        throw error;
    }
  },

  // Clear the entire cart
  async clearCart(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;
  }
};

// Favorites Service
export const favoritesService = {
  // Get user's favorites
  async getFavorites(): Promise<Favorite[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Check if a product is a favorite
  async isFavorite(productId: string, productType: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .eq('product_type', productType)
      .maybeSingle();

    if (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
    return !!data;
  },

  // Add a product to favorites
  async addFavorite(productId: string, productType: string): Promise<Favorite> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        product_id: productId,
        product_type: productType
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remove a product from favorites
  async removeFavorite(productId: string, productType: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .eq('product_type', productType);

    if (error) throw error;
  },

  // Toggle a product's favorite status
  async toggleFavorite(productId: string, productType: string): Promise<boolean> {
    const isCurrentlyFavorite = await this.isFavorite(productId, productType);

    if (isCurrentlyFavorite) {
      await this.removeFavorite(productId, productType);
      return false; // It's no longer a favorite
    } else {
      await this.addFavorite(productId, productType);
      return true; // It is now a favorite
    }
  }
};