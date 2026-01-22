import { Link } from 'react-router-dom';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const CartDrawer = () => {
  const {
    state,
    setCartOpen,
    removeItem,
    updateQuantity,
    getCartTotal,
    getCartSavings,
  } = useCart();

  const savings = getCartSavings();

  return (
    <Sheet open={state.isOpen} onOpenChange={setCartOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="font-serif text-2xl flex items-center gap-2">
            <ShoppingBag size={24} className="text-primary" />
            Your Cart ({state.items.length})
          </SheetTitle>
        </SheetHeader>

        {state.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <ShoppingBag size={40} className="text-muted-foreground" />
            </div>
            <h3 className="font-serif text-xl mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground font-sans text-sm mb-6">
              Discover our beautiful collection and add items to your cart.
            </p>
            <Button
              onClick={() => setCartOpen(false)}
              asChild
              className="gradient-primary text-primary-foreground"
            >
              <Link to="/shop">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {state.items.map((item) => (
                <div
                  key={`${item.product.id}-${item.size}-${item.color}`}
                  className="flex gap-4 p-3 bg-muted/50 rounded-lg"
                >
                  {/* Image */}
                  <div className="w-20 h-24 bg-muted rounded overflow-hidden flex-shrink-0">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif font-medium text-sm line-clamp-1">
                      {item.product.name}
                    </h4>
                    <p className="text-xs text-muted-foreground font-sans mt-0.5">
                      Size: {item.size} | Color: {item.color}
                    </p>
                    <p className="font-sans font-semibold text-sm mt-1">
                      ₹{item.product.price.toLocaleString()}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.product.id,
                            item.size,
                            item.color,
                            item.quantity - 1
                          )
                        }
                        className="w-7 h-7 rounded border border-border flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-sans text-sm w-8 text-center">
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
                        className="w-7 h-7 rounded border border-border flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() =>
                      removeItem(item.product.id, item.size, item.color)
                    }
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-border pt-4 space-y-3">
              {savings > 0 && (
                <div className="flex justify-between text-sm font-sans">
                  <span className="text-muted-foreground">You're saving</span>
                  <span className="text-green-600 font-medium">
                    ₹{savings.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-sans">
                <span className="text-foreground font-medium">Subtotal</span>
                <span className="font-semibold text-lg">
                  ₹{getCartTotal().toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-sans">
                Shipping calculated at checkout
              </p>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  asChild
                  onClick={() => setCartOpen(false)}
                >
                  <Link to="/cart">View Cart</Link>
                </Button>
                <Button
                  asChild
                  className="gradient-primary text-primary-foreground"
                  onClick={() => setCartOpen(false)}
                >
                  <Link to="/checkout">Checkout</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
