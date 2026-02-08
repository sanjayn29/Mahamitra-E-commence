import { Link } from 'react-router-dom';
import { Star, ShoppingBag } from 'lucide-react';
import { EnhancedProduct } from '@/services/productService';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { RatingDisplay } from '@/components/Rating';
import { FavoriteButton } from '@/components/FavoriteButton';
import { toast } from 'sonner';

interface ProductCardProps {
  product: EnhancedProduct;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCart();
  const discount = product.cost && product.cost !== product.price
    ? Math.round(((product.cost - product.price) / product.cost) * 100)
    : 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product.inStock) {
      toast.error(`${product.name} is out of stock!`);
      return;
    }

    const firstSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined;
    const firstColor = product.colors && product.colors.length > 0 ? product.colors[0] : undefined;
    
    addItem(product, 1, firstSize, firstColor);
    
    const details = [];
    if (firstSize) details.push(`Size: ${firstSize}`);
    if (firstColor) details.push(`Color: ${firstColor}`);
    
    toast.success(`${product.name} added to cart!`, {
      description: details.length > 0 ? details.join(' | ') : 'Added to cart successfully',
    });
  };

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="relative bg-card rounded-lg overflow-hidden shadow-luxe hover:shadow-luxe-lg transition-all duration-300 hover-lift">
        {/* Image Container */}
        <div className="relative aspect-[3/4] img-zoom-container bg-muted">
          <img
            src={product.images.length > 0 ? product.images[0] : product.image || '/placeholder-image.jpg'}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback for broken images
              e.currentTarget.src = '/placeholder-image.jpg';
            }}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {discount > 0 && (
              <span className="bg-secondary text-secondary-foreground text-xs font-sans font-semibold px-2 py-1 rounded">
                -{discount}%
              </span>
            )}
            {!product.inStock && (
              <span className="bg-destructive text-destructive-foreground text-xs font-sans font-semibold px-2 py-1 rounded">
                OUT OF STOCK
              </span>
            )}
          </div>

          {/* Favorite Button */}
          <div className="absolute top-3 right-3">
            <FavoriteButton 
              productId={product.id} 
              productType={product.category}
              size="sm"
              className="bg-white/80 hover:bg-white shadow-sm"
            />
          </div>

          {/* Quick Add Button */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-foreground/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              onClick={handleQuickAdd}
              disabled={!product.inStock}
              className="w-full bg-background text-foreground hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-50"
              size="sm"
            >
              <ShoppingBag size={16} className="mr-2" />
              {product.inStock ? 'Quick Add' : 'Out of Stock'}
            </Button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          <p className="text-xs text-muted-foreground font-sans uppercase tracking-wider mb-1">
            {product.subcategory}
          </p>
          <h3 className="font-serif text-lg font-medium text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="mb-2">
            <RatingDisplay 
              productId={product.id}
              productType={product.category}
              size="sm"
              showCount={false}
            />
            <span className="text-xs text-muted-foreground font-sans">
              ({product.reviews})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="font-sans font-semibold text-foreground">
              ₹{product.price.toLocaleString()}
            </span>
            {product.cost && product.cost !== product.price && (
              <span className="text-sm text-muted-foreground line-through font-sans">
                ₹{product.cost.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
