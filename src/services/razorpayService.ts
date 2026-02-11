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
  quantity: number;
  price: number;
  total: number;
  discount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  city: string;
  pincode: string;
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
      } catch (error) {
        console.error('Error saving order:', error);
        onFailure('Payment successful but order save failed. Contact support with payment ID: ' + response.razorpay_payment_id);
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

  // Insert order into orders table
  const { data, error } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      product_id: orderData.productId,
      product_name: orderData.productName,
      product_image: orderData.productImage,
      selected_size: orderData.selectedSize,
      selected_color: orderData.selectedColor,
      quantity: orderData.quantity,
      price: orderData.price,
      total_amount: orderData.total,
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
    })
    .select()
    .single();

  if (error) {
    console.error('Database error:', error);
    throw error;
  }

  return data;
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
