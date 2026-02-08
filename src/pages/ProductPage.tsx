import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Heart, Share2, Truck, RefreshCw, Shield, ChevronLeft, Loader2, ShoppingBag } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { RatingDisplay, Rating } from '@/components/Rating';
import { FavoriteButton } from '@/components/FavoriteButton';
import { Comments } from '@/components/Comments';
import { useProduct } from '@/hooks/useProducts';
import { fetchProductsByCategory, EnhancedProduct } from '@/services/productService';
import { toast } from 'sonner';

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { product, loading: productLoading, error } = useProduct(id || null);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [relatedProducts, setRelatedProducts] = useState<EnhancedProduct[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  // Fetch related products when product loads
  useEffect(() => {
    if (!product) return;

    const fetchRelated = async () => {
      setRelatedLoading(true);
      try {
        const allCategoryProducts = await fetchProductsByCategory(product.category);
        const filtered = allCategoryProducts.filter((p) => p.id !== product.id).slice(0, 4);
        setRelatedProducts(filtered);
      } catch (error) {
        console.error('Error fetching related products:', error);
      } finally {
        setRelatedLoading(false);
      }
    };

    fetchRelated();
  }, [product]);

  if (productLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground font-sans">Loading product...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !product) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-serif text-3xl mb-4">Product Not Found</h1>
          <p className="text-muted-foreground font-sans mb-6">
            {error || "The product you're looking for doesn't exist."}
          </p>
          <Button asChild>
            <Link to="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const discount = product.cost && product.cost !== product.price
    ? Math.round(((product.cost - product.price) / product.cost) * 100)
    : 0;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm font-sans text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-primary transition-colors">Shop</Link>
          <span>/</span>
          <Link
            to={`/shop?category=${product.category}`}
            className="hover:text-primary transition-colors capitalize"
          >
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        {/* Back Button (Mobile) */}
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-sm font-sans mb-6 md:hidden hover:text-primary transition-colors"
        >
          <ChevronLeft size={18} />
          Back to Shop
        </Link>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-muted">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-4">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-24 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.inStock ? (
                <span className="bg-green-100 text-green-700 text-xs font-sans font-semibold px-3 py-1 rounded-full">
                  IN STOCK
                </span>
              ) : (
                <span className="bg-red-100 text-red-700 text-xs font-sans font-semibold px-3 py-1 rounded-full">
                  OUT OF STOCK
                </span>
              )}
            </div>

            {/* Title & Subcategory */}
            <div>
              <p className="text-sm text-muted-foreground font-sans uppercase tracking-wider mb-2">
                {product.subcategory}
              </p>
              <h1 className="font-serif text-3xl md:text-4xl font-semibold">{product.name}</h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <RatingDisplay 
                productId={product.id}
                productType={product.category}
                size="md"
                showCount={true}
              />
            </div>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="font-sans text-3xl font-semibold">
                ₹{product.price.toLocaleString()}
              </span>
              {discount > 0 && (
                <>
                  <span className="text-lg text-muted-foreground line-through font-sans">
                    ₹{product.cost.toLocaleString()}
                  </span>
                  <span className="bg-secondary text-secondary-foreground text-sm font-sans font-semibold px-3 py-1 rounded-full">
                    {discount}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-muted-foreground font-sans leading-relaxed">
              {product.description}
            </p>

            {/* Material */}
            {product.material && (
              <p className="text-sm font-sans">
                <span className="text-muted-foreground">Material:</span>{' '}
                <span className="font-medium">{product.material}</span>
              </p>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <h3 className="font-serif text-lg font-medium mb-3">
                  Select Size {product.sizes.length > 1 ? '*' : ''}
                </h3>
                
                {/* Debug info */}
                <div className="mb-2 p-2 bg-gray-50 rounded text-xs">
                  Available sizes: {JSON.stringify(product.sizes)}
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[60px] h-10 px-4 rounded-lg border-2 font-sans text-sm transition-all ${
                        selectedSize === size
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <h3 className="font-serif text-lg font-medium mb-3">
                  Select Color {product.colors.length > 1 ? '*' : ''}
                </h3>
                
                {/* Debug info */}
                <div className="mb-2 p-2 bg-gray-50 rounded text-xs">
                  Available colors: {JSON.stringify(product.colors)}
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-lg border-2 font-sans text-sm transition-all ${
                        selectedColor === color
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Wishlist */}
            <div className="flex gap-4">
              <Button
                size="lg"
                className="flex-1"
                onClick={() => {
                  const params = new URLSearchParams();
                  if (selectedSize) params.append('size', selectedSize);
                  if (selectedColor) params.append('color', selectedColor);
                  navigate(`/buy-now/${product.id}?${params.toString()}`);
                }}
                disabled={!product.inStock}
              >
                <ShoppingBag size={20} className="mr-2" />
                Buy Now
              </Button>
              
              <FavoriteButton 
                productId={product.id}
                productType={product.category}
                size="md"
                variant="icon"
                className="h-12 w-12 border"
              />

              {/* Share */}
              <Button variant="outline" size="icon" className="h-12 w-12">
                <Share2 size={20} />
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                  <Truck size={18} className="text-primary" />
                </div>
                <p className="text-xs font-sans text-muted-foreground">Free Shipping</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                  <RefreshCw size={18} className="text-primary" />
                </div>
                <p className="text-xs font-sans text-muted-foreground">Easy Returns</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                  <Shield size={18} className="text-primary" />
                </div>
                <p className="text-xs font-sans text-muted-foreground">Secure Payment</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Reviews and Comments */}
        <div className="mt-16 space-y-12">
          {/* User Rating Section */}
          <div className="bg-muted/30 rounded-lg p-8">
            <h3 className="font-serif text-2xl font-semibold mb-6">Rate this Product</h3>
            <Rating 
              productId={product.id}
              productType={product.category}
              showUserRating={true}
            />
          </div>

          {/* Comments Section */}
          <div>
            <Comments 
              productId={product.id}
              productType={product.category}
            />
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-20">
            <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-8">
              You May Also Like
            </h2>
            {relatedLoading ? (
              <div className="flex justify-center items-center py-16">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-muted-foreground font-sans text-sm">Loading related products...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </MainLayout>
  );
};

export default ProductPage;
