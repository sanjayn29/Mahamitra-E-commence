import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  RefreshCw, 
  TrendingUp, 
  Package, 
  DollarSign, 
  ShoppingCart,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';

interface AnalyticsData {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  categoriesData: { name: string; count: number; value: number }[];
  dailyRevenue: { date: string; revenue: number; orders: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
  productStats: { category: string; products: number }[];
}

const COLORS = ['#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

type MonthlyRevenueFilter = '6m' | '12m' | 'all';

const ViewAnalysis = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    categoriesData: [],
    dailyRevenue: [],
    monthlyRevenue: [],
    productStats: [],
  });
  const [loading, setLoading] = useState(true);
  const [monthlyFilter, setMonthlyFilter] = useState<MonthlyRevenueFilter>('6m');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch products from all three tables (count all products regardless of status)
      const [womenResult, girlsResult, babiesResult] = await Promise.all([
        supabase.from('women_products').select('productId, cost, material, status'),
        supabase.from('girls_products').select('productId, cost, material, status'),
        supabase.from('babies_products').select('productId, cost, material, status'),
      ]);

      // Combine all products and add category based on table name
      const allProducts = [
        ...(womenResult.data || []).map(p => ({ ...p, category: 'Women' })),
        ...(girlsResult.data || []).map(p => ({ ...p, category: 'Girls' })),
        ...(babiesResult.data || []).map(p => ({ ...p, category: 'Babies' })),
      ];

      console.log('Fetched products:', {
        women: womenResult.data?.length || 0,
        girls: girlsResult.data?.length || 0,
        babies: babiesResult.data?.length || 0,
        total: allProducts.length
      });

      if (womenResult.error) {
        console.error('Women products error:', womenResult.error);
      }
      if (girlsResult.error) {
        console.error('Girls products error:', girlsResult.error);
      }
      if (babiesResult.error) {
        console.error('Babies products error:', babiesResult.error);
      }

      // Fetch orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, created_at, order_status, product_id, quantity')
        .eq('payment_status', 'completed');

      if (ordersError) {
        console.error('Orders error:', ordersError);
        // Continue even if orders fetch fails
      }

      // Use allProducts instead of products variable
      const products = allProducts;

      // Calculate total products
      const totalProducts = products?.length || 0;

      // Calculate total orders and revenue
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Group products by category
      const categoryMap = new Map<string, number>();
      products?.forEach((product) => {
        const category = product.category || 'Uncategorized';
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      });

      const productStats = Array.from(categoryMap.entries()).map(([category, count]) => ({
        category,
        products: count,
      }));

      console.log('Product Stats:', productStats);
      console.log('Total Products:', totalProducts);

      // Calculate revenue by category - match orders with products
      const categoryRevenueMap = new Map<string, { count: number; value: number }>();
      
      // Create a map of product IDs to categories for quick lookup (use already fetched data)
      const productCategoryMap = new Map<string, string>();
      
      // Build category map from already fetched products
      allProducts.forEach(product => {
        if (product.productId) {
          productCategoryMap.set(product.productId, product.category);
        }
      });

      console.log('Product Category Map size:', productCategoryMap.size);

      orders?.forEach((order) => {
        // Get category from product ID
        const category = productCategoryMap.get(order.product_id) || 'Other';
        const current = categoryRevenueMap.get(category) || { count: 0, value: 0 };
        categoryRevenueMap.set(category, {
          count: current.count + 1,
          value: current.value + Number(order.total_amount),
        });
      });

      console.log('Orders by category:', Array.from(categoryRevenueMap.entries()));

      const categoriesData = Array.from(categoryRevenueMap.entries()).map(([name, data]) => ({
        name,
        count: data.count,
        value: data.value,
      }));

      console.log('Revenue by Category:', categoriesData);

      // Calculate daily revenue (last 30 days)
      const dailyRevenueMap = new Map<string, { revenue: number; orders: number }>();
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      orders?.forEach((order) => {
        const orderDate = new Date(order.created_at);
        if (orderDate >= last30Days) {
          const dateKey = orderDate.toISOString().split('T')[0];
          const current = dailyRevenueMap.get(dateKey) || { revenue: 0, orders: 0 };
          dailyRevenueMap.set(dateKey, {
            revenue: current.revenue + Number(order.total_amount),
            orders: current.orders + 1,
          });
        }
      });

      const dailyRevenue = Array.from(dailyRevenueMap.entries())
        .map(([date, data]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: data.revenue,
          orders: data.orders,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-14); // Last 14 days

      // Add sample data if no daily revenue
      const finalDailyRevenue = dailyRevenue.length > 0 ? dailyRevenue : [
        { date: 'No Data', revenue: 0, orders: 0 }
      ];

      // Calculate monthly revenue (last 6 months)
      const monthlyRevenueMap = new Map<string, number>();
      orders?.forEach((order) => {
        const orderDate = new Date(order.created_at);
        const monthKey = orderDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyRevenueMap.set(
          monthKey,
          (monthlyRevenueMap.get(monthKey) || 0) + Number(order.total_amount)
        );
      });

      // Generate a full list of months for the last 12 months to ensure continuity
      const allMonths = [];
      const today = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        allMonths.push(d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      }

      // Merge real data with the full list of months
      const mergedMonthlyData = allMonths.map(monthStr => ({
        month: monthStr,
        revenue: monthlyRevenueMap.get(monthStr) || 0,
      }));

      let monthlyRevenue;
      switch (monthlyFilter) {
        case '12m':
          monthlyRevenue = mergedMonthlyData;
          break;
        case 'all':
          // For 'all', we use the original map to show all months with data
          monthlyRevenue = Array.from(monthlyRevenueMap.entries())
            .map(([month, revenue]) => ({ month, revenue }))
            .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
          break;
        case '6m':
        default:
          monthlyRevenue = mergedMonthlyData.slice(-6);
          break;
      }

      // Add sample data if no monthly revenue
      const finalMonthlyRevenue = monthlyRevenue.length > 0 ? monthlyRevenue : [
        { month: 'No Data', revenue: 0 }
      ];

      // Add sample data for product stats if empty
      const finalProductStats = productStats.length > 0 ? productStats : [
        { category: 'No Products', products: 0 }
      ];

      setAnalytics({
        totalProducts,
        totalOrders,
        totalRevenue,
        averageOrderValue,
        categoriesData: categoriesData.length > 0 ? categoriesData : [{ name: 'No Data', count: 0, value: 0 }],
        dailyRevenue: finalDailyRevenue,
        monthlyRevenue: finalMonthlyRevenue,
        productStats: finalProductStats,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Unable to load analytics. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [monthlyFilter]);

  const chartConfig = {
    revenue: {
      label: 'Revenue',
      color: '#000000',
    },
    orders: {
      label: 'Orders',
      color: '#737373',
    },
    products: {
      label: 'Products',
      color: '#404040',
    },
  } satisfies ChartConfig;

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
              Analytics Dashboard
            </h1>
          </div>
          <Button onClick={fetchAnalytics} variant="outline" size="sm" disabled={loading}>
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading analytics...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Info Alert when no orders */}
            {analytics.totalOrders === 0 && (
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 dark:text-blue-400">
                      <Package size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                        No Order Data Yet
                      </h3>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Analytics will display once customers complete orders. Make sure you've:
                      </p>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 ml-4 list-disc">
                        <li>Created the orders table in Supabase (run <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">database/create-orders-table.sql</code>)</li>
                        <li>Set up admin access policies (run <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">database/add-admin-orders-policy.sql</code>)</li>
                        <li>Logged in with a Supabase account that has admin access</li>
                        <li>Completed at least one test order with payment</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{analytics.totalRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">From completed orders</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">Completed orders</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalProducts}</div>
                  <p className="text-xs text-muted-foreground">Products in catalog</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{analytics.averageOrderValue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Per order</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Orders by Category - Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Orders by Category</CardTitle>
                  <CardDescription>Total number of orders for each category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart data={analytics.categoriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {analytics.categoriesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Revenue Distribution - Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Distribution by Category</CardTitle>
                  <CardDescription>Revenue breakdown by product category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <PieChart>
                      <Pie
                        data={analytics.categoriesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent, value }) => `${name}: ₹${value.toFixed(0)} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.categoriesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                  {analytics.categoriesData.length > 0 && analytics.categoriesData[0].name !== 'No Data' && (
                    <div className="mt-4 space-y-2">
                      {analytics.categoriesData.map((category, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span>{category.name}</span>
                          </div>
                          <span className="font-medium">{category.count} orders</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Revenue - Line Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar size={20} />
                    Daily Revenue (Last 14 Days)
                  </CardTitle>
                  <CardDescription>Revenue trend over the past two weeks</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <LineChart data={analytics.dailyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Daily Orders - Area Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart size={20} />
                    Daily Orders (Last 14 Days)
                  </CardTitle>
                  <CardDescription>Number of orders per day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <AreaChart data={analytics.dailyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="orders"
                        stroke="#3b82f6"
                        fill="#dbeafe"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Revenue - Full Width */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>Monthly Revenue Trend</CardTitle>
                    <CardDescription>Revenue performance over time</CardDescription>
                  </div>
                  <Select value={monthlyFilter} onValueChange={(val) => setMonthlyFilter(val as MonthlyRevenueFilter)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6m">Last 6 Months</SelectItem>
                      <SelectItem value="12m">Last 12 Months</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[350px] w-full">
                  <BarChart data={analytics.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default ViewAnalysis;
