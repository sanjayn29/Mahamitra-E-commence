import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Download, Package, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import MainLayout from '@/layouts/MainLayout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { generateReceipt } from '@/services/pdfReceiptService';
import SEO from '@/components/SEO';

interface OrderData {
  id: string;
  created_at: string;
  payment_id: string | null;
  product_name: string;
  product_image: string | null;
  selected_size: string | null;
  selected_color: string | null;
  quantity: number;
  price: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  city: string;
  pincode: string;
  total_amount: number;
}

const OrderSuccessPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!orderId) {
      toast.error('Invalid order ID');
      navigate('/orders');
      return;
    }

    fetchOrderDetails();
  }, [user, orderId, navigate]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
        toast.error('Failed to load order details');
        navigate('/orders');
        return;
      }

      setOrder(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while loading order details');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!order) return;

    try {
      setDownloading(true);
      await generateReceipt(order);
      toast.success('Receipt downloaded successfully!');
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.error('Failed to generate receipt. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container max-w-2xl py-12 mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-6"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!order) {
    return (
      <MainLayout>
        <div className="container max-w-2xl py-12 mx-auto px-4 text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-serif mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">
            We couldn't find the order you're looking for.
          </p>
          <Button asChild>
            <Link to="/orders">View All Orders</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <SEO
        title="Order Confirmed | Mahamitra Boutique"
        description="Thank you for your purchase! Your order has been successfully placed at Mahamitra Boutique."
      />
      <div className="container max-w-2xl py-12 mx-auto px-4">
        {/* Success Icon */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600">
            Thank you for your purchase. Your order has been confirmed.
          </p>
        </div>

        {/* Order Summary Card */}
        <Card className="border-primary/20 shadow-luxe mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              {order.product_image && (
                <img
                  src={order.product_image}
                  alt={order.product_name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{order.product_name}</h3>
                {(order.selected_size || order.selected_color) && (
                  <div className="text-sm text-gray-600 mb-2">
                    {order.selected_size && <span>Size: {order.selected_size}</span>}
                    {order.selected_size && order.selected_color && <span className="mx-2">|</span>}
                    {order.selected_color && <span>Color: {order.selected_color}</span>}
                  </div>
                )}
                <p className="text-sm text-gray-600">Quantity: {order.quantity}</p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono font-semibold">
                  {order.id.substring(0, 8).toUpperCase()}
                </span>
              </div>
              {order.payment_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment ID:</span>
                  <span className="font-mono text-xs">{order.payment_id}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Address:</span>
                <span className="text-right max-w-xs">
                  {order.delivery_address}, {order.city} - {order.pincode}
                </span>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Paid:</span>
              <span className="text-2xl font-serif font-bold text-primary">
                ₹{order.total_amount.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Download Receipt Button */}
        <Button
          size="lg"
          className="w-full gradient-primary hover-lift mb-4"
          onClick={handleDownloadReceipt}
          disabled={downloading}
        >
          {downloading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-5 w-5" />
              Download Receipt
            </>
          )}
        </Button>

        {/* Secondary Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="outline" size="lg" asChild>
            <Link to="/orders">
              <Package className="mr-2 h-5 w-5" />
              View All Orders
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/shop">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Continue Shopping
            </Link>
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 p-4 bg-cream rounded-lg text-center">
          <p className="text-sm text-gray-600">
            A confirmation email has been sent to{' '}
            <span className="font-semibold">{order.customer_email}</span>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Questions? Contact us at +91 95008 44405
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default OrderSuccessPage;
