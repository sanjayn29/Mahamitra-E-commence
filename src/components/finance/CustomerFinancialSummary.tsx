import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Pie, PieChart, Cell, XAxis, YAxis } from 'recharts';
import { Wallet, TrendingUp, Receipt, RotateCcw, CreditCard, BadgeIndianRupee } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { financeService, CustomerFinancialSummary as CustomerFinancialSummaryData } from '@/services/financeService';
import { toast } from 'sonner';

const CHART_COLORS = ['#111827', '#e11d48', '#0f766e', '#d97706', '#2563eb'];

const currency = (amount: number) => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

interface CustomerFinancialSummaryProps {
  userId: string;
}

const CustomerFinancialSummary = ({ userId }: CustomerFinancialSummaryProps) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<CustomerFinancialSummaryData | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSummary = async () => {
      try {
        setLoading(true);
        const data = await financeService.getCustomerFinancialSummary(userId);
        if (isMounted) {
          setSummary(data);
        }
      } catch (error) {
        console.error('Failed to load customer financial summary:', error);
        toast.error('Unable to load financial summary');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const chartConfig = {
    spending: { label: 'Spending', color: '#111827' },
    amount: { label: 'Amount', color: '#e11d48' },
  } satisfies ChartConfig;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
          <CardDescription>Loading spending insights...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BadgeIndianRupee size={20} /> Financial Summary
        </CardTitle>
        <CardDescription>Track how much you have spent, refunded, and paid over time.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Money Spent</span>
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold">{currency(summary.totalSpent)}</div>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Average Order Value</span>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold">{currency(summary.averageOrderValue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                High {currency(summary.highestOrderValue)} · Low {currency(summary.lowestOrderValue)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Refund Tracking</span>
                <RotateCcw className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold">{currency(summary.totalRefundedAmount)}</div>
              <p className="text-xs text-muted-foreground mt-1">{summary.refundedOrders} refunded orders</p>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Wallet Balance</span>
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold">{currency(summary.walletBalance)}</div>
              <p className="text-xs text-muted-foreground mt-1">Reserved for future credits and refunds</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Spending Analytics</CardTitle>
              <CardDescription>Spending grouped by month</CardDescription>
            </CardHeader>
            <CardContent>
              {summary.monthlySpending.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">No completed payments yet.</p>
              ) : (
                <ChartContainer config={chartConfig} className="h-[280px] w-full">
                  <BarChart data={summary.monthlySpending}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="totalSpent" fill="var(--color-spending)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product Spending Breakdown</CardTitle>
              <CardDescription>How your spending is distributed across categories</CardDescription>
            </CardHeader>
            <CardContent>
              {summary.categoryBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">Category insights will appear after completed orders.</p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr,180px] gap-4 items-center">
                  <ChartContainer config={chartConfig} className="h-[240px] w-full">
                    <PieChart>
                      <Pie data={summary.categoryBreakdown} dataKey="totalSpent" nameKey="category" outerRadius={88} label>
                        {summary.categoryBreakdown.map((entry, index) => (
                          <Cell key={entry.category} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                  <div className="space-y-2">
                    {summary.categoryBreakdown.map((entry, index) => (
                      <div key={entry.category} className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                          <span>{entry.category}</span>
                        </div>
                        <span className="font-medium">{currency(entry.totalSpent)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt size={18} /> Order Payment History
            </CardTitle>
            <CardDescription>Date, order reference, amount, and status</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.paymentHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No payment history yet.</p>
            ) : (
              <div className="max-h-[320px] overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.paymentHistory.map((entry) => (
                      <TableRow key={`${entry.orderId}-${entry.date}`}>
                        <TableCell>{new Date(entry.date).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell className="font-mono text-xs">{entry.orderId}</TableCell>
                        <TableCell className="font-medium">{currency(entry.amount)}</TableCell>
                        <TableCell>{entry.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default CustomerFinancialSummary;