import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, ShoppingBag, ArrowLeft, Tag, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import MainLayout from '@/layouts/MainLayout';
import { fetchProductById, EnhancedProduct } from '@/services/productService';
import { initiateRazorpayPayment } from '@/services/razorpayService';
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

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_amount: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
    phoneNumber: user?.user_metadata?.phone || '',
    email: user?.email || '',
    deliveryAddress: '',
    city: '',
    pincode: '',
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQuantityChange = (change: number) => {
    setFormData(prev => ({
      ...prev,
      quantity: Math.max(1, prev.quantity + change)
    }));
  };

  // Calculate totals
  // If we have a single product ID, calculate for that product. Otherwise calculate for cart
  const isCartCheckout = !id;

  const subtotal = isCartCheckout
    ? cartState.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
    : (product ? product.price * formData.quantity : 0);

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
    if (!formData.fullName || !formData.phoneNumber || !formData.email ||
      !formData.deliveryAddress || !formData.city || !formData.pincode) {
      toast.error('Please fill all required fields');
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
          productImage: item.product.images?.[0] || '',
          selectedSize: item.size,
          selectedColor: item.color,
          quantity: item.quantity,
          price: item.product.price,
        }));
      } else if (product) {
        checkoutItems = [{
          productId: product.id,
          productName: product.name,
          productImage: product.image,
          selectedSize,
          selectedColor,
          quantity: formData.quantity,
          price: product.price,
        }];
      }

      // Prepare order data for Razorpay
      const orderData = {
        // Fallbacks for the legacy handler
        productId: checkoutItems[0]?.productId || 'CART',
        productName: isCartCheckout ? 'Cart Checkout' : checkoutItems[0]?.productName || '',
        productImage: checkoutItems[0]?.productImage || '',
        selectedSize: isCartCheckout ? '' : checkoutItems[0]?.selectedSize || '',
        selectedColor: isCartCheckout ? '' : checkoutItems[0]?.selectedColor || '',
        quantity: isCartCheckout ? checkoutItems.reduce((s, i) => s + i.quantity, 0) : formData.quantity,
        price: isCartCheckout ? subtotal : product!.price,

        // New array for future support
        items: checkoutItems,

        total: total,
        discount: discount,
        customerName: formData.fullName,
        customerEmail: formData.email,
        customerPhone: formData.phoneNumber,
        deliveryAddress: formData.deliveryAddress,
        city: formData.city,
        pincode: formData.pincode,
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
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="deliveryAddress">Address *</Label>
                        <Textarea
                          id="deliveryAddress"
                          name="deliveryAddress"
                          value={formData.deliveryAddress}
                          onChange={handleInputChange}
                          required
                          placeholder="House no., Building name, Street, Area"
                          rows={3}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter city"
                          />
                        </div>
                        <div>
                          <Label htmlFor="pincode">Pincode *</Label>
                          <Input
                            id="pincode"
                            name="pincode"
                            value={formData.pincode}
                            onChange={handleInputChange}
                            required
                            placeholder="6-digit pincode"
                            maxLength={6}
                          />
                        </div>
                      </div>
                    </div>
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
                          src={item.product.images?.[0] || '/placeholder-image.jpg'}
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
                        src={product!.image}
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
                        {selectedSize && (
                          <p className="text-xs text-muted-foreground">Size: {selectedSize}</p>
                        )}
                        {selectedColor && (
                          <p className="text-xs text-muted-foreground">Color: {selectedColor}</p>
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
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Amount</span>
                    <span>₹{isCartCheckout ? cartState.items.reduce((s, i) => s + (i.product.price * i.quantity), 0).toLocaleString() : product!.price.toLocaleString()}</span>
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
