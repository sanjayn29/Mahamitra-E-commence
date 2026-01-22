import { Link } from 'react-router-dom';
import { Minus, Plus, X, ShoppingBag, ArrowRight } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CartPage = () => {
  const {
    state,
    removeItem,
    updateQuantity,
    getCartTotal,
    getCartSavings,
    clearCart,
  } = useCart();

  const subtotal = getCartTotal();
  const savings = getCartSavings();
  const shipping = subtotal > 2999 ? 0 : 199;
  const total = subtotal + shipping;

  if (state.items.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center">
            <div className="w-32 h-32 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={48} className="text-muted-foreground" />
            </div>
            <h1 className="font-serif text-3xl font-semibold mb-4">Your Cart is Empty</h1>
            <p className="text-muted-foreground font-sans mb-8">
              Looks like you haven't added anything to your cart yet.
              Explore our collection and find something you love!
            </p>
            <Button asChild size="lg" className="gradient-primary text-primary-foreground">
              <Link to="/shop">
                Start Shopping
                <ArrowRight size={18} className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold">Shopping Cart</h1>
          <Button variant="ghost" onClick={clearCart} className="text-destructive">
            Clear Cart
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {state.items.map((item) => (
              <div
                key={`${item.product.id}-${item.size}-${item.color}`}
                className="flex gap-4 md:gap-6 p-4 bg-card rounded-xl shadow-luxe"
              >
                {/* Image */}
                <Link
                  to={`/product/${item.product.id}`}
                  className="w-24 h-32 md:w-32 md:h-40 bg-muted rounded-lg overflow-hidden flex-shrink-0"
                >
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-muted-foreground font-sans uppercase tracking-wider">
                        {item.product.subcategory}
                      </p>
                      <Link
                        to={`/product/${item.product.id}`}
                        className="font-serif text-lg font-medium hover:text-primary transition-colors line-clamp-1"
                      >
                        {item.product.name}
                      </Link>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id, item.size, item.color)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <p className="text-sm text-muted-foreground font-sans mt-1">
                    Size: {item.size} | Color: {item.color}
                  </p>

                  {/* Price & Quantity */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center border border-border rounded-lg">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.product.id,
                            item.size,
                            item.color,
                            item.quantity - 1
                          )
                        }
                        className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-12 text-center font-sans font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.product.id,
                            item.size,
                            item.color,
                            item.quantity + 1
                          )
                        }
                        className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="font-sans font-semibold text-lg">
                        ₹{(item.product.price * item.quantity).toLocaleString()}
                      </p>
                      {item.product.originalPrice && (
                        <p className="text-sm text-muted-foreground line-through">
                          ₹{(item.product.originalPrice * item.quantity).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl shadow-luxe p-6 sticky top-24">
              <h2 className="font-serif text-xl font-semibold mb-6">Order Summary</h2>

              {/* Promo Code */}
              <div className="flex gap-2 mb-6">
                <Input placeholder="Promo code" className="flex-1" />
                <Button variant="outline">Apply</Button>
              </div>

              {/* Summary */}
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex justify-between font-sans text-sm">
                  <span className="text-muted-foreground">
                    Subtotal ({state.items.length} items)
                  </span>
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

                {subtotal < 2999 && (
                  <p className="text-xs text-muted-foreground font-sans bg-muted p-2 rounded">
                    Add ₹{(2999 - subtotal).toLocaleString()} more for free shipping!
                  </p>
                )}

                <div className="flex justify-between font-sans text-lg font-semibold border-t border-border pt-3">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                asChild
                size="lg"
                className="w-full mt-6 gradient-primary text-primary-foreground"
              >
                <Link to="/checkout">
                  Proceed to Checkout
                  <ArrowRight size={18} className="ml-2" />
                </Link>
              </Button>

              {/* Continue Shopping */}
              <Button variant="ghost" asChild className="w-full mt-3">
                <Link to="/shop">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CartPage;
