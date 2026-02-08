import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { EnhancedProduct } from '@/services/productService';
import { RatingDisplay } from '@/components/Rating';
import { FavoriteButton } from '@/components/FavoriteButton';

interface ProductCardProps {
  product: EnhancedProduct;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const discount = product.cost && product.cost !== product.price
    ? Math.round(((product.cost - product.price) / product.cost) * 100)
    : 0;

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
              showCount={true}
            />
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
