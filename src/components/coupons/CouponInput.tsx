import { useState } from 'react';
import { Loader2, Tag, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AppliedCoupon, validateCouponCode } from '@/services/couponService';
import { toast } from 'sonner';

interface CouponInputProps {
  subtotal: number;
  appliedCoupon: AppliedCoupon | null;
  onApply: (applied: AppliedCoupon) => void;
  onRemove: () => void;
}

const CouponInput = ({ subtotal, appliedCoupon, onApply, onRemove }: CouponInputProps) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      toast.error('Please enter a coupon code');
      return;
    }

    try {
      setLoading(true);
      const result = await validateCouponCode(trimmed, subtotal);
      if (!result.valid || !result.coupon || !result.discountAmount) {
        toast.error(result.message || 'Coupon is not applicable');
        return;
      }

      onApply({
        coupon: result.coupon,
        discountAmount: result.discountAmount,
      });
      toast.success(`Coupon ${result.coupon.code} applied. You saved ₹${result.discountAmount.toLocaleString('en-IN')}`);
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast.error('Failed to validate coupon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Label>Discount Coupon (Optional)</Label>
      {appliedCoupon ? (
        <div className="flex items-center gap-2 mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <Tag size={18} className="text-green-600" />
          <span className="font-mono font-semibold text-green-700">{appliedCoupon.coupon.code}</span>
          <span className="text-sm text-green-600 ml-auto">-₹{appliedCoupon.discountAmount.toLocaleString('en-IN')}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <X size={16} />
          </Button>
        </div>
      ) : (
        <div className="flex gap-2 mt-2">
          <Input
            placeholder="Enter coupon code"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            className="uppercase"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleApply();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleApply}
            disabled={loading || !code.trim()}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CouponInput;