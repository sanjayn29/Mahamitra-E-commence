import { supabase } from '@/lib/supabaseClient';

export interface ProductVariant {
  id: string;
  product_id: string;
  product_public_id: string;
  product_category: 'women' | 'girls' | 'babies';
  color: string;
  size: string;
  image_url: string;
  stock_quantity: number;
  price_override: number | null;
  created_at: string;
}

const normalizeVariant = (variant: any): ProductVariant => ({
  id: variant.id,
  product_id: variant.product_id,
  product_public_id: variant.product_public_id,
  product_category: variant.product_category,
  color: variant.color || 'Default',
  size: variant.size || 'Free Size',
  image_url: variant.image_url || '',
  stock_quantity: variant.stock_quantity ?? variant.stock ?? 0,
  price_override: variant.price_override ?? null,
  created_at: variant.created_at,
});

export const variantService = {
  async getVariants(productPublicId: string, category: 'women' | 'girls' | 'babies'): Promise<ProductVariant[]> {
    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_public_id', productPublicId)
      .eq('product_category', category)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []).map(normalizeVariant);
  },

  async getVariantById(variantId: string): Promise<ProductVariant | null> {
    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('id', variantId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? normalizeVariant(data) : null;
  },
};
