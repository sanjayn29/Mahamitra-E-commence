import { useState, useEffect } from 'react';
import { 
  fetchAllProducts, 
  fetchProductsByCategory, 
  fetchProductById,
  searchProducts,
  EnhancedProduct 
} from '@/services/productService';

// Hook for fetching all products
export const useProducts = () => {
  const [products, setProducts] = useState<EnhancedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetchProducts();
  }, []);

  return { products, loading, error, refetch: refetchProducts };
};

// Hook for fetching products by category
export const useProductsByCategory = (category: 'women' | 'girls' | 'babies' | null) => {
  const [products, setProducts] = useState<EnhancedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!category) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await fetchProductsByCategory(category);
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  return { products, loading, error };
};

// Hook for fetching a single product by ID
export const useProduct = (productId: string | null) => {
  const [product, setProduct] = useState<EnhancedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setProduct(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await fetchProductById(productId);
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  return { product, loading, error };
};

// Hook for searching products
export const useProductSearch = (query: string, debounceMs: number = 500) => {
  const [products, setProducts] = useState<EnhancedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setProducts([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchProducts(query);
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search products');
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(debounceTimer);
  }, [query, debounceMs]);

  return { products, loading, error };
};