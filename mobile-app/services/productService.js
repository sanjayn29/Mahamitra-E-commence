import { supabase } from './supabaseClient';

export async function fetchFeaturedProducts(limit = 8) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, image_url, price, category, rating, is_featured')
    .eq('is_active', true)
    .eq('is_featured', true)
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('products')
    .select('category')
    .eq('is_active', true)
    .not('category', 'is', null);

  if (error) throw error;

  const categories = Array.from(new Set((data || []).map((item) => item.category))).filter(Boolean);
  return categories;
}

export async function fetchProducts({ search = '', category = 'All' }) {
  let query = supabase
    .from('products')
    .select('id, name, description, image_url, price, category, rating')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data || [];
}

export async function fetchProductDetails(productId) {
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name, description, image_url, price, category, rating, created_at')
    .eq('id', productId)
    .single();

  if (productError) throw productError;

  const { data: variants, error: variantError } = await supabase
    .from('product_variants')
    .select('id, product_id, color, size, stock_quantity, price')
    .eq('product_id', productId)
    .order('color', { ascending: true })
    .order('size', { ascending: true });

  if (variantError) throw variantError;

  return {
    ...product,
    variants: variants || [],
  };
}
