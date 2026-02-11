import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Truck, CheckCircle, Clock, XCircle, ShoppingBag, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import MainLayout from '@/layouts/MainLayout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { generateReceipt } from '@/services/pdfReceiptService';
import SEO from '@/components/SEO';

interface Order {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  selected_size: string | null;
  selected_color: string | null;
  quantity: number;
  price: number;
  total_amount: number;
  payment_id: string | null;
  payment_status: string;
  order_status: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  city: string;
  pincode: string;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
  confirmed: { icon: CheckCircle, color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
  processing: { icon: Package, color: 'bg-indigo-100 text-indigo-800', label: 'Processing' },
  shipped: { icon: Truck, color: 'bg-purple-100 text-purple-800', label: 'Shipped' },
  delivered: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Delivered' },
  cancelled: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Cancelled' },
};

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusInfo = (status: string) => {
    return statusConfig[status] || statusConfig.pending;
  };

  const handleDownloadReceipt = async (order: Order) => {
    try {
      await generateReceipt(order);
      toast.success('Receipt downloaded successfully!');
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.error('Failed to generate receipt');
    }
  };

  return (
    <MainLayout>
      <SEO
        title="My Orders | Mahamitra Boutique"
        description="View your order history and track current shipments from Mahamitra Boutique."
      />
      <div className="container mx-auto px-4 py-8 min-h-[60vh]">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-serif text-3xl font-bold mb-2">My Orders</h1>
          <p className="text-muted-foreground mb-8">Track and manage your orders</p>

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="mt-4 text-muted-foreground">Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag size={64} className="mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-6">
                You haven't placed any orders. Start shopping to see your orders here!
              </p>
              <Button asChild>
                <Link to="/shop">Start Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const status = getStatusInfo(order.order_status);
                const StatusIcon = status.icon;

                return (
                  <Card key={order.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      {/* Order header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/50 px-4 py-3 text-sm">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="text-muted-foreground">
                            Order ID: <span className="font-mono text-foreground">{order.id.slice(0, 8)}...</span>
                          </span>
                          <span className="text-muted-foreground">
                            {formatDate(order.created_at)}
                          </span>
                        </div>
                        <Badge className={`${status.color} border-0 gap-1`}>
                          <StatusIcon size={14} />
                          {status.label}
                        </Badge>
                      </div>

                      <Separator />

                      {/* Order body */}
                      <div className="flex gap-4 p-4">
                        {/* Product image */}
                        <Link to={`/product/${order.product_id}`} className="shrink-0">
                          <img
                            src={order.product_image || '/placeholder-image.jpg'}
                            alt={order.product_name}
                            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-md border"
                            onError={(e) => { e.currentTarget.src = '/placeholder-image.jpg'; }}
                          />
                        </Link>

                        {/* Product details */}
                        <div className="flex-1 min-w-0">
                          <Link to={`/product/${order.product_id}`} className="hover:text-primary transition-colors">
                            <h3 className="font-medium text-base sm:text-lg truncate">{order.product_name}</h3>
                          </Link>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                            {order.selected_size && <span>Size: {order.selected_size}</span>}
                            {order.selected_color && <span>Color: {order.selected_color}</span>}
                            <span>Qty: {order.quantity}</span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-lg font-semibold">₹{order.total_amount.toFixed(2)}</p>
                              {order.payment_id && (
                                <span className="text-xs text-muted-foreground font-mono">
                                  Payment: {order.payment_id}
                                </span>
                              )}
                            </div>

                            {/* Download Receipt Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadReceipt(order)}
                              className="text-primary hover:bg-primary/10"
                            >
                              <Download size={16} className="mr-1" />
                              Receipt
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      {order.order_status !== 'cancelled' && (
                        <>
                          <Separator />
                          <div className="px-4 py-3">
                            <OrderProgress status={order.order_status} />
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const OrderProgress = ({ status }: { status: string }) => {
  const currentIndex = steps.indexOf(status);

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const info = statusConfig[step];
        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {index + 1}
              </div>
              <span className={`text-[10px] mt-1 text-center ${isCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {info.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 ${index < currentIndex ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OrdersPage;
