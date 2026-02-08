import React, { useState } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem, 
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
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
  const { user } = useAuth();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

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

      {/* Selected values display */}
      {(selectedSize || selectedColor) && (
        <div className="p-2 bg-blue-50 rounded text-sm">
          <p>Selected: {selectedSize || product.sizes[0]} / {selectedColor || product.colors[0]}</p>
        </div>
      )}
    </div>
  );
};