import { supabase } from '@/lib/supabaseClient';

// Product interface matching our database structure
export interface Product {
  productId: string;
  name: string;
  category: 'women' | 'girls' | 'babies';
  material: string;
  cost: number;
  description: string;
  status: 'available' | 'sold' | 'out-of-stock';
  sizes: string;
  colors: string;
  image: string;
  created_at?: string;
  updated_at?: string;
}

// Enhanced Product interface for frontend compatibility
export interface EnhancedProduct {
  id: string;
  productId: string;
  name: string;
  price: number;
  category: 'women' | 'girls' | 'babies';
  subcategory: string; // Added for compatibility
  material: string;
  cost: number;
  description: string;
  status: 'available' | 'sold' | 'out-of-stock';
  sizes: string[];
  colors: string[];
  images: string[];
  image: string;
  inStock: boolean;
  rating: number;
  reviews: number;
  created_at?: string;
  updated_at?: string;
}

// Transform database product to frontend format
export const transformProduct = (dbProduct: any): EnhancedProduct => {
  return {
    id: dbProduct.productId,
    productId: dbProduct.productId,
    name: dbProduct.name,
    price: dbProduct.cost,
    category: dbProduct.category,
    subcategory: dbProduct.material, // Using material as subcategory for compatibility
    material: dbProduct.material,
    cost: dbProduct.cost,
    description: dbProduct.description,
    status: dbProduct.status,
    sizes: typeof dbProduct.sizes === 'string' ? dbProduct.sizes.split(',').map((s: string) => s.trim()) : [],
    colors: typeof dbProduct.colors === 'string' ? dbProduct.colors.split(',').map((c: string) => c.trim()) : [],
    images: dbProduct.image ? [dbProduct.image] : [],
    image: dbProduct.image,
    inStock: dbProduct.status === 'available',
    rating: 4.5, // Default rating since not in database
    reviews: Math.floor(Math.random() * 100) + 10, // Random reviews since not in database
    created_at: dbProduct.created_at,
    updated_at: dbProduct.updated_at,
  };
};

// Fetch products from women_products table
export const fetchWomenProducts = async (): Promise<EnhancedProduct[]> => {
  try {
    const { data, error } = await supabase
      .from('women_products')
      .select('*')
      .eq('status', 'available');

    if (error) throw error;
    return data?.map(transformProduct) || [];
  } catch (error) {
    console.error('Error fetching women products:', error);
    return [];
  }
};

// Fetch products from girls_products table
export const fetchGirlsProducts = async (): Promise<EnhancedProduct[]> => {
  try {
    const { data, error } = await supabase
      .from('girls_products')
      .select('*')
      .eq('status', 'available');

    if (error) throw error;
    return data?.map(transformProduct) || [];
  } catch (error) {
    console.error('Error fetching girls products:', error);
    return [];
  }
};

// Fetch products from babies_products table
export const fetchBabiesProducts = async (): Promise<EnhancedProduct[]> => {
  try {
    const { data, error } = await supabase
      .from('babies_products')
      .select('*')
      .eq('status', 'available');

    if (error) throw error;
    return data?.map(transformProduct) || [];
  } catch (error) {
    console.error('Error fetching babies products:', error);
    return [];
  }
};

// Fetch products by category
export const fetchProductsByCategory = async (category: 'women' | 'girls' | 'babies'): Promise<EnhancedProduct[]> => {
  switch (category) {
    case 'women':
      return fetchWomenProducts();
    case 'girls':
      return fetchGirlsProducts();
    case 'babies':
      return fetchBabiesProducts();
    default:
      return [];
  }
};

// Fetch all products from all categories
export const fetchAllProducts = async (): Promise<EnhancedProduct[]> => {
  try {
    const [womenProducts, girlsProducts, babiesProducts] = await Promise.all([
      fetchWomenProducts(),
      fetchGirlsProducts(),
      fetchBabiesProducts(),
    ]);

    return [...womenProducts, ...girlsProducts, ...babiesProducts];
  } catch (error) {
    console.error('Error fetching all products:', error);
    return [];
  }
};

// Fetch product by ID from any category
export const fetchProductById = async (productId: string): Promise<EnhancedProduct | null> => {
  try {
    // Try each table since we don't know which category the product belongs to
    const tables = ['women_products', 'girls_products', 'babies_products'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('productId', productId)
        .single();

      if (data && !error) {
        return transformProduct(data);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return null;
  }
};

// Search products across all categories
export const searchProducts = async (query: string): Promise<EnhancedProduct[]> => {
  try {
    const allProducts = await fetchAllProducts();
    const searchTerm = query.toLowerCase();
    
    return allProducts.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.material.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)
    );
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
};

// Get categories with product counts
export const getCategoriesWithCounts = async () => {
  try {
    const [womenCount, girlsCount, babiesCount] = await Promise.all([
      supabase.from('women_products').select('productId', { count: 'exact' }).eq('status', 'available'),
      supabase.from('girls_products').select('productId', { count: 'exact' }).eq('status', 'available'),
      supabase.from('babies_products').select('productId', { count: 'exact' }).eq('status', 'available'),
    ]);

    return {
      women: { count: womenCount.count || 0 },
      girls: { count: girlsCount.count || 0 },
      babies: { count: babiesCount.count || 0 },
    };
  } catch (error) {
    console.error('Error fetching category counts:', error);
    return {
      women: { count: 0 },
      girls: { count: 0 },
      babies: { count: 0 },
    };
  }
};