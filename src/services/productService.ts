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
export const transformProduct = (dbProduct: any, category?: 'women' | 'girls' | 'babies'): EnhancedProduct => {
  // Parse sizes and colors - they might be stored as strings or arrays
  let sizes: string[] = [];
  let colors: string[] = [];
  
  try {
    if (dbProduct.sizes) {
      if (typeof dbProduct.sizes === 'string') {
        sizes = dbProduct.sizes.split(',').map(s => s.trim()).filter(s => s.length > 0);
      } else if (Array.isArray(dbProduct.sizes)) {
        sizes = dbProduct.sizes;
      }
    }
    
    if (dbProduct.colors) {
      if (typeof dbProduct.colors === 'string') {
        colors = dbProduct.colors.split(',').map(c => c.trim()).filter(c => c.length > 0);
      } else if (Array.isArray(dbProduct.colors)) {
        colors = dbProduct.colors;
      }
    }
    
    // Default sizes and colors if none provided
    if (sizes.length === 0) {
      sizes = ['Free Size'];
    }
    if (colors.length === 0) {
      colors = ['Default'];
    }
    
  } catch (error) {
    console.error('Error parsing sizes/colors:', error);
    sizes = ['Free Size'];
    colors = ['Default'];
  }
  
  return {
    id: dbProduct.productId,
    productId: dbProduct.productId,
    name: dbProduct.name,
    price: dbProduct.cost,
    category: category || dbProduct.category || 'women', // Use passed category or fallback
    subcategory: dbProduct.material, // Using material as subcategory for compatibility
    material: dbProduct.material,
    cost: dbProduct.cost,
    description: dbProduct.description,
    status: dbProduct.status,
    sizes: sizes,
    colors: colors,
    images: [dbProduct.image], // Convert single image to array
    image: dbProduct.image,
    inStock: dbProduct.status === 'available',
    rating: 4.5, // Default rating - could be enhanced to fetch from ratings table
    reviews: 0,  // Default reviews count - could be enhanced
    created_at: dbProduct.created_at,
    updated_at: dbProduct.updated_at
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
    return data?.map(product => transformProduct(product, 'women')) || [];
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
    return data?.map(product => transformProduct(product, 'girls')) || [];
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
    return data?.map(product => transformProduct(product, 'babies')) || [];
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

// Fetch product by ID from any category - optimized with category hint
export const getProduct = async (productId: string, category: 'women' | 'girls' | 'babies'): Promise<EnhancedProduct | null> => {
  const table = `${category}_products`;
  
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('productId', productId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        console.log(`Product ${productId} not found in ${table}`);
        return null;
      }
      throw error;
    }
    
    return data ? transformProduct(data, category) : null;
  } catch (error) {
    console.error(`Error fetching product ${productId} from ${table}:`, error);
    return null;
  }
};

// Fetch product by ID from any category - optimized with category hint
export const fetchProductById = async (productId: string, preferredCategory?: 'women' | 'girls' | 'babies'): Promise<EnhancedProduct | null> => {
  const tables = [
    { name: 'women_products', category: 'women' as const },
    { name: 'girls_products', category: 'girls' as const },
    { name: 'babies_products', category: 'babies' as const }
  ];

  // If a preferred category is provided, search it first.
  const orderedTables = preferredCategory
    ? [
        ...tables.filter(t => t.category === preferredCategory),
        ...tables.filter(t => t.category !== preferredCategory)
      ]
    : tables;

  for (const table of orderedTables) {
    try {
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .eq('productId', productId)
        .single(); // Use .single() to enforce a single row return

      if (error) {
        if (error.code === 'PGRST116') { // Code for "Not Found"
          continue; // Product not in this table, try the next one.
        }
        // For other errors, log and re-throw.
        console.error(`Error fetching from ${table.name}:`, error);
        throw error;
      }

      if (data) {
        return transformProduct(data, table.category);
      }
    } catch (error) {
      // This catch block will handle errors thrown from the try block,
      // including re-thrown Supabase errors.
      console.error(`An unexpected error occurred while searching for product ${productId} in ${table.name}:`, error);
    }
  }

  console.log(`Product with ID ${productId} not found in any category.`);
  return null;
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