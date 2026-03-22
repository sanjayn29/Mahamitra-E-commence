import { supabase } from '@/lib/supabaseClient';

export type CouponDiscountType = 'flat' | 'percentage';

export interface Coupon {
  id: string;
  code: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  min_order_value: number;
  max_discount: number | null;
  is_active: boolean;
  expires_at?: string | null;
  created_at: string;
}

export interface CouponEvaluation {
  applicable: boolean;
  discountAmount: number;
  reason?: string;
}

export interface AppliedCoupon {
  coupon: Coupon;
  discountAmount: number;
}

const toNumber = (value: unknown): number => Number(value || 0);

const normalizeCoupon = (row: any): Coupon => ({
  id: row.id,
  code: String(row.code || '').toUpperCase(),
  discount_type: row.discount_type,
  discount_value: toNumber(row.discount_value),
  min_order_value: toNumber(row.min_order_value),
  max_discount: row.max_discount == null ? null : toNumber(row.max_discount),
  is_active: Boolean(row.is_active),
  expires_at: row.expires_at || null,
  created_at: row.created_at,
});

const isExpired = (coupon: Coupon): boolean => {
  if (!coupon.expires_at) {
    return false;
  }
  return new Date(coupon.expires_at).getTime() < Date.now();
};

export const evaluateCouponForTotal = (coupon: Coupon, orderTotal: number): CouponEvaluation => {
  const normalizedTotal = Math.max(0, toNumber(orderTotal));

  if (!coupon.is_active) {
    return { applicable: false, discountAmount: 0, reason: 'Coupon is inactive' };
  }

  if (isExpired(coupon)) {
    return { applicable: false, discountAmount: 0, reason: 'Coupon has expired' };
  }

  if (normalizedTotal < coupon.min_order_value) {
    return {
      applicable: false,
      discountAmount: 0,
      reason: `Minimum order value is ₹${coupon.min_order_value.toLocaleString('en-IN')}`,
    };
  }

  let discount = 0;

  if (coupon.discount_type === 'flat') {
    discount = coupon.discount_value;
  } else {
    discount = (normalizedTotal * coupon.discount_value) / 100;
    if (coupon.max_discount != null) {
      discount = Math.min(discount, coupon.max_discount);
    }
  }

  discount = Math.max(0, Math.min(discount, normalizedTotal));

  if (discount <= 0) {
    return { applicable: false, discountAmount: 0, reason: 'Coupon does not apply for this total' };
  }

  return {
    applicable: true,
    discountAmount: Math.round(discount * 100) / 100,
  };
};

export const formatCouponOffer = (coupon: Coupon): string => {
  if (coupon.discount_type === 'flat') {
    return `Flat ₹${coupon.discount_value.toLocaleString('en-IN')} OFF`;
  }

  if (coupon.max_discount != null) {
    return `${coupon.discount_value}% OFF up to ₹${coupon.max_discount.toLocaleString('en-IN')}`;
  }

  return `${coupon.discount_value}% OFF`;
};

export const getActiveCoupons = async (): Promise<Coupon[]> => {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('coupons')
    .select('id, code, discount_type, discount_value, min_order_value, max_discount, is_active, expires_at, created_at')
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map(normalizeCoupon);
};

export const validateCouponCode = async (code: string, orderTotal: number) => {
  const normalizedCode = code.trim().toUpperCase();

  if (!normalizedCode) {
    return { valid: false, message: 'Please enter a coupon code' };
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('coupons')
    .select('id, code, discount_type, discount_value, min_order_value, max_discount, is_active, expires_at, created_at')
    .eq('code', normalizedCode)
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return { valid: false, message: 'Invalid or inactive coupon code' };
  }

  const coupon = normalizeCoupon(data);
  const evaluation = evaluateCouponForTotal(coupon, orderTotal);
  if (!evaluation.applicable) {
    return {
      valid: false,
      message: evaluation.reason || 'Coupon is not applicable for this order total',
      coupon,
    };
  }

  return {
    valid: true,
    coupon,
    discountAmount: evaluation.discountAmount,
  };
};

export const getBestEligibleCoupon = async (orderTotal: number): Promise<AppliedCoupon | null> => {
  const coupons = await getActiveCoupons();
  let best: AppliedCoupon | null = null;

  coupons.forEach((coupon) => {
    const evaluation = evaluateCouponForTotal(coupon, orderTotal);
    if (!evaluation.applicable) {
      return;
    }

    if (!best || evaluation.discountAmount > best.discountAmount) {
      best = {
        coupon,
        discountAmount: evaluation.discountAmount,
      };
    }
  });

  return best;
};