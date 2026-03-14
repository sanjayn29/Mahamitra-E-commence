import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Share2, Truck, RefreshCw, Shield, ChevronLeft, Loader2, ShoppingBag, ShoppingCart } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { FavoriteButton } from '@/components/FavoriteButton';
import ProductReviews from '@/components/ProductReviews';
import { useProduct } from '@/hooks/useProducts';
import { fetchProductsByCategory, EnhancedProduct } from '@/services/productService';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { variantService, ProductVariant } from '@/services/variantService';
import { DEFAULT_VARIANT_COLOR, DEFAULT_VARIANT_SIZE } from '@/lib/productVariants';
import { toast } from 'sonner';
import SEO from '@/components/SEO';

const normalizeOption = (value: string) => value.trim().toLowerCase();

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { product, loading: productLoading, error } = useProduct(id || null);
  const { addItem, setCartOpen } = useCart();
  const { user } = useAuth();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [relatedProducts, setRelatedProducts] = useState<EnhancedProduct[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantLoading, setVariantLoading] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

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

  useEffect(() => {
    if (!product) {
      return;
    }

    let isMounted = true;

    const fetchVariants = async (showLoader = false) => {
      try {
        if (showLoader) {
          setVariantLoading(true);
        }

        const data = await variantService.getVariants(product.id, product.category);
        if (isMounted) {
          setVariants(data);
        }
      } catch (variantError) {
        console.error('Error fetching product variants:', variantError);
        if (isMounted) {
          setVariants([]);
        }
      } finally {
        if (showLoader && isMounted) {
          setVariantLoading(false);
        }
      }
    };

    const handleWindowFocus = () => {
      fetchVariants(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchVariants(false);
      }
    };

    fetchVariants(true);
    const intervalId = window.setInterval(() => fetchVariants(false), 10000);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [product?.id, product?.category]);

  const hasVariantInventory = variants.length > 0;
  const variantColors = Array.from(new Set(variants.map((variant) => variant.color)));
  const availableColors = hasVariantInventory ? variantColors : (product?.colors || []);

  const sizeRequired = product?.size_required !== false;
  const hasRealSizes = (product?.sizes || []).length > 0 &&
    !((product?.sizes || []).length === 1 && (product?.sizes || [])[0] === DEFAULT_VARIANT_SIZE);
  const showSizeSelector = sizeRequired && hasRealSizes;
  const sizeOptions = hasVariantInventory
    ? Array.from(new Set(variants.map((variant) => variant.size)))
    : (product?.sizes || []);

  useEffect(() => {
    if (!product) {
      return;
    }

    if (!hasVariantInventory) {
      if (!selectedColor) {
        setSelectedColor(product.colors[0] || '');
      }
      if (!selectedSize && showSizeSelector) {
        setSelectedSize(product.sizes[0] || '');
      }
      return;
    }

    const firstInStockVariant = variants.find((variant) => variant.stock_quantity > 0) || variants[0];
    const selectedColorKey = normalizeOption(selectedColor);
    const nextColor = variants.some((variant) => normalizeOption(variant.color) === selectedColorKey)
      ? selectedColor
      : firstInStockVariant?.color || '';
    const nextColorKey = normalizeOption(nextColor);
    const selectedSizeKey = normalizeOption(selectedSize);
    const sizesForColor = variants.filter((variant) => normalizeOption(variant.color) === nextColorKey);
    const nextSize = showSizeSelector
      ? (sizesForColor.find((variant) => variant.stock_quantity > 0 && normalizeOption(variant.size) === selectedSizeKey)?.size
        || sizesForColor.find((variant) => variant.stock_quantity > 0)?.size
        || sizesForColor[0]?.size
        || '')
      : (sizesForColor[0]?.size || DEFAULT_VARIANT_SIZE);

    if (nextColor !== selectedColor) {
      setSelectedColor(nextColor);
    }
    if (nextSize !== selectedSize) {
      setSelectedSize(nextSize);
    }
  }, [product, variants, hasVariantInventory, selectedColor, selectedSize, showSizeSelector]);

  const colorVariantOptions = hasVariantInventory
    ? availableColors.map((color) => ({
        color,
        hasStock: variants.some((variant) => normalizeOption(variant.color) === normalizeOption(color) && variant.stock_quantity > 0),
      }))
    : availableColors.map((color) => ({ color, hasStock: !!product?.inStock }));

  const sizeAvailability = sizeOptions.map((size) => ({
    size,
    hasStock: hasVariantInventory
      ? variants.some((variant) =>
          normalizeOption(variant.color) === normalizeOption(selectedColor)
          && normalizeOption(variant.size) === normalizeOption(size)
          && variant.stock_quantity > 0
        )
      : !!product?.inStock,
  }));

  const selectedVariant = hasVariantInventory
    ? variants.find((variant) =>
        normalizeOption(variant.color) === normalizeOption(selectedColor)
        && normalizeOption(variant.size) === normalizeOption(showSizeSelector ? selectedSize : (selectedSize || DEFAULT_VARIANT_SIZE))
      )
      || null
    : null;
  const baseImages = product?.images || [];

  const galleryItems = useMemo(() => {
    const items: { image: string; color?: string }[] = [];
    const usedImages = new Set<string>();

    if (hasVariantInventory) {
      availableColors.forEach((color) => {
        const colorKey = normalizeOption(color);
        const variantsForColor = variants.filter((variant) => normalizeOption(variant.color) === colorKey);
        const preferredImage = variantsForColor.find((variant) =>
          normalizeOption(variant.size) === normalizeOption(showSizeSelector ? selectedSize : (selectedSize || DEFAULT_VARIANT_SIZE))
          && !!variant.image_url
        )?.image_url
          || variantsForColor.find((variant) => variant.stock_quantity > 0 && !!variant.image_url)?.image_url
          || variantsForColor.find((variant) => !!variant.image_url)?.image_url;

        if (preferredImage && !usedImages.has(preferredImage)) {
          usedImages.add(preferredImage);
          items.push({ image: preferredImage, color });
        }
      });
    }

    baseImages.forEach((image) => {
      if (image && !usedImages.has(image)) {
        usedImages.add(image);
        items.push({ image });
      }
    });

    return items;
  }, [hasVariantInventory, availableColors, variants, showSizeSelector, selectedSize, baseImages]);

  const activeImage = galleryItems[selectedImage]?.image || galleryItems[0]?.image || '';
  const activePrice = selectedVariant?.price_override ?? product?.price ?? 0;
  const availableStock = selectedVariant?.stock_quantity ?? 0;
  const effectiveStock = hasVariantInventory ? availableStock > 0 : product?.inStock;

  useEffect(() => {
    if (selectedImage >= galleryItems.length) {
      setSelectedImage(0);
    }
  }, [selectedImage, galleryItems.length]);

  useEffect(() => {
    const selectedColorKey = normalizeOption(selectedColor);
    if (!selectedColorKey) {
      return;
    }

    const colorImageIndex = galleryItems.findIndex(
      (item) => item.color && normalizeOption(item.color) === selectedColorKey
    );

    if (colorImageIndex >= 0 && colorImageIndex !== selectedImage) {
      setSelectedImage(colorImageIndex);
    }
  }, [selectedColor, galleryItems, selectedImage]);

  useEffect(() => {
    if (!hasVariantInventory) {
      setSelectedQuantity(1);
      return;
    }

    setSelectedQuantity((currentQuantity) => {
      if (availableStock <= 0) {
        return 1;
      }

      return Math.min(currentQuantity, availableStock);
    });
  }, [hasVariantInventory, availableStock]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (!product || !effectiveStock) return;

    if (hasVariantInventory && !selectedVariant) {
      toast.error('Please select an available variant before adding to cart');
      return;
    }

    // Require size if size_required is true and product has multiple sizes
    if (sizeRequired && hasRealSizes && !selectedSize) {
      toast.error('Please select a size before adding to cart');
      return;
    }

    try {
      setAddingToCart(true);
      await addItem(
        {
          id: product.id,
          name: product.name,
          price: activePrice,
          originalPrice: product.cost,
          category: product.category,
          image: activeImage,
          images: activeImage ? [activeImage, ...product.images.filter((image) => image !== activeImage)] : product.images,
          description: product.description,
          inStock: !!effectiveStock,
        } as any,
        selectedQuantity,
        selectedVariant?.size || selectedSize || undefined,
        selectedVariant?.color || selectedColor || undefined,
        selectedVariant?.id
      );
      setCartOpen(true);
    } catch (error) {
      console.error('Add to cart error:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `https://www.mahamitra.app/product/${product?.id}`;
    const shareText = `Check out ${product?.name} at Mahamitra - Luxury Women's Apparel`;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Mahamitra', text: shareText, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast.success('Link copied to clipboard!');
        } catch {
          toast.error('Failed to share');
        }
      }
    }
  };

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

  const discount = product.cost && product.cost !== activePrice
    ? Math.round(((product.cost - activePrice) / product.cost) * 100)
    : 0;

  return (
    <MainLayout>
      <SEO
        title={`${product.name} | Mahamitra Boutique`}
        description={product.description || `Buy ${product.name} at Mahamitra Boutique. Quality clothing for women and children.`}
      />
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
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {galleryItems.length > 1 && (
              <div className="flex gap-4">
                {galleryItems.map((item, index) => (
                  <button
                    key={`${item.image}-${index}`}
                    onClick={() => {
                      setSelectedImage(index);
                      if (item.color) {
                        setSelectedColor(item.color);
                      }
                    }}
                    className={`w-20 h-24 rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === index ? 'border-primary' : 'border-transparent'
                      }`}
                  >
                    <img
                      src={item.image}
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
              {effectiveStock ? (
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

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="font-sans text-3xl font-semibold">
                ₹{activePrice.toLocaleString()}
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

            {/* Size Selection — only shown when size_required and real sizes exist */}
            {showSizeSelector && (
              <div>
                <h3 className="font-serif text-lg font-medium mb-3">
                  Select Size <span className="text-destructive">*</span>
                </h3>
                <div className="flex flex-wrap gap-3">
                  {sizeAvailability.map(({ size, hasStock }) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[60px] h-10 px-4 rounded-lg border-2 font-sans text-sm transition-all ${selectedSize === size
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary'
                        }`}
                      disabled={hasVariantInventory && !hasStock}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {availableColors && availableColors.length > 0 &&
              !(availableColors.length === 1 && availableColors[0] === 'Default') && (
                <div>
                  <h3 className="font-serif text-lg font-medium mb-3">
                    Select Color
                  </h3>
                  {variantLoading && (
                    <p className="text-xs text-muted-foreground mb-2">Loading color variants...</p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {colorVariantOptions.map(({ color, hasStock }) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 rounded-lg border-2 font-sans text-sm transition-all ${selectedColor === color
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary'
                          }`}
                        disabled={hasVariantInventory && !hasStock}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            <div>
              <h3 className="font-serif text-lg font-medium mb-3">Quantity</h3>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedQuantity((quantity) => Math.max(1, quantity - 1))}
                  disabled={selectedQuantity <= 1}
                >
                  -
                </Button>
                <span className="text-lg font-semibold w-12 text-center">{selectedQuantity}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedQuantity((quantity) => quantity + 1)}
                  disabled={hasVariantInventory && (!!selectedVariant ? selectedQuantity >= selectedVariant.stock_quantity : true)}
                >
                  +
                </Button>
                {hasVariantInventory && selectedVariant && (
                  <p className="text-sm text-muted-foreground">{selectedVariant.stock_quantity} available</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              {/* Add to Cart */}
              <Button
                size="lg"
                variant="outline"
                className="flex-1 min-w-[140px]"
                onClick={handleAddToCart}
                disabled={!effectiveStock || addingToCart}
              >
                {addingToCart ? (
                  <><Loader2 size={18} className="mr-2 animate-spin" /> Adding...</>
                ) : (
                  <><ShoppingCart size={18} className="mr-2" /> Add to Cart</>
                )}
              </Button>

              {/* Buy Now */}
              <Button
                size="lg"
                className="flex-1 min-w-[140px]"
                onClick={() => {
                  const params = new URLSearchParams();
                  if (selectedVariant?.size || selectedSize) params.append('size', selectedVariant?.size || selectedSize);
                  if (selectedVariant?.color || selectedColor) params.append('color', selectedVariant?.color || selectedColor);
                  if (selectedVariant?.id) params.append('variantId', selectedVariant.id);
                  params.append('quantity', String(selectedQuantity));
                  navigate(`/buy-now/${product.id}?${params.toString()}`);
                }}
                disabled={!effectiveStock || (hasVariantInventory && !selectedVariant)}
              >
                <ShoppingBag size={18} className="mr-2" />
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
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={handleShare}
              >
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

        {/* Reviews */}
        <div className="mt-16">
          <ProductReviews productId={product.id} productType={product.category} />
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
