import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FavoriteButton } from './FavoriteButton';
import { RatingDisplay } from './Rating';
import { EnhancedProduct } from '@/services/productService';

interface EnhancedProductCardProps {
  product: EnhancedProduct;
  showQuickAdd?: boolean;
}

export const EnhancedProductCard: React.FC<EnhancedProductCardProps> = ({ 
  product, 
  showQuickAdd = true 
}) => {
  const { user } = useAuth();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  const discount = product.cost && product.cost !== product.price
    ? Math.round(((product.cost - product.price) / product.cost) * 100)
    : 0;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
      <div className="relative overflow-hidden">
        <img
          src={product.images && product.images.length > 0 ? product.images[0] : product.image || '/placeholder-image.jpg'}
          alt={product.name}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-image.jpg';
          }}
        />
        {!product.inStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-bold text-lg">Out of Stock</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <FavoriteButton 
            productId={product.id} 
            productType={product.category} 
          />
        </div>
        {product.category && (
          <Badge className="absolute top-2 left-2 bg-purple-100 text-purple-800">
            {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
          </Badge>
        )}
        {discount > 0 && (
          <Badge className="absolute bottom-2 left-2 bg-red-500 text-white">
            -{discount}% OFF
          </Badge>
        )}
      </div>
        
      <CardContent className="p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-semibold text-lg mb-2 hover:text-purple-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-center gap-2 mb-2">
          <RatingDisplay 
            productId={product.id}
            productType={product.category}
            size="sm"
            showCount={true}
          />
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-purple-600">
            ₹{product.price.toLocaleString()}
          </span>
          {product.cost && product.cost !== product.price && (
            <span className="text-lg text-gray-500 line-through">
              ₹{product.cost.toLocaleString()}
            </span>
          )}
        </div>

        {showQuickAdd && product.inStock && (
          <>
            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-3">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Size
                </label>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.sizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-3">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Color
                </label>
                <Select value={selectedColor} onValueChange={setSelectedColor}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.colors.map((color) => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedProductCard;