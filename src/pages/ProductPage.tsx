import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Minus, Plus, Heart, Share2, Truck, RefreshCw, Shield, ChevronLeft, Loader2 } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { useProduct } from '@/hooks/useProducts';
import { fetchProductsByCategory, EnhancedProduct } from '@/services/productService';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const { product, loading: productLoading, error } = useProduct(id || null);
  const { addItem } = useCart();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
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

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    if (!selectedColor) {
      toast.error('Please select a color');
      return;
    }
    addItem(product, quantity, selectedSize, selectedColor);
    toast.success(`${product.name} added to cart!`);
  };

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
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={`${
                      i < Math.floor(product.rating)
                        ? 'text-accent fill-accent'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-sans text-muted-foreground">
                {product.rating} ({product.reviews} reviews)
              </span>
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
            <div>
              <h3 className="font-serif text-lg font-medium mb-3">Select Size</h3>
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

            {/* Color Selection */}
            <div>
              <h3 className="font-serif text-lg font-medium mb-3">Select Color</h3>
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

            {/* Quantity & Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Quantity */}
              <div className="flex items-center border border-border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Minus size={18} />
                </button>
                <span className="w-16 text-center font-sans font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Add to Cart */}
              <Button
                onClick={handleAddToCart}
                size="lg"
                className="flex-1 gradient-primary text-primary-foreground h-12"
              >
                Add to Cart
              </Button>

              {/* Wishlist */}
              <Button variant="outline" size="icon" className="h-12 w-12">
                <Heart size={20} />
              </Button>

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
