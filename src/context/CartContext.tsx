import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Product } from '@/data/products';
import { cartService, CartItem as DatabaseCartItem } from '@/services/userInteractionService';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

export interface CartItem {
  id?: string;
  product: Product;
  variantId?: string;
  variantImage?: string;
  variantPrice?: number;
  quantity: number;
  size: string;
  color: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  loading: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { cartItemId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { cartItemId: string; quantity: number } }
  | { type: 'SET_ITEMS'; payload: CartItem[] }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'SET_CART_OPEN'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean };

interface CartContextType {
  state: CartState;
  addItem: (product: Product, quantity: number, size?: string, color?: string, variantId?: string) => Promise<void>;
  addToCart: (productId: string, productType: string, quantity?: number, size?: string, color?: string, variantId?: string) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleCart: () => void;
  setCartOpen: (isOpen: boolean) => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  getCartSavings: () => number;
  loadCartItems: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        item =>
          (item.variantId || null) === (action.payload.variantId || null) &&
          item.product.id === action.payload.product.id &&
          item.size === action.payload.size &&
          item.color === action.payload.color
      );

      if (existingIndex > -1) {
        const newItems = [...state.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + action.payload.quantity
        };
        return { ...state, items: newItems };
      }

      return { ...state, items: [...state.items, action.payload] };
    }

    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload.cartItemId)
      };
    }

    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== action.payload.cartItemId)
        };
      }

      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.cartItemId
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };
    }

    case 'SET_ITEMS':
      return { ...state, items: action.payload };

    case 'CLEAR_CART':
      return { ...state, items: [] };

    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };

    case 'SET_CART_OPEN':
      return { ...state, isOpen: action.payload };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    default:
      return state;
  }
};

const initialState: CartState = {
  items: [],
  isOpen: false,
  loading: false,
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user, loading: authLoading } = useAuth();

  const loadCartItems = async () => {
    if (!user) {
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const cartItems = await cartService.getCartItems();

      // Fetch actual product details for each cart item
      const transformedItems: CartItem[] = await Promise.all(
        cartItems.map(async (item: DatabaseCartItem) => {
          try {
            const { getProduct } = await import('@/services/productService');
            const { variantService } = await import('@/services/variantService');
            const productDetails = await getProduct(item.product_id, item.product_type as any);
            const variant = item.variant_id ? await variantService.getVariantById(item.variant_id) : null;

            if (productDetails) {
              const variantPrice = variant?.price_override ?? null;
              const variantImage = variant?.image_url ?? null;
              return {
                id: item.id,
                product: {
                  id: productDetails.productId,
                  name: productDetails.name,
                  price: variantPrice ?? productDetails.price,
                  category: productDetails.category,
                  image: variantImage ?? productDetails.image,
                  images: variantImage ? [variantImage, ...productDetails.images.filter((image) => image !== variantImage)] : productDetails.images,
                  description: productDetails.description,
                  inStock: variant ? variant.stock_quantity > 0 : productDetails.inStock,
                  rating: productDetails.rating,
                  reviews: productDetails.reviews,
                } as Product,
                variantId: item.variant_id || undefined,
                variantImage: variantImage || undefined,
                variantPrice: variantPrice ?? undefined,
                quantity: item.quantity,
                size: variant?.size || item.size || '',
                color: variant?.color || item.color || '',
              };
            } else {
              return {
                id: item.id,
                product: {
                  id: item.product_id,
                  name: 'Product not found',
                  price: 0,
                  category: item.product_type,
                } as Product,
                variantId: item.variant_id || undefined,
                quantity: item.quantity,
                size: item.size || '',
                color: item.color || '',
              };
            }
          } catch (error) {
            console.error(`Error fetching product ${item.product_id}:`, error);
            return {
              id: item.id,
              product: {
                id: item.product_id,
                name: 'Error loading product',
                price: 0,
                category: item.product_type,
              } as Product,
              variantId: item.variant_id || undefined,
              quantity: item.quantity,
              size: item.size || '',
              color: item.color || '',
            };
          }
        })
      );

      dispatch({ type: 'SET_ITEMS', payload: transformedItems });
    } catch (error) {
      console.error('Error loading cart items:', error);
      toast.error('Failed to load cart items');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Load cart items when auth is loaded and user is available
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      loadCartItems();
    } else {
      dispatch({ type: 'CLEAR_CART' });
    }
  }, [user, authLoading]);

  const addItem = async (product: Product, quantity: number, size?: string, color?: string, variantId?: string) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      await cartService.addToCart(product.id, product.category, quantity, size, color, variantId);
      await loadCartItems(); // Reload to get the actual database state
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };

  const removeItem = async (cartItemId: string) => {
    if (!user || !cartItemId) {
      console.error('Cannot remove item: no user or invalid cart item ID');
      return;
    }

    try {
      await cartService.removeFromCart(cartItemId);
      dispatch({ type: 'REMOVE_ITEM', payload: { cartItemId } });
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item from cart');
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (!user) return;

    try {
      await cartService.updateCartItemQuantity(cartItemId, quantity);
      dispatch({ type: 'UPDATE_QUANTITY', payload: { cartItemId, quantity } });
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update item quantity');
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      await cartService.clearCart();
      dispatch({ type: 'CLEAR_CART' });
      toast.success('Cart cleared');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    }
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  const setCartOpen = (isOpen: boolean) => {
    dispatch({ type: 'SET_CART_OPEN', payload: isOpen });
  };

  const getCartTotal = () => {
    return state.items.reduce((total, item) => total + item.product.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return state.items.reduce((count, item) => count + item.quantity, 0);
  };

  const getCartSavings = () => {
    return state.items.reduce((savings, item) => {
      const originalPrice = item.product.originalPrice || item.product.price;
      return savings + (originalPrice - item.product.price) * item.quantity;
    }, 0);
  };

  const addToCart = async (
    productId: string,
    productType: string,
    quantity: number = 1,
    size?: string,
    color?: string,
    variantId?: string
  ) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      await cartService.addToCart(productId, productType, quantity, size, color, variantId);
      await loadCartItems(); // Refresh cart from database
      toast.success('Item added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        addToCart,
        removeItem,
        updateQuantity,
        clearCart,
        toggleCart,
        setCartOpen,
        getCartTotal,
        getCartCount,
        getCartSavings,
        loadCartItems
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
