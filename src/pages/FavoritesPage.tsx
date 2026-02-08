import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/context/FavoritesContext';
import { useAuth } from '@/context/AuthContext';
import { FavoriteButton } from '@/components/FavoriteButton';
import { RatingDisplay } from '@/components/Rating';
import { supabase } from '@/lib/supabaseClient';
import MainLayout from '@/layouts/MainLayout';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

// This would need to be enhanced to fetch actual product details
// For now, this is a placeholder structure
interface ProductDetails {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
}

const FavoritesPage = () => {
  const { favorites, loading } = useFavorites();
  const { user } = useAuth();
  const [productDetails, setProductDetails] = useState<Record<string, ProductDetails>>({});

  // In a real implementation, you would fetch product details here
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (favorites.length === 0) return;
      
      const productDetailsMap: Record<string, ProductDetails> = {};
      
      // Fetch actual product details for each favorite
      for (const favorite of favorites) {
        try {
          let tableName = '';
          switch (favorite.product_type) {
            case 'women': tableName = 'women_products'; break;
            case 'girls': tableName = 'girls_products'; break;
            case 'babies': tableName = 'babies_products'; break;
          }
          
          if (tableName) {
            const { data, error } = await supabase
              .from(tableName)
              .select('*')
              .eq('productId', favorite.product_id)
              .single();
              
            if (data && !error) {
              productDetailsMap[favorite.product_id] = {
                id: data.productId,
                name: data.name,
                price: data.cost,
                image: data.image,
                category: favorite.product_type,
                inStock: data.status === 'available'
              };
            }
          }
        } catch (error) {
          console.error('Error fetching product details:', error);
        }
      }
      
      setProductDetails(productDetailsMap);
    };
    
    fetchProductDetails();
  }, [favorites]);

  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <Heart size={64} className="mx-auto text-muted-foreground" />
            <h1 className="text-2xl font-bold">Please Login</h1>
            <p className="text-muted-foreground">
              You need to be logged in to view your favorites.
            </p>
            <Button asChild>
              <Link to="/login">Login</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-96 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart size={28} className="text-red-500 fill-red-500" />
            <h1 className="text-3xl font-bold">My Favorites</h1>
          </div>
          <p className="text-muted-foreground">
            Items you've saved for later ({favorites.length} items)
          </p>
        </div>

        {/* Empty State */}
        {favorites.length === 0 && (
          <div className="text-center py-16">
            <Heart size={64} className="mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
            <p className="text-muted-foreground mb-6">
              Start adding products to your favorites to see them here.
            </p>
            <Button asChild>
              <Link to="/shop">Browse Products</Link>
            </Button>
          </div>
        )}

        {/* Favorites Grid */}
        {favorites.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((favorite) => {
              const product = productDetails[favorite.product_id];
              
              return (
                <Card key={favorite.id} className="group hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-0">
                    {/* Product Image */}
                    <div className="relative aspect-[3/4] bg-muted rounded-t-lg overflow-hidden">
                      <img
                        src={product?.image || '/placeholder-image.jpg'}
                        alt={product?.name || 'Product'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-image.jpg';
                        }}
                      />
                      
                      {/* Favorite Button */}
                      <div className="absolute top-3 right-3">
                        <FavoriteButton 
                          productId={favorite.product_id} 
                          productType={favorite.product_type as any}
                          size="sm"
                          className="bg-white/90 hover:bg-white shadow-sm"
                        />
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <Link 
                        to={`/product/${favorite.product_id}`}
                        className="block space-y-2 hover:text-primary transition-colors"
                      >
                        <h3 className="font-semibold text-sm line-clamp-2">
                          {product?.name || 'Loading...'}
                        </h3>
                        
                        {/* Rating */}
                        <RatingDisplay 
                          productId={favorite.product_id}
                          productType={favorite.product_type as any}
                          size="sm"
                          showCount={false}
                        />
                        
                        {/* Price */}
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-primary">
                            ₹{product?.price?.toLocaleString() || '---'}
                          </span>
                          {product?.inStock ? (
                            <span className="text-xs text-green-600 font-medium">
                              In Stock
                            </span>
                          ) : (
                            <span className="text-xs text-red-600 font-medium">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default FavoritesPage;