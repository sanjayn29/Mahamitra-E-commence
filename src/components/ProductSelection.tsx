import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem, 
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { EnhancedProduct } from '@/services/productService';

interface ProductSelectionProps {
  product: EnhancedProduct;
  quantity?: number;
  className?: string;
}

export const ProductSelection: React.FC<ProductSelectionProps> = ({
  product,
  quantity = 1,
  className = ""
}) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }

    // Check if size is required
    if (product.sizes.length > 1 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }

    // Check if color is required  
    if (product.colors.length > 1 && !selectedColor) {
      toast.error('Please select a color');
      return;
    }

    setIsAdding(true);
    try {
      await addToCart(
        product.id,
        product.category,
        quantity,
        selectedSize || product.sizes[0],
        selectedColor || product.colors[0]
      );
      
      toast.success('Added to cart successfully!', {
        description: `${product.name} - Size: ${selectedSize || product.sizes[0]}, Color: ${selectedColor || product.colors[0]}`
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Debug Info */}
      <div className="p-2 bg-gray-50 rounded text-xs">
        <p>Sizes: {JSON.stringify(product.sizes)}</p>
        <p>Colors: {JSON.stringify(product.colors)}</p>
        <p>Category: {product.category}</p>
      </div>

      {/* Size Selection */}
      {product.sizes.length > 1 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Size *</label>
          <Select value={selectedSize} onValueChange={setSelectedSize}>
            <SelectTrigger>
              <SelectValue placeholder="Select size..." />
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
      {product.colors.length > 1 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Color *</label>
          <Select value={selectedColor} onValueChange={setSelectedColor}>
            <SelectTrigger>
              <SelectValue placeholder="Select color..." />
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

      {/* Add to Cart Button */}
      <Button
        onClick={handleAddToCart}
        disabled={!product.inStock || isAdding}
        className="w-full"
      >
        <ShoppingBag className="w-4 h-4 mr-2" />
        {isAdding ? 'Adding...' : 'Add to Cart'}
      </Button>

      {/* Selected values display */}
      {(selectedSize || selectedColor) && (
        <div className="p-2 bg-blue-50 rounded text-sm">
          <p>Selected: {selectedSize || product.sizes[0]} / {selectedColor || product.colors[0]}</p>
        </div>
      )}
    </div>
  );
};