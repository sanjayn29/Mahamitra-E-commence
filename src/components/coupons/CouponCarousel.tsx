import { useEffect, useMemo, useRef, useState } from 'react';
import { Gift, Loader2, TicketPercent, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Coupon, formatCouponOffer, getActiveCoupons } from '@/services/couponService';
import { toast } from 'sonner';

const CouponCarousel = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        setLoading(true);
        const activeCoupons = await getActiveCoupons();
        setCoupons(activeCoupons);
      } catch (error) {
        console.error('Error loading active coupons:', error);
        setCoupons([]);
      } finally {
        setLoading(false);
      }
    };

    loadCoupons();
  }, []);

  const canScroll = useMemo(() => coupons.length > 2, [coupons.length]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) {
      return;
    }
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -320 : 320,
      behavior: 'smooth',
    });
  };

  const handleClaim = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`${code} copied to clipboard`);
    } catch {
      toast.success(`Use coupon code ${code} at checkout`);
    }
  };

  if (loading) {
    return (
      <section className="py-6 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10">
        <div className="container mx-auto px-4 py-10 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (coupons.length === 0) {
    return null;
  }

  return (
    <section className="py-0">
      <div className="relative overflow-hidden bg-gradient-to-r from-primary via-secondary to-primary">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '30px 30px',
          }}
        />

        <div className="container mx-auto px-4 py-8 md:py-10 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-yellow-300">
              <TicketPercent size={18} />
              <span className="text-xs md:text-sm font-semibold uppercase tracking-widest">Active Offers</span>
            </div>
            {canScroll && (
              <div className="hidden md:flex gap-2">
                <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => handleScroll('left')}>
                  <ChevronLeft size={16} />
                </Button>
                <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => handleScroll('right')}>
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </div>

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {coupons.map((coupon) => (
              <Card key={coupon.id} className="min-w-[320px] max-w-[360px] flex-shrink-0 border-white/30 bg-white/95">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">Coupon Code</p>
                      <p className="font-mono text-lg font-bold text-primary mt-1">{coupon.code}</p>
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0" onClick={() => handleClaim(coupon.code)}>
                      <Gift size={14} className="mr-1.5" />
                      Claim Offer
                    </Button>
                  </div>

                  <p className="font-serif text-xl font-semibold mt-3 text-foreground">{formatCouponOffer(coupon)}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    On orders above ₹{coupon.min_order_value.toLocaleString('en-IN')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CouponCarousel;