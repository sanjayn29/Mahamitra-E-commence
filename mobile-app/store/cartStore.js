import { create } from 'zustand';
import { addToCart, fetchCartItems, removeCartItem, updateCartItemQuantity } from '../services/cartService';

export const useCartStore = create((set, get) => ({
  items: [],
  loading: false,
  error: null,

  loadCart: async (userId) => {
    set({ loading: true, error: null });
    try {
      const items = await fetchCartItems(userId);
      set({ items, loading: false });
    } catch (error) {
      set({ loading: false, error: error.message || 'Failed to load cart' });
    }
  },

  addItem: async ({ userId, variantId, quantity }) => {
    set({ loading: true, error: null });
    try {
      await addToCart({ userId, variantId, quantity });
      await get().loadCart(userId);
    } catch (error) {
      set({ loading: false, error: error.message || 'Failed to add item to cart' });
      throw error;
    }
  },

  updateQuantity: async ({ userId, itemId, quantity }) => {
    set({ loading: true, error: null });
    try {
      if (quantity <= 0) {
        await removeCartItem(itemId);
      } else {
        await updateCartItemQuantity(itemId, quantity);
      }

      await get().loadCart(userId);
    } catch (error) {
      set({ loading: false, error: error.message || 'Failed to update quantity' });
      throw error;
    }
  },

  removeItem: async ({ userId, itemId }) => {
    set({ loading: true, error: null });
    try {
      await removeCartItem(itemId);
      await get().loadCart(userId);
    } catch (error) {
      set({ loading: false, error: error.message || 'Failed to remove item' });
      throw error;
    }
  },

  itemCount: () => get().items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),

  subtotal: () =>
    get().items.reduce((sum, item) => {
      const price = item.product_variants?.price || item.product_variants?.products?.price || 0;
      return sum + price * item.quantity;
    }, 0),
}));
