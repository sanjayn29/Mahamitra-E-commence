import { supabase } from './supabaseClient';

export async function fetchCartItems(userId) {
  const { data, error } = await supabase
    .from('cart_items')
    .select('id, quantity, variant_id, product_variants(id, color, size, stock_quantity, price, product_id, products(id, name, image_url, price))')
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
}

export async function addToCart({ userId, variantId, quantity }) {
  const { data: existing, error: existingError } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', userId)
    .eq('variant_id', variantId)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing?.id) {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id);

    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('cart_items').insert({
    user_id: userId,
    variant_id: variantId,
    quantity,
  });

  if (error) throw error;
}

export async function updateCartItemQuantity(itemId, quantity) {
  const { error } = await supabase.from('cart_items').update({ quantity }).eq('id', itemId);
  if (error) throw error;
}

export async function removeCartItem(itemId) {
  const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
  if (error) throw error;
}

export async function clearCart(userId) {
  const { error } = await supabase.from('cart_items').delete().eq('user_id', userId);
  if (error) throw error;
}
