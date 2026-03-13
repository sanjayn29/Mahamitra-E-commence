import { supabase } from '@/lib/supabaseClient';

export interface CatalogProduct {
  id: string;
  product_public_id: string;
  category: 'women' | 'girls' | 'babies';
}

export const getCatalogProduct = async (
  productPublicId: string,
  category: 'women' | 'girls' | 'babies'
): Promise<CatalogProduct | null> => {
  const { data, error } = await supabase
    .from('products')
    .select('id, product_public_id, category')
    .eq('product_public_id', productPublicId)
    .eq('category', category)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};
