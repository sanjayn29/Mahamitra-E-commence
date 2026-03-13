import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, ShoppingBag, ArrowLeft, Tag, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import MainLayout from '@/layouts/MainLayout';
import { fetchProductById, EnhancedProduct } from '@/services/productService';
import { initiateRazorpayPayment } from '@/services/razorpayService';
import { variantService, ProductVariant } from '@/services/variantService';
import AddressBook from '@/components/AddressBook';
import { Address } from '@/services/addressService';
import { DEFAULT_VARIANT_SIZE } from '@/lib/productVariants';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import SEO from '@/components/SEO';

const BuyNowPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state: cartState, clearCart } = useCart();

  const [product, setProduct] = useState<EnhancedProduct | null>(null);
  const [loading, setLoading] = useState(!!id); // only load if single product
  const [submitting, setSubmitting] = useState(false);

  // Get product details from URL params
  const selectedSize = searchParams.get('size') || '';
  const selectedColor = searchParams.get('color') || '';
  const selectedVariantId = searchParams.get('variantId') || '';
  const requestedQuantity = Math.max(1, parseInt(searchParams.get('quantity') || '1', 10) || 1);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_amount: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: user?.email || '',
    deliveryAddress: '',
    city: '',
    pincode: '',
    state: '',
    country: 'India',
    quantity: 1,
  });

  // Load product
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const productData = await fetchProductById(id);
        setProduct(productData);
      } catch (error) {
        console.error('Error loading product:', error);
        toast.error('Failed to load product details');
        navigate('/shop');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, navigate]);

  useEffect(() => {
    const loadSelectedVariant = async () => {
      if (!selectedVariantId) {
        setSelectedVariant(null);
        return;
      }

      try {
        const variant = await variantService.getVariantById(selectedVariantId);
        setSelectedVariant(variant);
      } catch (error) {
        console.error('Error loading selected variant:', error);
        setSelectedVariant(null);
      }
    };

    loadSelectedVariant();
  }, [selectedVariantId]);

  useEffect(() => {
    if (!selectedVariant) {
      setFormData((prev) => ({
        ...prev,
        quantity: requestedQuantity,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      quantity: Math.min(requestedQuantity, Math.max(1, selectedVariant.stock_quantity || 1)),
    }));
  }, [requestedQuantity, selectedVariant]);

  useEffect(() => {
    if (!selectedAddress) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      fullName: selectedAddress.full_name,
      phoneNumber: selectedAddress.phone,
      deliveryAddress: selectedAddress.address_line_2
        ? `${selectedAddress.address_line_1}, ${selectedAddress.address_line_2}`
        : selectedAddress.address_line_1,
      city: selectedAddress.city,
      pincode: selectedAddress.postal_code,
      state: selectedAddress.state,
      country: selectedAddress.country,
    }));
  }, [selectedAddress]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQuantityChange = (change: number) => {
    setFormData(prev => ({
      ...prev,
      quantity: selectedVariant
        ? Math.max(1, Math.min(selectedVariant.stock_quantity, prev.quantity + change))
        : Math.max(1, prev.quantity + change)
    }));
  };

  // Calculate totals
  // If we have a single product ID, calculate for that product. Otherwise calculate for cart
  const isCartCheckout = !id;

  const subtotal = isCartCheckout
    ? cartState.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
    : (product ? (selectedVariant?.price_override ?? product.price) * formData.quantity : 0);

  const discount = appliedCoupon ? Math.min(appliedCoupon.discount_amount, subtotal) : 0;
  const total = subtotal - discount;

  const handleApplyCoupon = async () => {
    const trimmed = couponCode.trim().toUpperCase();
    if (!trimmed) {
      toast.error('Please enter a coupon code');
      return;
    }

    try {
      setCouponLoading(true);
      const { data, error } = await supabase
        .from('discount_coupons')
        .select('code, discount_amount, is_active')
        .eq('code', trimmed)
        .single();

      if (error || !data) {
        toast.error('Invalid coupon code');
        return;
      }

      if (!data.is_active) {
        toast.error('This coupon is no longer active');
        return;
      }

      setAppliedCoupon({ code: data.code, discount_amount: data.discount_amount });
      toast.success(`Coupon "${data.code}" applied! You save ₹${Math.min(data.discount_amount, subtotal).toLocaleString()}`);
    } catch (error) {
      console.error('Error validating coupon:', error);
      toast.error('Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.info('Coupon removed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }

    // Validation
    if (!formData.fullName || !formData.phoneNumber || !formData.email) {
      toast.error('Please fill all required personal details');
      return;
    }

    if (!selectedAddress) {
      toast.error('Please select or add a delivery address');
      return;
    }

    if (formData.phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    if (formData.pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

    if (selectedVariant && formData.quantity > selectedVariant.stock_quantity) {
      toast.error(`Only ${selectedVariant.stock_quantity} item(s) available for this variant`);
      return;
    }

    try {
      setSubmitting(true);

      // We pass the full array of items if cart checkout, or a single item array if direct checkout
      // The current initiateRazorpayPayment expects a single object for legacy reasons, 
      // but let's pass an array of items as a new property `cartItems` or handle it gracefully
      let checkoutItems = [];

      if (isCartCheckout) {
        checkoutItems = cartState.items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          productImage: item.variantImage || item.product.images?.[0] || '',
          selectedSize: item.size,
          selectedColor: item.color,
          variantId: item.variantId || null,
          quantity: item.quantity,
          price: item.product.price,
        }));
      } else if (product) {
        checkoutItems = [{
          productId: product.id,
          productName: product.name,
          productImage: selectedVariant?.image_url || product.image,
          selectedSize: selectedVariant?.size || selectedSize || DEFAULT_VARIANT_SIZE,
          selectedColor: selectedVariant?.color || selectedColor,
          variantId: selectedVariant?.id || null,
          quantity: formData.quantity,
          price: selectedVariant?.price_override ?? product.price,
        }];
      }

      const variantDemand = new Map<string, number>();
      checkoutItems.forEach((item) => {
        if (!item.variantId) {
          return;
        }

        variantDemand.set(item.variantId, (variantDemand.get(item.variantId) || 0) + item.quantity);
      });

      if (variantDemand.size > 0) {
        const variantIds = Array.from(variantDemand.keys());
        const { data: variantRows, error: variantRowsError } = await supabase
          .from('product_variants')
          .select('id, color, size, stock_quantity')
          .in('id', variantIds);

        if (variantRowsError) {
          throw variantRowsError;
        }

        const stockById = new Map((variantRows || []).map((row: any) => [row.id, row]));

        for (const [variantId, requestedQty] of variantDemand.entries()) {
          const row = stockById.get(variantId);
          const availableQty = row?.stock_quantity ?? 0;
          if (availableQty < requestedQty) {
            const label = row ? `${row.color || 'Default'} / ${row.size || 'Free Size'}` : variantId;
            throw new Error(`Insufficient stock for ${label}. Available: ${availableQty}, requested: ${requestedQty}`);
          }
        }
      }

      // Prepare order data for Razorpay
      const orderData = {
        // Fallbacks for the legacy handler
        productId: checkoutItems[0]?.productId || 'CART',
        productName: isCartCheckout ? 'Cart Checkout' : checkoutItems[0]?.productName || '',
        productImage: checkoutItems[0]?.productImage || '',
        selectedSize: isCartCheckout ? '' : checkoutItems[0]?.selectedSize || '',
        selectedColor: isCartCheckout ? '' : checkoutItems[0]?.selectedColor || '',
        variantId: isCartCheckout ? null : checkoutItems[0]?.variantId || null,
        quantity: isCartCheckout ? checkoutItems.reduce((s, i) => s + i.quantity, 0) : formData.quantity,
        price: isCartCheckout ? subtotal : (selectedVariant?.price_override ?? product!.price),

        // New array for future support
        items: checkoutItems,

        total: total,
        discount: discount,
        addressId: selectedAddress.id,
        customerName: formData.fullName,
        customerEmail: formData.email,
        customerPhone: formData.phoneNumber,
        deliveryAddress: selectedAddress.address_line_2
          ? `${selectedAddress.address_line_1}, ${selectedAddress.address_line_2}`
          : selectedAddress.address_line_1,
        city: selectedAddress.city,
        state: selectedAddress.state,
        country: selectedAddress.country,
        pincode: selectedAddress.postal_code,
        isCartCheckout // Pass flag
      };

      // Initiate Razorpay payment
      initiateRazorpayPayment(
        orderData,
        async (paymentId: string, orderId: string) => {
          // Payment success callback
          toast.success('Payment successful!');

          if (isCartCheckout) {
            await clearCart();
          }

          // Navigate to order success page
          navigate(`/order-success/${orderId}`);
        },
        (error: string) => {
          // Payment failure callback
          toast.error(error);
          setSubmitting(false);
        }
      );
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast.error('Failed to initiate payment');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!isCartCheckout && !product) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Button onClick={() => navigate('/shop')}>Continue Shopping</Button>
        </div>
      </MainLayout>
    );
  }

  if (isCartCheckout && cartState.items.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <Button onClick={() => navigate('/shop')}>Start Shopping</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <SEO
        title="Checkout | Mahamitra Boutique"
        description="Secure checkout for your Mahamitra Boutique order. Review your items and complete your purchase safely."
      />
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag size={24} />
                  Checkout Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          required
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phoneNumber">Phone Number *</Label>
                        <Input
                          id="phoneNumber"
                          name="phoneNumber"
                          type="tel"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          required
                          placeholder="10-digit mobile number"
                          maxLength={10}
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Delivery Address */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Delivery Address</h3>
                    <AddressBook
                      selectable={true}
                      selectedAddressId={selectedAddress?.id || null}
                      onSelectAddress={setSelectedAddress}
                      title="Choose Delivery Address"
                    />
                  </div>

                  <Separator />

                  {/* Discount Code */}
                  <div>
                    <Label>Discount Coupon (Optional)</Label>
                    {appliedCoupon ? (
                      <div className="flex items-center gap-2 mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                        <Tag size={18} className="text-green-600" />
                        <span className="font-mono font-semibold text-green-700">{appliedCoupon.code}</span>
                        <span className="text-sm text-green-600 ml-auto">-₹{Math.min(appliedCoupon.discount_amount, subtotal).toLocaleString()}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={handleRemoveCoupon}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-2">
                        <Input
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="uppercase"
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); } }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                        >
                          {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      `Pay Now - ₹${total.toLocaleString()}`
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Product Details */}
                {isCartCheckout ? (
                  <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                    {cartState.items.map((item, index) => (
                      <div key={item.id || index} className="flex gap-4 relative">
                        <img
                          src={item.variantImage || item.product.images?.[0] || '/placeholder-image.jpg'}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-image.jpg';
                          }}
                        />
                        <div className="flex-1 text-sm">
                          <h4 className="font-medium line-clamp-2 leading-tight">{item.product.name}</h4>
                          <em className="text-xs text-muted-foreground block mt-1">
                            {item.quantity} × ₹{item.product.price.toLocaleString()}
                          </em>
                          {(item.size || item.color) && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.size && `Size: ${item.size} `}
                              {item.color && `Color: ${item.color}`}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex gap-4">
                      <img
                        src={selectedVariant?.image_url || product!.image}
                        alt={product!.name}
                        className="w-20 h-20 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-image.jpg';
                        }}
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-2">{product!.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Category: {product!.category}
                        </p>
                        {(selectedVariant?.size || selectedSize) && (
                          <p className="text-xs text-muted-foreground">Size: {selectedVariant?.size || selectedSize}</p>
                        )}
                        {(selectedVariant?.color || selectedColor) && (
                          <p className="text-xs text-muted-foreground">Color: {selectedVariant?.color || selectedColor}</p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Quantity Selector (Only for Direct Buy Now) */}
                    <div>
                      <Label>Quantity</Label>
                      <div className="flex items-center gap-3 mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(-1)}
                          disabled={formData.quantity <= 1}
                        >
                          -
                        </Button>
                        <span className="text-lg font-semibold w-12 text-center">
                          {formData.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(1)}
                          disabled={!!selectedVariant && formData.quantity >= selectedVariant.stock_quantity}
                        >
                          +
                        </Button>
                      </div>
                      {selectedVariant && (
                        <p className="mt-2 text-xs text-muted-foreground">{selectedVariant.stock_quantity} available</p>
                      )}
                    </div>
                  </>
                )}

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Amount</span>
                    <span>
                      ₹{isCartCheckout
                        ? cartState.items.reduce((s, i) => s + (i.product.price * i.quantity), 0).toLocaleString()
                        : (selectedVariant?.price_override ?? product!.price).toLocaleString()}
                    </span>
                  </div>
                  {!isCartCheckout && (
                    <div className="flex justify-between text-sm">
                      <span>Quantity</span>
                      <span>×{formData.quantity}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-₹{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">₹{total.toLocaleString()}</span>
                  </div>
                  {selectedAddress && (
                    <div className="pt-2 text-xs text-muted-foreground">
                      Delivering to: {selectedAddress.address_line_1}, {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postal_code}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default BuyNowPage;
