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
  walletUsed?: number;
  payableAmount?: number;
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
  couponCode?: string | null;
  couponId?: string | null;
  couponDiscountAmount?: number;
  couponType?: string;
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

interface WalletTopupData {
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

// Initialize Razorpay Payment
export const initiateRazorpayPayment = (
  orderData: OrderData,
  onSuccess: (paymentId: string, orderId: string) => void,
  onFailure: (error: string) => void
) => {
  const walletUsed = Math.max(0, Number(orderData.walletUsed || 0));
  const payableAmount = Math.max(0, Number(orderData.payableAmount ?? orderData.total));

  if (payableAmount === 0) {
    saveOrderToDatabase(orderData, `WALLET_${Date.now()}`)
      .then((savedOrder) => onSuccess(savedOrder.payment_id || `WALLET_${Date.now()}`, savedOrder.id))
      .catch((error: any) => {
        console.error('Error saving wallet order:', error);
        const detail = error?.message || error?.details || 'Failed to place wallet order';
        onFailure(String(detail));
      });
    return;
  }

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
    amount: payableAmount * 100, // Convert to paise (₹1 = 100 paise)
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
      wallet_used: String(walletUsed),
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

export const initiateWalletTopupPayment = (
  topupData: WalletTopupData,
  onSuccess: (paymentId: string, newBalance: number) => void,
  onFailure: (error: string) => void
) => {
  const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

  if (!razorpayKeyId) {
    onFailure('Razorpay configuration is missing. Please contact support.');
    return;
  }

  if (typeof window.Razorpay === 'undefined') {
    onFailure('Payment gateway is not available. Please refresh the page.');
    return;
  }

  const amount = Math.max(1, Math.round(topupData.amount));

  const options: RazorpayOptions = {
    key: razorpayKeyId,
    amount: amount * 100,
    currency: 'INR',
    name: 'Mahamitra Ecommerce',
    description: 'Wallet Top-up',
    image: '/logo.png',
    handler: async function (response: RazorpayResponse) {
      try {
        const { data, error } = await supabase.rpc('credit_wallet_balance', {
          p_amount: amount,
          p_reference_id: `TOPUP_${response.razorpay_payment_id}`,
        });

        if (error) {
          throw error;
        }

        onSuccess(response.razorpay_payment_id, Number(data || 0));
      } catch (error: any) {
        console.error('Error crediting wallet balance after top-up:', error);
        const detail = error?.message || error?.details || 'Wallet top-up credit failed';
        onFailure(`Payment completed but wallet update failed: ${detail}`);
      }
    },
    prefill: {
      name: topupData.customerName,
      email: topupData.customerEmail,
      contact: topupData.customerPhone,
    },
    notes: {
      purpose: 'wallet_topup',
      amount: String(amount),
    },
    theme: {
      color: '#000000',
    },
    modal: {
      ondismiss: function () {
        onFailure('Wallet top-up cancelled by user');
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

  // Backend coupon validation (if coupon provided)
  let finalCouponId: string | null = null;
  let finalCouponCode: string | null = null;
  let finalCouponDiscount: number = 0;
  let finalCouponType: string | null = null;

  if (orderData.couponCode) {
    const productIds = lineItems.map((item) => item.productId) as string[];
    
    const { data: couponValidation, error: couponError } = await supabase.rpc(
      'validate_and_apply_coupon',
      {
        p_coupon_code: orderData.couponCode,
        p_user_id: user.id,
        p_order_total: orderData.total - (orderData.walletUsed || 0),
        p_product_ids: productIds,
      }
    );

    if (couponError) {
      console.error('Coupon validation RPC error:', couponError);
      throw new Error(`Coupon validation failed: ${couponError.message}`);
    }

    if (couponValidation && couponValidation.length > 0) {
      const validation = couponValidation[0];
      if (!validation.success) {
        throw new Error(`Coupon validation failed: ${validation.error_message}`);
      }
      
      finalCouponId = validation.coupon_id;
      finalCouponCode = orderData.couponCode;
      finalCouponDiscount = Number(validation.discount_amount) || 0;
      finalCouponType = validation.coupon_type;
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
    coupon_id: finalCouponId,
    coupon_code: finalCouponCode,
    coupon_discount_amount: finalCouponDiscount,
    coupon_type: finalCouponType,
    created_at: new Date().toISOString(),
  }));

  const walletUsed = Math.max(0, Number(orderData.walletUsed || 0));
  let walletDebited = false;

  if (walletUsed > 0) {
    const { error: walletError } = await supabase.rpc('debit_wallet_balance', {
      p_amount: walletUsed,
      p_reference_id: paymentId,
    });

    if (walletError) {
      console.error('Wallet debit failed:', walletError);
      throw walletError;
    }

    walletDebited = true;
  }

  const { data, error } = await supabase
    .from('orders')
    .insert(orderRows)
    .select();

  if (error) {
    if (walletDebited) {
      const { error: rollbackError } = await supabase.rpc('credit_wallet_balance', {
        p_amount: walletUsed,
        p_reference_id: `ROLLBACK_${paymentId}`,
      });
      if (rollbackError) {
        console.error('Wallet rollback failed after order insert error:', rollbackError);
      }
    }

    console.error('Database error:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    if (walletDebited) {
      const { error: rollbackError } = await supabase.rpc('credit_wallet_balance', {
        p_amount: walletUsed,
        p_reference_id: `ROLLBACK_${paymentId}`,
      });
      if (rollbackError) {
        console.error('Wallet rollback failed after empty insert response:', rollbackError);
      }
    }

    throw new Error('No order rows were created');
  }

  // Record coupon usage if coupon was applied
  if (finalCouponId && data[0].id) {
    const { error: usageError } = await supabase.rpc('record_coupon_usage', {
      p_coupon_id: finalCouponId,
      p_user_id: user.id,
      p_order_id: data[0].id,
    });

    if (usageError) {
      console.warn('Failed to record coupon usage:', usageError);
      // Don't throw - order already created successfully
    }
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
