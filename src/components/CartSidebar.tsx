import { ShoppingCart, X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

const CartSidebar = () => {
    const { state, removeItem, updateQuantity, getCartTotal, getCartCount, setCartOpen } = useCart();
    const { items, isOpen, loading } = state;
    const cartCount = getCartCount();
    const cartTotal = getCartTotal();

    return (
        <Sheet open={isOpen} onOpenChange={setCartOpen}>
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
                <SheetHeader className="px-6 py-4 border-b border-border">
                    <SheetTitle className="font-serif flex items-center gap-2">
                        <ShoppingCart size={20} />
                        My Cart
                        {cartCount > 0 && (
                            <span className="ml-1 bg-primary text-primary-foreground text-xs font-sans font-semibold w-6 h-6 rounded-full flex items-center justify-center">
                                {cartCount}
                            </span>
                        )}
                    </SheetTitle>
                </SheetHeader>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <ShoppingCart size={48} className="text-muted-foreground mb-4 opacity-40" />
                            <h3 className="font-serif text-lg font-medium mb-2">Your cart is empty</h3>
                            <p className="text-sm text-muted-foreground font-sans mb-6">
                                Add some items from our collection to get started.
                            </p>
                            <Button asChild onClick={() => setCartOpen(false)}>
                                <Link to="/shop">Start Shopping</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <div
                                    key={item.id || index}
                                    className="flex gap-4 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                                >
                                    {/* Product Image */}
                                    <div className="w-20 h-24 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                        <img
                                            src={
                                                item.product.images
                                                    ? (Array.isArray(item.product.images) ? item.product.images[0] : item.product.images)
                                                    : item.product.image || '/placeholder-image.jpg'
                                            }
                                            alt={item.product.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.currentTarget.src = '/placeholder-image.jpg'; }}
                                        />
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-sans font-medium text-sm line-clamp-2 mb-1">
                                            {item.product.name}
                                        </h4>
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {item.size && item.size !== 'One Size' && (
                                                <span className="text-xs bg-muted px-2 py-0.5 rounded font-sans text-muted-foreground">
                                                    {item.size}
                                                </span>
                                            )}
                                            {item.color && item.color !== 'Default' && (
                                                <span className="text-xs bg-muted px-2 py-0.5 rounded font-sans text-muted-foreground">
                                                    {item.color}
                                                </span>
                                            )}
                                        </div>
                                        <p className="font-sans font-semibold text-sm text-primary mb-2">
                                            ₹{(item.product.price * item.quantity).toLocaleString()}
                                        </p>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    if (item.id) {
                                                        if (item.quantity <= 1) {
                                                            removeItem(item.id);
                                                        } else {
                                                            updateQuantity(item.id, item.quantity - 1);
                                                        }
                                                    }
                                                }}
                                                className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
                                                aria-label="Decrease quantity"
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span className="font-sans text-sm font-medium w-6 text-center">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    if (item.id) updateQuantity(item.id, item.quantity + 1);
                                                }}
                                                className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
                                                aria-label="Increase quantity"
                                            >
                                                <Plus size={12} />
                                            </button>

                                            {/* Remove */}
                                            <button
                                                onClick={() => { if (item.id) removeItem(item.id); }}
                                                className="ml-auto w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                aria-label="Remove item"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer with Total & Checkout */}
                {items.length > 0 && (
                    <div className="border-t border-border px-6 py-4 space-y-4 bg-background">
                        <div className="flex justify-between items-center">
                            <span className="font-sans text-sm text-muted-foreground">
                                Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'items'})
                            </span>
                            <span className="font-sans font-semibold text-foreground">
                                ₹{cartTotal.toLocaleString()}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-sans">
                            Shipping and taxes calculated at checkout.
                        </p>
                        <div className="flex flex-col gap-2">
                            <Button
                                asChild
                                className="w-full"
                                onClick={() => setCartOpen(false)}
                            >
                                <Link to="/buy-now">
                                    <ShoppingBag size={16} className="mr-2" />
                                    Proceed to Checkout
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setCartOpen(false)}
                            >
                                Continue Shopping
                            </Button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};

export default CartSidebar;
