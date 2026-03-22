import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Package, RefreshCw, Eye, Phone, Mail, MapPin, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import CancellationReasonDialog from '@/components/orders/CancellationReasonDialog';

interface Order {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  selected_size: string | null;
  selected_color: string | null;
  quantity: number;
  price: number;
  total_amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  city: string;
  pincode: string;
  payment_id: string | null;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  cancellation_reason: string | null;
  cancelled_by: 'customer' | 'admin' | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

const ADMIN_CANCELLATION_REASONS = [
  'Stock damaged',
  'Out of stock',
  'Unable to fulfill order',
  'Payment issue',
  'Other',
];

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const { user } = useAuth();

  // Fetch all orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('order_status', filterStatus);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log(`Fetched ${data?.length || 0} orders`);
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const targetOrder = orders.find((order) => order.id === orderId);
    if (!targetOrder) {
      return;
    }

    if (newStatus === 'cancelled') {
      setOrderToCancel(targetOrder);
      setCancelModalOpen(true);
      return;
    }

    if (targetOrder.order_status === 'cancelled') {
      toast.error('Cancelled orders cannot be changed.');
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      toast.success('Order status updated successfully');
      fetchOrders(); // Refresh the list
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast.error(error?.message || 'Failed to update order status');
    }
  };

  const handleAdminCancellationSubmit = async (reason: string) => {
    if (!orderToCancel) {
      return;
    }

    try {
      setSubmittingCancel(true);

      const { data, error } = await supabase.rpc('cancel_order_and_credit_wallet', {
        p_order_id: orderToCancel.id,
        p_cancelled_by: 'admin',
        p_cancellation_reason: reason,
      });

      if (error) {
        throw error;
      }

      const result = Array.isArray(data) ? data[0] : data;
      const credited = Number(result?.wallet_credited || 0);
      if (credited > 0) {
        toast.success(`Order cancelled and ₹${credited.toLocaleString()} credited to customer wallet.`);
      } else {
        toast.success('Order cancelled successfully.');
      }

      setCancelModalOpen(false);
      setOrderToCancel(null);
      await fetchOrders();
    } catch (error: any) {
      console.error('Error cancelling order as admin:', error);
      toast.error(error?.message || 'Failed to cancel order');
    } finally {
      setSubmittingCancel(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  // Get status badge variant
  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'default';
      case 'pending':
      case 'processing':
        return 'secondary';
      case 'failed':
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
            <h1 className="font-serif text-2xl font-semibold tracking-tight">
              Orders Management
            </h1>
          </div>
          <Button onClick={fetchOrders} variant="outline" size="sm">
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Package size={24} />
                All Orders ({orders.length})
              </CardTitle>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filter:</span>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-xl font-medium mb-2">No orders found</p>
                <p className="text-muted-foreground">
                  {filterStatus !== 'all'
                    ? `No ${filterStatus} orders at the moment.`
                    : 'Orders will appear here once customers make purchases.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Order Status</TableHead>
                      <TableHead>Cancelled By / Reason</TableHead>
                      <TableHead>Refund Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">
                          {order.id.slice(0, 8)}...
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-3">
                            {order.product_image && (
                              <img
                                src={order.product_image}
                                alt={order.product_name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div>
                              <p className="font-medium">{order.product_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {order.selected_size && `Size: ${order.selected_size}`}
                                {order.selected_size && order.selected_color && ' | '}
                                {order.selected_color && `Color: ${order.selected_color}`}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                        </TableCell>

                        <TableCell className="text-center">{order.quantity}</TableCell>

                        <TableCell className="font-semibold">
                          ₹{order.total_amount.toFixed(2)}
                        </TableCell>

                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(order.payment_status)}>
                            {order.payment_status}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Select
                            value={order.order_status}
                            onValueChange={(value) => updateOrderStatus(order.id, value)}
                            disabled={order.order_status === 'cancelled'}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled" disabled={['shipped', 'delivered'].includes(order.order_status)}>
                                Cancelled
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>

                        <TableCell className="max-w-[240px]">
                          {order.order_status === 'cancelled' ? (
                            <div className="space-y-1 text-xs">
                              <p className="font-medium capitalize">{order.cancelled_by || 'customer'}</p>
                              <p className="text-muted-foreground truncate" title={order.cancellation_reason || ''}>
                                {order.cancellation_reason || 'N/A'}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {order.order_status === 'cancelled' ? (
                            <Badge variant={order.payment_status === 'refunded' ? 'default' : 'outline'}>
                              {order.payment_status === 'refunded' ? 'Refunded' : 'No refund'}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell className="text-sm">
                          {formatDate(order.created_at)}
                        </TableCell>

                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye size={16} />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Order Details</DialogTitle>
                              </DialogHeader>

                              <div className="space-y-6 py-4">
                                {/* Product Info */}
                                <div>
                                  <h3 className="font-semibold mb-3">Product Information</h3>
                                  <div className="flex gap-4">
                                    {order.product_image && (
                                      <img
                                        src={order.product_image}
                                        alt={order.product_name}
                                        className="w-24 h-24 object-cover rounded"
                                      />
                                    )}
                                    <div className="flex-1 space-y-2">
                                      <p className="font-medium text-lg">{order.product_name}</p>
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        {order.selected_size && (
                                          <p><span className="text-muted-foreground">Size:</span> {order.selected_size}</p>
                                        )}
                                        {order.selected_color && (
                                          <p><span className="text-muted-foreground">Color:</span> {order.selected_color}</p>
                                        )}
                                        <p><span className="text-muted-foreground">Quantity:</span> {order.quantity}</p>
                                        <p><span className="text-muted-foreground">Price:</span> ₹{order.price.toFixed(2)}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <Separator />

                                {/* Customer Info */}
                                <div>
                                  <h3 className="font-semibold mb-3">Customer Information</h3>
                                  <div className="space-y-2 text-sm">
                                    <p className="flex items-center gap-2">
                                      <span className="font-medium w-24">Name:</span>
                                      <span>{order.customer_name}</span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                      <Mail size={16} className="text-muted-foreground" />
                                      <span className="font-medium w-24">Email:</span>
                                      <span>{order.customer_email}</span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                      <Phone size={16} className="text-muted-foreground" />
                                      <span className="font-medium w-24">Phone:</span>
                                      <span>{order.customer_phone}</span>
                                    </p>
                                    <div className="flex items-start gap-2">
                                      <MapPin size={16} className="text-muted-foreground mt-1" />
                                      <div className="flex-1">
                                        <p className="font-medium">Delivery Address:</p>
                                        <p className="text-muted-foreground">
                                          {order.delivery_address}<br />
                                          {order.city} - {order.pincode}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <Separator />

                                {order.order_status === 'cancelled' && (
                                  <>
                                    <div>
                                      <h3 className="font-semibold mb-3 text-destructive">Cancellation Details</h3>
                                      <div className="space-y-2 text-sm">
                                        <p className="flex items-center gap-2">
                                          <span className="font-medium w-32">Cancelled By:</span>
                                          <span className="capitalize">{order.cancelled_by || 'customer'}</span>
                                        </p>
                                        <p className="flex items-start gap-2">
                                          <span className="font-medium w-32">Reason:</span>
                                          <span>{order.cancellation_reason || 'N/A'}</span>
                                        </p>
                                        {order.cancelled_at && (
                                          <p className="flex items-center gap-2">
                                            <span className="font-medium w-32">Cancelled At:</span>
                                            <span>{formatDate(order.cancelled_at)}</span>
                                          </p>
                                        )}
                                        <p className="flex items-center gap-2">
                                          <span className="font-medium w-32">Refund Status:</span>
                                          <span>{order.payment_status === 'refunded' ? 'Refunded to wallet' : 'No refund required'}</span>
                                        </p>
                                      </div>
                                    </div>
                                    <Separator />
                                  </>
                                )}

                                {/* Payment & Order Info */}
                                <div>
                                  <h3 className="font-semibold mb-3">Payment & Order Status</h3>
                                  <div className="space-y-2 text-sm">
                                    <p className="flex items-center gap-2">
                                      <span className="font-medium w-32">Payment ID:</span>
                                      <span className="font-mono text-xs">{order.payment_id || 'N/A'}</span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                      <span className="font-medium w-32">Payment Status:</span>
                                      <Badge variant={getStatusBadgeVariant(order.payment_status)}>
                                        {order.payment_status}
                                      </Badge>
                                    </p>
                                    <p className="flex items-center gap-2">
                                      <span className="font-medium w-32">Order Status:</span>
                                      <Badge variant={getStatusBadgeVariant(order.order_status)}>
                                        {order.order_status}
                                      </Badge>
                                    </p>
                                    <p className="flex items-center gap-2">
                                      <span className="font-medium w-32">Total Amount:</span>
                                      <span className="text-lg font-semibold">₹{order.total_amount.toFixed(2)}</span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                      <span className="font-medium w-32">Order Date:</span>
                                      <span>{formatDate(order.created_at)}</span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                      <span className="font-medium w-32">Last Updated:</span>
                                      <span>{formatDate(order.updated_at)}</span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <CancellationReasonDialog
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        title="Cancel Order as Admin"
        description="Select a cancellation reason. A customer wallet refund will be processed once for paid orders."
        reasons={ADMIN_CANCELLATION_REASONS}
        alwaysShowCustomField
        customLabel="Additional explanation"
        isSubmitting={submittingCancel}
        onSubmit={handleAdminCancellationSubmit}
      />
    </div>
  );
};

export default Orders;
