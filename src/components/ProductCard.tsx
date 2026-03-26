import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { EnhancedProduct } from '@/services/productService';
import { RatingDisplay } from '@/components/Rating';
import { FavoriteButton } from '@/components/FavoriteButton';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { variantService } from '@/services/variantService';

interface ProductCardProps {
  product: EnhancedProduct;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [addingToCart, setAddingToCart] = useState(false);
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const discount = product.cost && product.cost !== product.price
    ? Math.round(((product.cost - product.price) / product.cost) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Don't follow the Link
    e.stopPropagation();

    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (!product.inStock) {
      toast.error('This item is out of stock');
      return;
    }

    try {
      setAddingToCart(true);

      const variants = await variantService.getVariants(product.id, product.category);
      const inStockVariants = variants.filter((variant) => (variant.stock_quantity ?? 0) > 0);
      const displayedImage = product.images[0] || product.image || '';

      const defaultVariant = inStockVariants.find((variant) => variant.image_url === displayedImage)
        || inStockVariants[0]
        || variants[0]
        || null;

      const size = defaultVariant?.size || product.sizes?.[0] || '';
      const color = defaultVariant?.color || product.colors?.[0] || '';

      await addItem(
        {
          id: product.id,
          name: product.name,
          price: product.price,
          originalPrice: product.cost,
          category: product.category,
          image: product.image,
          images: product.images,
          description: product.description,
          inStock: product.inStock,
        } as any,
        1,
        size,
        color,
        defaultVariant?.id
      );
    } catch (error) {
      console.error('Add to cart error:', error);
    } finally {
      setAddingToCart(false);
    }
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

          {/* Add to Cart Button — appears on hover */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleAddToCart}
              disabled={addingToCart || !product.inStock}
              className="w-full py-3 bg-primary text-primary-foreground font-sans text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {addingToCart ? (
                <><Loader2 size={16} className="animate-spin" /> Adding...</>
              ) : (
                <><ShoppingCart size={16} /> Add to Cart</>
              )}
            </button>
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
