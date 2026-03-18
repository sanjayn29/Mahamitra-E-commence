import { supabase } from './supabaseClient';
import { clearCart } from './cartService';

export async function fetchOrders(userId) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, total_amount, address_id, created_at, order_items(id, quantity, unit_price, variant_id, product_name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function placeOrder({ userId, addressId, cartItems }) {
  if (!cartItems?.length) {
    throw new Error('Cart is empty.');
  }

  const totalAmount = cartItems.reduce((sum, item) => {
    const basePrice = item.product_variants?.price || item.product_variants?.products?.price || 0;
    return sum + basePrice * item.quantity;
  }, 0);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      address_id: addressId,
      total_amount: totalAmount,
      status: 'placed',
    })
    .select('id')
    .single();

  if (orderError) throw orderError;

  const orderItemsPayload = cartItems.map((item) => ({
    order_id: order.id,
    product_id: item.product_variants?.product_id,
    variant_id: item.variant_id,
    quantity: item.quantity,
    unit_price: item.product_variants?.price || item.product_variants?.products?.price || 0,
    product_name: item.product_variants?.products?.name || 'Product',
  }));

  const { error: orderItemsError } = await supabase.from('order_items').insert(orderItemsPayload);
  if (orderItemsError) throw orderItemsError;

  await clearCart(userId);

  return order.id;
}

export async function fetchProfileSummary(userId) {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, total_amount, status')
    .eq('user_id', userId);

  if (error) throw error;

  const safeOrders = orders || [];
  const totalSpent = safeOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

  return {
    orderCount: safeOrders.length,
    totalSpent,
    statuses: safeOrders.reduce((acc, order) => {
      const key = order.status || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  };
}
