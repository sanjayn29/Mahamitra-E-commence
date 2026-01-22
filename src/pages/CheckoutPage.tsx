import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CreditCard, Wallet, Truck, ChevronRight } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const CheckoutPage = () => {
  const { state, getCartTotal, getCartSavings, clearCart } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [isOrderComplete, setIsOrderComplete] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const subtotal = getCartTotal();
  const savings = getCartSavings();
  const shipping = subtotal > 2999 ? 0 : 199;
  const total = subtotal + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = () => {
    setIsOrderComplete(true);
    clearCart();
  };

  const steps = [
    { number: 1, title: 'Shipping' },
    { number: 2, title: 'Payment' },
    { number: 3, title: 'Review' },
  ];

  if (state.items.length === 0 && !isOrderComplete) {
    navigate('/cart');
    return null;
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-sans font-medium transition-colors ${step >= s.number
                      ? 'gradient-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                    }`}
                >
                  {step > s.number ? <Check size={20} /> : s.number}
                </div>
                <span
                  className={`ml-3 font-sans text-sm ${step >= s.number ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                >
                  {s.title}
                </span>
                {index < steps.length - 1 && (
                  <ChevronRight size={20} className="mx-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping */}
            {step === 1 && (
              <div className="bg-card rounded-xl shadow-luxe p-6">
                <h2 className="font-serif text-2xl font-semibold mb-6">Shipping Address</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter first name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter last name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter full address"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Enter city"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="Enter state"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">PIN Code</Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="Enter PIN code"
                      className="mt-1"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => setStep(2)}
                  size="lg"
                  className="w-full mt-8 gradient-primary text-primary-foreground"
                >
                  Continue to Payment
                </Button>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="bg-card rounded-xl shadow-luxe p-6">
                <h2 className="font-serif text-2xl font-semibold mb-6">Payment Method</h2>
                <div className="space-y-4">
                  {[
                    { id: 'card', icon: CreditCard, title: 'Credit / Debit Card', desc: 'Pay securely with your card' },
                    { id: 'upi', icon: Wallet, title: 'UPI', desc: 'Google Pay, PhonePe, Paytm' },
                    { id: 'cod', icon: Truck, title: 'Cash on Delivery', desc: 'Pay when you receive' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${paymentMethod === method.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                        }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${paymentMethod === method.id ? 'gradient-primary' : 'bg-muted'
                        }`}>
                        <method.icon size={24} className={paymentMethod === method.id ? 'text-white' : 'text-muted-foreground'} />
                      </div>
                      <div className="text-left">
                        <h3 className="font-sans font-medium">{method.title}</h3>
                        <p className="text-sm text-muted-foreground">{method.desc}</p>
                      </div>
                      <div className="ml-auto">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === method.id ? 'border-primary' : 'border-muted-foreground'
                          }`}>
                          {paymentMethod === method.id && (
                            <div className="w-3 h-3 rounded-full gradient-primary" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {paymentMethod === 'card' && (
                  <div className="mt-6 p-4 bg-muted rounded-lg space-y-4">
                    <div>
                      <Label>Card Number</Label>
                      <Input placeholder="1234 5678 9012 3456" className="mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Expiry Date</Label>
                        <Input placeholder="MM/YY" className="mt-1" />
                      </div>
                      <div>
                        <Label>CVV</Label>
                        <Input placeholder="123" className="mt-1" />
                      </div>
                    </div>
                    <div>
                      <Label>Cardholder Name</Label>
                      <Input placeholder="Name on card" className="mt-1" />
                    </div>
                  </div>
                )}

                <div className="flex gap-4 mt-8">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!paymentMethod}
                    className="flex-1 gradient-primary text-primary-foreground"
                  >
                    Continue to Review
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="bg-card rounded-xl shadow-luxe p-6">
                <h2 className="font-serif text-2xl font-semibold mb-6">Order Review</h2>

                {/* Shipping Info */}
                <div className="mb-6">
                  <h3 className="font-sans font-medium mb-2">Shipping Address</h3>
                  <p className="text-muted-foreground text-sm font-sans">
                    {formData.firstName} {formData.lastName}<br />
                    {formData.address}<br />
                    {formData.city}, {formData.state} - {formData.pincode}<br />
                    Phone: {formData.phone}
                  </p>
                </div>

                {/* Payment Info */}
                <div className="mb-6">
                  <h3 className="font-sans font-medium mb-2">Payment Method</h3>
                  <p className="text-muted-foreground text-sm font-sans capitalize">
                    {paymentMethod === 'card' ? 'Credit/Debit Card' : paymentMethod === 'upi' ? 'UPI' : 'Cash on Delivery'}
                  </p>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-sans font-medium mb-4">Order Items</h3>
                  <div className="space-y-3">
                    {state.items.map((item) => (
                      <div
                        key={`${item.product.id}-${item.size}-${item.color}`}
                        className="flex gap-4 p-3 bg-muted rounded-lg"
                      >
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-16 h-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-sans font-medium text-sm line-clamp-1">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Size: {item.size} | Color: {item.color} | Qty: {item.quantity}
                          </p>
                          <p className="text-sm font-semibold mt-1">
                            ₹{(item.product.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={handlePlaceOrder}
                    className="flex-1 gradient-primary text-primary-foreground"
                  >
                    Place Order
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl shadow-luxe p-6 sticky top-24">
              <h2 className="font-serif text-xl font-semibold mb-6">Order Summary</h2>

              {/* Items Preview */}
              <div className="space-y-3 mb-6">
                {state.items.slice(0, 2).map((item) => (
                  <div
                    key={`${item.product.id}-${item.size}-${item.color}`}
                    className="flex items-center gap-3"
                  >
                    <div className="w-12 h-14 bg-muted rounded overflow-hidden">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm line-clamp-1">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-sans font-medium text-sm">
                      ₹{(item.product.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
                {state.items.length > 2 && (
                  <p className="text-sm text-muted-foreground font-sans">
                    +{state.items.length - 2} more items
                  </p>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex justify-between font-sans text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between font-sans text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-green-600">-₹{savings.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-sans text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                </div>
                <div className="flex justify-between font-sans text-lg font-semibold border-t border-border pt-3">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Success Modal */}
      <Dialog open={isOrderComplete} onOpenChange={() => { }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
                <Check size={40} className="text-white" />
              </div>
              <span className="font-serif text-2xl block">Order Placed Successfully!</span>
            </DialogTitle>
            <DialogDescription className="text-center">
              Thank you for shopping with Mahamitra Boutique! Your order has been placed
              and you'll receive a confirmation email shortly.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center">
            <p className="font-sans text-sm mb-6">
              <span className="text-muted-foreground">Order ID:</span>{' '}
              <span className="font-semibold">MM{Date.now().toString().slice(-8)}</span>
            </p>
            <Button
              onClick={() => navigate('/')}
              className="gradient-primary text-primary-foreground"
            >
              Continue Shopping
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default CheckoutPage;
