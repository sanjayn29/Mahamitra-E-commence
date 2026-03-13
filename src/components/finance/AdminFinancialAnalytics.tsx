import { useEffect, useState } from 'react';
import { ArrowRight, BadgeIndianRupee, ChartNoAxesCombined, Package2, RotateCcw, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { financeService, AdminFinancialAnalytics as AdminFinancialAnalyticsData } from '@/services/financeService';
import { toast } from 'sonner';

const COLORS = ['#111827', '#e11d48', '#0f766e', '#d97706', '#2563eb'];

const currency = (amount: number) => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

interface AdminFinancialAnalyticsProps {
  mode?: 'dashboard' | 'full';
}

const AdminFinancialAnalytics = ({ mode = 'dashboard' }: AdminFinancialAnalyticsProps) => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AdminFinancialAnalyticsData | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const data = await financeService.getAdminFinancialAnalytics();
        if (isMounted) {
          setAnalytics(data);
        }
      } catch (error) {
        console.error('Failed to load admin finance analytics:', error);
        toast.error('Unable to load finance analytics');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, []);

  const chartConfig = {
    revenue: { label: 'Revenue', color: '#111827' },
    orders: { label: 'Orders', color: '#e11d48' },
  } satisfies ChartConfig;

  const showExtended = mode === 'full';

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Analytics</CardTitle>
          <CardDescription>Loading finance metrics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold">Financial Analytics</h2>
          <p className="text-sm text-muted-foreground">Revenue, refunds, inventory value, and customer lifetime trends.</p>
        </div>
        {!showExtended && (
          <Button asChild variant="outline">
            <Link to="/admin/analytics">
              View full analytics <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Revenue</span>
              <BadgeIndianRupee className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold">{currency(analytics.totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Average Order Value</span>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold">{currency(analytics.averageOrderValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Customer Lifetime Value</span>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold">{currency(analytics.customerLifetimeValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Refunds</span>
              <RotateCcw className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold">{currency(analytics.totalRefundedAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">{analytics.refundedOrders} orders · {analytics.refundPercentage.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {showExtended && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Inventory Value</span>
                <Package2 className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold">{currency(analytics.inventoryValue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Pending Orders Value</span>
                <ChartNoAxesCombined className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold">{currency(analytics.pendingOrdersValue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Top Revenue Category</span>
                <BadgeIndianRupee className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold">
                {analytics.revenueByCategory[0]?.category || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.revenueByCategory[0] ? currency(analytics.revenueByCategory[0].revenue) : 'No revenue yet'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className={`grid grid-cols-1 ${showExtended ? 'xl:grid-cols-2' : 'xl:grid-cols-[1.6fr,1fr]'} gap-6`}>
        <Card>
          <CardHeader>
            <CardTitle>{showExtended ? 'Monthly Revenue' : 'Revenue Trend'}</CardTitle>
            <CardDescription>{showExtended ? 'Revenue grouped by month' : 'Recent monthly revenue performance'}</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.monthlyRevenue.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">No completed revenue yet.</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={analytics.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Top 10 products ranked by units sold</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">No product sales yet.</p>
            ) : (
              <div className="space-y-3">
                {analytics.topProducts.slice(0, showExtended ? 10 : 5).map((product, index) => (
                  <div key={product.productId} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{index + 1}. {product.productName}</p>
                      <p className="text-xs text-muted-foreground">{product.productId}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{product.unitsSold} sold</p>
                      <p className="text-xs text-muted-foreground">{currency(product.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showExtended && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Sales</CardTitle>
                <CardDescription>Orders and revenue over the last 14 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[320px] w-full">
                  <ComposedChart data={analytics.dailySales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar yAxisId="left" dataKey="orders" fill="var(--color-orders)" radius={[8, 8, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} />
                  </ComposedChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
                <CardDescription>Business revenue across product lines</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.revenueByCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-10 text-center">No category revenue yet.</p>
                ) : (
                  <ChartContainer config={chartConfig} className="h-[320px] w-full">
                    <BarChart data={analytics.revenueByCategory} layout="vertical" margin={{ left: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="category" width={80} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="revenue" radius={[0, 8, 8, 0]}>
                        {analytics.revenueByCategory.map((row, index) => (
                          <Cell key={row.category} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Finance Detail Table</CardTitle>
              <CardDescription>Quick view of top products and revenue distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Units Sold</TableHead>
                      <TableHead>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.topProducts.map((product) => (
                      <TableRow key={product.productId}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.productName}</p>
                            <p className="text-xs text-muted-foreground font-mono">{product.productId}</p>
                          </div>
                        </TableCell>
                        <TableCell>{product.unitsSold}</TableCell>
                        <TableCell>{currency(product.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminFinancialAnalytics;