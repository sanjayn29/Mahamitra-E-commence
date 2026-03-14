import { supabase } from '@/lib/supabaseClient';

type ProductCategory = 'women' | 'girls' | 'babies';

const normalizeCategory = (category: ProductCategory | string | null | undefined): ProductCategory => {
  switch (String(category || '').toLowerCase()) {
    case 'women':
      return 'women';
    case 'girls':
      return 'girls';
    case 'babies':
    case 'baies':
    case 'baby':
      return 'babies';
    default:
      return 'girls';
  }
};

const normalizeProductId = (productId: string | null | undefined) => String(productId || '').trim().toUpperCase();

const inferCategoryFromProductId = (productId: string | null | undefined): ProductCategory | null => {
  const normalizedId = normalizeProductId(productId);

  if (!normalizedId) {
    return null;
  }

  if (normalizedId.includes('BAB')) {
    return 'babies';
  }

  if (normalizedId.includes('WOM')) {
    return 'women';
  }

  if (normalizedId.includes('GIR')) {
    return 'girls';
  }

  return null;
};

const resolveCategory = (
  productId: string,
  baseProductMap: Map<string, BaseProductRow>
): ProductCategory => {
  const normalizedId = normalizeProductId(productId);
  const baseCategory = baseProductMap.get(normalizedId)?.category;

  if (baseCategory) {
    return normalizeCategory(baseCategory);
  }

  return inferCategoryFromProductId(productId) || 'girls';
};

interface OrderRow {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  total_amount: number;
  quantity: number;
  payment_id: string | null;
  payment_status: string;
  order_status: string;
  created_at: string;
}

interface ProductCatalogRow {
  product_public_id: string;
  category: 'women' | 'girls' | 'babies';
}

interface BaseProductRow {
  productId: string;
  name: string;
  cost: number;
  category: ProductCategory;
}

interface VariantRow {
  product_public_id: string;
  stock_quantity: number;
  price_override: number | null;
}

interface GroupedOrder {
  key: string;
  createdAt: string;
  amount: number;
  userId: string;
  paymentStatus: string;
  orderStatus: string;
}

export interface CustomerFinanceLedgerEntry {
  date: string;
  orderId: string;
  amount: number;
  status: string;
}

export interface CustomerFinancialSummary {
  totalSpent: number;
  monthlySpending: { month: string; totalSpent: number }[];
  averageOrderValue: number;
  highestOrderValue: number;
  lowestOrderValue: number;
  categoryBreakdown: { category: string; totalSpent: number }[];
  walletBalance: number;
  totalRefundedAmount: number;
  refundedOrders: number;
  paymentHistory: CustomerFinanceLedgerEntry[];
}

export interface AdminFinancialAnalytics {
  totalRevenue: number;
  monthlyRevenue: { month: string; revenue: number }[];
  dailySales: { date: string; orders: number; revenue: number }[];
  topProducts: { productId: string; productName: string; unitsSold: number; revenue: number }[];
  revenueByCategory: { category: string; revenue: number }[];
  averageOrderValue: number;
  inventoryValue: number;
  pendingOrdersValue: number;
  totalRefundedAmount: number;
  refundedOrders: number;
  refundPercentage: number;
  customerLifetimeValue: number;
}

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });
const dayFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

const toNumber = (value: unknown) => Number(value || 0);

const formatCategory = (category: ProductCategory | string) => {
  switch (normalizeCategory(category)) {
    case 'women':
      return 'Women';
    case 'girls':
      return 'Girls';
    case 'babies':
      return 'Babies';
    default:
      return 'Girls';
  }
};

const getOrderGroupKey = (order: OrderRow) => order.payment_id || order.id;

const getLedgerStatus = (paymentStatus: string, orderStatus: string) => {
  if (paymentStatus === 'refunded') {
    return 'Refunded';
  }

  if (paymentStatus === 'failed') {
    return 'Payment Failed';
  }

  if (paymentStatus === 'pending') {
    return 'Payment Pending';
  }

  return orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1);
};

const sortByMonth = <T extends { rawDate: Date }>(rows: T[]) => rows.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

const buildMonthlySeries = (orders: OrderRow[], amountSelector: (order: OrderRow) => number) => {
  const monthMap = new Map<string, { rawDate: Date; total: number }>();

  orders.forEach((order) => {
    const orderDate = new Date(order.created_at);
    const monthStart = new Date(orderDate.getFullYear(), orderDate.getMonth(), 1);
    const monthKey = monthStart.toISOString();
    const current = monthMap.get(monthKey) || { rawDate: monthStart, total: 0 };
    current.total += amountSelector(order);
    monthMap.set(monthKey, current);
  });

  return sortByMonth(
    Array.from(monthMap.values()).map((entry) => ({
      month: monthFormatter.format(entry.rawDate),
      rawDate: entry.rawDate,
      total: entry.total,
    }))
  );
};

const groupOrders = (orders: OrderRow[]) => {
  const grouped = new Map<string, GroupedOrder>();

  orders.forEach((order) => {
    const key = getOrderGroupKey(order);
    const existing = grouped.get(key);

    if (existing) {
      existing.amount += toNumber(order.total_amount);
      if (new Date(order.created_at).getTime() > new Date(existing.createdAt).getTime()) {
        existing.createdAt = order.created_at;
        existing.paymentStatus = order.payment_status;
        existing.orderStatus = order.order_status;
      }
      return;
    }

    grouped.set(key, {
      key,
      createdAt: order.created_at,
      amount: toNumber(order.total_amount),
      userId: order.user_id,
      paymentStatus: order.payment_status,
      orderStatus: order.order_status,
    });
  });

  return Array.from(grouped.values());
};

const fetchBaseProducts = async () => {
  const [womenRes, girlsRes, babiesRes, catalogRes] = await Promise.all([
    supabase.from('women_products').select('productId, name, cost'),
    supabase.from('girls_products').select('productId, name, cost'),
    supabase.from('babies_products').select('productId, name, cost'),
    supabase.from('products').select('product_public_id, category'),
  ]);

  if (womenRes.error) throw womenRes.error;
  if (girlsRes.error) throw girlsRes.error;
  if (babiesRes.error) throw babiesRes.error;
  if (catalogRes.error) throw catalogRes.error;

  const catalogMap = new Map((catalogRes.data || []).map((row: ProductCatalogRow) => [row.product_public_id, row.category]));

  const mergedRows: BaseProductRow[] = [
    ...((womenRes.data || []).map((row: any) => ({ ...row, category: 'women' as ProductCategory }))),
    ...((girlsRes.data || []).map((row: any) => ({ ...row, category: 'girls' as ProductCategory }))),
    ...((babiesRes.data || []).map((row: any) => ({ ...row, category: 'babies' as ProductCategory }))),
  ];

  const baseProductMap = new Map<string, BaseProductRow>();

  mergedRows.forEach((row) => {
    baseProductMap.set(normalizeProductId(row.productId), {
      productId: row.productId,
      name: row.name,
      cost: toNumber(row.cost),
      category: normalizeCategory(catalogMap.get(row.productId) || row.category),
    });
  });

  return { baseProductMap, catalogMap };
};

const fetchOrders = async (userId?: string) => {
  let query = supabase
    .from('orders')
    .select('id, user_id, product_id, product_name, total_amount, quantity, payment_id, payment_status, order_status, created_at')
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((row: any) => ({
    ...row,
    total_amount: toNumber(row.total_amount),
    quantity: toNumber(row.quantity),
  })) as OrderRow[];
};

export const financeService = {
  async getCustomerFinancialSummary(userId: string): Promise<CustomerFinancialSummary> {
    const [{ baseProductMap }, orders, profileRes] = await Promise.all([
      fetchBaseProducts(),
      fetchOrders(userId),
      supabase.from('profiles').select('wallet_balance').eq('id', userId).maybeSingle(),
    ]);

    if (profileRes.error) {
      throw profileRes.error;
    }

    const completedOrders = orders.filter((order) => order.payment_status === 'completed');
    const refundedOrders = orders.filter((order) => order.payment_status === 'refunded');
    const completedGroups = groupOrders(completedOrders);
    const refundedGroups = groupOrders(refundedOrders);

    const totalSpent = completedOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const monthlySpending = buildMonthlySeries(completedOrders, (order) => order.total_amount).map((entry) => ({
      month: entry.month,
      totalSpent: entry.total,
    }));

    const groupedValues = completedGroups.map((group) => group.amount);
    const averageOrderValue = groupedValues.length > 0
      ? groupedValues.reduce((sum, value) => sum + value, 0) / groupedValues.length
      : 0;

    const categoryTotals = new Map<string, number>();
    completedOrders.forEach((order) => {
      const category = formatCategory(resolveCategory(order.product_id, baseProductMap));
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + order.total_amount);
    });

    const paymentHistory = groupOrders(orders)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((group) => ({
        date: group.createdAt,
        orderId: group.key,
        amount: group.amount,
        status: getLedgerStatus(group.paymentStatus, group.orderStatus),
      }));

    return {
      totalSpent,
      monthlySpending,
      averageOrderValue,
      highestOrderValue: groupedValues.length > 0 ? Math.max(...groupedValues) : 0,
      lowestOrderValue: groupedValues.length > 0 ? Math.min(...groupedValues) : 0,
      categoryBreakdown: Array.from(categoryTotals.entries())
        .map(([category, total]) => ({ category, totalSpent: total }))
        .sort((a, b) => b.totalSpent - a.totalSpent),
      walletBalance: toNumber(profileRes.data?.wallet_balance),
      totalRefundedAmount: refundedOrders.reduce((sum, order) => sum + order.total_amount, 0),
      refundedOrders: refundedGroups.length,
      paymentHistory,
    };
  },

  async getAdminFinancialAnalytics(): Promise<AdminFinancialAnalytics> {
    const [{ baseProductMap }, orders, variantsRes] = await Promise.all([
      fetchBaseProducts(),
      fetchOrders(),
      supabase.from('product_variants').select('product_public_id, stock_quantity, price_override'),
    ]);

    if (variantsRes.error) {
      throw variantsRes.error;
    }

    const completedOrders = orders.filter((order) => order.payment_status === 'completed');
    const refundedRows = orders.filter((order) => order.payment_status === 'refunded');
    const completedGroups = groupOrders(completedOrders);
    const refundedGroups = groupOrders(refundedRows);

    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const monthlyRevenue = buildMonthlySeries(completedOrders, (order) => order.total_amount).map((entry) => ({
      month: entry.month,
      revenue: entry.total,
    }));

    const dailyMap = new Map<string, { rawDate: Date; orders: number; revenue: number }>();
    completedGroups.forEach((group) => {
      const orderDate = new Date(group.createdAt);
      const dayStart = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
      const key = dayStart.toISOString();
      const current = dailyMap.get(key) || { rawDate: dayStart, orders: 0, revenue: 0 };
      current.orders += 1;
      current.revenue += group.amount;
      dailyMap.set(key, current);
    });

    const dailySales = sortByMonth(
      Array.from(dailyMap.values()).map((entry) => ({
        rawDate: entry.rawDate,
        date: dayFormatter.format(entry.rawDate),
        orders: entry.orders,
        revenue: entry.revenue,
      }))
    ).slice(-14).map(({ date, orders, revenue }) => ({ date, orders, revenue }));

    const topProductsMap = new Map<string, { productId: string; productName: string; unitsSold: number; revenue: number }>();
    completedOrders.forEach((order) => {
      const current = topProductsMap.get(order.product_id) || {
        productId: order.product_id,
        productName: order.product_name,
        unitsSold: 0,
        revenue: 0,
      };
      current.unitsSold += order.quantity;
      current.revenue += order.total_amount;
      topProductsMap.set(order.product_id, current);
    });

    const revenueByCategoryMap = new Map<string, number>();
    completedOrders.forEach((order) => {
      const category = formatCategory(resolveCategory(order.product_id, baseProductMap));
      revenueByCategoryMap.set(category, (revenueByCategoryMap.get(category) || 0) + order.total_amount);
    });

    const groupedValues = completedGroups.map((group) => group.amount);
    const averageOrderValue = groupedValues.length > 0
      ? groupedValues.reduce((sum, value) => sum + value, 0) / groupedValues.length
      : 0;

    const variantRows = (variantsRes.data || []) as VariantRow[];
    const inventoryValue = variantRows.reduce((sum, variant) => {
      const baseProduct = baseProductMap.get(normalizeProductId(variant.product_public_id));
      const effectivePrice = variant.price_override ?? baseProduct?.cost ?? 0;
      return sum + toNumber(variant.stock_quantity) * toNumber(effectivePrice);
    }, 0);

    const pendingOrdersValue = orders
      .filter((order) => order.payment_status === 'completed' && ['pending', 'confirmed', 'processing', 'shipped'].includes(order.order_status))
      .reduce((sum, order) => sum + order.total_amount, 0);

    const grossAmount = orders
      .filter((order) => ['completed', 'refunded'].includes(order.payment_status))
      .reduce((sum, order) => sum + order.total_amount, 0);

    const refundedAmount = refundedRows.reduce((sum, order) => sum + order.total_amount, 0);
    const customerTotals = new Map<string, number>();
    completedGroups.forEach((group) => {
      customerTotals.set(group.userId, (customerTotals.get(group.userId) || 0) + group.amount);
    });

    const customerLifetimeValue = customerTotals.size > 0
      ? Array.from(customerTotals.values()).reduce((sum, value) => sum + value, 0) / customerTotals.size
      : 0;

    return {
      totalRevenue,
      monthlyRevenue,
      dailySales,
      topProducts: Array.from(topProductsMap.values())
        .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue)
        .slice(0, 10),
      revenueByCategory: Array.from(revenueByCategoryMap.entries())
        .map(([category, revenue]) => ({ category, revenue }))
        .sort((a, b) => b.revenue - a.revenue),
      averageOrderValue,
      inventoryValue,
      pendingOrdersValue,
      totalRefundedAmount: refundedAmount,
      refundedOrders: refundedGroups.length,
      refundPercentage: grossAmount > 0 ? (refundedAmount / grossAmount) * 100 : 0,
      customerLifetimeValue,
    };
  },
};