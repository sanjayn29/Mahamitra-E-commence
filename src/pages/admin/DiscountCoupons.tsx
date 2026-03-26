import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ToggleLeft, ToggleRight, Tag, Ticket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { CouponDiscountType, formatCouponOffer } from '@/services/couponService';

interface Coupon {
  id: string;
  code: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  min_order_value: number;
  max_discount: number | null;
  is_active: boolean;
  expires_at?: string | null;
  coupon_type?: string;
  total_usage_limit?: number | null;
  used_count?: number;
  specific_product_id?: string | null;
  created_at: string;
}

const DiscountCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<CouponDiscountType>('flat');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('0');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [couponType, setCouponType] = useState('FLAT');
  const [totalUsageLimit, setTotalUsageLimit] = useState('');

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coupons')
        .select('id, code, discount_type, discount_value, min_order_value, max_discount, is_active, expires_at, coupon_type, total_usage_limit, used_count, specific_product_id, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedCode = code.trim().toUpperCase();
    const parsedDiscountValue = parseFloat(discountValue);
    const parsedMinOrderValue = parseFloat(minOrderValue);
    const parsedMaxDiscount = maxDiscount.trim() ? parseFloat(maxDiscount) : null;
    const parsedTotalUsageLimit = totalUsageLimit.trim() ? parseInt(totalUsageLimit, 10) : null;

    if (!trimmedCode) {
      toast.error('Please enter a coupon code');
      return;
    }
    if (isNaN(parsedDiscountValue) || parsedDiscountValue <= 0) {
      toast.error('Please enter a valid discount value');
      return;
    }

    if (isNaN(parsedMinOrderValue) || parsedMinOrderValue < 0) {
      toast.error('Please enter a valid minimum order value');
      return;
    }

    if (discountType === 'percentage' && parsedDiscountValue > 100) {
      toast.error('Percentage discount cannot exceed 100');
      return;
    }

    if (discountType === 'percentage' && parsedMaxDiscount !== null && (isNaN(parsedMaxDiscount) || parsedMaxDiscount <= 0)) {
      toast.error('Please enter a valid max discount cap');
      return;
    }

    if (parsedTotalUsageLimit !== null && parsedTotalUsageLimit < 1) {
      toast.error('Usage limit must be at least 1');
      return;
    }

    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('coupons')
        .insert([{
          code: trimmedCode,
          discount_type: discountType,
          discount_value: parsedDiscountValue,
          min_order_value: parsedMinOrderValue,
          max_discount: discountType === 'percentage' ? parsedMaxDiscount : null,
          is_active: true,
          coupon_type: couponType,
          total_usage_limit: parsedTotalUsageLimit,
          used_count: 0,
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('A coupon with this code already exists');
        } else {
          throw error;
        }
        return;
      }

      setCoupons((prev) => [data, ...prev]);
      setCode('');
      setDiscountType('flat');
      setDiscountValue('');
      setMinOrderValue('0');
      setMaxDiscount('');
      setCouponType('FLAT');
      setTotalUsageLimit('');
      toast.success(`Coupon "${trimmedCode}" created successfully!`);
    } catch (error) {
      console.error('Error adding coupon:', error);
      toast.error('Failed to create coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !coupon.is_active, updated_at: new Date().toISOString() })
        .eq('id', coupon.id);

      if (error) throw error;

      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, is_active: !c.is_active } : c))
      );
      toast.success(`Coupon "${coupon.code}" ${coupon.is_active ? 'deactivated' : 'activated'}`);
    } catch (error) {
      console.error('Error toggling coupon:', error);
      toast.error('Failed to update coupon');
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', coupon.id);

      if (error) throw error;

      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
      toast.success(`Coupon "${coupon.code}" deleted`);
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <h1 className="font-serif text-xl font-semibold">Discount Coupons</h1>
          </div>
          <Link to="/">
            <span className="font-serif text-lg text-muted-foreground">Mahamitra</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Add Coupon Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Ticket size={22} />
              Add New Coupon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCoupon} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="code">Coupon Code</Label>
                <Input
                  id="code"
                  placeholder="e.g. SAVE100"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="uppercase"
                  maxLength={30}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="couponType">Coupon Type</Label>
                <Select value={couponType} onValueChange={setCouponType}>
                  <SelectTrigger id="couponType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLAT">Flat Amount</SelectItem>
                    <SelectItem value="PERCENT">Percentage</SelectItem>
                    <SelectItem value="FIRST_ORDER">First Order Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="discountType">Discount Type</Label>
                <Select value={discountType} onValueChange={(value) => setDiscountType(value as CouponDiscountType)}>
                  <SelectTrigger id="discountType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="discount">Discount Value {discountType === 'flat' ? '(₹)' : '(%)'}</Label>
                <Input
                  id="discount"
                  type="number"
                  placeholder={discountType === 'flat' ? 'e.g. 200' : 'e.g. 10'}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  min="1"
                  step="1"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="minOrderValue">Min Order (₹)</Label>
                <Input
                  id="minOrderValue"
                  type="number"
                  placeholder="e.g. 1999"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(e.target.value)}
                  min="0"
                  step="1"
                />
              </div>
              {discountType === 'percentage' && (
                <div className="space-y-1.5">
                  <Label htmlFor="maxDiscount">Max Cap (₹)</Label>
                  <Input
                    id="maxDiscount"
                    type="number"
                    placeholder="e.g. 500"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    min="1"
                    step="1"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="usageLimit">Usage Limit</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  placeholder="Leave empty for unlimited"
                  value={totalUsageLimit}
                  onChange={(e) => setTotalUsageLimit(e.target.value)}
                  min="1"
                  step="1"
                />
              </div>
              <div className="flex items-end xl:col-span-1">
                <Button type="submit" disabled={saving} className="w-full gap-2">
                  <Plus size={18} />
                  {saving ? 'Adding...' : 'Add Coupon'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Coupons Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Tag size={22} />
              All Coupons
              <Badge variant="secondary" className="ml-2">{coupons.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="mt-4 text-muted-foreground">Loading coupons...</p>
              </div>
            ) : coupons.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Ticket size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No coupons yet</p>
                <p className="text-sm mt-1">Create your first discount coupon above</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Min Order</TableHead>
                      <TableHead>Uses</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.map((coupon) => {
                      const usesDisplay = coupon.total_usage_limit 
                        ? `${coupon.used_count || 0}/${coupon.total_usage_limit}`
                        : `${coupon.used_count || 0}/∞`;
                      
                      return (
                        <TableRow key={coupon.id}>
                          <TableCell className="font-mono font-semibold text-base">
                            {coupon.code}
                          </TableCell>
                          <TableCell className="font-semibold text-base">
                            {formatCouponOffer(coupon)}
                          </TableCell>
                          <TableCell className="text-sm">
                            <Badge variant="outline" className="text-xs">
                              {coupon.coupon_type || 'FLAT'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            ₹{coupon.min_order_value.toFixed(0)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {usesDisplay}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={coupon.is_active ? 'default' : 'secondary'}
                              className={coupon.is_active ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                            >
                              {coupon.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(coupon.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggle(coupon)}
                                title={coupon.is_active ? 'Deactivate' : 'Activate'}
                              >
                                {coupon.is_active ? (
                                  <ToggleRight size={20} className="text-green-600" />
                                ) : (
                                  <ToggleLeft size={20} className="text-muted-foreground" />
                                )}
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash2 size={18} />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete coupon <strong>"{coupon.code}"</strong>? This cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(coupon)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DiscountCoupons;
