import { supabase } from '@/lib/supabaseClient';

// Razorpay TypeScript Interface
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id?: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes?: Record<string, string>;
  theme: {
    color: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

interface OrderData {
  productId: string;
  productName: string;
  productImage: string;
  selectedSize: string;
  selectedColor: string;
  variantId?: string | null;
  quantity: number;
  price: number;
  total: number;
  discount: number;
  addressId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  city: string;
  state?: string;
  country?: string;
  pincode: string;
  items?: Array<{
    productId: string;
    productName: string;
    productImage: string;
    selectedSize: string;
    selectedColor: string;
    variantId?: string | null;
    quantity: number;
    price: number;
  }>;
}

// Initialize Razorpay Payment
export const initiateRazorpayPayment = (
  orderData: OrderData,
  onSuccess: (paymentId: string, orderId: string) => void,
  onFailure: (error: string) => void
) => {
  const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

  if (!razorpayKeyId) {
    onFailure('Razorpay configuration is missing. Please contact support.');
    return;
  }

  // Check if Razorpay script is loaded
  if (typeof window.Razorpay === 'undefined') {
    onFailure('Payment gateway is not available. Please refresh the page.');
    return;
  }

  const options: RazorpayOptions = {
    key: razorpayKeyId,
    amount: orderData.total * 100, // Convert to paise (₹1 = 100 paise)
    currency: 'INR',
    name: 'Mahamitra Ecommerce',
    description: orderData.productName,
    image: orderData.productImage || '/logo.png',
    handler: async function (response: RazorpayResponse) {
      // Payment successful
      try {
        // Save order to database and get the order ID
        const savedOrder = await saveOrderToDatabase(orderData, response.razorpay_payment_id);
        onSuccess(response.razorpay_payment_id, savedOrder.id);
      } catch (error: any) {
        console.error('Error saving order:', error);
        const detail = error?.message || error?.details || error?.hint || 'Unknown database error';
        const normalized = String(detail).toLowerCase();
        if (normalized.includes('insufficient stock')) {
          onFailure(
            'Payment captured, but inventory changed during checkout and the order could not be created. '
            + 'Payment ID: ' + response.razorpay_payment_id
            + '. Please contact support for refund/retry. Reason: ' + detail
          );
          return;
        }

        onFailure('Payment successful but order save failed. Payment ID: ' + response.razorpay_payment_id + '. Reason: ' + detail);
      }
    },
    prefill: {
      name: orderData.customerName,
      email: orderData.customerEmail,
      contact: orderData.customerPhone,
    },
    notes: {
      product_id: orderData.productId,
      size: orderData.selectedSize,
      color: orderData.selectedColor,
      variant_id: orderData.variantId || '',
      address: `${orderData.deliveryAddress}, ${orderData.city} - ${orderData.pincode}`,
    },
    theme: {
      color: '#000000', // Your brand color
    },
    modal: {
      ondismiss: function () {
        onFailure('Payment cancelled by user');
      },
    },
  };

  const razorpayInstance = new window.Razorpay(options);
  razorpayInstance.open();
};

// Save order to Supabase database
const saveOrderToDatabase = async (orderData: OrderData, paymentId: string) => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const lineItems = orderData.items && orderData.items.length > 0
    ? orderData.items
    : [{
        productId: orderData.productId,
        productName: orderData.productName,
        productImage: orderData.productImage,
        selectedSize: orderData.selectedSize,
        selectedColor: orderData.selectedColor,
        variantId: orderData.variantId || null,
        quantity: orderData.quantity,
        price: orderData.price,
      }];

  const variantDemand = new Map<string, number>();
  lineItems.forEach((item) => {
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

  const orderRows = lineItems.map((item) => ({
    user_id: user.id,
    product_id: item.productId,
    product_name: item.productName,
    product_image: item.productImage,
    selected_size: item.selectedSize,
    selected_color: item.selectedColor,
    variant_id: item.variantId || null,
    address_id: orderData.addressId || null,
    quantity: item.quantity,
    price: item.price,
    total_amount: item.price * item.quantity,
    customer_name: orderData.customerName,
    customer_email: orderData.customerEmail,
    customer_phone: orderData.customerPhone,
    delivery_address: orderData.deliveryAddress,
    city: orderData.city,
    pincode: orderData.pincode,
    payment_id: paymentId,
    payment_status: 'completed',
    order_status: 'pending',
    created_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('orders')
    .insert(orderRows)
    .select();

  if (error) {
    console.error('Database error:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('No order rows were created');
  }

  return data[0];
};

// Verify payment (optional - for backend verification)
export const verifyPayment = async (
  paymentId: string,
  orderId: string,
  signature: string
) => {
  // This should ideally be done on the backend for security
  // For test mode, we'll skip this step
  console.log('Payment verification:', { paymentId, orderId, signature });
  return true;
};
