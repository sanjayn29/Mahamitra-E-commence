import { supabase } from './supabaseClient';

export async function fetchProductReviews(productId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, product_id, user_id, rating, comment, updated_at')
    .eq('product_id', productId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function upsertReview({ productId, userId, rating, comment }) {
  const { data: existing, error: existingError } = await supabase
    .from('reviews')
    .select('id')
    .eq('product_id', productId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing?.id) {
    const { error } = await supabase
      .from('reviews')
      .update({ rating, comment })
      .eq('id', existing.id);

    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      product_id: productId,
      user_id: userId,
      rating,
      comment,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}
