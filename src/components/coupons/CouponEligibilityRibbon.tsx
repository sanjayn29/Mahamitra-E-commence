import { Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppliedCoupon, formatCouponOffer } from '@/services/couponService';

interface CouponEligibilityRibbonProps {
  suggestion: AppliedCoupon;
  onApply: () => void;
}

const CouponEligibilityRibbon = ({ suggestion, onApply }: CouponEligibilityRibbonProps) => {
  return (
    <div className="rounded-md border border-green-300 bg-green-50 px-4 py-3 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-green-800">
            Coupon {suggestion.coupon.code} applicable on your order
          </p>
          <p className="text-xs text-green-700 mt-1">
            Your order is eligible for coupon {suggestion.coupon.code}. {formatCouponOffer(suggestion.coupon)}
          </p>
        </div>
        <Button type="button" size="sm" className="bg-green-700 hover:bg-green-800" onClick={onApply}>
          <Gift size={14} className="mr-1.5" />
          Apply Now
        </Button>
      </div>
    </div>
  );
};

export default CouponEligibilityRibbon;